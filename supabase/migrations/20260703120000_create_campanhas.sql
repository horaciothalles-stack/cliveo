-- Cria tabela de campanhas de captação
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'ads',
  canal TEXT,
  status TEXT NOT NULL DEFAULT 'planejada',
  budget NUMERIC(14,2),
  meta_leads INTEGER,
  data_inicio DATE,
  data_fim DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campanhas_workspace ON public.campanhas(workspace_id);

CREATE TRIGGER trg_campanhas_updated
BEFORE UPDATE ON public.campanhas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all_campanhas" ON public.campanhas FOR ALL USING (true) WITH CHECK (true);
