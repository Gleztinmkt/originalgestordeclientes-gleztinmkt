import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const m1 = url.match(/[?&]id=([^&]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/\/file\/d\/([^/?]+)/);
  if (m2) return m2[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const adminAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await adminAuth.auth.getUser(token);
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { publication_id, drive_url } = await req.json();
    if (!publication_id || !drive_url) {
      return new Response(JSON.stringify({ error: "params" }), { status: 400, headers: corsHeaders });
    }

    const fileId = extractDriveFileId(drive_url);
    if (!fileId) return new Response(JSON.stringify({ error: "Invalid Drive URL" }), { status: 400, headers: corsHeaders });

    // Download from Drive (file must be shared "anyone with link")
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const fileResp = await fetch(downloadUrl, { redirect: "follow" });
    if (!fileResp.ok) {
      return new Response(JSON.stringify({ error: `Drive download failed (${fileResp.status}). Verificá que el archivo esté compartido como "Cualquiera con el enlace".` }), { status: 400, headers: corsHeaders });
    }

    const contentType = fileResp.headers.get("content-type") || "application/octet-stream";
    const ext = contentType.includes("mp4") ? "mp4" : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const path = `${publication_id}/${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await fileResp.arrayBuffer());

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: upErr } = await admin.storage.from("meta-publications").upload(path, bytes, {
      contentType, upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = admin.storage.from("meta-publications").getPublicUrl(path);
    const mediaUrl = pub.publicUrl;

    await admin.from("publications").update({
      drive_file_id: fileId,
      drive_file_url: drive_url,
      media_url: mediaUrl,
      media_storage_path: path,
      publish_status: "ready_to_publish",
    }).eq("id", publication_id);

    return new Response(JSON.stringify({ success: true, media_url: mediaUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
