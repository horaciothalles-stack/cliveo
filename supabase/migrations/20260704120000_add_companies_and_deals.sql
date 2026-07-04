-- CRM commercial entities: unified companies + deals
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lead',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_status_check'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_status_check
      CHECK (status IN ('lead', 'prospect', 'active_client', 'inactive'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'prospeccao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'prospeccao',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_stage_check'
  ) THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_stage_check
      CHECK (stage IN ('prospeccao', 'diagnostico', 'proposta', 'negociacao', 'fechado_ganho', 'perdido'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_updated ON public.companies;
DROP TRIGGER IF EXISTS trg_deals_updated ON public.deals;

CREATE TRIGGER trg_companies_updated
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_deals_updated
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_all_companies" ON public.companies;
DROP POLICY IF EXISTS "open_all_deals" ON public.deals;

CREATE POLICY "open_all_companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_deals" ON public.deals FOR ALL USING (true) WITH CHECK (true);
