'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Loader2, 
  Sword, 
  Plus, 
  Trash2, 
  PenTool, 
  Search, 
  Map, 
  Info, 
  Copy, 
  Check, 
  Terminal, 
  GitBranch, 
  ChevronDown, 
  Sparkles,
  History
} from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  // O histórico é derivado do Firestore para persistência real
  const history: DynamicEncounterOutput[] = activeSession?.narrativeLog || [];

  // Auto-scroll para o fim da timeline quando novas entradas chegam
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [history.length]);

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

  const chooseOption = async (optionLabel: string, contextOverride?: string) => {
    setLoading(true);
    const contextText = contextOverride || history[history.length - 1]?.narrativa || currentSituation;
    try {
      const step = await generateEncounterStep({
        currentSituation: `${contextText} | Lore Ativa: ${activeSession?.worldLore || ''}`,
        lastChoice: optionLabel,
        partyInfo,
        customInput: customInput.trim() || undefined,
      });
      await updateNarrativeLog(step);
      setCustomInput('');
      toast({ title: "Caminho Trilhado", description: "A narrativa avançou para um novo ramo." });
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
    toast({ title: "Grimório Resetado", description: "A timeline desta sessão foi limpa na nuvem." });
  };

  const lastStep = history[history.length - 1];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Visualizador de Mapa do Roll20 */}
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
            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
              <img src={activeSession.mapImageUrl} alt="Mapa Principal" className="w-full h-auto" />
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={40} />
            </div>
            <p className="text-[10px] text-accent uppercase font-bold mb-2 tracking-widest">Ponto de Partida</p>
            <Input 
              placeholder="Ex: Os heróis chegam às portas da Cidade de Ferro..."
              value={currentSituation}
              onChange={(e) => setCurrentSituation(e.target.value)}
              className="bg-background/50 border-white/10 text-xs focus:border-primary/50"
            />
          </div>
          <Button onClick={startSession} disabled={loading || !currentSituation} className="w-full font-headline bg-primary hover:bg-primary/90 h-12 text-lg shadow-lg shadow-primary/20">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Despertar Narrativa"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Timeline do Mapa Mental */}
          <ScrollArea ref={scrollRef} className="flex-1 pr-4 -mr-4">
            <div className="space-y-6 pb-6 pt-2">
              {history.map((step, idx) => {
                const isLast = idx === history.length - 1;
                return (
                  <div key={idx} className="relative pl-6">
                    {/* Linha conectora vertical */}
                    {!isLast && <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-white/5" />}
                    
                    {/* Indicador de nó */}
                    <div className={cn(
                      "absolute left-0 top-1.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500",
                      isLast ? "bg-primary border-primary shadow-lg shadow-primary/30" : "bg-black/40 border-white/10"
                    )}>
                      {isLast ? <Zap size={10} className="text-white" /> : <div className="w-1 h-1 bg-white/20 rounded-full" />}
                    </div>

                    <div className={cn(
                      "p-4 rounded-xl border transition-all duration-500 group",
                      isLast ? "bg-card/80 border-accent/40 shadow-xl" : "bg-black/20 border-white/5 opacity-60 hover:opacity-100"
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Passo {idx + 1}</span>
                        <div className="flex gap-1">
                          {/* Botão de Ramificar (Voltar Atrás e Criar Nova Rota) */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => chooseOption(`Ramificação do Passo ${idx + 1}`, step.narrativa)}
                                >
                                  <GitBranch size={12} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-[10px]">Ramificar narrativa deste ponto</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      <p className="text-xs leading-relaxed font-body text-foreground/90 italic">
                        "{step.narrativa}"
                      </p>
                      
                      {step.detalheOculto && (
                        <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-accent animate-pulse" />
                            <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">DESCOBERTA: {step.detalheOculto}</span>
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
                                      messageContent: `Documento sobre: ${step.detalheOculto}. Contexto: ${step.narrativa}`,
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
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Opções de Caminhos Atuais */}
          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
              <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
              <p className="text-[10px] font-headline uppercase tracking-widest text-accent/60">Tecendo Destinos...</p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 border-t border-white/5 pt-4 bg-card/40 -mx-6 px-6 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <ChevronDown size={14} className="text-accent" />
                <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Próximas Ramificações</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {lastStep?.opcoes.map((opt, i) => (
                  <div key={i} className="flex gap-1 animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${i * 100}ms` }}>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-auto py-3 px-4 flex flex-col items-start gap-1 border-white/10 bg-white/5 hover:bg-accent/10 hover:border-accent/50 transition-all text-left group"
                      onClick={() => chooseOption(opt.label)}
                    >
                      <div className="flex w-full justify-between items-center">
                        <span className="text-xs font-bold text-accent group-hover:text-white transition-colors">{opt.label}</span>
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase",
                          opt.difficulty === 'Mortal' ? 'bg-red-500/20 text-red-500 border-red-500/50' :
                          opt.difficulty === 'Difícil' ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' :
                          'bg-green-500/20 text-green-500 border-green-500/50'
                        )}>
                          {opt.difficulty}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 group-hover:text-muted-foreground/80">{opt.description}</span>
                    </Button>
                    {opt.roll20Macro && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-10 h-auto border-white/10 bg-black/40 hover:text-accent hover:border-accent/50"
                              onClick={() => copyMacro(opt.roll20Macro!)}
                            >
                              {copiedMacro === opt.roll20Macro ? <Check size={14} className="text-green-500" /> : <Terminal size={14} />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-[10px]">Macro Roll20: {opt.roll20Macro}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ))}
              </div>

              {/* Ação Personalizada */}
              <div className="flex gap-2 items-center pt-2">
                <Input 
                  placeholder="Ou tome uma ação livre..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && customInput.trim() && chooseOption('Ação Livre')}
                  className="h-9 text-[10px] bg-black/40 border-white/10 focus:border-primary/50"
                />
                <Button 
                  size="sm" 
                  onClick={() => chooseOption('Ação Livre')} 
                  disabled={!customInput.trim()}
                  className="h-9 w-9 p-0 bg-primary shadow-lg shadow-primary/20"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Rodapé da Ferramenta */}
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <Button variant="ghost" size="sm" onClick={resetHistory} className="text-[9px] h-6 text-muted-foreground hover:text-destructive gap-1">
              <History size={10} /> Limpar Árvore Narrativa
            </Button>
            {lastStep?.sugestaoMecanica && (
              <div className="text-[9px] text-accent font-bold px-2 py-1 bg-accent/5 rounded border border-accent/20 flex items-center gap-1">
                <Info size={10} /> {lastStep.sugestaoMecanica}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
