import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm/oportunidades")({
  component: OportunidadesPage,
});

const WS = "00000000-0000-0000-0000-000000000001";

interface Stage { id: string; nome: string; cor: string; ordem: number; tipo: string; }
interface Empresa { id: string; nome: string; }
interface Oportunidade {
  id: string; workspace_id: string; titulo: string; descricao?: string;
  valor?: number; probabilidade?: number; tipo_servico?: string;
  stage_id?: string; empresa_id?: string; data_fechamento_est?: string;
  notas?: string; created_at: string;
}

const EMPTY = { titulo: "", descricao: "", valor: "", probabilidade: "50",
  tipo_servico: "", stage_id: "", empresa_id: "", data_fechamento_est: "", notas: "" };

function fmt(v?: number) {
  if (!v) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OportunidadesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Oportunidade | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<Oportunidade | null>(null);

  const { data: stages = [] } = useQuery({
    queryKey: ["pipeline-stages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pipeline_stages").select("*")
        .eq("workspace_id", WS).order("ordem");
      if (error) throw error;
      return data as Stage[];
    },
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id, nome")
        .eq("workspace_id", WS).order("nome");
      if (error) throw error;
      return data as Empresa[];
    },
  });

  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["oportunidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("oportunidades").select("*")
        .eq("workspace_id", WS).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Oportunidade[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: typeof EMPTY & { id?: string }) => {
      const row = {
        workspace_id: WS, titulo: payload.titulo.trim(),
        descricao: payload.descricao || null,
        valor: payload.valor ? Number(payload.valor) : null,
        probabilidade: payload.probabilidade ? Number(payload.probabilidade) : null,
        tipo_servico: payload.tipo_servico || null,
        stage_id: payload.stage_id || null,
        empresa_id: payload.empresa_id || null,
        data_fechamento_est: payload.data_fechamento_est || null,
        notas: payload.notas || null,
      };
      if (payload.id) {
        const { error } = await supabase.from("oportunidades").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("oportunidades").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success(editing ? "Oportunidade atualizada" : "Oportunidade criada");
      setOpen(false); setEditing(null); setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("oportunidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success("Oportunidade removida"); setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, stage_id: stages[0]?.id ?? "" });
    setOpen(true);
  };
  const openEdit = (o: Oportunidade) => {
    setEditing(o);
    setForm({ titulo: o.titulo, descricao: o.descricao ?? "", valor: o.valor?.toString() ?? "",
      probabilidade: o.probabilidade?.toString() ?? "50", tipo_servico: o.tipo_servico ?? "",
      stage_id: o.stage_id ?? "", empresa_id: o.empresa_id ?? "",
      data_fechamento_est: o.data_fechamento_est ?? "", notas: o.notas ?? "" });
    setOpen(true);
  };

  // Group by stage
  const byStage = stages.map(s => ({
    stage: s,
    items: opps.filter(o => o.stage_id === s.id),
  }));

  const totalValor = opps.reduce((acc, o) => acc + (o.valor ?? 0), 0);

  return (
    <AppLayout title="Oportunidades" subtitle="Pipeline comercial por estágio">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="size-4 text-primary" />
          <span className="text-sm font-medium">Pipeline total: <span className="text-primary">{fmt(totalValor)}</span></span>
        </div>
        <Button onClick={openNew} className="brand-gradient text-black border-0 hover:opacity-90">
          <Plus className="size-4 mr-1" /> Nova Oportunidade
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Carregando…</p> : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {byStage.map(({ stage, items }) => (
            <div key={stage.id} className="shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: stage.cor }} />
                <span className="text-sm font-medium">{stage.nome}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map(o => {
                  const empresa = empresas.find(e => e.id === o.empresa_id);
                  return (
                    <Card key={o.id} className="group hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-3">
                        <div className="font-medium text-sm truncate">{o.titulo}</div>
                        {empresa && <div className="text-xs text-muted-foreground mt-0.5">{empresa.nome}</div>}
                        <div className="flex items-center justify-between mt-2">
                          {o.valor ? <span className="text-xs font-medium text-primary">{fmt(o.valor)}</span> : <span />}
                          {o.probabilidade !== undefined && o.probabilidade !== null && (
                            <Badge variant="outline" className="text-[10px]">{o.probabilidade}%</Badge>
                          )}
                        </div>
                        {o.tipo_servico && <Badge variant="outline" className="text-[10px] mt-1.5">{o.tipo_servico}</Badge>}
                        <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(o)}><Pencil className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(o)}><Trash2 className="size-3.5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {items.length === 0 && (
                  <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                    Sem oportunidades
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle>
            <DialogDescription>Registre uma oportunidade comercial no pipeline.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={e => { e.preventDefault(); if (!form.titulo.trim()) return toast.error("Título é obrigatório"); upsert.mutate({ ...form, id: editing?.id }); }}>
            <div className="space-y-1.5"><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Estágio</Label>
                <Select value={form.stage_id} onValueChange={v => setForm({ ...form, stage_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Empresa</Label>
                <Select value={form.empresa_id} onValueChange={v => setForm({ ...form, empresa_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" min={0} step={0.01} value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Probabilidade (%)</Label><Input type="number" min={0} max={100} value={form.probabilidade} onChange={e => setForm({ ...form, probabilidade: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Previsão fechamento</Label><Input type="date" value={form.data_fechamento_est} onChange={e => setForm({ ...form, data_fechamento_est: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Tipo de serviço</Label><Input placeholder="Social Media, Branding…" value={form.tipo_servico} onChange={e => setForm({ ...form, tipo_servico: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea rows={3} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsert.isPending} className="brand-gradient text-black border-0">
                {upsert.isPending ? "Salvando…" : editing ? "Salvar" : "Criar oportunidade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {confirmDelete?.titulo}?</AlertDialogTitle>
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