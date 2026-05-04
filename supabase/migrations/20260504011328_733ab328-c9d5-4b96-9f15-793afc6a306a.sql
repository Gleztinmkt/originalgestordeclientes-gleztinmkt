-- Social connections (Meta) per client
CREATE TABLE IF NOT EXISTS public.social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'meta',
  facebook_page_id text,
  facebook_page_name text,
  facebook_page_access_token_encrypted text,
  instagram_business_account_id text,
  instagram_username text,
  user_access_token_encrypted text,
  token_expires_at timestamptz,
  permissions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'connected',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_connections_client ON public.social_connections(client_id);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Admins can read connection metadata (UI shows status). Tokens never leave edge functions.
CREATE POLICY "Admins read social_connections"
ON public.social_connections FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete social_connections"
ON public.social_connections FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- INSERT/UPDATE only via service role (edge functions). No policy = no access for anon/authenticated.

-- OAuth state table (short-lived, used to validate callback)
CREATE TABLE IF NOT EXISTS public.meta_oauth_states (
  state text PRIMARY KEY,
  client_id uuid NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meta_oauth_states ENABLE ROW LEVEL SECURITY;
-- service role only

-- New columns on publications (additive, non-breaking)
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_file_url text,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_storage_path text,
  ADD COLUMN IF NOT EXISTS publish_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS instagram_media_id text,
  ADD COLUMN IF NOT EXISTS facebook_post_id text,
  ADD COLUMN IF NOT EXISTS publish_error text,
  ADD COLUMN IF NOT EXISTS publish_to_instagram boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS publish_to_facebook boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_publish_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_caption text;

-- Storage bucket for media intermediate hosting
INSERT INTO storage.buckets (id, name, public)
VALUES ('meta-publications', 'meta-publications', true)
ON CONFLICT (id) DO NOTHING;

-- Public read so Meta can fetch (URL-as-secret pattern). Writes only via service role.
CREATE POLICY "Public read meta-publications"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'meta-publications');