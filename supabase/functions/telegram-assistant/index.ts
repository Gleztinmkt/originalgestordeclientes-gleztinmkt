import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/* ── Auth: x-api-key OR Bearer JWT ── */
async function authenticate(req: Request): Promise<boolean> {
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("TELEGRAM_API_KEY");
  if (apiKey && expectedKey && apiKey === expectedKey) return true;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data, error } = await sb.auth.getUser();
    return !error && !!data?.user;
  }
  return false;
}

/* ── Helpers ── */
async function fetchAllClients() {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("clients")
    .select("id, name, packages, last_post")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

async function fetchPendingPublications(clientIds: string[]) {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("publications")
    .select("id, name, type, date, description, copywriting, client_id, approved, status, package_id")
    .in("client_id", clientIds)
    .eq("is_published", false)
    .is("deleted_at", null)
    .order("date");
  if (error) throw error;
  return data ?? [];
}

async function fetchApprovedPublications() {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("publications")
    .select("id, name, type, date, description, copywriting, client_id, status, package_id")
    .eq("approved", true)
    .eq("is_published", false)
    .is("deleted_at", null)
    .order("date");
  if (error) throw error;
  return data ?? [];
}

async function fetchPublicationsByIds(ids: string[]) {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("publications")
    .select("id, name, type, date, description, copywriting, client_id, approved, status, package_id")
    .in("id", ids)
    .is("deleted_at", null);
  if (error) throw error;
  return data ?? [];
}

/* ── Mark publications as published + discount package ── */
async function markPublished(pubIds: string[]) {
  const sb = getAdminClient();
  const pubs = await fetchPublicationsByIds(pubIds);
  if (!pubs.length) return { ok: false, mensaje: "No se encontraron publicaciones" };

  // Update publications
  const { error: updateErr } = await sb
    .from("publications")
    .update({ is_published: true, status: "published" })
    .in("id", pubIds);
  if (updateErr) throw updateErr;

  // Group by client to discount packages
  const byClient: Record<string, typeof pubs> = {};
  for (const p of pubs) {
    if (p.client_id) {
      (byClient[p.client_id] ??= []).push(p);
    }
  }

  const now = new Date();
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const lastPostStr = `${now.getDate()} de ${months[now.getMonth()]}, ${now.getFullYear()}`;

  for (const [clientId, clientPubs] of Object.entries(byClient)) {
    const { data: client } = await sb
      .from("clients")
      .select("packages")
      .eq("id", clientId)
      .single();

    if (client?.packages && Array.isArray(client.packages)) {
      // deno-lint-ignore no-explicit-any
      const packages = client.packages as any[];

      for (const pub of clientPubs) {
        const pubDate = new Date(pub.date);
        const pubMonth = `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, "0")}`;

        for (const pkg of packages) {
          const pkgMonth = String(pkg.month ?? "");
          if (pkgMonth.startsWith(pubMonth) || pkgMonth.includes(pubMonth)) {
            pkg.usedPublications = (Number(pkg.usedPublications) || 0) + 1;
            break;
          }
        }
      }

      await sb
        .from("clients")
        .update({ packages, last_post: lastPostStr })
        .eq("id", clientId);
    }
  }

  return {
    ok: true,
    mensaje: `${pubs.length} publicación(es) marcada(s) como publicada(s)`,
    publicaciones: pubs.map((p) => p.id),
  };
}

/* ── AI: interpret natural language message ── */
async function interpretMessage(mensaje: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

  const clients = await fetchAllClients();
  const clientList = clients.map((c) => `- "${c.name}" (id: ${c.id})`).join("\n");

  const systemPrompt = `Sos un asistente para una agencia de marketing digital. Tu trabajo es interpretar mensajes del equipo y decidir qué acción tomar.

Lista de clientes activos:
${clientList}

Según el mensaje del usuario, elegí UNA de estas herramientas:

1. "identify_clients" — cuando el usuario dice que publicó algo, quiere ver publicaciones pendientes de un cliente, o menciona clientes para gestionar publicaciones.
2. "find_copy" — cuando el usuario pide el copy, copywriting, o texto de una publicación específica de un cliente.
3. "list_approved" — cuando el usuario pide un listado de publicaciones aprobadas, listas para subir, o pregunta "qué tengo para subir".

IMPORTANTE: Los nombres pueden estar abreviados, mal escritos o ser apodos. Hacé tu mejor esfuerzo para encontrar coincidencias.`;

  const tools = [
    {
      type: "function",
      function: {
        name: "identify_clients",
        description: "Identifica los clientes mencionados en el mensaje para buscar sus publicaciones pendientes",
        parameters: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nombre del cliente tal como aparece en la lista" },
                  id: { type: "string", description: "ID UUID del cliente" },
                  confidence: { type: "string", enum: ["alta", "media", "baja"] },
                },
                required: ["name", "id", "confidence"],
              },
            },
          },
          required: ["clients"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "find_copy",
        description: "Busca el copy/copywriting de una publicación específica de un cliente",
        parameters: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Nombre del cliente" },
            client_id: { type: "string", description: "ID UUID del cliente" },
            search_terms: {
              type: "array",
              items: { type: "string" },
              description: "Palabras clave para buscar la publicación (ej: 'retiro', 'video', 'menú')",
            },
          },
          required: ["client_name", "client_id", "search_terms"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_approved",
        description: "Lista todas las publicaciones aprobadas pendientes de publicar",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Breve descripción de por qué el usuario quiere el listado" },
          },
          required: ["reason"],
        },
      },
    },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: mensaje },
      ],
      tools,
      tool_choice: "required",
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) return { accion: "error", mensaje_ia: "Demasiadas solicitudes. Intentá de nuevo en unos segundos." };
    if (status === 402) return { accion: "error", mensaje_ia: "Créditos de IA agotados." };
    const text = await response.text();
    console.error("AI gateway error:", status, text);
    throw new Error(`Error de IA: ${status}`);
  }

  const aiResult = await response.json();
  const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall) {
    return { accion: "no_encontrado", mensaje_ia: "No pude interpretar tu mensaje. Intentá ser más específico." };
  }

  const fnName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  // ── identify_clients ──
  if (fnName === "identify_clients") {
    const identifiedClients = args.clients ?? [];
    if (!identifiedClients.length) {
      return { accion: "no_encontrado", mensaje_ia: "No pude identificar clientes en tu mensaje." };
    }

    const clientIds = identifiedClients.map((c: { id: string }) => c.id);
    const pubs = await fetchPendingPublications(clientIds);

    const clientesResult = identifiedClients.map((c: { name: string; id: string; confidence: string }) => ({
      id: c.id,
      nombre: c.name,
      confianza: c.confidence,
      publicaciones_pendientes: pubs
        .filter((p) => p.client_id === c.id)
        .map((p) => ({
          id: p.id,
          titulo: p.name,
          tipo: p.type,
          fecha: p.date,
          descripcion: p.description,
          tiene_copy: !!p.copywriting,
        })),
    }));

    const nombres = clientesResult.map((c: { nombre: string }) => c.nombre).join(", ");
    return {
      accion: "identificar_clientes",
      mensaje_ia: `Detecté ${clientesResult.length} cliente(s): ${nombres}`,
      clientes: clientesResult,
    };
  }

  // ── find_copy ──
  if (fnName === "find_copy") {
    const clientId = args.client_id;
    const clientName = args.client_name;
    const searchTerms: string[] = args.search_terms ?? [];

    const pubs = await fetchPendingPublications([clientId]);

    // Score publications by matching search terms
    let bestMatch = null;
    let bestScore = 0;

    for (const pub of pubs) {
      const text = `${pub.name} ${pub.description ?? ""} ${pub.type}`.toLowerCase();
      let score = 0;
      for (const term of searchTerms) {
        if (text.includes(term.toLowerCase())) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pub;
      }
    }

    if (!bestMatch || bestScore === 0) {
      // Fallback: return first pending pub if any
      if (pubs.length === 1) {
        bestMatch = pubs[0];
      } else {
        return {
          accion: "no_encontrado",
          mensaje_ia: `No encontré una publicación que coincida con "${searchTerms.join(", ")}" para ${clientName}`,
        };
      }
    }

    const copyText = bestMatch.copywriting || bestMatch.description;

    return {
      accion: "mostrar_copy",
      mensaje_ia: copyText
        ? `Copy de "${bestMatch.name}" de ${clientName}`
        : `No encontré copy cargado para "${bestMatch.name}" de ${clientName}`,
      cliente: { id: clientId, nombre: clientName },
      publicacion: {
        id: bestMatch.id,
        nombre: bestMatch.name,
        tipo: bestMatch.type,
        fecha: bestMatch.date,
        copywriting: copyText ?? null,
        descripcion: bestMatch.description ?? null,
      },
      puede_descontar: true,
    };
  }

  // ── list_approved ──
  if (fnName === "list_approved") {
    return await handleListadoAprobados();
  }

  return { accion: "no_encontrado", mensaje_ia: "No pude interpretar tu mensaje." };
}

/* ── Explicit action: listado_aprobados ── */
async function handleListadoAprobados() {
  const pubs = await fetchApprovedPublications();
  const clients = await fetchAllClients();
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const byClient: Record<string, { id: string; nombre: string; publicaciones: unknown[] }> = {};

  for (const pub of pubs) {
    const cid = pub.client_id ?? "unknown";
    if (!byClient[cid]) {
      byClient[cid] = {
        id: cid,
        nombre: clientMap.get(cid) ?? "Desconocido",
        publicaciones: [],
      };
    }
    byClient[cid].publicaciones.push({
      id: pub.id,
      titulo: pub.name,
      tipo: pub.type,
      fecha: pub.date,
      tiene_copy: !!pub.copywriting,
      descripcion: pub.description,
    });
  }

  const result = Object.values(byClient).map((c) => ({
    ...c,
    total_aprobados: c.publicaciones.length,
  }));

  return {
    accion: "listado_aprobados",
    mensaje_ia: result.length
      ? `Hay ${pubs.length} publicación(es) aprobada(s) de ${result.length} cliente(s)`
      : "No hay publicaciones aprobadas pendientes de publicar",
    clientes_con_aprobados: result,
  };
}

/* ── Explicit action: confirmar_publicaciones ── */
async function handleConfirmarPublicaciones(ids: string[]) {
  const pubs = await fetchPublicationsByIds(ids);
  const clients = await fetchAllClients();
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  return {
    accion: "confirmar_publicaciones",
    mensaje_ia: `${pubs.length} publicación(es) seleccionada(s)`,
    publicaciones: pubs.map((p) => ({
      id: p.id,
      titulo: p.name,
      tipo: p.type,
      fecha: p.date,
      copywriting: p.copywriting ?? null,
      descripcion: p.description ?? null,
      cliente: clientMap.get(p.client_id ?? "") ?? "Desconocido",
    })),
    puede_descontar: true,
  };
}

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authenticated = await authenticate(req);
    if (!authenticated) {
      return json({ error: "No autorizado" }, 401);
    }

    const body = await req.json();
    const accion = body.accion ?? null;

    // Explicit actions
    if (accion === "listado_aprobados") {
      return json(await handleListadoAprobados());
    }

    if (accion === "confirmar_publicaciones") {
      const ids = body.publicaciones_ids ?? [];
      if (!ids.length) return json({ error: "publicaciones_ids es requerido" }, 400);
      return json(await handleConfirmarPublicaciones(ids));
    }

    if (accion === "marcar_publicadas" || accion === "confirmar") {
      const ids = body.publicaciones_ids ?? body.publicacion_ids ?? [];
      if (!ids.length) return json({ error: "publicaciones_ids es requerido" }, 400);
      const result = await markPublished(ids);
      return json({ accion: "marcar_publicadas", ...result });
    }

    // Natural language message → AI interpretation
    const mensaje = body.mensaje;
    if (mensaje && typeof mensaje === "string") {
      const result = await interpretMessage(mensaje);
      return json(result);
    }

    return json({
      error: "Enviá un campo 'mensaje' con texto natural o un campo 'accion' explícito",
      acciones_disponibles: [
        "mensaje (texto natural → IA interpreta)",
        "listado_aprobados",
        "confirmar_publicaciones { publicaciones_ids: [...] }",
        "marcar_publicadas { publicaciones_ids: [...] }",
      ],
    }, 400);
  } catch (e) {
    console.error("telegram-assistant error:", e);
    return json({ error: e?.message || "Error interno" }, 500);
  }
});
