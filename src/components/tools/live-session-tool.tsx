
'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Loader2, Sword, Plus, Trash2, PenTool, Search, Map, Info, Image as ImageIcon, Copy, Check, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateEncounterStep, type DynamicEncounterOutput } from '@/ai/flows/dynamic-encounter-flow';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveSessionToolProps {
  partyInfo: { members: Array<{ level: number; race?: string; class?: string }> };
  activeSession: any | null;
  onContextAction: (toolId: any, data: any) => void;
}

export function LiveSessionTool({ partyInfo, activeSession, onContextAction }: LiveSessionToolProps) {
  const [currentSituation, setCurrentSituation] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [copiedMacro, setCopiedMacro] = useState<string | null>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  // The history is now derived from activeSession.narrativeLog which is synced with Firestore
  const history: DynamicEncounterOutput[] = activeSession?.narrativeLog || [];

  useEffect(() => {
    if (activeSession && history.length === 0) {
      const startingHook = activeSession.plotHooks?.[0] || '';
      setCurrentSituation(`Sessão: ${activeSession.title}. Cenário: ${startingHook}`);
    }
  }, [activeSession, history.length]);

  const updateNarrativeLog = async (step: DynamicEncounterOutput) => {
    if (!db || !user || !activeSession) return;
    const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
    await updateDoc(sessionRef, {
      narrativeLog: arrayUnion(step),
      dateLastModified: new Date().toISOString()
    });
  };

  const startSession = async () => {
    if (!currentSituation.trim()) return;
    setLoading(true);
    try {
      const step = await generateEncounterStep({
        currentSituation: `${currentSituation} | Lore do Mundo: ${activeSession?.worldLore || ''}`,
        partyInfo,
      });
      await updateNarrativeLog(step);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível iniciar a cena." });
    } finally {
      setLoading(false);
    }
  };

  const chooseOption = async (optionLabel: string) => {
    setLoading(true);
    const lastStep = history[history.length - 1];
    try {
      const step = await generateEncounterStep({
        currentSituation: `${lastStep.narrativa} | Lore Ativa: ${activeSession?.worldLore || ''}`,
        lastChoice: optionLabel,
        partyInfo,
        customInput: customInput.trim() || undefined,
      });
      await updateNarrativeLog(step);
      setCustomInput('');
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível ramificar a cena." });
    } finally {
      setLoading(false);
    }
  };

  const copyMacro = (macro: string) => {
    navigator.clipboard.writeText(macro);
    setCopiedMacro(macro);
    toast({ title: "Macro Copiada!", description: "Cole no chat do Roll20." });
    setTimeout(() => setCopiedMacro(null), 2000);
  };

  const resetHistory = async () => {
    if (!db || !user || !activeSession) return;
    const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
    await updateDoc(sessionRef, {
      narrativeLog: [],
      dateLastModified: new Date().toISOString()
    });
    setCurrentSituation('');
    setCustomInput('');
    toast({ title: "Timeline Limpa", description: "O histórico desta sessão foi resetado no cloud." });
  };

  const lastStep = history[history.length - 1];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {activeSession?.mapImageUrl && (
        <div className="mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-[10px] h-8 gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
            onClick={() => setShowMap(!showMap)}
          >
            <Map size={14} className="text-primary" />
            {showMap ? 'Ocultar Mapa Principal' : 'Ver Mapa do Roll20'}
          </Button>
          {showMap && (
            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-300">
              <img src={activeSession.mapImageUrl} alt="Mapa Principal" className="w-full h-auto" />
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <div className="space-y-4 animate-in fade-in duration-500">
          {!activeSession && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-[10px] text-amber-500">
              <Info size={14} className="shrink-0" />
              <span>Nenhuma preparação carregada. O Copiloto terá menos contexto do seu mundo.</span>
            </div>
          )}
          
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-[10px] text-accent uppercase font-bold mb-2 tracking-widest">Início da Cena</p>
            <Input 
              placeholder="Ex: Os heróis chegam à taverna 'O Dragão Bêbado'..."
              value={currentSituation}
              onChange={(e) => setCurrentSituation(e.target.value)}
              className="bg-background/50 border-white/10 text-xs"
            />
          </div>
          <Button onClick={startSession} disabled={loading || !currentSituation} className="w-full font-headline bg-primary hover:bg-primary/90">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Iniciar Sessão Ativa"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4 pb-4">
              {history.map((step, idx) => {
                const isLast = idx === history.length - 1;
                return (
                  <div key={idx} className={cn(
                    "p-4 rounded-xl border transition-all duration-500",
                    isLast ? "bg-card/80 border-accent/40 shadow-lg scale-100" : "bg-black/20 border-white/5 opacity-60 scale-95"
                  )}>
                    <p className="text-xs leading-relaxed font-body text-foreground/90 italic">
                      "{step.narrativa}"
                    </p>
                    
                    {isLast && step.detalheOculto && (
                      <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-accent animate-pulse" />
                          <span className="text-[10px] font-bold text-accent">DESCOBERTA: {step.detalheOculto}</span>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-accent hover:bg-accent/20"
                          onClick={() => onContextAction('narrative', { 
                            messageContent: `Crie um documento baseado nisto: ${step.detalheOculto}. Contexto: ${step.narrativa}`,
                            documentType: 'documento'
                          })}
                        >
                          <PenTool size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
              <p className="text-[10px] font-headline">Calculando orçamentos de XP e ramificando...</p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300 border-t border-white/5 pt-4">
              <div className="grid grid-cols-1 gap-2">
                {lastStep?.opcoes.map((opt, i) => (
                  <div key={i} className="flex gap-1">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-auto py-3 px-4 flex flex-col items-start gap-1 border-white/10 bg-white/5 hover:bg-accent/10 hover:border-accent/50 transition-all text-left group"
                      onClick={() => chooseOption(opt.label)}
                    >
                      <div className="flex w-full justify-between items-center">
                        <span className="text-xs font-bold text-accent group-hover:text-white">{opt.label}</span>
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase",
                          opt.difficulty === 'Mortal' ? 'bg-red-500/20 text-red-500 border-red-500/50' :
                          opt.difficulty === 'Difícil' ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' :
                          'bg-green-500/20 text-green-500 border-green-500/50'
                        )}>
                          {opt.difficulty}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{opt.description}</span>
                    </Button>
                    {opt.roll20Macro && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-10 h-auto border-white/10 bg-black/40 hover:text-accent"
                              onClick={() => copyMacro(opt.roll20Macro!)}
                            >
                              {copiedMacro === opt.roll20Macro ? <Check size={14} /> : <Terminal size={14} />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-[10px]">Copiar Macro Roll20: {opt.roll20Macro}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center border-t border-white/5 pt-3">
                <Input 
                  placeholder="Ação personalizada..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="h-9 text-[10px] bg-black/40 border-white/10"
                />
                <Button 
                  size="sm" 
                  onClick={() => chooseOption('Ação Customizada')} 
                  disabled={!customInput.trim()}
                  className="h-9 w-9 p-0 bg-primary"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" size="sm" onClick={resetHistory} className="text-[9px] h-6 text-muted-foreground hover:text-destructive">
              <Trash2 size={10} className="mr-1" /> Resetar Cloud Timeline
            </Button>
            {lastStep?.sugestaoMecanica && (
              <div className="text-[9px] text-accent font-bold px-2 py-1 bg-accent/5 rounded border border-accent/20">
                SRD INFO: {lastStep.sugestaoMecanica}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
