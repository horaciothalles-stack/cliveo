import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/precificacao")({
  component: PrecificacaoPage,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PrecificacaoPage() {
  const [servicoId, setServicoId] = useState("");
  const [horasEstimadas, setHorasEstimadas] = useState("");
  const [margemDesejada, setMargemDesejada] = useState("30");
  const [resultado, setResultado] = useState<null | {
    custoBase: number;
    custoFerramentas: number;
    custoTotal: number;
    precoSugerido: number;
    margemLiquida: number;
  }>(null);

  const servicosQ = useQuery({
    queryKey: ["servicos-precificacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, valor_base")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const servicos = servicosQ.data ?? [];
  const servicoSelecionado = servicos.find((s) => s.id === servicoId);

  const calcular = () => {
    if (!servicoSelecionado) return;
    const horas = parseFloat(horasEstimadas) || 0;
    const margem = parseFloat(margemDesejada) / 100 || 0.3;

    // Custo base = valor_base do serviço × horas
    const custoBase = servicoSelecionado.valor_base * horas;
    // Custo de ferramentas estimado (10% do custo base como proxy)
    const custoFerramentas = custoBase * 0.1;
    const custoTotal = custoBase + custoFerramentas;
    const precoSugerido = custoTotal / (1 - margem);
    const margemLiquida = ((precoSugerido - custoTotal) / precoSugerido) * 100;

    setResultado({ custoBase, custoFerramentas, custoTotal, precoSugerido, margemLiquida });
  };

  const reset = () => {
    setServicoId("");
    setHorasEstimadas("");
    setMargemDesejada("30");
    setResultado(null);
  };

  const margemOk = resultado && resultado.margemLiquida >= 25;

  return (
    <AppLayout title="Precificação" subtitle="Gerador de propostas com margem real">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calculadora */}
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="size-4 text-[var(--brand-amber)]" />
              Calculadora de Proposta
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label>Serviço *</Label>
              <Select value={servicoId} onValueChange={setServicoId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      servicos.length
                        ? "Selecione o serviço"
                        : "Cadastre serviços em Gestão de Serviços"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} — {brl(s.valor_base)}/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {servicoSelecionado && (
                <p className="text-xs text-muted-foreground">
                  Custo-hora base: <span className="font-semibold text-foreground">{brl(servicoSelecionado.valor_base)}</span>
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Horas estimadas *</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={horasEstimadas}
                onChange={(e) => setHorasEstimadas(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>

            <div className="grid gap-2">
              <Label>Margem de lucro desejada (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={margemDesejada}
                onChange={(e) => setMargemDesejada(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: mínimo 25% para cobrir imprevistos e impostos.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={calcular}
                disabled={!servicoId || !horasEstimadas}
                className="flex-1 brand-gradient text-black hover:opacity-90"
              >
                <Calculator className="size-4 mr-1" /> Calcular
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className={`bg-card/80 ${resultado ? (margemOk ? "border-emerald-500/40" : "border-destructive/40") : "border-dashed"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-[var(--brand-orange)]" />
              Resultado da Proposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!resultado ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                <Calculator className="size-10 opacity-30" />
                <p className="text-sm">Preencha os campos e clique em Calcular</p>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  {[
                    { label: "Custo de mão de obra", value: resultado.custoBase },
                    { label: "Custo estimado de ferramentas (10%)", value: resultado.custoFerramentas },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium tabular-nums">{brl(item.value)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo total</span>
                  <span className="font-semibold tabular-nums">{brl(resultado.custoTotal)}</span>
                </div>

                <div className="rounded-xl border border-[var(--brand-orange)]/30 bg-[var(--brand-orange)]/10 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Preço sugerido ao cliente
                  </div>
                  <div className="text-3xl font-bold text-[var(--brand-orange)] tabular-nums">
                    {brl(resultado.precoSugerido)}
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    margemOk
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}
                >
                  {margemOk ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                  Margem líquida real: {resultado.margemLiquida.toFixed(1)}%
                  {!margemOk && " — abaixo do recomendado"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de serviços disponíveis */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Serviços cadastrados
        </h2>
        {servicos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum serviço ativo. Cadastre em{" "}
            <a href="/servicos" className="text-[var(--brand-orange)] hover:underline">
              Gestão de Serviços
            </a>
            .
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {servicos.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card/80 px-4 py-3"
              >
                <span className="text-sm font-medium">{s.nome}</span>
                <Badge
                  variant="outline"
                  className="text-[var(--brand-amber)] border-[var(--brand-amber)]/40 bg-[var(--brand-amber)]/10 tabular-nums"
                >
                  {brl(s.valor_base)}/h
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}