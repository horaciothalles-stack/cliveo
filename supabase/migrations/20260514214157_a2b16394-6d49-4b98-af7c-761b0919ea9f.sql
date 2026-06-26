
-- Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  apelido TEXT,
  logo_url TEXT,
  drive_url TEXT,
  manual_marca_url TEXT,
  paleta_cores JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Servicos (catálogo HRC)
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projetos
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'briefing',
  briefing_checklist JSONB DEFAULT '[]'::jsonb,
  briefing_completo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projetos_cliente ON public.projetos(cliente_id);

-- Ativos
CREATE TABLE public.ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'fila',
  arquivo_url TEXT,
  refacoes INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'incluso',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ativos_projeto ON public.ativos(projeto_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_servicos_updated BEFORE UPDATE ON public.servicos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projetos_updated BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ativos_updated BEFORE UPDATE ON public.ativos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS (permissivo por enquanto — autenticação será adicionada depois)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all_clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_servicos" ON public.servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_projetos" ON public.projetos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_ativos" ON public.ativos FOR ALL USING (true) WITH CHECK (true);
