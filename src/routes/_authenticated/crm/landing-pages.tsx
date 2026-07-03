import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/landing-pages")({
  component: LandingPagesPage,
});

function LandingPagesPage() {
  return (
    <AppLayout title="Landing Pages" subtitle="Criação e gestão de páginas de captura">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Landing Pages</CardTitle>
            <CardDescription>Em breve, templates nativos e métricas de conversão.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aqui você gerenciará as landings vinculadas às campanhas e ao CRM.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <Globe className="size-4 mr-2" /> Novo template
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
