
REVOKE EXECUTE ON FUNCTION public.set_user_id_default() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_user_id_default() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_id_default() FROM authenticated;

-- Seed default services per existing user (idempotent)
INSERT INTO public.servicos (nome, valor_base, user_id)
SELECT s.nome, s.valor, u.id
FROM auth.users u
CROSS JOIN (VALUES
  ('Post Estático', 150),
  ('Edição de Reels', 300),
  ('Identidade Visual', 1500)
) AS s(nome, valor)
WHERE NOT EXISTS (
  SELECT 1 FROM public.servicos x
  WHERE x.user_id = u.id AND x.nome = s.nome
);
