
CREATE TABLE public.worker_test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  source TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert" ON public.worker_test
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can select" ON public.worker_test
  FOR SELECT TO authenticated
  USING (true);
