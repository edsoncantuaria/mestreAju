'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Loader2,
  Save,
  Globe,
  Map as MapIcon,
  Send,
  Sparkles,
  X,
  ChevronLeft,
  Link as LinkIcon,
  ShieldAlert,
  History,
  MapPin,
  Crown,
  Ghost,
  Flame as FlameIcon,
  Mountain,
  Waves,
  Hammer,
  Scroll,
  Zap as ZapIcon,
  Skull,
  Star,
  Compass,
  ArrowRight,
  Search,
  Church,
  Users2,
  Coins,
  CloudLightning,
  Gem,
  Droplets,
  Archive,
  Moon,
  Eye,
  ArrowUp,
  RotateCcw,
  Ban,
  VolumeX,
  Settings,
  FlaskConical,
  Cpu,
  User,
  Tent,
  Sun,
  Shield as ShieldIcon,
  Sword as SwordIcon,
  Activity,
  Dices,
  RefreshCw,
  Infinity,
  ArrowLeft,
  Hash,
  ScrollText,
  Newspaper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { prepareSession, type PrepareSessionOutput } from '@/ai/flows/prepare-session-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { generateWorldRegion } from '@/ai/flows/generate-world-region-flow';
import { saveGeneratedWorldRegion } from '@/firebase/firestore/campaigns';
import { cn } from '@/lib/utils';

const GENESIS_STEPS = [
  {
    id: 'age',
    title: 'A Era do Mundo',
    description: 'Em que estágio de desenvolvimento se encontra sua civilização?',
    options: [
      { id: 'dawn', label: 'Alvorecer dos Deuses', desc: 'Mundo jovem, deuses caminham entre mortais. Magia bruta e selvagem.', icon: Sparkles },
      { id: 'golden', label: 'Era de Ouro', desc: 'Impérios magníficos no auge. Magia é ciência e arte.', icon: Crown },
      { id: 'echoes', label: 'Ecos do Passado', desc: 'Civilizações em ruínas sobre os escombros de impérios antigos.', icon: History }
    ]
  },
  {
    id: 'biome',
    title: 'Geografia Primordial',
    description: 'Qual o ambiente dominante da sua macrorregião?',
    options: [
      { id: 'sky', label: 'Arquipélago Celeste', desc: 'Ilhas flutuantes ligadas por barcos voadores e magia.', icon: Globe },
      { id: 'under', label: 'Reinos da Profundeza', desc: 'Vasta rede de cavernas, fungos e perigos do Underdark.', icon: Mountain },
      { id: 'techno', label: 'Megacidade Continental', desc: 'Uma única cidade colossal cobre toda a superfície conhecida.', icon: Settings }
    ]
  },
  {
    id: 'rule',
    title: 'Estrutura de Poder',
    description: 'Quem dita as leis nesta terra?',
    options: [
      { id: 'mage', label: 'Magocracia Arcana', desc: 'Conclaves de magos governam através do conhecimento e poder.', icon: BookOpen },
      { id: 'theo', label: 'Teocracia Divina', desc: 'Sumos sacerdotes governam em nome dos deuses do panteão.', icon: Church },
      { id: 'feudal', label: 'Feudalismo Decadente', desc: 'Nobres em guerra por terras e linhagens esquecidas.', icon: Hammer }
    ]
  },
  {
    id: 'tension',
    title: 'O Grande Conflito',
    description: 'Qual a tensão que ameaça rasgar o mundo no meio?',
    options: [
      { id: 'invasion', label: 'Invasão Planar', desc: 'Fendas se abrindo para o Abismo ou para os Nove Infernos.', icon: Globe },
      { id: 'blight', label: 'A Praga Mágica', desc: 'Doença que corrompe a magia e transforma seres em aberrações.', icon: FlameIcon },
      { id: 'cosmic', label: 'O Despertar do Titã', desc: 'Uma entidade primordial começou a se mover sob a terra.', icon: ZapIcon }
    ]
  },
  {
    id: 'tone',
    title: 'Tom da Campanha',
    description: 'Qual a sensação predominante da narrativa?',
    options: [
      { id: 'grim', label: 'Grimdark', desc: 'Lute contra o inevitável. Escolhas difíceis e consequências morais.', icon: Skull },
      { id: 'heroic', label: 'Heroísmo Épico', desc: 'Heroísmo clássico contra o mal absoluto. Proezas lendárias.', icon: Star },
      { id: 'mystery', label: 'Mistério Sobrenatural', desc: 'Investigação, conspirações e horrores ocultos.', icon: Search }
    ]
  },
  {
    id: 'source',
    title: 'Misticismo e Magia',
    description: 'Como a magia se manifesta neste mundo?',
    options: [
      { id: 'common', label: 'Magia Ubíqua', desc: 'Itens mágicos e feitiços são comuns no dia a dia.', icon: ZapIcon },
      { id: 'taboo', label: 'Conhecimento Proibido', desc: 'Magia é caçada ou restrita a poucos privilegiados.', icon: ShieldIcon },
      { id: 'ritual', label: 'Fé e Sacrifício', desc: 'Magia vem exclusivamente da devoção aos deuses ou pactos.', icon: Scroll }
    ]
  },
  {
    id: 'pantheon',
    title: 'Panteão Dominante',
    description: 'Quais deuses sustentam os pilares da fé?',
    options: [
      { id: 'light', label: 'A Ordem do Sol (Pelor/Tyr)', desc: 'Foco em justiça, luz e proteção dos fracos.', icon: Sun },
      { id: 'shadow', label: 'Corte das Sombras (Raven Queen/Lolth)', desc: 'Equilíbrio entre vida e morte, ou domínio através do medo.', icon: Ghost },
      { id: 'nature', label: 'Voz da Natureza (Chauntea/Silvanus)', desc: 'Preservação do mundo natural e ciclos da vida.', icon: MapPin }
    ]
  },
  {
    id: 'ancestry',
    title: 'Ancestralidade e Povo',
    description: 'Qual a demografia central da região?',
    options: [
      { id: 'cosmo', label: 'Metrópole Cosmopolita', desc: 'Todas as raças convivem em cidades vastas e densas.', icon: Users2 },
      { id: 'ancient', label: 'Resquícios Antigos', desc: 'Anões e Elfos governam, enquanto humanos são novatos.', icon: Hammer },
      { id: 'broken', label: 'Povos Exilados', desc: 'Goblins, Orcs e Tiferinos buscam lugar em um mundo hostil.', icon: ShieldIcon }
    ]
  },
  {
    id: 'economy',
    title: 'Economia e Recursos',
    description: 'O que move o comércio e o que é raro?',
    options: [
      { id: 'mana', label: 'Mercado de Essências', desc: 'Cristais de mana são a moeda e o combustível da indústria.', icon: Gem },
      { id: 'gold', label: 'Padrão Ouro Clássico', desc: 'Moedas de metal precioso e rotas comerciais de especiarias.', icon: Coins },
      { id: 'soul', label: 'Troca de Almas', desc: 'Essência vital e memórias são a única moeda que importa.', icon: Ghost }
    ]
  },
  {
    id: 'catalyst',
    title: 'Cataclismo Fundador',
    description: 'Qual grande evento moldou a história recente?',
    options: [
      { id: 'shatter', label: 'A Quebra do Mundo', desc: 'Um evento sísmico ou mágico dividiu o continente.', icon: CloudLightning },
      { id: 'war', label: 'Guerra de 100 Anos', desc: 'Um conflito geracional que exauriu os recursos dos reinos.', icon: SwordIcon },
      { id: 'eclipse', label: 'O Grande Eclipse', desc: 'Um período de escuridão que permitiu a manifestação de demônios.', icon: Moon }
    ]
  },
  {
    id: 'twist',
    title: 'O Diferencial (The Twist)',
    description: 'Qual detalhe único torna este mundo inesquecível?',
    options: [
      { id: 'eye', label: 'O Olho Solar', desc: 'O sol é um olho gigante que vigia o mundo e julga os pecadores.', icon: Eye },
      { id: 'sleep', label: 'Mundo Sem Sono', desc: 'Ninguém dorme. As pessoas vivem 24h por dia, mas a mente se desgasta.', icon: ZapIcon },
      { id: 'vertical', label: 'Verticalidade Absoluta', desc: 'O mundo não tem chão plano, apenas penhascos e pontes infinitas.', icon: ArrowUp }
    ]
  },
  {
    id: 'culture',
    title: 'Cultura e Tabus',
    description: 'O que define o comportamento social nesta terra?',
    options: [
      { id: 'metal', label: 'Tabu do Ferro', desc: 'O metal é amaldiçoado. Armas e armaduras são de osso ou cristal.', icon: Ban },
      { id: 'silence', label: 'Voto de Silêncio', desc: 'Cidades inteiras se comunicam por sinais; falar alto é um crime.', icon: VolumeX },
      { id: 'nomad', label: 'Cultura Errante', desc: 'Ninguém possui terra. Cidades são caravanas que nunca param.', icon: Compass }
    ]
  },
  {
    id: 'tech',
    title: 'Nível Tecnológico',
    description: 'Qual o estágio das máquinas e ferramentas?',
    options: [
      { id: 'stone', label: 'Idade do Mito', desc: 'Ferramentas de pedra e osso. Magia é a única tecnologia.', icon: Mountain },
      { id: 'steam', label: 'Arcanepunk', desc: 'Engrenagens movidas a mana e navios de metal flutuante.', icon: Settings },
      { id: 'biopunk', label: 'Tecnologia Orgânica', desc: 'Máquinas feitas de tecido vivo, nervos e biotecnologia.', icon: Activity }
    ]
  }
];

interface PrepareSessionToolProps {
  onSessionLoad: (data: any) => void;
  activeSession: any | null;
  onCancel?: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export function PrepareSessionTool({ onSessionLoad, activeSession, onCancel, setGlobalLoading }: PrepareSessionToolProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: activeSession?.title || '',
    mapDescription: activeSession?.mapDescription || '',
    mapImageUrl: activeSession?.mapImageUrl || '',
    worldLore: activeSession?.worldLore || '',
    currentAgendas: activeSession?.currentAgendas || ''
  });

  const [isGuided, setIsGuided] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [guidedChoices, setGuidedChoices] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [pendingOption, setPendingOption] = useState<any | null>(null);

  const TONE_OPTIONS = [
    { id: 'minimalist', label: 'Minimalista', desc: 'Breve e factual. Ideal para narrar com suas próprias palavras.', icon: ZapIcon },
    { id: 'immersive', label: 'Imersivo', desc: 'Rico em detalhes sensoriais (cheiro, som, luz).', icon: Eye },
    { id: 'theatrical', label: 'Teatral', desc: 'Foco no drama, impacto emocional e frases épicas.', icon: FlameIcon }
  ];

  const handleChoice = (stepId: string, choice: any, tone?: string) => {
    if (!tone) {
      setPendingOption(choice);
      return;
    }

    const updatedChoices = { ...guidedChoices, [stepId]: { ...choice, tone } };
    setGuidedChoices(updatedChoices);
    setPendingOption(null);

    if (currentStep < GENESIS_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Consolidate choices into formData
      const choicesText = Object.entries(updatedChoices)
        .map(([id, c]: [string, any]) => {
          const step = GENESIS_STEPS.find(s => s.id === id);
          const toneLabel = TONE_OPTIONS.find(t => t.id === c.tone)?.label;
          return `${step?.title}: ${c.label} [Tom: ${toneLabel}] (${c.desc})`;
        })
        .join('\n');

      setFormData({
        ...formData,
        title: draftTitle || `Crônica de ${choice.label}`,
        mapDescription: `Ambiente: ${updatedChoices.biome?.label || ''}. Fundação: ${updatedChoices.age?.label || ''}.`,
        worldLore: `Tudo baseado no lore de D&D 5e.\n\nContexto:\n${choicesText}`
      });
      setIsGuided(false);
    }
  };

  const handlePrepare = async () => {
    if (!formData.title.trim() || !formData.mapDescription.trim() || !formData.worldLore.trim()) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Preencha o título, mapa e lore.",
      });
      return;
    }
    setGlobalLoading(true);
    try {
      const data = await generateWorldRegion({
        biome: formData.mapDescription,
        additionalContext: formData.worldLore,
        expandLayers: true
      });
      setResult(data as any);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na IA", description: "Falha na criação estrutural do mundo." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleFinishAndSave = async () => {
    if (!user || !db || !result) return;
    setGlobalLoading(true);

    try {
      const campaignId = await saveGeneratedWorldRegion(result as any, formData.title);

      const sessionId = `session-${Date.now()}`;
      const sessionPath = `users/${user.uid}/campaigns/default-campaign/sessions/${sessionId}`;
      const sessionDocRef = doc(db, sessionPath);

      const dataToSave = {
        title: formData.title,
        campaignId: campaignId,
        ownerId: user.uid,
        id: sessionId,
        worldLore: formData.worldLore,
        rumorTable: result.rumorTable || [],
        thematicEncounters: result.thematicEncounters || [],
        lootPatterns: result.lootPatterns || [],
        activeConflicts: result.activeConflicts || [],
        adventureHooks: result.adventureHooks || [],
        worldSecrets: result.worldSecrets || [],
        quests: (result as any).quests || [],
        dateCreated: serverTimestamp(),
        dateLastModified: serverTimestamp(),
        uiState: { activeTools: ['grimoire', 'live'] }
      };

      await setDoc(sessionDocRef, dataToSave, { merge: true });
      toast({ title: "Mundo Sincronizado!", description: "Tudo pronto no Grimório Cloud." });
      onSessionLoad(dataToSave);

    } catch (serverError) {
      console.error(serverError);
      toast({ variant: "destructive", title: "Erro no Grimório Cloud", description: "Falha ao gravar no Firebase." });
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[80vh] flex flex-col">
      {!result ? (
        <div className="flex-1 flex flex-col min-h-0">
          {isGuided ? (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" /> Passo {currentStep + 1} de {GENESIS_STEPS.length}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium">{GENESIS_STEPS[currentStep].title}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsGuided(false)} className="text-[10px] h-7">
                  <X size={12} className="mr-1" /> Sair do Guia
                </Button>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-headline text-white mb-1">{GENESIS_STEPS[currentStep].description}</h4>
                <div className="flex gap-1">
                  {GENESIS_STEPS.map((_, i) => (
                    <div key={i} className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-500",
                      i <= currentStep ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "bg-white/5"
                    )} />
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 pr-3 -mr-3">
                <div className="grid grid-cols-1 gap-3 pb-4">
                  {!pendingOption ? (
                    GENESIS_STEPS[currentStep].options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleChoice(GENESIS_STEPS[currentStep].id, opt)}
                        className="group relative flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-black/40 hover:border-accent/40 hover:bg-accent/5 transition-all text-left overflow-hidden"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                          <opt.icon size={20} className="text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white/90 group-hover:text-accent transition-colors">{opt.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{opt.desc}</p>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground/30 mt-1 group-hover:translate-x-1 group-hover:text-accent transition-all" />
                      </button>
                    ))
                  ) : (
                    <div className="space-y-4 animate-in zoom-in-95 duration-200">
                      <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3">
                        <pendingOption.icon size={16} className="text-accent" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-accent">Tema Escolhido</p>
                          <p className="text-xs font-bold text-white">{pendingOption.label}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-7 text-[9px] uppercase font-bold"
                          onClick={() => setPendingOption(null)}
                        >
                          Trocar
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Escolha o Tom da Narração</p>
                        <div className="grid grid-cols-1 gap-2">
                          {TONE_OPTIONS.map((tone) => (
                            <button
                              key={tone.id}
                              onClick={() => handleChoice(GENESIS_STEPS[currentStep].id, pendingOption, tone.id)}
                              className="group flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-accent/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                            >
                              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                <tone.icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-xs text-white/90 group-hover:text-primary transition-colors">{tone.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight">{tone.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t border-white/5 mt-auto">
                <Button disabled={currentStep === 0} variant="ghost" className="text-xs" onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}>
                  <ChevronLeft size={14} className="mr-2" /> Voltar Passo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="space-y-0.5">
                  <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Configuração da Crônica</h3>
                </div>
                <Button
                  onClick={() => {
                    setIsGuided(true);
                    setCurrentStep(0);
                    setGuidedChoices({});
                    setDraftTitle(formData.title);
                  }}
                  className="h-8 bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 text-[10px] uppercase font-bold tracking-widest gap-2"
                >
                  <Sparkles size={12} /> Gênese Profunda
                </Button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Título da Crônica</label>
                <Input
                  placeholder="Ex: As Crônicas de Ravenloft"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background/30 border-white/5 h-12 text-sm font-headline"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <MapIcon size={12} className="text-primary" /> Descrição do Mapa
                  </label>
                  <Textarea
                    placeholder="Geografia, cidades, biomas..."
                    value={formData.mapDescription}
                    onChange={(e) => setFormData({ ...formData, mapDescription: e.target.value })}
                    className="bg-background/30 border-white/5 h-24 text-[11px] resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <LinkIcon size={12} className="text-primary" /> URL do Mapa (Roll20)
                  </label>
                  <Input
                    placeholder="Link da imagem..."
                    value={formData.mapImageUrl}
                    onChange={(e) => setFormData({ ...formData, mapImageUrl: e.target.value })}
                    className="bg-background/30 border-white/5 h-10 text-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Globe size={12} className="text-primary" /> Lore e História do Mundo
                </label>
                <Textarea
                  placeholder="Fatos históricos, deuses, contexto político..."
                  value={formData.worldLore}
                  onChange={(e) => setFormData({ ...formData, worldLore: e.target.value })}
                  className="bg-background/30 border-white/5 h-32 text-[11px] resize-none custom-scrollbar"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="ghost" className="flex-1 h-12 text-xs" onClick={onCancel}>
                  Voltar
                </Button>
                <Button
                  onClick={handlePrepare}
                  disabled={!formData.title || !formData.mapDescription || !formData.worldLore}
                  className="flex-[2] bg-primary hover:bg-primary/80 font-headline h-12 text-lg shadow-xl shadow-primary/20"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Manifestar Sandbox
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl italic text-xs text-muted-foreground">
                <h4 className="font-bold text-accent mb-2 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Resumo do Mundo
                </h4>
                {result.overview?.structuralConflicts || formData.worldLore}
              </div>

              {result.religion && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <ShieldIcon size={12} /> Panteão e Fé
                  </h4>
                  <div className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-white uppercase">{result.religion.dominantGods?.join(', ')}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{result.religion.influence}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Personagens Importantes
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {result.npcs?.map((npc: any, i: number) => (
                    <Card key={i} className="border-white/5 bg-black/40 overflow-hidden group">
                      <CardHeader className="py-2 px-3 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xs font-bold text-white">{npc.name}</CardTitle>
                          <p className="text-[9px] text-accent uppercase tracking-wider">{npc.role}</p>
                        </div>
                        {npc.statBlock && (
                          <div className="text-[9px] font-bold px-2 py-0.5 bg-primary/20 text-primary rounded-full border border-primary/20">
                            CR {npc.statBlock.cr}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Objetivo Secreto</span>
                            <p className="text-[10px] text-white/80 leading-tight italic">"{npc.secretGoal}"</p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Recurso</span>
                            <p className="text-[10px] text-white/80 leading-tight">{npc.controlledResource}</p>
                          </div>
                        </div>

                        {npc.statBlock && (
                          <div className="p-2 bg-black/40 border border-white/5 rounded-lg space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-white/5">
                              <div>
                                <span className="text-[7px] font-bold text-muted-foreground uppercase">CA</span>
                                <p className="text-xs font-bold text-primary">{npc.statBlock.ac}</p>
                              </div>
                              <div>
                                <span className="text-[7px] font-bold text-muted-foreground uppercase">HP</span>
                                <p className="text-xs font-bold text-destructive">{npc.statBlock.hp}</p>
                              </div>
                              <div>
                                <span className="text-[7px] font-bold text-muted-foreground uppercase">Desl.</span>
                                <p className="text-xs font-bold text-white">{npc.statBlock.speed}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-6 gap-1 text-center">
                              {npc.statBlock.stats && Object.entries(npc.statBlock.stats).map(([k, v]: [string, any]) => (
                                <div key={k}>
                                  <span className="text-[7px] font-bold text-muted-foreground uppercase">{k}</span>
                                  <p className="text-[10px] font-bold text-white">{v}</p>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {npc.statBlock.actions?.slice(0, 2).map((action: any, idx: number) => (
                                <div key={idx} className="text-[9px] leading-tight flex gap-2">
                                  <span className="text-accent font-bold shrink-0">{action.name}.</span>
                                  <span className="text-muted-foreground line-clamp-1">{action.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> Pontos de Interesse & Localidades
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {result.locations?.map((loc: any, i: number) => (
                    <Card key={i} className="border-white/5 bg-black/40 overflow-hidden group">
                      <CardHeader className="py-2 px-3 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-xs font-bold text-white">{loc.name}</CardTitle>
                          <p className="text-[9px] text-accent uppercase tracking-wider">{loc.type}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 space-y-3">
                        <p className="text-[10px] text-muted-foreground leading-snug">{loc.description}</p>

                        {(loc.regionalEffects?.length > 0 || loc.hazards?.length > 0) && (
                          <div className="p-2 bg-accent/5 border border-accent/10 rounded-lg space-y-2">
                            {loc.regionalEffects?.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[7px] font-bold text-accent uppercase flex items-center gap-1">
                                  <Sparkles size={8} /> Efeitos Regionais
                                </span>
                                <ul className="space-y-1">
                                  {loc.regionalEffects.map((effect: string, idx: number) => (
                                    <li key={idx} className="text-[9px] text-white/70 leading-tight">• {effect}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {loc.hazards?.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[7px] font-bold text-destructive uppercase flex items-center gap-1">
                                  <ShieldAlert size={8} /> Perigos & Hazards
                                </span>
                                <div className="space-y-1.5">
                                  {loc.hazards.map((hazard: any, idx: number) => (
                                    <div key={idx} className="text-[9px] leading-tight">
                                      <span className="text-white/90 font-bold">{hazard.name}: </span>
                                      <span className="text-muted-foreground">{hazard.desc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {loc.keyFeatures?.map((feature: string, idx: number) => (
                            <span key={idx} className="text-[7px] font-bold px-1.5 py-0.5 bg-white/5 text-muted-foreground rounded border border-white/5 uppercase">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                  <Tent size={12} /> Organizações & Facções
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {result.factions?.map((faction: any, i: number) => (
                    <div key={i} className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-white">{faction.name}</h5>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-accent/20 text-accent rounded uppercase">{faction.hq}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">{faction.ideology}</p>
                      <div className="flex flex-wrap gap-1">
                        {faction.assets?.map((asset: string, idx: number) => (
                          <span key={idx} className="text-[7px] font-bold px-1 py-0.5 bg-white/5 text-muted-foreground rounded uppercase border border-white/5">
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} /> Tabela de Boatos (d10)
                </h4>
                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="p-2 text-[8px] font-bold text-muted-foreground uppercase">Rumor</th>
                        <th className="p-2 text-[8px] font-bold text-muted-foreground uppercase text-center w-16">Veracidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.rumorTable?.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-2 px-3">
                            <p className="text-[10px] text-white/80 leading-tight">{item.rumor}</p>
                            <p className="text-[8px] text-muted-foreground italic mt-0.5">— {item.source}</p>
                          </td>
                          <td className="p-2 text-center">
                            <span className={cn(
                              "text-[7px] font-bold px-1.5 py-0.5 rounded uppercase",
                              item.truthLevel === 'true' && "bg-green-500/20 text-green-400",
                              item.truthLevel === 'false' && "bg-red-500/20 text-red-400",
                              item.truthLevel === 'partial' && "bg-yellow-500/20 text-yellow-400"
                            )}>
                              {item.truthLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                  <Dices size={12} /> Encontros Temáticos
                </h4>
                <div className="space-y-3">
                  {result.thematicEncounters?.map((enc: any, i: number) => (
                    <div key={i} className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                      <h5 className="text-[10px] font-bold text-white uppercase">{enc.title}</h5>
                      <p className="text-[10px] text-muted-foreground leading-snug">{enc.description}</p>
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[8px] font-bold text-accent/70 uppercase">Trigger:</span>
                        <span className="text-[9px] text-white/60">{enc.trigger}</span>
                      </div>
                      {enc.combatStats && (
                        <p className="text-[9px] text-destructive/80 font-mono mt-1 pt-1 border-t border-white/5">
                          Stats: {enc.combatStats}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-white/5 bg-black/40 rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/[0.02]">
                  <CardTitle className="text-[10px] font-headline uppercase tracking-widest text-accent flex items-center gap-2">
                    <Coins size={12} /> Padrões de Tesouro & Loot
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {result.lootPatterns?.map((loot: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5 pb-1">{loot.category}</p>
                      <div className="flex flex-wrap gap-2">
                        {loot.items?.map((item: string, idx: number) => (
                          <span key={idx} className="text-[9px] text-white/80 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                            <span className="text-primary">•</span> {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-accent/[0.03] rounded-2xl overflow-hidden md:col-span-2">
                <CardHeader className="py-3 px-4 border-b border-accent/10 bg-accent/5">
                  <CardTitle className="text-[10px] font-headline uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                    <ScrollText size={12} /> Missões de Introdução (Starter Quests)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {((result as any).quests || []).map((quest: any, i: number) => (
                    <div key={i} className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent/30 transition-colors">
                      <p className="text-xs font-bold text-white">{quest.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic">"{quest.hook}"</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {quest.keyNpcs?.map((npc: string, idx: number) => (
                          <span key={idx} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">@{npc}</span>
                        ))}
                        {quest.keyLocations?.map((loc: string, idx: number) => (
                          <span key={idx} className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">#{loc}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/40 rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/[0.02]">
                  <CardTitle className="text-[10px] font-headline uppercase tracking-widest text-accent">Ganchos de Aventura</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-3">
                    {result.adventureHooks?.map((item: any, i: number) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex gap-3 group">
                        <span className="text-primary font-bold text-lg leading-none shrink-0">•</span>
                        <div className="space-y-0.5">
                          <p className="group-hover:text-white transition-colors leading-relaxed">
                            {typeof item === 'string' ? item : item.hook}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t border-white/5 mt-auto">
            <Button variant="outline" className="flex-1 h-14 rounded-xl" onClick={() => setResult(null)}>
              <ArrowLeft size={16} className="mr-2" /> Ajustar
            </Button>
            <Button
              onClick={handleFinishAndSave}
              className="flex-[2] bg-accent text-accent-foreground hover:bg-accent/90 font-headline h-14 rounded-xl text-lg shadow-2xl shadow-accent/20 gap-3"
            >
              <Save size={24} />
              INICIAR NOVA SESSÃO
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
