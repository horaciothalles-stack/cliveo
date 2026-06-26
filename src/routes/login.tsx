import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/cliveo-logo.png";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: search.redirect ?? "/" });
    }
  },
  component: LoginPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect on session change (e.g., OAuth return)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: search.redirect ?? "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, search.redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada. Verifique seu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: search.redirect ?? "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + (search.redirect ?? "/"),
      },
    });
    if (error) {
      toast.error(error.message ?? "Erro ao entrar com Google");
      setLoading(false);
    }
    // On success, Supabase redirects the browser to Google — nothing else to do here.
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="size-10 rounded-md brand-gradient grid place-items-center shadow">
            <img src={logo} alt="CLIVEO" className="size-7 object-contain invert dark:invert-0" />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight text-lg">CLIVEO</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">by HRC</div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesso restrito à equipe da agência.
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-6"
              onClick={google}
              disabled={loading}
            >
              <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.89-1.74 2.982-4.305 2.982-7.35Z"/><path fill="currentColor" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.598-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22Z"/><path fill="currentColor" d="M6.402 13.9A6.01 6.01 0 0 1 6.09 12c0-.66.114-1.3.31-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.338-2.59Z"/><path fill="currentColor" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.338 2.59C7.19 7.737 9.395 5.977 12 5.977Z"/></svg>
              Continuar com Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">ou</span></div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full brand-gradient text-black border-0 hover:opacity-90">
                {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground mt-4 block mx-auto"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            >
              {mode === "signin" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}