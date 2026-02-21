'use client';

import React, { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { manageConsequences, type ManageConsequencesOutput } from '@/ai/flows/manage-consequences';

export function ConsequencesTool() {
  const [playerAction, setPlayerAction] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManageConsequencesOutput | null>(null);

  const handleGenerate = async () => {
    if (!playerAction.trim()) return;
    setLoading(true);
    try {
      const data = await manageConsequences({ playerAction, context });
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
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-accent uppercase tracking-wider">Ação dos Jogadores</label>
            <Textarea 
              placeholder="O que eles fizeram?"
              value={playerAction}
              onChange={(e) => setPlayerAction(e.target.value)}
              className="bg-background/30 border-white/5 h-20 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contexto</label>
            <Textarea 
              placeholder="Onde? Quem estava lá?"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-background/30 border-white/5 h-16 text-xs"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !playerAction.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Calcular Efeitos
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
          <p className="font-headline italic text-xs text-center">Calculando as repercussões nas redes do mundo...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-in slide-in-from-right-2 duration-500">
          <ConsequenceSection title="Curto Prazo" data={result.shortTerm} color="text-accent" />
          <ConsequenceSection title="Médio Prazo" data={result.mediumTerm} color="text-primary" />
          <ConsequenceSection title="Longo Prazo" data={result.longTerm} color="text-muted-foreground" />
          
          <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => setResult(null)}>
            Nova Ação
          </Button>
        </div>
      )}
    </div>
  );
}

function ConsequenceSection({ title, data, color }: { title: string, data: string[], color: string }) {
  return (
    <Card className="border-white/5 bg-black/20">
      <CardHeader className="py-2 px-4 border-b border-white/5">
        <CardTitle className={`text-xs font-headline uppercase tracking-widest ${color}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <ul className="space-y-2">
          {data.map((item, idx) => (
            <li key={idx} className="text-[11px] leading-relaxed text-muted-foreground flex gap-2">
              <span className="text-accent mt-0.5">•</span> {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}