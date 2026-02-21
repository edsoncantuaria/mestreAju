'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Loader2, Sword, Plus, Trash2, PenTool, Search, Map, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateEncounterStep, type DynamicEncounterOutput } from '@/ai/flows/dynamic-encounter-flow';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LiveSessionToolProps {
  partyInfo: { playerCount: number; averageLevel: number };
  activeSession: any | null;
  onContextAction: (toolId: any, data: any) => void;
}

export function LiveSessionTool({ partyInfo, activeSession, onContextAction }: LiveSessionToolProps) {
  const [history, setHistory] = useState<DynamicEncounterOutput[]>([]);
  const [currentSituation, setCurrentSituation] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill starting situation if a session is loaded
  useEffect(() => {
    if (activeSession && history.length === 0) {
      const startingHook = activeSession.plotHooks?.[0] || '';
      setCurrentSituation(`Sessão: ${activeSession.title}. Cenário: ${startingHook}`);
    }
  }, [activeSession, history.length]);

  const startSession = async () => {
    if (!currentSituation.trim()) return;
    setLoading(true);
    try {
      const step = await generateEncounterStep({
        currentSituation: `${currentSituation} | Lore do Mundo: ${activeSession?.worldLore || ''}`,
        partyInfo,
      });
      setHistory([step]);
    } catch (e) {
      console.error(e);
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
      setHistory([...history, step]);
      setCustomInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setHistory([]);
    setCurrentSituation('');
    setCustomInput('');
  };

  const lastStep = history[history.length - 1];

  return (
    <div className="space-y-4 h-full flex flex-col">
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
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {history.slice(-3).map((step, idx) => {
              const isLast = idx === history.slice(-3).length - 1;
              return (
                <div key={idx} className={cn(
                  "p-4 rounded-xl border transition-all duration-500",
                  isLast ? "bg-card/80 border-accent/40 shadow-lg scale-100" : "bg-black/20 border-white/5 opacity-40 scale-95"
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
                      
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px]">Gerar Documento</p></TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-accent hover:bg-accent/20"
                                onClick={() => onContextAction('analysis', { 
                                  situation: step.narrativa,
                                  npcs: step.detalheOculto
                                })}
                              >
                                <Search size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px]">Analisar Contexto</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
              <p className="text-[10px] font-headline">Ramificando o destino com base no seu mundo...</p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 gap-2">
                {lastStep?.opcoes.map((opt, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 border-white/10 bg-white/5 hover:bg-accent/10 hover:border-accent/50 transition-all text-left group"
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
            <Button variant="ghost" size="sm" onClick={reset} className="text-[9px] h-6 text-muted-foreground hover:text-destructive">
              <Trash2 size={10} className="mr-1" /> Limpar Timeline
            </Button>
            {lastStep?.sugestaoMecanica && (
              <div className="text-[9px] text-accent font-bold px-2 py-1 bg-accent/5 rounded border border-accent/20">
                INFO: {lastStep.sugestaoMecanica}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
