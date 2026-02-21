
'use client';

import React, { useState } from 'react';
import { Map, Send, Loader2, Users, Target, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateSandboxIdeas, type GenerateSandboxIdeasOutput } from '@/ai/flows/generate-sandbox-ideas';
import { FeatureHeader } from '@/components/shared/feature-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function SandboxIdeasTool() {
  const [formData, setFormData] = useState({
    situation: '',
    factionsContext: '',
    pastEventsSummary: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateSandboxIdeasOutput | null>(null);

  const handleGenerate = async () => {
    if (!formData.situation.trim()) return;
    setLoading(true);
    try {
      const data = await generateSandboxIdeas(formData);
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
        title="Ideias Sandbox" 
        description="Explore múltiplos caminhos narrativos e agendas ocultas para sua campanha."
        icon={Map}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card/50 border-primary/20 sticky top-4">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Cenário da Aventura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea 
                  placeholder="Qual a situação atual do sandbox?"
                  value={formData.situation}
                  onChange={(e) => setFormData({...formData, situation: e.target.value})}
                  className="bg-background/50 min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Contexto de Facções (Opcional)"
                  value={formData.factionsContext}
                  onChange={(e) => setFormData({...formData, factionsContext: e.target.value})}
                  className="bg-background/50 h-24"
                />
              </div>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Eventos Passados (Opcional)"
                  value={formData.pastEventsSummary}
                  onChange={(e) => setFormData({...formData, pastEventsSummary: e.target.value})}
                  className="bg-background/50 h-24"
                />
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !formData.situation.trim()}
                className="w-full bg-primary hover:bg-primary/80 font-headline"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Map className="mr-2" />}
                Mapear Possibilidades
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
              <p className="font-headline italic">Visualizando as ramificações do mundo...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <Card className="border-accent/30 bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-md font-headline flex items-center gap-2">
                    <Info className="h-4 w-4 text-accent" />
                    Análise do Cenário
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {result.analysis}
                </CardContent>
              </Card>

              <Accordion type="single" collapsible className="space-y-4">
                {result.possiblePaths.map((path, idx) => (
                  <AccordionItem key={idx} value={`path-${idx}`} className="border rounded-lg px-4 bg-card/40 border-primary/20">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-accent text-xs font-bold uppercase tracking-wider mb-1">Caminho {idx + 1}</span>
                        <span className="font-headline text-lg">{path.description.slice(0, 60)}...</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 space-y-6">
                      <div className="text-sm border-l-2 border-accent pl-4 py-2 bg-accent/5 italic mb-4">
                        {path.description}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-headline text-primary-foreground/70 uppercase text-xs font-bold tracking-widest border-b border-primary/20 pb-1">Curto Prazo</h4>
                          <p className="text-xs text-muted-foreground">{path.impacts.shortTerm}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-headline text-primary-foreground/70 uppercase text-xs font-bold tracking-widest border-b border-primary/20 pb-1">Médio Prazo</h4>
                          <p className="text-xs text-muted-foreground">{path.impacts.mediumTerm}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-headline text-primary-foreground/70 uppercase text-xs font-bold tracking-widest border-b border-primary/20 pb-1">Longo Prazo</h4>
                          <p className="text-xs text-muted-foreground">{path.impacts.longTerm}</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-primary/10">
                        <h4 className="font-headline text-accent flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Agendas &amp; Intrigas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-green-400 font-bold uppercase text-[10px]">Quem ganha</span>
                            <p>{path.agendas.whoGains.join(', ')}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-red-400 font-bold uppercase text-[10px]">Quem perde</span>
                            <p>{path.agendas.whoLoses.join(', ')}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-orange-400 font-bold uppercase text-[10px]">Falsos ganhadores</span>
                            <p>{path.agendas.whoSeemsToGainButLoses.join(', ')}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-purple-400 font-bold uppercase text-[10px]">Manipuladores</span>
                            <p>{path.agendas.manipulators.join(', ')}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                          <span className="text-destructive font-bold text-[10px] uppercase block mb-1">Traições Possíveis</span>
                          <p className="text-xs italic">{path.agendas.betrayals}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20">
              <Map size={80} />
              <p className="mt-4 font-headline text-xl">Trace novas rotas para sua história...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
