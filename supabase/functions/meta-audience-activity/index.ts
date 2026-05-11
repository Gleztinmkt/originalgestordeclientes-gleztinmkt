import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const FB_VER = "v25.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { client_id, refresh } = await req.json();
    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id requerido" }), { status: 400, headers: corsHeaders });
    }

    // Cache check
    const { data: cached } = await admin
      .from("instagram_activity_insights")
      .select("*")
      .eq("client_id", client_id)
      .maybeSingle();

    const stale = !cached || (Date.now() - new Date(cached.fetched_at).getTime()) > 24 * 60 * 60 * 1000;
    if (cached && !refresh && !stale) {
      return new Response(JSON.stringify({ success: true, data: cached.data, fetched_at: cached.fetched_at, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch fresh
    const { data: conn } = await admin
      .from("social_connections")
      .select("*")
      .eq("client_id", client_id)
      .maybeSingle();

    if (!conn?.instagram_business_account_id || !conn?.facebook_page_access_token_encrypted) {
      return new Response(JSON.stringify({ error: "no_connection", message: "Instagram no conectado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const igId = conn.instagram_business_account_id;
    const pageToken = conn.facebook_page_access_token_encrypted;

    // online_followers: returns one entry per day (last 30) with value = { "0": n, "1": n, ... "23": n } in UTC
    // For weekday: we use each entry's end_time.
    const url = `https://graph.facebook.com/${FB_VER}/${igId}/insights?metric=online_followers&period=lifetime&access_token=${pageToken}`;
    const resp = await fetch(url).then(r => r.json());

    if (resp.error) {
      // No data or no permission
      return new Response(JSON.stringify({ error: "no_data", message: resp.error.message || "Sin datos" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const values: Array<{ end_time: string; value: Record<string, number> }> = resp.data?.[0]?.values || [];
    if (values.length === 0) {
      return new Response(JSON.stringify({ error: "no_data", message: "Sin datos suficientes" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate by weekday (0=Sun) x hour (0..23), averaged, in Argentina TZ (UTC-3)
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const v of values) {
      // end_time is the day; values are by UTC hour for the prior 24h
      // Shift hour by -3 (Argentina) and adjust day if hour wraps
      const day = new Date(v.end_time);
      for (let h = 0; h < 24; h++) {
        const count = Number(v.value?.[String(h)] ?? 0);
        // Convert UTC hour h on day -> Argentina local: localHour = h - 3
        let localH = h - 3;
        let dayShift = 0;
        if (localH < 0) { localH += 24; dayShift = -1; }
        const localDate = new Date(day.getTime() + dayShift * 86400000);
        const weekday = localDate.getUTCDay(); // 0..6
        grid[weekday][localH] += count;
        counts[weekday][localH] += 1;
      }
    }

    const avg: number[][] = grid.map((row, d) =>
      row.map((sum, h) => (counts[d][h] > 0 ? sum / counts[d][h] : 0))
    );

    const payload = { grid: avg };
    const now = new Date().toISOString();
    await admin.from("instagram_activity_insights").upsert({
      client_id,
      data: payload,
      fetched_at: now,
      updated_at: now,
    }, { onConflict: "client_id" });

    return new Response(JSON.stringify({ success: true, data: payload, fetched_at: now, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
