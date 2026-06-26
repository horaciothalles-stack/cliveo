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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ExternalLink, Search, BookOpen, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

interface Cliente {
  id: string;
  nome: string;
  apelido: string | null;
  logo_url: string | null;
  drive_url: string | null;
  manual_marca_url: string | null;
  paleta_cores: string[] | null;
  created_at: string;
}

interface FormState {
  nome: string;
  apelido: string;
  logo_url: string;
  drive_url: string;
  manual_marca_url: string;
  paleta_cores: string; // comma-separated hex
}

const EMPTY: FormState = {
  nome: "",
  apelido: "",
  logo_url: "",
  drive_url: "",
  manual_marca_url: "",
  paleta_cores: "",
};

function parsePaleta(s: string): string[] {
  return s
    .split(/[\s,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Returns a URL string only if it uses http(s); otherwise null.
 * Prevents javascript:, data:, and other unsafe schemes from rendering as links/images.
 */
function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function isValidHttpUrl(value: string): boolean {
  return safeHttpUrl(value) !== null;
}

function ClientesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<Cliente | null>(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: FormState & { id?: string }) => {
      const row = {
        nome: payload.nome.trim(),
        apelido: payload.apelido.trim() || null,
        logo_url: payload.logo_url.trim() || null,
        drive_url: payload.drive_url.trim() || null,
        manual_marca_url: payload.manual_marca_url.trim() || null,
        paleta_cores: parsePaleta(payload.paleta_cores),
      };
      if (payload.id) {
        const { error } = await supabase.from("clientes").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      toast.success(editing ? "Cliente atualizado" : "Cliente criado");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      toast.success("Cliente removido");
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({
      nome: c.nome,
      apelido: c.apelido ?? "",
      logo_url: c.logo_url ?? "",
      drive_url: c.drive_url ?? "",
      manual_marca_url: c.manual_marca_url ?? "",
      paleta_cores: (c.paleta_cores ?? []).join(", "),
    });
    setOpen(true);
  };

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.nome.toLowerCase().includes(q) ||
      (c.apelido ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout title="Clientes" subtitle="Cadastro central de marcas atendidas">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} className="brand-gradient text-black border-0 hover:opacity-90">
          <Plus className="size-4 mr-1" /> Novo Cliente
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto size-12 rounded-full brand-gradient grid place-items-center mb-4">
              <Plus className="size-5 text-black" />
            </div>
            <h3 className="font-semibold">Nenhum cliente ainda</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre o primeiro cliente para começar.
            </p>
            <Button onClick={openNew} className="mt-4 brand-gradient text-black border-0">
              Adicionar cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="group relative overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="size-14 shrink-0 rounded-lg border bg-muted grid place-items-center overflow-hidden">
                    {c.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={safeHttpUrl(c.logo_url) ?? ""}
                        alt={c.nome}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold brand-text-gradient">
                        {c.nome.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.nome}</div>
                    {c.apelido && (
                      <div className="text-xs text-muted-foreground truncate">@{c.apelido}</div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.paleta_cores ?? []).slice(0, 6).map((color, i) => (
                        <span
                          key={i}
                          title={color}
                          className="size-4 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {(c.paleta_cores ?? []).length === 0 && (
                        <Badge variant="outline" className="text-[10px]">sem paleta</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {safeHttpUrl(c.drive_url) && (
                    <a
                      href={safeHttpUrl(c.drive_url)!}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <FolderOpen className="size-3" /> Drive <ExternalLink className="size-3" />
                    </a>
                  )}
                  {safeHttpUrl(c.manual_marca_url) && (
                    <a
                      href={safeHttpUrl(c.manual_marca_url)!}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <BookOpen className="size-3" /> Manual <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDelete(c)}
                    aria-label="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>
              Cadastre informações da marca para vincular a projetos e ativos.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.nome.trim()) return toast.error("Nome é obrigatório");
              for (const [label, val] of [
                ["Logo", form.logo_url],
                ["Drive", form.drive_url],
                ["Manual da marca", form.manual_marca_url],
              ] as const) {
                if (val.trim() && !isValidHttpUrl(val.trim())) {
                  return toast.error(`URL inválida em ${label}: use http:// ou https://`);
                }
              }
              upsert.mutate({ ...form, id: editing?.id });
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apelido">Apelido</Label>
                <Input
                  id="apelido"
                  value={form.apelido}
                  onChange={(e) => setForm({ ...form, apelido: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo">Logo (URL)</Label>
              <Input
                id="logo"
                placeholder="https://…"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="drive">Pasta do Drive</Label>
                <Input
                  id="drive"
                  placeholder="https://drive.google.com/…"
                  value={form.drive_url}
                  onChange={(e) => setForm({ ...form, drive_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual">Manual da Marca</Label>
                <Input
                  id="manual"
                  placeholder="https://…"
                  value={form.manual_marca_url}
                  onChange={(e) => setForm({ ...form, manual_marca_url: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paleta">Paleta de cores (hex separados por vírgula)</Label>
              <Textarea
                id="paleta"
                rows={2}
                placeholder="#F2B705, #F28B0C, #0D0D0D"
                value={form.paleta_cores}
                onChange={(e) => setForm({ ...form, paleta_cores: e.target.value })}
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {parsePaleta(form.paleta_cores).map((c, i) => (
                  <span
                    key={i}
                    className="size-5 rounded-full border"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={upsert.isPending}
                className="brand-gradient text-black border-0"
              >
                {upsert.isPending ? "Salvando…" : editing ? "Salvar" : "Criar cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {confirmDelete?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o cliente e em cascata todos os projetos e ativos vinculados.
              Não pode ser desfeita.
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
