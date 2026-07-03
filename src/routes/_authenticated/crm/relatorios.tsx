import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FileBarChart2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  return (
    <AppLayout title="Relatórios" subtitle="Indicadores e desempenho comercial">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
            <CardDescription>Em breve, métricas de conversão, ROI e performance de campanhas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exiba dashboards de captação, funil e mensagem para suporte à decisão.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <FileBarChart2 className="size-4 mr-2" /> Ver relatórios
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
