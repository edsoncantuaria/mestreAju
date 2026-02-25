'use client';

import React, { useState, useEffect } from 'react';
import {
  Scroll, Search, PenTool, Map, Zap, Sword, X, Plus,
  Activity, BookOpen, Sparkles, Users, Shield, Book,
  FolderOpen, ChevronRight, Loader2, Mail, Lock, LogOut,
  Cloud, History, Globe, ChevronDown, LayoutDashboard,
  Minus, Maximize2, GripHorizontal, MapPin
} from 'lucide-react';
import { SessionSummaryTool } from '@/components/tools/session-summary-tool';
import { ContextAnalysisTool } from '@/components/tools/context-analysis-tool';
import { NarrativeGeneratorTool } from '@/components/tools/narrative-generator-tool';
import { SandboxIdeasTool } from '@/components/tools/sandbox-ideas-tool';
import { ConsequencesTool } from '@/components/tools/consequences-tool';
import { LiveSessionTool } from '@/components/tools/live-session-tool';
import { PrepareSessionTool } from '@/components/tools/prepare-session-tool';
import { RulesLookupTool } from '@/components/tools/rules-lookup-tool';
import { WorldGrimoireTool } from '@/components/tools/world-grimoire-tool';
import { SessionHistoryTool } from '@/components/tools/session-history-tool';
import { CartographyTool } from '@/components/tools/cartography-tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  FirebaseClientProvider, useUser, useFirestore,
  useCollection, useMemoFirebase, useAuth,
  initiateEmailSignIn, initiateEmailSignUp,
  initiateAnonymousSignIn, useDoc
} from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───────────────────────────────────────────────
interface PartyMember { id: string; name: string; level: number; race: string; class: string; }
interface ToolProps { partyInfo: { members: PartyMember[] }; activeSession: any; onContextAction: (id: string, data: any) => void; setGlobalLoading: (b: boolean) => void; }

// ─────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const { toast } = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'login') {
      initiateEmailSignIn(auth, email, password);
      toast({ title: 'Conectando…' });
    } else {
      initiateEmailSignUp(auth, email, password);
      toast({ title: 'Criando conta…' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-accent/5 blur-[60px] rounded-full" />
      </div>

      <div className="w-full max-w-[360px] relative z-10 space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 ring-1 ring-white/10">
            <Sword size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-[Fira_Code] font-black text-accent tracking-tight">MestreAju</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1.5 font-[Fira_Code]">DM Screen · Sandbox Copilot</p>
          </div>
        </div>

        {/* Card */}
        <div className="panel-glass rounded-2xl p-6 space-y-5">
          {/* Tab toggle */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {(['login', 'register'] as const).map((m, i) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[11px] font-[Fira_Code] font-semibold uppercase tracking-widest transition-colors duration-150',
                  mode === m ? 'bg-primary/90 text-white shadow' : 'text-muted-foreground hover:text-white'
                )}
              >
                {i === 0 ? 'Login' : 'Cadastro'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input type="email" placeholder="email@dominio.com" value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email" spellCheck={false}
                className="pl-9 h-10 bg-black/50 border-white/6 focus-visible:border-primary/50 text-sm" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="pl-9 h-10 bg-black/50 border-white/6 focus-visible:border-primary/50 text-sm" />
            </div>
            <Button type="submit" className="w-full h-10 bg-primary hover:bg-primary/85 text-white font-[Fira_Code] font-semibold text-sm shadow-lg shadow-primary/20 transition-colors duration-150">
              {mode === 'login' ? 'Adentrar o Grimório' : 'Forjar Registro'}
              <ChevronRight size={16} className="ml-1.5" />
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" /><span className="text-[9px] uppercase text-muted-foreground font-[Fira_Code]">ou</span><div className="flex-1 h-px bg-white/5" />
          </div>

          <Button variant="ghost" onClick={() => initiateAnonymousSignIn(auth)}
            className="w-full h-8 text-muted-foreground hover:text-accent text-[10px] uppercase tracking-widest font-[Fira_Code]">
            Continuar como Convidado
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PANEL — true tiling panel with minimize traffic-light
// ─────────────────────────────────────────────────────────
interface PanelConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  tagColor: string;     // small label pill color
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  noPad?: boolean;
  grow?: number;
  startOpen?: boolean;
  onClose?: () => void;
}

function Panel({ id, label, icon: Icon, iconColor, tagColor, children, headerExtra, noPad, grow = 1, startOpen = true, onClose }: PanelConfig) {
  const [open, setOpen] = useState(startOpen);

  return (
    <div
      id={id}
      className={cn(
        'panel-glass rounded-xl flex flex-col overflow-hidden transition-[flex] duration-200 ease-out',
        !open && 'shrink-0',
        open ? 'min-h-[400px] sm:min-h-0' : 'h-[38px] sm:h-auto'
      )}
      style={open
        ? { flexGrow: grow, flexShrink: 1, flexBasis: '0px' }
        : { flexGrow: 0, flexShrink: 0, flexBasis: '38px' }
      }
    >
      {/* Header */}
      <div
        className={cn(
          'h-[38px] flex items-center gap-2 px-3 shrink-0 select-none group/header',
          open && 'border-b border-white/[0.05]'
        )}
        style={{ background: open ? 'linear-gradient(90deg, rgba(255,255,255,0.02), transparent)' : '' }}
      >
        {/* Traffic-light: amber=open → click to close | dim=closed → click to open */}
        {onClose ? (
          <button
            onClick={onClose}
            aria-label={`Fechar ${label}`}
            className="w-[9px] h-[9px] rounded-full shrink-0 transition-colors duration-150 bg-rose-500/70 hover:bg-rose-500"
          />
        ) : (
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? `Minimizar ${label}` : `Restaurar ${label}`}
            className={cn(
              'w-[9px] h-[9px] rounded-full shrink-0 transition-colors duration-150',
              open
                ? 'bg-amber-400/70 hover:bg-amber-400'
                : 'bg-white/15 hover:bg-green-400/80'
            )}
          />
        )}

        {/* Tag pill */}
        <span className={cn('w-[3px] h-[14px] rounded-full shrink-0', tagColor)} />

        <Icon size={12} className={cn('shrink-0 transition-colors', open ? iconColor : 'text-white/20')} />

        <span className={cn(
          'font-[Fira_Code] font-semibold text-[9px] uppercase tracking-[0.18em] truncate flex-1 transition-colors',
          open ? 'text-white/60' : 'text-white/20'
        )}>
          {label}
        </span>

        {open && headerExtra && (
          <div className="flex items-center gap-1 shrink-0">{headerExtra}</div>
        )}
      </div>

      {/* Body */}
      {open && (
        <div className={cn('flex-1 min-h-0 overflow-y-auto', noPad ? '' : 'p-3')}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PARTY MINI TRACKER
// ─────────────────────────────────────────────────────────
interface PartyPanelProps { members: PartyMember[]; avgLevel: number; onAdd: () => void; onUpdate: (id: string, u: Partial<PartyMember>) => void; onRemove: (id: string) => void; onClose?: () => void; }

function PartyMiniTracker({ members, avgLevel, onAdd, onUpdate, onRemove, onClose }: PartyPanelProps) {
  return (
    <Panel id="party" label={`Party · ${members.length}p · CR ${avgLevel}`} icon={Users}
      iconColor="text-amber-400" tagColor="bg-amber-400" grow={0.7}
      onClose={onClose}
      headerExtra={
        <button onClick={onAdd} aria-label="Adicionar herói"
          className="text-muted-foreground hover:text-accent transition-colors p-0.5 rounded">
          <Plus size={11} />
        </button>
      }
    >
      <div className="space-y-1">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-1.5 group">
            <Input value={m.name} onChange={e => onUpdate(m.id, { name: e.target.value })}
              className="h-6 flex-1 text-[10px] font-semibold bg-black/40 border-white/5 text-white px-2 min-w-0" />
            <Input type="number" value={m.level} onChange={e => onUpdate(m.id, { level: parseInt(e.target.value) || 1 })}
              className="h-6 w-9 text-[10px] text-center font-[Fira_Code] font-bold bg-black/40 border-white/5 text-accent px-1 shrink-0" />
            <button onClick={() => onRemove(m.id)} aria-label={`Remover ${m.name}`}
              className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive transition-opacity p-0.5 shrink-0">
              <X size={9} />
            </button>
          </div>
        ))}
        {members.length === 0 && <p className="text-[10px] text-muted-foreground/50 italic text-center py-2">Sem heróis.</p>}
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN DM SCREEN
// ─────────────────────────────────────────────────────────
function ScreenContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [party, setParty] = useState<PartyMember[]>([{ id: '1', name: 'Herói 1', level: 1, race: 'Humano', class: 'Guerreiro' }]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  // New Sidebar State for tiling layout
  const [activeTools, setActiveTools] = useState<string[]>(['live', 'grimoire', 'party', 'archive']);

  const toggleTool = (toolId: string) => {
    setActiveTools(current =>
      current.includes(toolId)
        ? current.filter(id => id !== toolId)
        : [...current, toolId]
    );
  };

  // ── Firestore ──
  const userDocRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile, isLoading: loadingProfile } = useDoc(userDocRef);

  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, `users/${user.uid}/campaigns/default-campaign/sessions`), orderBy('dateLastModified', 'desc'));
  }, [db, user]);
  const { data: sessions, isLoading: loadingSessions } = useCollection(sessionsQuery);

  const activeSessionRef = useMemoFirebase(() => {
    if (!db || !user || !activeSessionId) return null;
    return doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSessionId}`);
  }, [db, user, activeSessionId]);
  const { data: activeSession } = useDoc(activeSessionRef);

  // ── Effects ──
  useEffect(() => { if (activeSession?.partyMembers) setParty(activeSession.partyMembers); }, [activeSession?.id]);

  useEffect(() => {
    if (!isInitializing || isUserLoading) return;
    if (user && !loadingSessions && !loadingProfile && sessions !== null) {
      const savedId = userProfile?.lastActiveSessionId || localStorage.getItem('mestreaju_active_session_id');
      if (savedId && sessions.length > 0) {
        const found = sessions.find((s: any) => s.id === savedId);
        if (found) { setActiveSessionId(found.id); setIsInitializing(false); return; }
      }
      setIsInitializing(false);
      if (sessions.length === 0) { setShowNewForm(true); setIsModalOpen(true); }
      else { setIsModalOpen(true); }
    }
  }, [user, isUserLoading, loadingSessions, loadingProfile, sessions, userProfile, isInitializing]);

  // ── Handlers ──
  const selectSession = (session: any) => {
    setActiveSessionId(session.id);
    localStorage.setItem('mestreaju_active_session_id', session.id);
    if (db && user) setDoc(doc(db, 'users', user.uid), { lastActiveSessionId: session.id, id: user.uid }, { merge: true });
    setIsModalOpen(false); setShowNewForm(false);
    toast({ title: 'Mundo ativo', description: `"${session.title}"` });
  };

  const handleContextAction = async (targetToolId: string, data: any) => {
    if (!db || !user || !activeSessionId) return;

    if (targetToolId === 'expand-world') {
      try {
        setGlobalLoading(true);
        const { expandWorldLore } = await import('@/ai/flows/expand-world-lore-flow');
        const res = await expandWorldLore({
          currentLore: activeSession?.worldLore || '',
          topic: data.topic
        });

        let newLore = activeSession?.worldLore || '';
        if (newLore && !newLore.endsWith('\n\n')) newLore += '\n\n';
        newLore += res.expandedText;

        await updateDoc(doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSessionId}`), {
          worldLore: newLore,
          dateLastModified: new Date().toISOString()
        });
        toast({ title: 'Lore Expandida', description: 'O mundo evoluiu com sucesso.' });
      } catch (e) {
        console.error(e);
        toast({ title: 'Erro na Expansão', description: 'A IA falhou ao expandir o mundo.', variant: 'destructive' });
      } finally {
        setGlobalLoading(false);
      }
      return;
    }

    // Standard context communication
    await updateDoc(doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSessionId}`), {
      activeContext: { targetTool: targetToolId, data, timestamp: new Date().toISOString() },
      dateLastModified: new Date().toISOString()
    });
  };

  const handleSignOut = () => { signOut(auth); setActiveSessionId(null); localStorage.removeItem('mestreaju_active_session_id'); setIsInitializing(true); };

  const persistParty = (p: PartyMember[]) => {
    if (db && user && activeSessionId)
      updateDoc(doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSessionId}`), { partyMembers: p });
  };

  const addMember = () => { const p = [...party, { id: Date.now().toString(), name: `Herói ${party.length + 1}`, level: 1, race: 'Humano', class: 'Guerreiro' }]; setParty(p); persistParty(p); };
  const updateMember = (id: string, u: Partial<PartyMember>) => { const p = party.map(m => m.id === id ? { ...m, ...u } : m); setParty(p); persistParty(p); };
  const removeMember = (id: string) => { if (party.length > 1) { const p = party.filter(m => m.id !== id); setParty(p); persistParty(p); } };
  const avgLevel = party.length ? Math.round(party.reduce((a, m) => a + m.level, 0) / party.length) : 1;

  // ── Loading / Auth ──
  if (isUserLoading || (user && isInitializing)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="font-[Fira_Code] text-[10px] uppercase tracking-[0.25em] text-muted-foreground animate-pulse">Inicializando Grimório…</span>
      </div>
    );
  }
  if (!user) return <AuthScreen />;

  const tp: ToolProps = { partyInfo: { members: party }, activeSession, onContextAction: handleContextAction, setGlobalLoading };

  // ─────────────────────────────── RENDER ────────────────
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">

      {/* ──────── AI LOADING OVERLAY ──────── */}
      {globalLoading && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse">
            <Sparkles size={26} className="text-white" />
          </div>
          <p className="font-[Fira_Code] text-sm text-accent uppercase tracking-[0.25em] animate-pulse">Processando…</p>
        </div>
      )}

      {/* ──────── TOP BAR ──────── */}
      <header className="h-11 flex items-center justify-between px-4 shrink-0 z-50 border-b border-white/[0.045]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' }}>

        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow shadow-primary/30">
            <Sword size={13} className="text-white" />
          </div>
          <span className="font-[Fira_Code] font-black text-accent text-sm tracking-tight">MestreAju</span>
          <span className="hidden md:inline font-[Fira_Code] text-[8px] uppercase tracking-[0.25em] text-white/20 border-l border-white/10 pl-2.5">DM Screen</span>
        </div>

        {/* Center: World selector chip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 h-7 px-3 rounded-lg border border-white/6 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent/30 transition-colors duration-150 group"
              >
                <Globe size={11} className="text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="font-[Fira_Code] text-[10px] font-semibold text-white/70 group-hover:text-accent transition-colors truncate max-w-[200px]">
                  {activeSession ? activeSession.title : '— Selecionar Mundo —'}
                </span>
                <ChevronDown size={10} className="text-muted-foreground shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Trocar sessão</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Right: Status + User */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 font-[Fira_Code] text-[9px] uppercase tracking-widest text-muted-foreground/60">
            <span className="flex items-center gap-1"><Shield size={9} className="text-amber-400/70" /> CR {avgLevel}</span>
            <span className="flex items-center gap-1"><Users size={9} className="text-sky-400/70" /> {party.length}p</span>
            <span className={cn('flex items-center gap-1', activeSession ? 'text-green-500/60' : 'text-amber-500/60')}>
              <Cloud size={9} /> {user.isAnonymous ? 'Temp' : 'Synced'}
            </span>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary/80 font-[Fira_Code] font-semibold text-[11px] hover:bg-primary/25 transition-colors">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 border-white/8 bg-card shadow-2xl p-3 space-y-3 text-xs">
              <div>
                <p className="font-semibold text-foreground truncate">{user.email ?? 'Convidado'}</p>
                <p className="font-[Fira_Code] text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">{user.isAnonymous ? 'Sessão Temporária' : 'Mestre Registrado'}</p>
              </div>
              <div className="h-px bg-white/5" />
              <Button variant="ghost" size="sm" onClick={handleSignOut}
                className="w-full justify-start text-destructive hover:bg-destructive/10 text-xs font-semibold gap-2">
                <LogOut size={12} /> Encerrar Sessão
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* ──────── COCKPIT / STANDBY ──────── */}
      {!activeSession ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/6 blur-[100px] rounded-full" />
          </div>
          <div className="w-20 h-20 rounded-3xl border border-primary/20 bg-primary/8 flex items-center justify-center relative">
            <LayoutDashboard size={36} className="text-primary/50" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-2xl font-[Fira_Code] text-white/80">Cockpit em Standby</h2>
            <p className="text-sm text-muted-foreground">Abra ou crie uma Crônica para iluminar todos os paineis simultaneamente.</p>
          </div>
          <Button size="lg" onClick={() => setIsModalOpen(true)}
            className="h-10 px-8 bg-primary hover:bg-primary/85 text-white font-[Fira_Code] font-semibold text-sm shadow-xl shadow-primary/20 gap-2 transition-colors">
            <FolderOpen size={16} /> Abrir Grimório
          </Button>
        </div>
      ) : (
        /*
         * ═══════════════════════════════════════════════════════
         *  COCKPIT TILING LAYOUT
         *
         *  Left (grow 1)   │  Center (grow 1.9)  │  Right (grow 1)
         *  ─────────────────────────────────────────────────────
         *  Sessão (2)      │  Grimório (3)        │  Party (0.7)
         *  Narrativa (1)   │  Sandbox + Efeitos   │  Enciclopédia (2)
         *                  │    (side by side)    │  Resumo (1)
         *                  │                      │  Análise (0.8)
         *
         *  Each panel has a traffic-light minimize button.
         *  When a panel minimizes → siblings absorb via flex-grow.
         *  Left column hidden on screens < lg (1024px).
         * ═══════════════════════════════════════════════════════
         */
        /*
         * ═══════════════════════════════════════════════════════
         *  COCKPIT TILING LAYOUT (SIDEBAR + WORKSPACE)
         * ═══════════════════════════════════════════════════════
         */
        <TooltipProvider>
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden relative">

            {/* ── SIDEBAR TOOLBAR ── */}
            <div className="w-[60px] flex-col items-center py-4 border-r border-white/5 bg-black/20 gap-4 hidden sm:flex shrink-0 z-10">
              <div className="flex flex-col gap-2 w-full px-2">
                {[
                  { id: 'live', icon: Activity, label: 'Sessão Ativa', color: 'text-rose-400', bg: 'hover:bg-rose-500/10' },
                  { id: 'narrative', icon: PenTool, label: 'Narrativa', color: 'text-violet-400', bg: 'hover:bg-violet-500/10' },
                  { id: 'grimoire', icon: BookOpen, label: 'O Grimório', color: 'text-sky-400', bg: 'hover:bg-sky-500/10' },
                  { id: 'sandbox', icon: Map, label: 'Sandbox', color: 'text-emerald-400', bg: 'hover:bg-emerald-500/10' },
                  { id: 'consequences', icon: Zap, label: 'Efeitos', color: 'text-yellow-400', bg: 'hover:bg-yellow-500/10' },
                  { id: 'rules', icon: Book, label: 'Regras', color: 'text-cyan-400', bg: 'hover:bg-cyan-500/10' },
                  { id: 'summary', icon: Scroll, label: 'Resumo', color: 'text-blue-400', bg: 'hover:bg-blue-500/10' },
                  { id: 'analysis', icon: Search, label: 'Análise', color: 'text-amber-400', bg: 'hover:bg-amber-500/10' },
                  { id: 'archive', icon: History, label: 'Crônicas', color: 'text-orange-400', bg: 'hover:bg-orange-500/10' },
                  { id: 'cartography', icon: MapPin, label: 'Cartografia', color: 'text-lime-400', bg: 'hover:bg-lime-500/10' },
                  { id: 'party', icon: Users, label: 'Party', color: 'text-orange-400', bg: 'hover:bg-orange-500/10' }
                ].map((tool) => {
                  const isActive = activeTools.includes(tool.id);
                  return (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleTool(tool.id)}
                          className={cn(
                            'w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 relative group',
                            isActive ? 'bg-white/10 shadow-inner' : `hover:bg-white/5 ${tool.bg}`
                          )}
                        >
                          {isActive && (
                            <div className={cn("absolute left-0 w-1 h-1/2 rounded-r-full", tool.color.replace('text-', 'bg-'))} />
                          )}
                          <tool.icon size={20} className={cn(
                            'transition-colors duration-200',
                            isActive ? tool.color : 'text-muted-foreground group-hover:text-white/80'
                          )} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-[10px] font-[Fira_Code] uppercase tracking-widest flex items-center gap-2">
                        {tool.label}
                        <span className="text-muted-foreground">({isActive ? 'ON' : 'OFF'})</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* ── DYNAMIC WORKSPACE ── */}
            <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-1.5 p-1.5 overflow-y-auto sm:overflow-x-auto custom-scrollbar pb-16 sm:pb-1.5">
              {activeTools.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 space-y-3">
                  <LayoutDashboard size={40} className="opacity-20" />
                  <p className="font-[Fira_Code] text-xs uppercase tracking-widest">Nenhum painel ativo</p>
                </div>
              ) : (
                /* Map active tools dynamically.
                   We render them in the order they were opened (or predefined order, depending on activeTools array).
                   For better layout, we could split them into columns if there are many, but flex-row wrapping or direct flex-row handles tiling well.
                   Let's use a standard horizontal flex layout where each pane gets equal/proportional weight.
                */
                <>
                  {activeTools.map((toolId) => {
                    const renderTool = () => {
                      switch (toolId) {
                        case 'live': return (
                          <Panel key={toolId} id={toolId} label="Sessão Ativa" icon={Activity} iconColor="text-rose-400" tagColor="bg-rose-500" grow={2} noPad onClose={() => toggleTool(toolId)}>
                            <div className="h-full p-3 overflow-y-auto"><LiveSessionTool {...tp} /></div>
                          </Panel>
                        );
                        case 'narrative': return (
                          <Panel key={toolId} id={toolId} label="Narrativa & Ideias" icon={PenTool} iconColor="text-violet-400" tagColor="bg-violet-500" grow={1} onClose={() => toggleTool(toolId)}>
                            <NarrativeGeneratorTool {...tp} />
                          </Panel>
                        );
                        case 'grimoire': return (
                          <Panel key={toolId} id={toolId} label="O Grimório" icon={BookOpen} iconColor="text-sky-400" tagColor="bg-sky-500" grow={3} noPad onClose={() => toggleTool(toolId)}>
                            <div className="h-full overflow-y-auto"><WorldGrimoireTool {...tp} /></div>
                          </Panel>
                        );
                        case 'sandbox': return (
                          <Panel key={toolId} id={toolId} label="Sandbox" icon={Map} iconColor="text-emerald-400" tagColor="bg-emerald-500" grow={1} onClose={() => toggleTool(toolId)}>
                            <SandboxIdeasTool {...tp} />
                          </Panel>
                        );
                        case 'consequences': return (
                          <Panel key={toolId} id={toolId} label="Efeitos" icon={Zap} iconColor="text-yellow-400" tagColor="bg-yellow-500" grow={1} onClose={() => toggleTool(toolId)}>
                            <ConsequencesTool {...tp} />
                          </Panel>
                        );
                        case 'rules': return (
                          <Panel key={toolId} id={toolId} label="Enciclopédia" icon={Book} iconColor="text-cyan-400" tagColor="bg-cyan-500" grow={2} onClose={() => toggleTool(toolId)}>
                            <RulesLookupTool {...tp} />
                          </Panel>
                        );
                        case 'summary': return (
                          <Panel key={toolId} id={toolId} label="Resumo" icon={Scroll} iconColor="text-blue-400" tagColor="bg-blue-500" grow={1} onClose={() => toggleTool(toolId)}>
                            <SessionSummaryTool {...tp} />
                          </Panel>
                        );
                        case 'analysis': return (
                          <Panel key={toolId} id={toolId} label="Análise" icon={Search} iconColor="text-amber-400" tagColor="bg-amber-500" grow={0.8} onClose={() => toggleTool(toolId)}>
                            <ContextAnalysisTool {...tp} />
                          </Panel>
                        );
                        case 'party': return (
                          <PartyMiniTracker key={toolId} members={party} avgLevel={avgLevel} onAdd={addMember} onUpdate={updateMember} onRemove={removeMember} onClose={() => toggleTool(toolId)} />
                        );
                        case 'archive': return (
                          <Panel key={toolId} id={toolId} label="Crônicas Passadas" icon={History} iconColor="text-orange-400" tagColor="bg-orange-500" grow={1.5} noPad onClose={() => toggleTool(toolId)}>
                            <div className="h-full overflow-y-auto"><SessionHistoryTool {...tp} /></div>
                          </Panel>
                        );
                        case 'cartography': return (
                          <Panel key={toolId} id={toolId} label="Cartografia" icon={MapPin} iconColor="text-lime-400" tagColor="bg-lime-500" grow={2} onClose={() => toggleTool(toolId)}>
                            <CartographyTool {...tp} />
                          </Panel>
                        );
                        default: return null;
                      }
                    };
                    return renderTool();
                  })}
                </>
              )}
            </div>

            {/* ── MOBILE BOTTOM NAVIGATION ── */}
            <div className="sm:hidden fixed bottom-4 left-4 right-4 h-12 glass-card rounded-2xl flex items-center justify-around px-2 z-[60] border-white/10 shadow-2xl shadow-black/50 overflow-x-auto scrollbar-hide py-1">
              {[
                { id: 'live', icon: Activity, color: 'text-rose-400' },
                { id: 'grimoire', icon: BookOpen, color: 'text-sky-400' },
                { id: 'narrative', icon: PenTool, color: 'text-violet-400' },
                { id: 'sandbox', icon: Map, color: 'text-emerald-400' },
                { id: 'archive', icon: History, color: 'text-orange-400' },
                { id: 'cartography', icon: MapPin, color: 'text-lime-400' },
                { id: 'party', icon: Users, color: 'text-orange-400' }
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200 shrink-0",
                    activeTools.includes(tool.id) ? "bg-white/10 scale-110" : "opacity-40"
                  )}
                >
                  <tool.icon size={18} className={activeTools.includes(tool.id) ? tool.color : "text-white"} />
                </button>
              ))}
            </div>
          </div>
        </TooltipProvider>
      )}

      {/* ──────── WORLD SELECTION MODAL ──────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[640px] bg-card/95 backdrop-blur-xl border-white/8 p-0 overflow-hidden shadow-2xl">
          {/* Accent gradient top bar */}
          <div className="h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent w-full" />
          <div className="p-7">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-[Fira_Code] text-xl text-accent flex items-center gap-3">
                <Globe size={20} className="text-primary" />
                {showNewForm ? 'Gênese do Sandbox' : 'Grimório de Mundos'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm mt-1">
                {showNewForm
                  ? 'Configure a macrorregião que a IA irá renderizar para sua campanha.'
                  : 'Selecione ou manifeste uma nova Crônica.'
                }
              </DialogDescription>
            </DialogHeader>

            {showNewForm ? (
              <div className="animate-in slide-in-from-right-4 duration-200 ease-out">
                <PrepareSessionTool activeSession={null} onSessionLoad={selectSession}
                  onCancel={() => setShowNewForm(false)} setGlobalLoading={setGlobalLoading} />
              </div>
            ) : (
              <div className="space-y-5">
                {/* New world button */}
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full h-[68px] panel-glass rounded-xl px-5 flex items-center gap-4 hover:border-accent/30 transition-colors duration-150 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                    <Sparkles size={18} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-[Fira_Code] font-semibold text-sm text-white/80 group-hover:text-accent transition-colors">Manifestar Novo Mundo</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Geração via IA · Salvo no Firebase</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground ml-auto group-hover:text-accent transition-colors" />
                </button>

                {/* Sessions list */}
                <div className="space-y-2">
                  <p className="font-[Fira_Code] text-[9px] uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <History size={10} /> Crônicas Registradas
                  </p>
                  <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1">
                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                        <Loader2 className="animate-spin text-primary" size={18} />
                        <span className="text-xs font-[Fira_Code]">Conectando…</span>
                      </div>
                    ) : sessions && sessions.length > 0 ? (
                      sessions.map((s: any) => (
                        <button key={s.id} onClick={() => selectSession(s)}
                          className="w-full p-3.5 rounded-xl panel-glass hover:border-accent/25 transition-colors duration-150 text-left flex items-center gap-3.5 group cursor-pointer">
                          <div className="w-9 h-9 rounded-lg bg-accent/8 border border-accent/15 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                            <Globe size={16} className="text-accent/60 group-hover:text-accent transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-[Fira_Code] font-semibold text-sm text-white/80 group-hover:text-accent transition-colors truncate">{s.title}</p>
                            <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                              {s.dateLastModified ? new Date(s.dateLastModified).toLocaleDateString('pt-BR') : '—'}
                            </p>
                          </div>
                          <ChevronRight size={13} className="text-muted-foreground/40 group-hover:text-accent shrink-0 transition-colors" />
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-xs text-muted-foreground/40 italic py-10">Nenhuma crônica criada ainda.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────
export default function ScreenDungeonMaster() {
  return (
    <FirebaseClientProvider>
      <ScreenContent />
    </FirebaseClientProvider>
  );
}
