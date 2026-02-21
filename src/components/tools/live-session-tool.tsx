'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Loader2, ChevronRight, Sword, Footprints, MessageSquare, Save, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { generateEncounterStep, type DynamicEncounterOutput } from '@/ai/flows/dynamic-encounter-flow';
import { cn } from '@/lib/utils';

interface LiveSessionToolProps {
  partyInfo: { playerCount: number; averageLevel: number };
}

export function LiveSessionTool({ partyInfo }: LiveSessionToolProps) {
  const [history, setHistory] = useState<DynamicEncounterOutput[]>([]);
  const [currentSituation, setCurrentSituation] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);

  const startSession = async () => {
    if (!currentSituation.trim()) return;
    setLoading(true);
    try {
      const step = await generateEncounterStep({
        currentSituation,
        partyInfo,
      });
      setHistory([step]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const chooseOption = async (optionLabel: string) => {
    setLoading(true);
    const lastStep = history[history.length - 1];
    try {
      const step = await generateEncounterStep({
        currentSituation: lastStep.narrativa,
        lastChoice: optionLabel,
        partyInfo,
        customInput: customInput.trim() || undefined,
      });
      setHistory([...history, step]);
      setCustomInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setHistory([]);
    setCurrentSituation('');
    setCustomInput('');
  };

  const lastStep = history[history.length - 1];

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-[10px] text-accent uppercase font-bold mb-2 tracking-widest">Início da Cena</p>
            <Input 
              placeholder="Ex: Os heróis estão viajando pela Estrada do Rei..."
              value={currentSituation}
              onChange={(e) => setCurrentSituation(e.target.value)}
              className="bg-background/50 border-white/10 text-xs"
            />
          </div>
          <Button onClick={startSession} disabled={loading || !currentSituation} className="w-full font-headline bg-primary hover:bg-primary/90">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Iniciar Jornada"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline of events (last 2 only to save space) */}
          <div className="space-y-4">
            {history.slice(-2).map((step, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-xl border animate-in slide-in-from-left-4 duration-500",
                idx === history.slice(-2).length - 1 ? "bg-card/80 border-accent/30 shadow-lg" : "bg-black/20 border-white/5 opacity-50 scale-95 origin-top"
              )}>
                <p className="text-xs leading-relaxed font-body text-foreground/90 italic">
                  "{step.narrativa}"
                </p>
                {step.detalheOculto && (idx === history.slice(-2).length - 1) && (
                  <div className="mt-3 p-2 bg-accent/10 border-l-2 border-accent rounded text-[10px] text-accent-foreground flex items-start gap-2">
                    <Save size={12} className="mt-0.5 shrink-0" />
                    <span>{step.detalheOculto}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
              <p className="text-[10px] font-headline">Tecendo as ramificações...</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 gap-2">
                {lastStep?.opcoes.map((opt, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 border-white/5 bg-white/5 hover:bg-accent/10 hover:border-accent/50 transition-all text-left group"
                    onClick={() => chooseOption(opt.label)}
                  >
                    <div className="flex w-full justify-between items-center">
                      <span className="text-xs font-bold text-accent group-hover:text-white">{opt.label}</span>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase",
                        opt.difficulty === 'Mortal' ? 'bg-red-500/20 text-red-500 border-red-500/50' :
                        opt.difficulty === 'Difícil' ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' :
                        'bg-green-500/20 text-green-500 border-green-500/50'
                      )}>
                        {opt.difficulty}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground line-clamp-2">{opt.description}</span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 items-center border-t border-white/5 pt-4">
                <Input 
                  placeholder="Ou descreva algo diferente..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="h-8 text-[10px] bg-black/40 border-white/10"
                />
                <Button 
                  size="sm" 
                  onClick={() => chooseOption('Escolha Customizada')} 
                  disabled={!customInput.trim()}
                  className="h-8 w-8 p-0"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" size="sm" onClick={reset} className="text-[9px] h-6 text-muted-foreground hover:text-destructive">
              <Trash2 size={10} className="mr-1" /> Encerrar Sessão
            </Button>
            {lastStep?.sugestaoMecanica && (
              <div className="text-[9px] text-accent font-bold px-2 py-1 bg-accent/5 rounded border border-accent/20">
                INFO: {lastStep.sugestaoMecanica}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
