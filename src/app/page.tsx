'use client';

import React, { useState, useEffect } from 'react';
import {
  Scroll, Search, PenTool, Map, Zap, Sword, X, Plus,
  Activity, BookOpen, Sparkles, Users, Shield, Book,
  FolderOpen, ChevronRight, Loader2, Mail, Lock, LogOut,
  Cloud, History, Globe, ChevronDown, LayoutDashboard,
  Minus, Maximize2, GripHorizontal, MapPin, ChevronUp
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
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onMove?: (x: number, y: number) => void;
  onResize?: (w: number, h: number) => void;
  onFocus?: () => void;
  zIndex?: number;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

const DEFAULT_WINDOW_SIZE = { width: 450, height: 500 };

function Window({
  id, label, icon: Icon, iconColor, tagColor, children, headerExtra, noPad,
  x = 100, y = 100, width = 450, height = 500, zIndex = 10,
  onClose, onMove, onResize, onFocus, minimized, onToggleMinimize
}: PanelConfig) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const isResizer = target.closest('.resize-handle');
    const isHeader = target.closest('.window-header');

    if (isResizer) {
      setIsResizing(true);
      setResizeStart({ x: e.clientX, y: e.clientY, w: width, h: height });
      target.setPointerCapture(e.pointerId);
      e.stopPropagation();
      onFocus?.();
    } else if (isHeader) {
      setIsDragging(true);
      setDragOffset({ x: e.clientX - x, y: e.clientY - y });
      target.setPointerCapture(e.pointerId);
      e.stopPropagation();
      onFocus?.();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      onMove?.(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    } else if (isResizing) {
      const dw = e.clientX - resizeStart.x;
      const dh = e.clientY - resizeStart.y;
      onResize?.(Math.max(300, resizeStart.w + dw), Math.max(200, resizeStart.h + dh));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging || isResizing) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setIsDragging(false);
      setIsResizing(false);
    }
  };

  return (
    <div
      id={id}
      onPointerDown={e => !isDragging && onFocus?.()}
      className={cn(
        'panel-glass rounded-xl flex flex-col overflow-hidden absolute transition-all duration-300 select-none shadow-2xl',
        isDragging && 'opacity-90 shadow-primary/20 scale-[1.01]',
        minimized ? 'opacity-0 scale-95 pointer-events-none translate-y-20' : 'opacity-100 scale-100',
        !isDragging && !isResizing && 'ease-out'
      )}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
        boxShadow: zIndex > 20 ? '0 25px 80px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.4)' : '0 15px 40px -8px rgba(0, 0, 0, 0.6)',
        border: zIndex > 20 ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(30px) saturate(180%)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
      }}
    >
      {/* Window Header / Draggable Area */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={cn(
          'h-[38px] flex items-center gap-2 px-3 shrink-0 cursor-move window-header group/header border-b border-white/[0.05]',
          isDragging ? 'bg-white/[0.05]' : 'bg-white/[0.02]'
        )}
      >
        <div className="flex items-center gap-1.5 mr-2">
          <button
            onClick={e => { e.stopPropagation(); onClose?.(); }}
            className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors border border-rose-900/40 flex items-center justify-center group/btn"
          >
            <X size={6} className="text-rose-900 opacity-0 group-hover/btn:opacity-100" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onToggleMinimize?.(); }}
            className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors border border-amber-900/40 flex items-center justify-center group/btn"
          >
            <Minus size={6} className="text-amber-900 opacity-0 group-hover/btn:opacity-100" />
          </button>
          <button
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors border border-emerald-900/40 flex items-center justify-center group/btn"
          >
            <ChevronUp size={6} className="text-emerald-900 opacity-0 group-hover/btn:opacity-100" />
          </button>
        </div>

        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
          <Icon size={12} className={cn("transition-colors", isDragging ? 'text-primary' : iconColor)} />
        </div>
        <span className="font-[Fira_Code] text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] flex-1">
          {label}
        </span>
        {headerExtra && <div className="flex items-center gap-1 shrink-0">{headerExtra}</div>}
      </div>

      {/* Body */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar', noPad ? '' : 'p-3')}>
        {children}
      </div>

      {/* Resize Handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize flex items-center justify-center group/resize resize-handle z-50"
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-white/20 group-hover/resize:border-primary transition-colors" />
      </div>
    </div>
  );
}

function Panel(props: PanelConfig) {
  // Legacy support for non-OS views if needed, for now just render as a stationary window or tiling
  return <div className="panel-glass rounded-xl p-3 h-full overflow-y-auto">{props.children}</div>;
}

// ─────────────────────────────────────────────────────────
// PARTY MINI TRACKER (Updated for Window system)
// ─────────────────────────────────────────────────────────
interface PartyPanelProps {
  members: PartyMember[];
  avgLevel: number;
  onAdd: () => void;
  onUpdate: (id: string, u: Partial<PartyMember>) => void;
  onRemove: (id: string) => void;
  windowProps?: any;
}

function PartyMiniTracker({ members, avgLevel, onAdd, onUpdate, onRemove, windowProps }: PartyPanelProps) {
  return (
    <Window
      id="party"
      label={`Party · ${members.length}p · CR ${avgLevel}`}
      icon={Users}
      iconColor="text-amber-400"
      tagColor="bg-amber-400"
      headerExtra={<button onClick={onAdd} className="text-muted-foreground hover:text-accent p-0.5"><Plus size={11} /></button>}
      {...windowProps}
    >
      <div className="space-y-1">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-1.5 group">
            <Input value={m.name} onChange={e => onUpdate(m.id, { name: e.target.value })}
              className="h-6 flex-1 text-[10px] font-semibold bg-black/40 border-white/5 text-white px-2 min-w-0" />
            <Input type="number" value={m.level} onChange={e => onUpdate(m.id, { level: parseInt(e.target.value) || 1 })}
              className="h-6 w-9 text-[10px] text-center font-[Fira_Code] font-bold bg-black/40 border-white/5 text-accent px-1 shrink-0" />
            <button onClick={() => onRemove(m.id)} className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive p-0.5"><X size={9} /></button>
          </div>
        ))}
      </div>
    </Window>
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

  // Window System State
  const [windowPositions, setWindowPositions] = useState<Record<string, WindowPosition>>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mestreaju_windows');
      if (saved) return JSON.parse(saved);
    }
    return {
      'live': { x: 80, y: 20, width: 450, height: 600, zIndex: 10, isMinimized: false, isMaximized: false },
      'grimoire': { x: 550, y: 20, width: 800, height: 700, zIndex: 10, isMinimized: false, isMaximized: false },
      'party': { x: 80, y: 640, width: 450, height: 200, zIndex: 10, isMinimized: false, isMaximized: false },
    };
  });

  const [activeTools, setActiveTools] = useState<string[]>(['grimoire', 'party', 'archive']);
  const [maxZ, setMaxZ] = useState(30);

  const toggleTool = (toolId: string) => {
    setActiveTools(current => {
      const isOpening = !current.includes(toolId);
      if (isOpening) {
        // Initialize position if not exists
        if (!windowPositions[toolId]) {
          const nextZ = maxZ + 1;
          setMaxZ(nextZ);
          setWindowPositions(prev => ({
            ...prev,
            [toolId]: {
              x: 100 + (current.length * 30),
              y: 100 + (current.length * 30),
              width: DEFAULT_WINDOW_SIZE.width,
              height: DEFAULT_WINDOW_SIZE.height,
              zIndex: nextZ,
              isMinimized: false,
              isMaximized: false
            }
          }));
        } else if (windowPositions[toolId].isMinimized) {
          // Bring to front and restore
          const nextZ = maxZ + 1;
          setMaxZ(nextZ);
          setWindowPositions(prev => ({
            ...prev,
            [toolId]: { ...prev[toolId], isMinimized: false, zIndex: nextZ }
          }));
          return current;
        }
        return [...current, toolId];
      } else {
        return current.filter(id => id !== toolId);
      }
    });
  };

  const updateWindow = (id: string, updates: Partial<WindowPosition>) => {
    setWindowPositions(prev => {
      const ns = { ...prev, [id]: { ...prev[id], ...updates } };
      localStorage.setItem('mestreaju_windows', JSON.stringify(ns));
      return ns;
    });
  };

  const focusWindow = (id: string) => {
    if (windowPositions[id]?.zIndex === maxZ) return;
    const nextZ = maxZ + 1;
    setMaxZ(nextZ);
    updateWindow(id, { zIndex: nextZ });
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

        {/* Center: Contextual Info & Selector */}
        <div className="flex items-center gap-4">
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

          {activeSession && (
            <div className="flex items-center gap-3 border-l border-white/10 pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-accent uppercase tracking-widest leading-none">Sessão {activeSession.currentPlaySession?.number || activeSession.playSessions?.length + 1 || 1}</span>
                <span className="text-[10px] text-white/50 font-medium leading-tight mt-0.5">{activeSession.currentPlaySession?.inGameDate || 'Dia 1'}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
          )}
        </div>

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
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">

            {/* ── LEFT FIXED COMMAND CENTER (LIVE SESSION) ── */}
            <div className="w-[420px] border-r border-white-[0.03] bg-[#050505]/80 backdrop-blur-2xl z-[40] relative flex flex-col shrink-0 hidden lg:flex shadow-[20px_0_50px_-20px_rgba(0,0,0,0.5)]">
              <div className="h-full flex flex-col w-full px-5 py-4 overflow-hidden">
                <div className="flex items-center gap-3 mb-5 px-1">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner">
                    <Activity size={14} className="text-rose-500 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-[Fira_Code] text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] leading-tight">Painel de Comando</span>
                    <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest font-bold">Sessão Ativa</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-rose-500/20 to-transparent flex-1 ml-4" />
                </div>
                <div className="flex-1 min-h-0">
                  <LiveSessionTool {...tp} />
                </div>
              </div>
            </div>

            {/* ── MAIN WORKSPACE AREA ── */}
            <div
              className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: 'url("file:///home/edsoncantuaria/.gemini/antigravity/brain/1553a81b-a170-4091-9cd7-fea1907c66e8/mestreaju_desktop_bg_1772105146963.png")',
                backgroundColor: '#050505'
              }}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

              {/* ── OS DESKTOP ── */}
              <div className="flex-1 min-h-0 relative overflow-hidden">
                {activeTools.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 space-y-3">
                    <LayoutDashboard size={48} className="opacity-10" />
                    <p className="font-[Fira_Code] text-[10px] uppercase tracking-[0.3em]">Ambiente de Trabalho Vazio</p>
                  </div>
                )}

                {activeTools.map((toolId) => {
                  const pos = windowPositions[toolId] || { x: 100, y: 100, width: 450, height: 500, zIndex: 10 };
                  const wp = {
                    x: pos.x, y: pos.y, width: pos.width, height: pos.height, zIndex: pos.zIndex,
                    minimized: pos.isMinimized,
                    onMove: (nx: number, ny: number) => updateWindow(toolId, { x: nx, y: ny }),
                    onResize: (nw: number, nh: number) => updateWindow(toolId, { width: nw, height: nh }),
                    onFocus: () => focusWindow(toolId),
                    onToggleMinimize: () => updateWindow(toolId, { isMinimized: !pos.isMinimized }),
                    onClose: () => toggleTool(toolId)
                  };

                  switch (toolId) {
                    case 'narrative': return (
                      <Window key={toolId} {...wp} id={toolId} label="Narrativa & Ideias" icon={PenTool} iconColor="text-violet-400" tagColor="bg-violet-500">
                        <NarrativeGeneratorTool {...tp} />
                      </Window>
                    );
                    case 'grimoire': return (
                      <Window key={toolId} {...wp} id={toolId} label="O Grimório" icon={BookOpen} iconColor="text-sky-400" tagColor="bg-sky-500" noPad>
                        <WorldGrimoireTool {...tp} />
                      </Window>
                    );
                    case 'sandbox': return (
                      <Window key={toolId} {...wp} id={toolId} label="Sandbox" icon={Map} iconColor="text-emerald-400" tagColor="bg-emerald-500">
                        <SandboxIdeasTool {...tp} />
                      </Window>
                    );
                    case 'consequences': return (
                      <Window key={toolId} {...wp} id={toolId} label="Efeitos" icon={Zap} iconColor="text-yellow-400" tagColor="bg-yellow-500">
                        <ConsequencesTool {...tp} />
                      </Window>
                    );
                    case 'rules': return (
                      <Window key={toolId} {...wp} id={toolId} label="Enciclopédia" icon={Book} iconColor="text-cyan-400" tagColor="bg-cyan-500">
                        <RulesLookupTool {...tp} />
                      </Window>
                    );
                    case 'summary': return (
                      <Window key={toolId} {...wp} id={toolId} label="Resumo" icon={Scroll} iconColor="text-blue-400" tagColor="bg-blue-500">
                        <SessionSummaryTool {...tp} />
                      </Window>
                    );
                    case 'analysis': return (
                      <Window key={toolId} {...wp} id={toolId} label="Análise" icon={Search} iconColor="text-amber-400" tagColor="bg-amber-500">
                        <ContextAnalysisTool {...tp} />
                      </Window>
                    );
                    case 'archive': return (
                      <Window key={toolId} {...wp} id={toolId} label="Atas das Crônicas" icon={History} iconColor="text-orange-400" tagColor="bg-orange-500">
                        <SessionHistoryTool {...tp} />
                      </Window>
                    );
                    case 'cartography': return (
                      <Window key={toolId} {...wp} id={toolId} label="Cartografia" icon={MapPin} iconColor="text-lime-400" tagColor="bg-lime-500" noPad>
                        <CartographyTool {...tp} />
                      </Window>
                    );
                    case 'party': return (
                      <PartyMiniTracker key={toolId} {...tp} members={party} avgLevel={avgLevel} onAdd={addMember} onUpdate={updateMember} onRemove={removeMember} windowProps={wp} />
                    );
                    default: return null;
                  }
                })}
              </div>

              {/* ── BOTTOM DOCK (HORIZONTAL TOOLBAR) ── */}
              <div className="h-20 px-8 flex items-center justify-center pb-4 z-[60] shrink-0 pointer-events-none">
                <div className="h-14 px-5 rounded-2xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-xl flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-500 hover:bg-[#0a0a0a]/80 hover:border-white/20">
                  {[
                    { id: 'grimoire', icon: BookOpen, label: 'Grimório', color: 'text-sky-400' },
                    { id: 'narrative', icon: PenTool, label: 'Narrativa', color: 'text-violet-400' },
                    { id: 'sandbox', icon: Map, label: 'Sandbox', color: 'text-emerald-400' },
                    { id: 'consequences', icon: Zap, label: 'Efeitos', color: 'text-yellow-400' },
                    { id: 'rules', icon: Book, label: 'Regras', color: 'text-cyan-400' },
                    { id: 'summary', icon: Scroll, label: 'Resumo', color: 'text-blue-400' },
                    { id: 'analysis', icon: Search, label: 'Análise', color: 'text-amber-400' },
                    { id: 'archive', icon: History, label: 'Crônicas', color: 'text-orange-400' },
                    { id: 'cartography', icon: MapPin, label: 'Mapas', color: 'text-lime-400' },
                    { id: 'party', icon: Users, label: 'Party', color: 'text-orange-400' }
                  ].map((tool) => {
                    const isActive = activeTools.includes(tool.id);
                    const isMinimized = windowPositions[tool.id]?.isMinimized;
                    return (
                      <Tooltip key={tool.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => toggleTool(tool.id)}
                            className={cn(
                              "relative group p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center",
                              isActive
                                ? "bg-white/10 scale-110 shadow-lg"
                                : "hover:bg-white/5 hover:scale-105 opacity-60 hover:opacity-100"
                            )}
                          >
                            <tool.icon
                              size={20}
                              className={cn(
                                "transition-colors duration-300",
                                isActive && !isMinimized ? tool.color : "text-white/70 group-hover:text-white"
                              )}
                            />

                            {/* Indicator Dot */}
                            {isActive && (
                              <div className={cn(
                                "absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 rounded-full bg-accent transition-all duration-300",
                                isMinimized ? "w-1 opacity-40" : "w-3 shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
                              )} />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={12} className="text-[10px] font-[Fira_Code] uppercase tracking-widest flex items-center gap-2 border-white/10 bg-black/90">
                          {tool.label}
                          <span className="text-muted-foreground/50">[{isActive ? (isMinimized ? 'MINIMIZED' : 'ACTIVE') : 'CLOSED'}]</span>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
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
        <DialogContent className="sm:max-w-[640px] bg-card/95 backdrop-blur-xl border-white/8 p-0 overflow-hidden shadow-2xl text-foreground">
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
    </div >
  );
}

// ─────────────────────────────────────────────────────────
// ROOT — Firebase Wrapper
// ─────────────────────────────────────────────────────────
export default function ScreenDungeonMaster() {
  return (
    <FirebaseClientProvider>
      <ScreenContent />
    </FirebaseClientProvider>
  );
}
