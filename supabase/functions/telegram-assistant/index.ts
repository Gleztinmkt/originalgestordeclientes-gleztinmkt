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

/* ── Timezone helper: always use Argentina (UTC-3) ── */
function nowArgentina(): Date {
  const utc = new Date();
  // Build a date object whose UTC methods return Argentina local values
  const offset = -3 * 60; // Argentina is UTC-3
  return new Date(utc.getTime() + offset * 60_000);
}

/** Returns YYYY-MM-DD in Argentina time */
function todayArgentinaStr(): string {
  const d = nowArgentina();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Returns components for Argentina "now" using UTC getters (since we shifted) */
function argentinaDateParts() {
  const d = nowArgentina();
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),     // 0-indexed
    date: d.getUTCDate(),
    day: d.getUTCDay(),          // 0=Sunday
  };
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

async function fetchDesigners() {
  const sb = getAdminClient();
  const { data, error } = await sb.from("designers").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

async function fetchPlanners() {
  const sb = getAdminClient();
  const { data, error } = await sb.from("planners").select("id, name").order("name");
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

  const { year, month, date } = argentinaDateParts();
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const lastPostStr = `${date} de ${months[month]}, ${year}`;

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
async function handleUpdatePlanning(clientId: string, month: number, status?: string, description?: string, planner?: string, completed?: boolean) {
  const sb = getAdminClient();
  const year = argentinaDateParts().year;
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01T03:00:00.000Z`;

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
  if (planner !== undefined) updateData.planner = planner;
  if (completed !== undefined) updateData.completed = completed;

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
        ...(planner !== undefined ? { planner } : {}),
        ...(completed !== undefined ? { completed } : {}),
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
  const planners = await fetchPlanners();
  const clientList = clients.map((c) => `- "${c.name}" (id: ${c.id})`).join("\n");
  const plannerList = planners.map((p) => `- "${p.name}"`).join("\n");

  const todayParts = argentinaDateParts();
  const todayStr = todayArgentinaStr();
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const todayDayName = dayNames[todayParts.day];

  const systemPrompt = `Sos un asistente para una agencia de marketing digital. Tu trabajo es interpretar mensajes del equipo y decidir qué acción tomar.

HOY ES: ${todayDayName} ${todayStr} (${todayParts.date} de ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][todayParts.month]} de ${todayParts.year})

FECHAS RELATIVAS: Calculá las fechas relativas basándote en la fecha de hoy:
- "hoy" = ${todayStr}
- "mañana" = un día después de hoy
- "pasado mañana" = dos días después de hoy
- "el lunes", "el martes", etc. = el próximo día de la semana mencionado
Siempre convertí a formato YYYY-MM-DD.

Lista de clientes activos:
${clientList}

FLUJO DE ESTADOS DE PRODUCCIÓN (en orden):
1. "Falta grabar" (needs_recording) — todavía no se grabó
2. "Falta editar" (needs_editing) — se grabó pero no se editó
3. "En edición" (in_editing) — el editor está trabajando
4. "En revisión/corrección" (in_review) — se mandó a revisar
5. "Aprobado" (approved) — listo, aprobado, pendiente de subir a redes
6. "Subido/Publicado" (is_published) — ya se subió a redes sociales

INTERPRETACIÓN SEMÁNTICA CLAVE:
- "pendientes de subir", "listas para subir", "para subir" = SOLO las APROBADAS (approved=true, is_published=false). Usá "list_approved" o "query_production" con status_filter="approved".
- "pendientes", "todas las pendientes", "lo que falta" = TODAS las que NO están subidas (is_published=false), sin importar en qué estado estén. Usá "identify_clients" o "query_production" con status_filter="all".
- "qué falta grabar" = needs_recording. "qué falta editar" = needs_editing. "en edición" = in_editing. "en revisión/corrección" = in_review.

CREAR PUBLICACIONES:
- Cuando el usuario pide crear/hacer/agregar una publicación para un cliente, usá la tool "create_publication".
- Si NO se menciona estado, el default es "needs_recording" (Falta grabar).
- Si NO se menciona tipo, intentá inferirlo: si dice "video" o "reel" → reel, si dice "carrusel" → carousel, si no → image.
- Si el usuario pide "sugerí un copy" o "generá un copy" o "recomienda un copy", activá suggest_copy: true.
- El campo "name" es el título de la publicación, intentá extraerlo del mensaje.

CREAR CLIENTES:
- Cuando el usuario pide crear/agregar un cliente nuevo, usá la tool "create_client".
- Los campos obligatorios son: nombre. Teléfono y día de pago son opcionales.
- Si el usuario no da algún dato, dejalo vacío/null.

AGREGAR PAQUETES:
- Cuando el usuario pide agregar un paquete/calendario a un cliente, usá la tool "add_package".
- Hay 4 tipos de paquetes: basico (8 publicaciones), avanzado (12), premium (16), personalizado (el usuario dice cuántas).
- Si el usuario dice "personalizado", preguntale cuántas publicaciones.
- El mes del paquete es obligatorio (ej: "marzo 2026").
- "pagado"/"pago" → paid=true. Default: false.

Según el mensaje del usuario, elegí UNA de estas herramientas:

1. "identify_clients" — cuando el usuario dice que publicó algo, quiere ver TODAS las publicaciones pendientes de un cliente, o menciona clientes para gestionar publicaciones.
2. "find_copy" — cuando el usuario pide el copy, copywriting, o texto de una publicación específica de un cliente.
3. "list_approved" — cuando el usuario pide publicaciones aprobadas/listas para subir de un cliente o en general. Ej: "¿qué tengo para subir de 4S?", "pendientes de subir".
4. "update_planning" — cuando el usuario quiere cambiar el estado de planificación de un cliente para un mes.
5. "query_production" — cuando el usuario pregunta por el estado de producción de un cliente filtrando por un estado específico. Ej: "¿qué falta grabar de Soledad?", "¿qué tiene aprobado Jacinto?", "pendientes de subir de 4S Motors".
6. "production_summary" — cuando el usuario pide un resumen general de producción de todos los clientes.
7. "query_packages" — cuando el usuario pregunta por el estado de paquetes.
8. "query_client_info" — cuando el usuario pregunta por la información de un cliente.
9. "filter_by_status" — cuando el usuario quiere filtrar publicaciones por un estado específico sin mencionar un cliente particular. Ej: "publicaciones en revisión", "lo que falta editar de todos".
10. "create_publication" — cuando el usuario quiere crear/agregar/hacer una nueva publicación para un cliente. Ej: "hacé una publicación para 4S Motors para el 17 de marzo".
11. "create_client" — cuando el usuario quiere crear/agregar un nuevo cliente. Ej: "agregá un cliente nuevo: Juan Pérez, tel 1155667788, paga el 15".
12. "add_package" — cuando el usuario quiere agregar un paquete/calendario a un cliente existente. Ej: "agregale un paquete básico a Juan para marzo".

PLANIFICADORES disponibles:
${plannerList || "(ninguno cargado)"}
Si el usuario menciona asignar un planificador a un cliente, incluí el campo "planner" con el nombre exacto del planificador.
Si dice "marcar como hecho/completado" la planificación, incluí completed: true. Si dice "desmarcar" o "pendiente", completed: false.

IMPORTANTE: Los nombres pueden estar abreviados, mal escritos o ser apodos. Hacé tu mejor esfuerzo para encontrar coincidencias.
Cuando el usuario pida cambiar planificación, detectá el mes mencionado (enero=1, febrero=2, etc.) y el estado deseado.
Si NO se menciona un mes específico, usá el mes actual: ${todayParts.month + 1} (${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][todayParts.month]}).
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
                  planner: { type: "string", description: "Nombre del planificador a asignar (solo si el usuario lo especifica)" },
                  completed: { type: "boolean", description: "Si marcar como completado (true) o pendiente (false)" },
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
              enum: ["needs_recording", "needs_editing", "in_editing", "in_review", "approved", "all"],
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
                
                type: { type: "string", enum: ["reel", "carousel", "image"] },
              },
            },
            description: { type: "string", description: "Descripción de lo que se busca" },
          },
          required: ["filters", "description"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_publication",
        description: "Crea una nueva publicación para un cliente. Ej: 'hacé una publicación para 4S Motors para el 17 de marzo con descripción video institucional'",
        parameters: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Nombre del cliente" },
            client_id: { type: "string", description: "ID UUID del cliente" },
            name: { type: "string", description: "Título/nombre de la publicación" },
            type: { type: "string", enum: ["reel", "carousel", "image"], description: "Tipo de publicación. Default: image" },
            date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
            description: { type: "string", description: "Descripción de la publicación" },
            copywriting: { type: "string", description: "Copywriting/texto para redes" },
            designer: { type: "string", description: "Nombre del diseñador asignado" },
            status: { type: "string", enum: ["needs_recording", "needs_editing", "in_editing", "in_review", "approved"], description: "Estado inicial. Default: needs_recording" },
            suggest_copy: { type: "boolean", description: "Si el usuario pide que se sugiera/genere un copy basado en publicaciones anteriores" },
          },
          required: ["client_name", "client_id", "name", "date"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_client",
        description: "Crea un nuevo cliente con nombre, teléfono y día de pago. Ej: 'agregá un cliente nuevo: Juan Pérez, tel 1155667788, paga el 15'",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre del cliente" },
            phone: { type: "string", description: "Teléfono del cliente" },
            payment_day: { type: "number", description: "Día de pago (1-31)" },
          },
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "add_package",
        description: "Agrega un paquete/calendario a un cliente existente. Tipos: basico (8 pub), avanzado (12), premium (16), personalizado (N pub)",
        parameters: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Nombre del cliente" },
            client_id: { type: "string", description: "ID UUID del cliente" },
            package_type: { type: "string", enum: ["basico", "avanzado", "premium", "personalizado"], description: "Tipo de paquete" },
            custom_publications: { type: "number", description: "Cantidad de publicaciones (solo para personalizado)" },
            month: { type: "string", description: "Mes del paquete. Ej: 'Marzo 2026'" },
            paid: { type: "boolean", description: "Si el paquete está pagado. Default: false" },
          },
          required: ["client_name", "client_id", "package_type", "month"],
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
          copywriting: p.copywriting || p.description || null,
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

    const statusKeys = ["needs_recording", "needs_editing", "in_editing", "in_review", "approved"];
    const statusLabels: Record<string, string> = {
      needs_recording: "Falta grabar",
      needs_editing: "Necesita edición",
      in_editing: "En edición",
      in_review: "En revisión",
      approved: "Aprobada",
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

  // ── create_publication ──
  if (fnName === "create_publication") {
    const clientId = args.client_id;
    const clientName = args.client_name;
    const pubName = args.name || "Sin título";
    const pubType = args.type || "image";
    const pubDate = args.date;
    const pubDescription = args.description || "";
    let pubCopywriting = args.copywriting || "";
    const pubDesigner = args.designer || null;
    const pubStatus = args.status || "needs_recording";
    const suggestCopy = args.suggest_copy || false;

    // Validate designer name (fuzzy match)
    let matchedDesigner: string | null = null;
    if (pubDesigner) {
      const designers = await fetchDesigners();
      const lowerDesigner = pubDesigner.toLowerCase();
      const match = designers.find((d) =>
        d.name.toLowerCase().includes(lowerDesigner) || lowerDesigner.includes(d.name.toLowerCase())
      );
      matchedDesigner = match ? match.name : pubDesigner;
    }

    // Suggest copy if requested
    if (suggestCopy && !pubCopywriting) {
      const sb = getAdminClient();
      const { data: recentPubs } = await sb
        .from("publications")
        .select("copywriting, name, description")
        .eq("client_id", clientId)
        .not("copywriting", "is", null)
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .limit(5);

      if (recentPubs?.length) {
        const examples = recentPubs
          .map((p) => `Título: ${p.name}\nCopy: ${p.copywriting}`)
          .join("\n---\n");

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
        const copyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Sos un copywriter de redes sociales. Generá un copy para una publicación basándote en el estilo de los ejemplos anteriores del mismo cliente. Incluí hashtags relevantes, datos de contacto y llamados a la acción si aparecen en los ejemplos. Respondé SOLO con el copy, sin explicaciones ni formato extra.`,
              },
              {
                role: "user",
                content: `Ejemplos de copy anteriores de ${clientName}:\n${examples}\n\nNueva publicación:\nTítulo: ${pubName}\nDescripción: ${pubDescription}\n\nGenerá un copy en el mismo estilo:`,
              },
            ],
          }),
        });

        if (copyResponse.ok) {
          const copyResult = await copyResponse.json();
          pubCopywriting = copyResult.choices?.[0]?.message?.content?.trim() || "";
        }
      }
    }

    // Build status flags
    const statusFlags: Record<string, boolean> = {
      needs_recording: false,
      needs_editing: false,
      in_editing: false,
      in_review: false,
      approved: false,
    };
    if (statusFlags.hasOwnProperty(pubStatus)) {
      statusFlags[pubStatus] = true;
    } else {
      statusFlags.needs_recording = true;
    }

    const statusLabels: Record<string, string> = {
      needs_recording: "Falta grabar",
      needs_editing: "Falta editar",
      in_editing: "En edición",
      in_review: "En revisión",
      approved: "Aprobado",
    };

    const proposedPub = {
      client_id: clientId,
      client_name: clientName,
      name: pubName,
      type: pubType,
      date: pubDate,
      description: pubDescription,
      copywriting: pubCopywriting,
      designer: matchedDesigner,
      status: pubStatus,
      status_label: statusLabels[pubStatus] || "Falta grabar",
      ...statusFlags,
    };

    return {
      accion: "publicacion_propuesta",
      mensaje_ia: `Propuesta de publicación para ${clientName}`,
      publicacion_propuesta: proposedPub,
    };
  }

  // ── create_client ──
  if (fnName === "create_client") {
    const clientName = args.name;
    const clientPhone = args.phone || null;
    const clientPaymentDay = args.payment_day || null;

    if (!clientName) {
      return { accion: "error", mensaje_ia: "El nombre del cliente es obligatorio." };
    }

    const proposal = {
      name: clientName,
      phone: clientPhone,
      payment_day: clientPaymentDay,
    };

    return {
      accion: "cliente_propuesto",
      mensaje_ia: `Propuesta de nuevo cliente`,
      cliente_propuesto: proposal,
    };
  }

  // ── add_package ──
  if (fnName === "add_package") {
    const clientId = args.client_id;
    const clientName = args.client_name;
    const packageType = args.package_type;
    const month = args.month;
    const paid = args.paid || false;

    const PACKAGE_TYPES: Record<string, { name: string; total: number }> = {
      basico: { name: "Paquete Básico", total: 8 },
      avanzado: { name: "Paquete Avanzado", total: 12 },
      premium: { name: "Paquete Premium", total: 16 },
      personalizado: { name: "Paquete Personalizado", total: args.custom_publications || 0 },
    };

    const pkgInfo = PACKAGE_TYPES[packageType] || PACKAGE_TYPES.basico;

    if (packageType === "personalizado" && !args.custom_publications) {
      return { accion: "error", mensaje_ia: "Para un paquete personalizado, necesito saber cuántas publicaciones incluye. Ej: 'paquete personalizado de 20 publicaciones'" };
    }

    const proposal = {
      client_id: clientId,
      client_name: clientName,
      package_name: pkgInfo.name,
      package_type: packageType,
      total_publications: pkgInfo.total,
      month,
      paid,
    };

    return {
      accion: "paquete_propuesto",
      mensaje_ia: `Propuesta de paquete para ${clientName}`,
      paquete_propuesto: proposal,
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

/* ── Telegram message splitting ── */
const BLOCK_SEP = "\n\u200B\n";

// deno-lint-ignore no-explicit-any
function splitTelegramMessages(text: string, reply_markup?: any): { mensajes: Array<{ text: string; reply_markup: any | null }> } {
  const MAX_LEN = 4000;
  if (text.length <= MAX_LEN) {
    return { mensajes: [{ text, reply_markup: reply_markup || null }] };
  }

  const blocks = text.split(BLOCK_SEP);
  // deno-lint-ignore no-explicit-any
  const mensajes: Array<{ text: string; reply_markup: any | null }> = [];
  let current = "";

  for (const block of blocks) {
    const joined = current ? current + "\n\n" + block : block;
    if (joined.length > MAX_LEN && current) {
      mensajes.push({ text: current.trim(), reply_markup: null });
      current = block;
    } else {
      current = joined;
    }
  }

  if (current.trim()) {
    mensajes.push({ text: current.trim(), reply_markup: reply_markup || null });
  }

  return { mensajes };
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ── Telegram Formatter ── */
// deno-lint-ignore no-explicit-any
async function formatForTelegram(result: any): Promise<{ mensajes: Array<{ text: string; reply_markup: any | null }> }> {
  const accion = result.accion;
  const statusEmoji: Record<string, string> = {
    needs_recording: "🔴",
    needs_editing: "🟠",
    in_editing: "🟡",
    in_review: "🔵",
    approved: "🟢",
  };
  const typeEmoji: Record<string, string> = { reel: "🎬", carousel: "📸", image: "🖼" };

  // Helper: format a publication line
  // deno-lint-ignore no-explicit-any
  const pubLine = (p: any) => {
    const t = typeEmoji[p.tipo] || typeEmoji[p.type] || "";
    const name = p.titulo || p.nombre || p.name || "";
    const dateStr = p.fecha || p.date || "";
    let d = "";
    try { d = new Date(dateStr).toLocaleDateString("es-AR"); } catch { d = dateStr; }
    return `  ${t} <b>${escHtml(name)}</b> — ${d}`;
  };

  // deno-lint-ignore no-explicit-any
  const pubDetail = (p: any) => {
    let s = pubLine(p);
    if (p.designer) s += `\n    🎨 ${escHtml(p.designer)}`;
    if (p.filming_time) s += `\n    ⏰ ${escHtml(p.filming_time)}`;
    return s;
  };

  const progressBar = (used: number, total: number) => {
    const pct = total > 0 ? Math.round((used / total) * 10) : 0;
    return "█".repeat(pct) + "░".repeat(10 - pct);
  };

  // ── identificar_clientes / listado_aprobados ──
  if (accion === "identificar_clientes" || accion === "listado_aprobados") {
    const clients = result.clientes || result.clientes_con_aprobados || [];
    let text = `📋 <b>${escHtml(result.mensaje_ia)}</b>\n`;
    const buttons: { text: string; callback_data: string }[][] = [];

    // deno-lint-ignore no-explicit-any
    for (let ci = 0; ci < clients.length; ci++) {
      const c = clients[ci];
      if (ci > 0) text += BLOCK_SEP;
      const pubs = c.publicaciones_pendientes || c.publicaciones || [];
      text += `\n👤 <b>${escHtml(c.nombre)}</b> (${pubs.length})\n`;
      // deno-lint-ignore no-explicit-any
      for (const p of pubs) {
        const copyText = p.copy_text || p.copywriting || "";
        text += pubLine(p) + "\n";
        if (copyText) {
          text += `<pre>${escHtml(copyText)}</pre>\n`;
        }
        // Individual button per publication
        const name = (p.titulo || p.nombre || "").substring(0, 20);
        buttons.push([{ text: `✅ ${name}`, callback_data: `pub_mark:${p.id}` }]);
      }
    }

    return splitTelegramMessages(text, buttons.length ? { inline_keyboard: buttons } : undefined);
  }

  // ── mostrar_copy ──
  if (accion === "mostrar_copy") {
    const pub = result.publicacion;
    const copyText = pub?.copywriting || pub?.descripcion || "";
    let text = `✍️ <b>${escHtml(result.mensaje_ia)}</b>\n\n`;
    if (copyText) {
      text += `<pre>${escHtml(copyText)}</pre>\n`;
    } else {
      text += "<i>No hay copy cargado</i>\n";
    }

    const buttons = [];
    if (pub?.id && result.puede_descontar) {
      buttons.push([{ text: "✅ Marcar como publicada", callback_data: `pub_mark:${pub.id}` }]);
    }
    return splitTelegramMessages(text, buttons.length ? { inline_keyboard: buttons } : undefined);
  }

  // ── planificacion_propuesta ──
  if (accion === "planificacion_propuesta" || accion === "planificacion_actualizada") {
    const months = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    let text = `📅 <b>${escHtml(result.mensaje_ia)}</b>\n\n`;
    const buttons = [];

    // deno-lint-ignore no-explicit-any
    for (let ui = 0; ui < (result.actualizaciones || []).length; ui++) {
      // deno-lint-ignore no-explicit-any
      const u = (result.actualizaciones || [])[ui] as any;
      if (ui > 0) text += BLOCK_SEP;
      const statusDot = u.status === "hacer" ? "🟢" : u.status === "no_hacer" ? "🔴" : "🟡";
      text += `${statusDot} <b>${escHtml(u.cliente)}</b> → ${months[u.mes] || u.mes}`;
      if (u.status) text += ` (${u.status})`;
      text += "\n";
      if (u.descripcion) text += `   📝 ${escHtml(u.descripcion)}\n`;

      if (u.client_id) {
        if (u.descripcion) {
          const sessId = await createSession({
            client_id: u.client_id, mes: u.mes, status: u.status || "hacer",
            descripcion: u.descripcion, action: "plan_confirm"
          });
          buttons.push([
            { text: `✅ Confirmar ${u.cliente}`, callback_data: `plan_sess:${sessId}` },
          ]);
        } else {
          buttons.push([
            { text: `✅ Confirmar ${u.cliente}`, callback_data: `plan_confirm:${u.client_id}:${u.mes}:${u.status || ""}` },
          ]);
        }
      }
    }

    if ((result.actualizaciones || []).length > 1) {
      // deno-lint-ignore no-explicit-any
      const allUpdates = (result.actualizaciones || []).map((u: any) => ({
        client_id: u.client_id, mes: u.mes, status: u.status || "", descripcion: u.descripcion || ""
      }));
      const sessId = await createSession({ updates: allUpdates, action: "plan_confirm_all" });
      buttons.push([{ text: "✅ Confirmar todas", callback_data: `plan_sess:${sessId}` }]);
    }

    return splitTelegramMessages(text, buttons.length ? { inline_keyboard: buttons } : undefined);
  }

  // ── planificacion_confirmada ──
  if (accion === "planificacion_confirmada") {
    return splitTelegramMessages(`✅ ${escHtml(result.mensaje_ia)}`);
  }

  // ── estado_produccion ──
  if (accion === "estado_produccion") {
    let text = `📊 <b>${escHtml(result.mensaje_ia)}</b>\n`;

    // deno-lint-ignore no-explicit-any
    for (let gi = 0; gi < (result.resumen_estados || []).length; gi++) {
      // deno-lint-ignore no-explicit-any
      const group = (result.resumen_estados || [])[gi] as any;
      if (gi > 0) text += BLOCK_SEP;
      const emoji = statusEmoji[group.estado_key] || "⚪";
      text += `\n${emoji} <b>${escHtml(group.estado)}</b> (${group.cantidad})\n`;
      // deno-lint-ignore no-explicit-any
      for (const p of (group.publicaciones || [])) {
        text += pubDetail(p) + "\n";
      }
    }

    // Individual buttons for ALL publications across all states (max 8 total)
    const buttons: { text: string; callback_data: string }[][] = [];
    const maxButtons = 8;
    // deno-lint-ignore no-explicit-any
    for (const group of (result.resumen_estados || [])) {
      if (buttons.length >= maxButtons) break;
      // deno-lint-ignore no-explicit-any
      for (const p of (group.publicaciones || [])) {
        if (buttons.length >= maxButtons) break;
        const emoji = statusEmoji[group.estado_key] || "⚪";
        const name = (p.nombre || p.name || "").substring(0, 20);
        buttons.push([{ text: `${emoji} ${name}`, callback_data: `pub_mark:${p.id}` }]);
      }
    }

    return splitTelegramMessages(text, buttons.length ? { inline_keyboard: buttons } : undefined);
  }

  // ── resumen_produccion ──
  if (accion === "resumen_produccion") {
    let text = `📊 <b>${escHtml(result.mensaje_ia)}</b>\n\n`;

    if (result.resumen_global?.length) {
      // deno-lint-ignore no-explicit-any
      for (const s of result.resumen_global) {
        const emoji = statusEmoji[s.estado_key] || "⚪";
        text += `${emoji} ${escHtml(s.estado)}: <b>${s.cantidad}</b>\n`;
      }
    }

    if (result.resumen_clientes?.length) {
      text += BLOCK_SEP;
      text += `\n👥 <b>Por cliente:</b>\n`;
      for (const c of result.resumen_clientes) {
        // deno-lint-ignore no-explicit-any
        const statuses = c.estados.map((e: any) => `${statusEmoji[e.estado_key] || "⚪"}${e.cantidad}`).join(" ");
        text += `👤 <b>${escHtml(c.nombre)}</b>  ${statuses}\n`;
      }
    }

    return splitTelegramMessages(text);
  }

  // ── estado_paquetes ──
  if (accion === "estado_paquetes") {
    let text = `📦 <b>${escHtml(result.mensaje_ia)}</b>\n`;

    if (result.resumen) {
      text += `\n<b>Total:</b> ${progressBar(result.resumen.usadas, result.resumen.total)} ${result.resumen.usadas}/${result.resumen.total}\n`;
      text += `Restantes: <b>${result.resumen.restantes}</b>\n`;
    }

    // deno-lint-ignore no-explicit-any
    for (let pi = 0; pi < (result.paquetes || []).length; pi++) {
      // deno-lint-ignore no-explicit-any
      const pkg = (result.paquetes || [])[pi] as any;
      if (pi > 0) text += BLOCK_SEP;
      text += `\n📦 <b>${escHtml(pkg.nombre)}</b>`;
      if (pkg.mes) text += ` (${escHtml(pkg.mes)})`;
      text += "\n";
      text += `${progressBar(pkg.usadas, pkg.total)} ${pkg.usadas}/${pkg.total}\n`;
      text += `Restantes: <b>${pkg.restantes}</b>`;
      if (pkg.pagado !== undefined) text += ` · ${pkg.pagado ? "✅ Pagado" : "❌ Sin pagar"}`;
      text += "\n";
    }

    if (result.paquetes?.[0]?.ultimo_post) {
      text += `\n📅 Último post: ${escHtml(result.paquetes[0].ultimo_post)}`;
    }

    return splitTelegramMessages(text);
  }

  // ── info_cliente ──
  if (accion === "info_cliente") {
    const c = result.cliente || {};
    let text = `👤 <b>Información de ${escHtml(c.nombre || "")}</b>\n\n`;

    if (c.telefono) text += `📱 <b>Teléfono:</b> ${escHtml(c.telefono)}\n`;
    if (c.instagram) text += `📸 <b>Instagram:</b> ${escHtml(c.instagram)}\n`;
    if (c.facebook) text += `📘 <b>Facebook:</b> ${escHtml(c.facebook)}\n`;
    if (c.ultimo_post) text += `📅 <b>Último post:</b> ${escHtml(c.ultimo_post)}\n`;

    if (c.info_general) {
      text += BLOCK_SEP;
      text += `📝 <b>Info general:</b>\n${escHtml(c.info_general)}\n`;
    }
    if (c.branding) {
      text += BLOCK_SEP;
      text += `🎨 <b>Branding:</b>\n${escHtml(c.branding)}\n`;
    }
    if (c.marketing_info) {
      text += BLOCK_SEP;
      text += `📈 <b>Marketing:</b>\n${escHtml(c.marketing_info)}\n`;
    }

    if (Array.isArray(c.reuniones) && c.reuniones.length > 0) {
      text += BLOCK_SEP;
      text += `📋 <b>Reuniones:</b>\n`;
      // deno-lint-ignore no-explicit-any
      for (const r of c.reuniones) {
        if (typeof r === "object" && r.date) {
          text += `  • ${escHtml(r.date)}${r.notes ? ": " + escHtml(r.notes) : ""}\n`;
        } else {
          text += `  • ${escHtml(typeof r === "string" ? r : JSON.stringify(r))}\n`;
        }
      }
    }

    if (Array.isArray(c.horarios_publicacion) && c.horarios_publicacion.length > 0) {
      text += BLOCK_SEP;
      text += `⏰ <b>Horarios:</b>\n`;
      // deno-lint-ignore no-explicit-any
      for (const h of c.horarios_publicacion) {
        if (typeof h === "object" && h.day) {
          text += `  • ${escHtml(h.day)}${h.time ? " " + escHtml(h.time) : ""}\n`;
        } else {
          text += `  • ${escHtml(typeof h === "string" ? h : JSON.stringify(h))}\n`;
        }
      }
    }

    return splitTelegramMessages(text);
  }

  // ── filtro_estado ──
  if (accion === "filtro_estado") {
    let text = `🔍 <b>${escHtml(result.mensaje_ia)}</b>\n`;

    // deno-lint-ignore no-explicit-any
    for (let ci = 0; ci < (result.clientes || []).length; ci++) {
      // deno-lint-ignore no-explicit-any
      const c = (result.clientes || [])[ci] as any;
      if (ci > 0) text += BLOCK_SEP;
      text += `\n👤 <b>${escHtml(c.nombre)}</b> (${c.publicaciones?.length || 0})\n`;
      // deno-lint-ignore no-explicit-any
      for (const p of (c.publicaciones || [])) {
        text += pubDetail(p) + "\n";
      }
    }

    return splitTelegramMessages(text);
  }

  // ── marcar_publicadas ──
  if (accion === "marcar_publicadas") {
    return splitTelegramMessages(`✅ ${escHtml(result.mensaje || result.mensaje_ia || "Publicaciones actualizadas")}`);
  }

  // ── confirmar_publicaciones ──
  if (accion === "confirmar_publicaciones") {
    let text = `📋 <b>${escHtml(result.mensaje_ia)}</b>\n\n`;
    // deno-lint-ignore no-explicit-any
    for (let pi = 0; pi < (result.publicaciones || []).length; pi++) {
      // deno-lint-ignore no-explicit-any
      const p = (result.publicaciones || [])[pi] as any;
      if (pi > 0) text += BLOCK_SEP;
      text += pubLine(p) + `\n    👤 ${escHtml(p.cliente || "")}\n`;
    }

    const buttons = [];
    // deno-lint-ignore no-explicit-any
    const ids = (result.publicaciones || []).map((p: any) => p.id);
    if (ids.length) {
      const rawData = `pub_mark_all:${ids.join(",")}`;
      if (rawData.length <= 64) {
        buttons.push([{ text: `✅ Confirmar y publicar (${ids.length})`, callback_data: rawData }]);
      } else {
        const sessId = await createSession({ ids, action: "pub_mark_all" });
        buttons.push([{ text: `✅ Confirmar y publicar (${ids.length})`, callback_data: `pub_sess:${sessId}` }]);
      }
    }

    return splitTelegramMessages(text, buttons.length ? { inline_keyboard: buttons } : undefined);
  }

  // ── publicacion_propuesta ──
  if (accion === "publicacion_propuesta") {
    const pub = result.publicacion_propuesta || {};
    const typeEmojis: Record<string, string> = { reel: "🎬", carousel: "📸", image: "🖼" };
    let text = `📝 <b>${escHtml(result.mensaje_ia)}</b>\n\n`;
    text += `${typeEmojis[pub.type] || "🖼"} <b>Título:</b> ${escHtml(pub.name || "")}\n`;
    text += `📅 <b>Fecha:</b> ${pub.date || ""}\n`;
    text += `📂 <b>Tipo:</b> ${pub.type || "image"}\n`;
    text += `📊 <b>Estado:</b> ${escHtml(pub.status_label || "Falta grabar")}\n`;
    if (pub.designer) text += `🎨 <b>Diseñador:</b> ${escHtml(pub.designer)}\n`;
    if (pub.description) text += `\n📝 <b>Descripción:</b>\n${escHtml(pub.description)}\n`;
    if (pub.copywriting) text += `\n✍️ <b>Copywriting:</b>\n<pre>${escHtml(pub.copywriting)}</pre>\n`;

    text += `\n¿Confirmar creación?`;

    const sessId = await createSession({ publication: pub, action: "create_publication" });
    const buttons = [
      [{ text: "✅ Confirmar", callback_data: `create_pub_confirm:${sessId}` }],
      [{ text: "❌ Cancelar", callback_data: "cancel" }],
    ];

    return splitTelegramMessages(text, { inline_keyboard: buttons });
  }

  // ── publicacion_creada ──
  if (accion === "publicacion_creada") {
    return splitTelegramMessages(`✅ ${escHtml(result.mensaje_ia || "Publicación creada exitosamente")}`);
  }

  // ── cliente_propuesto ──
  if (accion === "cliente_propuesto") {
    const c = result.cliente_propuesto || {};
    let text = `👤 <b>${escHtml(result.mensaje_ia)}</b>\n\n`;
    text += `📛 <b>Nombre:</b> ${escHtml(c.name || "")}\n`;
    if (c.phone) text += `📱 <b>Teléfono:</b> ${escHtml(c.phone)}\n`;
    if (c.payment_day) text += `💰 <b>Día de pago:</b> ${c.payment_day}\n`;
    text += `\n¿Confirmar creación del cliente?`;

    const sessId = await createSession({ client: c, action: "create_client" });
    const buttons = [
      [{ text: "✅ Confirmar", callback_data: `create_client_confirm:${sessId}` }],
      [{ text: "❌ Cancelar", callback_data: "cancel" }],
    ];
    return splitTelegramMessages(text, { inline_keyboard: buttons });
  }

  // ── cliente_creado ──
  if (accion === "cliente_creado") {
    let text = `✅ ${escHtml(result.mensaje_ia || "Cliente creado exitosamente")}`;
    const buttons: { text: string; callback_data: string }[][] = [];

    if (result.cliente_id) {
      const sessId = await createSession({
        action: "create_drive_folders",
        client_id: result.cliente_id,
        client_name: result.cliente_nombre || "",
      });
      buttons.push([{ text: "📁 Crear carpetas en Drive", callback_data: `drive_folders:${sessId}` }]);
    }

    return splitTelegramMessages(text, buttons.length ? { inline_keyboard: buttons } : undefined);
  }

  // ── carpetas_drive_creadas ──
  if (accion === "carpetas_drive_creadas") {
    let text = `✅ ${escHtml(result.mensaje_ia || "Carpetas creadas")}`;
    if (result.url) {
      text += `\n\n📂 <a href="${escHtml(result.url)}">Abrir en Drive →</a>`;
    }
    if (result.urlBranding) {
      text += `\n🎨 Link de branding guardado automáticamente`;
    }
    return splitTelegramMessages(text);
  }

  // ── carpetas_drive_error ──
  if (accion === "carpetas_drive_error") {
    return splitTelegramMessages(`❌ ${escHtml(result.mensaje_ia || "Error al crear carpetas")}`);
  }

  // ── paquete_propuesto ──
  if (accion === "paquete_propuesto") {
    const p = result.paquete_propuesto || {};
    let text = `📦 <b>${escHtml(result.mensaje_ia)}</b>\n\n`;
    text += `👤 <b>Cliente:</b> ${escHtml(p.client_name || "")}\n`;
    text += `📦 <b>Paquete:</b> ${escHtml(p.package_name || "")}\n`;
    text += `📊 <b>Publicaciones:</b> ${p.total_publications}\n`;
    text += `📅 <b>Mes:</b> ${escHtml(p.month || "")}\n`;
    text += `💰 <b>Pagado:</b> ${p.paid ? "Sí ✅" : "No ❌"}\n`;
    text += `\n¿Confirmar agregado del paquete?`;

    const sessId = await createSession({ package: p, action: "add_package" });
    const buttons = [
      [{ text: "✅ Confirmar", callback_data: `add_pkg_confirm:${sessId}` }],
      [{ text: "❌ Cancelar", callback_data: "cancel" }],
    ];
    return splitTelegramMessages(text, { inline_keyboard: buttons });
  }

  // ── paquete_agregado ──
  if (accion === "paquete_agregado") {
    return splitTelegramMessages(`✅ ${escHtml(result.mensaje_ia || "Paquete agregado exitosamente")}`);
  }

  // ── error / no_encontrado / fallback ──
  const msg = result.mensaje_ia || result.error || result.mensaje || "Sin respuesta";
  const icon = accion === "error" ? "❌" : "ℹ️";
  return splitTelegramMessages(`${icon} ${escHtml(msg)}`);
}

/* ── Session helpers for Telegram callback_data (64 byte limit) ── */
function generateSessionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "s_";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function createSession(data: unknown): Promise<string> {
  const sb = getAdminClient();
  const id = generateSessionId();
  const { error } = await sb.from("telegram_sessions").insert({ id, data });
  if (error) {
    console.error("Failed to create telegram session:", error);
    throw error;
  }
  return id;
}

async function resolveSession(sessionId: string): Promise<unknown | null> {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("telegram_sessions")
    .select("data")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) { console.error("Failed to resolve session:", error); return null; }
  return data?.data ?? null;
}

/* ── Create Drive folders helper ── */
async function createDriveFolders(clientId: string, clientName: string) {
  const scriptUrl = "https://script.google.com/macros/s/AKfycbyahM4qzOdRWIC1Sr3Xh1IArjk0BR1BKfzzFXKVESL1ovEEwV7NA-Wp7C75RP4ygCvovw/exec";

  const response = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify({ nombreCliente: clientName }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || data.message || "Error al crear carpetas en Drive");
  }

  // Save branding URL to client
  if (data.urlBranding) {
    const sb = getAdminClient();
    const { data: client } = await sb
      .from("clients")
      .select("client_info")
      .eq("id", clientId)
      .single();

    // deno-lint-ignore no-explicit-any
    const clientInfo = (client?.client_info as any) || {};
    const updatedInfo = {
      ...clientInfo,
      generalInfo: clientInfo.generalInfo || "",
      meetings: clientInfo.meetings || [],
      socialNetworks: clientInfo.socialNetworks || [],
      publicationSchedule: clientInfo.publicationSchedule || [],
      branding: data.urlBranding,
    };

    await sb
      .from("clients")
      .update({ client_info: updatedInfo })
      .eq("id", clientId);
  }

  return {
    accion: "carpetas_drive_creadas",
    mensaje_ia: `✅ Carpetas de Drive creadas para "${clientName}"`,
    url: data.url || null,
    urlBranding: data.urlBranding || null,
    ok: true,
  };
}

/* ── Insert client helper ── */
async function insertClient(proposal: { name: string; phone?: string | null; payment_day?: number | null }) {
  const sb = getAdminClient();
  const { data: existingClient } = await sb.from("clients").select("agency_id").limit(1).maybeSingle();
  const agencyId = existingClient?.agency_id || null;

  const { data, error } = await sb.from("clients").insert({
    name: proposal.name,
    phone: proposal.phone || null,
    payment_day: proposal.payment_day || null,
    agency_id: agencyId,
  }).select("id, name").single();
  if (error) throw error;

  return {
    accion: "cliente_creado",
    mensaje_ia: `✅ Cliente "${data.name}" creado exitosamente`,
    cliente_id: data.id,
    cliente_nombre: data.name,
    ok: true,
  };
}

/* ── Add package to client helper ── */
// deno-lint-ignore no-explicit-any
async function addPackageToClient(proposal: any) {
  const sb = getAdminClient();
  const { data: client, error: clientErr } = await sb
    .from("clients")
    .select("packages")
    .eq("id", proposal.client_id)
    .single();
  if (clientErr) throw clientErr;

  const { packages } = parseClientPackages(client?.packages);
  const newPackage = {
    id: crypto.randomUUID(),
    name: proposal.package_name,
    month: proposal.month,
    totalPublications: String(proposal.total_publications),
    usedPublications: "0",
    paid: proposal.paid || false,
    isSplitPayment: false,
    firstHalfPaid: false,
    secondHalfPaid: false,
    last_update: null,
  };
  packages.push(newPackage);

  const { error: updateErr } = await sb
    .from("clients")
    .update({ packages })
    .eq("id", proposal.client_id);
  if (updateErr) throw updateErr;

  return {
    accion: "paquete_agregado",
    mensaje_ia: `✅ ${proposal.package_name} (${proposal.total_publications} publicaciones) agregado a ${proposal.client_name} para ${proposal.month}`,
    ok: true,
  };
}

/* ── Insert publication helper ── */
// deno-lint-ignore no-explicit-any
async function insertPublication(pub: any) {
  const sb = getAdminClient();

  const statusFlags: Record<string, boolean> = {
    needs_recording: false,
    needs_editing: false,
    in_editing: false,
    in_review: false,
    approved: false,
  };
  const status = pub.status || "needs_recording";
  if (statusFlags.hasOwnProperty(status)) {
    statusFlags[status] = true;
  } else {
    statusFlags.needs_recording = true;
  }

  // Auto-assign to the newest package of the client
  let packageId: string | null = null;
  if (pub.client_id) {
    const { data: client } = await sb
      .from("clients")
      .select("packages")
      .eq("id", pub.client_id)
      .single();

    const { packages } = parseClientPackages(client?.packages);
    if (packages.length > 0) {
      // Last package in the array = newest
      const newestPkg = packages[packages.length - 1];
      packageId = newestPkg.id || null;
    }
  }

  const insertData = {
    client_id: pub.client_id,
    name: pub.name || "Sin título",
    type: pub.type || "image",
    date: new Date(pub.date).toISOString(),
    description: pub.description || null,
    copywriting: pub.copywriting || null,
    designer: pub.designer || null,
    package_id: packageId,
    needs_recording: statusFlags.needs_recording,
    needs_editing: statusFlags.needs_editing,
    in_editing: statusFlags.in_editing,
    in_review: statusFlags.in_review,
    approved: statusFlags.approved,
    is_published: false,
  };

  const { data, error } = await sb.from("publications").insert(insertData).select("id, name").single();
  if (error) throw error;

  return {
    accion: "publicacion_creada",
    mensaje_ia: `✅ Publicación "${data.name}" creada para ${pub.client_name || "el cliente"}`,
    publicacion_id: data.id,
    ok: true,
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
    const format = body.format ?? null; // "telegram" for formatted output

    // Helper: optionally format for Telegram
    // deno-lint-ignore no-explicit-any
    const respond = async (result: any) => {
      if (format === "telegram") {
        const tg = await formatForTelegram(result);
        return json({ ...result, telegram: tg });
      }
      return json(result);
    };

    // ── Telegram callback handler ──
    if (accion === "telegram_callback") {
      const callbackData = body.callback_data ?? "";
      if (!callbackData) return json({ error: "callback_data es requerido" }, 400);

      let result;

      // pub_mark:{id} — show full publication detail + confirmation buttons
      if (callbackData.startsWith("pub_mark:") && !callbackData.startsWith("pub_mark_confirm:")) {
        const pubId = callbackData.replace("pub_mark:", "");
        const sb = getAdminClient();
        const { data: pubData, error: pubErr } = await sb
          .from("publications")
          .select("id, name, type, date, description, copywriting, client_id, designer, needs_recording, needs_editing, in_editing, in_review, approved, status")
          .eq("id", pubId)
          .is("deleted_at", null)
          .maybeSingle();
        if (pubErr || !pubData) return json({ error: "Publicación no encontrada" }, 400);

        const typeEmojis: Record<string, string> = { reel: "🎬", carousel: "📸", image: "🖼" };
        const typeLabel = typeEmojis[pubData.type] || "🖼";
        const dateStr = pubData.date ? new Date(pubData.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha";

        let statusLabel = "Pendiente";
        if (pubData.needs_recording) statusLabel = "Falta grabar";
        else if (pubData.needs_editing) statusLabel = "Falta editar";
        else if (pubData.in_editing) statusLabel = "En edición";
        else if (pubData.in_review) statusLabel = "En revisión";
        else if (pubData.approved) statusLabel = "Aprobado";

        let text = `${typeLabel} <b>${escHtml(pubData.name)}</b>\n\n`;
        text += `📂 <b>Tipo:</b> ${pubData.type || "image"}\n`;
        text += `📅 <b>Fecha:</b> ${dateStr}\n`;
        text += `📊 <b>Estado:</b> ${statusLabel}\n`;
        if (pubData.designer) text += `🎨 <b>Diseñador:</b> ${escHtml(pubData.designer)}\n`;
        if (pubData.description) text += `\n📝 <b>Descripción:</b>\n${escHtml(pubData.description)}\n`;
        if (pubData.copywriting) text += `\n✍️ <b>Copywriting:</b>\n<pre>${escHtml(pubData.copywriting)}</pre>\n`;
        else text += `\n✍️ <b>Copywriting:</b> (Sin copywriting)\n`;

        text += `\n¿Marcar como publicada?`;

        const tg = splitTelegramMessages(text, {
          inline_keyboard: [
            [{ text: "✅ Marcar como publicada", callback_data: `pub_mark_confirm:${pubId}` }],
            [{ text: "❌ Cancelar", callback_data: "cancel" }],
          ],
        });
        result = { accion: "mostrar_detalle_pub", publicacion: pubData.name, telegram: tg };
        return json(result);
      }
      // pub_mark_confirm:{id} — actually mark as published
      if (callbackData.startsWith("pub_mark_confirm:")) {
        const pubId = callbackData.replace("pub_mark_confirm:", "");
        result = await markPublished([pubId]);
        result = { accion: "marcar_publicadas", ...result };
      }
      // pub_mark_all:{id1},{id2},... — mark multiple publications
      else if (callbackData.startsWith("pub_mark_all:")) {
        const ids = callbackData.replace("pub_mark_all:", "").split(",").filter(Boolean);
        if (!ids.length) return json({ error: "No hay IDs de publicaciones" }, 400);
        result = await markPublished(ids);
        result = { accion: "marcar_publicadas", ...result };
      }
      // plan_confirm:{client_id}:{month}:{status} — confirm single planning (no description)
      else if (callbackData.startsWith("plan_confirm:")) {
        const parts = callbackData.replace("plan_confirm:", "").split(":");
        const [clientId, monthStr, status] = parts;
        const month = parseInt(monthStr);
        if (!clientId || !month) return json({ error: "Datos de planificación inválidos" }, 400);
        await handleUpdatePlanning(clientId, month, status || "hacer");
        result = {
          accion: "planificacion_confirmada",
          mensaje_ia: `Planificación confirmada exitosamente`,
          ok: true,
        };
      }
      // plan_confirm_all:{client_id}:{month}:{status}|{client_id}:{month}:{status}|...
      else if (callbackData.startsWith("plan_confirm_all:")) {
        const entries = callbackData.replace("plan_confirm_all:", "").split("|");
        let count = 0;
        for (const entry of entries) {
          const [clientId, monthStr, status] = entry.split(":");
          const month = parseInt(monthStr);
          if (clientId && month) {
            await handleUpdatePlanning(clientId, month, status || "hacer");
            count++;
          }
        }
        result = {
          accion: "planificacion_confirmada",
          mensaje_ia: `${count} planificación(es) confirmada(s) exitosamente`,
          ok: true,
        };
      }
      // pub_sess:{session_id} — resolve session for bulk pub mark
      else if (callbackData.startsWith("pub_sess:")) {
        const sessId = callbackData.replace("pub_sess:", "");
        const sessData = await resolveSession(sessId) as { ids?: string[] } | null;
        if (!sessData?.ids?.length) return json({ error: "Sesión expirada o inválida. Volvé a consultar." }, 400);
        result = await markPublished(sessData.ids);
        result = { accion: "marcar_publicadas", ...result };
      }
      // plan_sess:{session_id} — resolve session for single or bulk plan confirm (supports descriptions)
      else if (callbackData.startsWith("plan_sess:")) {
        const sessId = callbackData.replace("plan_sess:", "");
        const sessData = await resolveSession(sessId) as {
          action?: string;
          updates?: { client_id: string; mes: number; status: string; descripcion?: string }[];
          client_id?: string; mes?: number; status?: string; descripcion?: string;
        } | null;
        if (!sessData) return json({ error: "Sesión expirada o inválida. Volvé a consultar." }, 400);

        // Single planning confirm with description
        if (sessData.action === "plan_confirm" && sessData.client_id && sessData.mes) {
          await handleUpdatePlanning(sessData.client_id, sessData.mes, sessData.status || "hacer", sessData.descripcion);
          result = {
            accion: "planificacion_confirmada",
            mensaje_ia: `Planificación confirmada exitosamente`,
            ok: true,
          };
        }
        // Bulk planning confirm
        else if (sessData.updates?.length) {
          let count = 0;
          for (const u of sessData.updates) {
            if (u.client_id && u.mes) {
              await handleUpdatePlanning(u.client_id, u.mes, u.status || "hacer", u.descripcion);
              count++;
            }
          }
          result = {
            accion: "planificacion_confirmada",
            mensaje_ia: `${count} planificación(es) confirmada(s) exitosamente`,
            ok: true,
          };
        } else {
          return json({ error: "Sesión expirada o inválida. Volvé a consultar." }, 400);
        }
      }
      // create_pub_confirm:{session_id} — confirm and insert publication
      else if (callbackData.startsWith("create_pub_confirm:")) {
        const sessId = callbackData.replace("create_pub_confirm:", "");
        const sessData = await resolveSession(sessId) as { publication?: Record<string, unknown> } | null;
        if (!sessData?.publication) return json({ error: "Sesión expirada o inválida. Volvé a consultar." }, 400);
        result = await insertPublication(sessData.publication);
      }
      // create_client_confirm:{session_id} — confirm and insert client
      else if (callbackData.startsWith("create_client_confirm:")) {
        const sessId = callbackData.replace("create_client_confirm:", "");
        const sessData = await resolveSession(sessId) as { client?: Record<string, unknown> } | null;
        if (!sessData?.client) return json({ error: "Sesión expirada o inválida. Volvé a consultar." }, 400);
        result = await insertClient(sessData.client as { name: string; phone?: string | null; payment_day?: number | null });
      }
      // add_pkg_confirm:{session_id} — confirm and add package
      else if (callbackData.startsWith("add_pkg_confirm:")) {
        const sessId = callbackData.replace("add_pkg_confirm:", "");
        const sessData = await resolveSession(sessId) as { package?: Record<string, unknown> } | null;
        if (!sessData?.package) return json({ error: "Sesión expirada o inválida. Volvé a consultar." }, 400);
        result = await addPackageToClient(sessData.package);
      }
      // drive_folders:{session_id} — create Drive folders for a client
      else if (callbackData.startsWith("drive_folders:")) {
        const sessId = callbackData.replace("drive_folders:", "");
        const sessData = await resolveSession(sessId) as { client_id?: string; client_name?: string } | null;
        if (!sessData?.client_id || !sessData?.client_name) return json({ error: "Sesión expirada o inválida." }, 400);
        try {
          result = await createDriveFolders(sessData.client_id, sessData.client_name);
        } catch (e) {
          result = {
            accion: "carpetas_drive_error",
            mensaje_ia: e?.message || "Error al crear carpetas en Drive",
          };
        }
      }
      // cancel — user cancelled action
      else if (callbackData === "cancel") {
        const tg = splitTelegramMessages("❌ Acción cancelada.");
        return json({ accion: "cancelado", telegram: tg });
      }
      else {
        return json({ error: `callback_data no reconocido: ${callbackData}` }, 400);
      }

      const tg = await formatForTelegram(result);
      return json({ ...result, telegram: tg });
    }

    // Explicit actions
    if (accion === "listado_aprobados") {
      return await respond(await handleListadoAprobados());
    }

    if (accion === "confirmar_publicaciones") {
      const ids = body.publicaciones_ids ?? [];
      if (!ids.length) return json({ error: "publicaciones_ids es requerido" }, 400);
      return await respond(await handleConfirmarPublicaciones(ids));
    }

    if (accion === "marcar_publicadas" || accion === "confirmar") {
      const ids = body.publicaciones_ids ?? body.publicacion_ids ?? [];
      if (!ids.length) return json({ error: "publicaciones_ids es requerido" }, 400);
      const discountCount = body.cantidad_descontar ?? undefined;
      const result = await markPublished(ids, discountCount);
      return await respond({ accion: "marcar_publicadas", ...result });
    }

    if (accion === "actualizar_planificacion") {
      const { client_id, month, status, description } = body;
      if (!client_id || !month) return json({ error: "client_id y month son requeridos" }, 400);
      const result = await handleUpdatePlanning(client_id, month, status, description);
      return await respond({ accion: "planificacion_actualizada", ...result });
    }

    if (accion === "confirmar_planificacion") {
      const updates = body.updates ?? [];
      if (!updates.length) return json({ error: "updates es requerido" }, 400);
      for (const u of updates) {
        await handleUpdatePlanning(u.client_id, u.month, u.status, u.description);
      }
      return await respond({
        accion: "planificacion_confirmada",
        mensaje_ia: `${updates.length} planificación(es) confirmada(s) exitosamente`,
        ok: true,
      });
    }

    if (accion === "confirmar_crear_publicacion") {
      const pub = body.publicacion_propuesta;
      if (!pub) return json({ error: "publicacion_propuesta es requerido" }, 400);
      const result = await insertPublication(pub);
      return await respond(result);
    }

    // Natural language message → AI interpretation
    const mensaje = body.mensaje;
    if (mensaje && typeof mensaje === "string") {
      const result = await interpretMessage(mensaje);
      return await respond(result);
    }

    return json({
      error: "Enviá un campo 'mensaje' con texto natural o un campo 'accion' explícito",
      acciones_disponibles: [
        "mensaje (texto natural → IA interpreta)",
        "listado_aprobados",
        "confirmar_publicaciones { publicaciones_ids: [...] }",
        "marcar_publicadas { publicaciones_ids: [...], cantidad_descontar: N }",
        "actualizar_planificacion { client_id, month, status, description }",
        "confirmar_planificacion { updates: [...] }",
        "confirmar_crear_publicacion { publicacion_propuesta: {...} }",
      ],
    }, 400);
  } catch (e) {
    console.error("telegram-assistant error:", e);
    return json({ error: e?.message || "Error interno" }, 500);
  }
});
