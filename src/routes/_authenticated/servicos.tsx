import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, Package, Users, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/servicos")({
  component: ServicosPage,
});

interface Servico {
  id: string;
  nome: string;
  valor: number;
}
interface Ferramenta {
  id: string;
  nome: string;
  custo: number;
}
interface Membro {
  id: string;
  cargo: string;
  salario: number;
  encargos: number;
  horas: number;
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([
    { id: "1", nome: "Post Estático", valor: 250 },
    { id: "2", nome: "Vídeo Reels", valor: 600 },
    { id: "3", nome: "Identidade Visual", valor: 3500 },
  ]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([
    { id: "1", nome: "Adobe Creative Cloud", custo: 320 },
    { id: "2", nome: "Canva Pro", custo: 55 },
    { id: "3", nome: "CapCut Pro", custo: 45 },
  ]);
  const [membros, setMembros] = useState<Membro[]>([
    { id: "1", cargo: "Designer Sênior", salario: 6500, encargos: 2200, horas: 160 },
    { id: "2", cargo: "Copywriter", salario: 4500, encargos: 1500, horas: 160 },
  ]);

  const [openDialog, setOpenDialog] = useState<null | "servico" | "ferramenta" | "membro">(null);

  // Form states
  const [sNome, setSNome] = useState("");
  const [sValor, setSValor] = useState("");
  const [fNome, setFNome] = useState("");
  const [fCusto, setFCusto] = useState("");
  const [mCargo, setMCargo] = useState("");
  const [mSalario, setMSalario] = useState("");
  const [mEncargos, setMEncargos] = useState("");
  const [mHoras, setMHoras] = useState("160");

  const resetForms = () => {
    setSNome(""); setSValor("");
    setFNome(""); setFCusto("");
    setMCargo(""); setMSalario(""); setMEncargos(""); setMHoras("160");
  };

  const close = () => { setOpenDialog(null); resetForms(); };

  const addServico = () => {
    if (!sNome.trim()) return;
    setServicos((p) => [...p, { id: crypto.randomUUID(), nome: sNome.trim(), valor: Number(sValor) || 0 }]);
    close();
  };
  const addFerramenta = () => {
    if (!fNome.trim()) return;
    setFerramentas((p) => [...p, { id: crypto.randomUUID(), nome: fNome.trim(), custo: Number(fCusto) || 0 }]);
    close();
  };
  const addMembro = () => {
    if (!mCargo.trim()) return;
    setMembros((p) => [...p, {
      id: crypto.randomUUID(),
      cargo: mCargo.trim(),
      salario: Number(mSalario) || 0,
      encargos: Number(mEncargos) || 0,
      horas: Number(mHoras) || 0,
    }]);
    close();
  };

  const totalFerramentas = useMemo(
    () => ferramentas.reduce((acc, f) => acc + f.custo, 0),
    [ferramentas],
  );

  return (
    <AppLayout
      title="Gestão de Serviços"
      subtitle="Catálogo, custos operacionais e estrutura de equipe"
    >
      <Tabs defaultValue="catalogo" className="space-y-6">
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="catalogo" className="gap-2">
            <Package className="size-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="ferramentas" className="gap-2">
            <Wrench className="size-4" />
            Ferramentas
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2">
            <Users className="size-4" />
            Equipe & Custo-Hora
          </TabsTrigger>
        </TabsList>

        {/* CATALOGO */}
        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Catálogo de Serviços</h2>
              <p className="text-sm text-muted-foreground">Serviços oferecidos pela agência e seus valores de venda.</p>
            </div>
            <Button onClick={() => setOpenDialog("servico")} className="brand-gradient text-black border-0">
              <Plus className="size-4 mr-1" /> Adicionar Serviço
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Valor de venda</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                        Nenhum serviço cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    servicos.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell className="text-right tabular-nums">{brl(s.valor)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setServicos((p) => p.filter((i) => i.id !== s.id))}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FERRAMENTAS */}
        <TabsContent value="ferramentas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Custos de Ferramentas</h2>
              <p className="text-sm text-muted-foreground">Assinaturas e softwares utilizados na produção.</p>
            </div>
            <Button onClick={() => setOpenDialog("ferramenta")} className="brand-gradient text-black border-0">
              <Plus className="size-4 mr-1" /> Adicionar Ferramenta
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead className="text-right">Custo mensal</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ferramentas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                        Nenhuma ferramenta cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {ferramentas.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.nome}</TableCell>
                          <TableCell className="text-right tabular-nums">{brl(f.custo)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setFerramentas((p) => p.filter((i) => i.id !== f.id))}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-semibold">Total mensal</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums brand-text-gradient">
                          {brl(totalFerramentas)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EQUIPE */}
        <TabsContent value="equipe" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Equipe & Custo-Hora</h2>
              <p className="text-sm text-muted-foreground">
                Cálculo: (Salário + Encargos) ÷ Horas úteis mensais.
              </p>
            </div>
            <Button onClick={() => setOpenDialog("membro")} className="brand-gradient text-black border-0">
              <Plus className="size-4 mr-1" /> Adicionar Profissional
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {membros.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum profissional cadastrado.
                </CardContent>
              </Card>
            ) : (
              membros.map((m) => {
                const custoTotal = m.salario + m.encargos;
                const custoHora = m.horas > 0 ? custoTotal / m.horas : 0;
                return (
                  <Card key={m.id} className="relative overflow-hidden">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">{m.cargo}</div>
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {m.horas}h/mês
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setMembros((p) => p.filter((i) => i.id !== m.id))}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md border bg-muted/30 p-2.5">
                          <div className="text-muted-foreground">Salário</div>
                          <div className="font-medium tabular-nums mt-0.5">{brl(m.salario)}</div>
                        </div>
                        <div className="rounded-md border bg-muted/30 p-2.5">
                          <div className="text-muted-foreground">Encargos / Benefícios</div>
                          <div className="font-medium tabular-nums mt-0.5">{brl(m.encargos)}</div>
                        </div>
                      </div>
                      <div className="border-t pt-3 flex items-end justify-between">
                        <div className="text-xs text-muted-foreground">Valor real da hora</div>
                        <div className="text-xl font-bold brand-text-gradient tabular-nums">
                          {brl(custoHora)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <Dialog open={openDialog === "servico"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
            <DialogDescription>Adicione um serviço ao catálogo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome do serviço</Label>
              <Input value={sNome} onChange={(e) => setSNome(e.target.value)} placeholder="Ex.: Post Estático" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor de venda (R$)</Label>
              <Input type="number" min="0" step="0.01" value={sValor} onChange={(e) => setSValor(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancelar</Button>
            <Button onClick={addServico} className="brand-gradient text-black border-0">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "ferramenta"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Ferramenta</DialogTitle>
            <DialogDescription>Cadastre uma assinatura ou software.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome da ferramenta</Label>
              <Input value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Ex.: Adobe Photoshop" />
            </div>
            <div className="space-y-1.5">
              <Label>Custo mensal (R$)</Label>
              <Input type="number" min="0" step="0.01" value={fCusto} onChange={(e) => setFCusto(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancelar</Button>
            <Button onClick={addFerramenta} className="brand-gradient text-black border-0">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "membro"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Profissional</DialogTitle>
            <DialogDescription>Calcule o custo-hora do colaborador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input value={mCargo} onChange={(e) => setMCargo(e.target.value)} placeholder="Ex.: Designer Sênior" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Salário (R$)</Label>
                <Input type="number" min="0" step="0.01" value={mSalario} onChange={(e) => setMSalario(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Encargos (R$)</Label>
                <Input type="number" min="0" step="0.01" value={mEncargos} onChange={(e) => setMEncargos(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Horas úteis mensais</Label>
              <Input type="number" min="1" step="1" value={mHoras} onChange={(e) => setMHoras(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancelar</Button>
            <Button onClick={addMembro} className="brand-gradient text-black border-0">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}