import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// This function is hit directly by Meta as a redirect (GET). It returns HTML that
// closes the popup or redirects back to the app with success/error info.
const APP_ID = Deno.env.get("META_APP_ID")!;
const APP_SECRET = Deno.env.get("META_APP_SECRET")!;
const REDIRECT_URI = Deno.env.get("META_REDIRECT_URI")!;
const APP_ORIGIN = "https://originalgestordeclientes-gleztinmkt.lovable.app";
const FB_VER = "v25.0";

function html(body: string, status = 200) {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Meta</title></head><body style="font-family:system-ui;padding:24px">${body}</body></html>`, {
    status, headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (error) return html(`<h2>Error de Meta</h2><p>${error}</p>`);
  if (!code || !state) return html("<h2>Faltan parámetros</h2>", 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: stateRow } = await admin.from("meta_oauth_states")
    .select("*").eq("state", state).maybeSingle();
  if (!stateRow) return html("<h2>State inválido o expirado</h2>", 400);

  // Limpiar state
  await admin.from("meta_oauth_states").delete().eq("state", state);

  try {
    // 1. Exchange code → user access token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", APP_ID);
    tokenUrl.searchParams.set("client_secret", APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    tokenUrl.searchParams.set("code", code);

    const tokenResp = await fetch(tokenUrl).then(r => r.json());
    if (!tokenResp.access_token) throw new Error("Token error: " + JSON.stringify(tokenResp));

    const userToken = tokenResp.access_token;

    // 2. Long-lived token
    const llUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    llUrl.searchParams.set("grant_type", "fb_exchange_token");
    llUrl.searchParams.set("client_id", APP_ID);
    llUrl.searchParams.set("client_secret", APP_SECRET);
    llUrl.searchParams.set("fb_exchange_token", userToken);
    const llResp = await fetch(llUrl).then(r => r.json());
    const longUserToken = llResp.access_token || userToken;
    const expiresIn = llResp.expires_in || 0;

    // 3. List pages
    const pagesResp = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longUserToken}`).then(r => r.json());
    const pages = pagesResp.data || [];

    // Save user token in a temp record (we'll finalize after page selection)
    const { data: existing } = await admin.from("social_connections")
      .select("id").eq("client_id", stateRow.client_id).maybeSingle();

    const payload = {
      client_id: stateRow.client_id,
      provider: "meta",
      user_access_token_encrypted: longUserToken,
      token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      status: "pending_page_selection",
      last_error: null,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      await admin.from("social_connections").update(payload).eq("id", existing.id);
    } else {
      await admin.from("social_connections").insert(payload);
    }

    // Auto-select if only one page
    if (pages.length === 1) {
      const p = pages[0];
      await admin.from("social_connections").update({
        facebook_page_id: p.id,
        facebook_page_name: p.name,
        facebook_page_access_token_encrypted: p.access_token,
        instagram_business_account_id: p.instagram_business_account?.id || null,
        status: "connected",
      }).eq("client_id", stateRow.client_id);
    }

    // Redirect back to app with state info
    const pagesParam = encodeURIComponent(JSON.stringify(pages.map((p: any) => ({
      id: p.id, name: p.name, ig: p.instagram_business_account?.id || null,
    }))));
    const redirect = `${APP_ORIGIN}/?meta_oauth=success&client_id=${stateRow.client_id}&pages=${pagesParam}`;

    return new Response(`<!doctype html><html><body><script>
      if (window.opener) {
        window.opener.postMessage({ type: 'meta_oauth_success', client_id: '${stateRow.client_id}', pages: ${JSON.stringify(pages.map((p:any)=>({id:p.id,name:p.name,ig:p.instagram_business_account?.id||null})))} }, '*');
        window.close();
      } else {
        window.location.href = ${JSON.stringify(redirect)};
      }
    </script><p>Conectado. Podés cerrar esta ventana.</p></body></html>`, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    await admin.from("social_connections").upsert({
      client_id: stateRow.client_id,
      status: "error",
      last_error: String(e),
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "client_id" });
    return html(`<h2>Error</h2><pre>${String(e)}</pre>`, 500);
  }
});
