import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "video/mp4"];
const FOLDER_MIME = "application/vnd.google-apps.folder";

async function canManageMetaPublishing(admin: any, userId: string) {
  const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  const role = String(roleData?.role || "");
  if (role === "admin" || role === "planner" || role === "planificador") return true;

  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const fullName = profile?.full_name?.trim();
  if (!fullName) return false;

  const { data: planner } = await admin.from("planners").select("id").ilike("name", fullName).limit(1).maybeSingle();
  return !!planner;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY not configured (link Google Drive connector)");

    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    if (!(await canManageMetaPublishing(admin, userData.user.id))) {
      return new Response(JSON.stringify({ error: "Solo administradores y planificadores pueden usar Drive para Meta" }), { status: 403, headers: corsHeaders });
    }

    const body = req.method === "POST" ? await req.json() : {};
    const search: string = body.search || "";
    const folderId: string | null = body.folderId || null;
    const sharedWithMe: boolean = !!body.sharedWithMe;
    const pageToken: string | null = body.pageToken || null;

    // Build q
    const qParts: string[] = ["trashed = false"];
    if (folderId) {
      qParts.push(`'${folderId}' in parents`);
    } else if (sharedWithMe) {
      qParts.push("sharedWithMe = true");
    }
    if (search) {
      const safe = search.replace(/'/g, "\\'");
      qParts.push(`name contains '${safe}'`);
    }
    // mime filter: folders OR allowed media
    const mimeFilter = `(mimeType = '${FOLDER_MIME}' or ${ALLOWED_MIMES.map((m) => `mimeType = '${m}'`).join(" or ")})`;
    qParts.push(mimeFilter);

    const params = new URLSearchParams({
      q: qParts.join(" and "),
      fields: "nextPageToken, files(id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,parents,webViewLink)",
      pageSize: "100",
      orderBy: "folder,modifiedTime desc",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      corpora: sharedWithMe ? "user" : "user",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const r = await fetch(`${GATEWAY_URL}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
      },
    });
    const data = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `Drive API ${r.status}`, details: data }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
