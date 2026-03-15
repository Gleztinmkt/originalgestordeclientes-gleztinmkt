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
    .select("id, name, packages, last_post, client_info, marketing_info, instagram, facebook, phone")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

async function fetchPendingPublications(clientIds: string[]) {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("publications")
    .select("id, name, type, date, description, copywriting, client_id, approved, status, package_id, needs_recording, needs_editing, in_editing, in_review, designer, filming_time, links")
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

/* ── Production query helper ── */
async function fetchPublicationsByStatus(filters: {
  clientIds?: string[];
  needs_recording?: boolean;
  needs_editing?: boolean;
  in_editing?: boolean;
  in_review?: boolean;
  approved?: boolean;
  type?: string;
}) {
  const sb = getAdminClient();
  let query = sb
    .from("publications")
    .select("id, name, type, date, description, copywriting, client_id, needs_recording, needs_editing, in_editing, in_review, approved, designer, filming_time, links, status")
    .eq("is_published", false)
    .is("deleted_at", null);

  if (filters.clientIds?.length) query = query.in("client_id", filters.clientIds);
  if (filters.needs_recording !== undefined) query = query.eq("needs_recording", filters.needs_recording);
  if (filters.needs_editing !== undefined) query = query.eq("needs_editing", filters.needs_editing);
  if (filters.in_editing !== undefined) query = query.eq("in_editing", filters.in_editing);
  if (filters.in_review !== undefined) query = query.eq("in_review", filters.in_review);
  if (filters.approved !== undefined) query = query.eq("approved", filters.approved);
  
  if (filters.type) query = query.eq("type", filters.type);

  const { data, error } = await query.order("date");
  if (error) throw error;
  return data ?? [];
}

/* ── Package helpers (descuento continuo) ── */
// deno-lint-ignore no-explicit-any
function findActivePackage(packages: any[]): any | null {
  for (const pkg of packages) {
    const total = Number(pkg.totalPublications) || 0;
    const used = Number(pkg.usedPublications) || 0;
    if (used < total) return pkg;
  }
  return null;
}

// deno-lint-ignore no-explicit-any
function parseClientPackages(rawPackages: unknown): { packages: any[]; isValid: boolean } {
  if (Array.isArray(rawPackages)) {
    return { packages: rawPackages, isValid: true };
  }

  if (typeof rawPackages === "string") {
    try {
      const parsed = JSON.parse(rawPackages);
      if (Array.isArray(parsed)) {
        return { packages: parsed, isValid: true };
      }
      return { packages: [], isValid: false };
    } catch {
      return { packages: [], isValid: false };
    }
  }

  if (rawPackages == null) {
    return { packages: [], isValid: true };
  }

  return { packages: [], isValid: false };
}

/* ── Mark publications as published + discount package ── */
async function markPublished(pubIds: string[], discountCount?: number | string) {
  const sb = getAdminClient();
  const pubs = await fetchPublicationsByIds(pubIds);
  if (!pubs.length) return { ok: false, mensaje: "No se encontraron publicaciones" };

  const { error: updateErr } = await sb
    .from("publications")
    .update({ is_published: true, status: "published" })
    .in("id", pubIds);
  if (updateErr) throw updateErr;

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

  const parsedDiscount = Number(discountCount);
  const hasCustomDiscount = Number.isFinite(parsedDiscount) && parsedDiscount > 0;
  const singleClientSelection = Object.keys(byClient).length === 1;

  for (const [clientId, clientPubs] of Object.entries(byClient)) {
    const { data: client, error: clientError } = await sb
      .from("clients")
      .select("packages")
      .eq("id", clientId)
      .single();

    if (clientError) throw clientError;

    const { packages, isValid } = parseClientPackages(client?.packages);

    let remaining = singleClientSelection && hasCustomDiscount
      ? parsedDiscount
      : clientPubs.length;

    if (isValid && packages.length > 0) {
      while (remaining > 0) {
        const activePkg = findActivePackage(packages);
        if (!activePkg) break;

        const total = Number(activePkg.totalPublications) || 0;
        const used = Number(activePkg.usedPublications) || 0;
        const available = total - used;

        if (available <= 0) break;

        const take = Math.min(remaining, available);
        activePkg.usedPublications = used + take;
        remaining -= take;
      }
    }

    const clientUpdate: Record<string, unknown> = { last_post: lastPostStr };

    if (isValid) {
      clientUpdate.packages = packages;
    } else {
      console.warn(`client ${clientId}: packages inválido, se actualiza solo last_post`);
    }

    const { error: updateClientError } = await sb
      .from("clients")
      .update(clientUpdate)
      .eq("id", clientId);

    if (updateClientError) throw updateClientError;
  }

  return {
    ok: true,
    mensaje: `${pubs.length} publicación(es) marcada(s) como publicada(s)`,
    publicaciones: pubs.map((p) => p.id),
  };
}

/* ── Planning management ── */
async function handleUpdatePlanning(clientId: string, month: number, status?: string, description?: string) {
  const sb = getAdminClient();
  const year = new Date().getFullYear();
  const startOfMonth = new Date(year, month - 1, 1).toISOString();

  const { data: existing } = await sb
    .from("publication_planning")
    .select("id, status, description")
    .eq("client_id", clientId)
    .eq("month", startOfMonth)
    .is("deleted_at", null)
    .maybeSingle();

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (description !== undefined) updateData.description = description;

  if (existing) {
    const { error } = await sb
      .from("publication_planning")
      .update(updateData)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb
      .from("publication_planning")
      .insert({
        client_id: clientId,
        month: startOfMonth,
        status: status || "consultar",
        description: description || "",
      });
    if (error) throw error;
  }

  return { ok: true };
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
4. "update_planning" — cuando el usuario quiere cambiar el estado de planificación de un cliente para un mes (marcar como "hacer", "no_hacer", "consultar") o agregar/cambiar la descripción de planificación. Los meses son del año actual 2026.
5. "query_production" — cuando el usuario pregunta por el estado de producción de un cliente: qué falta grabar, qué está en edición, qué está en revisión, qué está aprobado, qué está en la nube. Ej: "¿qué falta grabar de Soledad?", "¿cuántos reels tiene Jacinto en edición?"
6. "production_summary" — cuando el usuario pide un resumen general de producción de todos los clientes o pregunta "¿cómo estoy de producción?", "¿qué tengo pendiente?", "resumen de estado".
7. "query_packages" — cuando el usuario pregunta por el estado de paquetes: cuántas publicaciones quedan, cuántas usó, qué paquetes tiene. Ej: "¿cuántas le quedan a Soledad?", "estado de paquetes de Jacinto".
8. "query_client_info" — cuando el usuario pregunta por la información de un cliente: info general, reuniones, branding, horarios de publicación, redes sociales. Ej: "¿qué info tengo de 4S Motors?", "datos de Soledad".
9. "filter_by_status" — cuando el usuario quiere filtrar publicaciones por un estado específico combinado. Ej: "¿qué tengo en la nube listo para subir?", "publicaciones en revisión", "lo que falta editar".

IMPORTANTE: Los nombres pueden estar abreviados, mal escritos o ser apodos. Hacé tu mejor esfuerzo para encontrar coincidencias.
Cuando el usuario pida cambiar planificación, detectá el mes mencionado (enero=1, febrero=2, etc.) y el estado deseado.
Si NO se menciona un mes específico, usá el mes actual: ${new Date().getMonth() + 1} (${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][new Date().getMonth()]}).
Si pide "marcar como hacer" o "botón verde", el status es "hacer".
Si pide agregar descripción, incluí el texto completo en el campo description.`;

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
    {
      type: "function",
      function: {
        name: "update_planning",
        description: "Actualiza el estado de planificación o descripción de uno o varios clientes para un mes específico del año 2026",
        parameters: {
          type: "object",
          properties: {
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string", description: "Nombre del cliente" },
                  client_id: { type: "string", description: "ID UUID del cliente" },
                  month: { type: "number", description: "Número del mes (1=enero, 12=diciembre)" },
                  status: { type: "string", enum: ["hacer", "no_hacer", "consultar"], description: "Nuevo estado de planificación" },
                  description: { type: "string", description: "Descripción de planificación (solo si el usuario la especifica)" },
                },
                required: ["client_name", "client_id", "month"],
              },
            },
          },
          required: ["updates"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "query_production",
        description: "Consulta el estado de producción de un cliente específico: qué publicaciones faltan grabar, están en edición, revisión, aprobadas o en la nube",
        parameters: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Nombre del cliente" },
            client_id: { type: "string", description: "ID UUID del cliente" },
            status_filter: {
              type: "string",
              enum: ["needs_recording", "needs_editing", "in_editing", "in_review", "approved", "in_cloud", "all"],
              description: "Filtro de estado. 'all' muestra todo agrupado por estado.",
            },
            type_filter: {
              type: "string",
              enum: ["reel", "carousel", "image"],
              description: "Filtro opcional por tipo de publicación",
            },
          },
          required: ["client_name", "client_id", "status_filter"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "production_summary",
        description: "Genera un resumen global de producción de todos los clientes: cuántas publicaciones faltan grabar, están en edición, revisión, etc.",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Motivo del resumen" },
          },
          required: ["reason"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "query_packages",
        description: "Consulta el estado de paquetes de un cliente: cuántas publicaciones tiene, cuántas usó, cuántas le quedan",
        parameters: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Nombre del cliente" },
            client_id: { type: "string", description: "ID UUID del cliente" },
          },
          required: ["client_name", "client_id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "query_client_info",
        description: "Consulta la información completa de un cliente: info general, reuniones, branding, redes sociales, horarios de publicación",
        parameters: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Nombre del cliente" },
            client_id: { type: "string", description: "ID UUID del cliente" },
          },
          required: ["client_name", "client_id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "filter_by_status",
        description: "Filtra publicaciones de todos los clientes por combinación de estados específicos. Ej: en la nube pero no publicadas, en revisión, etc.",
        parameters: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              properties: {
                needs_recording: { type: "boolean" },
                needs_editing: { type: "boolean" },
                in_editing: { type: "boolean" },
                in_review: { type: "boolean" },
                approved: { type: "boolean" },
                in_cloud: { type: "boolean" },
                type: { type: "string", enum: ["reel", "carousel", "image"] },
              },
            },
            description: { type: "string", description: "Descripción de lo que se busca" },
          },
          required: ["filters", "description"],
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

  // ── update_planning → return proposals, don't apply ──
  if (fnName === "update_planning") {
    const updates = args.updates ?? [];
    if (!updates.length) {
      return { accion: "no_encontrado", mensaje_ia: "No pude identificar qué planificación actualizar." };
    }

    const results = updates.map((u: { client_name: string; client_id: string; month: number; status?: string; description?: string }) => ({
      cliente: u.client_name,
      client_id: u.client_id,
      mes: u.month,
      status: u.status,
      descripcion: u.description,
    }));

    const monthNames = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    const summary = results.map((r: { cliente: string; mes: number; status?: string; descripcion?: string }) => {
      const parts = [`${r.cliente} → ${monthNames[r.mes]}`];
      if (r.status) parts.push(`estado: ${r.status}`);
      if (r.descripcion) parts.push(`con descripción`);
      return parts.join(" ");
    }).join("; ");

    return {
      accion: "planificacion_propuesta",
      mensaje_ia: `Propuesta de planificación: ${summary}`,
      actualizaciones: results,
    };
  }

  // ── query_production ──
  if (fnName === "query_production") {
    const clientId = args.client_id;
    const clientName = args.client_name;
    const statusFilter = args.status_filter;
    const typeFilter = args.type_filter;

    const statusLabels: Record<string, string> = {
      needs_recording: "Falta grabar",
      needs_editing: "Necesita edición",
      in_editing: "En edición",
      in_review: "En revisión",
      approved: "Aprobada",
      in_cloud: "En la nube",
    };

    if (statusFilter === "all") {
      // Fetch all unpublished for this client
      const allPubs = await fetchPublicationsByStatus({ clientIds: [clientId], ...(typeFilter ? { type: typeFilter } : {}) });

      const grouped: Record<string, typeof allPubs> = {};
      for (const pub of allPubs) {
        if (pub.needs_recording) (grouped["needs_recording"] ??= []).push(pub);
        if (pub.needs_editing) (grouped["needs_editing"] ??= []).push(pub);
        if (pub.in_editing) (grouped["in_editing"] ??= []).push(pub);
        if (pub.in_review) (grouped["in_review"] ??= []).push(pub);
        if (pub.approved) (grouped["approved"] ??= []).push(pub);
        if (pub.in_cloud) (grouped["in_cloud"] ??= []).push(pub);
      }

      const resumen = Object.entries(grouped).map(([key, pubs]) => ({
        estado: statusLabels[key] || key,
        estado_key: key,
        cantidad: pubs.length,
        publicaciones: pubs.map((p) => ({
          id: p.id,
          nombre: p.name,
          tipo: p.type,
          fecha: p.date,
          descripcion: p.description,
          copywriting: p.copywriting,
          designer: p.designer,
          filming_time: p.filming_time,
          links: p.links,
        })),
      }));

      return {
        accion: "estado_produccion",
        mensaje_ia: `Estado de producción de ${clientName}: ${allPubs.length} publicación(es) pendiente(s)${typeFilter ? ` (tipo: ${typeFilter})` : ""}`,
        cliente: { id: clientId, nombre: clientName },
        resumen_estados: resumen,
        total: allPubs.length,
      };
    }

    // Specific status filter
    const filters: Record<string, unknown> = { clientIds: [clientId] };
    if (statusFilter) filters[statusFilter] = true;
    if (typeFilter) filters.type = typeFilter;

    const pubs = await fetchPublicationsByStatus(filters as Parameters<typeof fetchPublicationsByStatus>[0]);

    return {
      accion: "estado_produccion",
      mensaje_ia: pubs.length
        ? `${clientName}: ${pubs.length} publicación(es) en estado "${statusLabels[statusFilter] || statusFilter}"${typeFilter ? ` (tipo: ${typeFilter})` : ""}`
        : `${clientName} no tiene publicaciones en estado "${statusLabels[statusFilter] || statusFilter}"${typeFilter ? ` de tipo ${typeFilter}` : ""}`,
      cliente: { id: clientId, nombre: clientName },
      resumen_estados: [{
        estado: statusLabels[statusFilter] || statusFilter,
        estado_key: statusFilter,
        cantidad: pubs.length,
        publicaciones: pubs.map((p) => ({
          id: p.id,
          nombre: p.name,
          tipo: p.type,
          fecha: p.date,
          descripcion: p.description,
          copywriting: p.copywriting,
          designer: p.designer,
          filming_time: p.filming_time,
          links: p.links,
        })),
      }],
      total: pubs.length,
    };
  }

  // ── production_summary ──
  if (fnName === "production_summary") {
    const allPubs = await fetchPublicationsByStatus({});
    const clients = await fetchAllClients();
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    const statusKeys = ["needs_recording", "needs_editing", "in_editing", "in_review", "approved", "in_cloud"];
    const statusLabels: Record<string, string> = {
      needs_recording: "Falta grabar",
      needs_editing: "Necesita edición",
      in_editing: "En edición",
      in_review: "En revisión",
      approved: "Aprobada",
      in_cloud: "En la nube",
    };

    // Global counts
    const globalCounts: Record<string, number> = {};
    for (const key of statusKeys) globalCounts[key] = 0;

    // Per-client counts
    const perClient: Record<string, Record<string, number>> = {};

    for (const pub of allPubs) {
      const cid = pub.client_id ?? "unknown";
      if (!perClient[cid]) {
        perClient[cid] = {};
        for (const key of statusKeys) perClient[cid][key] = 0;
      }

      for (const key of statusKeys) {
        // deno-lint-ignore no-explicit-any
        if ((pub as any)[key]) {
          globalCounts[key]++;
          perClient[cid][key]++;
        }
      }
    }

    const resumenGlobal = statusKeys.map((key) => ({
      estado: statusLabels[key],
      estado_key: key,
      cantidad: globalCounts[key],
    }));

    const resumenClientes = Object.entries(perClient)
      .filter(([cid]) => clientMap.has(cid))
      .map(([cid, counts]) => ({
        id: cid,
        nombre: clientMap.get(cid)!,
        estados: statusKeys
          .filter((key) => counts[key] > 0)
          .map((key) => ({
            estado: statusLabels[key],
            estado_key: key,
            cantidad: counts[key],
          })),
      }))
      .filter((c) => c.estados.length > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return {
      accion: "resumen_produccion",
      mensaje_ia: `Resumen de producción: ${allPubs.length} publicación(es) pendiente(s) de ${resumenClientes.length} cliente(s)`,
      resumen_global: resumenGlobal,
      resumen_clientes: resumenClientes,
      total: allPubs.length,
    };
  }

  // ── query_packages ──
  if (fnName === "query_packages") {
    const clientId = args.client_id;
    const clientName = args.client_name;

    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      return { accion: "no_encontrado", mensaje_ia: `No encontré el cliente ${clientName}` };
    }

    const { packages, isValid } = parseClientPackages(client.packages);
    if (!isValid || !packages.length) {
      return {
        accion: "estado_paquetes",
        mensaje_ia: `${clientName} no tiene paquetes cargados`,
        cliente: { id: clientId, nombre: clientName },
        paquetes: [],
      };
    }

    // deno-lint-ignore no-explicit-any
    const paquetesInfo = packages.map((pkg: any) => ({
      id: pkg.id,
      nombre: pkg.name || "Sin nombre",
      mes: pkg.month || null,
      total: Number(pkg.totalPublications) || 0,
      usadas: Number(pkg.usedPublications) || 0,
      restantes: Math.max(0, (Number(pkg.totalPublications) || 0) - (Number(pkg.usedPublications) || 0)),
      pagado: pkg.paid ?? false,
      ultimo_post: client.last_post || null,
    }));

    const totalRestantes = paquetesInfo.reduce((sum: number, p: { restantes: number }) => sum + p.restantes, 0);
    const totalUsadas = paquetesInfo.reduce((sum: number, p: { usadas: number }) => sum + p.usadas, 0);
    const totalTotal = paquetesInfo.reduce((sum: number, p: { total: number }) => sum + p.total, 0);

    return {
      accion: "estado_paquetes",
      mensaje_ia: `${clientName}: ${totalUsadas}/${totalTotal} publicaciones usadas, quedan ${totalRestantes}`,
      cliente: { id: clientId, nombre: clientName },
      paquetes: paquetesInfo,
      resumen: { total: totalTotal, usadas: totalUsadas, restantes: totalRestantes },
    };
  }

  // ── query_client_info ──
  if (fnName === "query_client_info") {
    const clientId = args.client_id;
    const clientName = args.client_name;

    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      return { accion: "no_encontrado", mensaje_ia: `No encontré el cliente ${clientName}` };
    }

    // deno-lint-ignore no-explicit-any
    const clientInfo = (client.client_info as any) || {};

    return {
      accion: "info_cliente",
      mensaje_ia: `Información de ${clientName}`,
      cliente: {
        id: clientId,
        nombre: clientName,
        telefono: client.phone || null,
        instagram: client.instagram || null,
        facebook: client.facebook || null,
        ultimo_post: client.last_post || null,
        marketing_info: client.marketing_info || null,
        info_general: clientInfo.generalInfo || null,
        reuniones: clientInfo.meetings || [],
        redes_sociales: clientInfo.socialNetworks || [],
        branding: clientInfo.branding || null,
        horarios_publicacion: clientInfo.publicationSchedule || [],
      },
    };
  }

  // ── filter_by_status ──
  if (fnName === "filter_by_status") {
    const filters = args.filters ?? {};
    const description = args.description ?? "";

    const pubs = await fetchPublicationsByStatus(filters);
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    // Group by client
    const byClient: Record<string, { id: string; nombre: string; publicaciones: unknown[] }> = {};

    for (const pub of pubs) {
      const cid = pub.client_id ?? "unknown";
      if (!clientMap.has(cid)) continue;
      if (!byClient[cid]) {
        byClient[cid] = { id: cid, nombre: clientMap.get(cid)!, publicaciones: [] };
      }
      byClient[cid].publicaciones.push({
        id: pub.id,
        nombre: pub.name,
        tipo: pub.type,
        fecha: pub.date,
        descripcion: pub.description,
        copywriting: pub.copywriting,
        designer: pub.designer,
        filming_time: pub.filming_time,
        links: pub.links,
        cliente: clientMap.get(cid),
      });
    }

    const result = Object.values(byClient).sort((a, b) => a.nombre.localeCompare(b.nombre));

    return {
      accion: "filtro_estado",
      mensaje_ia: pubs.length
        ? `${pubs.length} publicación(es) encontrada(s): ${description}`
        : `No se encontraron publicaciones con ese filtro: ${description}`,
      clientes: result,
      total: pubs.length,
    };
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
    if (!clientMap.has(cid)) continue;

    if (!byClient[cid]) {
      byClient[cid] = {
        id: cid,
        nombre: clientMap.get(cid)!,
        publicaciones: [],
      };
    }
    byClient[cid].publicaciones.push({
      id: pub.id,
      titulo: pub.name,
      tipo: pub.type,
      fecha: pub.date,
      tiene_copy: !!pub.copywriting,
      copy_text: pub.copywriting || pub.description || null,
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

  const clientPackages: Record<string, unknown[]> = {};
  for (const p of pubs) {
    if (p.client_id && !clientPackages[p.client_id]) {
      const client = clients.find((c) => c.id === p.client_id);
      clientPackages[p.client_id] = (client?.packages as unknown[] ?? []);
    }
  }

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
      cliente_id: p.client_id,
    })),
    paquetes_por_cliente: Object.fromEntries(
      Object.entries(clientPackages).map(([cid, pkgs]) => [
        cid,
        // deno-lint-ignore no-explicit-any
        (pkgs as any[]).map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          month: pkg.month,
          total: Number(pkg.totalPublications) || 0,
          used: Number(pkg.usedPublications) || 0,
          remaining: (Number(pkg.totalPublications) || 0) - (Number(pkg.usedPublications) || 0),
        })),
      ])
    ),
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
      const discountCount = body.cantidad_descontar ?? undefined;
      const result = await markPublished(ids, discountCount);
      return json({ accion: "marcar_publicadas", ...result });
    }

    if (accion === "actualizar_planificacion") {
      const { client_id, month, status, description } = body;
      if (!client_id || !month) return json({ error: "client_id y month son requeridos" }, 400);
      const result = await handleUpdatePlanning(client_id, month, status, description);
      return json({ accion: "planificacion_actualizada", ...result });
    }

    if (accion === "confirmar_planificacion") {
      const updates = body.updates ?? [];
      if (!updates.length) return json({ error: "updates es requerido" }, 400);
      for (const u of updates) {
        await handleUpdatePlanning(u.client_id, u.month, u.status, u.description);
      }
      return json({
        accion: "planificacion_confirmada",
        mensaje_ia: `${updates.length} planificación(es) confirmada(s) exitosamente`,
        ok: true,
      });
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
        "marcar_publicadas { publicaciones_ids: [...], cantidad_descontar: N }",
        "actualizar_planificacion { client_id, month, status, description }",
      ],
    }, 400);
  } catch (e) {
    console.error("telegram-assistant error:", e);
    return json({ error: e?.message || "Error interno" }, 500);
  }
});
