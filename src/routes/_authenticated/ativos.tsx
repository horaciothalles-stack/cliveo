import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Minus,
  ExternalLink,
  RefreshCw,
  Layers,
  Calendar,
  Sparkles,
  CheckCircle2,
  Link2,
  AlertTriangle,
  Hammer,
  Clock3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ativos")({
  component: AtivosPage,
});

const STATUS = ["fila", "produção", "revisão", "aprovado", "entregue"] as const;
type Status = (typeof STATUS)[number];

interface Ativo {
  id: string;
  nome: string;
  cliente_id: string | null;
  servico_id: string | null;
  status: string;
  prazo: string | null;
  link_entrega: string | null;
  eh_extra: boolean;
  refacoes: number;
  created_at: string;
  updated_at?: string;
  cliente?: { nome: string; logo_url: string | null } | null;
  servico?: { nome: string } | null;
}

const isHttp = (u: string) => /^https?:\/\//i.test(u);

const STATUS_COLOR: Record<string, string> = {
  fila: "bg-muted text-muted-foreground border-border",
  "produção": "bg-[var(--brand-amber)]/15 text-[var(--brand-amber)] border-[var(--brand-amber)]/40",
  "revisão": "bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] border-[var(--brand-orange)]/40",
  aprovado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  entregue: "bg-sky-500/15 text-sky-400 border-sky-500/40",
};

function AtivosPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterCliente, setFilterCliente] = useState<string>("all");
  const [linkEditor, setLinkEditor] = useState<{ id: string; value: string } | null>(null);
  const [refacaoEditor, setRefacaoEditor] = useState<{ id: string; value: string } | null>(null);

  const clientesQ = useQuery({
    queryKey: ["clientes-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, logo_url")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const servicosQ = useQuery({
    queryKey: ["servicos-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, valor_base")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const ativosQ = useQuery({
    queryKey: ["ativos", filterCliente],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase.from("ativos") as any)
        .select(
          "id, nome, cliente_id, servico_id, status, prazo, link_entrega, eh_extra, refacoes, created_at, updated_at, cliente:clientes(nome, logo_url), servico:servicos(nome)",
        )
        .order("created_at", { ascending: false });
      if (filterCliente !== "all") q = q.eq("cliente_id", filterCliente);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Ativo[];
    },
  });

  const [form, setForm] = useState({
    nome: "",
    cliente_id: "",
    servico_id: "",
    status: "fila" as Status,
    prazo: "",
    link_entrega: "",
    eh_extra: false,
  });

  const reset = () =>
    setForm({
      nome: "",
      cliente_id: "",
      servico_id: "",
      status: "fila",
      prazo: "",
      link_entrega: "",
      eh_extra: false,
    });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do ativo");
      if (!form.cliente_id) throw new Error("Selecione um cliente");
      if (form.link_entrega && !isHttp(form.link_entrega))
        throw new Error("Link de entrega deve começar com http(s)://");
      const payload = {
        nome: form.nome.trim(),
        cliente_id: form.cliente_id,
        servico_id: form.servico_id || null,
        status: form.status,
        prazo: form.prazo || null,
        link_entrega: form.link_entrega.trim() || null,
        eh_extra: form.eh_extra,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("ativos") as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ativo criado");
      qc.invalidateQueries({ queryKey: ["ativos"] });
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("ativos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ativos"] }),
  });

  const bumpRefacao = useMutation({
    mutationFn: async (a: Ativo) => {
      const next = (a.refacoes ?? 0) + 1;
      const { error } = await supabase
        .from("ativos")
        .update({ refacoes: next })
        .eq("id", a.id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ["ativos"] });
      if (next >= 3) toast.warning(`${next}ª refação — ALERTA: EXCESSO DE REFAÇÃO`);
      else toast.success(`Refação registrada (${next})`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decrementRefacao = useMutation({
    mutationFn: async (a: Ativo) => {
      const next = Math.max(0, (a.refacoes ?? 0) - 1);
      const { error } = await supabase
        .from("ativos")
        .update({ refacoes: next })
        .eq("id", a.id);
      if (error) throw error;
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ativos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setRefacao = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const next = Math.max(0, Math.round(value));
      const { error } = await supabase
        .from("ativos")
        .update({ refacoes: next })
        .eq("id", id);
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ativos"] });
      setRefacaoEditor(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, link }: { id: string; link: string }) => {
      const trimmed = link.trim();
      if (trimmed && !isHttp(trimmed))
        throw new Error("Link deve começar com http(s)://");
      const { error } = await supabase
        .from("ativos")
        .update({ link_entrega: trimmed || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link atualizado");
      qc.invalidateQueries({ queryKey: ["ativos"] });
      setLinkEditor(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ativos = ativosQ.data ?? [];
  const clientes = clientesQ.data ?? [];
  const servicos = servicosQ.data ?? [];

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: ativos.length,
      extras: ativos.filter((a) => a.eh_extra).length,
      refacoes: ativos.reduce((s, a) => s + (a.refacoes ?? 0), 0),
      producao: ativos.filter((a) => a.status === "produção").length,
      aprovacao: ativos.filter((a) => a.status === "revisão").length,
      finalizadosHoje: ativos.filter(
        (a) => a.status === "entregue" && new Date(a.updated_at ?? a.created_at).toDateString() === today,
      ).length,
    };
  }, [ativos]);

  return (
    <AppLayout title="Central de Ativos" subtitle="Acompanhe a produção em tempo real">
      <div className="flex flex-col gap-6">
        {/* stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Em Produção",
              value: stats.producao,
              icon: Hammer,
              tone: "text-[var(--brand-amber)]",
              ring: "border-[var(--brand-amber)]/30",
            },
            {
              label: "Aguardando Aprovação",
              value: stats.aprovacao,
              icon: Clock3,
              tone: "text-[var(--brand-orange)]",
              ring: "border-[var(--brand-orange)]/40",
            },
            {
              label: "Finalizados hoje",
              value: stats.finalizadosHoje,
              icon: CheckCircle2,
              tone: "text-emerald-400",
              ring: "border-emerald-500/30",
            },
          ].map((s) => (
            <Card key={s.label} className={`relative overflow-hidden bg-card/80 ${s.ring}`}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-3xl font-bold tabular-nums">{s.value}</div>
                </div>
                <div className={`size-11 rounded-xl border ${s.ring} grid place-items-center ${s.tone}`}>
                  <s.icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* header / filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Filtrar por cliente
            </Label>
            <Select value={filterCliente} onValueChange={setFilterCliente}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span><span className="text-foreground font-semibold">{stats.total}</span> ativos</span>
              <span><span className="text-[var(--brand-orange)] font-semibold">{stats.extras}</span> extras</span>
              <span><span className="text-[var(--brand-amber)] font-semibold">{stats.refacoes}</span> refações</span>
            </div>
            <Button onClick={() => setOpen(true)} className="brand-gradient text-black hover:opacity-90">
              <Plus /> Novo ativo
            </Button>
          </div>
        </div>

        {/* grid */}
        {ativosQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : ativos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="size-12 rounded-full brand-gradient grid place-items-center">
                <Layers className="size-6 text-black" />
              </div>
              <div className="font-semibold">Nenhum ativo ainda</div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Cadastre o primeiro ativo da fila de produção para começar a acompanhar entregas, prazos e refações.
              </p>
              <Button onClick={() => setOpen(true)} className="brand-gradient text-black hover:opacity-90">
                <Plus /> Criar ativo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {ativos.map((a) => {
              const isAprovacao = a.status === "revisão";
              const isFinalizado = a.status === "entregue";
              const excessoRefacao = (a.refacoes ?? 0) > 2;
              return (
              <Card
                key={a.id}
                className={`relative overflow-hidden rounded-xl border bg-card/80 transition-all ${
                  isAprovacao
                    ? "border-[var(--brand-orange)] glow-orange"
                    : "border-border/60 hover:border-[var(--brand-orange)]/40"
                } ${isFinalizado ? "opacity-70" : ""}`}
              >
                <div className="absolute inset-x-0 top-0 h-px brand-gradient" />
                {isFinalizado && (
                  <div className="absolute right-3 top-3 z-10 size-7 rounded-full bg-emerald-500/20 text-emerald-400 grid place-items-center">
                    <CheckCircle2 className="size-4" />
                  </div>
                )}
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {a.cliente?.logo_url && isHttp(a.cliente.logo_url) ? (
                          <img
                            src={a.cliente.logo_url}
                            alt=""
                            className="size-4 rounded object-contain"
                          />
                        ) : (
                          <span className="size-4 rounded bg-muted grid place-items-center text-[8px] font-bold text-muted-foreground">
                            {(a.cliente?.nome ?? "?").slice(0, 1)}
                          </span>
                        )}
                        <span className="truncate">{a.cliente?.nome ?? "Sem cliente"}</span>
                      </div>
                      <h3 className="mt-1 font-semibold text-base truncate">{a.nome}</h3>
                      {a.servico?.nome && (
                        <div className="text-xs text-muted-foreground truncate">
                          {a.servico.nome}
                        </div>
                      )}
                    </div>
                    {a.eh_extra && (
                      <Badge className="bg-[var(--brand-orange)]/20 text-[var(--brand-orange)] border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/20">
                        <Sparkles className="size-3 mr-1" /> Extra
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Select
                      value={a.status}
                      onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}
                    >
                      <SelectTrigger
                        className={`h-7 w-auto gap-1 px-2 text-[11px] uppercase tracking-wider border ${STATUS_COLOR[a.status] ?? STATUS_COLOR.fila}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {a.prazo && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(a.prazo).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {a.refacoes > 0 && (
                      <button
                        onClick={() => setRefacaoEditor({ id: a.id, value: String(a.refacoes) })}
                        className="inline-flex items-center gap-1 text-[var(--brand-amber)] cursor-pointer hover:underline"
                        title="Clique para editar"
                      >
                        <RefreshCw className="size-3" /> {a.refacoes}ª refação
                        {a.refacoes >= 3 && (
                          <span className="ml-1 rounded bg-[var(--brand-amber)]/20 px-1 text-[10px]">
                            +40%
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {excessoRefacao && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-destructive">
                      <AlertTriangle className="size-3.5" />
                      ALERTA: EXCESSO DE REFAÇÃO
                    </div>
                  )}

                  {a.link_entrega && isHttp(a.link_entrega) && (
                    <a
                      href={a.link_entrega}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-orange)] hover:underline"
                    >
                      <ExternalLink className="size-3" /> Abrir entrega
                    </a>
                  )}

                  {/* ações rápidas */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-full text-xs"
                        onClick={() => decrementRefacao.mutate(a)}
                        disabled={decrementRefacao.isPending || (a.refacoes ?? 0) <= 0}
                        title="Diminuir refação"
                      >
                        <Minus className="size-3" />
                      </Button>
                      <button
                        onClick={() => setRefacaoEditor({ id: a.id, value: String(a.refacoes ?? 0) })}
                        className="h-7 min-w-[28px] px-2 rounded-full border border-border bg-background text-xs font-semibold tabular-nums cursor-pointer hover:bg-accent transition-colors"
                        title="Clique para editar"
                      >
                        {a.refacoes ?? 0}
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-full text-xs"
                        onClick={() => bumpRefacao.mutate(a)}
                        disabled={bumpRefacao.isPending}
                        title="Aumentar refação"
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 rounded-full text-xs">
                          <Layers /> Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => updateStatus.mutate({ id: a.id, status: s })}
                            className="capitalize"
                          >
                            <span className={`mr-2 inline-block size-2 rounded-full ${
                              s === "fila" ? "bg-muted-foreground" :
                              s === "produção" ? "bg-[var(--brand-amber)]" :
                              s === "revisão" ? "bg-[var(--brand-orange)]" :
                              s === "aprovado" ? "bg-emerald-400" : "bg-sky-400"
                            }`} />
                            {s}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full text-xs"
                      onClick={() => setLinkEditor({ id: a.id, value: a.link_entrega ?? "" })}
                    >
                      <Link2 /> Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );})}
          </div>
        )}
      </div>

      {/* dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Novo ativo</DialogTitle>
            <DialogDescription>
              Cadastre uma entrega da fila de produção.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome do ativo *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Carrossel lançamento outubro"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Cliente *</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={clientes.length ? "Selecione" : "Cadastre um cliente antes"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Serviço</Label>
                <Select value={form.servico_id} onValueChange={(v) => setForm({ ...form, servico_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Link de entrega</Label>
              <Input
                value={form.link_entrega}
                onChange={(e) => setForm({ ...form, link_entrega: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.eh_extra}
                onChange={(e) => setForm({ ...form, eh_extra: e.target.checked })}
                className="size-4 rounded border-border accent-[var(--brand-orange)]"
              />
              Item extra (fora do contrato — faturar)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="brand-gradient text-black hover:opacity-90"
            >
              {createMut.isPending ? "Salvando…" : "Cadastrar ativo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit link dialog */}
      <Dialog open={!!linkEditor} onOpenChange={(v) => !v && setLinkEditor(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar link da entrega</DialogTitle>
            <DialogDescription>Cole o link público da entrega (Drive, Frame.io, etc).</DialogDescription>
          </DialogHeader>
          <Input
            value={linkEditor?.value ?? ""}
            onChange={(e) => setLinkEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
            placeholder="https://..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkEditor(null)}>Cancelar</Button>
            <Button
              onClick={() => linkEditor && updateLink.mutate({ id: linkEditor.id, link: linkEditor.value })}
              disabled={updateLink.isPending}
              className="brand-gradient text-black hover:opacity-90"
            >
              {updateLink.isPending ? "Salvando…" : "Salvar link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit refacao dialog */}
      <Dialog open={!!refacaoEditor} onOpenChange={(v) => !v && setRefacaoEditor(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Editar refações</DialogTitle>
            <DialogDescription>Digite o número exato de refações do ativo.</DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min={0}
            value={refacaoEditor?.value ?? ""}
            onChange={(e) => setRefacaoEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && refacaoEditor) {
                setRefacao.mutate({ id: refacaoEditor.id, value: Number(refacaoEditor.value) });
              }
            }}
            placeholder="0"
            className="text-center text-lg font-semibold"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefacaoEditor(null)}>Cancelar</Button>
            <Button
              onClick={() => refacaoEditor && setRefacao.mutate({ id: refacaoEditor.id, value: Number(refacaoEditor.value) })}
              disabled={setRefacao.isPending}
              className="brand-gradient text-black hover:opacity-90"
            >
              {setRefacao.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}