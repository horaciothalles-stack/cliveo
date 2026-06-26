import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw, AlertTriangle, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/refacoes")({
  component: RefacoesPage,
});

interface AtivoComCliente {
  id: string;
  nome: string;
  status: string;
  refacoes: number;
  cliente: { nome: string; logo_url: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  fila: "Fila",
  produção: "Produção",
  revisão: "Revisão",
  aprovado: "Aprovado",
  entregue: "Entregue",
};

const STATUS_COLOR: Record<string, string> = {
  fila: "bg-muted text-muted-foreground border-border",
  produção: "bg-[var(--brand-amber)]/15 text-[var(--brand-amber)] border-[var(--brand-amber)]/40",
  revisão: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] border-[var(--brand-orange)]/40",
  aprovado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  entregue: "bg-sky-500/15 text-sky-400 border-sky-500/40",
};

function RefacoesPage() {
  const [search, setSearch] = useState("");

  const { data: ativos = [], isLoading } = useQuery({
    queryKey: ["ativos", "refacoes"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("ativos") as any)
        .select(
          "id, nome, status, refacoes, cliente:clientes(nome, logo_url)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AtivoComCliente[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ativos;
    return ativos.filter(
      (a) =>
        a.nome.toLowerCase().includes(q) ||
        (a.cliente?.nome ?? "").toLowerCase().includes(q),
    );
  }, [ativos, search]);

  const ativosComRefacao = ativos.filter((a) => a.refacoes > 0);
  const totalRefacoes = ativos.reduce((s, a) => s + a.refacoes, 0);
  const alertas = ativos.filter((a) => a.refacoes >= 4).length;

  return (
    <AppLayout
      title="Histórico de Refações"
      subtitle="Controle de retrabalho por marca"
    >
      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="bg-card/80 border-border/60">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Total de ativos
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{ativos.length}</div>
            </div>
            <div className="size-11 rounded-xl border border-[var(--brand-amber)]/30 grid place-items-center text-[var(--brand-amber)]">
              <RefreshCw className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/60">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Ativos com refação
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{ativosComRefacao.length}</div>
            </div>
            <div className="size-11 rounded-xl border border-[var(--brand-orange)]/40 grid place-items-center text-[var(--brand-orange)]">
              <RefreshCw className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-destructive/40">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Alertas críticos
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums text-destructive">{alertas}</div>
            </div>
            <div className="size-11 rounded-xl border border-destructive/40 grid place-items-center text-destructive">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ativo ou marca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* table */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : ativos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="size-12 rounded-full brand-gradient grid place-items-center">
              <Layers className="size-6 text-black" />
            </div>
            <div className="font-semibold">Nenhum ativo cadastrado</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Cadastre ativos na Central de Ativos para acompanhar refações e alertas de retrabalho.
            </p>
            <Link
              to="/ativos"
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90"
            >
              Ir para Central de Ativos
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/80 border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">
                    Cliente
                  </TableHead>
                  <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">
                    Ativo
                  </TableHead>
                  <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">
                    Refações
                  </TableHead>
                  <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const critico = a.refacoes >= 4;
                  return (
                    <TableRow
                      key={a.id}
                      className="border-border hover:bg-muted/40 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {a.cliente?.logo_url ? (
                            <img
                              src={a.cliente.logo_url}
                              alt=""
                              className="size-6 rounded object-contain"
                            />
                          ) : (
                            <span className="size-6 rounded bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground">
                              {(a.cliente?.nome ?? "?").slice(0, 1)}
                            </span>
                          )}
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {a.cliente?.nome ?? "Sem cliente"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[200px] block">{a.nome}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">
                            {a.refacoes}
                          </span>
                          {critico && (
                            <Badge
                              variant="outline"
                              className="bg-destructive/15 text-destructive border-destructive/40 text-[10px]"
                            >
                              <AlertTriangle className="size-3 mr-1" />
                              Crítico
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider ${STATUS_COLOR[a.status] ?? STATUS_COLOR.fila}`}
                        >
                          {STATUS_LABEL[a.status] ?? a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && search && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para "{search}"
            </div>
          )}
        </Card>
      )}
    </AppLayout>
  );
}
