'use client';

import React, { useState, useEffect } from 'react';
import { Scroll, Send, Loader2, AlertTriangle, Lightbulb, Coins, Activity, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { summarizeSession, type SummarizeSessionOutput } from '@/ai/flows/summarize-session';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionSummaryToolProps {
  activeSession: any | null;
  setGlobalLoading: (loading: boolean) => void;
}

export function SessionSummaryTool({ activeSession, setGlobalLoading }: SessionSummaryToolProps) {
  const { user } = useUser();
  const db = useFirestore();

  const [input, setInput] = useState('');
  const [result, setResult] = useState<SummarizeSessionOutput | null>(null);

  useEffect(() => {
    if (activeSession?.toolStates?.summary) {
      setInput(activeSession.toolStates.summary.input || '');
    }
    if (activeSession?.toolStates?.summary_result) {
      setResult(activeSession.toolStates.summary_result);
    }
  }, [activeSession?.id]);

  const persistToolState = async (updates: any) => {
    if (!db || !user || !activeSession) return;
    const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
    updateDoc(sessionRef, { 
      [`toolStates.summary`]: { input, ...updates } 
    });
  };

  const handleSummarize = async () => {
    if (!input.trim()) return;
    setGlobalLoading(true);
    try {
      const data = await summarizeSession({ sessionSummary: input });
      setResult(data);
      
      if (db && user && activeSession.id) {
        const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
        updateDoc(sessionRef, { 'toolStates.summary_result': data });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const resetResult = () => {
    setResult(null);
    if (db && user && activeSession.id) {
      const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
      updateDoc(sessionRef, { 'toolStates.summary_result': null });
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {!result ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Textarea 
            placeholder="Relate os eventos, combates e tesouros da última sessão..."
            className="min-h-[200px] bg-background/30 border-white/10 focus:border-primary/50 resize-none text-sm leading-relaxed"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              persistToolState({ input: e.target.value });
            }}
          />
          <Button 
            onClick={handleSummarize} 
            disabled={!input.trim()}
            className="w-full bg-primary hover:bg-primary/80 text-white font-headline"
          >
            Sincronizar Cronologia
          </Button>
        </div>
      ) : null}

      {result && (
        <ScrollArea className="flex-1 pr-3 -mr-3">
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500 pb-4">
            
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-2 mb-2">
                  <Activity size={10} /> Impacto Mecânico
                </h4>
                <div className="space-y-2">
                  {result.mechanicalImpact.xpAwarded && (
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-white/5 pb-1">
                      <span>XP Sugerido</span>
                      <span className="font-bold text-accent">{result.mechanicalImpact.xpAwarded}</span>
                    </div>
                  )}
                  {result.mechanicalImpact.lootAcquired && result.mechanicalImpact.lootAcquired.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase text-muted-foreground font-bold">Tesouros</span>
                      <div className="flex flex-wrap gap-1">
                        {result.mechanicalImpact.lootAcquired.map((l, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] border-amber-500/30 text-amber-500 bg-amber-500/5">
                            <Coins size={8} className="mr-1" /> {l}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2 p-3 rounded-lg bg-black/20 border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent">Facções</h4>
                <div className="flex flex-wrap gap-2">
                  {result.factions.map((f, i) => <Badge key={i} variant="outline" className="text-[10px] border-white/10">{f}</Badge>)}
                </div>
              </div>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-headline flex items-center gap-2">
                  <Lightbulb className="text-accent h-3 w-3" />
                  Futuro Sandbox
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ul className="space-y-2">
                  {result.futureDevelopments.map((d, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                      <span className="text-primary">•</span> {d}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> Complicação
                </h4>
                <p className="text-[10px] italic text-muted-foreground">{result.unexpectedComplication}</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1 flex items-center gap-1">
                  <Scroll size={10} /> Gancho Oculto
                </h4>
                <p className="text-[10px] italic text-muted-foreground">{result.hiddenHook}</p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={resetResult}>
              Nova Crônica
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
