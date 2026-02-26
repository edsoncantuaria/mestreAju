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
import { longRestFlow } from '@/ai/flows/long-rest-flow';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

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

  // ── Fetch Locations for the Picker ──
  const campaignPath = user && activeSession?.campaignId
    ? `users/${user.uid}/campaigns/${activeSession.campaignId}`
    : user ? `users/${user.uid}/campaigns/default-campaign` : null;

  const locationsQuery = useMemoFirebase(() =>
    user && campaignPath ? query(collection(db, `${campaignPath}/locations`), orderBy('name')) : null
    , [db, user, campaignPath]);

  const { data: campaignLocationsRaw } = useCollection(locationsQuery);
  const campaignLocations = campaignLocationsRaw || [];

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

  const incrementDay = async () => {
    const match = inGameDate.match(/Dia (\d+)/i);
    if (match) {
      const currentDay = parseInt(match[1]);
      const newDate = `Dia ${currentDay + 1}`;
      setInGameDate(newDate);
      await updateCurrentPlaySession({ inGameDate: newDate });
    } else {
      const newDate = "Dia 1";
      setInGameDate(newDate);
      await updateCurrentPlaySession({ inGameDate: newDate });
    }
  };

  const decrementDay = async () => {
    const match = inGameDate.match(/Dia (\d+)/i);
    if (match && parseInt(match[1]) > 1) {
      const currentDay = parseInt(match[1]);
      const newDate = `Dia ${currentDay - 1}`;
      setInGameDate(newDate);
      await updateCurrentPlaySession({ inGameDate: newDate });
    }
  };

  const selectLocation = async (locName: string) => {
    setLocation(locName);
    await updateCurrentPlaySession({ location: locName });
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
          name: step.detalheOculto,
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
          name: step.detalheOculto,
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

  const handleSimpleRest = async () => {
    // 1. Increment Day
    const match = inGameDate.match(/Dia (\d+)/i);
    const newDay = match ? parseInt(match[1]) + 1 : 2;
    const newDateString = `Dia ${newDay}`;
    setInGameDate(newDateString);
    await updateCurrentPlaySession({ inGameDate: newDateString });

    // 2. Add as a simple narrative step
    const step: DynamicEncounterOutput = {
      narrativa: `O grupo realizou um descanso longo em ${location}. O sol se põe e nasce novamente, trazendo um novo dia de aventuras.`,
      opcoes: [],
      detalheOculto: "Descanso Simples",
      tipoDescoberta: "location",
      sugestaoMecanica: "Recuperação total de HP e HD."
    };

    await updateNarrativeLog(step);
    toast({ title: "Tempo Avançado", description: `O grupo descansou. Agora é ${newDateString}.` });
  };

  const handleLongRest = async () => {
    setGlobalLoading(true);
    try {
      const restResult = await longRestFlow({
        currentLocation: location,
        inGameDate: inGameDate,
        liveSummary: liveSummary,
        campaignLore: activeSession?.worldLore || ''
      });

      // 1. Increment Day
      const match = inGameDate.match(/Dia (\d+)/i);
      const newDay = match ? parseInt(match[1]) + 1 : 2;
      const newDateString = `Dia ${newDay}`;
      setInGameDate(newDateString);

      // 2. Add as a special narrative step
      const step: DynamicEncounterOutput = {
        narrativa: restResult.timeLapseNarrative,
        opcoes: restResult.upcomingHooks.map(h => ({ label: "Investigar Rumor", description: h, difficulty: "Médio" as any })),
        detalheOculto: "Salto Temporal: Descanso Concluído",
        tipoDescoberta: "location",
        sugestaoMecanica: "Recuperação total de HP e HD."
      };

      await updateNarrativeLog(step);
      toast({ title: "Descanso Concluído", description: `O tempo passou... Agora é ${newDateString}.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro no Descanso", description: "Não foi possível processar o tempo." });
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
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* ── TOP: STATUS & LOGISTICS ── */}
      <div className="shrink-0 space-y-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3 flex flex-col shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} className="text-accent" /> Sessão {currentSessionNumber}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInventory(!showInventory)}
                className={cn(
                  "text-[9px] h-6 border-white/10 gap-1.5 px-2",
                  showInventory ? "bg-primary/20 text-primary border-primary/30" : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <Package size={10} /> {inventory.length}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[9px] h-6 border-white/10 gap-1.5 px-2 text-sky-400 hover:bg-sky-400/10 hover:border-sky-400/30"
                  >
                    <Scroll size={10} /> Descanso
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-black/90 border-white/10 p-2 space-y-2 z-[100] backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1">Passagem do Tempo</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 text-[10px] gap-2 hover:bg-white/5"
                      onClick={handleSimpleRest}
                    >
                      <Plus size={10} className="text-sky-400" /> Descanso Simples (Dia +1)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 text-[10px] gap-2 hover:bg-sky-400/10 text-sky-400 font-bold"
                      onClick={handleLongRest}
                    >
                      <Sparkles size={10} /> Salto Temporal (IA Narrative)
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-md px-1.5 py-1 focus-within:border-accent/30 transition-colors">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent p-0">
                    <Calendar size={10} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-black/90 border-white/10 p-2 space-y-2 z-[100]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Tempo de Jogo</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] gap-1" onClick={decrementDay}>
                      <Minus size={10} /> Dia
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] gap-1" onClick={incrementDay}>
                      <Plus size={10} /> Dia
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3, 4, 5, 6].map(d => (
                      <Button
                        key={d}
                        variant="ghost"
                        size="sm"
                        className={cn("h-6 text-[9px]", inGameDate === `Dia ${d}` ? "bg-accent/20 text-accent font-bold" : "")}
                        onClick={async () => {
                          const newDate = `Dia ${d}`;
                          setInGameDate(newDate);
                          await updateCurrentPlaySession({ inGameDate: newDate });
                        }}
                      >
                        Dia {d}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                value={inGameDate}
                onChange={e => setInGameDate(e.target.value)}
                onBlur={() => updateCurrentPlaySession({ inGameDate })}
                className="h-6 text-[10px] border-none bg-transparent p-0 focus-visible:ring-0 text-white/80 placeholder:text-white/20"
                placeholder="Dia/Hora"
              />
            </div>

            <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-md px-1.5 py-1 focus-within:border-accent/30 transition-colors">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-emerald-400 p-0">
                    <MapPin size={10} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-black/90 border-white/10 p-0 z-[100] overflow-hidden">
                  <div className="p-2 border-b border-white/5 bg-white/5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Locais do Grimório</span>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-1 space-y-0.5">
                      {campaignLocations.length === 0 ? (
                        <p className="p-4 text-[10px] text-muted-foreground italic text-center">Nenhum local no Grimório</p>
                      ) : (
                        campaignLocations.map((loc: any) => (
                          <button
                            key={loc.id}
                            onClick={() => selectLocation(loc.name)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-[10px] hover:bg-emerald-500/10 transition-colors group flex items-center justify-between",
                              location === loc.name ? "bg-emerald-500/5 text-emerald-400 font-bold" : "text-white/70"
                            )}
                          >
                            <span className="truncate flex-1">{loc.name}</span>
                            <Badge variant="outline" className="text-[8px] opacity-40 group-hover:opacity-100 py-0 h-4 border-white/10 px-1.5">{loc.type || 'Local'}</Badge>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t border-white/5 bg-white/5">
                    <Input
                      placeholder="Novo local..."
                      className="h-7 text-[9px] bg-black/40 border-white/5"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val.trim()) {
                            await selectLocation(val.trim());
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                value={location}
                onChange={e => setLocation(e.target.value)}
                onBlur={() => updateCurrentPlaySession({ location })}
                className="h-6 text-[10px] border-none bg-transparent p-0 focus-visible:ring-0 text-white/80 placeholder:text-white/20"
                placeholder="Local"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/60 ml-1 font-bold">História Contínua</label>
            <Textarea
              value={liveSummary}
              onChange={e => setLiveSummary(e.target.value)}
              onBlur={() => updateCurrentPlaySession({ liveSummary })}
              placeholder="O que está acontecendo agora..."
              className="h-16 text-[10px] resize-none bg-black/40 border-white/5 text-muted-foreground focus:text-white/90 focus:border-accent/20 custom-scrollbar"
            />
          </div>
        </div>
      </div >

      {/* ── CENTER: NARRATIVE FEED ── */}
      < div className="flex-1 min-h-0 flex flex-col bg-black/40 border border-white/5 rounded-xl overflow-hidden relative shadow-inner" >
        {
          history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
                <PenTool size={20} className="text-primary/40" />
              </div>
              <div className="transition-all animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[9px] text-accent font-bold uppercase tracking-widest mb-2">Despertar Crônica</p>
                <Input
                  placeholder="Ex: Os heróis chegam à taverna..."
                  value={currentSituation}
                  onChange={(e) => setCurrentSituation(e.target.value)}
                  className="h-8 bg-background/50 border-white/10 text-[11px] text-center w-full max-w-[200px]"
                />
              </div>
              <Button onClick={startSession} disabled={!currentSituation} size="sm" className="bg-primary hover:bg-primary/90 h-8 shadow-lg shadow-primary/20 px-6">
                Iniciar Narrativa
              </Button>
            </div>
          ) : (
            <ScrollArea ref={scrollRef} className="flex-1">
              <div className="p-3 space-y-4">
                {history.map((step, idx) => {
                  const isLast = idx === history.length - 1;
                  return (
                    <div key={idx} className="relative pl-5">
                      {!isLast && <div className="absolute left-[9px] top-6 bottom-[-24px] w-0.5 bg-white/5" />}
                      <div className={cn(
                        "absolute left-0 top-1.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-500",
                        isLast ? "bg-primary border-primary shadow-lg shadow-primary/30" : "bg-black/40 border-white/10"
                      )}>
                        {isLast ? <Zap size={8} className="text-white" /> : <div className="w-0.5 h-0.5 bg-white/20 rounded-full" />}
                      </div>

                      <div className={cn(
                        "p-3 rounded-xl border transition-all duration-500 group",
                        isLast ? "bg-white/[0.03] border-white/10 shadow-lg" : "bg-black/10 border-white/5 opacity-60 hover:opacity-100"
                      )}>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">Passo {idx + 1}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => chooseOption(`Ramificação ${idx + 1}`, step.narrativa)}
                            >
                              <GitBranch size={8} />
                            </Button>
                          </div>
                        </div>

                        <p className="text-[10.5px] leading-relaxed font-body text-foreground/90 italic">
                          "{step.narrativa}"
                        </p>

                        {step.detalheOculto && (
                          <div className="mt-2 py-1 px-2 bg-accent/5 border border-accent/10 rounded-lg flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <Zap size={9} className="text-accent shrink-0" />
                              <span className="text-[8px] font-bold text-accent uppercase tracking-tighter truncate">{step.detalheOculto}</span>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                              {[
                                { icon: PenTool, color: 'text-accent', tooltip: 'Documento', action: () => onContextAction('narrative', { messageContent: `Documento: ${step.detalheOculto}. Contexto: ${step.narrativa}`, documentType: 'documento' }) },
                                { icon: Search, color: 'text-accent', tooltip: 'Analisar', action: () => onContextAction('analysis', { situation: step.narrativa, npcs: step.detalheOculto }) },
                                { icon: Map, color: 'text-lime-400', tooltip: 'Mapa', action: () => onContextAction('cartography', { terrain: step.detalheOculto, context: step.narrativa, keyElements: "descritos" }) },
                                { icon: step.tipoDescoberta === 'location' ? MapPin : Users, color: 'text-sky-400', tooltip: 'Grimório', action: () => onContextAction('entities', { type: step.tipoDescoberta === 'location' ? 'location' : 'npc', name: step.detalheOculto, context: step.narrativa }) }
                              ].map((btn, bi) => (
                                <TooltipProvider key={bi}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className={cn("h-5 w-5 hover:bg-accent/10", btn.color)} onClick={btn.action}>
                                        <btn.icon size={10} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-[9px]">{btn.tooltip}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )
        }
      </div >

      {/* ── BOTTOM: ACTION PANEL ── */}
      < div className="shrink-0 space-y-3" >
        {
          history.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-3 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)]">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <ChevronDown size={12} className="text-accent" />
                  <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Opções de Narrativa</span>
                </div>

                <div className="max-h-[140px] overflow-y-auto pr-1 custom-scrollbar space-y-1.5 px-0.5">
                  {lastStep?.opcoes.map((opt, i) => (
                    <div key={i} className="flex gap-1 animate-in slide-in-from-right-2" style={{ animationDelay: `${i * 60}ms` }}>
                      <Button
                        variant="outline"
                        className="flex-1 h-auto py-1.5 px-2.5 flex flex-col items-start gap-0.5 border-white/10 bg-black/20 hover:bg-accent/10 hover:border-accent/40 transition-all text-left group"
                        onClick={() => chooseOption(opt.label)}
                      >
                        <div className="flex w-full justify-between items-center">
                          <span className="text-[10px] font-bold text-accent group-hover:text-white transition-colors uppercase tracking-tight line-clamp-1">{opt.label}</span>
                          <span className={cn(
                            "text-[6px] px-1 py-0 rounded border font-bold uppercase",
                            opt.difficulty === 'Mortal' ? 'bg-red-500/20 text-red-500 border-red-500/50' :
                              opt.difficulty === 'Difícil' ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' :
                                'bg-green-500/20 text-green-500 border-green-500/50'
                          )}>
                            {opt.difficulty[0]}
                          </span>
                        </div>
                        <span className="text-[8.5px] text-muted-foreground/60 line-clamp-1 italic">{opt.description}</span>
                      </Button>
                      {opt.roll20Macro && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 shrink-0 h-8 border-white/10 bg-black/40 hover:text-accent p-0"
                          onClick={() => copyMacro(opt.roll20Macro!)}
                        >
                          {copiedMacro === opt.roll20Macro ? <Check size={10} className="text-green-500" /> : <Terminal size={10} />}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-2.5">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Ou tome uma ação livre..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && customInput.trim() && chooseOption('Ação Livre')}
                    className="h-8 text-[10px] bg-black/40 border-white/10 focus:border-accent/30"
                  />
                  <Button size="icon" onClick={() => chooseOption('Ação Livre')} disabled={!customInput.trim()} className="h-8 w-8 bg-primary shadow-lg shadow-primary/20 p-0 shrink-0">
                    <Plus size={14} />
                  </Button>
                </div>

                <div className="flex justify-between items-center px-1">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={resetHistory} className="text-[8px] h-5 text-muted-foreground/50 hover:text-destructive p-0 flex items-center gap-1.5">
                      <History size={10} /> Reset
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEndSessionModalOpen(true)} className="text-[8px] h-5 text-muted-foreground/50 hover:text-red-400 p-0 flex items-center gap-1.5">
                      <Save size={10} /> Encerrar
                    </Button>
                  </div>
                  {lastStep?.sugestaoMecanica && (
                    <div className="text-[7.5px] text-accent font-bold px-1.5 py-0.5 bg-accent/5 rounded border border-accent/20 flex items-center gap-1 max-w-[140px] truncate">
                      <Info size={8} /> {lastStep.sugestaoMecanica}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
      </div >

      {/* --- Overlay Modals (Inventory, End Session) remains the same logic but as Dialogs --- */}
      < Dialog open={showInventory} onOpenChange={setShowInventory} >
        <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent">
              <Package size={18} /> Inventário do Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {inventory.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">{item.quantity}x</div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustItemQuantity(item.id, -1)}><Minus size={12} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustItemQuantity(item.id, 1)}><Plus size={12} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-2 border-t border-white/5">
              <Input placeholder="Nome do item" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="h-9 text-xs" />
              <Input type="number" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value) || 1)} className="h-9 w-16 text-xs text-center" />
              <Button onClick={() => addItem(newItemName, newItemQty)} disabled={!newItemName} className="h-9 px-4 bg-primary"><Plus size={16} /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

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
      )
      }

      {
        history.length === 0 ? (
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
                                      className="h-6 w-6 text-lime-400 hover:bg-lime-400/20"
                                      onClick={() => onContextAction('cartography', {
                                        terrain: step.detalheOculto,
                                        context: step.narrativa,
                                        keyElements: "detalhes marcantes descritos na narrativa"
                                      })}
                                    >
                                      <Map size={12} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[10px]">Gerar Battlegrid para este Local</p>
                                  </TooltipContent>
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
        )
      }

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
    </div >
  );
}
