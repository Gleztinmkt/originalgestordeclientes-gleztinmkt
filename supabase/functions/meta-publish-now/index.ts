import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

type AdminClient = ReturnType<typeof createClient>;

const FB_VER = "v25.0";

// Crea un container IG (item)
async function igCreateContainer(igUserId: string, pageToken: string, opts: {
  mediaUrl: string;
  isVideo: boolean;
  caption?: string;
  isCarouselItem?: boolean;
  thumbOffset?: number | null;
}) {
  const url = `https://graph.facebook.com/${FB_VER}/${igUserId}/media`;
  const params = new URLSearchParams();
  if (opts.isVideo) {
    params.set("media_type", opts.isCarouselItem ? "VIDEO" : "REELS");
    params.set("video_url", opts.mediaUrl);
    if (typeof opts.thumbOffset === "number" && opts.thumbOffset >= 0) {
      // Meta espera milisegundos para thumb_offset
      params.set("thumb_offset", String(Math.floor(opts.thumbOffset) * 1000));
    }
  } else {
    params.set("image_url", opts.mediaUrl);
  }
  if (opts.isCarouselItem) params.set("is_carousel_item", "true");
  if (opts.caption !== undefined) params.set("caption", opts.caption);
  params.set("access_token", pageToken);
  const r = await fetch(url, { method: "POST", body: params }).then((x) => x.json());
  if (!r.id) throw new Error("IG create container failed: " + JSON.stringify(r));
  return r.id as string;
}

async function igWaitReady(containerId: string, pageToken: string) {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const s = await fetch(`https://graph.facebook.com/${FB_VER}/${containerId}?fields=status_code&access_token=${pageToken}`).then((r) => r.json());
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR") throw new Error("IG processing error: " + JSON.stringify(s));
  }
}

async function igPublish(igUserId: string, pageToken: string, containerId: string) {
  const url = `https://graph.facebook.com/${FB_VER}/${igUserId}/media_publish`;
  const p = new URLSearchParams();
  p.set("creation_id", containerId);
  p.set("access_token", pageToken);
  const r = await fetch(url, { method: "POST", body: p }).then((x) => x.json());
  if (!r.id) throw new Error("IG publish failed: " + JSON.stringify(r));
  return r.id as string;
}

async function publishToInstagramSingle(
  igUserId: string,
  pageToken: string,
  mediaUrl: string,
  caption: string,
  isVideo: boolean,
  thumbOffset?: number | null,
) {
  // Intento 1: con thumb_offset si fue provisto. Si Meta lo rechaza, reintento sin.
  try {
    const containerId = await igCreateContainer(igUserId, pageToken, { mediaUrl, isVideo, caption, thumbOffset });
    if (isVideo) await igWaitReady(containerId, pageToken);
    return await igPublish(igUserId, pageToken, containerId);
  } catch (e) {
    const msg = (e as Error)?.message || "";
    if (isVideo && typeof thumbOffset === "number" && /thumb/i.test(msg)) {
      console.warn("IG rechazó thumb_offset, reintentando sin él:", msg);
      const containerId = await igCreateContainer(igUserId, pageToken, { mediaUrl, isVideo, caption });
      await igWaitReady(containerId, pageToken);
      return await igPublish(igUserId, pageToken, containerId);
    }
    throw e;
  }
}

async function publishToInstagramCarousel(igUserId: string, pageToken: string, items: Array<{ mediaUrl: string; isVideo: boolean }>, caption: string) {
  const childIds: string[] = [];
  for (const it of items) {
    const cid = await igCreateContainer(igUserId, pageToken, { mediaUrl: it.mediaUrl, isVideo: it.isVideo, isCarouselItem: true });
    if (it.isVideo) await igWaitReady(cid, pageToken);
    childIds.push(cid);
  }
  // Crear el container CAROUSEL
  const url = `https://graph.facebook.com/${FB_VER}/${igUserId}/media`;
  const p = new URLSearchParams();
  p.set("media_type", "CAROUSEL");
  p.set("children", childIds.join(","));
  p.set("caption", caption || "");
  p.set("access_token", pageToken);
  const r = await fetch(url, { method: "POST", body: p }).then((x) => x.json());
  if (!r.id) throw new Error("IG carousel container failed: " + JSON.stringify(r));
  return await igPublish(igUserId, pageToken, r.id);
}

async function publishToFacebook(
  pageId: string,
  pageToken: string,
  mediaUrl: string,
  caption: string,
  isVideo: boolean,
  thumbOffset?: number | null,
) {
  if (isVideo) {
    const u = `https://graph.facebook.com/${FB_VER}/${pageId}/videos`;
    const p = new URLSearchParams();
    p.set("file_url", mediaUrl);
    p.set("description", caption || "");
    if (typeof thumbOffset === "number" && thumbOffset >= 0) {
      // FB Graph admite thumb_offset en milisegundos para /videos
      p.set("thumb_offset", String(Math.floor(thumbOffset) * 1000));
    }
    p.set("access_token", pageToken);
    const r = await fetch(u, { method: "POST", body: p }).then((r) => r.json());
    if (!r.id) throw new Error("FB video failed: " + JSON.stringify(r));
    return r.id;
  } else {
    const u = `https://graph.facebook.com/${FB_VER}/${pageId}/photos`;
    const p = new URLSearchParams();
    p.set("url", mediaUrl);
    p.set("caption", caption || "");
    p.set("access_token", pageToken);
    const r = await fetch(u, { method: "POST", body: p }).then((r) => r.json());
    if (!r.id) throw new Error("FB photo failed: " + JSON.stringify(r));
    return r.post_id || r.id;
  }
}

async function canManageMetaPublishing(admin: AdminClient, userId: string) {
  const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  const role = String(roleData?.role || "");
  return role === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    // Permitir invocación desde el cron interno con la service role key (no hay user JWT)
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isInternalCron = token === serviceKey;

    if (!isInternalCron) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!(await canManageMetaPublishing(admin, userData.user.id))) {
        return new Response(JSON.stringify({ error: "Solo administradores pueden publicar en Meta" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { publication_id } = await req.json();
    if (!publication_id) return new Response(JSON.stringify({ error: "params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: pub } = await admin.from("publications").select("*").eq("id", publication_id).maybeSingle();
    if (!pub) return new Response(JSON.stringify({ error: "publication not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const failPublication = async (message: string, status = 400) => {
      await admin.from("publications").update({ publish_status: "failed", publish_error: message }).eq("id", publication_id);
      return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    };

    const mediaItems: Array<{ media_url: string; drive_file_mime_type: string }> = Array.isArray(pub.media_items) && pub.media_items.length > 0
      ? pub.media_items
      : (pub.media_url ? [{ media_url: pub.media_url, drive_file_mime_type: pub.drive_file_mime_type || "" }] : []);

    if (mediaItems.length === 0) {
      return await failPublication("No hay archivo preparado. Subí uno desde Drive primero.");
    }

    const { data: conn } = await admin.from("social_connections").select("*").eq("client_id", pub.client_id).maybeSingle();
    if (!conn || conn.status !== "connected") {
      return await failPublication("Cliente sin conexión Meta activa");
    }
    if (!conn.facebook_page_access_token_encrypted) {
      return await failPublication("Falta token de página de Facebook. Reconectá Meta y elegí la página.");
    }

    await admin.from("publications").update({ publish_status: "publishing", publish_error: null }).eq("id", publication_id);

    const caption = pub.meta_caption || pub.copywriting || "";
    const result: { instagram_media_id?: string; facebook_post_id?: string } = {};
    const isCarousel = mediaItems.length > 1;
    const thumbOffset = typeof pub.cover_thumb_offset === "number" && pub.cover_thumb_offset >= 0
      ? pub.cover_thumb_offset
      : null;

    try {
      if (pub.publish_to_instagram) {
        if (!conn.instagram_business_account_id) throw new Error("Esta página no tiene cuenta de Instagram Business vinculada.");
        if (isCarousel) {
          result.instagram_media_id = await publishToInstagramCarousel(
            conn.instagram_business_account_id,
            conn.facebook_page_access_token_encrypted!,
            mediaItems.map((m) => ({
              mediaUrl: m.media_url,
              isVideo: (m.drive_file_mime_type || "").startsWith("video/") || /\.mp4(\?|$)/i.test(m.media_url),
            })),
            caption,
          );
        } else {
          const m = mediaItems[0];
          const isVideo = (m.drive_file_mime_type || "").startsWith("video/") || /\.mp4(\?|$)/i.test(m.media_url) || pub.type === "reel";
          result.instagram_media_id = await publishToInstagramSingle(
            conn.instagram_business_account_id,
            conn.facebook_page_access_token_encrypted!,
            m.media_url, caption, isVideo,
            isVideo ? thumbOffset : null,
          );
        }
      }
      if (pub.publish_to_facebook) {
        if (!conn.facebook_page_id) throw new Error("Falta facebook_page_id en la conexión.");
        // FB simple: publicar el primer archivo. (Carruseles FB requieren flujo separado)
        const m = mediaItems[0];
        const isVideo = (m.drive_file_mime_type || "").startsWith("video/") || /\.mp4(\?|$)/i.test(m.media_url);
        result.facebook_post_id = await publishToFacebook(
          conn.facebook_page_id,
          conn.facebook_page_access_token_encrypted!,
          m.media_url, caption, isVideo,
          isVideo ? thumbOffset : null,
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
      const msg = (e as Error)?.message || String(e);
      console.error("meta-publish-now error:", msg);
      await admin.from("publications").update({ publish_status: "failed", publish_error: msg }).eq("id", publication_id);
      return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    console.error("meta-publish-now outer:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
