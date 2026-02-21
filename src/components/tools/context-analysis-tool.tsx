
'use client';

import React, { useState } from 'react';
import { Search, Send, Loader2, Skull, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { analyzeContext, type AnalyzeContextOutput } from '@/ai/flows/analyze-context';
import { FeatureHeader } from '@/components/shared/feature-header';
import { Label } from '@/components/ui/label';

export function ContextAnalysisTool() {
  const [formData, setFormData] = useState({
    situation: '',
    pastEvents: '',
    npcs: '',
    factions: '',
    promises: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeContextOutput | null>(null);

  const handleAnalyze = async () => {
    if (!formData.situation.trim()) return;
    setLoading(true);
    try {
      const data = await analyzeContext(formData);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <FeatureHeader 
        title="Análise de Contexto" 
        description="Analise situações específicas considerando NPCs, facções e promessas passadas."
        icon={Search}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-accent font-headline">A Situação Atual</Label>
                <Textarea 
                  placeholder="Ex: O grupo foi pego roubando o tesouro do Barão..."
                  value={formData.situation}
                  onChange={(e) => setFormData({...formData, situation: e.target.value})}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Eventos Passados Relevantes</Label>
                <Textarea 
                  placeholder="O que aconteceu antes que influencia agora?"
                  value={formData.pastEvents}
                  onChange={(e) => setFormData({...formData, pastEvents: e.target.value})}
                  className="bg-background/50 h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">NPCs Envolvidos</Label>
                  <Textarea 
                    placeholder="Nomes e papéis..."
                    value={formData.npcs}
                    onChange={(e) => setFormData({...formData, npcs: e.target.value})}
                    className="bg-background/50 h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Facções</Label>
                  <Textarea 
                    placeholder="Organizações..."
                    value={formData.factions}
                    onChange={(e) => setFormData({...formData, factions: e.target.value})}
                    className="bg-background/50 h-20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Promessas / Segredos</Label>
                <Textarea 
                  placeholder="Dívidas de sangue, juramentos..."
                  value={formData.promises}
                  onChange={(e) => setFormData({...formData, promises: e.target.value})}
                  className="bg-background/50 h-20"
                />
              </div>
              <Button 
                onClick={handleAnalyze} 
                disabled={loading || !formData.situation.trim()}
                className="w-full bg-primary hover:bg-primary/80 font-headline h-12"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                Decifrar Destino
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
              <p className="font-headline italic">Tecendo as linhas do destino...</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-accent/40 bg-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-headline text-accent">🔎 Análise</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed">
                  {result.analise}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-headline flex items-center gap-2">
                      <ShieldCheck className="text-green-500 h-4 w-4" />
                      Caminhos &amp; Sucessos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.caminhosPossiveis.map((p, i) => (
                      <div key={i} className="text-xs p-2 bg-primary/10 rounded border-l-2 border-primary">
                        {p}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-destructive/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-headline flex items-center gap-2 text-destructive">
                      <Skull className="h-4 w-4" />
                      Complicação Oculta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm italic">
                    {result.complicacaoOculta}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-headline flex items-center gap-2">
                    <Zap className="text-accent h-4 w-4" />
                    Consequências Imediatas &amp; Longas
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-accent/80">Curto Prazo:</span>
                    <p>{result.consequencias.curtoPrazo}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-accent/80">Médio Prazo:</span>
                    <p>{result.consequencias.medioPrazo}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-accent/80">Longo Prazo:</span>
                    <p>{result.consequencias.longoPrazo}</p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm italic">
                <span className="font-headline font-bold text-accent not-italic">Escalonamento de Tensão: </span>
                {result.escalonamentoTensao}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20">
              <Search size={80} />
              <p className="mt-4 font-headline text-xl">Aguardando entrada para análise...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
