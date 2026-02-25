import React, { useState } from 'react';
import { NpcData, FactionData, LocationData } from '@/types/worldbuilding';
import { Search, MapPin, Users, Shield, Hash, ChevronRight, Globe, Coins, ScrollText, Hourglass, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import ReactMarkdown from 'react-markdown';

type EntityType = 'world' | 'npcs' | 'locations' | 'factions';

export function WorldGrimoireTool({ activeSession, setGlobalLoading, onContextAction }: any) {
    const [activeTab, setActiveTab] = useState<EntityType>('world');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntityDoc, setSelectedEntityDoc] = useState<any>(null);

    const { user } = useUser();
    const db = useFirestore();

    const campaignPath = user ? `users/${user.uid}/campaigns/default-campaign` : null;

    const factionsQuery = useMemoFirebase(() => user ? query(collection(db, `${campaignPath}/factions`), orderBy('name')) : null, [db, user, campaignPath]);
    const { data: factionsRaw } = useCollection(factionsQuery);
    const factions = factionsRaw || [];

    const npcsQuery = useMemoFirebase(() => user ? query(collection(db, `${campaignPath}/npcs`), orderBy('name')) : null, [db, user, campaignPath]);
    const { data: npcsRaw } = useCollection(npcsQuery);
    const npcs = npcsRaw || [];

    const locationsQuery = useMemoFirebase(() => user ? query(collection(db, `${campaignPath}/locations`), orderBy('name')) : null, [db, user, campaignPath]);
    const { data: locationsRaw } = useCollection(locationsQuery);
    const locations = locationsRaw || [];

    const getIcon = (type: EntityType) => {
        switch (type) {
            case 'world': return <Globe size={16} />;
            case 'locations': return <MapPin size={16} />;
            case 'npcs': return <Users size={16} />;
            case 'factions': return <Shield size={16} />;
        }
    };

    const getEntities = () => {
        let rawEntities: any[] = [];
        if (activeTab === 'npcs') rawEntities = npcs;
        else if (activeTab === 'factions') rawEntities = factions;
        else if (activeTab === 'locations') rawEntities = locations;
        else return [];

        if (!searchTerm) return rawEntities;
        const lowerTerm = searchTerm.toLowerCase();
        return rawEntities.filter(e =>
            e.name?.toLowerCase().includes(lowerTerm) ||
            e.role?.toLowerCase().includes(lowerTerm) ||
            e.type?.toLowerCase().includes(lowerTerm)
        );
    };

    const entities = getEntities();

    const handleExpandWorld = (topic: string) => {
        if (onContextAction) {
            onContextAction('expand-world', { topic });
        }
    };

    return (
        <div className="flex h-full rounded-xl overflow-hidden bg-black/20 border border-white/5">
            {/* 1. Sidebar Fina (Navegação de Categorias) */}
            <div className="w-16 bg-black/40 border-r border-white/5 flex flex-col items-center py-4 space-y-4 shrink-0">
                {(['world', 'npcs', 'locations', 'factions'] as EntityType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => { setActiveTab(type); setSelectedEntityDoc(null); }}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            activeTab === type ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        )}
                        title={type.toUpperCase()}
                    >
                        {getIcon(type)}
                    </button>
                ))}
            </div>

            {/* 2. Painel Intermediário (Lista de Entidades) - Only show if not 'world' */}
            {activeTab !== 'world' && (
                <div className="w-72 bg-card/40 border-r border-white/5 flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/5 space-y-3">
                        <h3 className="font-headline font-bold text-accent uppercase text-xs tracking-widest flex items-center gap-2">
                            {getIcon(activeTab)} {activeTab}
                        </h3>
                        <div className="relative">
                            <Search size={14} className="absolute inset-y-0 left-3 my-auto text-muted-foreground" />
                            <Input
                                placeholder={`Pesquisar ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-8 text-xs bg-black/40 border-white/5"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {entities.map((item: any) => (
                            <button
                                key={item.id || item.name}
                                onClick={() => setSelectedEntityDoc(item)}
                                className={cn(
                                    "w-full text-left px-3 py-3 rounded-lg flex items-center justify-between group transition-colors",
                                    selectedEntityDoc?.name === item.name
                                        ? "bg-white/10 border border-white/10"
                                        : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="flex flex-col truncate pr-2">
                                    <span className="font-bold text-sm text-foreground truncate">{item.name}</span>
                                    <span className="text-[10px] text-muted-foreground truncate opacity-70">
                                        {item.role || item.type || item.ideology || 'Unknown'}
                                    </span>
                                </div>
                                <ChevronRight size={14} className={cn(
                                    "transition-transform",
                                    selectedEntityDoc?.name === item.name ? "text-accent translate-x-1" : "text-muted-foreground/30 group-hover:text-muted-foreground"
                                )} />
                            </button>
                        ))}
                        {entities.length === 0 && (
                            <div className="p-4 text-center text-xs text-muted-foreground italic">
                                Nenhum dado encontrado.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Área Principal */}
            <div className="flex-1 bg-black/10 overflow-y-auto p-6 md:p-8 relative custom-scrollbar">

                {activeTab === 'world' ? (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
                        {/* World Header & Expansion Hub */}
                        <div className="space-y-6">
                            <header className="space-y-3 border-b border-white/10 pb-6">
                                <div className="flex items-center gap-3 text-primary">
                                    <Globe size={24} />
                                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-primary/80">World Overview</span>
                                </div>
                                <h2 className="text-4xl font-headline font-black text-white tracking-tight">
                                    {activeSession?.title || 'Sandbox Desconhecido'}
                                </h2>
                            </header>

                            {/* Expansion Actions Hub */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Button variant="outline" className="h-20 flex-col gap-2 border-primary/20 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 text-xs text-white/90" onClick={() => handleExpandWorld('economy')}>
                                    <Coins size={18} className="text-amber-400" />
                                    Aprofundar Economia
                                </Button>
                                <Button variant="outline" className="h-20 flex-col gap-2 border-primary/20 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 text-xs text-white/90" onClick={() => handleExpandWorld('politics')}>
                                    <ScrollText size={18} className="text-blue-400" />
                                    Mapa Político
                                </Button>
                                <Button variant="outline" className="h-20 flex-col gap-2 border-primary/20 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 text-xs text-white/90" onClick={() => handleExpandWorld('simulation')}>
                                    <Hourglass size={18} className="text-purple-400" />
                                    Simular 1 Ano
                                </Button>
                                <Button variant="outline" className="h-20 flex-col gap-2 border-primary/20 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 text-xs text-white/90" onClick={() => handleExpandWorld('consequences')}>
                                    <Zap size={18} className="text-red-400" />
                                    Projetar Impactos
                                </Button>
                            </div>
                        </div>

                        {/* World Lore Document */}
                        <div className="prose prose-invert prose-sm md:prose-base max-w-none 
                                        prose-h2:font-headline prose-h2:text-accent prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2 prose-h2:mt-12
                                        prose-p:text-muted-foreground prose-li:text-muted-foreground
                                        prose-strong:text-foreground">
                            {activeSession?.worldLore ? (
                                <ReactMarkdown>{activeSession.worldLore}</ReactMarkdown>
                            ) : (
                                <p className="italic text-muted-foreground/50">Nenhuma lore registrada para esta Crônica.</p>
                            )}
                        </div>
                    </div>
                ) : !selectedEntityDoc ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                        <Hash size={48} className="opacity-20" />
                        <p className="font-headline tracking-widest uppercase text-xs">Selecione uma entidade para visualizar</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
                        <header className="space-y-2 border-b border-primary/20 pb-6">
                            <div className="flex items-center gap-3 text-primary">
                                {getIcon(activeTab)}
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">{activeTab} Record</span>
                            </div>
                            <h2 className="text-4xl font-headline font-bold text-white tracking-tight">
                                {selectedEntityDoc.name}
                            </h2>
                            <p className="text-xl text-accent font-headline italic">
                                {selectedEntityDoc.role || selectedEntityDoc.type || selectedEntityDoc.ideology}
                            </p>
                        </header>

                        {/* Renderização Dinâmica Simples baseada nas chaves */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(selectedEntityDoc).map(([key, value]) => {
                                if (key === 'id' || key === 'name' || key === 'ownerId' || key === 'createdAt' || key === 'role' || key === 'type') return null;

                                return (
                                    <div key={key} className="glass-card p-5 rounded-2xl border-white/5 space-y-2 hover:border-white/10 transition-colors">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </h4>
                                        {Array.isArray(value) ? (
                                            <ul className="list-disc pl-4 space-y-1">
                                                {value.map((v, i) => <li key={i} className="text-sm text-foreground/90">{v}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-foreground/90 leading-relaxed">
                                                {String(value)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
