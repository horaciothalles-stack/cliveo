import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Radar, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/campanhas")({
  component: CampanhasPage,
});

interface ProspectionResult {
  id: string;
  company: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

const mockResults: ProspectionResult[] = [
  {
    id: "1",
    company: "Clínica Bela Pele",
    address: "Rua das Flores, 120 — São Paulo, SP",
    phone: "(11) 99999-1111",
    email: "contato@belapele.com.br",
    website: "https://belapele.com.br",
  },
  {
    id: "2",
    company: "Estética Vita Premium",
    address: "Av. Paulista, 2020 — São Paulo, SP",
    phone: "(11) 98888-2222",
    email: "vitas@vitapremium.com",
    website: "https://vitapremium.com",
  },
  {
    id: "3",
    company: "Médica & Estética",
    address: "Rua Augusta, 500 — São Paulo, SP",
    phone: "(11) 97777-3333",
    email: "atendimento@medicaestetica.com",
    website: "https://medicaestetica.com",
  },
];

function CampanhasPage() {
  const [keyword, setKeyword] = useState("Clínicas de Estética");
  const [location, setLocation] = useState("São Paulo, SP");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results] = useState<ProspectionResult[]>(mockResults);

  const filteredResults = useMemo(() => {
    const query = `${keyword} ${location}`.toLowerCase();
    if (!query.trim()) return results;

    return results.filter((item) => {
      return [item.company, item.address, item.phone, item.email, item.website]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [keyword, location, results]);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <AppLayout title="Radar de Prospecção" subtitle="Ferramenta de busca e qualificação de prospects">
      <Card className="mb-6 border-primary/20 bg-linear-to-br from-background via-background to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Radar className="size-4" />
            </div>
            <div>
              <CardTitle>Pesquisa de Empresas</CardTitle>
              <CardDescription>Busque nichos e localizações com um fluxo inspirado em ferramentas de growth.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nicho / Palavra-chave</label>
              <Input
                placeholder="Ex: Clínicas de Estética"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Localização</label>
              <Input
                placeholder="Ex: São Paulo, SP"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4" />
              Resultado simulado para prototipagem visual.
            </div>
            <Button className="brand-gradient border-0 text-black hover:opacity-90">
              <Search className="mr-1 size-4" /> Iniciar Varredura
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resultados da Varredura</h3>
        {selectedIds.length > 0 ? (
          <Button variant="outline">
            Adicionar {selectedIds.length} leads ao CRM
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Empresa</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(item.id)}
                      className="size-4 rounded border-border"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.company}</TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                    <a href={item.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {item.website}
                    </a>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
