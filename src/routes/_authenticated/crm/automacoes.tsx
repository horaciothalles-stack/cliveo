import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/automacoes")({
  component: AutomacoesPage,
});

function AutomacoesPage() {
  return (
    <AppLayout title="Automações" subtitle="Fluxos automáticos de relacionamento">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Automações</CardTitle>
            <CardDescription>Em breve, gatilhos e sequências para nurture automático.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina regras, pontos de contato e as ações automatizadas do CRM.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <Zap className="size-4 mr-2" /> Nova automação
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
