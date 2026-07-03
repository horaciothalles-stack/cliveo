import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm/campanhas")({
  component: CampanhasPage,
});

const WS = "00000000-0000-0000-0000-000000000001";

const STATUS_OPTS = [
  { value: "planejada", label: "Planejada", badge: "bg-slate-500/10 text-slate-400" },
  { value: "ativa", label: "Ativa", badge: "bg-emerald-500/10 text-emerald-400" },
  { value: "pausada", label: "Pausada", badge: "bg-amber-500/10 text-amber-400" },
  { value: "finalizada", label: "Finalizada", badge: "bg-violet-500/10 text-violet-400" },
];

const CANAL_OPTS = [
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "E-mail" },
];

const TIPO_OPTS = [
  { value: "ads", label: "Anúncios" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "branding", label: "Branding" },
  { value: "landing_page", label: "Landing Page" },
  { value: "email", label: "E-mail" },
];

interface Campanha {
  id: string;
  workspace_id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  canal?: string;
  status: string;
  budget?: number | null;
  meta_leads?: number | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  notas?: string | null;
  created_at: string;
}

const EMPTY = {
  nome: "",
  descricao: "",
  tipo: "ads",
  canal: "meta",
  status: "planejada",
  budget: "",
  meta_leads: "",
  data_inicio: "",
  data_fim: "",
  notas: "",
};

function fmtCurrency(value?: number | null) {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CampanhasPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campanha | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<Campanha | null>(null);

  const { data: campanhas = [], isLoading } = useQuery({
    queryKey: ["campanhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .eq("workspace_id", WS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campanha[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: typeof EMPTY & { id?: string }) => {
      const row = {
        workspace_id: WS,
        nome: payload.nome.trim(),
        descricao: payload.descricao || null,
        tipo: payload.tipo,
        canal: payload.canal || null,
        status: payload.status,
        budget: payload.budget ? Number(payload.budget) : null,
        meta_leads: payload.meta_leads ? Number(payload.meta_leads) : null,
        data_inicio: payload.data_inicio || null,
        data_fim: payload.data_fim || null,
        notas: payload.notas || null,
      };

      if (payload.id) {
        const { error } = await supabase.from("campanhas").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("campanhas").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campanhas"] });
      toast.success(editing ? "Campanha atualizada" : "Campanha criada");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campanhas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campanhas"] });
      toast.success("Campanha removida");
      setConfirmDelete(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (campanha: Campanha) => {
    setEditing(campanha);
    setForm({
      nome: campanha.nome,
      descricao: campanha.descricao ?? "",
      tipo: campanha.tipo,
      canal: campanha.canal ?? "meta",
      status: campanha.status,
      budget: campanha.budget?.toString() ?? "",
      meta_leads: campanha.meta_leads?.toString() ?? "",
      data_inicio: campanha.data_inicio ?? "",
      data_fim: campanha.data_fim ?? "",
      notas: campanha.notas ?? "",
    });
    setOpen(true);
  };

  const filtered = campanhas.filter((item) => {
    const q = search.toLowerCase();
    const matchText =
      !q ||
      item.nome.toLowerCase().includes(q) ||
      (item.descricao ?? "").toLowerCase().includes(q) ||
      item.canal?.toLowerCase().includes(q) ||
      item.tipo.toLowerCase().includes(q);
    const matchStatus = filterStatus === "todos" || item.status === filterStatus;
    return matchText && matchStatus;
  });

  return (
    <AppLayout title="Campanhas" subtitle="Gestão de campanhas de captação">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
        <div className="flex-1 grid gap-3 sm:grid-cols-[minmax(180px,1fr)_200px]">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar campanha…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUS_OPTS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="brand-gradient text-black border-0 hover:opacity-90">
          <Plus className="size-4 mr-1" /> Nova campanha
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <h3 className="font-semibold">Nenhuma campanha encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1">Crie a primeira campanha para começar.</p>
            <Button onClick={openNew} className="mt-4 brand-gradient text-black border-0">
              <Plus className="size-4 mr-1" /> Criar campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((campanha) => {
            const statusOpt = STATUS_OPTS.find((opt) => opt.value === campanha.status);
            return (
              <Card key={campanha.id} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold truncate">{campanha.nome}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">{campanha.tipo} • {campanha.canal}</div>
                    </div>
                    {statusOpt ? (
                      <Badge className={`text-[10px] ${statusOpt.badge}`}>{statusOpt.label}</Badge>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {campanha.budget ? (
                      <div>Budget: {fmtCurrency(campanha.budget)}</div>
                    ) : null}
                    {campanha.meta_leads ? <div>Meta de leads: {campanha.meta_leads}</div> : null}
                    {campanha.data_inicio || campanha.data_fim ? (
                      <div>
                        {campanha.data_inicio ? `Início: ${campanha.data_inicio}` : ""}
                        {campanha.data_inicio && campanha.data_fim ? " · " : ""}
                        {campanha.data_fim ? `Fim: ${campanha.data_fim}` : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {campanha.descricao ? <Badge variant="outline" className="text-[10px]">Descrição</Badge> : null}
                    {campanha.meta_leads ? <Badge variant="outline" className="text-[10px]">Leads</Badge> : null}
                  </div>

                  <div className="flex justify-end gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(campanha)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(campanha)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar campanha" : "Nova campanha"}</DialogTitle>
            <DialogDescription>Crie ou atualize campanhas de captação.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.nome.trim()) return toast.error("Nome é obrigatório");
              upsert.mutate({ ...form, id: editing?.id });
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(value) => setForm({ ...form, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTS.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Canal</Label>
                <Select value={form.canal} onValueChange={(value) => setForm({ ...form, canal: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANAL_OPTS.map((canal) => (
                      <SelectItem key={canal.value} value={canal.value}>
                        {canal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Budget (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.budget}
                  onChange={(event) => setForm({ ...form, budget: event.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Meta de leads</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.meta_leads}
                  onChange={(event) => setForm({ ...form, meta_leads: event.target.value })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Data de início</Label>
                  <Input
                    type="date"
                    value={form.data_inicio}
                    onChange={(event) => setForm({ ...form, data_inicio: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de fim</Label>
                  <Input
                    type="date"
                    value={form.data_fim}
                    onChange={(event) => setForm({ ...form, data_fim: event.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={4} value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea rows={3} value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsert.isPending} className="brand-gradient text-black border-0">
                {upsert.isPending ? "Salvando…" : editing ? "Salvar" : "Criar campanha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(openState) => !openState && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {confirmDelete?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && remove.mutate(confirmDelete.id)} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
