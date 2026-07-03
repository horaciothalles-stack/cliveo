import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { landingPageTemplates } from "@/lib/landingPageTemplates";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm/landing-pages")({
  component: LandingPagesPage,
});

const WS = "00000000-0000-0000-0000-000000000001";
const STATUS_OPTS = [
  { value: "draft", label: "Rascunho", badge: "bg-slate-500/10 text-slate-400" },
  { value: "published", label: "Publicado", badge: "bg-emerald-500/10 text-emerald-400" },
  { value: "archived", label: "Arquivado", badge: "bg-amber-500/10 text-amber-400" },
];

const EMPTY_FORM = {
  nome: "",
  slug: "",
  templateId: landingPageTemplates[0].id,
  clienteId: "",
  status: "draft",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface Cliente {
  id: string;
  nome: string;
  logo_url: string | null;
  manual_marca_url: string | null;
  paleta_cores: unknown;
}

interface LandingPage {
  id: string;
  workspace_id: string;
  cliente_id: string | null;
  template_id: string;
  nome: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function LandingPagesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(new Set(landingPageTemplates.map((template) => template.category))).sort(),
    ],
    [],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.toLowerCase().trim();
    return landingPageTemplates.filter((template) => {
      const matchCategory = filterCategory === "all" || template.category === filterCategory;
      const matchSearch =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.fileName.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [filterCategory, search]);

  const visibleTemplates = showAllTemplates ? filteredTemplates : filteredTemplates.slice(0, 60);

  const { data: clientes = [], isLoading: loadingClientes } = useQuery<Cliente[]>({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, logo_url, manual_marca_url, paleta_cores");
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const { data: landingPages = [], isLoading: loadingLandingPages } = useQuery<LandingPage[]>({
    queryKey: ["landing-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("workspace_id", WS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LandingPage[];
    },
  });

  const selectedTemplate = useMemo(
    () => landingPageTemplates.find((template) => template.id === form.templateId) ?? landingPageTemplates[0],
    [form.templateId],
  );

  const selectedCliente = useMemo(
    () => clientes.find((cliente) => cliente.id === form.clienteId) ?? null,
    [form.clienteId, clientes],
  );

  const brandColor = useMemo(() => {
    if (!selectedCliente) return "#F59E0B";
    const colors = Array.isArray(selectedCliente.paleta_cores)
      ? (selectedCliente.paleta_cores as string[])
      : [];
    return colors[0] ?? "#F59E0B";
  }, [selectedCliente]);

  const createMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY_FORM) => {
      const slug = payload.slug || slugify(payload.nome);
      const cliente = clientes.find((cliente) => cliente.id === payload.clienteId) ?? null;
      const brand = {
        nome: cliente?.nome ?? "Cliente",
        logo_url: cliente?.logo_url,
        manual_marca_url: cliente?.manual_marca_url,
        paleta_cores: cliente?.paleta_cores ?? [],
      };

      const { error } = await supabase.from("landing_pages").insert({
        workspace_id: WS,
        cliente_id: payload.clienteId || null,
        template_id: payload.templateId,
        nome: payload.nome.trim(),
        slug,
        status: payload.status,
        conteudo: {
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          templateCategory: selectedTemplate.category,
          templateFileName: selectedTemplate.fileName,
          templatePath: selectedTemplate.publicPath,
          nome: payload.nome.trim(),
          slug,
          brand,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Landing page criada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      setOpen(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openNew = () => {
    setForm({ ...EMPTY_FORM, templateId: landingPageTemplates[0].id });
    setOpen(true);
  };

  const openTemplate = (templateId: string) => {
    setForm({ ...EMPTY_FORM, templateId });
    setOpen(true);
  };

  const canCreate = form.nome.trim().length > 0 && form.templateId.length > 0;

  return (
    <AppLayout title="Landing Pages" subtitle="Criação e gestão de páginas de captura">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Escolha um template fixo e gere uma landing page com a identidade visual do cliente.
          </p>
        </div>
        <Button onClick={openNew} className="brand-gradient text-black border-0 hover:opacity-90">
          <Sparkles className="size-4 mr-2" /> Nova landing page
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
              <div className="relative">
                <Input
                  placeholder="Buscar templates..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔎</span>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "Todas" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length === 1 ? "" : "s"}
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum template encontrado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Tente outro termo de busca ou selecione outra categoria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleTemplates.map((template) => (
                <Card key={template.id} className="border-border">
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.previewImage ? (
                      <div className="overflow-hidden rounded-2xl border border-border bg-slate-950/5">
                        <img
                          src={template.previewImage}
                          alt={`Preview de ${template.name}`}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Categoria: {template.category}</div>
                      <div className="break-words">Arquivo: {template.fileName}.json</div>
                    </div>
                    {template.previewText ? (
                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-muted-foreground">
                        {template.previewText}
                      </div>
                    ) : null}
                    <div className="rounded-xl bg-slate-50 p-2 text-xs text-muted-foreground break-words">
                      {template.publicPath}
                    </div>
                    <Button
                      className="w-full brand-gradient text-black border-0"
                      onClick={() => openTemplate(template.id)}
                    >
                      Criar com este template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredTemplates.length > 60 && (
            <div className="text-center">
              <Button variant="ghost" onClick={() => setShowAllTemplates((value) => !value)}>
                {showAllTemplates ? "Mostrar menos" : `Mostrar todos ${filteredTemplates.length}`}
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Landings criadas</CardTitle>
              <CardDescription>Gerencie as páginas geradas a partir de seus templates fixos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingLandingPages ? (
                <p className="text-sm text-muted-foreground">Carregando landings…</p>
              ) : landingPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma landing criada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {landingPages.map((landing) => (
                    <div key={landing.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold truncate">{landing.nome}</p>
                          <p className="text-xs text-muted-foreground">{landing.template_id}</p>
                        </div>
                        <Badge className={landing.status === "published" ? "bg-emerald-500/10 text-emerald-400" : landing.status === "archived" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"}>
                          {landing.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Slug: {landing.slug}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Preview de identidade</CardTitle>
            <CardDescription>Veja como o cliente e o template se combinam.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl border border-border bg-muted p-4" style={{ borderColor: brandColor }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-white p-2 shadow-inner" style={{ backgroundColor: brandColor }}>
                  {selectedCliente?.logo_url ? (
                    <img src={selectedCliente.logo_url} alt={selectedCliente.nome} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-white font-bold">{selectedCliente?.nome?.charAt(0) ?? "C"}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selectedCliente?.nome ?? "Cliente padrão"}</p>
                  <p className="text-xs text-muted-foreground">Identidade aplicada ao template</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Template</div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-lg font-semibold">{selectedTemplate.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">{selectedTemplate.description}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold">Arquivo JSON</p>
                  <p className="mt-2 text-xs text-muted-foreground break-words">{selectedTemplate.publicPath}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova landing page</DialogTitle>
            <DialogDescription>Selecione o template e associe a landing à identidade do cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={form.templateId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, templateId: value }))}
              >
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {visibleTemplates.length > 0 ? (
                    visibleTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="">
                      Nenhum template disponível para este filtro
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {filteredTemplates.length === 0
                  ? "Ajuste a busca ou a categoria para ver templates disponíveis."
                  : filteredTemplates.length > 60
                  ? `Mostrando ${visibleTemplates.length} de ${filteredTemplates.length} templates filtrados.`
                  : `Mostrando ${filteredTemplates.length} templates filtrados.`}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select
                value={form.clienteId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger id="cliente" className="w-full">
                  <SelectValue placeholder={loadingClientes ? "Carregando clientes..." : "Selecione um cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da landing page</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(event) => {
                  const nome = event.target.value;
                  setForm((prev) => ({ ...prev, nome, slug: slugify(nome) }));
                }}
                placeholder="Ex: Página de captação para webinar"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="pagina-de-captacao-webinar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="brand-gradient text-black border-0" disabled={!canCreate || createMutation.isLoading} onClick={() => createMutation.mutate(form)}>
              <Globe className="size-4 mr-2" /> Criar landing page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
