
'use client';

import React, { useState } from 'react';
import { Scroll, Send, Loader2, Faction, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { summarizeSession, type SummarizeSessionOutput } from '@/ai/flows/summarize-session';
import { FeatureHeader } from '@/components/shared/feature-header';
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <FeatureHeader 
        title="Resumo da Sessão" 
        description="Identifique facções, conflitos e ganchos a partir do seu relato de jogo."
        icon={Scroll}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-headline">O que aconteceu na última mesa?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Descreva os eventos, NPCs e ações dos jogadores..."
                className="min-h-[300px] bg-background/50 border-primary/30 focus:border-accent resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button 
                onClick={handleSummarize} 
                disabled={loading || !input.trim()}
                className="w-full bg-primary hover:bg-primary/80 text-white font-headline py-6 text-lg"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                Analisar Sessão
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="font-headline italic text-lg">Consultando os arquivos do Copiloto Supremo...</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
              <Card className="border-accent/30 bg-card/80">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Badge variant="outline" className="text-accent border-accent/50">Facções &amp; Conflitos</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-accent/80">Facções</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.factions.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-destructive">Conflitos</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.conflicts.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <Lightbulb className="text-accent h-5 w-5" />
                    Desenvolvimentos Futuros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.futureDevelopments.map((d, i) => (
                      <li key={i} className="text-sm border-l-2 border-primary/50 pl-3 py-1 bg-primary/5 rounded-r">
                        {d}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-headline text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Complicação Inesperada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm italic">
                    {result.unexpectedComplication}
                  </CardContent>
                </Card>

                <Card className="border-accent/30 bg-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-headline text-accent flex items-center gap-2">
                      <Scroll className="h-4 w-4" />
                      Gancho Oculto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm italic">
                    {result.hiddenHook}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-primary/10 rounded-xl p-12">
              <Scroll size={64} className="mb-4 opacity-20" />
              <p className="text-center italic">Os ecos do passado ainda não foram registrados. Forneça o resumo da sessão para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
