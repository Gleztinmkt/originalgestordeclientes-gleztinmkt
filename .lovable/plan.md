

## Plan: Agregar Apéndice al Plan — Guía de Flujo n8n para Telegram

No hay cambios de código. Solo voy a agregar al plan existente un apéndice claro que explique qué nodos, botones y configuración necesitás en n8n para conectar tu bot de Telegram con el asistente IA.

---

### Apéndice: Flujo de n8n para Telegram

El flujo de n8n debe conectar tu bot de Telegram con la Edge Function `telegram-assistant`. Estos son los bloques (nodos) que necesitás:

```text
┌─────────────────┐
│  Telegram        │  ← Trigger: recibe mensajes del bot
│  Trigger         │     Tipo: "On Message"
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│  HTTP Request    │  ← Llama a tu Edge Function
│  (Asistente IA)  │     POST a telegram-assistant
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│  Switch / IF     │  ← Evalúa response.accion
│                  │     para decidir qué responder
└──┬──┬──┬──┬─────┘
   │  │  │  │
   ▼  ▼  ▼  ▼
┌──────────────────────────────────────────────────┐
│  Telegram: Send Message (una rama por acción)    │
│  - identificar_clientes → lista con botones      │
│  - listado_aprobados → lista con botones inline  │
│  - mostrar_copy → texto formateado               │
│  - planificacion_propuesta → resumen + botones   │
│  - error/no_encontrado → mensaje de texto        │
└──────────────────────────────────────────────────┘
        │
        ▼  (si el usuario toca un botón inline)
┌─────────────────┐
│  Telegram        │  ← Trigger: "On Callback Query"
│  Callback Query  │     recibe el dato del botón
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│  HTTP Request    │  ← Llama acciones explícitas:
│  (Acción)        │     marcar_publicadas, confirmar_planificacion
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│  Telegram:       │  ← Confirma al usuario
│  Send/Edit Msg   │
└─────────────────┘
```

#### Nodo 1: Telegram Trigger
- **Tipo**: Telegram Trigger
- **Evento**: "message" (mensajes de texto)
- **Credencial**: Tu bot token de BotFather

#### Nodo 2: HTTP Request — Interpretar mensaje
- **Método**: POST
- **URL**: `https://<tu-proyecto>.supabase.co/functions/v1/telegram-assistant`
- **Headers**:
  - `Content-Type`: `application/json`
  - `x-api-key`: tu `TELEGRAM_API_KEY` (guardar como credencial en n8n)
- **Body (JSON)**:
```json
{
  "mensaje": "{{ $json.message.text }}"
}
```

#### Nodo 3: Switch (evaluar acción)
- **Campo a evaluar**: `{{ $json.accion }}`
- **Ramas**:
  - `identificar_clientes`
  - `listado_aprobados`
  - `mostrar_copy`
  - `planificacion_propuesta`
  - `error` / `no_encontrado`

#### Nodo 4 (por rama): Telegram Send Message

**Rama "identificar_clientes" / "listado_aprobados":**
- **Texto**: `{{ $json.mensaje_ia }}`
- **Botones inline** (Reply Markup): Un botón por cada publicación con `callback_data` = ID de la publicación
- Formato: `InlineKeyboard` con filas de botones tipo `[{"text": "📌 Nombre pub", "callback_data": "pub_ID"}]`
- Agregar un botón final: `{"text": "✅ Marcar seleccionadas", "callback_data": "confirmar_todas"}`

**Rama "mostrar_copy":**
- **Texto**: El copy formateado con `parse_mode: HTML`
- **Contenido**: `{{ $json.publicacion.copywriting || $json.publicacion.descripcion }}`

**Rama "planificacion_propuesta":**
- **Texto**: Resumen de propuestas
- **Botones inline**: `{"text": "✅ Confirmar", "callback_data": "confirmar_plan"}`

#### Nodo 5: Telegram Trigger (Callback Query)
- **Tipo**: Telegram Trigger
- **Evento**: "callback_query" (cuando tocan un botón inline)
- Este es un **flujo separado** en n8n

#### Nodo 6: HTTP Request — Ejecutar acción
Según el `callback_data`:

**Si es un ID de publicación (marcar como publicada):**
- **POST** a `telegram-assistant`
- **Body**:
```json
{
  "accion": "marcar_publicadas",
  "publicaciones_ids": ["{{ $json.callback_query.data }}"]
}
```

**Si es "confirmar_plan":**
- **POST** a `telegram-assistant`
- **Body**:
```json
{
  "accion": "confirmar_planificacion",
  "updates": [array de updates guardados]
}
```

#### Nodo 7: Telegram Answer Callback + Edit Message
- Usar `answerCallbackQuery` para quitar el "loading" del botón
- Usar `editMessageText` para actualizar el mensaje original con "✅ Hecho"

---

#### Acciones disponibles en la API (para los HTTP Request):

| Acción | Body | Qué hace |
|--------|------|----------|
| *(sin acción)* | `{"mensaje": "texto"}` | IA interpreta y responde |
| `listado_aprobados` | `{"accion": "listado_aprobados"}` | Lista publicaciones aprobadas |
| `marcar_publicadas` | `{"accion": "marcar_publicadas", "publicaciones_ids": [...], "cantidad_descontar": N}` | Marca como publicadas y descuenta del paquete |
| `confirmar_planificacion` | `{"accion": "confirmar_planificacion", "updates": [{client_id, month, status, description}]}` | Aplica cambios de planificación |

#### Tips para n8n:
- Guardá el `TELEGRAM_API_KEY` como **credencial** en n8n, no hardcodeada
- Usá el nodo **"Code"** si necesitás armar los botones inline dinámicamente desde el array de publicaciones
- Para manejar selección múltiple de publicaciones, guardá los IDs seleccionados en una variable de flujo o usá una tabla temporal en Supabase

