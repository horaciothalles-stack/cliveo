import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/whatsapp")({
  component: WhatsappPage,
});

function WhatsappPage() {
  return (
    <AppLayout title="WhatsApp" subtitle="Mensagens, automações e disparos">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription>Em breve, integração de envio e histórico de conversas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crie campanhas e mensagens para leads e clientes diretamente por WhatsApp.
            </p>
            <Button className="brand-gradient text-black border-0" disabled>
              <MessageSquare className="size-4 mr-2" /> Nova mensagem
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
