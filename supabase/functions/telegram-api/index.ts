import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// deno-lint-ignore no-explicit-any
function sumPackages(packages: any[]) {
  let disponibles = 0;
  let usadas = 0;
  if (!Array.isArray(packages)) return { disponibles, usadas };
  for (const pkg of packages) {
    disponibles += Number(pkg.totalPublications ?? 0);
    usadas += Number(pkg.usedPublications ?? 0);
  }
  return { disponibles, usadas };
}

// Fetch all clients sorted alphabetically and add index number
async function fetchAllClients() {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("clients")
    .select("id, name, packages, phone")
    .is("deleted_at", null)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((c, i) => {
    const { disponibles, usadas } = sumPackages(c.packages as unknown[]);
    return {
      numero: i + 1,
      id: c.id,
      nombre: c.name,
      telefono: c.phone,
      publicaciones_disponibles: disponibles,
      publicaciones_usadas: usadas,
    };
  });
}

// GET ?action=clientes
async function handleClientes() {
  try {
    const result = await fetchAllClients();
    return json(result);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// GET ?action=buscar&q=...
// q can be a number (index in alphabetical list) or a name search
async function handleBuscar(q: string) {
  if (!q) return json({ error: "Parámetro q es requerido" }, 400);

  try {
    const allClients = await fetchAllClients();

    // If q is a number, return that client by position
    const num = parseInt(q, 10);
    if (!isNaN(num) && num > 0 && num <= allClients.length) {
      return json([allClients[num - 1]]);
    }

    // Otherwise filter by name
    const lower = q.toLowerCase();
    const filtered = allClients.filter((c) =>
      c.nombre.toLowerCase().includes(lower)
    );

    return json(filtered);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// POST ?action=crear_publicacion
async function handleCrearPublicacion(body: {
  cliente_id: string;
  tipo: string;
  copy?: string;
  fecha: string;
  red_social?: string;
  estado?: string;
}) {
  const { cliente_id, tipo, copy, fecha, red_social, estado } = body;

  if (!cliente_id || !tipo || !fecha) {
    return json({ error: "cliente_id, tipo y fecha son requeridos" }, 400);
  }

  const validTypes = ["reel", "carousel", "image"];
  const normalizedType = tipo.toLowerCase();
  if (!validTypes.includes(normalizedType)) {
    return json({ error: `tipo debe ser uno de: ${validTypes.join(", ")}` }, 400);
  }

  const sb = getAdminClient();

  // Verify client exists
  const { data: client, error: clientErr } = await sb
    .from("clients")
    .select("id")
    .eq("id", cliente_id)
    .is("deleted_at", null)
    .single();

  if (clientErr || !client) {
    return json({ error: "Cliente no encontrado" }, 404);
  }

  const isPublished = estado?.toLowerCase() === "publicada";

  const { data: pub, error: pubErr } = await sb.from("publications").insert({
    client_id: cliente_id,
    type: normalizedType,
    description: copy ?? null,
    copywriting: copy ?? null,
    date: fecha,
    name: red_social ?? "Instagram",
    status: isPublished ? "published" : "pending",
    is_published: isPublished,
  }).select("id").single();

  if (pubErr) return json({ error: pubErr.message }, 500);

  return json({ id: pub.id, mensaje: "Publicación creada correctamente" }, 201);
}

// PATCH ?action=actualizar_publicacion
async function handleActualizarPublicacion(body: { id: string }) {
  const { id } = body;
  if (!id) return json({ error: "id es requerido" }, 400);

  const sb = getAdminClient();

  // Get publication
  const { data: pub, error: pubErr } = await sb
    .from("publications")
    .select("id, client_id, date")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (pubErr || !pub) return json({ error: "Publicación no encontrada" }, 404);

  // Mark as published
  const { error: updateErr } = await sb
    .from("publications")
    .update({ is_published: true, status: "published" })
    .eq("id", id);

  if (updateErr) return json({ error: updateErr.message }, 500);

  // Discount from client package
  if (pub.client_id) {
    const { data: client, error: cErr } = await sb
      .from("clients")
      .select("packages")
      .eq("id", pub.client_id)
      .single();

    if (!cErr && client?.packages && Array.isArray(client.packages)) {
      const pubDate = new Date(pub.date);
      const pubMonth = `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, "0")}`;

      // deno-lint-ignore no-explicit-any
      const packages = client.packages as any[];
      let updated = false;

      for (const pkg of packages) {
        const pkgMonth = String(pkg.month ?? "");
        // Match by month (formats: "2025-03", "2025-03-01", "March 2025", etc.)
        if (pkgMonth.startsWith(pubMonth) || pkgMonth.includes(pubMonth)) {
          pkg.usedPublications = (Number(pkg.usedPublications) || 0) + 1;
          updated = true;
          break;
        }
      }

      if (updated) {
        await sb
          .from("clients")
          .update({ packages })
          .eq("id", pub.client_id);
      }
    }
  }

  return json({ ok: true, mensaje: "Publicación marcada como publicada" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("TELEGRAM_API_KEY");

  if (!expectedKey || apiKey !== expectedKey) {
    return json({ error: "API key inválida o faltante" }, 401);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (req.method === "GET" && action === "clientes") {
      return await handleClientes();
    }

    if (req.method === "GET" && action === "buscar") {
      return await handleBuscar(url.searchParams.get("q") ?? "");
    }

    if (req.method === "POST" && action === "crear_publicacion") {
      const body = await req.json();
      return await handleCrearPublicacion(body);
    }

    if (req.method === "PATCH" && action === "actualizar_publicacion") {
      const body = await req.json();
      return await handleActualizarPublicacion(body);
    }

    return json({ error: "Acción no reconocida", acciones_disponibles: [
      "GET ?action=clientes",
      "GET ?action=buscar&q=nombre",
      "POST ?action=crear_publicacion",
      "PATCH ?action=actualizar_publicacion",
    ]}, 400);
  } catch (e) {
    console.error("telegram-api error:", e);
    return json({ error: e?.message || "Error interno" }, 500);
  }
});
