

## Plan: Botón de Refresh Rápido + Confirmar Planificación en Asistente IA

### 1. Botón de Refresh Rápido (Index.tsx)

Agregar un botón de refresh en el header (junto a los otros botones) que ejecute `loadClients()` y `loadTasks()` sin recargar la página. Mostrará un spinner mientras carga.

- Ícono: `RefreshCw` de lucide-react
- Ubicación: en el grupo de botones superior izquierdo
- Al hacer click: llama `loadClients()` + `loadTasks()` en paralelo, con toast de confirmación

### 2. Flujo de Planificación con Confirmación Real (Edge Function + AssistantDialog)

**Problema actual**: Cuando la IA interpreta un mensaje de planificación, aplica los cambios inmediatamente en la base de datos. Los checkboxes de "confirmar" en el frontend son solo visuales y no hacen nada.

**Solución**: Cambiar a un flujo de dos pasos:

#### Edge Function (`telegram-assistant`):
- En `update_planning`, **NO aplicar** los cambios inmediatamente. En vez de llamar `handleUpdatePlanning()`, solo devolver las propuestas con `client_id` incluido en cada item.
- Cambiar la acción de respuesta a `"planificacion_propuesta"` para diferenciar de una ya aplicada.
- Agregar una nueva acción explícita `"confirmar_planificacion"` que reciba un array de updates `[{client_id, month, status, description}]` y ahí sí aplique `handleUpdatePlanning()` para cada uno.

#### AssistantDialog (frontend):
- Detectar `"planificacion_propuesta"` en vez de `"planificacion_actualizada"`.
- Agregar un botón **"Confirmar seleccionadas"** que envíe solo los items marcados con checkbox a la nueva acción `"confirmar_planificacion"`.
- El botón solo aparece cuando hay al menos un item seleccionado.
- Después de confirmar, llamar `onClientsUpdate()` y mostrar toast de éxito.

### Cambios por archivo:

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Agregar botón RefreshCw que llame `loadClients()` + `loadTasks()` |
| `supabase/functions/telegram-assistant/index.ts` | No aplicar planning inmediatamente; devolver propuestas con `client_id`; nueva acción `confirmar_planificacion` |
| `src/components/client/AssistantDialog.tsx` | Manejar `planificacion_propuesta`; agregar `client_id` al tipo `PlanUpdate`; botón "Confirmar" que envía items seleccionados |

