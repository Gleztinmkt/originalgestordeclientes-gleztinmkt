import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const ALLOWED_MIMES = ["image/jpeg", "image/png", "video/mp4"];
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "video/mp4": "mp4",
};

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { publication_id, drive_url, drive_file_id } = await req.json();
    if (!publication_id) {
      return new Response(JSON.stringify({ error: "publication_id required" }), { status: 400, headers: corsHeaders });
    }

    const fileId = drive_file_id || extractDriveFileId(drive_url || "");
    if (!fileId) {
      return new Response(JSON.stringify({ error: "Falta el ID del archivo de Drive" }), { status: 400, headers: corsHeaders });
    }

    let bytes: Uint8Array | null = null;
    let contentType = "";
    let fileName = "";
    let fileSize = 0;

    // Try connector (authenticated) first
    if (LOVABLE_API_KEY && GOOGLE_DRIVE_API_KEY) {
      const metaRes = await fetch(
        `${GATEWAY_URL}/files/${fileId}?fields=id,name,mimeType,size&supportsAllDrives=true`,
        {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
          },
        }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        contentType = meta.mimeType || "";
        fileName = meta.name || "";
        fileSize = parseInt(meta.size || "0", 10);

        if (!ALLOWED_MIMES.includes(contentType)) {
          return new Response(
            JSON.stringify({
              error: `Formato no compatible para Instagram/Facebook (${contentType || "desconocido"}). Usá JPG, PNG o MP4.`,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const dlRes = await fetch(
          `${GATEWAY_URL}/files/${fileId}?alt=media&supportsAllDrives=true`,
          {
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
            },
          }
        );
        if (!dlRes.ok) {
          const txt = await dlRes.text();
          return new Response(JSON.stringify({ error: `Drive download (${dlRes.status}): ${txt.slice(0, 300)}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        bytes = new Uint8Array(await dlRes.arrayBuffer());
      } else {
        const txt = await metaRes.text();
        console.error("Drive meta failed", metaRes.status, txt);
      }
    }

    // Fallback (legacy public link) — only if connector failed and a URL was passed
    if (!bytes && drive_url) {
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const fileResp = await fetch(downloadUrl, { redirect: "follow" });
      if (!fileResp.ok) {
        return new Response(JSON.stringify({ error: `Drive download fallback failed (${fileResp.status})` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      contentType = fileResp.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        return new Response(JSON.stringify({ error: "El archivo no es accesible. Usá el selector de Drive." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!ALLOWED_MIMES.includes(contentType)) {
        return new Response(JSON.stringify({
          error: `Formato no compatible (${contentType || "desconocido"}). Usá JPG, PNG o MP4.`,
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      bytes = new Uint8Array(await fileResp.arrayBuffer());
      fileSize = bytes.length;
    }

    if (!bytes) {
      return new Response(JSON.stringify({ error: "No se pudo descargar el archivo" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = EXT_BY_MIME[contentType] || "bin";
    const path = `${publication_id}/${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage.from("meta-publications").upload(path, bytes, {
      contentType, upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = admin.storage.from("meta-publications").getPublicUrl(path);
    const mediaUrl = pub.publicUrl;

    await admin.from("publications").update({
      drive_file_id: fileId,
      drive_file_url: drive_url || `https://drive.google.com/file/d/${fileId}/view`,
      drive_file_name: fileName || null,
      drive_file_mime_type: contentType,
      drive_file_size: fileSize || bytes.length,
      media_url: mediaUrl,
      media_storage_path: path,
      publish_status: "ready_to_publish",
      publish_error: null,
    }).eq("id", publication_id);

    return new Response(JSON.stringify({
      success: true, media_url: mediaUrl, mime_type: contentType, name: fileName, size: fileSize || bytes.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
