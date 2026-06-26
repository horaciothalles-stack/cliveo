ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS briefing_checklist jsonb NOT NULL DEFAULT '[false,false,false,false]'::jsonb;