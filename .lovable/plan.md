

# Plan: Edge Function `telegram-assistant` + Botón Asistente IA + Todos los casos de uso

## Resumen

Crear la Edge Function `telegram-assistant` que no existía aún, con todos los casos de uso aprobados previamente más el nuevo (`listado_aprobados`, `confirmar_publicaciones`, `marcar_publicadas`). También crear el componente `AssistantDialog` en el frontend.

## Parte 1 — Edge Function `supabase/functions/telegram-assistant/index.ts`

**Autenticación dual**: acepta `x-api-key` (Telegram/n8n) O `Authorization: Bearer` (frontend)

**Acciones basadas en el campo `accion` del body:**

### Acciones que usan IA (no requieren `accion` explícita — se envía `mensaje`):
- **Mensaje natural sin `accion`**: `{ "mensaje": "publiqué jacinto y glúteos" }` o `{ "mensaje": "dame el copy del video del retiro de casa del sol" }`
  - Llama a Lovable AI Gateway (`google/gemini-3-flash-preview`) con tools:
    - `identify_clients`: detecta clientes mencionados → busca publicaciones pendientes → responde con `accion: "identificar_clientes"`
    - `find_copy`: busca copy de una publicación específica → responde con `accion: "mostrar_copy"`
    - `list_approved`: cuando detecta intención de listar aprobados → responde con `accion: "listado_aprobados"`
  - Si no encuentra nada: `accion: "no_encontrado"`

### Acciones explícitas (n8n envía `accion` directamente):
- **`listado_aprobados`**: `{ "accion": "listado_aprobados" }`
  - Query: publications donde `approved = true` AND `is_published = false` AND `deleted_at IS NULL`
  - Agrupa por cliente, devuelve con `tiene_copy: boolean` por cada publicación

- **`confirmar_publicaciones`**: `{ "accion": "confirmar_publicaciones", "publicaciones_ids": [...] }`
  - Devuelve copy/descripción de cada publicación seleccionada
  - Incluye `puede_descontar: true` para que n8n pregunte si marcar como publicada

- **`marcar_publicadas`**: `{ "accion": "marcar_publicadas", "publicaciones_ids": [...] }`
  - Marca cada publicación como `is_published = true`, `status = "published"`
  - Descuenta 1 del paquete activo por cada cliente (reutiliza lógica de `telegram-api`)
  - Actualiza `last_post` del cliente

- **`confirmar`** (del plan anterior): `{ "accion": "confirmar", "publicacion_ids": [...] }` — alias de `marcar_publicadas`

**Respuesta siempre incluye campo `accion`.**

## Parte 2 — Config

Agregar en `supabase/config.toml`:
```toml
[functions.telegram-assistant]
verify_jwt = false
```

## Parte 3 — Frontend: `src/components/client/AssistantDialog.tsx`

- Botón con ícono `Bot` (lucide) junto a `BulkMessageButton` en `ClientList.tsx`
- Dialog con input de texto + botón "Consultar"
- Llama a `telegram-assistant` via `supabase.functions.invoke`
- Renderiza según `accion` de la respuesta:
  - `identificar_clientes`: lista de clientes con publicaciones pendientes + checkboxes + botón "Confirmar"
  - `mostrar_copy`: muestra copy + botón "¿Marcar como publicada?"
  - `listado_aprobados`: lista agrupada por cliente con checkboxes + botón "Marcar seleccionadas como publicadas"
  - `no_encontrado`: mensaje de la IA
- Tras confirmar, llama a la misma función con `accion: "marcar_publicadas"` y refresca datos

## Parte 4 — Cambios en archivos existentes

- **`src/components/ClientList.tsx`**: agregar prop `onClientsUpdate`, importar y renderizar `AssistantDialog`
- **`src/pages/Index.tsx`**: pasar `onClientsUpdate={loadClients}` a `ClientList`

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `supabase/functions/telegram-assistant/index.ts` | Crear |
| `supabase/config.toml` | Agregar función |
| `src/components/client/AssistantDialog.tsx` | Crear |
| `src/components/ClientList.tsx` | Agregar botón + prop |
| `src/pages/Index.tsx` | Pasar prop onClientsUpdate |

