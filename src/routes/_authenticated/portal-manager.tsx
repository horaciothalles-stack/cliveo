import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, ExternalLink, CheckCircle, Play,
  Clock, Users, Inbox
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/portal-manager")({
  component: PortalManagerPage,
});

const BASE_URL = window.location.origin;

function PortalManagerPage() {
  const queryClient = useQueryClient();
  const [copiado, setCopiado] = useState<string | null>(null);

  const { data: clientes = [] } = useQuery({
    queryKey: ["portal-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["portal-solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ativos")
        .select("*, clientes(nome, paleta_cores)")
        .eq("status", "fila")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const moverParaEsteira = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ativos").update({ status: "producao" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-solicitacoes"] });
    },
  });

  const copiarLink = (clienteId: string) => {
    const url = `${BASE_URL}/portal/${clienteId}`;
    navigator.clipboard.writeText(url);
    setCopiado(clienteId);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <AppLayout
  title="Portal do Cliente"
  subtitle="Gerencie os links de acesso e acompanhe solicitações recebidas"
>
      <div className="space-y-8">

        {/* SOLICITAÇÕES PENDENTES */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Inbox className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">Solicitações Recebidas</h2>
            {solicitacoes.length > 0 && (
              <Badge className="bg-orange-500 text-white ml-1">
                {solicitacoes.length} nova{solicitacoes.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {solicitacoes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma solicitação pendente no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {solicitacoes.map((s) => {
                const cores = Array.isArray(s.clientes?.paleta_cores)
                  ? s.clientes.paleta_cores as string[]
                  : [];
                const cor = cores[0] || "#F2B705";

                return (
                  <Card key={s.id} className="border-orange-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cor }} />
                            <span className="text-xs text-muted-foreground">
                              {s.clientes?.nome}
                            </span>
                          </div>
                          <p className="font-medium text-sm mt-1">{s.nome}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(s.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit", month: "short",
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                            {s.prazo && (
                              <span className="text-xs text-orange-500 ml-2">
                                Prazo: {new Date(s.prazo).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 text-black"
                          style={{ backgroundColor: cor }}
                          onClick={() => moverParaEsteira.mutate(s.id)}
                          disabled={moverParaEsteira.isPending}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Mover para Esteira
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* LINKS DOS CLIENTES */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">Links de Acesso</h2>
          </div>

          {clientes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum cliente cadastrado ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {clientes.map((c) => {
                const cores = Array.isArray(c.paleta_cores)
                  ? c.paleta_cores as string[]
                  : [];
                const cor = cores[0] || "#F2B705";
                const url = `${BASE_URL}/portal/${c.id}`;

                return (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center
                            font-bold text-black text-sm shrink-0"
                            style={{ backgroundColor: cor }}>
                            {c.nome.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{c.nome}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                              {url}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm" variant="outline"
                            onClick={() => copiarLink(c.id)}
                          >
                            {copiado === c.id ? (
                              <><CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Copiado</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar link</>
                            )}
                          </Button>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}