'use client';

import React, { useState } from 'react';
import { 
  Scroll, 
  Search, 
  PenTool, 
  Map, 
  Zap, 
  Sword,
  Maximize2,
  X,
  Plus,
  Layout,
  Users,
  Shield,
  Activity
} from 'lucide-react';
import { SessionSummaryTool } from '@/components/tools/session-summary-tool';
import { ContextAnalysisTool } from '@/components/tools/context-analysis-tool';
import { NarrativeGeneratorTool } from '@/components/tools/narrative-generator-tool';
import { SandboxIdeasTool } from '@/components/tools/sandbox-ideas-tool';
import { ConsequencesTool } from '@/components/tools/consequences-tool';
import { LiveSessionTool } from '@/components/tools/live-session-tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ToolId = 'live' | 'summary' | 'analysis' | 'narrative' | 'sandbox' | 'consequences';

export default function ScreenDungeonMaster() {
  const [activeTools, setActiveTools] = useState<ToolId[]>(['live', 'sandbox']);
  const [partyInfo, setPartyInfo] = useState({ playerCount: 4, averageLevel: 1 });
  
  const tools = [
    { id: 'live', label: 'Ativo', icon: Activity, component: <LiveSessionTool partyInfo={partyInfo} />, color: 'text-rose-500' },
    { id: 'summary', label: 'Resumo', icon: Scroll, component: <SessionSummaryTool />, color: 'text-blue-400' },
    { id: 'analysis', label: 'Análise', icon: Search, component: <ContextAnalysisTool />, color: 'text-amber-400' },
    { id: 'narrative', label: 'Escrita', icon: PenTool, component: <NarrativeGeneratorTool />, color: 'text-purple-400' },
    { id: 'sandbox', label: 'Sandbox', icon: Map, component: <SandboxIdeasTool />, color: 'text-green-400' },
    { id: 'consequences', label: 'Efeitos', icon: Zap, component: <ConsequencesTool />, color: 'text-red-400' },
  ] as const;

  const toggleTool = (id: ToolId) => {
    setActiveTools(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
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
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Screen DM - Sessão Ativa</p>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
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
                        "h-10 px-3 md:px-4 rounded-lg transition-all flex items-center gap-2 font-headline",
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
                <p className="text-[8px] italic text-muted-foreground">A IA usará esses dados para equilibrar desafios e recompensas automaticamente.</p>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" className="rounded-full border-white/10 h-9 w-9">
            <Layout size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activeTools.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 animate-in fade-in zoom-in duration-700">
            <div className="p-12 rounded-full bg-white/5 border border-white/5 mb-6">
              <Plus size={80} className="animate-glow" />
            </div>
            <h2 className="text-3xl font-headline font-bold">Inicie sua Narrativa</h2>
            <p className="font-body italic text-lg">Selecione as ferramentas acima para compor sua tela de mestre.</p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6 transition-all duration-500 items-start",
            activeTools.length === 1 ? "grid-cols-1 max-w-3xl mx-auto" : 
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
                  <div className="p-6 overflow-y-auto custom-scrollbar bg-card/40 flex-1">
                    {tool.id === 'live' ? <LiveSessionTool partyInfo={partyInfo} /> : tool.component}
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
          <span className="text-accent">Copiloto de Sessão Ativa</span>
        </div>
      </footer>
    </div>
  );
}
