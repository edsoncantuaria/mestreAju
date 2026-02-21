'use client';

import React, { useState } from 'react';
import { Map, Loader2, Target, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateSandboxIdeas, type GenerateSandboxIdeasOutput } from '@/ai/flows/generate-sandbox-ideas';
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
    <div className="space-y-4">
      {!result && !loading ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <Textarea 
            placeholder="Qual a situação atual do sandbox?"
            value={formData.situation}
            onChange={(e) => setFormData({...formData, situation: e.target.value})}
            className="bg-background/30 border-white/5 h-24 text-xs"
          />
          <Textarea 
            placeholder="Contexto de Facções (Opcional)"
            value={formData.factionsContext}
            onChange={(e) => setFormData({...formData, factionsContext: e.target.value})}
            className="bg-background/30 border-white/5 h-16 text-xs"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !formData.situation.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Mapear Possibilidades
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
          <p className="font-headline italic text-xs">Visualizando as ramificações...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
          <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-1">
              <Info size={10} /> Análise
            </h4>
            <p className="text-[10px] leading-relaxed text-muted-foreground">{result.analysis}</p>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {result.possiblePaths.map((path, idx) => (
              <AccordionItem key={idx} value={`path-${idx}`} className="border border-white/5 rounded-lg bg-black/20">
                <AccordionTrigger className="hover:no-underline py-2 px-3 text-xs font-headline text-accent/80">
                  Caminho {idx + 1}: {path.description.slice(0, 30)}...
                </AccordionTrigger>
                <AccordionContent className="p-3 pt-0 space-y-3">
                  <p className="text-[10px] italic text-muted-foreground border-l border-accent/30 pl-2">
                    {path.description}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2 border-t border-white/5 pt-2">
                    <div className="space-y-1">
                      <h5 className="text-[9px] font-bold uppercase tracking-widest text-accent/60">Impacto Curto/Médio</h5>
                      <p className="text-[9px] text-muted-foreground">{path.impacts.shortTerm}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <h5 className="text-[9px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
                      <Target size={8} /> Intriga
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div>
                        <span className="text-green-500/70 font-bold block">Ganha:</span>
                        <p className="text-muted-foreground">{path.agendas.whoGains.slice(0, 2).join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-red-500/70 font-bold block">Traição:</span>
                        <p className="text-muted-foreground truncate">{path.agendas.betrayals.slice(0, 40)}...</p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => setResult(null)}>
            Novo Cenário
          </Button>
        </div>
      )}
    </div>
  );
}