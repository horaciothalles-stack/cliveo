import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Trash, 
  Loader2, 
  Upload,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Building,
  FileText,
  Sparkles,
  TrendingUp
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  component: LeadsComponent,
});

interface Lead {
  id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  cargo?: string;
  source: string;
  temperature: string;
  status: string;
  created_at: string;
  notes?: string;
}

function LeadsComponent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Estados para Evoluir Lead para Oportunidade
  const [isEvolveOpen, setIsEvolveOpen] = useState(false);
  const [evolveData, setEvolveData] = useState({
    title: "",
    value: ""
  });

  // Estados de Importação
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do Formulário de Cadastro Manual
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    cargo: "",
    source: "Manual",
    temperature: "Morno",
  });

  // Estado para Edição de Notas do Brain no Perfil
  const [profileNotes, setProfileNotes] = useState("");
  const [isUpdatingNotes, setIsProcessingNotes] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("status", "lead")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("O nome do lead é obrigatório.");
      return;
    }

    try {
      const { error } = await supabase.from("companies").insert([
        {
          name: formData.name,
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          cargo: formData.cargo,
          source: formData.source,
          temperature: formData.temperature,
          status: "lead",
        },
      ]);

      if (error) throw error;

      toast.success("Lead cadastrado com sucesso!");
      setIsNewLeadOpen(false);
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        cargo: "",
        source: "Manual",
        temperature: "Morno",
      });
      fetchLeads();
    } catch (error: any) {
      toast.error("Erro ao salvar lead: " + error.message);
    }
  };

  // ATUALIZAÇÃO: Salva as Anotações Estratégicas do Gabriel diretamente no Banco
  const handleUpdateNotes = async () => {
    if (!selectedLead) return;
    try {
      setIsProcessingNotes(true);
      const { error } = await supabase
        .from("companies")
        .update({ notes: profileNotes })
        .eq("id", selectedLead.id);

      if (error) throw error;

      toast.success("Notas do Brain atualizadas com sucesso!");
      // Atualiza o estado local para manter a consistência
      setSelectedLead({ ...selectedLead, notes: profileNotes });
      fetchLeads();
    } catch (error: any) {
      toast.error("Erro ao salvar anotações: " + error.message);
    } finally {
      setIsProcessingNotes(false);
    }
  };

  // ATUALIZAÇÃO: Evolui o Lead mudando o status e criando a Oportunidade na tabela deals
  const handleEvolveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (!evolveData.title) {
      toast.error("O título da oportunidade é obrigatório.");
      return;
    }

    try {
      // 1. Cria a Oportunidade (Deal) vinculada a essa empresa
      const { error: dealError } = await supabase.from("deals").insert([
        {
          company_id: selectedLead.id,
          title: evolveData.title,
          value: parseFloat(evolveData.value) || 0,
          stage: "prospeccao"
        }
      ]);

      if (dealError) throw dealError;

      // 2. Altera o status da Empresa para 'prospect' para sumir da triagem de leads frios
      const { error: companyError } = await supabase
        .from("companies")
        .update({ status: "prospect" })
        .eq("id", selectedLead.id);

      if (companyError) throw companyError;

      toast.success("Sucesso! Lead evoluído para o Pipeline de Oportunidades! 🚀");
      setIsEvolveOpen(false);
      setIsProfileOpen(false);
      setEvolveData({ title: "", value: "" });
      fetchLeads();
    } catch (error: any) {
      toast.error("Erro ao evoluir lead: " + error.message);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este lead permanentemente?")) return;

    try {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;

      toast.success("Lead removido com sucesso.");
      fetchLeads();
      if (selectedLead?.id === id) setIsProfileOpen(false);
    } catch (error: any) {
      toast.error("Erro ao deletar lead: " + error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleProcessImport = async () => {
    if (!importFile) return;
    const fileExt = importFile.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'pdf' || fileExt === 'xlsx') {
      toast.info(`A extração inteligente de ${fileExt.toUpperCase()} será ativada com o Cliveo Brain na próxima fase. Por favor, suba uma lista CSV para importação imediata.`);
      return;
    }

    if (fileExt !== 'csv') {
      toast.error('Formato não suportado. Envie um arquivo .csv');
      return;
    }

    setIsProcessingImport(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        
        if (rows.length <= 1) {
          toast.error('O arquivo CSV parece estar vazio.');
          setIsProcessingImport(false);
          return;
        }

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const newLeads = [];

        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim());
          const leadData: any = {
            status: 'lead',
            source: 'Importação de Lista',
            temperature: 'Frio'
          };

          headers.forEach((header, index) => {
            const val = values[index];
            if (!val) return;
            
            if ((header.includes('nome') || header === 'name') && !header.includes('empresa')) leadData.name = val;
            if (header.includes('empresa') || header.includes('company')) leadData.company_name = val;
            if (header.includes('email') || header.includes('e-mail')) leadData.email = val;
            if (header.includes('telefone') || header.includes('celular') || header.includes('phone') || header.includes('whatsapp')) leadData.phone = val;
            if (header.includes('cargo') || header.includes('role')) leadData.cargo = val;
          });

          if (leadData.name) {
            newLeads.push(leadData);
          }
        }

        if (newLeads.length === 0) {
          toast.error('Nenhum lead válido encontrado.');
          return;
        }

        const { error } = await supabase.from('companies').insert(newLeads);
        if (error) throw error;

        toast.success(`${newLeads.length} leads importados!`);
        setIsImportOpen(false);
        setImportFile(null);
        fetchLeads();

      } catch (error: any) {
        toast.error('Erro ao processar: ' + error.message);
      } finally {
        setIsProcessingImport(false);
      }
    };

    reader.readAsText(importFile);
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.company_name?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower)
    );
  });

  const getTemperatureBadge = (temp: string) => {
    switch (temp?.toLowerCase()) {
      case "quente":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20 border-red-500/30">Quente</Badge>;
      case "morno":
        return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 border-amber-500/30">Morno</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20 border-blue-500/30">Frio</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Leads</h1>
            <p className="text-muted-foreground">Mapeie, qualifique e gerencie a porta de entrada da HRC Lab.</p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload size={16} /> Importar Leads
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Importar Lista de Leads</DialogTitle>
                </DialogHeader>
                <div 
                  className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 space-y-3 my-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {importFile ? (
                    <>
                      <FileText className="text-primary h-10 w-10" />
                      <span className="text-sm font-medium text-center text-primary">{importFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="text-muted-foreground h-10 w-10" />
                      <span className="text-sm font-medium text-center">Clique aqui para selecionar arquivo</span>
                      <span className="text-xs text-muted-foreground text-center">Suporta listas CSV, XLSX ou extratos em PDF</span>
                    </>
                  )}
                  <input type="file" accept=".csv,.xlsx,.pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>
                <DialogFooter>
                  <Button onClick={handleProcessImport} disabled={!importFile || isProcessingImport} className="w-full">
                    {isProcessingImport ? "Lendo dados..." : "Processar Arquivo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus size={16} /> Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Lead</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateLead} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="name">Nome do Contato *</Label>
                      <Input id="name" placeholder="Ex: Thalles Horacio" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Nome da Empresa</Label>
                      <Input id="company" placeholder="Ex: HRC Lab" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo do Decisor</Label>
                      <Input id="cargo" placeholder="Ex: Diretor de Marketing" value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" placeholder="nome@empresa.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone / WhatsApp</Label>
                      <Input id="phone" placeholder="(83) 99999-9999" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">Origem do Lead</Label>
                      <Select value={formData.source} onValueChange={(val) => setFormData({...formData, source: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Landing Page">Landing Page</SelectItem>
                          <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                          <SelectItem value="Google Maps">Google Maps (Radar)</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperatura</Label>
                      <Select value={formData.temperature} onValueChange={(val) => setFormData({...formData, temperature: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Frio">Frio ❄️</SelectItem>
                          <SelectItem value="Morno">Morno 🔥</SelectItem>
                          <SelectItem value="Quente">Quente 🌋</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full">Salvar Lead no CRM</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center bg-card border border-border p-3 rounded-lg max-w-md gap-2">
          <Search className="text-muted-foreground" size={18} />
          <Input placeholder="Filtrar por nome, empresa ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8" />
        </div>

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center p-12 space-y-4">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
              <span className="text-sm text-muted-foreground">Sincronizando com o Supabase...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Nenhuma empresa com status 'lead' encontrada.</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nome do Lead</TableHead>
                  <TableHead>Empresa / Cargo</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30 border-border">
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground">{lead.company_name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{lead.cargo || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs space-y-0.5 text-muted-foreground">
                        {lead.email && <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border bg-muted/20 text-muted-foreground">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>{getTemperatureBadge(lead.temperature)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal size={16} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => {
                              setSelectedLead(lead);
                              setProfileNotes(lead.notes || "");
                              setIsProfileOpen(true);
                            }}
                          >
                            <Eye size={14} /> Ver Perfil 360º
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-red-400 focus:text-red-400 cursor-pointer" onClick={() => handleDeleteLead(lead.id)}>
                            <Trash size={14} /> Deletar Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Painel Lateral 360º Totalmente Controlável */}
        <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <SheetContent className="sm:max-w-[500px] bg-card border-border text-foreground overflow-y-auto">
            {selectedLead && (
              <>
                <SheetHeader className="space-y-3">
                  <div className="flex justify-between items-start pt-4">
                    <div>
                      <SheetTitle className="text-2xl font-bold">{selectedLead.name}</SheetTitle>
                      <SheetDescription className="text-sm flex items-center gap-1 mt-1">
                        <Briefcase size={14} /> {selectedLead.cargo || "Sem cargo"} em <span className="text-foreground font-medium">{selectedLead.company_name || "Sem empresa"}</span>
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getTemperatureBadge(selectedLead.temperature)}
                    <Badge variant="secondary">{selectedLead.source}</Badge>
                  </div>
                </SheetHeader>

                <Tabs defaultValue="overview" className="w-full mt-6">
                  <TabsList className="grid w-full grid-cols-3 bg-muted">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="dna">Contexto/DNA</TabsTrigger>
                  </TabsList>

                  {/* Tab Visão Geral com Botão Inteligente de Evoluir Lead */}
                  <TabsContent value="overview" className="space-y-4 pt-3">
                    <div className="bg-muted/40 p-4 rounded-lg border border-border space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Canais de Contato</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                          <Mail className="text-muted-foreground" size={16} />
                          <span>{selectedLead.email || "E-mail não cadastrado"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="text-muted-foreground" size={16} />
                          <span>{selectedLead.phone || "WhatsApp não cadastrado"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/40 p-4 rounded-lg border border-border space-y-2 text-xs text-muted-foreground flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} /> Criado em: {new Date(selectedLead.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {/* MODAL / DIALOG INTERNO PARA TRANSFORMAR O LEAD EM UMA OPORTUNIDADE REAL */}
                    <Dialog open={isEvolveOpen} onOpenChange={setIsEvolveOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:opacity-95">
                          <TrendingUp size={16} /> Evoluir para Oportunidade
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px] bg-card border-border text-foreground">
                        <DialogHeader>
                          <DialogTitle>Evoluir Negócio</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEvolveLead} className="space-y-4 py-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="deal-title">Título da Proposta / Serviço *</Label>
                            <Input 
                              id="deal-title" 
                              placeholder="Ex: Rebranding Corporativo" 
                              value={evolveData.title}
                              onChange={(e) => setEvolveData({...evolveData, title: e.target.value})}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="deal-value">Valor Estimado Inicial (R$)</Label>
                            <Input 
                              id="deal-value" 
                              type="number" 
                              placeholder="Ex: 8500" 
                              value={evolveData.value}
                              onChange={(e) => setEvolveData({...evolveData, value: e.target.value})}
                            />
                          </div>
                          <DialogFooter className="pt-2">
                            <Button type="submit" className="w-full bg-primary text-primary-foreground">Confirmar e Lançar no Kanban</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>

                  {/* Tab Timeline Histórica */}
                  <TabsContent value="timeline" className="pt-3">
                    <div className="relative border-l border-border ml-3 pl-6 space-y-6 py-2">
                      <div className="relative">
                        <span className="absolute -left-[31px] top-0 bg-primary/20 text-primary border border-primary/30 p-1 rounded-full">
                          <Building size={12} />
                        </span>
                        <div className="text-sm font-semibold">Lead Capturado no CRM</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Origem: {selectedLead.source}</div>
                      </div>
                      <div className="relative text-muted-foreground opacity-60">
                        <span className="absolute -left-[31px] top-0 bg-muted border border-border p-1 rounded-full">
                          <Sparkles size={12} />
                        </span>
                        <div className="text-sm font-medium">Triagem do Comercial Ativa</div>
                        <div className="text-xs mt-0.5">Aguardando avanço de contato do Gabriel</div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab DNA Contexto ATIVADA: Gabriel agora tem controle total das anotações */}
                  <TabsContent value="dna" className="space-y-4 pt-3">
                    <div className="space-y-2">
                      <Label htmlFor="brain-notes" className="text-sm font-medium flex items-center gap-1">
                        <Sparkles size={14} className="text-primary" /> Notas Estratégicas (Alimentação do Brain)
                      </Label>
                      <Textarea 
                        id="brain-notes" 
                        placeholder="Mapeie as dores do cliente, budget, concorrentes ou o que foi conversado em reunião para alimentar a inteligência de criação posterior..." 
                        className="min-h-[180px] bg-muted/20 border-border font-sans leading-relaxed"
                        value={profileNotes}
                        onChange={(e) => setProfileNotes(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full bg-primary text-primary-foreground" 
                      onClick={handleUpdateNotes}
                      disabled={isUpdatingNotes}
                    >
                      {isUpdatingNotes ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando notas...</>
                      ) : "Atualizar Notas do Brain"}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-3 mt-8 border-t border-border pt-4">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => window.open(`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}`, '_blank')}>
                    <Phone size={16} /> Enviar WhatsApp
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2" onClick={() => handleDeleteLead(selectedLead.id)}>
                    <Trash size={16} /> Excluir Registro
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}