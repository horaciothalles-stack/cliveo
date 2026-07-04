import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Plus, Search, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  component: LeadsPage,
});

type LeadTemperature = "Frio" | "Morno" | "Quente";

type LeadOrigin = "Landing Page" | "Meta Ads" | "WhatsApp" | "Indicação" | "Instagram";

interface Lead {
  id: string;
  name: string;
  company?: string;
  origin: LeadOrigin;
  temperature: LeadTemperature;
  lastInteraction: string;
}

const initialLeads: Lead[] = [
  {
    id: "1",
    name: "Ana Paula Costa",
    company: "Studio Norte",
    origin: "Landing Page",
    temperature: "Quente",
    lastInteraction: "Hoje · 14:20",
  },
  {
    id: "2",
    name: "Carlos Mendes",
    company: "Mundo Digital",
    origin: "Meta Ads",
    temperature: "Morno",
    lastInteraction: "Ontem · 18:40",
  },
  {
    id: "3",
    name: "Beatriz Silva",
    company: "Casa Bela",
    origin: "WhatsApp",
    temperature: "Frio",
    lastInteraction: "Há 3 dias",
  },
  {
    id: "4",
    name: "Rafael Torres",
    origin: "Indicação",
    temperature: "Quente",
    lastInteraction: "Hoje · 09:10",
  },
];

function LeadsPage() {
  const [search, setSearch] = useState("");
  const [leads] = useState<Lead[]>(initialLeads);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
          <Button className="brand-gradient border-0 text-black hover:opacity-90">
            <Plus className="mr-1 size-4" /> Novo Lead
          </Button>
        </div>
      </div>

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
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
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
    </AppLayout>
  );
}