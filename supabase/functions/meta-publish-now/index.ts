import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const FB_VER = "v25.0";

async function publishToInstagram(igUserId: string, pageToken: string, mediaUrl: string, caption: string, isVideo: boolean) {
  const createUrl = `https://graph.facebook.com/${FB_VER}/${igUserId}/media`;
  const params = new URLSearchParams();
  if (isVideo) {
    params.set("media_type", "REELS");
    params.set("video_url", mediaUrl);
  } else {
    params.set("image_url", mediaUrl);
  }
  params.set("caption", caption || "");
  params.set("access_token", pageToken);

  const createResp = await fetch(createUrl, { method: "POST", body: params }).then(r => r.json());
  if (!createResp.id) throw new Error("IG create container failed: " + JSON.stringify(createResp));
  const containerId = createResp.id;

  // For videos/reels, poll until ready
  if (isVideo) {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const status = await fetch(`https://graph.facebook.com/${FB_VER}/${containerId}?fields=status_code&access_token=${pageToken}`).then(r => r.json());
      if (status.status_code === "FINISHED") break;
      if (status.status_code === "ERROR") throw new Error("IG video processing error: " + JSON.stringify(status));
    }
  }

  const publishUrl = `https://graph.facebook.com/${FB_VER}/${igUserId}/media_publish`;
  const pubParams = new URLSearchParams();
  pubParams.set("creation_id", containerId);
  pubParams.set("access_token", pageToken);
  const pubResp = await fetch(publishUrl, { method: "POST", body: pubParams }).then(r => r.json());
  if (!pubResp.id) throw new Error("IG publish failed: " + JSON.stringify(pubResp));
  return pubResp.id;
}

async function publishToFacebook(pageId: string, pageToken: string, mediaUrl: string, caption: string, isVideo: boolean) {
  if (isVideo) {
    const u = `https://graph.facebook.com/${FB_VER}/${pageId}/videos`;
    const p = new URLSearchParams();
    p.set("file_url", mediaUrl);
    p.set("description", caption || "");
    p.set("access_token", pageToken);
    const r = await fetch(u, { method: "POST", body: p }).then(r => r.json());
    if (!r.id) throw new Error("FB video failed: " + JSON.stringify(r));
    return r.id;
  } else {
    const u = `https://graph.facebook.com/${FB_VER}/${pageId}/photos`;
    const p = new URLSearchParams();
    p.set("url", mediaUrl);
    p.set("caption", caption || "");
    p.set("access_token", pageToken);
    const r = await fetch(u, { method: "POST", body: p }).then(r => r.json());
    if (!r.id) throw new Error("FB photo failed: " + JSON.stringify(r));
    return r.post_id || r.id;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { publication_id } = await req.json();
    if (!publication_id) return new Response(JSON.stringify({ error: "params" }), { status: 400, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: pub } = await admin.from("publications").select("*").eq("id", publication_id).maybeSingle();
    if (!pub) return new Response(JSON.stringify({ error: "publication not found" }), { status: 404, headers: corsHeaders });
    if (!pub.media_url) return new Response(JSON.stringify({ error: "media_url missing. Run prepare-drive-media first." }), { status: 400, headers: corsHeaders });

    const { data: conn } = await admin.from("social_connections").select("*").eq("client_id", pub.client_id).maybeSingle();
    if (!conn || conn.status !== "connected") {
      return new Response(JSON.stringify({ error: "Cliente sin conexión Meta activa" }), { status: 400, headers: corsHeaders });
    }

    await admin.from("publications").update({ publish_status: "publishing", publish_error: null }).eq("id", publication_id);

    const isVideo = !!pub.media_url.match(/\.mp4(\?|$)/i) || pub.type === "reel";
    const caption = pub.meta_caption || pub.copywriting || "";
    const result: any = {};

    try {
      if (pub.publish_to_instagram && conn.instagram_business_account_id) {
        result.instagram_media_id = await publishToInstagram(
          conn.instagram_business_account_id,
          conn.facebook_page_access_token_encrypted!,
          pub.media_url, caption, isVideo,
        );
      }
      if (pub.publish_to_facebook && conn.facebook_page_id) {
        result.facebook_post_id = await publishToFacebook(
          conn.facebook_page_id,
          conn.facebook_page_access_token_encrypted!,
          pub.media_url, caption, isVideo,
        );
      }

      await admin.from("publications").update({
        publish_status: "published",
        published_at: new Date().toISOString(),
        instagram_media_id: result.instagram_media_id || null,
        facebook_post_id: result.facebook_post_id || null,
        publish_error: null,
      }).eq("id", publication_id);

      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      await admin.from("publications").update({
        publish_status: "failed",
        publish_error: String(e),
      }).eq("id", publication_id);
      throw e;
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
