

# Plan: API REST para integración con Telegram/n8n

## Resumen

Crear una Edge Function `telegram-api` que expone 4 endpoints REST autenticados con API key (`x-api-key`). La función usará el service role key de Supabase para acceder a los datos sin restricciones RLS.

## Paso 1 — Crear secret para la API key

Agregar un secret `TELEGRAM_API_KEY` en Supabase. Vos elegís el valor (una cadena aleatoria segura). Este valor se enviará en el header `x-api-key` desde n8n.

## Paso 2 — Registrar la función en config.toml

Agregar `[functions.telegram-api]` con `verify_jwt = false` ya que la autenticación se hace con API key, no JWT.

## Paso 3 — Crear la Edge Function `supabase/functions/telegram-api/index.ts`

Un solo archivo que rutea por método + path:

### Autenticación
- Leer `x-api-key` del header
- Comparar contra `Deno.env.get("TELEGRAM_API_KEY")`
- Rechazar con 401 si no coincide

### Endpoints

**GET /telegram-api?action=clientes**
- Query: `clients` tabla, filtrar `deleted_at IS NULL`
- Para cada cliente, sumar `totalPublications` y `usedPublications` de su campo `packages` (jsonb)
- Respuesta: `[{ id, nombre, publicaciones_disponibles, publicaciones_usadas }]`

**GET /telegram-api?action=buscar&q=nombre**
- Igual que arriba pero con filtro `ilike` por nombre o phone
- Respuesta: mismo formato

**POST /telegram-api?action=crear_publicacion**
- Body: `{ cliente_id, tipo, copy, fecha, red_social, estado }`
- Insertar en tabla `publications` mapeando: `client_id`, `type` (reel/carousel/image), `description` (copy), `date`, `name` (red_social), `status`
- Si estado = "publicada", marcar `is_published = true`
- Respuesta: `{ id, mensaje }`

**PATCH /telegram-api?action=actualizar_publicacion**
- Body: `{ id }`
- Actualizar `is_published = true`, `status = 'published'`
- Buscar el cliente dueño, incrementar `usedPublications` en el paquete activo del mes correspondiente
- Respuesta: `{ ok, mensaje }`

### Lógica de descuento de publicaciones
Los paquetes están en `clients.packages` (jsonb array). Para descontar:
1. Leer el cliente asociado a la publicación
2. Buscar el paquete cuyo `month` corresponda al mes de la publicación
3. Incrementar `usedPublications` en 1
4. Actualizar el campo `packages` del cliente

## Detalles técnicos

- Se usa `createClient(url, serviceRoleKey)` para bypassear RLS
- CORS habilitado para compatibilidad, aunque n8n no lo necesita
- Se usa query param `action` para rutear en lugar de sub-paths (limitación de Edge Functions que tienen un solo entry point por función)
- Validación de inputs: tipo debe ser uno de `reel`, `carousel`, `image`; fecha debe ser válida; cliente_id debe existir

