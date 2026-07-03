import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/campanhas")({
  component: CampanhasPage,
});

function CampanhasPage() {
  return (
    <AppLayout title="Campanhas" subtitle="Gestão de campanhas de captação">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Campanhas comerciais</CardTitle>
            <CardDescription>Em breve, controle de anúncios, criativos e captação integrada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nesta página você verá campanhas ativas, performance de mídia e pontos de otimização.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <Plus className="size-4 mr-2" /> Nova campanha
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
