'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { BookOpen, Map as MapIcon, Users, Castle, Flame, Hash, Shield, ScrollText } from 'lucide-react';

export default function PlayerView() {
    const params = useParams();
    const campaignId = params?.campaignId as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [npcs, setNpcs] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [factions, setFactions] = useState<any[]>([]);
    const [quests, setQuests] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lore' | 'map' | 'quests' | 'npcs' | 'locations' | 'factions'>('lore');
    const [selectedEntity, setSelectedEntity] = useState<any>(null);

    useEffect(() => {
        async function fetchCampaignData() {
            if (!campaignId) return;
            try {
                // To fetch securely without auth, we might need a Firebase Function or 
                // ensure the Firestore rules allow read access to this specific campaign document
                // if it's marked as public. For this prototype, we'll try direct read assuming
                // "mestreAju" structure allows it or rules will be updated.
                // Alternatively, we search all users for this campaign ID.

                // Let's assume the campaign ID is unique enough to find it via a collectionGroup query
                // Or to simplify, we might need the full path. Since we don't have the user ID easily, 
                // an Edge Function or a more open rule on `campaigns` is needed.
                // For now, let's implement a placeholder that tells the user we need their UID in the URL 
                // OR we use a collectionGroup query (which requires an index).

                // Assuming we use a URL like /player-view/USER_ID_CAMPAIGN_ID_SESSION_ID
                const parts = campaignId.split('_');
                if (parts.length < 3) {
                    setLoading(false);
                    return;
                }
                const uid = parts[0];
                const campId = parts[1];
                const sessionId = parts.slice(2).join('_');

                const { firestore: db } = initializeFirebase();
                const campaignRef = doc(db, `users/${uid}/campaigns/${campId}`);
                const campSnap = await getDoc(campaignRef);

                const sessionRef = doc(db, `users/${uid}/campaigns/default-campaign/sessions/${sessionId}`);
                const sessionSnap = await getDoc(sessionRef);

                if (campSnap.exists() && sessionSnap.exists()) {
                    const sessionData = sessionSnap.data();
                    const campData = campSnap.data();

                    // Merge session override data into campaign data for the view
                    setCampaign({
                        ...campData,
                        worldLore: sessionData.worldLore || campData.worldLore,
                        activeConflicts: sessionData.activeConflicts || campData.activeConflicts,
                        overview: campData.overview || {}
                    });

                    const npcsSnap = await getDocs(collection(db, `users/${uid}/campaigns/${campId}/npcs`));
                    setNpcs(npcsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                    const locSnap = await getDocs(collection(db, `users/${uid}/campaigns/${campId}/locations`));
                    setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                    const factionSnap = await getDocs(collection(db, `users/${uid}/campaigns/${campId}/factions`));
                    setFactions(factionSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                    const questsSnap = await getDocs(collection(db, `users/${uid}/campaigns/${campId}/quests`));
                    setQuests(questsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((q: any) => q.isPublic === true));
                }
            } catch (e) {
                console.error("Error fetching player view data:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchCampaignData();
    }, [campaignId]);

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-primary animate-pulse">Carregando Grimório do Jogador...</div>;

    if (!campaign) return <div className="min-h-screen bg-background flex items-center justify-center text-red-400">Campanha não encontrada. Verifique o link.</div>;

    const tabs = [
        { id: 'lore', label: 'História', icon: BookOpen },
        { id: 'map', label: 'Mapa', icon: MapIcon },
        { id: 'quests', label: 'Missões', icon: ScrollText },
        { id: 'npcs', label: 'Personagens', icon: Users },
        { id: 'locations', label: 'Lugares', icon: MapIcon },
        { id: 'factions', label: 'Facções', icon: Castle },
    ];

    const getList = () => {
        if (activeTab === 'quests') return quests;
        if (activeTab === 'npcs') return npcs;
        if (activeTab === 'locations') return locations;
        if (activeTab === 'factions') return factions;
        return [];
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookOpen className="text-primary w-6 h-6" />
                    <div>
                        <h1 className="font-headline font-bold text-lg md:text-xl text-white tracking-tight leading-none">Portal do Jogador</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">{campaign.worldName || 'Campanha'}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Navigation Menu */}
                <nav className="space-y-2 md:col-span-1 border-r border-white/5 pr-4 h-[calc(100vh-120px)] sticky top-24">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as any); setSelectedEntity(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-headline tracking-wide ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Content Area */}
                <div className="md:col-span-3 min-h-[60vh]">
                    {activeTab === 'lore' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-headline font-bold text-white tracking-tight mb-2">Conhecimento Global</h2>
                                <p className="text-muted-foreground">O que todos sabem sobre o mundo.</p>
                            </div>

                            {campaign.worldLore ? (
                                <div className="prose prose-invert prose-emerald max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: campaign.worldLore.replace(/\n/g, '<br/>') }} />
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">A biblioteca está vazia.</p>
                            )}

                            {/* Public Conflicts */}
                            {(campaign.activeConflicts && campaign.activeConflicts.length > 0) && (
                                <div className="mt-12 space-y-4">
                                    <h3 className="text-xl font-headline font-bold text-orange-400 flex items-center gap-2"><Flame size={20} /> Tensões Atuais</h3>
                                    <div className="grid gap-4">
                                        {campaign.activeConflicts.map((c: string, i: number) => (
                                            <div key={i} className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl text-sm text-orange-200/80">
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'map' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-headline font-bold text-white tracking-tight mb-2">Cartografia do Mundo</h2>
                                <p className="text-muted-foreground">O mapa conhecido do seu destino.</p>
                            </div>

                            {campaign.mapImageUrl ? (
                                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                                    <img
                                        src={campaign.mapImageUrl}
                                        alt="Mapa do Mundo"
                                        className="w-full h-auto object-contain cursor-crosshair"
                                        onClick={() => window.open(campaign.mapImageUrl, '_blank')}
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-muted-foreground/30 bg-white/[0.02]">
                                    <MapIcon size={48} className="mb-4 opacity-10" />
                                    <p className="font-headline tracking-widest uppercase text-xs">Mapa Indisponível</p>
                                </div>
                            )}

                            {campaign.mapDescription && (
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-3">
                                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Geografia Conhecida</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">{campaign.mapDescription}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab !== 'lore' && activeTab !== 'map' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-160px)]">
                            {/* List */}
                            <div className="lg:col-span-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                {getList().map((item: any) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedEntity(item)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border ${selectedEntity?.id === item.id ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                                    >
                                        <h3 className="font-headline font-bold text-white truncate">{item.name || item.title}</h3>
                                        <p className="text-xs text-muted-foreground truncate uppercase tracking-widest mt-1">
                                            {item.role || item.type || item.ideology || item.status}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {/* Detail */}
                            <div className="lg:col-span-2 glass-card rounded-2xl border-white/5 p-6 md:p-8 overflow-y-auto">
                                {!selectedEntity ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                                        <Hash size={48} className="opacity-20 mb-4" />
                                        <p className="font-headline tracking-widest uppercase text-xs">Selecione um registro</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <header className="space-y-4">
                                            {selectedEntity.imageUrl && (
                                                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 mb-6 group relative">
                                                    <img src={selectedEntity.imageUrl} alt={selectedEntity.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                                </div>
                                            )}
                                            <h2 className="text-4xl font-headline font-bold text-white tracking-tight">{selectedEntity.name || selectedEntity.title}</h2>
                                            <p className="text-xl text-accent font-headline italic">{selectedEntity.role || selectedEntity.type || selectedEntity.ideology || selectedEntity.status}</p>
                                        </header>

                                        {selectedEntity.description && (
                                            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground/90">
                                                <p>{selectedEntity.description}</p>
                                            </div>
                                        )}

                                        {activeTab === 'quests' && (
                                            <div className="space-y-6">
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Objetivo da Missão</h4>
                                                    <p className="text-sm text-muted-foreground">{selectedEntity.objective}</p>
                                                </div>

                                                {selectedEntity.rewards && selectedEntity.rewards.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest">Recompensas</h4>
                                                        <ul className="list-disc list-inside text-sm text-accent/80 space-y-1">
                                                            {selectedEntity.rewards.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Public Goal / Key Features */}
                                        {activeTab === 'npcs' && selectedEntity.publicGoal && (
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Objetivo Conhecido</h4>
                                                <p className="text-sm text-muted-foreground">{selectedEntity.publicGoal}</p>
                                            </div>
                                        )}

                                        {activeTab === 'locations' && selectedEntity.keyFeatures && selectedEntity.keyFeatures.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Características Locais</h4>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                    {selectedEntity.keyFeatures.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {/* DM SECRETS LIKE STATBLOCKS, HAZARDS, SECRETS, AND PREP ARE EXPLICITLY NOT RENDERED HERE */}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
