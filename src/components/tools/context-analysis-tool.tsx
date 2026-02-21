
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Skull, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { analyzeContext, type AnalyzeContextOutput } from '@/ai/flows/analyze-context';

interface ContextAnalysisToolProps {
  sharedContext?: {
    situation?: string;
    npcs?: string;
  };
}

export function ContextAnalysisTool({ sharedContext }: ContextAnalysisToolProps) {
  const [formData, setFormData] = useState({
    situation: '',
    pastEvents: '',
    npcs: '',
    factions: '',
    promises: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeContextOutput | null>(null);

  // Connect to Mind Map context
  useEffect(() => {
    if (sharedContext?.situation || sharedContext?.npcs) {
      setFormData(prev => ({
        ...prev,
        situation: sharedContext.situation || prev.situation,
        npcs: sharedContext.npcs || prev.npcs
      }));
    }
  }, [sharedContext]);

  const handleAnalyze = async () => {
    if (!formData.situation.trim()) return;
    setLoading(true);
    try {
      const data = await analyzeContext(formData);
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
          {sharedContext?.situation && (
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400">
              <LinkIcon size={10} /> Sincronizado com Sessão Ativa
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-accent uppercase tracking-widest">A Situação Atual</label>
            <Textarea 
              placeholder="O que está acontecendo agora?"
              value={formData.situation}
              onChange={(e) => setFormData({...formData, situation: e.target.value})}
              className="bg-background/30 border-white/5 h-20 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">NPCs/Alvos</label>
              <Textarea 
                value={formData.npcs}
                onChange={(e) => setFormData({...formData, npcs: e.target.value})}
                className="bg-background/30 border-white/5 h-12 text-[10px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Facções</label>
              <Textarea 
                value={formData.factions}
                onChange={(e) => setFormData({...formData, factions: e.target.value})}
                className="bg-background/30 border-white/5 h-12 text-[10px]"
              />
            </div>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={loading || !formData.situation.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Revelar Intenções
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
          <p className="font-headline italic text-xs">Consultando o oráculo narrativo...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs leading-relaxed text-muted-foreground italic border-l-2">
            {result.analise}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Card className="border-white/5 bg-black/40">
              <CardHeader className="py-2 px-3 border-b border-white/5">
                <CardTitle className="text-[10px] font-headline flex items-center gap-1 uppercase tracking-widest">
                  <ShieldCheck className="text-green-500 h-3 w-3" />
                  Consequências Naturais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {result.caminhosPossiveis.map((p, i) => (
                  <div key={i} className="text-[10px] p-2 bg-white/5 rounded border-l border-primary/50 text-muted-foreground">
                    {p}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="py-2 px-3 border-b border-destructive/10">
                <CardTitle className="text-[10px] font-headline flex items-center gap-1 text-destructive uppercase tracking-widest">
                  <Skull className="h-3 w-3" />
                  Oculto sob a Superfície
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-[10px] italic text-muted-foreground">
                {result.complicacaoOculta}
              </CardContent>
            </Card>
          </div>
          
          <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => setResult(null)}>
            Nova Análise
          </Button>
        </div>
      )}
    </div>
  );
}
