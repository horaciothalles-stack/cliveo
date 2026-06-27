import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FolderKanban,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projetos")({
  component: ProjetosPage,
});

interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  cliente_id: string;
  created_at: string;
  cliente?: { nome: string; logo_url: string | null } | null;
  ativos?: { id: string }[];
}

interface FormState {
  nome: string;
  descricao: string;
  status: string;
  cliente_id: string;
}

const EMPTY: FormState = {
  nome: "",
  descricao: "",
  status: "em andamento",
  cliente_id: "",
};

const STATUS_OPTIONS = ["em andamento", "pausado", "concluído", "cancelado"];

const STATUS_COLOR: Record<string, string> = {
  "em andamento": "bg-[var(--brand-amber)]/15 text-[var(--brand-amber)] border-[var(--brand-amber)]/40",
  pausado: "bg-muted text-muted-foreground border-border",
  concluído: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  cancelado: "bg-destructive/15 text-destructive border-destructive/40",
};

function ProjetosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Projeto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<Projeto | null>(null);

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

  const projetosQ = useQuery({
    queryKey: ["projetos"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("projetos") as any)
        .select("id, nome, descricao, status, cliente_id, created_at, cliente:clientes(nome, logo_url), ativos(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Projeto[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: FormState & { id?: string }) => {
      if (!payload.nome.trim()) throw new Error("Nome é obrigatório");
      if (!payload.cliente_id) throw new Error("Selecione um cliente");
      const row = {
        nome: payload.nome.trim(),
        descricao: payload.descricao.trim() || null,
        status: payload.status,
        cliente_id: payload.cliente_id,
      };
      if (payload.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("projetos") as any).update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("projetos") as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      toast.success(editing ? "Projeto atualizado" : "Projeto criado");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("projetos") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      toast.success("Projeto removido");
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (p: Projeto) => {
    setEditing(p);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      status: p.status,
      cliente_id: p.cliente_id,
    });
    setOpen(true);
  };

  const projetos = projetosQ.data ?? [];
  const clientes = clientesQ.data ?? [];

  const filtered = projetos.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.nome.toLowerCase().includes(q) ||
      (p.cliente?.nome ?? "").toLowerCase().includes(q) ||
      (p.descricao ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout title="Projetos" subtitle="Campanhas e agrupadores de ativos por cliente">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar projeto ou cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} className="brand-gradient text-black border-0 hover:opacity-90">
          <Plus className="size-4 mr-1" /> Novo Projeto
        </Button>
      </div>

      {projetosQ.isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="size-12 rounded-full brand-gradient grid place-items-center">
              <FolderKanban className="size-6 text-black" />
            </div>
            <div className="font-semibold">Nenhum projeto ainda</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Crie um projeto para agrupar ativos de uma mesma campanha ou período.
            </p>
            <Button onClick={openNew} className="brand-gradient text-black border-0">
              <Plus /> Criar projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const totalAtivos = p.ativos?.length ?? 0;
            const logoUrl = p.cliente?.logo_url;
            const isHttp = (u: string) => /^https?:\/\//i.test(u);
            return (
              <Card
                key={p.id}
                className="group relative overflow-hidden hover:border-primary/50 transition-colors bg-card/80"
              >
                <div className="absolute inset-x-0 top-0 h-px brand-gradient" />
                <CardContent className="p-5 flex flex-col gap-4">
                  {/* cliente + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {logoUrl && isHttp(logoUrl) ? (
                        <img
                          src={logoUrl}
                          alt=""
                          className="size-6 rounded object-contain shrink-0"
                        />
                      ) : (
                        <span className="size-6 rounded bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground shrink-0">
                          {(p.cliente?.nome ?? "?").slice(0, 1)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground truncate">
                        {p.cliente?.nome ?? "Sem cliente"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wider shrink-0 ${STATUS_COLOR[p.status] ?? STATUS_COLOR["em andamento"]}`}
                    >
                      {p.status}
                    </Badge>
                  </div>

                  {/* nome */}
                  <div>
                    <h3 className="font-semibold text-base leading-tight">{p.nome}</h3>
                    {p.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {p.descricao}
                      </p>
                    )}
                  </div>

                  {/* ativos count */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="size-3.5" />
                    <span>
                      <span className="text-foreground font-semibold">{totalAtivos}</span>{" "}
                      {totalAtivos === 1 ? "ativo" : "ativos"}
                    </span>
                  </div>

                  {/* ações */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <Link
                      to="/ativos"
                      className="inline-flex items-center gap-1 text-xs text-[var(--brand-orange)] hover:underline"
                    >
                      Ver ativos <ArrowRight className="size-3" />
                    </Link>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => openEdit(p)}
                        aria-label="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(p)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(EMPTY); } }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar projeto" : "Novo projeto"}</DialogTitle>
            <DialogDescription>
              Um projeto agrupa ativos de uma mesma campanha ou período.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome do projeto *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Campanha Dia dos Namorados"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Cliente *</Label>
                <Select
                  value={form.cliente_id}
                  onValueChange={(v) => setForm({ ...form, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        clientes.length ? "Selecione" : "Cadastre um cliente antes"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva o objetivo ou escopo do projeto…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => upsert.mutate({ ...form, id: editing?.id })}
              disabled={upsert.isPending}
              className="brand-gradient text-black hover:opacity-90"
            >
              {upsert.isPending ? "Salvando…" : editing ? "Salvar" : "Criar projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{confirmDelete?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto será removido. Os ativos vinculados não serão excluídos, apenas desvinculados.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}