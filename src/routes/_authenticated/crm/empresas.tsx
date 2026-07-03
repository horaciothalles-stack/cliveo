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
import { Plus, Search, Pencil, Trash2, Globe, Linkedin, Instagram } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm/empresas")({
  component: EmpresasPage,
});

const WS = "00000000-0000-0000-0000-000000000001";

interface Empresa {
  id: string; workspace_id: string; nome: string; segmento?: string;
  website?: string; linkedin?: string; instagram?: string; telefone?: string;
  cidade?: string; estado?: string; faturamento_est?: string;
  num_funcionarios?: string; notas?: string; tags?: string[]; created_at: string;
}

const EMPTY = { nome: "", segmento: "", website: "", linkedin: "", instagram: "",
  telefone: "", cidade: "", estado: "", faturamento_est: "", num_funcionarios: "", notas: "", tags: "" };

function EmpresasPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<Empresa | null>(null);

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*")
        .eq("workspace_id", WS).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Empresa[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: typeof EMPTY & { id?: string }) => {
      const row = {
        workspace_id: WS, nome: payload.nome.trim(),
        segmento: payload.segmento || null, website: payload.website || null,
        linkedin: payload.linkedin || null, instagram: payload.instagram || null,
        telefone: payload.telefone || null, cidade: payload.cidade || null,
        estado: payload.estado || null, faturamento_est: payload.faturamento_est || null,
        num_funcionarios: payload.num_funcionarios || null, notas: payload.notas || null,
        tags: payload.tags ? payload.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };
      if (payload.id) {
        const { error } = await supabase.from("empresas").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("empresas").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      toast.success(editing ? "Empresa atualizada" : "Empresa criada");
      setOpen(false); setEditing(null); setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empresas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      toast.success("Empresa removida"); setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (e: Empresa) => {
    setEditing(e);
    setForm({ nome: e.nome, segmento: e.segmento ?? "", website: e.website ?? "",
      linkedin: e.linkedin ?? "", instagram: e.instagram ?? "", telefone: e.telefone ?? "",
      cidade: e.cidade ?? "", estado: e.estado ?? "", faturamento_est: e.faturamento_est ?? "",
      num_funcionarios: e.num_funcionarios ?? "", notas: e.notas ?? "",
      tags: (e.tags ?? []).join(", ") });
    setOpen(true);
  };

  const filtered = empresas.filter(e => {
    const q = search.toLowerCase();
    return !q || e.nome.toLowerCase().includes(q) || (e.segmento ?? "").toLowerCase().includes(q);
  });

  return (
    <AppLayout title="Empresas" subtitle="Base de contas e clientes corporativos">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar empresa…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="brand-gradient text-black border-0 hover:opacity-90">
          <Plus className="size-4 mr-1" /> Nova Empresa
        </Button>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Carregando…</p> :
        filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <h3 className="font-semibold">Nenhuma empresa cadastrada</h3>
            <Button onClick={openNew} className="mt-4 brand-gradient text-black border-0">Adicionar empresa</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(e => (
              <Card key={e.id} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{e.nome}</div>
                      {e.segmento && <div className="text-xs text-muted-foreground">{e.segmento}</div>}
                      {(e.cidade || e.estado) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {[e.cidade, e.estado].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    {e.website && <a href={e.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Globe className="size-4" /></a>}
                    {e.linkedin && <a href={e.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Linkedin className="size-4" /></a>}
                    {e.instagram && <a href={`https://instagram.com/${e.instagram.replace("@","")}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Instagram className="size-4" /></a>}
                  </div>
                  {(e.faturamento_est || e.num_funcionarios) && (
                    <div className="flex gap-2 mt-2">
                      {e.faturamento_est && <Badge variant="outline" className="text-[10px]">💰 {e.faturamento_est}</Badge>}
                      {e.num_funcionarios && <Badge variant="outline" className="text-[10px]">👥 {e.num_funcionarios}</Badge>}
                    </div>
                  )}
                  <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(e)} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar empresa" : "Nova empresa"}</DialogTitle>
            <DialogDescription>Cadastre dados da conta corporativa.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={ev => { ev.preventDefault(); if (!form.nome.trim()) return toast.error("Nome é obrigatório"); upsert.mutate({ ...form, id: editing?.id }); }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Segmento</Label><Input value={form.segmento} onChange={e => setForm({ ...form, segmento: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Website</Label><Input placeholder="https://…" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>LinkedIn</Label><Input placeholder="https://linkedin.com/…" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Instagram</Label><Input placeholder="@handle" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Estado</Label><Input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Faturamento estimado</Label><Input placeholder="ex: R$ 50k-200k/mês" value={form.faturamento_est} onChange={e => setForm({ ...form, faturamento_est: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Nº funcionários</Label><Input placeholder="ex: 10-50" value={form.num_funcionarios} onChange={e => setForm({ ...form, num_funcionarios: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Tags</Label><Input placeholder="e-commerce, varejo" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea rows={3} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsert.isPending} className="brand-gradient text-black border-0">
                {upsert.isPending ? "Salvando…" : editing ? "Salvar" : "Criar empresa"}
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