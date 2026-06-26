
-- 1. Add user_id to all tables
ALTER TABLE public.clientes ADD COLUMN user_id uuid;
ALTER TABLE public.servicos ADD COLUMN user_id uuid;
ALTER TABLE public.projetos ADD COLUMN user_id uuid;
ALTER TABLE public.ativos   ADD COLUMN user_id uuid;

-- 2. Extend ativos with the new fields requested
ALTER TABLE public.ativos
  ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  ADD COLUMN prazo date,
  ADD COLUMN link_entrega text,
  ADD COLUMN eh_extra boolean NOT NULL DEFAULT false;

-- Allow ativos without a project (linked directly to cliente)
ALTER TABLE public.ativos ALTER COLUMN projeto_id DROP NOT NULL;

-- URL validation for link_entrega
ALTER TABLE public.ativos
  ADD CONSTRAINT ativos_link_entrega_http_check
  CHECK (link_entrega IS NULL OR link_entrega ~* '^https?://');

-- 3. Set user_id NOT NULL going forward (existing rows: leave null only if empty tables; safer to default new rows)
-- We won't enforce NOT NULL retroactively since there may be no data; but default via trigger on insert if missing
CREATE OR REPLACE FUNCTION public.set_user_id_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_user_id_clientes BEFORE INSERT ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
CREATE TRIGGER set_user_id_servicos BEFORE INSERT ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
CREATE TRIGGER set_user_id_projetos BEFORE INSERT ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();
CREATE TRIGGER set_user_id_ativos BEFORE INSERT ON public.ativos
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_default();

-- 4. Replace open-auth policies with user-scoped policies
DROP POLICY IF EXISTS auth_all_clientes ON public.clientes;
DROP POLICY IF EXISTS auth_all_servicos ON public.servicos;
DROP POLICY IF EXISTS auth_all_projetos ON public.projetos;
DROP POLICY IF EXISTS auth_all_ativos   ON public.ativos;

CREATE POLICY own_select_clientes ON public.clientes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert_clientes ON public.clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update_clientes ON public.clientes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete_clientes ON public.clientes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY own_select_servicos ON public.servicos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert_servicos ON public.servicos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update_servicos ON public.servicos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete_servicos ON public.servicos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY own_select_projetos ON public.projetos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert_projetos ON public.projetos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update_projetos ON public.projetos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete_projetos ON public.projetos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY own_select_ativos ON public.ativos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert_ativos ON public.ativos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update_ativos ON public.ativos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete_ativos ON public.ativos FOR DELETE TO authenticated USING (auth.uid() = user_id);
