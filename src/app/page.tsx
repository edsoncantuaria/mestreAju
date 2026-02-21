
'use client';

import React, { useState } from 'react';
import { 
  Scroll, 
  Search, 
  PenTool, 
  Map, 
  Zap, 
  LayoutDashboard,
  Sword,
  BookOpen,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { SessionSummaryTool } from '@/components/tools/session-summary-tool';
import { ContextAnalysisTool } from '@/components/tools/context-analysis-tool';
import { NarrativeGeneratorTool } from '@/components/tools/narrative-generator-tool';
import { SandboxIdeasTool } from '@/components/tools/sandbox-ideas-tool';
import { ConsequencesTool } from '@/components/tools/consequences-tool';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type View = 'dashboard' | 'summary' | 'analysis' | 'narrative' | 'sandbox' | 'consequences';

export default function MestreAjuApp() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'summary', label: 'Resumo da Sessão', icon: Scroll },
    { id: 'analysis', label: 'Análise de Contexto', icon: Search },
    { id: 'narrative', label: 'Gerador Narrativo', icon: PenTool },
    { id: 'sandbox', label: 'Ideias Sandbox', icon: Map },
    { id: 'consequences', label: 'Consequências', icon: Zap },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-card border-r border-primary/20 transition-all duration-300 z-50 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-primary/20 bg-primary/10">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-background font-bold shrink-0">
            <Sword size={18} />
          </div>
          {isSidebarOpen && <span className="font-headline font-bold text-xl tracking-tight text-accent">MestreAju</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-headline",
                currentView === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              )}
            >
              <item.icon size={22} className={cn(currentView === item.id ? "text-accent" : "")} />
              {isSidebarOpen && <span>{item.label}</span>}
              {isSidebarOpen && currentView === item.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-primary/20">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-accent"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span className="ml-3">Recolher</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(circle_at_top_right,rgba(63,81,181,0.1),transparent_50%)]">
        <div className="container max-w-6xl mx-auto py-8 px-6">
          {currentView === 'dashboard' && <DashboardHome setView={setCurrentView} />}
          {currentView === 'summary' && <SessionSummaryTool />}
          {currentView === 'analysis' && <ContextAnalysisTool />}
          {currentView === 'narrative' && <NarrativeGeneratorTool />}
          {currentView === 'sandbox' && <SandboxIdeasTool />}
          {currentView === 'consequences' && <ConsequencesTool />}
        </div>
      </main>
    </div>
  );
}

function DashboardHome({ setView }: { setView: (view: View) => void }) {
  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest">
          <BookOpen size={14} />
          <span>Copiloto Supremo para D&amp;D 5e</span>
        </div>
        <h1 className="text-6xl font-headline font-bold leading-tight">
          Bem-vindo, <span className="text-accent underline decoration-primary underline-offset-8">Mestre</span>.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-body italic leading-relaxed">
          "As lendas não são escritas com tinta, mas com as escolhas que ecoam através dos séculos."
          — Suas ferramentas de auxílio sandbox estão prontas.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'summary', title: 'Resumo da Sessão', icon: Scroll, desc: 'Identifique facções e conflitos ativos das sessões passadas.', color: 'border-primary/30' },
          { id: 'analysis', title: 'Análise de Contexto', icon: Search, desc: 'Insights estratégicos para situações complexas na mesa.', color: 'border-accent/30' },
          { id: 'narrative', title: 'Gerador Narrativo', icon: PenTool, desc: 'Cartas e rumores prontos para leitura em mesa.', color: 'border-primary/30' },
          { id: 'sandbox', title: 'Ideias Sandbox', icon: Map, desc: 'Caminhos abertos e agendas ocultas de poder.', color: 'border-accent/30' },
          { id: 'consequences', title: 'Consequências', icon: Zap, desc: 'Impactos sociopolíticos das ações dos heróis.', color: 'border-primary/30' },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setView(tool.id as View)}
            className={cn(
              "group relative overflow-hidden p-6 text-left bg-card/40 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-card/80 hover:border-accent shadow-xl",
              tool.color
            )}
          >
            <div className="p-3 rounded-xl bg-primary/10 text-accent group-hover:bg-accent group-hover:text-background transition-colors w-fit mb-4">
              <tool.icon size={28} />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-2">{tool.title}</h3>
            <p className="text-muted-foreground text-sm font-body">{tool.desc}</p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <tool.icon size={120} />
            </div>
          </button>
        ))}
      </div>

      <section className="p-8 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/30">
        <h2 className="text-3xl font-headline font-bold mb-6 text-accent">Dica do Copiloto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-muted-foreground font-body">
          <div className="space-y-2">
            <h4 className="font-bold text-foreground">Política &amp; Intriga</h4>
            <p className="text-sm">Ao planejar encontros políticos, sempre pergunte: "Quem ganha?" e "Quem manipula?". Nossas ferramentas de Sandbox ajudam a mapear essas agendas.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground">Consequências Naturais</h4>
            <p className="text-sm">Evite punições arbitrárias. Use o Gerenciador de Consequências para entender como a economia ou a sociedade local reagem organicamente às ações do grupo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
