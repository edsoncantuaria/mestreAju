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
  Layout,
  Users,
  Shield,
  Activity,
  Link as LinkIcon,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { SessionSummaryTool } from '@/components/tools/session-summary-tool';
import { ContextAnalysisTool } from '@/components/tools/context-analysis-tool';
import { NarrativeGeneratorTool } from '@/components/tools/narrative-generator-tool';
import { SandboxIdeasTool } from '@/components/tools/sandbox-ideas-tool';
import { ConsequencesTool } from '@/components/tools/consequences-tool';
import { LiveSessionTool } from '@/components/tools/live-session-tool';
import { PrepareSessionTool } from '@/components/tools/prepare-session-tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FirebaseClientProvider } from '@/firebase';
import { Badge } from '@/components/ui/badge';

type ToolId = 'live' | 'summary' | 'analysis' | 'narrative' | 'sandbox' | 'consequences' | 'prepare';

function ScreenDungeonMasterContent() {
  const [activeTools, setActiveTools] = useState<ToolId[]>(['prepare']);
  const [partyInfo, setPartyInfo] = useState({ playerCount: 4, averageLevel: 1 });
  
  // O contexto central que "carrega" a inteligência do mestre
  const [activeSession, setActiveSession] = useState<any | null>(null);

  const [sharedContext, setSharedContext] = useState({
    lastNarrative: '',
    lastSecret: '',
    lastNPCs: '',
    lastFactions: ''
  });

  const tools = [
    { 
      id: 'prepare', 
      label: 'Preparar', 
      icon: BookOpen, 
      component: (props: any) => <PrepareSessionTool {...props} onSessionLoad={handleLoadSession} />, 
      color: 'text-indigo-400' 
    },
    { 
      id: 'live', 
      label: 'Ativo', 
      icon: Activity, 
      component: (props: any) => <LiveSessionTool {...props} activeSession={activeSession} />, 
      color: 'text-rose-500' 
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

  const handleLoadSession = (sessionData: any) => {
    setActiveSession(sessionData);
    // Ao carregar uma sessão, geralmente abrimos a ferramenta "Ativo" para começar o jogo
    if (!activeTools.includes('live')) {
      setActiveTools(prev => [...prev, 'live']);
    }
  };

  const handleToolAction = (targetToolId: ToolId, data: any) => {
    if (!activeTools.includes(targetToolId)) {
      setActiveTools(prev => [...prev, targetToolId]);
    }
    setSharedContext(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <header className="h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-[100] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sword size={22} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-headline font-bold text-xl tracking-tight leading-none text-accent">MestreAju</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">
              {activeSession ? 'Sessão Ativa: ' + activeSession.title : 'Modo Preparação'}
            </p>
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
                        "h-10 px-3 md:px-4 rounded-lg transition-all flex items-center gap-2 font-headline shrink-0",
                        isActive ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <tool.icon size={18} className={isActive ? "text-accent" : tool.color} />
                      <span className="hidden lg:inline">{tool.label}</span>
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
          {activeSession && (
            <Badge variant="outline" className="hidden lg:flex gap-1.5 border-accent/30 text-accent bg-accent/5 animate-pulse">
              <Sparkles size={12} /> Copiloto Carregado
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full border-white/10 gap-2 text-[10px] font-bold h-9">
                <Users size={14} className="text-accent" />
                <span className="hidden md:inline">Grupo: {partyInfo.playerCount}p / Nvl {partyInfo.averageLevel}</span>
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
        {activeTools.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 animate-in fade-in zoom-in duration-700">
            <div className="p-12 rounded-full bg-white/5 border border-white/5 mb-6">
              <Plus size={80} className="animate-glow" />
            </div>
            <h2 className="text-3xl font-headline font-bold">Inicie sua Narrativa</h2>
            <p className="font-body italic text-lg text-center max-w-md">Abra a ferramenta de Preparação para carregar o seu mundo no Copiloto.</p>
          </div>
        ) : (
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
                      {activeSession && tool.id !== 'prepare' && (
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
        )}
      </main>

      <footer className="h-8 border-t border-white/5 bg-black/60 px-6 flex items-center justify-between text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Shield size={10} className="text-accent" /> CR: {partyInfo.averageLevel}</span>
          <span className="flex items-center gap-1"><Users size={10} className="text-accent" /> PARTY: {partyInfo.playerCount}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-accent">{activeSession ? 'Sessão: ' + activeSession.title : 'Aguardando Preparação'}</span>
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
