import { createFileRoute } from "@tanstack/react-router";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Flame, Thermometer, Snowflake, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  component: LeadsPage,
});

const WS = "00000000-0000-0000-0000-000000000001";

const STATUS_OPTS = ["novo", "contato", "qualificado", "proposta", "negociacao", "convertido", "perdido"];
const TEMP_OPTS = ["frio", "morno", "quente"];
const ORIGEM_OPTS = ["indicação", "instagram", "google", "linkedin", "site", "evento", "outro"];

const TEMP_ICON: Record<string, React.ReactNode> = {
  frio: <Snowflake className="size-3" />,
  morno: <Thermometer className="size-3" />,
  quente: <Flame className="size-3" />,
};
const TEMP_COLOR: Record<string, string> = {
  frio: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  morno: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  quente: "bg-red-500/10 text-red-400 border-red-500/30",
};
const STATUS_COLOR: Record<string, string> = {
  novo: "bg-slate-500/10 text-slate-400",
  contato: "bg-blue-500/10 text-blue-400",
  qualificado: "bg-violet-500/10 text-violet-400",
  proposta: "bg-amber-500/10 text-amber-400",
  negociacao: "bg-orange-500/10 text-orange-400",
  convertido: "bg-emerald-500/10 text-emerald-400",
  perdido: "bg-red-500/10 text-red-400",
};

interface Lead {
  id: string; workspace_id: string; nome: string; email?: string; telefone?: string;
  cargo?: string; origem?: string; temperatura: string; status: string; score?: number;
  notas?: string; tags?: string[]; utm_source?: string; created_at: string;
}

const EMPTY = { nome: "", email: "", telefone: "", cargo: "", origem: "outro",
  temperatura: "frio", status: "novo", score: "", notas: "", tags: "" };

function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*")
        .eq("workspace_id", WS).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: typeof EMPTY & { id?: string }) => {
      const row = {
        workspace_id: WS, nome: payload.nome.trim(), email: payload.email || null,
        telefone: payload.telefone || null, cargo: payload.cargo || null,
        origem: payload.origem, temperatura: payload.temperatura, status: payload.status,
        score: payload.score ? Number(payload.score) : null,
        notas: payload.notas || null,
        tags: payload.tags ? payload.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };
      if (payload.id) {
        const { error } = await supabase.from("leads").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(editing ? "Lead atualizado" : "Lead criado");
      setOpen(false); setEditing(null); setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead removido"); setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (l: Lead) => {
    setEditing(l);
    setForm({ nome: l.nome, email: l.email ?? "", telefone: l.telefone ?? "",
      cargo: l.cargo ?? "", origem: l.origem ?? "outro", temperatura: l.temperatura,
      status: l.status, score: l.score?.toString() ?? "", notas: l.notas ?? "",
      tags: (l.tags ?? []).join(", ") });
    setOpen(true);
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || l.nome.toLowerCase().includes(q) || (l.email ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "todos" || l.status === filterStatus;
    return matchQ && matchS;
  });

  return (
    <AppLayout title="Leads" subtitle="Gestão e acompanhamento de prospects">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar lead…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {STATUS_OPTS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="brand-gradient text-black border-0 hover:opacity-90">
          <Plus className="size-4 mr-1" /> Novo Lead
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Carregando…</p> :
        filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <h3 className="font-semibold">Nenhum lead encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">Adicione o primeiro lead para começar.</p>
            <Button onClick={openNew} className="mt-4 brand-gradient text-black border-0">Adicionar lead</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(l => (
              <Card key={l.id} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{l.nome}</div>
                      {l.cargo && <div className="text-xs text-muted-foreground">{l.cargo}</div>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${TEMP_COLOR[l.temperatura]}`}>
                        {TEMP_ICON[l.temperatura]} {l.temperatura}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge className={`text-[10px] ${STATUS_COLOR[l.status]}`}>{l.status}</Badge>
                    {l.origem && <Badge variant="outline" className="text-[10px]">{l.origem}</Badge>}
                    {l.score !== undefined && l.score !== null && (
                      <Badge variant="outline" className="text-[10px]">score {l.score}</Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-3">
                    {l.email && <a href={`mailto:${l.email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Mail className="size-3" />{l.email}</a>}
                    {l.telefone && <a href={`tel:${l.telefone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Phone className="size-3" />{l.telefone}</a>}
                  </div>
                  <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(l)} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lead" : "Novo lead"}</DialogTitle>
            <DialogDescription>Registre informações do prospect.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={e => { e.preventDefault(); if (!form.nome.trim()) return toast.error("Nome é obrigatório"); upsert.mutate({ ...form, id: editing?.id }); }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Origem</Label>
                <Select value={form.origem} onValueChange={v => setForm({ ...form, origem: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORIGEM_OPTS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Temperatura</Label>
                <Select value={form.temperatura} onValueChange={v => setForm({ ...form, temperatura: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMP_OPTS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Score (0-100)</Label><Input type="number" min={0} max={100} value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="social media, branding" /></div>
            </div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea rows={3} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsert.isPending} className="brand-gradient text-black border-0">
                {upsert.isPending ? "Salvando…" : editing ? "Salvar" : "Criar lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {confirmDelete?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && remove.mutate(confirmDelete.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}