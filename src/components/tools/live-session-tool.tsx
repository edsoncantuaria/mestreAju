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
  History,
  Users,
  MapPin,
  Calendar,
  Flag,
  Save,
  Scroll,
  Package,
  Minus,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { generateEncounterStep, type DynamicEncounterOutput } from '@/ai/flows/dynamic-encounter-flow';
import { endPlaySession } from '@/ai/flows/end-play-session-flow';
import { generateNpc } from '@/ai/flows/generate-npc-flow';
import { generateLocation } from '@/ai/flows/generate-location-flow';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveSessionToolProps {
  partyInfo: { members: Array<{ level: number; race?: string; class?: string }> };
  activeSession: any | null;
  onContextAction: (toolId: any, data: any) => void;
  setGlobalLoading: (loading: boolean) => void;
}

// XP Thresholds Table (DMG p. 82)
const XP_THRESHOLDS: Record<number, number[]> = {
  1: [25, 50, 75, 100],
  2: [50, 100, 150, 200],
  3: [75, 150, 225, 400],
  4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100],
  6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700],
  8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800],
  11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 4000, 6000, 9000],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4800, 7200, 10900],
  20: [2800, 5600, 8400, 12700],
};

export function LiveSessionTool({ partyInfo, activeSession, onContextAction, setGlobalLoading }: LiveSessionToolProps) {
  const [currentSituation, setCurrentSituation] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [copiedMacro, setCopiedMacro] = useState<string | null>(null);

  // New states for Session History feature
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
  const [dmNotes, setDmNotes] = useState('');
  const [inGameDate, setInGameDate] = useState(activeSession?.currentPlaySession?.inGameDate || 'Dia 1');
  const [location, setLocation] = useState(activeSession?.currentPlaySession?.location || 'Local Desconhecido');
  const [liveSummary, setLiveSummary] = useState(activeSession?.currentPlaySession?.liveSummary || '');
  const [showInventory, setShowInventory] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const history: DynamicEncounterOutput[] = activeSession?.narrativeLog || [];
  const playSessions: any[] = activeSession?.playSessions || [];
  const currentSessionNumber = playSessions.length + 1;

  // Sync state if activeSession changes externally
  useEffect(() => {
    if (activeSession?.currentPlaySession) {
      setInGameDate(activeSession.currentPlaySession.inGameDate || 'Dia 1');
      setLocation(activeSession.currentPlaySession.location || 'Local Desconhecido');
      setLiveSummary(activeSession.currentPlaySession.liveSummary || '');
    }
  }, [activeSession?.id]);

  const updateCurrentPlaySession = async (updates: any) => {
    if (!db || !user || !activeSession) return;
    const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
    await updateDoc(sessionRef, {
      currentPlaySession: {
        inGameDate: updates.inGameDate !== undefined ? updates.inGameDate : inGameDate,
        location: updates.location !== undefined ? updates.location : location,
        liveSummary: updates.liveSummary !== undefined ? updates.liveSummary : liveSummary,
        number: currentSessionNumber
      },
      dateLastModified: new Date().toISOString()
    });
  };

  const inventory = activeSession?.inventory || [];

  const updateInventory = async (newInventory: any[]) => {
    if (!db || !user || !activeSession) return;
    const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
    await updateDoc(sessionRef, {
      inventory: newInventory,
      dateLastModified: new Date().toISOString()
    });
  };

  const addItem = async (name: string, quantity: number = 1) => {
    if (!name.trim()) return;
    const existing = inventory.find((i: any) => i.name.toLowerCase() === name.toLowerCase());
    let newInv;
    if (existing) {
      newInv = inventory.map((i: any) => i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + quantity } : i);
    } else {
      newInv = [...inventory, { id: Math.random().toString(36).substr(2, 9), name, quantity }];
    }
    await updateInventory(newInv);
    setNewItemName('');
    setNewItemQty(1);
  };

  const removeItem = async (id: string) => {
    const newInv = inventory.filter((i: any) => i.id !== id);
    await updateInventory(newInv);
  };

  const adjustItemQuantity = async (id: string, delta: number) => {
    const newInv = inventory.map((i: any) => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    });
    await updateInventory(newInv);
  };

  const calculateXPThresholds = () => {
    let easy = 0, medium = 0, hard = 0, deadly = 0;
    partyInfo.members.forEach(m => {
      const level = Math.min(Math.max(m.level, 1), 20);
      const [e, med, h, d] = XP_THRESHOLDS[level];
      easy += e;
      medium += med;
      hard += h;
      deadly += d;
    });
    return { easy, medium, hard, deadly };
  };

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

    // Append the new narrative to the running liveSummary
    const updatedSummary = liveSummary ? `${liveSummary}\n\n${step.narrativa}` : step.narrativa;
    setLiveSummary(updatedSummary);

    await updateDoc(sessionRef, {
      narrativeLog: arrayUnion(step),
      currentPlaySession: {
        inGameDate,
        location,
        liveSummary: updatedSummary,
        number: currentSessionNumber
      },
      dateLastModified: new Date().toISOString()
    });

    // --- Phase 2: Automatic Grimório Sync ---
    if (step.detalheOculto) {
      syncEntityWithGrimoire(step);
    }
  };

  const syncEntityWithGrimoire = async (step: DynamicEncounterOutput) => {
    if (!db || !user || !activeSession) return;
    const campaignPath = `users/${user.uid}/campaigns/default-campaign`;

    try {
      if (step.tipoDescoberta === 'npc') {
        const npcData = await generateNpc({
          context: `Descoberto em: ${step.narrativa} | Mundo: ${activeSession.title}`,
          role: step.detalheOculto
        });
        await addDoc(collection(db, `${campaignPath}/npcs`), {
          ...npcData,
          ownerId: user.uid,
          createdAt: serverTimestamp()
        });
        toast({ title: "NPC Manifestado", description: `${npcData.name} foi adicionado ao Grimório.` });
      } else if (step.tipoDescoberta === 'location') {
        const locData = await generateLocation({
          context: `Descoberto em: ${step.narrativa} | Mundo: ${activeSession.title}`,
          type: step.detalheOculto
        });
        await addDoc(collection(db, `${campaignPath}/locations`), {
          ...locData,
          ownerId: user.uid,
          createdAt: serverTimestamp()
        });
        toast({ title: "Local Manifestado", description: `${locData.name} foi adicionado ao Grimório.` });
      }
    } catch (error) {
      console.error("Auto-sync error:", error);
    }
  };

  const startSession = async () => {
    if (!currentSituation.trim()) return;
    setGlobalLoading(true);
    try {
      const step = await generateEncounterStep({
        currentSituation: `${currentSituation} | Lore do Mundo: ${activeSession?.worldLore || ''}`,
        partyInfo: {
          members: partyInfo.members,
          xpThresholds: calculateXPThresholds()
        },
      });
      await updateNarrativeLog(step);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível iniciar a cena." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const chooseOption = async (optionLabel: string, contextOverride?: string) => {
    setGlobalLoading(true);
    const contextText = contextOverride || history[history.length - 1]?.narrativa || currentSituation;
    try {
      const step = await generateEncounterStep({
        currentSituation: `${contextText} | Lore Ativa: ${activeSession?.worldLore || ''}`,
        lastChoice: optionLabel,
        partyInfo: {
          members: partyInfo.members,
          xpThresholds: calculateXPThresholds()
        },
        customInput: customInput.trim() || undefined,
      });
      await updateNarrativeLog(step);
      setCustomInput('');
      toast({ title: "Caminho Trilhado", description: "A narrativa avançou para um novo ramo." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível ramificar a cena." });
    } finally {
      setGlobalLoading(false);
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
    setGlobalLoading(true);
    try {
      const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
      await updateDoc(sessionRef, {
        narrativeLog: [],
        dateLastModified: new Date().toISOString()
      });
      setCurrentSituation('');
      setCustomInput('');
      toast({ title: "Grimório Resetado", description: "A timeline desta cena foi limpa na nuvem." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!db || !user || !activeSession) return;
    setGlobalLoading(true);
    setIsEndSessionModalOpen(false);
    try {
      const turnLogs = history.map(h => h.narrativa);
      const result = await endPlaySession({
        liveSummary,
        turnLogs,
        dmNotes
      });

      const sessionRecord = {
        number: currentSessionNumber,
        date: new Date().toISOString(),
        inGameDate,
        location,
        finalSummary: result.finalSummary,
        nextSessionHook: result.nextSessionHook,
        rawLogs: history,
        finalInventory: inventory,
        archivedTools: {
          summary: activeSession?.toolStates?.summary_result || null,
          documents: activeSession?.toolStates?.narrative_result || null,
          analysis: activeSession?.toolStates?.analysis_result || null
        }
      };

      const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
      await updateDoc(sessionRef, {
        playSessions: arrayUnion(sessionRecord),
        narrativeLog: [], // Clear current scene
        'toolStates.summary_result': null,
        'toolStates.narrative_result': null,
        'toolStates.analysis_result': null,
        currentPlaySession: {
          inGameDate,
          location,
          liveSummary: '', // Clear running summary for next session
          number: currentSessionNumber + 1
        },
        dateLastModified: new Date().toISOString()
      });

      setDmNotes('');
      setCurrentSituation('');
      setCustomInput('');
      setLiveSummary('');
      toast({ title: "Sessão Encerrada!", description: "O registro foi salvo no Arquivo da Crônica." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao arquivar a sessão." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const lastStep = history[history.length - 1];

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      {/* --- Fixed Session Header --- */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} /> Sessão {currentSessionNumber}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInventory(!showInventory)}
              className={cn(
                "text-[9px] h-6 border-white/10 gap-1.5",
                showInventory ? "bg-primary/20 text-primary border-primary/30" : "text-muted-foreground"
              )}
            >
              <Package size={10} /> Inventário ({inventory.length})
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEndSessionModalOpen(true)}
            className="text-[10px] h-6 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Save size={10} className="mr-1.5" /> Encerrar Sessão
          </Button>
        </div>

        {showInventory && (
          <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                <Package size={10} /> Inventário da Party
              </h4>
            </div>

            <ScrollArea className="max-h-[150px] overflow-y-auto">
              <div className="space-y-1.5">
                {inventory.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-white/5 border border-white/5 group">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-accent w-6 text-center">{item.quantity}x</span>
                      <span className="text-[11px] text-foreground/90">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-accent" onClick={() => adjustItemQuantity(item.id, -1)}>
                        <Minus size={10} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-accent" onClick={() => adjustItemQuantity(item.id, 1)}>
                        <Plus size={10} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  </div>
                ))}
                {inventory.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-4">O saco de itens está vazio.</p>
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <Input
                placeholder="Novo item..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem(newItemName, newItemQty)}
                className="h-7 text-[10px] bg-black/50 border-white/5"
              />
              <Input
                type="number"
                min="1"
                value={newItemQty}
                onChange={e => setNewItemQty(parseInt(e.target.value) || 1)}
                className="h-7 w-12 text-[10px] bg-black/50 border-white/5 text-center"
              />
              <Button size="sm" onClick={() => addItem(newItemName, newItemQty)} disabled={!newItemName} className="h-7 w-7 p-0 bg-primary/20 text-primary hover:bg-primary/30">
                <Plus size={12} />
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-white/5 rounded-md px-2 py-1">
            <Calendar size={10} className="text-muted-foreground" />
            <Input
              value={inGameDate}
              onChange={e => setInGameDate(e.target.value)}
              onBlur={() => updateCurrentPlaySession({ inGameDate })}
              className="h-6 text-[10px] border-none bg-transparent p-0 focus-visible:ring-0 text-white/80"
              placeholder="Dia/Hora no Jogo"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-md px-2 py-1">
            <MapPin size={10} className="text-muted-foreground" />
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onBlur={() => updateCurrentPlaySession({ location })}
              className="h-6 text-[10px] border-none bg-transparent p-0 focus-visible:ring-0 text-white/80"
              placeholder="Local Atual"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground ml-1">História Contínua (Resumo da Sessão)</label>
          <Textarea
            value={liveSummary}
            onChange={e => setLiveSummary(e.target.value)}
            onBlur={() => updateCurrentPlaySession({ liveSummary })}
            placeholder="O que está acontecendo na sessão até agora..."
            className="h-20 min-h-[80px] text-[10px] resize-none bg-background/50 border-white/5 text-muted-foreground focus:text-white/90"
          />
        </div>
      </div>

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
          <Button onClick={startSession} disabled={!currentSituation} className="w-full font-headline bg-primary hover:bg-primary/90 h-12 text-lg shadow-lg shadow-primary/20">
            Despertar Narrativa
          </Button>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <ScrollArea ref={scrollRef} className="flex-1 pr-4 -mr-4">
            <div className="space-y-6 pb-6 pt-2">
              {history.map((step, idx) => {
                const isLast = idx === history.length - 1;
                return (
                  <div key={idx} className="relative pl-6">
                    {!isLast && <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-white/5" />}
                    <div className={cn(
                      "absolute left-0 top-1.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500",
                      isLast ? "bg-primary border-primary shadow-lg shadow-primary/30" : "bg-black/40 border-white/10"
                    )}>
                      {isLast ? <Zap size={10} className="text-white" /> : <div className="w-1 h-1 bg-white/20 rounded-full" />}
                    </div>

                    <div className={cn(
                      "p-5 rounded-2xl border transition-all duration-500 group",
                      isLast ? "bg-card/60 backdrop-blur-md border border-white/10 shadow-2xl" : "bg-black/20 border-white/5 opacity-70 hover:opacity-100"
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Passo {idx + 1}</span>
                        <div className="flex gap-1">
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-sky-400 hover:bg-sky-400/20"
                                    onClick={() => onContextAction('entities', {
                                      type: step.tipoDescoberta === 'location' ? 'location' : 'npc',
                                      name: step.detalheOculto,
                                      context: step.narrativa
                                    })}
                                  >
                                    {step.tipoDescoberta === 'location' ? <MapPin size={12} /> : <Users size={12} />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-[10px]">Manifestar {step.tipoDescoberta === 'location' ? 'Local' : 'NPC'} no Grimório</p>
                                </TooltipContent>
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent group-hover:text-white transition-colors">{opt.label}</span>
                        {opt.label.toLowerCase().includes('saquear') || opt.label.toLowerCase().includes('pegar') || opt.label.toLowerCase().includes('loot') ? (
                          <Package size={10} className="text-amber-500 animate-pulse" />
                        ) : null}
                      </div>
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

      {/* --- End Session Modal --- */}
      <Dialog open={isEndSessionModalOpen} onOpenChange={setIsEndSessionModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-[Fira_Code] text-xl text-accent flex items-center gap-2">
              <Scroll size={20} className="text-primary" />
              Encerrar Sessão {currentSessionNumber}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground mt-2">
              O Copiloto irá ler todo o histórico de logs de hoje e a História Contínua para gerar o Registro Oficial da Sessão. O que rolou no finalzinho que eu deveria saber antes de fechar os livros?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/70">
                Anotações Finais do Mestre (Opção Livre)
              </label>
              <Textarea
                placeholder="Ex: No fim, eles decidiram roubar os cavalos e fugir para a cidade vizinha. O mago quase morreu."
                value={dmNotes}
                onChange={e => setDmNotes(e.target.value)}
                className="h-24 resize-none bg-black/40 border-white/10 text-xs focus:border-primary/50"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={() => setIsEndSessionModalOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button onClick={handleEndSession} className="bg-primary hover:bg-primary/90 font-bold text-white shadow-lg shadow-primary/20 gap-2">
              <Save size={14} /> Consolidar no Grimório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
