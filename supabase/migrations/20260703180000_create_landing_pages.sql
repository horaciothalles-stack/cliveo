-- Cria tabela de landing pages geradas a partir de templates
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  cliente_id UUID NULL REFERENCES public.clientes(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  conteudo JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_landing_pages_workspace ON public.landing_pages(workspace_id);
CREATE INDEX idx_landing_pages_cliente ON public.landing_pages(cliente_id);

CREATE TRIGGER trg_landing_pages_updated
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all_landing_pages" ON public.landing_pages FOR ALL USING (true) WITH CHECK (true);
