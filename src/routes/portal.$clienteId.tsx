import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle, Clock, FileText, Package,
  RefreshCw, Send, Download, AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/portal/$clienteId")({
  component: PortalPage,
});

const STATUS_CONFIG = {
  fila:                  { label: "Na Fila",                    cor: "bg-gray-500",    icon: Clock         },
  producao:              { label: "Em Produção",                cor: "bg-blue-500",    icon: Package       },
  revisao:               { label: "Em Revisão Interna",         cor: "bg-yellow-500",  icon: RefreshCw     },
  aguardando_aprovacao:  { label: "Aguardando Sua Aprovação",   cor: "bg-orange-500",  icon: AlertCircle   },
  aprovado:              { label: "Aprovado",                   cor: "bg-green-500",   icon: CheckCircle   },
  entregue:              { label: "Entregue",                   cor: "bg-emerald-600", icon: Download      },
};

function PortalPage() {
  const { clienteId } = Route.useParams();
  const queryClient = useQueryClient();
  const [revisaoTexto, setRevisaoTexto] = useState<Record<string, string>>({});
  const [showRevisao, setShowRevisao] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    nome: "", formato: "", descricao: "", referencia: "", prazo: "",
  });

  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ["portal-cliente", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes").select("*").eq("id", clienteId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: ativos = [], isLoading: loadingAtivos } = useQuery({
    queryKey: ["portal-ativos", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ativos").select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // atualiza a cada 30s
  });

  const aprovaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ativos").update({ status: "aprovado" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portal-ativos"] }),
  });

  const revisaoMutation = useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) => {
      const { data } = await supabase
        .from("ativos").select("refacoes").eq("id", id).single();
      const { error } = await supabase
        .from("ativos")
        .update({ status: "producao", refacoes: (data?.refacoes || 0) + 1 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["portal-ativos"] });
      setShowRevisao((p) => ({ ...p, [id]: false }));
      setRevisaoTexto((p) => ({ ...p, [id]: "" }));
    },
  });

  const briefingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ativos").insert({
        cliente_id: clienteId,
        nome: `${form.formato} — ${form.nome}`,
        status: "fila",
        categoria: "incluso",
        prazo: form.prazo || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-ativos"] });
      setForm({ nome: "", formato: "", descricao: "", referencia: "", prazo: "" });
    },
  });

  if (loadingCliente) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Carregando portal...</p>
      </div>
    </div>
  );

  if (!cliente) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h2 className="font-semibold mb-1">Portal não encontrado</h2>
        <p className="text-sm text-muted-foreground">Verifique o link recebido.</p>
      </div>
    </div>
  );

  const cores: string[] = Array.isArray(cliente.paleta_cores) ? cliente.paleta_cores as string[] : [];
  const cor = cores[0] || "#F2B705";
  const ativosAtivos = ativos.filter((a) => a.status !== "entregue");
  const ativosEntregues = ativos.filter((a) => a.status === "entregue");
  const pendentes = ativos.filter((a) => a.status === "aguardando_aprovacao");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cliente.logo_url ? (
              <img src={cliente.logo_url} alt={cliente.nome}
                className="w-9 h-9 rounded-lg object-contain border border-border" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-black"
                style={{ backgroundColor: cor }}>
                {cliente.nome.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm text-foreground">{cliente.nome}</p>
              <p className="text-xs text-muted-foreground">HRC Studio · Portal do Cliente</p>
            </div>
          </div>
          {pendentes.length > 0 && (
            <Badge className="bg-orange-500 text-white animate-pulse">
              {pendentes.length} para aprovar
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="acompanhamento">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="acompanhamento" className="flex-1">
              Acompanhamento
              {ativosAtivos.length > 0 && (
                <span className="ml-1.5 bg-primary/20 text-primary text-xs px-1.5 rounded-full">
                  {ativosAtivos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="solicitacao" className="flex-1">Nova Solicitação</TabsTrigger>
            <TabsTrigger value="arquivos" className="flex-1">
              Arquivos
              {ativosEntregues.length > 0 && (
                <span className="ml-1.5 bg-emerald-500/20 text-emerald-500 text-xs px-1.5 rounded-full">
                  {ativosEntregues.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ACOMPANHAMENTO */}
          <TabsContent value="acompanhamento">
            {loadingAtivos ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
            ) : ativosAtivos.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum ativo em andamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ativosAtivos.map((ativo) => {
                  const cfg = STATUS_CONFIG[ativo.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.fila;
                  const Icon = cfg.icon;
                  const isAguardando = ativo.status === "aguardando_aprovacao";

                  return (
                    <Card key={ativo.id} className={isAguardando ? "border-orange-500/50 shadow-orange-500/10 shadow-md" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">{ativo.nome}</p>
                              {ativo.refacoes > 0 && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {ativo.refacoes} refação{ativo.refacoes > 1 ? "ões" : ""}
                                </Badge>
                              )}
                            </div>
                            {ativo.prazo && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Prazo: {new Date(ativo.prazo).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className={`w-2 h-2 rounded-full ${cfg.cor}`} />
                              <span className="text-xs text-muted-foreground">{cfg.label}</span>
                            </div>
                          </div>
                          <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isAguardando ? "text-orange-500" : "text-muted-foreground"}`} />
                        </div>

                        {isAguardando && (
                          <div className="mt-3 pt-3 border-t border-border">
                            {!showRevisao[ativo.id] ? (
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1 text-black"
                                  style={{ backgroundColor: cor }}
                                  onClick={() => aprovaMutation.mutate(ativo.id)}
                                  disabled={aprovaMutation.isPending}>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprovar
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1"
                                  onClick={() => setShowRevisao((p) => ({ ...p, [ativo.id]: true }))}>
                                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Solicitar Alteração
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-foreground">
                                  Descreva tudo que precisa mudar em uma mensagem:
                                </p>
                                <Textarea
                                  placeholder="Ex: Alterar cor do texto para azul, aumentar o logo, corrigir telefone para..."
                                  value={revisaoTexto[ativo.id] || ""}
                                  onChange={(e) => setRevisaoTexto((p) => ({ ...p, [ativo.id]: e.target.value }))}
                                  rows={4} className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" className="flex-1"
                                    onClick={() => revisaoMutation.mutate({ id: ativo.id, texto: revisaoTexto[ativo.id] || "" })}
                                    disabled={!revisaoTexto[ativo.id] || revisaoMutation.isPending}>
                                    <Send className="w-3.5 h-3.5 mr-1" /> Enviar
                                  </Button>
                                  <Button size="sm" variant="ghost"
                                    onClick={() => setShowRevisao((p) => ({ ...p, [ativo.id]: false }))}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* NOVA SOLICITAÇÃO */}
          <TabsContent value="solicitacao">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nova Solicitação de Peça</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Preencha todos os campos obrigatórios. O botão só é liberado quando tudo estiver preenchido.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nome da peça *</label>
                  <Input placeholder="Ex: Post Dia das Mães, Banner Promoção Junho..."
                    value={form.nome}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Formato *</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.formato}
                    onChange={(e) => setForm((p) => ({ ...p, formato: e.target.value }))}>
                    <option value="">Selecione o formato...</option>
                    <option value="Post Estático">Post Estático (Feed)</option>
                    <option value="Stories">Stories</option>
                    <option value="Reels">Reels / Vídeo</option>
                    <option value="Carrossel">Carrossel</option>
                    <option value="Banner">Banner / Anúncio</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Descrição e textos da peça *
                  </label>
                  <Textarea
                    placeholder="Descreva o que precisa, inclua todos os textos que devem aparecer, estilo, referências..."
                    value={form.descricao}
                    onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                    rows={5} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Links de referência</label>
                  <Input placeholder="Cole links de referência, Pinterest, imagens..."
                    value={form.referencia}
                    onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Prazo desejado</label>
                  <Input type="date" value={form.prazo}
                    onChange={(e) => setForm((p) => ({ ...p, prazo: e.target.value }))} />
                </div>
                <Button className="w-full text-black font-medium"
                  style={{ backgroundColor: form.nome && form.formato && form.descricao ? cor : undefined }}
                  disabled={!form.nome || !form.formato || !form.descricao || briefingMutation.isPending}
                  onClick={() => briefingMutation.mutate()}>
                  <Send className="w-4 h-4 mr-2" />
                  {briefingMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
                </Button>
                {briefingMutation.isSuccess && (
                  <p className="text-sm text-emerald-600 text-center">
                    ✓ Solicitação enviada! Acompanhe na aba Acompanhamento.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ARQUIVOS PRONTOS */}
          <TabsContent value="arquivos">
            {ativosEntregues.length === 0 ? (
              <div className="text-center py-12">
                <Download className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum arquivo entregue ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ativosEntregues.map((ativo) => (
                  <Card key={ativo.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{ativo.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Entregue em {new Date(ativo.updated_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {ativo.link_entrega || ativo.arquivo_url ? (
                        <a href={ativo.link_entrega || ativo.arquivo_url || "#"}
                          target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <Button size="sm" variant="outline">
                            <Download className="w-3.5 h-3.5 mr-1" /> Baixar
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">Em breve</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}