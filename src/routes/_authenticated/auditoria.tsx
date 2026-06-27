import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { Search, AlertTriangle, ScrollText, CheckCircle2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/auditoria")({
  component: AuditoriaPage,
});

const LIMITE_REFACOES = 2; // refações incluídas no contrato padrão

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface AtivoAuditoria {
  id: string;
  nome: string;
  status: string;
  refacoes: number;
  eh_extra: boolean;
  cliente_id: string | null;
  servico_id: string | null;
  cliente?: { nome: string; logo_url: string | null } | null;
  servico?: { nome: string; valor_base: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
  fila: "bg-muted text-muted-foreground border-border",
  "produção": "bg-[var(--brand-amber)]/15 text-[var(--brand-amber)] border-[var(--brand-amber)]/40",
  "revisão": "bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] border-[var(--brand-orange)]/40",
  aprovado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  entregue: "bg-sky-500/15 text-sky-400 border-sky-500/40",
};

function AuditoriaPage() {
  const [search, setSearch] = useState("");

  const { data: ativos = [], isLoading } = useQuery({
    queryKey: ["ativos-auditoria"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("ativos") as any)
        .select(
          "id, nome, status, refacoes, eh_extra, cliente_id, servico_id, cliente:clientes(nome, logo_url), servico:servicos(nome, valor_base)",
        )
        .order("refacoes", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AtivoAuditoria[];
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

  // Estatísticas
  const stats = useMemo(() => {
    const comExcesso = ativos.filter((a) => a.refacoes > LIMITE_REFACOES);
    const totalExcesso = comExcesso.reduce((s, a) => s + (a.refacoes - LIMITE_REFACOES), 0);
    const valorEstimado = comExcesso.reduce((s, a) => {
      const valorHora = a.servico?.valor_base ?? 0;
      const excesso = a.refacoes - LIMITE_REFACOES;
      return s + valorHora * excesso * 0.4; // 40% do valor-hora por refação extra
    }, 0);
    const extras = ativos.filter((a) => a.eh_extra).length;
    return { comExcesso: comExcesso.length, totalExcesso, valorEstimado, extras };
  }, [ativos]);

  return (
    <AppLayout title="Auditoria" subtitle="Controle de excesso de refações e cobranças extras">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="bg-card/80 border-destructive/30">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Ativos com excesso
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums text-destructive">
                {stats.comExcesso}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                acima de {LIMITE_REFACOES} refações
              </div>
            </div>
            <div className="size-11 rounded-xl border border-destructive/40 grid place-items-center text-destructive">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-[var(--brand-amber)]/30">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Refações excedentes
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums text-[var(--brand-amber)]">
                {stats.totalExcesso}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">no total</div>
            </div>
            <div className="size-11 rounded-xl border border-[var(--brand-amber)]/40 grid place-items-center text-[var(--brand-amber)]">
              <RefreshCw className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-[var(--brand-orange)]/30">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Valor estimado a cobrar
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-[var(--brand-orange)]">
                {brl(stats.valorEstimado)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                40%/h por refação extra
              </div>
            </div>
            <div className="size-11 rounded-xl border border-[var(--brand-orange)]/40 grid place-items-center text-[var(--brand-orange)]">
              <ScrollText className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta */}
      {stats.comExcesso > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm mb-6">
          <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-destructive">{stats.comExcesso} ativo(s)</span> ultrapassaram o limite de {LIMITE_REFACOES} refações incluídas no contrato.
            Verifique abaixo e emita aditivo de cobrança junto à fatura do cliente.
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative max-w-md mb-6">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar ativo ou cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : ativos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <CheckCircle2 className="size-10 text-emerald-400" />
            <div className="font-semibold">Nenhum ativo para auditar</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Cadastre ativos na{" "}
              <Link to="/ativos" className="text-[var(--brand-orange)] hover:underline">
                Central de Ativos
              </Link>{" "}
              para acompanhar refações e gerar cobranças.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/80 border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  {["Cliente", "Ativo", "Serviço", "Refações", "Excesso", "Valor extra", "Status"].map(
                    (h) => (
                      <TableHead
                        key={h}
                        className="text-muted-foreground text-[11px] uppercase tracking-wider"
                      >
                        {h}
                      </TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const excesso = Math.max(0, a.refacoes - LIMITE_REFACOES);
                  const valorHora = a.servico?.valor_base ?? 0;
                  const valorExtra = excesso * valorHora * 0.4;
                  const critico = excesso > 0;
                  return (
                    <TableRow
                      key={a.id}
                      className={`border-border transition-colors ${critico ? "hover:bg-destructive/5" : "hover:bg-muted/40"}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {a.cliente?.logo_url ? (
                            <img
                              src={a.cliente.logo_url}
                              alt=""
                              className="size-5 rounded object-contain"
                            />
                          ) : (
                            <span className="size-5 rounded bg-muted grid place-items-center text-[9px] font-bold text-muted-foreground">
                              {(a.cliente?.nome ?? "?").slice(0, 1)}
                            </span>
                          )}
                          <span className="text-sm font-medium truncate max-w-[140px]">
                            {a.cliente?.nome ?? "Sem cliente"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[180px] block">{a.nome}</span>
                        {a.eh_extra && (
                          <Badge
                            variant="outline"
                            className="text-[9px] mt-0.5 bg-[var(--brand-orange)]/10 text-[var(--brand-orange)] border-[var(--brand-orange)]/30"
                          >
                            extra
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {a.servico?.nome ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold tabular-nums">{a.refacoes}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          / {LIMITE_REFACOES} incl.
                        </span>
                      </TableCell>
                      <TableCell>
                        {excesso > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-destructive/15 text-destructive border-destructive/40 text-[10px] tabular-nums"
                          >
                            +{excesso}
                          </Badge>
                        ) : (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm font-semibold tabular-nums ${critico ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {critico ? brl(valorExtra) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider ${STATUS_COLOR[a.status] ?? STATUS_COLOR.fila}`}
                        >
                          {a.status}
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

      <p className="mt-4 text-xs text-muted-foreground">
        * O valor extra é estimado em 40% do custo-hora do serviço por refação excedente. Ajuste conforme contrato do cliente.
      </p>
    </AppLayout>
  );
}