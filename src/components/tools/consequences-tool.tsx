
'use client';

import React, { useState } from 'react';
import { Zap, Send, Loader2, Landmark, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { manageConsequences, type ManageConsequencesOutput } from '@/ai/flows/manage-consequences';
import { FeatureHeader } from '@/components/shared/feature-header';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <FeatureHeader 
        title="Gerenciamento de Consequências" 
        description="Preveja os impactos sociais, econômicos e políticos das ações dos jogadores."
        icon={Zap}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-accent uppercase tracking-wider">Ação dos Jogadores</label>
                <Textarea 
                  placeholder="Ex: Mataram o mercador corrupto no meio da praça..."
                  value={playerAction}
                  onChange={(e) => setPlayerAction(e.target.value)}
                  className="bg-background/50 h-32"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Contexto do Mundo</label>
                <Textarea 
                  placeholder="Quem era o mercador? Quem viu? Como é a guarda local?"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="bg-background/50 h-32"
                />
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !playerAction.trim()}
                className="w-full bg-primary hover:bg-primary/80 font-headline h-12"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2" />}
                Calcular Efeitos
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
              <p className="font-headline italic">Calculando as repercussões nas redes do mundo...</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <ConsequenceSection title="Curto Prazo (Imediato)" data={result.shortTerm} color="text-accent" />
              <ConsequenceSection title="Médio Prazo (Semanas)" data={result.mediumTerm} color="text-primary-foreground" />
              <ConsequenceSection title="Longo Prazo (Meses/Anos)" data={result.longTerm} color="text-muted-foreground" />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20">
              <Zap size={80} />
              <p className="mt-4 font-headline text-xl">Aguardando a próxima ação decisiva...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsequenceSection({ title, data, color }: { title: string, data: string[], color: string }) {
  return (
    <Card className="border-primary/20 bg-card/40">
      <CardHeader className="py-3 bg-primary/5 border-b border-primary/10">
        <CardTitle className={`text-lg font-headline ${color}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {data.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <p className="text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
