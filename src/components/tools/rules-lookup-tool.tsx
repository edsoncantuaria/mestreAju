'use client';

import React, { useState } from 'react';
import { Book, Search, Loader2, Info, Skull, Shield, Zap, Swords, Terminal, Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function RulesLookupTool() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [ruleResult, setRuleResult] = useState<any | null>(null);
  const [monsterResult, setMonsterResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('rules');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const index = query.toLowerCase().replace(/\s+/g, '-');

    try {
      if (activeTab === 'rules') {
        const response = await fetch(`https://www.dnd5eapi.co/api/rule-sections/${index}`);
        if (!response.ok) {
          const fallback = await fetch(`https://www.dnd5eapi.co/api/rules/${index}`);
          if (!fallback.ok) {
            setRuleResult({ error: "Regra não encontrada." });
          } else {
            setRuleResult(await fallback.json());
          }
        } else {
          setRuleResult(await response.json());
        }
      } else {
        const response = await fetch(`https://api.open5e.com/monsters/${index}/`);
        if (!response.ok) {
          setMonsterResult({ error: "Monstro não encontrado." });
        } else {
          setMonsterResult(await response.json());
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 bg-black/40 border border-white/5">
          <TabsTrigger value="rules" className="text-[10px] uppercase font-bold tracking-widest gap-2">
            <Book size={12} /> Regras
          </TabsTrigger>
          <TabsTrigger value="monsters" className="text-[10px] uppercase font-bold tracking-widest gap-2">
            <Skull size={12} /> Monstros
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <Input 
          placeholder={activeTab === 'rules' ? "Ex: combat, cover..." : "Ex: goblin, lich..."} 
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
        {activeTab === 'rules' ? (
          <RuleView result={ruleResult} />
        ) : (
          <MonsterStatblock result={monsterResult} />
        )}
      </ScrollArea>
      
      <div className="p-2 bg-accent/5 border border-accent/10 rounded text-[9px] text-accent/60 flex items-center gap-2">
        <Info size={10} />
        <span>Busque em inglês (SRD oficial).</span>
      </div>
    </div>
  );
}

function RuleView({ result }: { result: any }) {
  if (!result) return <EmptyState icon={Book} label="Enciclopédia de Regras" />;
  if (result.error) return <ErrorState message={result.error} />;

  return (
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
  );
}

function MonsterStatblock({ result }: { result: any }) {
  const { toast } = useToast();
  const [copiedMacro, setCopiedMacro] = useState(false);
  const [copiedImport, setCopiedImport] = useState(false);

  if (!result) return <EmptyState icon={Skull} label="Bestiário SRD" />;
  if (result.error) return <ErrorState message={result.error} />;

  const abilities = [
    { label: 'FOR', val: result.strength, mod: Math.floor((result.strength - 10) / 2) },
    { label: 'DES', val: result.dexterity, mod: Math.floor((result.dexterity - 10) / 2) },
    { label: 'CON', val: result.constitution, mod: Math.floor((result.constitution - 10) / 2) },
    { label: 'INT', val: result.intelligence, mod: Math.floor((result.intelligence - 10) / 2) },
    { label: 'SAB', val: result.wisdom, mod: Math.floor((result.wisdom - 10) / 2) },
    { label: 'CAR', val: result.charisma, mod: Math.floor((result.charisma - 10) / 2) },
  ];

  const generateRoll20Macro = () => {
    const modStr = (val: number) => {
      const mod = Math.floor((val - 10) / 2);
      return `${val} (${mod >= 0 ? '+' : ''}${mod})`;
    };

    let macro = `&{template:npc} {{name=${result.name}}} {{npc_type=${result.size} ${result.type}}} {{npc_alignment=${result.alignment}}} {{npc_ac=${result.armor_class}}} {{npc_hp=${result.hit_points}}} {{npc_speed=${result.speed.walk || result.speed}}} {{npc_challenge=${result.challenge_rating}}}`;
    
    macro += ` {{npc_str=${modStr(result.strength)}}} {{npc_dex=${modStr(result.dexterity)}}} {{npc_con=${modStr(result.constitution)}}} {{npc_int=${modStr(result.intelligence)}}} {{npc_wis=${modStr(result.wisdom)}}} {{npc_cha=${modStr(result.charisma)}}}`;

    if (result.actions && result.actions.length > 0) {
      const actionsSummary = result.actions.slice(0, 3).map((a: any) => `**${a.name}**: ${a.desc.substring(0, 80)}...`).join('\\n');
      macro += ` {{actions=${actionsSummary}}}`;
    }

    return macro;
  };

  const generateImportCommand = () => {
    return `!setattr --sel --npc_name "${result.name}" --hp ${result.hit_points} --hp|max ${result.hit_points} --npc_ac ${result.armor_class} --strength ${result.strength} --dexterity ${result.dexterity} --constitution ${result.constitution} --intelligence ${result.intelligence} --wisdom ${result.wisdom} --charisma ${result.charisma} --npc_type "${result.size} ${result.type}" --npc_challenge ${result.challenge_rating}`;
  };

  const copyMacro = () => {
    navigator.clipboard.writeText(generateRoll20Macro());
    setCopiedMacro(true);
    toast({ title: "Visualização Copiada!", description: "Use para ver o statblock no chat." });
    setTimeout(() => setCopiedMacro(false), 2000);
  };

  const copyImport = () => {
    navigator.clipboard.writeText(generateImportCommand());
    setCopiedImport(true);
    toast({ title: "Comando de Importação!", description: "Selecione o token no Roll20 e cole para preencher a ficha." });
    setTimeout(() => setCopiedImport(false), 2000);
  };

  return (
    <Card className="border-accent/20 bg-card/60 animate-in zoom-in-95 overflow-hidden">
      <div className="h-1 bg-accent w-full" />
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-headline text-accent italic">{result.name}</CardTitle>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{result.size} {result.type}, {result.alignment}</p>
          </div>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-primary" onClick={copyMacro}>
                    {copiedMacro ? <Check size={14} /> : <Terminal size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px]">Macro de Chat (Visual)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-accent" onClick={copyImport}>
                    {copiedImport ? <Check size={14} /> : <Download size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px]">Importar para Ficha (ChatSetAttr)</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="text-right ml-2">
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded">CR {result.challenge_rating}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 border-y border-accent/20 py-2">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-accent" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase text-muted-foreground">CA</span>
              <span className="text-xs font-bold">{result.armor_class} ({result.armor_desc || 'natural'})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase text-muted-foreground">HP</span>
              <span className="text-xs font-bold">{result.hit_points} ({result.hit_dice})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1 text-center">
          {abilities.map((a) => (
            <div key={a.label} className="flex flex-col p-1 rounded bg-black/20">
              <span className="text-[8px] font-bold text-accent">{a.label}</span>
              <span className="text-[10px] font-bold">{a.val}</span>
              <span className="text-[8px] text-muted-foreground">({a.mod >= 0 ? '+' : ''}{a.mod})</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <section>
            <h4 className="text-[9px] font-bold text-accent uppercase tracking-tighter border-b border-accent/10 mb-1 flex items-center gap-2">
              <Swords size={10} /> Ações
            </h4>
            <div className="space-y-2">
              {result.actions?.map((action: any, i: number) => (
                <div key={i} className="text-[10px] leading-relaxed">
                  <span className="font-bold italic text-foreground">{action.name}.</span>{' '}
                  <span className="text-muted-foreground">{action.desc}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-10">
      <Icon size={40} className="mb-2 opacity-10" />
      <p className="text-[10px] uppercase font-bold tracking-widest">{label}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-[10px] text-destructive italic">
      {message}
    </div>
  );
}
