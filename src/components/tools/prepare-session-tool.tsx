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
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { prepareSession, type PrepareSessionOutput } from '@/ai/flows/prepare-session-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import {
  generateWorldFoundationFlow,
  generateWorldEntitiesFlow,
  generateWorldGameplayFlow
} from '@/ai/flows/generate-world-region-flow';
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
      { id: 'echoes', label: 'Ecos do Passado', desc: 'Civilizações em ruínas sobre os escombros de impérios antigos.', icon: History },
      { id: 'dystopian', label: 'Era da Decadência', desc: 'Recursos escassos, reinos caindo e a esperança se apagando.', icon: Skull },
      { id: 'steampunk', label: 'Revolução de Éter', desc: 'Avanço tecnológico movido por magia. Dirigíveis e engrenagens.', icon: Cpu },
      { id: 'cosmic', label: 'Alinhamento Astral', desc: 'O mundo está se fundindo com outros planos de existência.', icon: Globe }
    ]
  },
  {
    id: 'biome',
    title: 'Geografia Primordial',
    description: 'Qual o ambiente dominante da sua macrorregião?',
    options: [
      { id: 'sky', label: 'Arquipélago Celeste', desc: 'Ilhas flutuantes ligadas por barcos voadores e magia.', icon: Globe },
      { id: 'under', label: 'Reinos da Profundeza', desc: 'Vasta rede de cavernas, fungos e perigos do Underdark.', icon: Mountain },
      { id: 'techno', label: 'Megacidade Continental', desc: 'Uma única cidade colossal cobre toda a superfície conhecida.', icon: Settings },
      { id: 'ocean', label: 'Mundo Oceânico', desc: 'Infindáveis mares pontuados por recifes de coral e cidades submersas.', icon: Waves },
      { id: 'desert', label: 'Dunas Infinitas', desc: 'Mar de areia com oásis mágicos e segredos enterrados.', icon: Sun },
      { id: 'jungle', label: 'Selva Devoradora', desc: 'Vegetação agressiva que consome construções e civilizações.', icon: Tent }
    ]
  },
  {
    id: 'rule',
    title: 'Estrutura de Poder',
    description: 'Quem dita as leis nesta terra?',
    options: [
      { id: 'mage', label: 'Magocracia Arcana', desc: 'Conclaves de magos governam através do conhecimento e poder.', icon: BookOpen },
      { id: 'theo', label: 'Teocracia Divina', desc: 'Sumos sacerdotes governam em nome dos deuses do panteão.', icon: Church },
      { id: 'feudal', label: 'Feudalismo Decadente', desc: 'Nobres em guerra por terras e linhagens esquecidas.', icon: Hammer },
      { id: 'merchant', label: 'Sindicato Mercante', desc: 'As grandes guildas de comércio compram e vendem leis.', icon: Coins },
      { id: 'anarchy', label: 'Terras sem Lei', desc: 'Tribos errantes e bandoleiros sobrevivem sob o direito do mais forte.', icon: ShieldAlert },
      { id: 'hive', label: 'Mente Coletiva', desc: 'Uma consciencia central comanda as ações de toda a população.', icon: Activity }
    ]
  },
  {
    id: 'tension',
    title: 'O Grande Conflito',
    description: 'Qual a tensão que ameaça rasgar o mundo no meio?',
    options: [
      { id: 'invasion', label: 'Invasão Planar', desc: 'Fendas se abrindo para o Abismo ou para os Nove Infernos.', icon: Globe },
      { id: 'blight', label: 'A Praga Mágica', desc: 'Doença que corrompe a magia e transforma seres em aberrações.', icon: FlameIcon },
      { id: 'cosmic', label: 'O Despertar do Titã', desc: 'Uma entidade primordial começou a se mover sob a terra.', icon: ZapIcon },
      { id: 'rebellion', label: 'Guerra de Castas', desc: 'As classes oprimidas se levantam contra os governantes tiranos.', icon: Users2 },
      { id: 'techvsnature', label: 'Tecno-Expansão', desc: 'O progresso industrial destruindo os últimos santuários naturais.', icon: Settings },
      { id: 'forgotten', label: 'O Retorno dos Banidos', desc: 'Antigas raças exiladas voltaram para reivindicar o mundo.', icon: Ghost }
    ]
  },
  {
    id: 'tone',
    title: 'Atmosfera da Campanha',
    description: 'Qual a sensação predominante da narrativa?',
    options: [
      { id: 'grim', label: 'Grimdark', desc: 'Lute contra o inevitável. Escolhas difíceis e consequências morais.', icon: Skull },
      { id: 'heroic', label: 'Heroísmo Épico', desc: 'Heroísmo clássico contra o mal absoluto. Proezas lendárias.', icon: Star },
      { id: 'mystery', label: 'Mistério Sobrenatural', desc: 'Investigação, conspirações e horrores ocultos.', icon: Search },
      { id: 'pulp', label: 'Aventura Pulp', desc: 'Ação frenética, heróis maiores que a vida e perigos exóticos.', icon: ZapIcon },
      { id: 'comedy', label: 'Sátira Fantástica', desc: 'Humor ácido, situações absurdas e deuses caprichosos.', icon: Sparkles },
      { id: 'political', label: 'Intriga Política', desc: 'Diplomacia, espionagem e guerra psicológica entre nações.', icon: ScrollText }
    ]
  },
  {
    id: 'source',
    title: 'Misticismo e Magia',
    description: 'Como a magia se manifesta neste mundo?',
    options: [
      { id: 'common', label: 'Magia Ubíqua', desc: 'Itens mágicos e feitiços são comuns no dia a dia.', icon: ZapIcon },
      { id: 'taboo', label: 'Conhecimento Proibido', desc: 'Magia é caçada ou restrita a poucos privilegiados.', icon: ShieldIcon },
      { id: 'ritual', label: 'Fé e Sacrifício', desc: 'Magia vem exclusivamente da devoção aos deuses ou pactos.', icon: Scroll },
      { id: 'wild', label: 'Fontes Instáveis', desc: 'A magia é imprevisível e pode causar efeitos colaterais desastrosos.', icon: CloudLightning },
      { id: 'blood', label: 'Magia de Sangue', desc: 'O poder exige vitalidade e sacrifícios pessoais para ser canalizado.', icon: Droplets },
      { id: 'forgotten_art', label: 'Arcanismo Arcaico', desc: 'Apenas segredos antigos em ruínas permitem o uso de magia.', icon: BookOpen }
    ]
  },
  {
    id: 'pantheon',
    title: 'Panteão Dominante',
    description: 'Quais deuses sustentam os pilares da fé?',
    options: [
      { id: 'light', label: 'A Ordem do Sol (Pelor/Tyr)', desc: 'Foco em justiça, luz e proteção dos fracos.', icon: Sun },
      { id: 'shadow', label: 'Corte das Sombras (Raven Queen/Lolth)', desc: 'Equilíbrio entre vida e morte, ou domínio através do medo.', icon: Ghost },
      { id: 'nature', label: 'Voz da Natureza (Chauntea/Silvanus)', desc: 'Preservação do mundo natural e ciclos da vida.', icon: MapPin },
      { id: 'knowledge', label: 'Escribas do Destino (Oghma/Ioun)', desc: 'Culto ao conhecimento, segredos e profecias.', icon: ScrollText },
      { id: 'chaos', label: 'Arautos do Caos (Talos/Gruumsh)', desc: 'Destruição, força bruta e a glória do conflito.', icon: FlameIcon },
      { id: 'dead', label: 'Deuses Esquecidos', desc: 'Os deuses morreram ou abandonaram o mundo; apenas relíquias restam.', icon: Archive }
    ]
  },
  {
    id: 'ancestry',
    title: 'Ancestralidade e Povo',
    description: 'Qual a demografia central da região?',
    options: [
      { id: 'cosmo', label: 'Metrópole Cosmopolita', desc: 'Todas as raças convivem em cidades vastas e densas.', icon: Users2 },
      { id: 'ancient', label: 'Resquícios Antigos', desc: 'Anões e Elfos governam, enquanto humanos são novatos.', icon: Hammer },
      { id: 'broken', label: 'Povos Exilados', desc: 'Goblins, Orcs e Tiferinos buscam lugar em um mundo hostil.', icon: ShieldIcon },
      { id: 'hybrid', label: 'Quimeras Bio-Mágicas', desc: 'Mistura de carne e metal, ou raças criadas em laboratórios arcanos.', icon: FlaskConical },
      { id: 'undead', label: 'Civilização dos Mortos', desc: 'Espectros e zumbis conscientes vivem em uma sociedade eterna.', icon: Skull },
      { id: 'planar', label: 'Nativos Extraterrenos', desc: 'Gith, Aasimar e Genasi são a maioria dominante.', icon: Globe }
    ]
  },
  {
    id: 'economy',
    title: 'Economia e Recursos',
    description: 'O que move o comércio e o que é raro?',
    options: [
      { id: 'mana', label: 'Mercado de Essências', desc: 'Cristais de mana são a moeda e o combustível da indústria.', icon: Gem },
      { id: 'gold', label: 'Padrão Ouro Clássico', desc: 'Moedas de metal precioso e rotas comerciais de especiarias.', icon: Coins },
      { id: 'soul', label: 'Troca de Almas', desc: 'Essência vital e memórias são a única moeda que importa.', icon: Ghost },
      { id: 'barter', label: 'Escambo de Necessidade', desc: 'Água e comida são mais valiosos que qualquer tesouro.', icon: Droplets },
      { id: 'favor', label: 'Moeda de Sangue e Dívida', desc: 'Favores políticos e obrigações mágicas sustentam a economia.', icon: Hammer },
      { id: 'relic', label: 'Tráfico de Relíquias', desc: 'Artefatos de uma era perdida são o único recurso de alto valor.', icon: Archive }
    ]
  },
  {
    id: 'catalyst',
    title: 'Cataclismo Fundador',
    description: 'Qual grande evento moldou a história recente?',
    options: [
      { id: 'shatter', label: 'A Quebra do Mundo', desc: 'Um evento sísmico ou mágico dividiu o continente.', icon: CloudLightning },
      { id: 'war', label: 'Guerra de 100 Anos', desc: 'Um conflito geracional que exauriu os recursos dos reinos.', icon: SwordIcon },
      { id: 'eclipse', label: 'O Grande Eclipse', desc: 'Um período de escuridão que permitiu a manifestação de demônios.', icon: Moon },
      { id: 'plague', label: 'Febre do Abismo', desc: 'Uma doença vinda de fora do mundo que dizimou nações.', icon: Skull },
      { id: 'ascension', label: 'Ascensão Mortal', desc: 'Um herói roubou o poder de um deus, causando caos celestial.', icon: Crown },
      { id: 'rain', label: 'Chuva de Fogo Estelar', desc: 'Fragmentos de um meteoro mágico trouxeram maravilhas e perigos.', icon: Sparkles }
    ]
  },
  {
    id: 'twist',
    title: 'O Diferencial (The Twist)',
    description: 'Qual detalhe único torna este mundo inesquecível?',
    options: [
      { id: 'eye', label: 'O Olho Solar', desc: 'O sol é um olho gigante que vigia o mundo e julga os pecadores.', icon: Eye },
      { id: 'sleep', label: 'Mundo Sem Sono', desc: 'Ninguém dorme. As pessoas vivem 24h por dia, mas a mente se desgasta.', icon: ZapIcon },
      { id: 'vertical', label: 'Verticalidade Absoluta', desc: 'O mundo não tem chão plano, apenas penhascos e pontes infinitas.', icon: ArrowUp },
      { id: 'shadows', label: 'Sombras Vivas', desc: 'As sombras das pessoas têm vontade própria e podem atacar seus donos.', icon: Ghost },
      { id: 'echoes', label: 'Ecos Temporais', desc: 'Passado, presente e futuro ocorrem simultaneamente em certos locais.', icon: History },
      { id: 'reincarnation', label: 'Ciclo Fechado', desc: 'Quem morre renasce imediatamente com as mesmas memórias.', icon: RefreshCw }
    ]
  },
  {
    id: 'culture',
    title: 'Cultura e Tabus',
    description: 'O que define o comportamento social nesta terra?',
    options: [
      { id: 'metal', label: 'Tabu do Ferro', desc: 'O metal é amaldiçoado. Armas e armaduras são de osso ou cristal.', icon: Ban },
      { id: 'silence', label: 'Voto de Silêncio', desc: 'Cidades inteiras se comunicam por sinais; falar alto é um crime.', icon: VolumeX },
      { id: 'nomad', label: 'Cultura Errante', desc: 'Ninguém possui terra. Cidades são caravanas que nunca param.', icon: Compass },
      { id: 'masked', label: 'Sociedade Mascarada', desc: 'Ninguém revela o rosto; as máscaras mostram o cargo e status social.', icon: User },
      { id: 'honored', label: 'Código de Duelo', desc: 'Todos os conflitos devem ser resolvidos em arenas formais.', icon: SwordIcon },
      { id: 'ancestor_worship', label: 'Piedade Espectral', desc: 'Os mortos participam do governo e das decisões familiares.', icon: Users2 }
    ]
  },
  {
    id: 'tech',
    title: 'Nível Tecnológico',
    description: 'Qual o estágio das máquinas e ferramentas?',
    options: [
      { id: 'stone', label: 'Idade do Mito', desc: 'Ferramentas de pedra e osso. Magia é a única tecnologia.', icon: Mountain },
      { id: 'steam', label: 'Arcanepunk', desc: 'Engrenagens movidas a mana e navios de metal flutuante.', icon: Settings },
      { id: 'biopunk', label: 'Tecnologia Orgânica', desc: 'Máquinas feitas de tecido vivo, nervos e biotecnologia.', icon: Activity },
      { id: 'clockwork', label: 'Maquinaria de Precisão', desc: 'Autômatos de latão e relógios que controlam o fluxo do tempo.', icon: Cpu },
      { id: 'scraptown', label: 'Ferro-Velho Industrial', desc: 'Construções feitas de restos de uma civilização superior e decaída.', icon: Hammer },
      { id: 'alchtech', label: 'Alquimia Avançada', desc: 'Líquidos e gases mágicos substituem eletricidade e fogo.', icon: FlaskConical }
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

  // Local Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState('');

  const handleChoice = (stepId: string, choice: any) => {
    const updatedChoices = { ...guidedChoices, [stepId]: choice };
    setGuidedChoices(updatedChoices);
    setPendingOption(null);

    if (currentStep < GENESIS_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Consolidate choices into formData
      const choicesText = Object.entries(updatedChoices)
        .map(([id, c]: [string, any]) => {
          const step = GENESIS_STEPS.find(s => s.id === id);
          return `${step?.title}: ${c.label} (${c.desc})`;
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
    setIsGenerating(true);
    try {
      setGeneratingMessage('Etapa 1/3: Forjando a Fundação Histórica e Política do Mundo...');
      const foundationData = await generateWorldFoundationFlow({
        biome: formData.mapDescription,
        additionalContext: formData.worldLore,
        expandLayers: true
      });

      setGeneratingMessage('Etapa 2/3: Povoando o Mundo com Facções, NPCs e Locais...');
      const entitiesData = await generateWorldEntitiesFlow({
        biome: formData.mapDescription,
        additionalContext: formData.worldLore,
        expandLayers: true,
        foundationData
      });

      setGeneratingMessage('Etapa 3/3: Gerando Missões, Boatos, Encontros e Preparação da Sessão...');
      const gameplayData = await generateWorldGameplayFlow({
        biome: formData.mapDescription,
        additionalContext: formData.worldLore,
        expandLayers: true,
        foundationData,
        entitiesData
      });

      const mergedData = {
        ...foundationData,
        ...entitiesData,
        ...gameplayData
      };

      setResult(mergedData as any);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na IA", description: "Falha na criação estrutural do mundo." });
    } finally {
      setIsGenerating(false);
      setGeneratingMessage('');
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
    <div className="space-y-4 max-h-[80vh] flex flex-col relative">
      {isGenerating && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 rounded-3xl">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Globe className="w-16 h-16 text-primary animate-spin-slow relative z-10" />
            <Sparkles className="w-6 h-6 text-accent absolute -top-2 -right-2 animate-bounce" />
          </div>
          <h3 className="text-xl font-headline font-bold text-white mb-3 tracking-widest uppercase title-glow">Gênese em Andamento</h3>
          <p className="text-sm font-[Fira_Code] text-accent animate-pulse max-w-sm">{generatingMessage}</p>
        </div>
      )}

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
                  ) : null}
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
                              {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((stat) => (
                                <div key={stat}>
                                  <span className="text-[7px] font-bold text-muted-foreground uppercase">{stat}</span>
                                  <p className="text-[10px] font-bold text-white">{npc.statBlock[stat]}</p>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {npc.statBlock.actions?.slice(0, 2).map((action: string, idx: number) => {
                                const [name, ...descParts] = action.split(':');
                                const desc = descParts.join(':').trim();
                                return (
                                  <div key={idx} className="text-[9px] leading-tight flex gap-2">
                                    <span className="text-accent font-bold shrink-0">{name ? name + '.' : ''}</span>
                                    <span className="text-muted-foreground line-clamp-1">{desc || name}</span>
                                  </div>
                                );
                              })}
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

              {result.sessionZero && (
                <Card className="border-primary/20 bg-primary/[0.03] rounded-2xl overflow-hidden md:col-span-2">
                  <CardHeader className="py-3 px-4 border-b border-primary/10 bg-primary/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-headline uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <ShieldIcon size={12} /> Gênese da Sessão 0
                    </CardTitle>
                    <Badge variant="outline" className="text-[8px] border-primary/30 text-primary uppercase">Segurança & Pilares</Badge>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-primary uppercase">Pilares da Campanha</span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.sessionZero.pillars?.map((p: string, i: number) => (
                            <span key={i} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">{p}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-destructive uppercase">Ferramentas de Segurança</span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.sessionZero.safetyTools?.map((s: string, i: number) => (
                            <span key={i} className="text-[9px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-md border border-destructive/20">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-accent uppercase">Expectativas dos Jogadores</span>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{result.sessionZero.playerExpectations}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-emerald-400 uppercase">Ganchos de Personagem</span>
                        <ul className="space-y-1">
                          {result.sessionZero.characterHooks?.map((h: string, i: number) => (
                            <li key={i} className="text-[10px] text-white/70 leading-tight">• {h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
