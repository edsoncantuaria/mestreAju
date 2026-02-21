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
  Loader2,
  LogIn,
  Mail,
  Lock,
  LogOut,
  UserPlus,
  UserCircle,
  Trash2,
  User
} from 'lucide-react';
import { SessionSummaryTool } from '@/components/tools/session-summary-tool';
import { ContextAnalysisTool } from '@/components/tools/context-analysis-tool';
import { NarrativeGeneratorTool } from '@/components/tools/narrative-generator-tool';
import { SandboxIdeasTool } from '@/components/tools/sandbox-ideas-tool';
import { ConsequencesTool } from '@/components/tools/consequences-tool';
import { LiveSessionTool } from '@/components/tools/live-session-tool';
import { PrepareSessionTool } from '@/components/tools/prepare-session-tool';
import { RulesLookupTool } from '@/components/tools/rules-lookup-tool';
import { NpcFactionManagerTool } from '@/components/tools/npc-faction-manager-tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FirebaseClientProvider, useUser, useFirestore, useCollection, useMemoFirebase, useAuth, initiateEmailSignIn, initiateEmailSignUp, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

type ToolId = 'live' | 'summary' | 'analysis' | 'narrative' | 'sandbox' | 'consequences' | 'rules' | 'entities';

interface PartyMember {
  id: string;
  name: string;
  level: number;
  race: string;
  class: string;
}

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isLogin) {
      initiateEmailSignIn(auth, email, password);
      toast({ title: "Iniciando Sessão...", description: "Conectando ao seu Grimório Cloud." });
    } else {
      initiateEmailSignUp(auth, email, password);
      toast({ title: "Criando Conta...", description: "Preparando seu espaço de mestre." });
    }
  };

  const handleGuest = () => {
    initiateAnonymousSignIn(auth);
    toast({ title: "Entrando como Convidado", description: "Cuidado: dados de convidados podem ser perdidos ao limpar o cache." });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(139,0,0,0.1),transparent_50%)]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 ring-4 ring-white/5">
            <Sword size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-headline font-bold text-accent tracking-tight">MestreAju</h1>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mt-2">Copiloto Supremo de Sandbox</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all", isLogin ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white")}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all", !isLogin ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white")}
            >
              Cadastro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">E-mail do Mestre</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={16} />
                <Input 
                  type="email" 
                  placeholder="exemplo@mestre.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-black/40 border-white/5 focus:border-primary/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Senha Mágica</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={16} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-black/40 border-white/5 focus:border-primary/50"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-headline text-lg group">
              {isLogin ? 'Entrar no Grimório' : 'Criar Novo Registro'}
              <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-muted-foreground"><span className="bg-card px-2">Ou</span></div>
          </div>

          <Button variant="ghost" onClick={handleGuest} className="w-full h-10 text-muted-foreground hover:text-accent font-bold text-[10px] uppercase tracking-widest">
            Entrar como Convidado
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 italic">
          "Suas crônicas são salvas e sincronizadas via Firebase Cloud."
        </p>
      </div>
    </div>
  );
}

function ScreenDungeonMasterContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTools, setActiveTools] = useState<ToolId[]>(['live', 'entities']);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([
    { id: '1', name: 'Herói 1', level: 1, race: 'Humano', class: 'Guerreiro' }
  ]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);

  // Memoized query to fetch sessions from Firestore
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
      color: 'text-rose-500',
      component: (props: any) => <LiveSessionTool {...props} activeSession={activeSession} />
    },
    { 
      id: 'entities', 
      label: 'Grimório', 
      icon: Users, 
      color: 'text-sky-400',
      component: (props: any) => <NpcFactionManagerTool {...props} activeSession={activeSession} />
    },
    { 
      id: 'rules', 
      label: 'Enciclopédia', 
      icon: Book, 
      color: 'text-cyan-400',
      component: (props: any) => <RulesLookupTool {...props} />
    },
    { 
      id: 'summary', 
      label: 'Resumo', 
      icon: Scroll, 
      color: 'text-blue-400',
      component: (props: any) => <SessionSummaryTool {...props} activeSession={activeSession} />
    },
    { 
      id: 'analysis', 
      label: 'Análise', 
      icon: Search, 
      color: 'text-amber-400',
      component: (props: any) => <ContextAnalysisTool {...props} activeSession={activeSession} />
    },
    { 
      id: 'narrative', 
      label: 'Escrita', 
      icon: PenTool, 
      color: 'text-purple-400',
      component: (props: any) => <NarrativeGeneratorTool {...props} activeSession={activeSession} />
    },
    { 
      id: 'sandbox', 
      label: 'Sandbox', 
      icon: Map, 
      color: 'text-green-400',
      component: (props: any) => <SandboxIdeasTool {...props} activeSession={activeSession} />
    },
    { 
      id: 'consequences', 
      label: 'Efeitos', 
      icon: Zap, 
      color: 'text-red-400',
      component: (props: any) => <ConsequencesTool {...props} activeSession={activeSession} />
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
    toast({ title: "Mundo Carregado", description: `A crônica "${session.title}" está ativa.` });
  };

  const handleToolAction = (targetToolId: ToolId, data: any) => {
    if (!activeTools.includes(targetToolId)) {
      setActiveTools(prev => [...prev, targetToolId]);
    }
    setSharedContext(prev => ({ ...prev, ...data }));
  };

  const handleSignOut = () => {
    signOut(auth);
    setActiveSession(null);
    toast({ title: "Sessão Encerrada", description: "Até a próxima aventura!" });
  };

  const addPartyMember = () => {
    const newMember: PartyMember = {
      id: Date.now().toString(),
      name: `Herói ${partyMembers.length + 1}`,
      level: 1,
      race: 'Humano',
      class: 'Guerreiro'
    };
    setPartyMembers([...partyMembers, newMember]);
  };

  const updateMember = (id: string, updates: Partial<PartyMember>) => {
    setPartyMembers(partyMembers.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMember = (id: string) => {
    if (partyMembers.length > 1) {
      setPartyMembers(partyMembers.filter(m => m.id !== id));
    }
  };

  useEffect(() => {
    if (user && !activeSession && !loadingSessions && (!sessions || sessions.length === 0)) {
      setIsModalOpen(true);
      setShowNewSessionForm(true);
    } else if (user && !activeSession && !loadingSessions) {
      setIsModalOpen(true);
    }
  }, [user, activeSession, loadingSessions, sessions]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="font-headline text-accent animate-pulse tracking-widest uppercase text-xs">Despertando o Grimório Cloud...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const avgLevel = Math.round(partyMembers.reduce((acc, m) => acc + m.level, 0) / partyMembers.length);

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
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Copiloto de Sandbox</p>
            </div>
          </div>

          <div className="h-10 px-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3 cursor-pointer hover:bg-black/60 transition-all group" onClick={() => setIsModalOpen(true)}>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Mundo Ativo</span>
              <span className="text-xs font-bold text-accent group-hover:text-white transition-colors truncate max-w-[200px]">
                {activeSession ? activeSession.title : 'Escolher Sessão...'}
              </span>
            </div>
            <FolderOpen size={14} className="text-accent/50 group-hover:text-accent transition-colors" />
          </div>
        </div>

        <nav className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-[40%] no-scrollbar">
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
              <Button variant="outline" size="sm" className="rounded-full border-white/10 gap-2 text-[10px] font-bold h-9 bg-black/20">
                <Users size={14} className="text-accent" />
                <span className="hidden md:inline">{partyMembers.length} Heróis / Nvl {avgLevel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-white/10 shadow-2xl p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h4 className="font-headline font-bold text-sm text-accent">Orçamento do Grupo</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-accent" onClick={addPartyMember}>
                  <Plus size={14} />
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {partyMembers.map((member) => (
                  <div key={member.id} className="flex gap-2 items-start p-2 rounded-lg bg-black/20 border border-white/5 group">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Nome"
                          value={member.name}
                          onChange={(e) => updateMember(member.id, { name: e.target.value })}
                          className="h-7 text-[10px] bg-black/40 border-white/10"
                        />
                        <Input 
                          type="number"
                          placeholder="Nvl"
                          value={member.level}
                          onChange={(e) => updateMember(member.id, { level: parseInt(e.target.value) || 1 })}
                          className="h-7 w-12 text-[10px] bg-black/40 border-white/10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Raça (ex: Changeling)"
                          value={member.race}
                          onChange={(e) => updateMember(member.id, { race: e.target.value })}
                          className="h-7 text-[10px] bg-black/40 border-white/10"
                        />
                        <Input 
                          placeholder="Classe"
                          value={member.class}
                          onChange={(e) => updateMember(member.id, { class: e.target.value })}
                          className="h-7 text-[10px] bg-black/40 border-white/10"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-accent/5 text-[9px] text-accent/70 font-bold border-t border-white/5 uppercase tracking-tighter text-center">
                O cálculo de dificuldade será ajustado automaticamente
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-xs">
                    {user.email?.[0].toUpperCase() || '?'}
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-card border-white/10 shadow-2xl" align="end">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground truncate">{user.email}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {user.isAnonymous ? 'Convidado' : 'Mestre Registrado'}
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold"
                >
                  <LogOut size={14} className="mr-2" /> Encerrar Sessão
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {!activeSession ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto">
             <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
               <BookOpen size={40} />
             </div>
             <div className="space-y-2">
               <h2 className="text-3xl font-headline text-accent">O Grimório está Vazio</h2>
               <p className="text-muted-foreground italic">Prepare uma nova sessão ou carregue uma crônica existente para despertar o Copiloto.</p>
             </div>
             <Button size="lg" onClick={() => setIsModalOpen(true)} className="bg-primary font-headline px-8">
               Despertar Copiloto
             </Button>
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
                      {activeSession && tool.id !== 'rules' && (
                        <div className="flex items-center gap-1">
                          <LinkIcon size={10} className="text-green-500" />
                          <span className="text-[8px] font-bold text-green-500 uppercase">Sincronizado</span>
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
                      partyInfo={{ members: partyMembers }} 
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

      {/* Persistence Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-white/10 p-0 overflow-hidden shadow-2xl">
          <div className="h-1.5 bg-primary w-full" />
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-headline text-2xl text-accent flex items-center gap-3">
                <BookOpen className="text-primary" />
                {showNewSessionForm ? 'Nova Preparação Sandbox' : 'Carregar Crônica'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground italic">
                {showNewSessionForm ? 'Defina o mapa e o lore inicial para o seu mundo aberto.' : 'Suas sessões são salvas e sincronizadas automaticamente no Firebase.'}
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
                  className="w-full h-16 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-accent font-headline gap-4 justify-start px-6 rounded-2xl group"
                >
                  <div className="p-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-base font-bold">Criar Novo Ambiente</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Inicie um novo arco de Sandbox</span>
                  </div>
                </Button>

                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Seus Mundos Sincronizados</h4>
                  
                  <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {loadingSessions ? (
                      <div className="py-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-[10px] font-bold">Acessando Firestore...</span>
                      </div>
                    ) : sessions && sessions.length > 0 ? (
                      sessions.map((session: any) => (
                        <button
                          key={session.id}
                          onClick={() => handleSelectSession(session)}
                          className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent/40 hover:bg-white/10 transition-all text-left flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                              <Scroll size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{session.title}</span>
                              <span className="text-[10px] text-muted-foreground italic line-clamp-1 opacity-70">
                                Sincronizado em {session.dateLastModified ? new Date(session.dateLastModified).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                        </button>
                      ))
                    ) : (
                      <div className="py-12 text-center text-muted-foreground italic text-xs border border-dashed border-white/5 rounded-xl">
                        Nenhum mundo salvo na nuvem. Clique em criar acima!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <footer className="h-8 border-t border-white/5 bg-black/60 px-6 flex items-center justify-between text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Shield size={10} className="text-accent" /> CR: {avgLevel}</span>
          <span className="flex items-center gap-1"><Users size={10} className="text-accent" /> PARTY: {partyMembers.length}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-accent font-bold">
            {activeSession ? 'Sessão Ativa: ' + activeSession.title : 'Sistema em Standby'}
          </span>
          <span className="opacity-30">|</span>
          <span className="flex items-center gap-1 text-green-500">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> CLOUD SYNC: {user.isAnonymous ? 'TEMPORÁRIO' : 'SEGURO'} ({user.uid.substring(0,6)})
          </span>
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
