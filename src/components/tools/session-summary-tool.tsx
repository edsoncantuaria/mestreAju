'use client';

import React, { useState } from 'react';
import { Scroll, Send, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { summarizeSession, type SummarizeSessionOutput } from '@/ai/flows/summarize-session';
import { Badge } from '@/components/ui/badge';

export function SessionSummaryTool() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeSessionOutput | null>(null);

  const handleSummarize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const data = await summarizeSession({ sessionSummary: input });
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!result && !loading ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Textarea 
            placeholder="Relate o que aconteceu na última sessão..."
            className="min-h-[200px] bg-background/30 border-white/10 focus:border-primary/50 resize-none text-sm leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button 
            onClick={handleSummarize} 
            disabled={loading || !input.trim()}
            className="w-full bg-primary hover:bg-primary/80 text-white font-headline"
          >
            Analisar Sessão
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4 text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="font-headline italic text-sm">Consultando os arquivos do Copiloto...</p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2 p-3 rounded-lg bg-black/20 border border-white/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent">Facções</h4>
              <div className="flex flex-wrap gap-2">
                {result.factions.map((f, i) => <Badge key={i} variant="outline" className="text-[10px] border-white/10">{f}</Badge>)}
              </div>
            </div>
            
            <div className="space-y-2 p-3 rounded-lg bg-black/20 border border-white/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-destructive">Conflitos</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {result.conflicts.map((c, i) => <li key={i} className="flex gap-2"><span className="text-destructive">•</span> {c}</li>)}
              </ul>
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm font-headline flex items-center gap-2">
                <Lightbulb className="text-accent h-3 w-3" />
                Futuro
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <ul className="space-y-2">
                {result.futureDevelopments.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    {d}
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
                <Scroll size={10} /> Gancho
              </h4>
              <p className="text-[10px] italic text-muted-foreground">{result.hiddenHook}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => setResult(null)}>
            Nova Análise
          </Button>
        </div>
      )}
    </div>
  );
}