'use client';

import React, { useState } from 'react';
import { Map, Loader2, Target, Info, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateSandboxIdeas, type GenerateSandboxIdeasOutput } from '@/ai/flows/generate-sandbox-ideas';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="space-y-4 h-full flex flex-col">
      {!result && !loading ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-accent uppercase tracking-widest">Ponto de Partida / Gancho</label>
            <Textarea 
              placeholder="Ex: O grupo encontrou um mapa para as Ruínas de Oakhaven nas mãos de um espião da Guilda dos Ladrões..."
              value={formData.situation}
              onChange={(e) => setFormData({...formData, situation: e.target.value})}
              className="bg-background/30 border-white/5 h-24 text-xs resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contexto (Facções/NPCs)</label>
            <Textarea 
              placeholder="Quais grupos estão na região? Quais interesses estão em jogo?"
              value={formData.factionsContext}
              onChange={(e) => setFormData({...formData, factionsContext: e.target.value})}
              className="bg-background/30 border-white/5 h-16 text-xs resize-none"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !formData.situation.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Mapear Ramificações
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
          <p className="font-headline italic text-xs text-center">Tecendo as teias do Sandbox...</p>
        </div>
      )}

      {result && !loading && (
        <ScrollArea className="flex-1 pr-3 -mr-3">
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500 pb-4">
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-1">
                <Info size={10} /> Análise do Cenário
              </h4>
              <p className="text-[10px] leading-relaxed text-muted-foreground italic">{result.analysis}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Map size={12} /> Caminhos Narrativos Possíveis
              </h4>
              
              <Accordion type="single" collapsible className="w-full space-y-2">
                {result.possiblePaths.map((path, idx) => (
                  <AccordionItem key={idx} value={`path-${idx}`} className="border border-white/5 rounded-xl bg-black/40 overflow-hidden px-0">
                    <AccordionTrigger className="hover:no-underline py-3 px-4 text-xs font-headline text-accent/90">
                      <div className="flex items-center gap-2 text-left">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] shrink-0">{idx + 1}</span>
                        <span className="line-clamp-1">{path.description}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
                      <p className="text-[11px] leading-relaxed text-foreground/80 border-l-2 border-primary/40 pl-3">
                        {path.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h5 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <ArrowRight size={10} /> Repercussões no Mundo
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-2 bg-white/5 rounded border border-white/5">
                            <span className="text-[8px] font-bold text-accent uppercase block mb-1">Curto Prazo</span>
                            <p className="text-[10px] text-muted-foreground">{path.impacts.shortTerm}</p>
                          </div>
                          <div className="p-2 bg-white/5 rounded border border-white/5">
                            <span className="text-[8px] font-bold text-primary uppercase block mb-1">Médio/Longo Prazo</span>
                            <p className="text-[10px] text-muted-foreground">{path.impacts.mediumTerm}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-[9px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
                          <ShieldAlert size={10} /> Jogo de Poder & Agendas
                        </h5>
                        <div className="space-y-2 text-[10px] text-muted-foreground">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[8px] border-green-500/30 text-green-500 bg-green-500/5 h-4">Beneficiados</Badge>
                            <span>{path.agendas.whoGains.join(', ')}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[8px] border-red-500/30 text-red-500 bg-red-500/5 h-4">Perdedores</Badge>
                            <span>{path.agendas.whoLoses.join(', ')}</span>
                          </div>
                          <div className="p-2 bg-purple-500/5 border border-purple-500/20 rounded-lg mt-2 italic text-purple-200/70">
                            <span className="font-bold text-purple-400 block mb-1 uppercase text-[8px]">Risco de Traição</span>
                            {path.agendas.betrayals}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            
            <Button variant="outline" size="sm" className="w-full text-[10px] h-8 mt-4" onClick={() => setResult(null)}>
              Resetar Sandbox
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
