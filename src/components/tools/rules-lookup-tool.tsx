'use client';

import React, { useState } from 'react';
import { Book, Search, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RulesLookupTool() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // Ajuste para formatar o index da mesma forma que a API espera
      const index = query.toLowerCase().replace(/\s+/g, '-');
      const response = await fetch(`https://www.dnd5eapi.co/api/rule-sections/${index}`);
      
      if (!response.ok) {
        const fallback = await fetch(`https://www.dnd5eapi.co/api/rules/${index}`);
        if (!fallback.ok) {
           setResult({ error: "Regra não encontrada. Tente termos como 'combat', 'resting', 'cover', 'ability-checks'." });
           return;
        }
        setResult(await fallback.json());
      } else {
        setResult(await response.json());
      }
    } catch (error) {
      setResult({ error: "Erro ao conectar com a API de D&D." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex gap-2">
        <Input 
          placeholder="Ex: combat, cover, jumping..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-background/30 border-white/5 h-9 text-xs"
        />
        <Button size="sm" onClick={handleSearch} disabled={loading} className="bg-primary h-9">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 pr-3 -mr-3">
        {result?.error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-500 italic">
            {result.error}
          </div>
        ) : result ? (
          <Card className="border-white/5 bg-black/40 animate-in fade-in zoom-in-95">
            <CardHeader className="py-2 px-3 border-b border-white/5">
              <CardTitle className="text-xs font-headline uppercase tracking-widest text-accent flex items-center gap-2">
                <Book size={12} /> {result.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-body">
                {result.desc}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-10">
            <Book size={40} className="mb-2 opacity-10" />
            <p className="text-[10px] uppercase font-bold tracking-widest">Enciclopédia SRD 5e</p>
          </div>
        )}
      </ScrollArea>
      
      <div className="p-2 bg-accent/5 border border-accent/10 rounded text-[9px] text-accent/60 flex items-center gap-2">
        <Info size={10} />
        <span>Use índices em inglês (ex: 'conditions', 'ability-scores').</span>
      </div>
    </div>
  );
}
