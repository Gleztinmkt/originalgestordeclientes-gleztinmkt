import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

// Stub for V2: meant to be invoked by Supabase Cron every 5 minutes.
// It scans for scheduled publications past due and triggers meta-publish-now.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: due } = await admin.from("publications")
    .select("id")
    .eq("publish_status", "scheduled")
    .eq("auto_publish_enabled", true)
    .lte("scheduled_publish_at", new Date().toISOString())
    .limit(20);

  const results: any[] = [];
  for (const p of due ?? []) {
    try {
      const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-publish-now`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ publication_id: p.id }),
      }).then(r => r.json());
      results.push({ id: p.id, ok: !r.error, ...r });
    } catch (e) {
      results.push({ id: p.id, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
