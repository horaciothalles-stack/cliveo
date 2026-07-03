import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/email-marketing")({
  component: EmailMarketingPage,
});

function EmailMarketingPage() {
  return (
    <AppLayout title="E-mail Marketing" subtitle="Campanhas de e-mail segmentadas">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>E-mail Marketing</CardTitle>
            <CardDescription>Em breve, fluxos, templates e métricas de abertura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Planeje envios de e-mail para leads, clientes e funis comerciais.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <Mail className="size-4 mr-2" /> Nova campanha
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
