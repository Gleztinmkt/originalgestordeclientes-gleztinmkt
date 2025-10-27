// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  return parts.length === 2 ? parts[1] : null;
}

function decodeJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded?.sub || null;
  } catch (_) {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Faltan variables de entorno necesarias");
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const token = getBearerToken(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Falta token de autenticación" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const callerId = decodeJwtSub(token);
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar que el solicitante sea admin
    const { data: isAdmin, error: adminErr } = await adminClient.rpc("check_admin_role", { user_id: callerId });
    if (adminErr) {
      console.error("RPC check_admin_role error:", adminErr);
      return new Response(JSON.stringify({ error: "No se pudo verificar permisos" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Solo administradores pueden crear usuarios" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, password, role } = await req.json();
    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "Campos incompletos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Obtener agency_id del creador
    const { data: creatorProfile, error: profErr } = await adminClient
      .from("profiles")
      .select("agency_id")
      .eq("id", callerId)
      .single();
    if (profErr) {
      console.error("Profile read error:", profErr);
      return new Response(JSON.stringify({ error: "No se pudo obtener la agencia del creador" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Crear usuario auth
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email.split("@")[0] },
    });
    if (createErr || !created?.user) {
      console.error("Create user error:", createErr);
      return new Response(JSON.stringify({ error: createErr?.message || "No se pudo crear el usuario" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const newUserId = created.user.id;

    // Asignar rol
    const { error: roleErr } = await adminClient.from("user_roles").insert({ user_id: newUserId, role });
    if (roleErr) {
      console.error("Insert role error:", roleErr);
      return new Response(JSON.stringify({ error: "No se pudo asignar el rol" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Crear perfil con misma agencia
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