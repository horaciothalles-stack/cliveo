import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, ClipboardList, ArrowRight, UserCircle2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/briefing")({
  component: BriefingPage,
});

interface Cliente {
  id: string;
  nome: string;
  apelido: string | null;
  logo_url: string | null;
  briefing_checklist: boolean[] | null;
}

function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const CHECKLIST_ITEMS = [
  "Briefing preenchido pelo cliente",
  "Reunião de alinhamento feita",
  "Direcionamento criativo definido",
  "Pasta de referências criada",
];

function BriefingPage() {
  const [search, setSearch] = useState("");
  const [openClienteId, setOpenClienteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes", "briefing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, apelido, logo_url, briefing_checklist")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const normalize = (v: unknown): boolean[] => {
    const arr = Array.isArray(v) ? v : [];
    return Array.from({ length: CHECKLIST_ITEMS.length }, (_, i) => Boolean(arr[i]));
  };

  const updateChecklist = useMutation({
    mutationFn: async ({ id, checklist }: { id: string; checklist: boolean[] }) => {
      const { error } = await supabase
        .from("clientes")
        .update({ briefing_checklist: checklist })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, checklist }) => {
      await queryClient.cancelQueries({ queryKey: ["clientes", "briefing"] });
      const prev = queryClient.getQueryData<Cliente[]>(["clientes", "briefing"]);
      queryClient.setQueryData<Cliente[]>(["clientes", "briefing"], (old) =>
        (old ?? []).map((c) => (c.id === id ? { ...c, briefing_checklist: checklist } : c)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["clientes", "briefing"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", "briefing"] });
    },
  });

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.apelido ?? "").toLowerCase().includes(q)
    );
  });

  const openCliente = clientes.find((c) => c.id === openClienteId) ?? null;

  const toggleCheck = (clienteId: string, index: number) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    const current = normalize(cliente.briefing_checklist);
    const next = [...current];
    next[index] = !next[index];
    updateChecklist.mutate({ id: clienteId, checklist: next });
  };

  const openChecklist = openCliente ? normalize(openCliente.briefing_checklist) : [];
  const checkedCount = openChecklist.filter(Boolean).length;

  return (
    <AppLayout
      title="Matriz de Briefing"
      subtitle="Centralize os briefings ativos de cada marca atendida"
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar marca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto size-12 rounded-full brand-gradient grid place-items-center mb-4">
              <ClipboardList className="size-5 text-black" />
            </div>
            <h3 className="font-semibold">Nenhuma marca cadastrada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre clientes para começar a estruturar os briefings.
            </p>
            <Button asChild className="mt-4 brand-gradient text-black border-0">
              <Link to="/clientes">Ir para Clientes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const logo = safeHttpUrl(c.logo_url);
            const responsavel = c.apelido?.trim() || "Responsável não definido";
            return (
              <Card
                key={c.id}
                className="group relative overflow-hidden hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-4">
                    <div className="size-14 shrink-0 rounded-lg border bg-muted grid place-items-center overflow-hidden">
                      {logo ? (
                        <img
                          src={logo}
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
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <UserCircle2 className="size-3.5" />
                        <span className="truncate">{responsavel}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          Briefing
                        </Badge>
                        {(() => {
                          const done = normalize(c.briefing_checklist).filter(Boolean).length;
                          return (
                            <span className="text-[10px] text-muted-foreground">
                              {done}/{CHECKLIST_ITEMS.length} concluídos
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => setOpenClienteId(c.id)}
                    >
                      Acessar Briefing
                      <ArrowRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!openClienteId} onOpenChange={(open) => { if (!open) setOpenClienteId(null); }}>
        <DialogContent className="sm:max-w-md bg-background border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {openCliente?.nome}
            </DialogTitle>
            <DialogDescription>
              Checklist operacional do briefing — {checkedCount} de {CHECKLIST_ITEMS.length} concluídos
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            {CHECKLIST_ITEMS.map((item, idx) => {
              const isChecked = openChecklist[idx] ?? false;
              return (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40 hover:bg-muted transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleCheck(openClienteId ?? "", idx)}
                  />
                  <span className={`text-sm ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setOpenClienteId(null)}
            >
              <X className="size-3.5 mr-1" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}