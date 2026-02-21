'use client';

import React, { useState } from 'react';
import { Users, Shield, Plus, Loader2, Save, Sparkles, Trash2, ChevronRight, UserCircle, Target, Link as LinkIcon, Terminal, Check, X, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateNpc } from '@/ai/flows/generate-npc-flow';
import { generateFaction } from '@/ai/flows/generate-faction-flow';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NpcFactionManagerToolProps {
  activeSession: any | null;
}

export function NpcFactionManagerTool({ activeSession }: NpcFactionManagerToolProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [tokenUrl, setTokenUrl] = useState('');
  const [copiedMacro, setCopiedMacro] = useState<string | null>(null);
  const [copiedImport, setCopiedImport] = useState<string | null>(null);

  const npcsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeSession) return null;
    return collection(db, `users/${user.uid}/campaigns/default-campaign/npcs`);
  }, [db, user, activeSession]);

  const factionsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeSession) return null;
    return collection(db, `users/${user.uid}/campaigns/default-campaign/factions`);
  }, [db, user, activeSession]);

  const { data: npcs } = useCollection(npcsQuery);
  const { data: factions } = useCollection(factionsQuery);

  const handleGenerateNpc = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const result = await generateNpc({ context: activeSession.worldLore });
      const npcId = `npc-${Date.now()}`;
      const npcRef = doc(db!, `users/${user!.uid}/campaigns/default-campaign/npcs/${npcId}`);
      
      const npcData = {
        ...result,
        id: npcId,
        campaignId: 'default-campaign',
        ownerId: user!.uid,
        dateCreated: new Date().toISOString(),
        dateLastModified: new Date().toISOString(),
        tokenImageUrl: '',
        factionIds: []
      };

      await setDoc(npcRef, npcData);
      toast({ title: "NPC Manifestado!", description: `${result.name} foi adicionado ao seu mundo.` });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyMacro = (macro: string) => {
    navigator.clipboard.writeText(macro);
    setCopiedMacro(macro);
    toast({ title: "Visualização Copiada!", description: "Cole no chat para ver os dados." });
    setTimeout(() => setCopiedMacro(null), 2000);
  };

  const copyImport = (importCmd: string) => {
    navigator.clipboard.writeText(importCmd);
    setCopiedImport(importCmd);
    toast({ title: "Importação Copiada!", description: "Selecione o token e cole no chat do Roll20." });
    setTimeout(() => setCopiedImport(null), 2000);
  };

  const updateToken = async (id: string) => {
    if (!db || !user) return;
    const npcRef = doc(db, `users/${user.uid}/campaigns/default-campaign/npcs/${id}`);
    await updateDoc(npcRef, { tokenImageUrl: tokenUrl, dateLastModified: new Date().toISOString() });
    setEditingToken(null);
    setTokenUrl('');
    toast({ title: "Token Vinculado!", description: "O visual do NPC foi atualizado." });
  };

  const handleGenerateFaction = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const result = await generateFaction({ context: activeSession.worldLore });
      const factionId = `faction-${Date.now()}`;
      const factionRef = doc(db!, `users/${user!.uid}/campaigns/default-campaign/factions/${factionId}`);
      
      const factionData = {
        ...result,
        id: factionId,
        campaignId: 'default-campaign',
        ownerId: user!.uid,
        dateCreated: new Date().toISOString(),
        dateLastModified: new Date().toISOString(),
      };

      await setDoc(factionRef, factionData);
      toast({ title: "Facção Criada!", description: `${result.name} agora influencia a região.` });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'npcs' | 'factions', id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, `users/${user.uid}/campaigns/default-campaign/${type}/${id}`));
    toast({ title: "Entidade Removida", description: "O registro foi apagado do grimório." });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 text-[9px] text-accent font-bold uppercase tracking-wider">
        <Info size={12} /> Dica: Use o botão de Download para preencher a ficha do Roll20 automaticamente (Requer script ChatSetAttr).
      </div>
      
      <Tabs defaultValue="npcs" className="flex-1 flex flex-col">
        <TabsList className="bg-black/40 border border-white/5 w-full grid grid-cols-2">
          <TabsTrigger value="npcs" className="gap-2 text-[10px] uppercase font-bold tracking-widest">
            <UserCircle size={14} /> NPCs
          </TabsTrigger>
          <TabsTrigger value="factions" className="gap-2 text-[10px] uppercase font-bold tracking-widest">
            <Shield size={14} /> Facções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="npcs" className="flex-1 flex flex-col mt-4 space-y-4 overflow-hidden">
          <Button 
            onClick={handleGenerateNpc} 
            disabled={loading || !activeSession} 
            className="w-full bg-primary/20 border border-primary/40 hover:bg-primary/30 text-accent gap-2 h-10"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles size={16} />}
            Gerar NPC Sandbox
          </Button>

          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {npcs?.map((npc) => (
                <Card key={npc.id} className="bg-black/20 border-white/5 group hover:border-accent/30 transition-all overflow-hidden">
                  <div className="flex">
                    {npc.tokenImageUrl ? (
                      <div className="w-16 h-16 shrink-0 border-r border-white/5">
                        <img src={npc.tokenImageUrl} alt={npc.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 border-r border-white/5 bg-accent/5 flex items-center justify-center text-accent/20">
                        <UserCircle size={24} />
                      </div>
                    )}
                    <div className="flex-1 p-3">
                      <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-xs font-bold text-accent">{npc.name}</CardTitle>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{npc.race} • {npc.dndClass}</p>
                        </div>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-primary" 
                                  onClick={() => copyMacro(npc.roll20Macro)}
                                >
                                  {copiedMacro === npc.roll20Macro ? <Check size={12} /> : <Terminal size={12} />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-[10px]">Macro de Chat (Visual)</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-accent" 
                                  onClick={() => copyImport(npc.roll20Import)}
                                >
                                  {copiedImport === npc.roll20Import ? <Check size={12} /> : <Download size={12} />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-[10px]">Preencher Ficha (Importar)</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete('npcs', npc.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 space-y-2">
                        {editingToken === npc.id ? (
                          <div className="flex gap-1 mt-2">
                            <Input 
                              placeholder="URL do Token Roll20" 
                              value={tokenUrl} 
                              onChange={(e) => setTokenUrl(e.target.value)}
                              className="h-7 text-[9px] bg-black/40"
                            />
                            <Button size="sm" className="h-7 px-2 bg-primary" onClick={() => updateToken(npc.id)}><Save size={10} /></Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingToken(null)}><X size={10} /></Button>
                          </div>
                        ) : (
                          <p className="text-[10px] italic text-muted-foreground line-clamp-1">"{npc.description}"</p>
                        )}
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="factions" className="flex-1 flex flex-col mt-4 space-y-4 overflow-hidden">
          <Button 
            onClick={handleGenerateFaction} 
            disabled={loading || !activeSession}
            className="w-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 gap-2 h-10"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Target size={16} />}
            Criar Nova Facção
          </Button>

          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {factions?.map((faction) => (
                <Card key={faction.id} className="bg-black/20 border-white/5 group hover:border-cyan-500/30 transition-all">
                  <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xs font-bold text-cyan-400">{faction.name}</CardTitle>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{faction.powerLevel} • {faction.alignment}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete('factions', faction.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{faction.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
