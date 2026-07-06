import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, Building2, Mail, Phone, ExternalLink, Receipt, BrainCircuit, CreditCard, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

interface Client {
  id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  cargo?: string;
  source: string;
  status: string;
  created_at: string;
  notes?: string;
  deals?: { value: number; stage: string }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Estados para edição do DNA da Marca (Cliveo Brain)
  const [brandNotes, setBrandNotes] = useState("");
  const [isSavingBrain, setIsSavingBrain] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Puxa as empresas ativas como clientes e inclui seus respectivos deals fechados para o faturamento (SSOT)
      const { data, error } = await supabase
        .from("companies")
        .select("*, deals(value, stage)")
        .eq("status", "active_client")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar carteira de clientes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Salva o DNA estratégico alimentado por você diretamente no cadastro unificado do cliente
  const handleSaveBrainDNA = async () => {
    if (!selectedClient) return;
    try {
      setIsSavingBrain(true);
      const { error } = await supabase
        .from("companies")
        .update({ notes: brandNotes })
        .eq("id", selectedClient.id);

      if (error) throw error;

      toast.success("Cérebro do Cliveo alimentado com o DNA da marca! 🧠");
      setSelectedClient({ ...selectedClient, notes: brandNotes });
      fetchClients();
    } catch (error: any) {
      toast.error("Erro ao salvar DNA da marca: " + error.message);
    } finally {
      setIsSavingBrain(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.company_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AppLayout title="Carteira de Clientes" subtitle="Gestão operacional, financeira e retenção da HRC Lab">
      <div className="space-y-6">
        {/* Top Header sem botões de cadastro manual */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas Ativas</h1>
            <p className="text-muted-foreground">Clientes gerados de forma automatizada através do funil de vendas.</p>
          </div>
          
          <div className="flex items-center bg-card border border-border p-2 rounded-lg w-72 gap-2">
            <Search className="text-muted-foreground shrink-0 ml-1" size={18} />
            <Input
              placeholder="Buscar conta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl h-64 bg-card/50 p-6 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma conta ativa na esteira.</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Fluxo automatizado ativo: assim que o Gabriel arrastar uma oportunidade para "Fechado/Ganho", a conta surgirá aqui automaticamente com seus valores faturados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              // Soma dinamicamente os valores de contratos fechados do cliente (Conexão direta com faturamento)
              const totalFaturado = client.deals?.filter(d => d.stage === 'fechado_ganho').reduce((sum, deal) => sum + Number(deal.value), 0) || 0;

              return (
                <Card 
                  key={client.id} 
                  className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group shadow-sm"
                  onClick={() => {
                    setSelectedClient(client);
                    setBrandNotes(client.notes || "");
                    setIsProfileOpen(true);
                  }}
                >
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold truncate max-w-[200px]">{client.company_name || client.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        Decisor: {client.name}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Ativo</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Valor Faturado (LTV)</span>
                        <span className="text-base font-bold text-primary">{formatCurrency(totalFaturado)}</span>
                      </div>
                      <Receipt className="text-muted-foreground/50" size={18} />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1 text-xs h-8 gap-1.5 bg-background border border-border hover:bg-muted">
                        <CreditCard size={13} /> Financeiro
                      </Button>
                      <Button variant="secondary" className="flex-1 text-xs h-8 gap-1.5 bg-background border border-border hover:bg-muted">
                        <BrainCircuit size={13} /> DNA da Marca
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* PAINEL LATERAL DE GESTÃO DO CLIENTE */}
        <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <SheetContent className="sm:max-w-[550px] bg-card border-border text-foreground overflow-y-auto">
            {selectedClient && (
              <>
                <SheetHeader className="space-y-1 mb-6">
                  <div className="flex justify-between items-start pt-4">
                    <div>
                      <SheetTitle className="text-2xl font-bold">{selectedClient.company_name || selectedClient.name}</SheetTitle>
                      <SheetDescription className="text-sm mt-1">
                        Responsável Técnico: <span className="text-foreground font-medium">{selectedClient.name}</span> {selectedClient.cargo ? `(${selectedClient.cargo})` : ""}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <Tabs defaultValue="operacional" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted">
                    <TabsTrigger value="operacional">Gestão (Mel)</TabsTrigger>
                    <TabsTrigger value="portal">Portal</TabsTrigger>
                    <TabsTrigger value="dna">DNA (Thalles)</TabsTrigger>
                  </TabsList>

                  {/* Foco Operacional / Financeiro da Melissa */}
                  <TabsContent value="operacional" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground font-medium uppercase">E-mail Cadastrado</span>
                        <p className="font-medium mt-1 truncate flex items-center gap-1.5"><Mail size={13}/> {selectedClient.email || "—"}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground font-medium uppercase">WhatsApp</span>
                        <p className="font-medium mt-1 flex items-center gap-1.5"><Phone size={13}/> {selectedClient.phone || "—"}</p>
                      </div>
                    </div>

                    <div className="border border-border rounded-xl p-4 bg-card space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-1.5"><Receipt size={15}/> Auditoria de Contratos Fechados</h4>
                      <div className="space-y-2">
                        {selectedClient.deals?.filter(d => d.stage === 'fechado_ganho').map((deal, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-muted/30 rounded-lg border border-border/40">
                            <span className="font-medium text-muted-foreground">Contrato Comercial Ativo</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(deal.value)}</span>
                          </div>
                        )) || <p className="text-xs text-muted-foreground">Nenhum contrato ativo contabilizado.</p>}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Portal do Cliente - Escudo Operacional */}
                  <TabsContent value="portal" className="pt-4 space-y-4">
                    <div className="border border-border p-6 rounded-xl text-center space-y-3 bg-muted/10">
                      <ExternalLink className="h-8 w-8 text-primary mx-auto opacity-70" />
                      <h3 className="font-bold text-base">Acesso Seguro ao Portal</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        O cliente acompanha as produções de tráfego, peças e aprovações sem poluir seu WhatsApp pessoal ou da Melissa.
                      </p>
                      <Button className="w-full text-xs font-medium" variant="outline">Copiar Link Mágico do Cliente</Button>
                    </div>
                  </TabsContent>

                  {/* DNA da Marca / Cliveo Brain - Seu Domínio Estratégico */}
                  <TabsContent value="dna" className="pt-4 space-y-4">
                    <div className="border border-primary/20 bg-primary/5 p-4 rounded-xl space-y-4">
                      <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
                        <BrainCircuit size={16} />
                        Alimentação do Cérebro Contextual
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Escreva aqui a essência do cliente (Tom de voz, linha editorial, personas, restrições de cores). Este bloco servirá de contexto obrigatório para a IA na fase de criação.
                      </p>
                      
                      <div className="space-y-2">
                        <Label htmlFor="brain-dna-text" className="text-xs font-medium">Briefing e Identidade de Marca</Label>
                        <Textarea 
                          id="brain-dna-text"
                          placeholder="Ex: Tom de voz arrojado e focado em vendas. Nunca usar cores frias. Foco na persona de médicos de alto padrão..."
                          className="min-h-[160px] bg-background border-border text-xs leading-relaxed"
                          value={brandNotes}
                          onChange={(e) => setBrandNotes(e.target.value)}
                        />
                      </div>

                      <Button 
                        className="w-full text-xs font-medium gap-1.5" 
                        onClick={handleSaveBrainDNA}
                        disabled={isSavingBrain}
                      >
                        {isSavingBrain ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Sincronizando DNA...</>
                        ) : (
                          <><Sparkles size={13} /> Gravar no Cadastro do Cliente</>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}