'use client';

import React, { useState, useEffect } from 'react';
import { Map, Loader2, Target, Info, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateSandboxIdeas, type GenerateSandboxIdeasOutput } from '@/ai/flows/generate-sandbox-ideas';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface SandboxIdeasToolProps {
  activeSession: any | null;
  setGlobalLoading: (loading: boolean) => void;
}

export function SandboxIdeasTool({ activeSession, setGlobalLoading }: SandboxIdeasToolProps) {
  const { user } = useUser();
  const db = useFirestore();

  const [formData, setFormData] = useState({
    situation: '',
    factionsContext: '',
    pastEventsSummary: ''
  });
  const [result, setResult] = useState<GenerateSandboxIdeasOutput | null>(null);

  useEffect(() => {
    if (activeSession?.toolStates?.sandbox) {
      setFormData(prev => ({ ...prev, ...activeSession.toolStates.sandbox }));
    }
    if (activeSession?.toolStates?.sandbox_result) {
      setResult(activeSession.toolStates.sandbox_result);
    }
  }, [activeSession?.id]);

  const persistToolState = async (updates: any) => {
    if (!db || !user || !activeSession) return;
    const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
    updateDoc(sessionRef, { 
      [`toolStates.sandbox`]: { ...formData, ...updates } 
    });
  };

  const handleGenerate = async () => {
    if (!formData.situation.trim()) return;
    setGlobalLoading(true);
    try {
      const data = await generateSandboxIdeas({
        ...formData,
        pastEventsSummary: activeSession?.worldLore || formData.pastEventsSummary,
        factionsContext: activeSession?.involvedFactionIds?.join(', ') || formData.factionsContext
      });
      setResult(data);
      
      if (db && user && activeSession.id) {
        const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
        updateDoc(sessionRef, { 'toolStates.sandbox_result': data });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const updateForm = (updates: any) => {
    const nextState = { ...formData, ...updates };
    setFormData(nextState);
    persistToolState(updates);
  };

  const resetResult = () => {
    setResult(null);
    if (db && user && activeSession.id) {
      const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
      updateDoc(sessionRef, { 'toolStates.sandbox_result': null });
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {!result ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-accent uppercase tracking-widest">Ponto de Partida / Gancho</label>
            <Textarea 
              placeholder="Ex: O grupo encontrou um mapa para as Ruínas de Oakhaven..."
              value={formData.situation}
              onChange={(e) => updateForm({ situation: e.target.value })}
              className="bg-background/30 border-white/5 h-24 text-xs resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contexto de Facções</label>
            <Textarea 
              placeholder="Quais interesses estão em jogo?"
              value={formData.factionsContext}
              onChange={(e) => updateForm({ factionsContext: e.target.value })}
              className="bg-background/30 border-white/5 h-16 text-xs resize-none"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={!formData.situation.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Gerar Ramificações Sandbox
          </Button>
        </div>
      ) : null}

      {result && (
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
                <Map size={12} /> Destinos Possíveis
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
                          <ArrowRight size={10} /> Impactos no Mundo
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
                          <ShieldAlert size={10} /> Jogo de Poder
                        </h5>
                        <div className="space-y-2 text-[10px] text-muted-foreground">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[8px] border-green-500/30 text-green-500 bg-green-500/5 h-4">Beneficiados</Badge>
                            <span>{path.agendas.whoGains.join(', ')}</span>
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
            
            <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={resetResult}>
              Nova Projeção Sandbox
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
