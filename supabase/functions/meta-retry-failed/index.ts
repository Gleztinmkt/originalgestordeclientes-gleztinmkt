import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

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
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    if (!(await canManageMetaPublishing(admin, userData.user.id))) return new Response(JSON.stringify({ error: "Solo administradores y planificadores pueden reintentar publicaciones Meta" }), { status: 403, headers: corsHeaders });

    const { publication_id } = await req.json();
    await admin.from("publications").update({ publish_status: "ready_to_publish", publish_error: null }).eq("id", publication_id);

    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-publish-now`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ publication_id }),
    }).then(r => r.json());

    return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
