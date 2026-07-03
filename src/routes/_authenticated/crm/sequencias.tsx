import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Repeat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/sequencias")({
  component: SequenciasPage,
});

function SequenciasPage() {
  return (
    <AppLayout title="Sequências" subtitle="Fluxos de nutrição e cadência comercial">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sequências</CardTitle>
            <CardDescription>Em breve, cadências e multi-toques automáticos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gestão de sequências de e-mail, WhatsApp e follow-up por estágio.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <Repeat className="size-4 mr-2" /> Nova sequência
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
