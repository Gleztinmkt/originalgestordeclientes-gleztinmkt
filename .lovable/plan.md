
# Migración a Lovable Cloud vía Remix

## Resumen
Vas a remixar este proyecto para crear uno nuevo. Ese remix arrancará igual de código pero **seguirá apuntando al mismo Supabase externo** (las credenciales están hardcodeadas en el código). Mi trabajo es prepararte el paquete para que, una vez creado el remix y activado Lovable Cloud allá, podamos cortar el cordón con el Supabase viejo y reapuntar todo al backend nuevo sin perder datos.

## Aclaración crítica sobre el Remix
Cuando remixás, el código nuevo sigue conectado al Supabase viejo `rnwlqsnvswuecmqhsfww` porque la URL y la anon key están escritas en:
- `src/integrations/supabase/client.ts`
- `src/lib/supabase.ts`
- Variables de entorno (`.env`)
- `supabase/config.toml`
- Edge functions

El remix **NO activa Lovable Cloud automáticamente**. Vos vas a tener que pedirme en el proyecto nuevo "activar Lovable Cloud" para que Lovable provisione un Supabase administrado nuevo. Recién ahí cambian las credenciales.

## Fases del plan

### Fase A — En este proyecto (ahora): generar el paquete de migración
Voy a dejarte en `/mnt/documents/migracion-cloud/` lo siguiente:

1. **`schema.sql`** — script completo para recrear la base en el Cloud nuevo:
   - 25 tablas con columnas, tipos, defaults, PKs y FKs
   - Enums (`app_role`, etc.)
   - 10 funciones (`has_role`, `check_admin_role`, `ensure_*`, triggers)
   - Triggers
   - Policies RLS (todas las existentes, adaptadas)
   - Grants explícitos a `anon`/`authenticated`/`service_role`
   - 2 buckets de Storage (`test`, `meta-publications`) con sus policies

2. **`data/*.csv`** — exportación de las 25 tablas en orden de dependencias (FKs primero). Genero los CSV leyendo la base actual con queries SELECT.

3. **`auth-users.json`** — export de `auth.users` (id, email, metadata, created_at). **Los password hashes de Supabase no son portables entre proyectos** salvo con acceso admin a la otra base; los usuarios van a tener que resetear su contraseña la primera vez. Te dejo el listado y un script para reenviarles el email de reset.

4. **`storage/`** — backup de los archivos del bucket `meta-publications` (descargados vía API con la service role key).

5. **`secrets-checklist.md`** — lista de los 16 secrets actuales que hay que recrear en el Cloud nuevo:
   - `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` (con nuevo dominio)
   - `TELEGRAM_API_KEY`, `TELEGRAM_API_KEY_1`
   - `GOOGLE_DRIVE_API_KEY`, `GOOGLE_CALENDAR_API_KEY`
   - (`SUPABASE_*` y `LOVABLE_API_KEY` los inyecta Cloud automáticamente)

6. **`integraciones-externas.md`** — pasos para reconfigurar:
   - **Meta Developers**: nuevo Valid OAuth Redirect URI apuntando a la URL del Cloud nuevo
   - **Telegram BotFather**: nuevo webhook URL
   - **Google Cloud Console**: agregar el nuevo dominio a OAuth consent screen y JS origins
   - Cron jobs (`meta-scheduler`, `cleanup-telegram-sessions`)
   - Realtime publications

7. **`README-migracion.md`** — instrucciones paso a paso de qué pegarme en el chat del proyecto nuevo y en qué orden.

### Fase B — En tu proyecto remixeado (vos lo creás)
1. Hacés el Remix desde la UI de Lovable.
2. Abrís el proyecto nuevo y me decís: **"activá Lovable Cloud"**. Lovable provisiona el Supabase administrado.
3. Me pegás el contenido de `README-migracion.md`. Yo entonces:
   - Aplico `schema.sql` como migración inicial
   - Importo los CSV en orden
   - Reemplazo `src/integrations/supabase/client.ts` y `src/lib/supabase.ts` para que usen `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` del nuevo Cloud (en vez de las URLs hardcoded del Supabase viejo)
   - Subo los archivos de Storage al bucket nuevo
   - Te pido que agregues los 7 secrets de la checklist con `add_secret`
   - Despliego las edge functions (se redespliegan solas al copiar el código)
   - Recreo los cron jobs
4. Vos rehacés:
   - Meta OAuth redirect URI en Meta Developers
   - Webhook de Telegram
   - OAuth de Google
5. Avisás a los usuarios que reseteen contraseña (les mando email automático desde el script).

### Fase C — Cutover
1. Verificamos en el Cloud nuevo: login, calendario, publicaciones, Meta, Telegram, Drive.
2. Una vez OK, este proyecto viejo queda como **backup de solo lectura**. No lo borres por al menos 30 días.

## Detalles técnicos (referencia)

### Lo que NO se puede migrar 1:1
- **Password hashes de `auth.users`**: requieren obligatorio reset por parte del usuario.
- **Sessions activas / refresh tokens**: todos los usuarios se deslogean.
- **Tokens de Meta (`facebook_page_access_token_encrypted` en `social_connections`)**: están emitidos contra el `META_APP_ID` actual. Si reusás el mismo Meta App, *podrían* seguir funcionando — pero lo más seguro es que cada cliente reconecte Meta desde cero. Esa columna se migra igual pero pueden caducar.
- **URLs públicas del bucket `meta-publications`**: cambian de dominio. Si alguna publicación en `publications.media_url` apunta al bucket viejo, hay que reescribir esas URLs apuntando al bucket nuevo (incluido en el script de import).

### Tamaño estimado del export
- DB: ~0.10 GB (ya optimizada) → CSVs ~50-100 MB
- Storage `meta-publications`: depende, hay que medir. Te lo reporto al ejecutar.

### Orden de import por FKs
```text
agencies → profiles → designers → planners → user_roles
→ clients → client_links → client_notes → client_tax_info
→ package_prices → publications → publication_planning
→ publication_notes → note_replies → social_connections
→ invoices → tasks → message_templates → notifications
→ instagram_activity_insights → user_calendar_preferences
→ deleted_items → telegram_* → meta_oauth_states
```

## Lo que necesito de vos antes de arrancar Fase A
Confirmame que sigamos con este enfoque. Cuando me digas que sí, en este mismo proyecto:
1. Genero los 7 archivos del paquete en `/mnt/documents/migracion-cloud/`
2. Te los dejo listos para descargar
3. Vos hacés el Remix + activás Cloud allá y me llamás desde el proyecto nuevo

No toco código de este proyecto viejo (queda intacto como backup vivo).
