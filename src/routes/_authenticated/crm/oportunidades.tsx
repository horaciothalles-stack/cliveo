import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/oportunidades")({
  component: OportunidadesPage,
});

type StageKey = "prospeccao" | "diagnostico" | "proposta" | "negociacao" | "fechado_ganho";

type DealTemperature = "quente" | "morno" | "frio";

interface DealStage {
  id: StageKey;
  title: string;
  accent: string;
}

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  temperature: DealTemperature;
  stage: StageKey;
}

const stages: DealStage[] = [
  { id: "prospeccao", title: "Prospecção", accent: "bg-emerald-500" },
  { id: "diagnostico", title: "Diagnóstico", accent: "bg-sky-500" },
  { id: "proposta", title: "Proposta", accent: "bg-amber-500" },
  { id: "negociacao", title: "Negociação", accent: "bg-violet-500" },
  { id: "fechado_ganho", title: "Fechado/Ganho", accent: "bg-rose-500" },
];

const initialDeals: Deal[] = [
  {
    id: "1",
    title: "Campanha de lançamento",
    company: "Studio Norte",
    value: 18500,
    temperature: "quente",
    stage: "prospeccao",
  },
  {
    id: "2",
    title: "Rebranding corporativo",
    company: "Mundo Digital",
    value: 32000,
    temperature: "morno",
    stage: "diagnostico",
  },
  {
    id: "3",
    title: "Gestão de redes sociais",
    company: "Casa Bela",
    value: 9800,
    temperature: "frio",
    stage: "proposta",
  },
  {
    id: "4",
    title: "Identidade visual completa",
    company: "Aurea Design",
    value: 24000,
    temperature: "quente",
    stage: "negociacao",
  },
];

const temperatureLabel: Record<DealTemperature, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function OportunidadesPage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);

  const groupedDeals = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      items: deals.filter((deal) => deal.stage === stage.id),
    }));
  }, [deals]);

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  const handleNewOpportunity = () => {
    const newDeal: Deal = {
      id: crypto.randomUUID(),
      title: "Nova oportunidade",
      company: "Empresa em análise",
      value: 15000,
      temperature: "morno",
      stage: "prospeccao",
    };

    setDeals((current) => [newDeal, ...current]);
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
        <Button onClick={handleNewOpportunity} className="brand-gradient border-0 text-black hover:opacity-90">
          <Plus className="mr-1 size-4" /> Nova Oportunidade
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4" />
        Layout mockado para visualizar o fluxo de vendas antes da integração com o Supabase.
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {groupedDeals.map((stage) => (
            <div key={stage.id} className="w-80 shrink-0 rounded-xl border bg-muted/20 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${stage.accent}`} />
                  <h3 className="text-sm font-semibold">{stage.title}</h3>
                </div>
                <Badge variant="outline">{stage.items.length}</Badge>
              </div>

              <div className="space-y-3">
                {stage.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Sem oportunidades aqui
                  </div>
                ) : (
                  stage.items.map((deal) => (
                    <Card key={deal.id} className="border-border/70 shadow-sm transition-colors hover:border-primary/50">
                      <CardContent className="space-y-3 p-3">
                        <div>
                          <p className="text-sm font-semibold">{deal.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{deal.company}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-primary">{formatCurrency(deal.value)}</span>
                          <Badge
                            variant="secondary"
                            className={
                              deal.temperature === "quente"
                                ? "bg-rose-100 text-rose-700"
                                : deal.temperature === "morno"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-700"
                            }
                          >
                            {temperatureLabel[deal.temperature]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </AppLayout>
  );
}