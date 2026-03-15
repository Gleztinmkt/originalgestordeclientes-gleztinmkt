

## Plan: Crear publicaciones desde el Asistente IA (Web + Telegram)

### Resumen

Agregar una nueva herramienta `create_publication` al asistente IA (`telegram-assistant`) que permita crear publicaciones desde lenguaje natural, con un flujo de previsualización y confirmación antes de guardar.

### Flujo del usuario

1. El usuario escribe: *"Hacé una publicación para 4S Motors para el 17 de marzo, descripción: video institucional, copy: En 4S Motors..., diseñador Matias"*
2. La IA interpreta y devuelve una **previsualización** (accion: `publicacion_propuesta`) con todos los campos parseados
3. El usuario revisa y puede pedir cambios (*"cambiá la fecha al 18"*) o confirmar
4. Al confirmar, se inserta en la base de datos

### Cambios en la Edge Function `telegram-assistant/index.ts`

**1. Nueva tool en `interpretMessage`:**
```
create_publication:
  - client_name, client_id
  - name (título)
  - type (reel/carousel/image, default: image)
  - date (YYYY-MM-DD)
  - description (opcional)
  - copywriting (opcional)
  - designer (opcional)
  - status (default: needs_recording)
  - suggest_copy (boolean - si el usuario pide que sugiera copy)
```

**2. Actualizar el system prompt** para que la IA reconozca mensajes de creación de publicaciones y use la nueva tool. Incluir instrucciones como:
- Si no se menciona estado, usar `needs_recording`
- Si no se menciona tipo, inferir de la descripción o usar `image`
- Si el usuario pide "sugerí un copy", activar `suggest_copy: true`

**3. Handler `create_publication` en `interpretMessage`:**
- Si `suggest_copy` es true: buscar publicaciones anteriores del cliente, enviarlas a la IA para generar un copy sugerido
- Devolver `accion: "publicacion_propuesta"` con la previsualización (NO insertar aún)

**4. Nueva acción explícita `confirmar_crear_publicacion`:**
- Recibe los datos finales de la publicación
- Inserta en la tabla `publications` con los flags booleanos correctos según el estado
- Devuelve confirmación

**5. Formatter de Telegram para `publicacion_propuesta`:**
- Muestra la previsualización formateada con todos los campos
- Botón "✅ Confirmar" con callback `create_pub_confirm:{session_id}` (usa sesión porque los datos son grandes)
- Botón "❌ Cancelar" con callback `cancel`

**6. Callback handler `create_pub_confirm:{session_id}`:**
- Resuelve la sesión, inserta la publicación, devuelve confirmación

**7. Fetch de designers:** Consultar la tabla `designers` para validar el nombre del diseñador (match parcial/fuzzy).

### Lógica de sugerencia de copy

Cuando `suggest_copy: true`:
1. Buscar las últimas 5 publicaciones del cliente que tengan copywriting
2. Enviar a la IA con la descripción del nuevo video para que genere un copy en el mismo estilo
3. Incluir el copy sugerido en la previsualización

### Cambios en el AssistantDialog (web)

Agregar renderizado para la nueva accion `publicacion_propuesta`:
- Mostrar previsualización con todos los campos
- Botón "Confirmar" que llama a `confirmar_crear_publicacion`
- Input para pedir cambios antes de confirmar

### n8n

No se necesitan cambios en n8n. El flujo existente ya envía el `mensaje` al `telegram-assistant` y reenvía la respuesta. Los callbacks de botones ya están manejados por el flujo de `telegram_callback`. Solo hay que asegurarse de que el nodo de Telegram soporte el `reply_markup` en la respuesta (que ya lo hace).

### Resumen de archivos a modificar

1. **`supabase/functions/telegram-assistant/index.ts`** - Nueva tool, handler, formatter, callback
2. **`src/components/client/AssistantDialog.tsx`** - Renderizar previsualización de publicación propuesta

