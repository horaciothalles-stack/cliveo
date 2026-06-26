-- Drop permissive policies
DROP POLICY IF EXISTS open_all_clientes ON public.clientes;
DROP POLICY IF EXISTS open_all_projetos ON public.projetos;
DROP POLICY IF EXISTS open_all_ativos ON public.ativos;
DROP POLICY IF EXISTS open_all_servicos ON public.servicos;

-- Authenticated-only policies (full CRUD for any signed-in agency user)
CREATE POLICY "auth_all_clientes" ON public.clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_projetos" ON public.projetos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_ativos" ON public.ativos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_servicos" ON public.servicos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- URL scheme validation (http/https only)
ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_logo_url_scheme CHECK (logo_url IS NULL OR logo_url ~* '^https?://'),
  ADD CONSTRAINT clientes_drive_url_scheme CHECK (drive_url IS NULL OR drive_url ~* '^https?://'),
  ADD CONSTRAINT clientes_manual_url_scheme CHECK (manual_marca_url IS NULL OR manual_marca_url ~* '^https?://');

ALTER TABLE public.ativos
  ADD CONSTRAINT ativos_arquivo_url_scheme CHECK (arquivo_url IS NULL OR arquivo_url ~* '^https?://');