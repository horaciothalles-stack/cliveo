import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, TrendingUp, Sparkles, Loader2, GripVertical, Building, DollarSign, Trash } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/oportunidades")({
  component: OportunidadesPage,
});

type StageKey = "prospeccao" | "diagnostico" | "proposta" | "negociacao" | "fechado_ganho";

interface DealStage {
  id: StageKey;
  title: string;
  accent: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  company_id: string;
  companies?: {
    name: string;
    temperature: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const stages: DealStage[] = [
  { id: "prospeccao", title: "Prospecção", accent: "bg-emerald-500" },
  { id: "diagnostico", title: "Diagnóstico", accent: "bg-sky-500" },
  { id: "proposta", title: "Proposta", accent: "bg-amber-500" },
  { id: "negociacao", title: "Negociação", accent: "bg-violet-500" },
  { id: "fechado_ganho", title: "Fechado/Ganho", accent: "bg-rose-500" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function OportunidadesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    value: "",
    company_id: "",
    stage: "prospeccao",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select("*, companies(name, temperature)");
      
      if (dealsError) throw dealsError;

      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name");

      if (companiesError) throw companiesError;

      setDeals(dealsData || []);
      setCompanies(companiesData || []);
    } catch (error: any) {
      toast.error("Erro ao carregar pipeline: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedDeals = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      items: deals.filter((deal) => deal.stage === stage.id),
    }));
  }, [deals]);

  const totalValue = useMemo(() => {
    return deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
  }, [deals]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company_id) {
      toast.error("Título e Empresa/Lead são obrigatórios.");
      return;
    }

    try {
      const { error } = await supabase.from("deals").insert([
        {
          title: formData.title,
          value: parseFloat(formData.value) || 0,
          company_id: formData.company_id,
          stage: formData.stage,
        },
      ]);

      if (error) throw error;

      toast.success("Oportunidade adicionada ao pipeline!");
      setIsNewDealOpen(false);
      setFormData({ title: "", value: "", company_id: "", stage: "prospeccao" });
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao criar oportunidade: " + error.message);
    }
  };

  // Função Nova: Deletar Oportunidade
  const handleDeleteDeal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique acione o Drag and Drop sem querer
    if (!confirm("Tem certeza que deseja excluir esta oportunidade? O registro será apagado.")) return;

    try {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;

      toast.success("Negócio descartado com sucesso.");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao deletar oportunidade: " + error.message);
    }
  };

  // --- LÓGICA DRAG AND DROP NATIVO ---
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedDealId(id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (e.target instanceof HTMLElement) e.target.style.opacity = "0.4";
    }, 0);
  };

  const onDragEnd = (e: React.DragEvent) => {
    setDraggedDealId(null);
    if (e.target instanceof HTMLElement) e.target.style.opacity = "1";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!draggedDealId) return;

    // Acha qual é a empresa associada a este negócio
    const dealMovel = deals.find(d => d.id === draggedDealId);

    const updatedDeals = deals.map((deal) => {
      if (deal.id === draggedDealId) return { ...deal, stage: newStage };
      return deal;
    });
    setDeals(updatedDeals);

    try {
      // 1. Atualiza o status do negócio
      const { error: dealError } = await supabase
        .from("deals")
        .update({ stage: newStage })
        .eq("id", draggedDealId);

      if (dealError) throw dealError;

      // 2. GATILHO MÁGICO: Se ganhou, a empresa vira Cliente!
      if (newStage === "fechado_ganho" && dealMovel) {
        await supabase
          .from("companies")
          .update({ status: "active_client" })
          .eq("id", dealMovel.company_id);
          
        toast.success("Parabéns! Negócio fechado! Empresa promovida a Cliente. 🎉");
      }
    } catch (error: any) {
      toast.error("Erro ao mover oportunidade: " + error.message);
      fetchData();
    }
  };

  return (
    <AppLayout title="Oportunidades" subtitle="Quadro Kanban comercial">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <span className="text-sm font-medium">
            Pipeline total: <span className="text-primary">{formatCurrency(totalValue)}</span>
          </span>
        </div>
        
        <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
          <DialogTrigger asChild>
            <Button className="brand-gradient border-0 text-black hover:opacity-90 font-medium">
              <Plus className="mr-1 size-4" /> Nova Oportunidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Adicionar Venda ao Funil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDeal} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Oportunidade *</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Landing Page + Tom de Voz" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Lead / Empresa Vinculada *</Label>
                <Select value={formData.company_id} onValueChange={(val) => setFormData({...formData, company_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o lead cadastrado" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input 
                    id="value" 
                    type="number"
                    placeholder="5000" 
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Fase Inicial</Label>
                  <Select value={formData.stage} onValueChange={(val) => setFormData({...formData, stage: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {stages.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">Adicionar ao Pipeline</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4" />
        Sincronizado em tempo real com o banco de dados SSOT da HRC Lab.
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/40 bg-background/50 p-4">
          <div className="flex gap-4 min-h-[55vh]">
            {groupedDeals.map((stage) => {
              const columnValue = stage.items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

              return (
                <div 
                  key={stage.id} 
                  className="w-80 shrink-0 flex flex-col rounded-xl border bg-muted/10 p-3 select-none"
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, stage.id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${stage.accent}`} />
                      <h3 className="text-sm font-semibold text-foreground">{stage.title}</h3>
                    </div>
                    <Badge variant="outline" className="bg-background text-xs font-mono">{stage.items.length}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-0.5 mb-3 px-1">
                    <DollarSign size={12} className="text-muted-foreground/70" /> {formatCurrency(columnValue)}
                  </div>

                  <div className="flex-1 space-y-3 min-h-[200px]">
                    {stage.items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground/60 flex h-32 items-center justify-center whitespace-normal">
                        Arraste um negócio para esta fase
                      </div>
                    ) : (
                      stage.items.map((deal) => {
                        const temp = deal.companies?.temperature?.toLowerCase() || 'frio';
                        
                        return (
                          <Card 
                            key={deal.id} 
                            draggable
                            onDragStart={(e) => onDragStart(e, deal.id)}
                            onDragEnd={onDragEnd}
                            className="border-border/70 bg-card shadow-sm transition-all hover:border-primary/40 cursor-grab active:cursor-grabbing whitespace-normal relative group"
                          >
                            <CardContent className="space-y-3 p-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground leading-tight break-words">{deal.title}</p>
                                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                                    <Building className="size-3 shrink-0" /> {deal.companies?.name || "Empresa Desconhecida"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <button
                                    onClick={(e) => handleDeleteDeal(deal.id, e)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-400 transition-all cursor-pointer p-1 rounded-md hover:bg-red-500/10"
                                    title="Excluir Oportunidade"
                                  >
                                    <Trash size={14} />
                                  </button>
                                  <GripVertical className="text-muted-foreground/30 shrink-0" size={14} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                <span className="text-sm font-semibold text-primary">{formatCurrency(deal.value)}</span>
                                <Badge
                                  variant="secondary"
                                  className={
                                    temp === "quente"
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 text-[11px] px-1.5 py-0"
                                      : temp === "morno"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 text-[11px] px-1.5 py-0"
                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 text-[11px] px-1.5 py-0"
                                  }
                                >
                                  {deal.companies?.temperature || 'Frio'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </AppLayout>
  );
}