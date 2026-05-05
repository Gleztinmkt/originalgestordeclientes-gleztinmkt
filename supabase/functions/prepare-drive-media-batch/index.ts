import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

type AdminClient = ReturnType<typeof createClient>;

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const ALLOWED_MIMES = ["image/jpeg", "image/png", "video/mp4"];
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "video/mp4": "mp4",
};

async function canManageMetaPublishing(admin: AdminClient, userId: string) {
  const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  const role = String(roleData?.role || "");
  return role === "admin";
}

interface MediaItem {
  drive_file_id: string;
  drive_file_name: string;
  drive_file_mime_type: string;
  drive_file_size: number;
  media_url: string;
  media_storage_path: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY) {
      return new Response(JSON.stringify({ error: "Drive connector not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!(await canManageMetaPublishing(admin, userData.user.id))) {
      return new Response(JSON.stringify({ error: "Solo administradores pueden preparar archivos para Meta" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { publication_id, files } = await req.json();
    if (!publication_id || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "publication_id y files[] requeridos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (files.length > 10) {
      return new Response(JSON.stringify({ error: "Máximo 10 archivos por carrusel" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const items: MediaItem[] = [];

    for (const f of files as Array<{ id: string; name?: string }>) {
      const fileId = f.id;

      const metaRes = await fetch(
        `${GATEWAY_URL}/files/${fileId}?fields=id,name,mimeType,size&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY } },
      );
      if (!metaRes.ok) {
        const t = await metaRes.text();
        throw new Error(`Drive meta ${metaRes.status}: ${t.slice(0, 200)}`);
      }
      const meta = await metaRes.json();
      const contentType = meta.mimeType || "";
      const fileName = meta.name || f.name || "file";
      const fileSize = parseInt(meta.size || "0", 10);

      if (!ALLOWED_MIMES.includes(contentType)) {
        throw new Error(`Formato no compatible (${contentType}) para "${fileName}". Usá JPG, PNG o MP4.`);
      }

      const dlRes = await fetch(
        `${GATEWAY_URL}/files/${fileId}?alt=media&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY } },
      );
      if (!dlRes.ok) {
        const t = await dlRes.text();
        throw new Error(`Drive download ${dlRes.status}: ${t.slice(0, 200)}`);
      }
      const bytes = new Uint8Array(await dlRes.arrayBuffer());

      const ext = EXT_BY_MIME[contentType] || "bin";
      const path = `${publication_id}/${Date.now()}_${items.length}.${ext}`;
      const { error: upErr } = await admin.storage.from("meta-publications").upload(path, bytes, {
        contentType, upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = admin.storage.from("meta-publications").getPublicUrl(path);
      items.push({
        drive_file_id: fileId,
        drive_file_name: fileName,
        drive_file_mime_type: contentType,
        drive_file_size: fileSize || bytes.length,
        media_url: pub.publicUrl,
        media_storage_path: path,
      });
    }

    const first = items[0];
    await admin.from("publications").update({
      media_items: items,
      // Mantenemos el primer archivo en los campos legacy para compatibilidad UI / publish actual
      drive_file_id: first.drive_file_id,
      drive_file_url: `https://drive.google.com/file/d/${first.drive_file_id}/view`,
      drive_file_name: items.length > 1 ? `${items.length} archivos (carrusel)` : first.drive_file_name,
      drive_file_mime_type: first.drive_file_mime_type,
      drive_file_size: first.drive_file_size,
      media_url: first.media_url,
      media_storage_path: first.media_storage_path,
      publish_status: "ready_to_publish",
      publish_error: null,
    }).eq("id", publication_id);

    return new Response(JSON.stringify({ success: true, items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
