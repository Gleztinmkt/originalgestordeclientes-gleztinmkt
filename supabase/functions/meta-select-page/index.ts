import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const FB_VER = "v25.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { client_id, page_id } = await req.json();
    if (!client_id || !page_id) return new Response(JSON.stringify({ error: "params" }), { status: 400, headers: corsHeaders });

    const { data: conn } = await admin.from("social_connections").select("*").eq("client_id", client_id).maybeSingle();
    if (!conn?.user_access_token_encrypted) {
      return new Response(JSON.stringify({ error: "no token" }), { status: 400, headers: corsHeaders });
    }

    // Fetch the specific page details
    const pageResp = await fetch(
      `https://graph.facebook.com/${FB_VER}/${page_id}?fields=id,name,access_token,instagram_business_account&access_token=${conn.user_access_token_encrypted}`,
    ).then(r => r.json());

    if (!pageResp.access_token) {
      return new Response(JSON.stringify({ error: "page fetch failed", details: pageResp }), { status: 400, headers: corsHeaders });
    }

    let igUsername = null;
    if (pageResp.instagram_business_account?.id) {
      const igResp = await fetch(
        `https://graph.facebook.com/${FB_VER}/${pageResp.instagram_business_account.id}?fields=username&access_token=${pageResp.access_token}`,
      ).then(r => r.json());
      igUsername = igResp.username || null;
    }

    await admin.from("social_connections").update({
      facebook_page_id: pageResp.id,
      facebook_page_name: pageResp.name,
      facebook_page_access_token_encrypted: pageResp.access_token,
      instagram_business_account_id: pageResp.instagram_business_account?.id || null,
      instagram_username: igUsername,
      status: "connected",
      last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("client_id", client_id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
