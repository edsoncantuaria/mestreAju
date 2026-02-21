'use client';

import React, { useState } from 'react';
import { Users, Shield, Plus, Loader2, Save, Sparkles, Trash2, ChevronRight, UserCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateNpc } from '@/ai/flows/generate-npc-flow';
import { generateFaction } from '@/ai/flows/generate-faction-flow';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NpcFactionManagerToolProps {
  activeSession: any | null;
}

export function NpcFactionManagerTool({ activeSession }: NpcFactionManagerToolProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Memoized queries for persistence
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
      };

      await setDoc(npcRef, npcData);
      toast({ title: "NPC Manifestado!", description: `${result.name} foi adicionado ao seu mundo.` });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateNpc} 
              disabled={loading || !activeSession} 
              className="flex-1 bg-primary/20 border border-primary/40 hover:bg-primary/30 text-accent gap-2 h-10"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles size={16} />}
              Gerar NPC Sandbox
            </Button>
          </div>

          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {npcs?.map((npc) => (
                <Card key={npc.id} className="bg-black/20 border-white/5 group hover:border-accent/30 transition-all">
                  <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xs font-bold text-accent">{npc.name}</CardTitle>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{npc.race} • {npc.dndClass}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete('npcs', npc.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-[10px] italic text-muted-foreground line-clamp-2">"{npc.description}"</p>
                    <div className="flex flex-wrap gap-1">
                      <div className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-[8px] font-bold text-accent uppercase">
                        Motivação: {npc.motivations}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!npcs?.length && !loading && (
                <div className="py-20 text-center text-muted-foreground/30 italic text-xs">
                  Nenhum personagem registrado nesta crônica.
                </div>
              )}
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
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold uppercase text-cyan-500/70 tracking-widest">Agendas Atuais:</span>
                      <div className="flex flex-wrap gap-1">
                        {faction.agendas?.map((agenda: string, i: number) => (
                          <div key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] text-muted-foreground">
                            {agenda}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!factions?.length && !loading && (
                <div className="py-20 text-center text-muted-foreground/30 italic text-xs">
                  Nenhuma organização registrada nesta crônica.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
