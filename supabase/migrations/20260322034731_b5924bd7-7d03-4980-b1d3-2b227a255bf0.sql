
CREATE TABLE public.planners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.planners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated" ON public.planners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
