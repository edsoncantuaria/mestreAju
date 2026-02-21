'use client';

import React, { useState } from 'react';
import { Zap, Loader2, Calendar, TrendingUp, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { manageConsequences, type ManageConsequencesOutput } from '@/ai/flows/manage-consequences';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="space-y-4 h-full flex flex-col">
      {!result && !loading ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-accent uppercase tracking-wider">Ação Crucial dos Jogadores</label>
            <Textarea 
              placeholder="Ex: Os jogadores mataram o Barão, mas deixaram seu herdeiro fugir com os selos reais..."
              value={playerAction}
              onChange={(e) => setPlayerAction(e.target.value)}
              className="bg-background/30 border-white/5 h-20 text-xs resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Situação Regional (Opcional)</label>
            <Textarea 
              placeholder="Havia testemunhas? Como a cidade reagiu?"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-background/30 border-white/5 h-16 text-xs resize-none"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !playerAction.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Simular Repercussões
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
          <p className="font-headline italic text-xs text-center">Calculando o efeito borboleta no mundo...</p>
        </div>
      )}

      {result && !loading && (
        <ScrollArea className="flex-1 pr-3 -mr-3">
          <div className="space-y-4 animate-in slide-in-from-right-2 duration-500 pb-4">
            <ConsequenceSection 
              title="Curto Prazo (Dias)" 
              data={result.shortTerm} 
              color="text-accent" 
              icon={Zap}
              subtitle="Reações imediatas e caos local"
            />
            <ConsequenceSection 
              title="Médio Prazo (Semanas)" 
              data={result.mediumTerm} 
              color="text-primary" 
              icon={TrendingUp}
              subtitle="Mudanças em leis, comércio e facções"
            />
            <ConsequenceSection 
              title="Longo Prazo (Meses/Anos)" 
              data={result.longTerm} 
              color="text-muted-foreground" 
              icon={Globe}
              subtitle="Cicatrizes permanentes na geopolítica"
            />
            
            <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => setResult(null)}>
              Nova Repercussão
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

interface ConsequenceSectionProps {
  title: string;
  subtitle: string;
  data: string[];
  color: string;
  icon: any;
}

function ConsequenceSection({ title, subtitle, data, color, icon: Icon }: ConsequenceSectionProps) {
  return (
    <Card className="border-white/5 bg-black/20 overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`${color} h-3.5 w-3.5`} />
          <CardTitle className={`text-[10px] font-headline uppercase tracking-widest ${color}`}>{title}</CardTitle>
        </div>
        <p className="text-[9px] text-muted-foreground/60 italic font-medium">{subtitle}</p>
      </CardHeader>
      <CardContent className="p-3">
        <ul className="space-y-3">
          {data.map((item, idx) => (
            <li key={idx} className="text-[11px] leading-relaxed text-muted-foreground flex gap-3 group">
              <span className={`w-1 h-1 rounded-full ${color} mt-1.5 shrink-0 group-hover:scale-150 transition-transform`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
