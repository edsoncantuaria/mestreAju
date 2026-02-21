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
  Minimize2,
  X,
  Plus,
  Layout
} from 'lucide-react';
import { SessionSummaryTool } from '@/components/tools/session-summary-tool';
import { ContextAnalysisTool } from '@/components/tools/context-analysis-tool';
import { NarrativeGeneratorTool } from '@/components/tools/narrative-generator-tool';
import { SandboxIdeasTool } from '@/components/tools/sandbox-ideas-tool';
import { ConsequencesTool } from '@/components/tools/consequences-tool';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ToolId = 'summary' | 'analysis' | 'narrative' | 'sandbox' | 'consequences';

interface ToolConfig {
  id: ToolId;
  label: string;
  icon: any;
  component: React.ReactNode;
  color: string;
}

export default function ScreenDungeonMaster() {
  const [activeTools, setActiveTools] = useState<ToolId[]>(['summary', 'sandbox']);
  
  const tools: ToolConfig[] = [
    { id: 'summary', label: 'Resumo', icon: Scroll, component: <SessionSummaryTool />, color: 'text-blue-400' },
    { id: 'analysis', label: 'Análise', icon: Search, component: <ContextAnalysisTool />, color: 'text-amber-400' },
    { id: 'narrative', label: 'Narrativa', icon: PenTool, component: <NarrativeGeneratorTool />, color: 'text-purple-400' },
    { id: 'sandbox', label: 'Sandbox', icon: Map, component: <SandboxIdeasTool />, color: 'text-green-400' },
    { id: 'consequences', label: 'Efeitos', icon: Zap, component: <ConsequencesTool />, color: 'text-red-400' },
  ];

  const toggleTool = (id: ToolId) => {
    setActiveTools(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      {/* Top Controller Bar */}
      <header className="h-16 border-b border-white/5 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-[100] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sword size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-xl tracking-tight leading-none text-accent">MestreAju</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Screen Dungeon Master</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
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
                        "h-10 px-4 rounded-lg transition-all flex items-center gap-2 font-headline",
                        isActive ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <tool.icon size={18} className={isActive ? "text-accent" : ""} />
                      <span className="hidden md:inline">{tool.label}</span>
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

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-bold text-accent">Sessão Ativa</span>
            <span className="text-[10px] text-muted-foreground">Crônicas de Eldoria</span>
          </div>
          <Button variant="outline" size="icon" className="rounded-full border-white/10">
            <Layout size={18} />
          </Button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTools.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 animate-in fade-in zoom-in duration-700">
            <div className="p-12 rounded-full bg-white/5 border border-white/5 mb-6">
              <Plus size={80} className="animate-glow" />
            </div>
            <h2 className="text-3xl font-headline font-bold">Workspace Vazio</h2>
            <p className="font-body italic text-lg">"O destino espera ser traçado. Ative as ferramentas acima."</p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6 transition-all duration-500 items-start",
            activeTools.length === 1 ? "grid-cols-1 max-w-4xl mx-auto" : 
            activeTools.length === 2 ? "grid-cols-1 lg:grid-cols-2" : 
            "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          )}>
            {tools.filter(t => activeTools.includes(t.id)).map((tool) => (
              <div 
                key={tool.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="glass-card rounded-2xl overflow-hidden border border-white/10 group">
                  <div className="h-12 flex items-center justify-between px-5 bg-black/40 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <tool.icon size={16} className={tool.color} />
                      <span className="font-headline font-bold text-sm tracking-wide uppercase text-accent/80">{tool.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                        <Maximize2 size={14} />
                      </Button>
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
                  <div className="p-0 overflow-hidden">
                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-6 bg-card/40">
                      {tool.component}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="h-8 border-t border-white/5 bg-black/60 px-6 flex items-center justify-between text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
        <span>Pronto para narrar</span>
        <div className="flex gap-4">
          <span>Memória: 84% livre</span>
          <span className="text-accent">Copiloto Ativo</span>
        </div>
      </footer>
    </div>
  );
}