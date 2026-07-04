import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Mail, MessageCircleMore, Network, Sparkles, TrendingUp, Upload, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  component: LeadsPage,
});

type LeadTemperature = "Frio" | "Morno" | "Quente";

type LeadOrigin = "Landing Page" | "Meta Ads" | "WhatsApp" | "Indicação" | "Instagram";

interface Lead {
  id: string;
  name: string;
  company?: string;
  role?: string;
  origin: LeadOrigin;
  temperature: LeadTemperature;
  lastInteraction: string;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
  notes?: string;
}

interface LeadFormState {
  name: string;
  origin: LeadOrigin | "";
  temperature: LeadTemperature | "";
}

const initialLeads: Lead[] = [
  {
    id: "1",
    name: "Ana Paula Costa",
    company: "Studio Norte",
    role: "Fundadora",
    origin: "Landing Page",
    temperature: "Quente",
    lastInteraction: "Hoje · 14:20",
    email: "ana@studionorte.com.br",
    whatsapp: "+55 11 99999-1111",
    linkedin: "linkedin.com/in/anapaulacosta",
    notes: "Interessada em posicionamento premium e automação de atendimento.",
  },
  {
    id: "2",
    name: "Carlos Mendes",
    company: "Mundo Digital",
    role: "Diretor Comercial",
    origin: "Meta Ads",
    temperature: "Morno",
    lastInteraction: "Ontem · 18:40",
    email: "carlos@mundo.digital",
    whatsapp: "+55 21 98888-2222",
    linkedin: "linkedin.com/in/carlosmendes",
    notes: "Precisa de uma operação mais enxuta para captar clientes e nutrir leads.",
  },
  {
    id: "3",
    name: "Beatriz Silva",
    company: "Casa Bela",
    role: "CEO",
    origin: "WhatsApp",
    temperature: "Frio",
    lastInteraction: "Há 3 dias",
    email: "beatriz@casabela.com",
    whatsapp: "+55 31 97777-3333",
    linkedin: "linkedin.com/in/beatrizsilva",
    notes: "Ainda está avaliando o mercado e priorizando transformação digital.",
  },
  {
    id: "4",
    name: "Rafael Torres",
    role: "Sócio",
    origin: "Indicação",
    temperature: "Quente",
    lastInteraction: "Hoje · 09:10",
    email: "rafael@torres.com.br",
    whatsapp: "+55 11 96666-4444",
    linkedin: "linkedin.com/in/rafael-torres",
    notes: "Quase fechando uma parceria e precisa de uma proposta objetiva.",
  },
];

function LeadsPage() {
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formState, setFormState] = useState<LeadFormState>({
    name: "",
    origin: "",
    temperature: "",
  });

  const loadLeads = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("status", "lead")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Não foi possível carregar os leads.");
      setIsLoading(false);
      return;
    }

    const mappedLeads: Lead[] = (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      company: undefined,
      origin: "Manual",
      temperature: "Frio",
      lastInteraction: "Recém adicionado",
      email: undefined,
      whatsapp: undefined,
      linkedin: undefined,
      notes: undefined,
    }));

    setLeads(mappedLeads);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadLeads();
  }, []);

  const handleCreateLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      toast.error("Informe o nome do lead.");
      return;
    }

    const { error } = await supabase.from("companies").insert({
      name: formState.name.trim(),
      status: "lead",
    });

    if (error) {
      console.error(error);
      toast.error("Não foi possível criar o lead.");
      return;
    }

    toast.success("Lead criado com sucesso.");
    setFormState({ name: "", origin: "", temperature: "" });
    setIsCreateOpen(false);
    void loadLeads();
  };

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leads;

    return leads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(query) ||
        (lead.company ?? "").toLowerCase().includes(query)
      );
    });
  }, [leads, search]);

  return (
    <AppLayout title="Leads" subtitle="Gestão produtiva de prospects e oportunidades">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou empresa"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-1 size-4" /> Importar CSV
          </Button>
          <Button className="brand-gradient border-0 text-black hover:opacity-90" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-1 size-4" /> Novo Lead
          </Button>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Cadastre um novo lead diretamente no CRM.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateLead}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Lead</label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Ana Paula Costa"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origem</label>
                <Select
                  value={formState.origin}
                  onValueChange={(value) => setFormState((current) => ({ ...current, origin: value as LeadOrigin | "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Landing Page">Landing Page</SelectItem>
                    <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Temperatura</label>
                <Select
                  value={formState.temperature}
                  onValueChange={(value) => setFormState((current) => ({ ...current, temperature: value as LeadTemperature | "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frio">Frio</SelectItem>
                    <SelectItem value="Morno">Morno</SelectItem>
                    <SelectItem value="Quente">Quente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Lead</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Lista de Leads</DialogTitle>
            <DialogDescription>
              Arraste um arquivo CSV com os seus leads para importar em massa.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center transition-colors hover:border-primary/60">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-6" />
            </div>
            <p className="mb-1 font-medium">Arraste e solte seu arquivo .csv aqui</p>
            <p className="mb-4 text-sm text-muted-foreground">ou selecione manualmente no seu computador.</p>
            <Input
              type="file"
              accept=".csv"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="mx-auto max-w-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!selectedFile}>
              Processar Arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          {selectedLead ? (
            <>
              <SheetHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <SheetTitle className="text-xl">{selectedLead.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedLead.role ?? "Lead comercial"} • {selectedLead.company ?? "Empresa em análise"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-red-100 text-red-700">
                      {selectedLead.temperature}
                    </Badge>
                    <Badge variant="outline">{selectedLead.origin}</Badge>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="context">Contexto/DNA</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Mail className="size-4 text-primary" /> E-mail
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedLead.email ?? "Não informado"}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <MessageCircleMore className="size-4 text-primary" /> WhatsApp
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedLead.whatsapp ?? "Não informado"}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3 md:col-span-2">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Network className="size-4 text-primary" /> LinkedIn
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedLead.linkedin ?? "Não informado"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="mt-4 space-y-3">
                  <div className="space-y-3">
                    {[
                      { title: "Lead capturado via Radar", detail: "Hoje · 14:20", icon: <Sparkles className="size-4" /> },
                      { title: "E-mail de prospecção enviado", detail: "Ontem · 18:40", icon: <Mail className="size-4" /> },
                      { title: "Clicou na landing page", detail: "Há 3 dias", icon: <TrendingUp className="size-4" /> },
                    ].map((event, index) => (
                      <div key={index} className="flex gap-3 rounded-lg border bg-muted/20 p-3">
                        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">{event.icon}</div>
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="context" className="mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Anotações estratégicas</label>
                    <textarea
                      className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none"
                      defaultValue={selectedLead.notes ?? "Nenhuma anotação ainda."}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <SheetFooter className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button className="brand-gradient border-0 text-black hover:opacity-90">
                  Converter em Oportunidade
                </Button>
                <Button variant="outline">
                  <MessageCircleMore className="mr-1 size-4" /> Enviar WhatsApp
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-background p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Lead</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead>Última Interação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.company ?? "—"}</TableCell>
                <TableCell>{lead.origin}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      lead.temperature === "Quente"
                        ? "bg-red-100 text-red-700"
                        : lead.temperature === "Morno"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                    }
                  >
                    {lead.temperature}
                  </Badge>
                </TableCell>
                <TableCell>{lead.lastInteraction}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                        Ver Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem>Mover para Oportunidade</DropdownMenuItem>
                      <DropdownMenuItem>Enviar E-mail</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </AppLayout>
  );
}