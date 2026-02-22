'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Loader2, Save, Sparkles, Trash2, ChevronRight, UserCircle, Target, Map as MapIcon, Terminal, Check, X, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateNpc } from '@/ai/flows/generate-npc-flow';
import { generateFaction } from '@/ai/flows/generate-faction-flow';
import { generateLocation } from '@/ai/flows/generate-location-flow';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NpcFactionManagerToolProps {
  activeSession: any | null;
  setGlobalLoading: (loading: boolean) => void;
}

export function NpcFactionManagerTool({ activeSession, setGlobalLoading }: NpcFactionManagerToolProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [copiedMacro, setCopiedMacro] = useState<string | null>(null);
  const [copiedImport, setCopiedImport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('npcs');

  const npcsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeSession) return null;
    return collection(db, `users/${user.uid}/campaigns/default-campaign/npcs`);
  }, [db, user, activeSession]);

  const factionsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeSession) return null;
    return collection(db, `users/${user.uid}/campaigns/default-campaign/factions`);
  }, [db, user, activeSession]);

  const locationsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeSession) return null;
    return collection(db, `users/${user.uid}/campaigns/default-campaign/locations`);
  }, [db, user, activeSession]);

  const { data: npcs } = useCollection(npcsQuery);
  const { data: factions } = useCollection(factionsQuery);
  const { data: locations } = useCollection(locationsQuery);

  useEffect(() => {
    if (activeSession?.activeContext?.targetTool === 'entities') {
      const { type, name, context } = activeSession.activeContext.data;
      
      // Auto-trigger generation based on context
      if (type === 'npc') {
        setActiveTab('npcs');
        handleGenerateNpc(name, context);
      } else if (type === 'location') {
        setActiveTab('locations');
        handleGenerateLocation(name, context);
      }

      // Clear context
      if (db && user && activeSession.id) {
        updateDoc(doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`), {
          'activeContext': null
        });
      }
    }
  }, [activeSession?.activeContext]);

  const handleGenerateNpc = async (nameOverride?: string, contextOverride?: string) => {
    if (!activeSession) return;
    setGlobalLoading(true);
    try {
      const result = await generateNpc({ 
        context: contextOverride || activeSession.worldLore,
        role: nameOverride ? `Named as: ${nameOverride}` : undefined
      });
      const npcId = `npc-${Date.now()}`;
      const npcRef = doc(db!, `users/${user!.uid}/campaigns/default-campaign/npcs/${npcId}`);
      
      const npcData = {
        ...result,
        name: nameOverride || result.name,
        id: npcId,
        campaignId: 'default-campaign',
        ownerId: user!.uid,
        dateCreated: new Date().toISOString(),
        dateLastModified: new Date().toISOString(),
        tokenImageUrl: '',
        factionIds: []
      };

      await setDoc(npcRef, npcData);
      toast({ title: "NPC Manifestado!", description: `${npcData.name} foi adicionado ao seu mundo.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível manifestar o NPC." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleGenerateLocation = async (nameOverride?: string, contextOverride?: string) => {
    if (!activeSession) return;
    setGlobalLoading(true);
    try {
      const result = await generateLocation({ 
        context: contextOverride || activeSession.worldLore,
        type: nameOverride ? `Called: ${nameOverride}` : undefined
      });
      const locationId = `loc-${Date.now()}`;
      const locRef = doc(db!, `users/${user!.uid}/campaigns/default-campaign/locations/${locationId}`);
      
      const locData = {
        ...result,
        name: nameOverride || result.name,
        id: locationId,
        campaignId: 'default-campaign',
        ownerId: user!.uid,
        dateCreated: new Date().toISOString(),
        dateLastModified: new Date().toISOString(),
        mapImageUrl: '',
      };

      await setDoc(locRef, locData);
      toast({ title: "Local Mapeado!", description: `${locData.name} agora existe no mundo.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível mapear o local." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleGenerateFaction = async () => {
    if (!activeSession) return;
    setGlobalLoading(true);
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
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível criar a facção." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!user || !db) return;
    setGlobalLoading(true);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/campaigns/default-campaign/${type}/${id}`));
      toast({ title: "Registro Apagado", description: "O item foi removido do seu mundo." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const copyText = (text: string, type: 'macro' | 'import') => {
    navigator.clipboard.writeText(text);
    if (type === 'macro') setCopiedMacro(text);
    else setCopiedImport(text);
    toast({ title: type === 'macro' ? "Visualização Copiada!" : "Importação Copiada!" });
    setTimeout(() => {
      if (type === 'macro') setCopiedMacro(null);
      else setCopiedImport(null);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-black/40 border border-white/5 w-full grid grid-cols-3">
          <TabsTrigger value="npcs" className="gap-1 text-[9px] uppercase font-bold tracking-widest"><UserCircle size={12} /> NPCs</TabsTrigger>
          <TabsTrigger value="factions" className="gap-1 text-[9px] uppercase font-bold tracking-widest"><Shield size={12} /> Facções</TabsTrigger>
          <TabsTrigger value="locations" className="gap-1 text-[9px] uppercase font-bold tracking-widest"><MapIcon size={12} /> Locais</TabsTrigger>
        </TabsList>

        <TabsContent value="npcs" className="flex-1 flex flex-col mt-4 space-y-3 overflow-hidden">
          <Button onClick={() => handleGenerateNpc()} className="w-full bg-primary/20 border-primary/40 text-accent h-9">
            <Sparkles size={14} className="mr-2" /> Gerar NPC Aleatório
          </Button>
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {npcs?.map((npc) => (
                <Card key={npc.id} className="bg-black/20 border-white/5 overflow-hidden group">
                  <div className="flex">
                    <div className="w-16 h-16 bg-white/5 border-r border-white/5 flex items-center justify-center relative">
                      <UserCircle size={24} className="text-muted-foreground/20" />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-accent">{npc.name}</h4>
                          <p className="text-[9px] text-muted-foreground uppercase">{npc.race} • {npc.dndClass}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => copyText(npc.roll20Macro, 'macro')}>
                            {copiedMacro === npc.roll20Macro ? <Check size={12} /> : <Terminal size={12} />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-accent" onClick={() => copyText(npc.roll20Import, 'import')}>
                            {copiedImport === npc.roll20Import ? <Check size={12} /> : <Download size={12} />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete('npcs', npc.id)}><Trash2 size={12} /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {(!npcs || npcs.length === 0) && (
                <div className="py-12 text-center text-muted-foreground italic text-xs border border-dashed border-white/5 rounded-xl">
                  Nenhum NPC manifestado. Use a Sessão Ativa para descobrir novos personagens!
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="factions" className="flex-1 flex flex-col mt-4 space-y-3 overflow-hidden">
          <Button onClick={handleGenerateFaction} className="w-full bg-cyan-500/10 border-cyan-500/30 text-cyan-400 h-9">
            <Target size={14} className="mr-2" /> Criar Facção
          </Button>
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {factions?.map((faction) => (
                <Card key={faction.id} className="bg-black/20 border-white/5 p-3 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-cyan-400">{faction.name}</h4>
                      <p className="text-[9px] text-muted-foreground uppercase">{faction.powerLevel} • {faction.alignment}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete('factions', faction.id)}><Trash2 size={12} /></Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic">"{faction.description}"</p>
                </Card>
              ))}
              {(!factions || factions.length === 0) && (
                <div className="py-12 text-center text-muted-foreground italic text-xs border border-dashed border-white/5 rounded-xl">
                  Crie facções para dar peso político ao seu mundo.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="locations" className="flex-1 flex flex-col mt-4 space-y-3 overflow-hidden">
          <Button onClick={() => handleGenerateLocation()} className="w-full bg-green-500/10 border-green-500/30 text-green-400 h-9">
            <MapIcon size={14} className="mr-2" /> Gerar Local Aleatório
          </Button>
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {locations?.map((loc) => (
                <Card key={loc.id} className="bg-black/20 border-white/5 overflow-hidden group">
                  <div className="flex">
                    <div className="w-16 h-16 bg-white/5 border-r border-white/5 flex items-center justify-center relative">
                      <MapIcon size={24} className="text-muted-foreground/20" />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-green-400">{loc.name}</h4>
                          <p className="text-[9px] text-muted-foreground uppercase">{loc.type}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete('locations', loc.id)}><Trash2 size={12} /></Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">{loc.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {(!locations || locations.length === 0) && (
                <div className="py-12 text-center text-muted-foreground italic text-xs border border-dashed border-white/5 rounded-xl">
                  Mapeie tavernas, ruínas e cidades para expandir o mapa.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
