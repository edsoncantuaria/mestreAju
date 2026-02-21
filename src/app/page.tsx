'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scroll, 
  Search, 
  PenTool, 
  Map, 
  Zap, 
  Sword,
  X,
  Plus,
  Activity,
  Link as LinkIcon,
  BookOpen,
  Sparkles,
  Users,
  Shield,
  Book,
  FolderOpen,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { SessionSummaryTool } from '@/components/tools/session-summary-tool';
import { ContextAnalysisTool } from '@/components/tools/context-analysis-tool';
import { NarrativeGeneratorTool } from '@/components/tools/narrative-generator-tool';
import { SandboxIdeasTool } from '@/components/tools/sandbox-ideas-tool';
import { ConsequencesTool } from '@/components/tools/consequences-tool';
import { LiveSessionTool } from '@/components/tools/live-session-tool';
import { PrepareSessionTool } from '@/components/tools/prepare-session-tool';
import { RulesLookupTool } from '@/components/tools/rules-lookup-tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FirebaseClientProvider, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { collection, query, orderBy } from 'firebase/firestore';

type ToolId = 'live' | 'summary' | 'analysis' | 'narrative' | 'sandbox' | 'consequences' | 'rules';

function ScreenDungeonMasterContent() {
  const { user } = useUser();
  const db = useFirestore();
  const [activeTools, setActiveTools] = useState<ToolId[]>(['live']);
  const [partyInfo, setPartyInfo] = useState({ playerCount: 4, averageLevel: 1 });
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);

  // Memoized query to fetch sessions
  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, `users/${user.uid}/campaigns/default-campaign/sessions`),
      orderBy('dateLastModified', 'desc')
    );
  }, [db, user]);

  const { data: sessions, isLoading: loadingSessions } = useCollection(sessionsQuery);

  const [sharedContext, setSharedContext] = useState({
    lastNarrative: '',
    lastSecret: '',
    lastNPCs: '',
    lastFactions: ''
  });

  const tools = [
    { 
      id: 'live', 
      label: 'Sessão Ativa', 
      icon: Activity, 
      component: (props: any) => <LiveSessionTool {...props} activeSession={activeSession} />, 
      color: 'text-rose-500' 
    },
    { 
      id: 'rules', 
      label: 'Enciclopédia', 
      icon: Book, 
      component: (props: any) => <RulesLookupTool {...props} />, 
      color: 'text-cyan-400' 
    },
    { 
      id: 'summary', 
      label: 'Resumo', 
      icon: Scroll, 
      component: (props: any) => <SessionSummaryTool {...props} activeSession={activeSession} />, 
      color: 'text-blue-400' 
    },
    { 
      id: 'analysis', 
      label: 'Análise', 
      icon: Search, 
      component: (props: any) => <ContextAnalysisTool {...props} activeSession={activeSession} />, 
      color: 'text-amber-400' 
    },
    { 
      id: 'narrative', 
      label: 'Escrita', 
      icon: PenTool, 
      component: (props: any) => <NarrativeGeneratorTool {...props} activeSession={activeSession} />, 
      color: 'text-purple-400' 
    },
    { 
      id: 'sandbox', 
      label: 'Sandbox', 
      icon: Map, 
      component: (props: any) => <SandboxIdeasTool {...props} activeSession={activeSession} />, 
      color: 'text-green-400' 
    },
    { 
      id: 'consequences', 
      label: 'Efeitos', 
      icon: Zap, 
      component: (props: any) => <ConsequencesTool {...props} activeSession={activeSession} />, 
      color: 'text-red-400' 
    },
  ] as const;

  const toggleTool = (id: ToolId) => {
    setActiveTools(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSelectSession = (session: any) => {
    setActiveSession(session);
    setIsModalOpen(false);
    setShowNewSessionForm(false);
  };

  const handleToolAction = (targetToolId: ToolId, data: any) => {
    if (!activeTools.includes(targetToolId)) {
      setActiveTools(prev => [...prev, targetToolId]);
    }
    setSharedContext(prev => ({ ...prev, ...data }));
  };

  useEffect(() => {
    if (!activeSession && !loadingSessions && (!sessions || sessions.length === 0)) {
      setIsModalOpen(true);
      setShowNewSessionForm(true);
    } else if (!activeSession && !loadingSessions) {
      setIsModalOpen(true);
    }
  }, [activeSession, loadingSessions, sessions]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <header className="h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-[100] shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sword size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-headline font-bold text-lg tracking-tight leading-none text-accent">MestreAju</h1>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Copiloto Supremo</p>
            </div>
          </div>

          <div className="h-10 px-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3 cursor-pointer hover:bg-black/60 transition-all group" onClick={() => setIsModalOpen(true)}>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Sessão Ativa</span>
              <span className="text-xs font-bold text-accent group-hover:text-white transition-colors truncate max-w-[150px]">
                {activeSession ? activeSession.title : 'Nenhuma Selecionada'}
              </span>
            </div>
            <FolderOpen size={14} className="text-accent/50 group-hover:text-accent transition-colors" />
          </div>
        </div>

        <nav className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-[50%] no-scrollbar">
          <TooltipProvider>
            {tools.map((tool) => {
              const isActive = activeTools.includes(tool.id);
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => toggleTool(tool.id)}
                      className={cn(
                        "h-9 px-3 rounded-lg transition-all flex items-center gap-2 font-headline shrink-0",
                        isActive ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <tool.icon size={16} className={isActive ? "text-accent" : tool.color} />
                      <span className="hidden xl:inline text-xs">{tool.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isActive ? 'Fechar' : 'Abrir'} {tool.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full border-white/10 gap-2 text-[10px] font-bold h-9">
                <Users size={14} className="text-accent" />
                <span className="hidden md:inline">{partyInfo.playerCount}p / Nvl {partyInfo.averageLevel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-card border-white/10 shadow-2xl">
              <div className="space-y-4">
                <h4 className="font-headline font-bold text-sm text-accent">Configurações do Grupo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-muted-foreground">Jogadores</label>
                    <Input 
                      type="number" 
                      value={partyInfo.playerCount} 
                      onChange={(e) => setPartyInfo({...partyInfo, playerCount: parseInt(e.target.value) || 1})}
                      className="h-8 text-xs bg-black/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-muted-foreground">Nível Médio</label>
                    <Input 
                      type="number" 
                      value={partyInfo.averageLevel} 
                      onChange={(e) => setPartyInfo({...partyInfo, averageLevel: parseInt(e.target.value) || 1})}
                      className="h-8 text-xs bg-black/20"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className={cn(
          "grid gap-6 transition-all duration-500 items-start",
          activeTools.length === 1 ? "grid-cols-1 max-w-4xl mx-auto" : 
          activeTools.length === 2 ? "grid-cols-1 xl:grid-cols-2" : 
          "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
        )}>
          {tools.filter(t => activeTools.includes(t.id)).map((tool) => (
            <div 
              key={tool.id} 
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
            >
              <div className="glass-card rounded-2xl overflow-hidden border border-white/10 h-full flex flex-col">
                <div className="h-12 flex items-center justify-between px-5 bg-black/40 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <tool.icon size={16} className={tool.id === 'live' ? 'text-rose-500 animate-pulse' : tool.color} />
                    <span className="font-headline font-bold text-xs tracking-wide uppercase text-accent/80">{tool.label}</span>
                    {activeSession && tool.id !== 'rules' && (
                      <div className="flex items-center gap-1">
                        <LinkIcon size={10} className="text-green-500" />
                        <span className="text-[8px] font-bold text-green-500 uppercase">Contexto Ativo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleTool(tool.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar bg-card/40 flex-1 min-h-[450px]">
                  <tool.component 
                    partyInfo={partyInfo} 
                    sharedContext={sharedContext}
                    activeSession={activeSession}
                    onContextAction={handleToolAction}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Preparation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-white/10 p-0 overflow-hidden">
          <div className="h-1.5 bg-primary w-full" />
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-headline text-2xl text-accent flex items-center gap-3">
                <BookOpen className="text-primary" />
                {showNewSessionForm ? 'Preparar Nova Jornada' : 'Suas Crônicas'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground italic">
                {showNewSessionForm ? 'Defina o mapa e o lore inicial para o Copiloto.' : 'Selecione uma sessão existente para carregar o conhecimento do mundo.'}
              </DialogDescription>
            </DialogHeader>

            {showNewSessionForm ? (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <PrepareSessionTool 
                  activeSession={null} 
                  onSessionLoad={handleSelectSession} 
                  onCancel={() => setShowNewSessionForm(false)}
                />
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Button 
                  onClick={() => setShowNewSessionForm(true)}
                  className="w-full h-14 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-accent font-headline gap-3 justify-start px-6"
                >
                  <div className="p-2 rounded-lg bg-primary text-white">
                    <Plus size={20} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold">Criar Nova Sessão</span>
                    <span className="text-[10px] text-muted-foreground">Comece um novo arco do zero</span>
                  </div>
                </Button>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Sessões Recentes</h4>
                  
                  {loadingSessions ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <Loader2 className="animate-spin mb-2" />
                      <span className="text-[10px] font-bold">Lendo arquivos...</span>
                    </div>
                  ) : sessions && sessions.length > 0 ? (
                    sessions.map((session: any) => (
                      <button
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent/40 hover:bg-white/10 transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <Scroll size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{session.title}</span>
                            <span className="text-[10px] text-muted-foreground italic line-clamp-1">{session.description || 'Sem descrição'}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground italic text-xs">
                      Nenhuma sessão encontrada. Crie a primeira!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <footer className="h-8 border-t border-white/5 bg-black/60 px-6 flex items-center justify-between text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Shield size={10} className="text-accent" /> CR: {partyInfo.averageLevel}</span>
          <span className="flex items-center gap-1"><Users size={10} className="text-accent" /> PARTY: {partyInfo.playerCount}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-accent">{activeSession ? 'Sessão Ativa: ' + activeSession.title : 'Aguardando Preparação'}</span>
        </div>
      </footer>
    </div>
  );
}

export default function ScreenDungeonMaster() {
  return (
    <FirebaseClientProvider>
      <ScreenDungeonMasterContent />
    </FirebaseClientProvider>
  );
}
