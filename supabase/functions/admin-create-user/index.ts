// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with caller's auth to validate permissions and read their profile
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    // Verify caller is admin using secure RPC
    const { data: isAdmin, error: adminErr } = await callerClient.rpc("check_admin_role", {
      user_id: (await callerClient.auth.getUser()).data.user?.id,
    });

    if (adminErr) {
      console.error("Admin check error:", adminErr);
      return new Response(JSON.stringify({ error: "No se pudo verificar permisos" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Solo administradores pueden crear usuarios" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get creator agency_id
    const { data: callerUser } = await callerClient.auth.getUser();
    const creatorId = callerUser?.user?.id;

    const { data: creatorProfile, error: profErr } = await callerClient
      .from("profiles")
      .select("agency_id")
      .eq("id", creatorId)
      .single();

    if (profErr) {
      console.error("Profile read error:", profErr);
      return new Response(JSON.stringify({ error: "No se pudo obtener la agencia del creador" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Admin client with service role for privileged ops
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Create auth user without affecting caller session
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email.split("@")[0] },
    });

    if (createErr || !created.user) {
      console.error("Create user error:", createErr);
      return new Response(JSON.stringify({ error: createErr?.message || "No se pudo crear el usuario" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const newUserId = created.user.id;

    // Assign role
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: newUserId,
      role,
    });
    if (roleErr) {
      console.error("Insert role error:", roleErr);
      return new Response(JSON.stringify({ error: "No se pudo asignar el rol" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create profile inheriting agency
    const { error: profInsErr } = await adminClient.from("profiles").insert({
      id: newUserId,
      full_name: email.split("@")[0],
      agency_id: creatorProfile?.agency_id ?? null,
    });
    if (profInsErr) {
      console.error("Insert profile error:", profInsErr);
      return new Response(JSON.stringify({ error: "No se pudo crear el perfil" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("Unhandled error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Error interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});