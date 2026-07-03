import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/formularios")({
  component: FormulariosPage,
});

function FormulariosPage() {
  return (
    <AppLayout title="Formulários" subtitle="Gerencie formulários de captura e integração">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Formulários</CardTitle>
            <CardDescription>Em breve, formulários nativos com integração direta ao CRM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crie ou conecte formulários de captação e distribua-os em landing pages ou canais externos.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <ClipboardList className="size-4 mr-2" /> Novo formulário
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
