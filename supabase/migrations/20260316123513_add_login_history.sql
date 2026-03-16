CREATE TABLE public.login_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id text NOT NULL,
  login_type text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for login_history" ON public.login_history FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.login_history REPLICA IDENTITY FULL;
