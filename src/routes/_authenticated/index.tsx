import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FolderKanban,
  Layers,
  Wrench,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function useCounts() {
  return useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const [c, p, a, s] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("projetos").select("id", { count: "exact", head: true }),
        supabase.from("ativos").select("id", { count: "exact", head: true }),
        supabase.from("servicos").select("id", { count: "exact", head: true }),
      ]);
      return {
        clientes: c.count ?? 0,
        projetos: p.count ?? 0,
        ativos: a.count ?? 0,
        servicos: s.count ?? 0,
      };
    },
  });
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  accent?: "amber" | "orange";
}) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background:
            accent === "orange"
              ? "var(--brand-orange)"
              : accent === "amber"
                ? "var(--brand-amber)"
                : "transparent",
        }}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useCounts();

  return (
    <AppLayout title="Visão Geral" subtitle="Estado operacional da agência em tempo real">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-card p-8 mb-6">
        <div className="absolute -right-20 -top-20 size-72 rounded-full opacity-20 blur-3xl brand-gradient" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground mb-4">
              <Sparkles className="size-3 text-[var(--brand-amber)]" />
              CLIVEO · Sistema operacional HRC
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Bem-vindo de volta. <span className="brand-text-gradient">Vamos produzir.</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Gerencie clientes, briefings, ativos e financeiro com a precisão da HRC.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="brand-gradient text-black hover:opacity-90 border-0">
              <Link to="/clientes">
                Novo Cliente <ArrowUpRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label="Clientes" value={isLoading ? "—" : data!.clientes} icon={Users} accent="amber" />
        <Kpi label="Projetos" value={isLoading ? "—" : data!.projetos} icon={FolderKanban} accent="orange" />
        <Kpi label="Ativos" value={isLoading ? "—" : data!.ativos} icon={Layers} accent="amber" />
        <Kpi label="Serviços" value={isLoading ? "—" : data!.servicos} icon={Wrench} accent="orange" />
      </section>

      {/* MÓDULOS */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Briefing</CardTitle>
            <CardDescription>Checklist de iniciação por cliente.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Em breve.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Central de Ativos</CardTitle>
            <CardDescription>Fila → Produção → Aprovação → Finalizado.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Em breve.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
            <CardDescription>Precificação, auditoria e refações.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Em breve.</CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
