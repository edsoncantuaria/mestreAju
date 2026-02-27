import React, { useState, useRef } from 'react';
import { Search, MapPin, Map as MapIcon, Users, Shield as ShieldIcon, Hash, ChevronRight, Globe, Coins, ScrollText, Hourglass, Zap, Dices, Sparkles, ShieldAlert, Newspaper, Anchor, Flame, Lock, Plus, PenTool, Image as ImageIcon, Copy, Download, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type EntityType = 'world' | 'prep' | 'npcs' | 'locations' | 'factions' | 'quests';

export function WorldGrimoireTool({ activeSession, setGlobalLoading, onContextAction }: any) {
    const [activeTab, setActiveTab] = useState<EntityType>('world');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntityDoc, setSelectedEntityDoc] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const tokenCanvasRef = useRef<HTMLCanvasElement>(null);

    const { user } = useUser();
    const db = useFirestore();

    const campaignPath = user && activeSession?.campaignId
        ? `users/${user.uid}/campaigns/${activeSession.campaignId}`
        : user ? `users/${user.uid}/campaigns/default-campaign` : null;

    const factionsQuery = useMemoFirebase(() => user ? query(collection(db, `${campaignPath}/factions`), orderBy('name')) : null, [db, user, campaignPath]);
    const { data: factionsRaw } = useCollection(factionsQuery);
    const factions = factionsRaw || [];

    const npcsQuery = useMemoFirebase(() => user ? query(collection(db, `${campaignPath}/npcs`), orderBy('name')) : null, [db, user, campaignPath]);
    const { data: npcsRaw } = useCollection(npcsQuery);
    const npcs = npcsRaw || [];

    const locationsQuery = useMemoFirebase(() => user ? query(collection(db, `${campaignPath}/locations`), orderBy('name')) : null, [db, user, campaignPath]);
    const { data: locationsRaw } = useCollection(locationsQuery);
    const locations = locationsRaw || [];

    const questsQuery = useMemoFirebase(() => user ? query(collection(db, `${campaignPath}/quests`), orderBy('createdAt', 'desc')) : null, [db, user, campaignPath]);
    const { data: questsRaw } = useCollection(questsQuery);
    const quests = questsRaw || [];

    const getIcon = (type: EntityType) => {
        switch (type) {
            case 'world': return <Globe size={16} />;
            case 'prep': return <Dices size={16} />;
            case 'locations': return <MapPin size={16} />;
            case 'npcs': return <Users size={16} />;
            case 'factions': return <ShieldIcon size={16} />;
            case 'quests': return <ScrollText size={16} />;
        }
    };

    const getEntities = () => {
        let rawEntities: any[] = [];
        if (activeTab === 'npcs') rawEntities = npcs;
        else if (activeTab === 'factions') rawEntities = factions;
        else if (activeTab === 'locations') rawEntities = locations;
        else if (activeTab === 'quests') rawEntities = quests;
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

    const handleSaveWorldLore = async () => {
        if (!db || !user || !campaignPath) return;
        setIsSaving(true);
        try {
            const campaignRef = doc(db, campaignPath);
            await updateDoc(campaignRef, {
                worldLore: editedData,
                dateLastModified: new Date().toISOString()
            });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEntity = async () => {
        if (!db || !user || !campaignPath || !selectedEntityDoc) return;
        setIsSaving(true);
        try {
            const entityRef = doc(db, `${campaignPath}/${activeTab}/${selectedEntityDoc.id}`);
            await updateDoc(entityRef, {
                ...editedData,
                dateLastModified: new Date().toISOString()
            });
            setSelectedEntityDoc({ ...selectedEntityDoc, ...editedData });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddNew = async () => {
        if (!db || !user || !campaignPath) return;
        setIsSaving(true);
        try {
            const initialData: any = {
                name: "Novo " + activeTab.slice(0, -1),
                createdAt: serverTimestamp(),
                ownerId: user.uid
            };

            if (activeTab === 'npcs') initialData.role = "NPC";
            if (activeTab === 'locations') initialData.type = "Local";
            if (activeTab === 'factions') initialData.ideology = "Ideologia";
            if (activeTab === 'quests') {
                initialData.title = "Nova Missão";
                initialData.status = "active";
            }

            const colRef = collection(db, `${campaignPath}/${activeTab}`);
            const docRef = await addDoc(colRef, initialData);
            const newEntity = { ...initialData, id: docRef.id };
            setSelectedEntityDoc(newEntity);
            setEditedData(newEntity);
            setIsEditing(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCrosslink = (type: 'npcs' | 'locations', nameRaw: string) => {
        const name = nameRaw.replace(/[@#]/g, '').trim().toLowerCase();
        const targetList = type === 'npcs' ? npcs : locations;
        const found = targetList.find(item => item.name?.toLowerCase() === name);
        if (found) {
            setActiveTab(type);
            setSelectedEntityDoc(found);
            setIsEditing(false);
            setSearchTerm('');
        } else {
            // Optional: Show a subtle toast that the entity wasn't found
            console.log(`Entity ${name} not found in ${type}`);
        }
    };

    const handleGenerateArtPrompt = (entity: any, type: 'npcs' | 'locations') => {
        let prompt = '';
        if (type === 'npcs') {
            prompt = `Masterpiece, 8k resolution, cinematic lighting, dramatic D&D character portrait. Name: ${entity.name}. Role: ${entity.role || 'Unknown'}. Public Goal: ${entity.publicGoal || 'Unknown'}. Visuals: highly detailed face, fantasy clothing, intricate armor or robes, atmospheric background. Style: Greg Rutkowski, digital painting, trending on ArtStation.`;
        } else {
            prompt = `Masterpiece, 8k resolution, sprawling epic landscape, D&D environment concept art. Name: ${entity.name}. Type: ${entity.type || 'Unknown'}. Description: ${entity.description || 'Unknown'}. Key Features: ${(entity.keyFeatures || []).join(', ')}. Atmosphere: ${(entity.regionalEffects || []).join(', ')}. Style: Craig Mullins, photorealistic, matte painting, breathtaking scale.`;
        }
        navigator.clipboard.writeText(prompt);
    };

    const handleGenerateToken = (imageUrl: string, name: string) => {
        if (!tokenCanvasRef.current || !imageUrl) return;
        const canvas = tokenCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "Anonymous"; // Try to avoid CORS issues if possible, though Firebase Storage might need CORS config
        img.onload = () => {
            const size = 512;
            canvas.width = size;
            canvas.height = size;

            // Clear canvas
            ctx.clearRect(0, 0, size, size);

            // Draw circular clipping path
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Draw image covering the circle
            const scale = Math.max(size / img.width, size / img.height);
            const x = (size - img.width * scale) / 2;
            const y = (size - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Draw VTT Token Ring Border
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
            ctx.lineWidth = 20;
            ctx.strokeStyle = '#4b5563'; // Tailwind gray-600
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#9ca3af'; // Tailwind gray-400
            ctx.stroke();

            // Trigger download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${name.replace(/\s+/g, '_').toLowerCase()}_token.png`;
            link.href = dataUrl;
            link.click();
        };
        img.src = imageUrl;
    };

    return (
        <div className="flex h-full rounded-xl overflow-hidden bg-black/20 border border-white/5">
            {/* 1. Sidebar Fina (Navegação de Categorias) */}
            <div className="w-16 bg-black/40 border-r border-white/5 flex flex-col items-center py-4 space-y-4 shrink-0">
                {(['world', 'prep', 'quests', 'npcs', 'locations', 'factions'] as EntityType[]).map((type) => (
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
                        <Button
                            size="sm"
                            variant="outline"
                            className="mx-4 h-7 text-[9px] uppercase font-bold border-primary/30 text-primary hover:bg-primary/10 gap-1"
                            onClick={handleAddNew}
                        >
                            <Plus size={10} /> Novo {activeTab.slice(0, -1)}
                        </Button>
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
                                <div className="flex justify-end gap-2 mt-2">
                                    {isEditing ? (
                                        <>
                                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                            <Button size="sm" className="text-xs h-7 bg-primary" onClick={handleSaveWorldLore} disabled={isSaving}>
                                                {isSaving ? "Salvando..." : "Salvar Alterações"}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" className="text-xs h-7 border-white/10" onClick={() => {
                                            setEditedData(activeSession?.worldLore || '');
                                            setIsEditing(true);
                                        }}>
                                            <PenTool size={12} className="mr-1" /> Editar Lore
                                        </Button>
                                    )}
                                </div>
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
                                <Button
                                    variant="outline"
                                    className="h-20 flex-col gap-2 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/50 text-xs text-white/90"
                                    onClick={() => {
                                        if (user && activeSession?.id) {
                                            const url = `${window.location.origin}/player-view/${user.uid}_${activeSession.id}`;
                                            navigator.clipboard.writeText(url);
                                            // Optional: Toast notification here if you have a toast function available
                                        }
                                    }}
                                >
                                    <Link2 size={18} className="text-emerald-400" />
                                    Copiar Link do Portal do Jogador
                                </Button>
                            </div>
                        </div>

                        {/* World Lore Document */}
                        <div className="prose prose-invert prose-sm md:prose-base max-w-none 
                                        prose-h2:font-headline prose-h2:text-accent prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2 prose-h2:mt-12
                                        prose-p:text-muted-foreground prose-li:text-muted-foreground
                                        prose-strong:text-foreground">
                            {isEditing ? (
                                <textarea
                                    value={editedData}
                                    onChange={(e) => setEditedData(e.target.value)}
                                    className="w-full h-[500px] bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-sans text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none resize-none custom-scrollbar"
                                    placeholder="Escreva a lore do mundo aqui (formato Markdown)..."
                                />
                            ) : activeSession?.worldLore ? (
                                <ReactMarkdown>{activeSession.worldLore}</ReactMarkdown>
                            ) : (
                                <p className="italic text-muted-foreground/50">Nenhuma lore registrada para esta Crônica.</p>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'prep' ? (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
                        <header className="space-y-2 border-b border-white/10 pb-6">
                            <div className="flex items-center gap-3 text-accent">
                                <Dices size={24} />
                                <span className="text-xs uppercase tracking-[0.2em] font-bold opacity-80">Session Preparedness</span>
                            </div>
                            <h2 className="text-4xl font-headline font-black text-white tracking-tight">
                                Preparação da Sessão
                            </h2>
                            <p className="text-muted-foreground">Boatos, Encontros e Tesouros gerados para esta crônica.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Rumor Table */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                    <Newspaper size={12} /> Tabela de Boatos (d10)
                                </h4>
                                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white/5">
                                            <tr>
                                                <th className="p-3 text-[9px] font-bold text-muted-foreground uppercase">Rumor</th>
                                                <th className="p-3 text-[9px] font-bold text-muted-foreground uppercase text-center w-20">Veracidade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {(activeSession?.rumorTable || []).map((item: any, i: number) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-3">
                                                        <p className="text-[11px] text-white/90 leading-tight group-hover:text-white transition-colors">{item.rumor}</p>
                                                        <p className="text-[9px] text-muted-foreground italic mt-1 opacity-70">— {item.source}</p>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={cn(
                                                            "text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                                                            item.truthLevel === 'true' && "bg-green-500/20 text-green-400 border border-green-500/20",
                                                            item.truthLevel === 'false' && "bg-red-500/20 text-red-400 border border-red-500/20",
                                                            item.truthLevel === 'partial' && "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                                        )}>
                                                            {item.truthLevel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Encounters & Loot */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={12} /> Encontros Ativos
                                    </h4>
                                    <div className="space-y-3">
                                        {(activeSession?.thematicEncounters || []).map((enc: any, i: number) => (
                                            <div key={i} className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2 hover:border-accent/30 transition-all group">
                                                <h5 className="text-[11px] font-bold text-white uppercase group-hover:text-accent transition-colors">{enc.title}</h5>
                                                <p className="text-[11px] text-muted-foreground leading-snug">{enc.description}</p>
                                                <div className="pt-2 flex flex-wrap items-center gap-3">
                                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded">
                                                        <span className="text-[8px] font-bold text-accent uppercase">Gatilho:</span>
                                                        <span className="text-[10px] text-white/70">{enc.trigger}</span>
                                                    </div>
                                                    {enc.combatStats && (
                                                        <div className="flex items-center gap-1.5 bg-destructive/10 px-2 py-0.5 rounded">
                                                            <span className="text-[8px] font-bold text-destructive uppercase">Stats:</span>
                                                            <span className="text-[10px] text-destructive-foreground/80 font-mono">{enc.combatStats}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                        <Coins size={12} /> Padrões de Recompensa
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {(activeSession?.lootPatterns || []).map((loot: any, i: number) => (
                                            <Card key={i} className="border-white/5 bg-black/40 rounded-2xl overflow-hidden shadow-lg border">
                                                <CardHeader className="py-2.5 px-4 bg-white/[0.03] border-b border-white/5">
                                                    <CardTitle className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                                        {loot.category}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {loot.items?.map((item: string, idx: number) => (
                                                            <span key={idx} className="text-[10px] text-white/90 bg-white/5 border border-white/5 px-3 py-1 rounded-full flex items-center gap-2">
                                                                <span className="w-1 h-1 rounded-full bg-primary" /> {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                        <Anchor size={12} /> Ganchos de Aventura
                                    </h4>
                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                                        {(activeSession?.adventureHooks || []).map((hook: any, i: number) => (
                                            <div key={i} className="flex gap-3 group">
                                                <span className="text-primary font-bold opacity-40 group-hover:opacity-100 transition-opacity">•</span>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed group-hover:text-white transition-colors">
                                                    {typeof hook === 'string' ? hook : hook.hook}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={12} /> Segredos (DMs Only)
                                    </h4>
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
                                        {(activeSession?.worldSecrets || []).map((secret: string, i: number) => (
                                            <div key={i} className="flex gap-3 text-[11px]">
                                                <span className="text-red-400 font-bold opacity-60">!</span>
                                                <p className="text-red-200/80 italic leading-relaxed">{secret}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Conflicts - Bottom Wide Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                <Flame size={12} /> Conflitos Ativos & Tensões
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(activeSession?.activeConflicts || []).map((conflict: string, i: number) => (
                                    <div key={i} className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex gap-3 items-start">
                                        <Flame size={14} className="text-orange-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-orange-200/70 leading-relaxed font-medium">{conflict}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : !selectedEntityDoc ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                        <Hash size={48} className="opacity-20" />
                        <p className="font-headline tracking-widest uppercase text-xs">Selecione uma entidade para visualizar</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
                        <header className="space-y-4 border-b border-primary/20 pb-6 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-primary">
                                    {getIcon(activeTab)}
                                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">{activeTab} Record</span>
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                            <Button size="sm" className="text-xs h-7 bg-primary" onClick={handleSaveEntity} disabled={isSaving}>
                                                {isSaving ? "Salvar" : "Salvar"}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" className="text-[10px] h-7 border-white/10 uppercase font-bold tracking-widest" onClick={() => {
                                            setEditedData({ ...selectedEntityDoc });
                                            setIsEditing(true);
                                        }}>
                                            <PenTool size={12} className="mr-1.5" /> Editar
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {isEditing ? (
                                    <Input
                                        value={editedData.name}
                                        onChange={e => setEditedData({ ...editedData, name: e.target.value })}
                                        className="text-4xl font-headline font-bold bg-black/40 border-white/10 h-14"
                                    />
                                ) : (
                                    <h2 className="text-4xl font-headline font-bold text-white tracking-tight">
                                        {selectedEntityDoc.name}
                                    </h2>
                                )}

                                {isEditing ? (
                                    <Input
                                        value={editedData.role || editedData.type || editedData.ideology || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const key = activeTab === 'npcs' ? 'role' : activeTab === 'locations' ? 'type' : 'ideology';
                                            setEditedData({ ...editedData, [key]: val });
                                        }}
                                        className="text-xl text-accent font-headline italic bg-black/40 border-white/10"
                                        placeholder="Subtítulo / Função"
                                    />
                                ) : (
                                    <p className="text-xl text-accent font-headline italic">
                                        {selectedEntityDoc.role || selectedEntityDoc.type || selectedEntityDoc.ideology}
                                    </p>
                                )}
                            </div>
                        </header>

                        {/* Image Gallery & Prompt Area (NPCs & Locations) */}
                        {(activeTab === 'npcs' || activeTab === 'locations') && (
                            <div className="glass-card p-4 rounded-2xl border-white/5 space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon size={14} className="text-purple-400" />
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Galeria Visual</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        {(!isEditing && selectedEntityDoc.imageUrl) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[9px] uppercase font-bold border-purple-500/30 text-purple-400 hover:bg-purple-500/10 gap-1.5"
                                                onClick={() => handleGenerateToken(selectedEntityDoc.imageUrl, selectedEntityDoc.name)}
                                            >
                                                <Download size={10} /> Baixar Token VTT
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[9px] uppercase font-bold text-purple-400 hover:bg-purple-500/10 gap-1.5"
                                            onClick={() => handleGenerateArtPrompt(isEditing ? editedData : selectedEntityDoc, activeTab as 'npcs' | 'locations')}
                                        >
                                            <Copy size={10} /> Gerar Prompt (Nano Banana)
                                        </Button>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">URL da Imagem</p>
                                        <Input
                                            value={editedData.imageUrl || ''}
                                            onChange={e => setEditedData({ ...editedData, imageUrl: e.target.value })}
                                            className="text-xs bg-black/40 border-white/10"
                                            placeholder="https://exemplo.com/imagem.jpg"
                                        />
                                        {editedData.imageUrl && (
                                            <div className="aspect-video lg:aspect-[21/9] rounded-xl overflow-hidden border border-white/10 mt-2">
                                                <img src={editedData.imageUrl} alt={editedData.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    selectedEntityDoc.imageUrl ? (
                                        <div className="aspect-video lg:aspect-[21/9] rounded-xl overflow-hidden border border-white/10 group relative max-h-[400px]">
                                            <img src={selectedEntityDoc.imageUrl} alt={selectedEntityDoc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground italic">Nenhuma imagem registrada. Gere um prompt e adicione a URL da arte na edição.</p>
                                    )
                                )}
                            </div>
                        )}

                        {/* Renderização Dinâmica e Customizada */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Stat Block Custom View (NPCs) */}
                            {(isEditing ? editedData.statBlock : selectedEntityDoc.statBlock) && (
                                <div className="md:col-span-2 glass-card p-6 rounded-2xl border-accent/20 bg-accent/[0.02] space-y-4">
                                    <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                                        <ShieldIcon size={14} className="text-accent" />
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Combat Stat Block</h4>
                                    </div>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 py-2 border-b border-white/5">
                                        <div className="text-center bg-white/5 p-2 rounded-xl">
                                            <p className="text-[8px] uppercase font-bold text-muted-foreground">AC</p>
                                            {isEditing ? (
                                                <Input
                                                    value={editedData.statBlock.ac}
                                                    onChange={e => setEditedData({ ...editedData, statBlock: { ...editedData.statBlock, ac: e.target.value } })}
                                                    className="h-8 text-center bg-black/40 border-white/10"
                                                />
                                            ) : (
                                                <p className="text-lg font-headline font-bold text-white">{selectedEntityDoc.statBlock.ac}</p>
                                            )}
                                        </div>
                                        <div className="text-center bg-white/5 p-2 rounded-xl">
                                            <p className="text-[8px] uppercase font-bold text-muted-foreground">HP</p>
                                            {isEditing ? (
                                                <Input
                                                    value={editedData.statBlock.hp}
                                                    onChange={e => setEditedData({ ...editedData, statBlock: { ...editedData.statBlock, hp: e.target.value } })}
                                                    className="h-8 text-center bg-black/40 border-white/10"
                                                />
                                            ) : (
                                                <p className="text-lg font-headline font-bold text-white">{selectedEntityDoc.statBlock.hp}</p>
                                            )}
                                        </div>
                                        <div className="text-center bg-white/5 p-2 rounded-xl">
                                            <p className="text-[8px] uppercase font-bold text-muted-foreground">Speed</p>
                                            {isEditing ? (
                                                <Input
                                                    value={editedData.statBlock.speed}
                                                    onChange={e => setEditedData({ ...editedData, statBlock: { ...editedData.statBlock, speed: e.target.value } })}
                                                    className="h-8 text-center bg-black/40 border-white/10"
                                                />
                                            ) : (
                                                <p className="text-[10px] font-bold text-white leading-tight mt-1">{selectedEntityDoc.statBlock.speed}</p>
                                            )}
                                        </div>
                                        <div className="text-center bg-white/5 p-2 rounded-xl">
                                            <p className="text-[8px] uppercase font-bold text-muted-foreground">CR</p>
                                            {isEditing ? (
                                                <Input
                                                    value={editedData.statBlock.cr}
                                                    onChange={e => setEditedData({ ...editedData, statBlock: { ...editedData.statBlock, cr: e.target.value } })}
                                                    className="h-8 text-center bg-black/40 border-white/10"
                                                />
                                            ) : (
                                                <p className="text-lg font-headline font-bold text-white">{selectedEntityDoc.statBlock.cr}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-6 gap-2">
                                        {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((stat) => (
                                            <div key={stat} className="text-center border border-white/5 rounded-lg py-1.5 ">
                                                <p className="text-[8px] uppercase font-bold text-accent">{stat}</p>
                                                <p className="text-xs font-bold text-white">
                                                    {(isEditing ? editedData.statBlock?.[stat] : selectedEntityDoc.statBlock?.[stat]) || 10}
                                                </p>
                                                {isEditing && (
                                                    <Input
                                                        type="number"
                                                        value={editedData.statBlock?.[stat] || 10}
                                                        onChange={e => setEditedData({ ...editedData, statBlock: { ...editedData.statBlock, [stat]: parseInt(e.target.value) || 10 } })}
                                                        className="h-6 text-center bg-black/40 border-white/10 mt-1 text-[10px]"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Actions</p>
                                        <div className="space-y-2">
                                            {isEditing ? (
                                                <textarea
                                                    value={editedData.statBlock.actions?.join('\n\n') || ''}
                                                    onChange={(e) => {
                                                        const actions = e.target.value.split('\n\n').filter(a => a.trim() !== '');
                                                        setEditedData({ ...editedData, statBlock: { ...editedData.statBlock, actions } });
                                                    }}
                                                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white outline-none resize-none"
                                                    placeholder="Ação 1: Descrição da ação...&#10;&#10;Ação 2: Descrição da ação..."
                                                />
                                            ) : selectedEntityDoc.statBlock.actions?.map((action: string, idx: number) => {
                                                const [name, ...descParts] = action.split(':');
                                                const desc = descParts.join(':').trim();
                                                return (
                                                    <div key={idx} className="p-3 bg-white/5 rounded-xl text-[11px] leading-relaxed">
                                                        <span className="text-white font-bold italic mr-2">{name ? name + ':' : ''}</span>
                                                        <span className="text-muted-foreground">{desc || name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Manifest Map Prompt Helper */}
                            {activeTab === 'locations' && selectedEntityDoc.name && (
                                <div className="md:col-span-2 glass-card p-6 rounded-2xl border-white/5 bg-white/[0.02] space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <MapIcon size={14} className="text-primary" />
                                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Protocolo de Cartografia</h4>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[9px] uppercase font-bold text-primary hover:bg-primary/10"
                                            onClick={() => {
                                                const prompt = `Battlemap: ${selectedEntityDoc.name}. Type: ${selectedEntityDoc.type}. Description: ${selectedEntityDoc.description}. Features: ${selectedEntityDoc.keyFeatures?.join(', ')}. Hazards: ${selectedEntityDoc.hazards?.join(', ')}. Atmosphere: ${selectedEntityDoc.regionalEffects?.join('; ')}. Style: Professional D&D 5e official battlemap, high detail, gridded.`;
                                                navigator.clipboard.writeText(prompt);
                                                // We could also trigger a context action here if needed
                                            }}
                                        >
                                            Copiar Prompt de Mapa
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                        Gere um mapa tático para esta localidade usando o prompt otimizado acima na ferramenta de Cartografia.
                                    </p>
                                </div>
                            )}

                            {/* Quests Detail View */}
                            {activeTab === 'quests' && (isEditing ? editedData : selectedEntityDoc) && (
                                <div className="md:col-span-2 space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                    <select
                                                        value={editedData.status || 'active'}
                                                        onChange={e => setEditedData({ ...editedData, status: e.target.value })}
                                                        className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[9px] uppercase font-bold text-accent outline-none"
                                                    >
                                                        <option value="active">Ativa</option>
                                                        <option value="completed">Concluída</option>
                                                        <option value="failed">Falhou</option>
                                                    </select>
                                                ) : (
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] uppercase font-bold px-2 py-0.5",
                                                        selectedEntityDoc.status === 'completed' ? "border-green-500/30 bg-green-500/10 text-green-400" :
                                                            selectedEntityDoc.status === 'failed' ? "border-red-500/30 bg-red-500/10 text-red-400" :
                                                                "border-accent/30 bg-accent/10 text-accent"
                                                    )}>
                                                        {selectedEntityDoc.status || 'active'}
                                                    </Badge>
                                                )}
                                                {isEditing ? (
                                                    <Input
                                                        value={editedData.title}
                                                        onChange={e => setEditedData({ ...editedData, title: e.target.value })}
                                                        className="text-2xl font-headline font-black bg-black/40 border-white/10"
                                                    />
                                                ) : (
                                                    <h3 className="text-2xl font-headline font-black text-white">{selectedEntityDoc.title}</h3>
                                                )}
                                            </div>
                                            {isEditing ? (
                                                <Input
                                                    value={editedData.hook}
                                                    onChange={e => setEditedData({ ...editedData, hook: e.target.value })}
                                                    className="text-xs italic bg-black/40 border-white/10 mt-2"
                                                    placeholder="Gancho Narrativo..."
                                                />
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic">&ldquo;{selectedEntityDoc.hook}&rdquo;</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-6">
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest">Objetivo Principal</h4>
                                                {isEditing ? (
                                                    <textarea
                                                        value={editedData.objective}
                                                        onChange={e => setEditedData({ ...editedData, objective: e.target.value })}
                                                        className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-foreground outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-foreground leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                                                        {selectedEntityDoc.objective}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest">Recompensas</h4>
                                                {isEditing ? (
                                                    <textarea
                                                        value={editedData.rewards?.join('\n')}
                                                        onChange={e => setEditedData({ ...editedData, rewards: e.target.value.split('\n') })}
                                                        className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-foreground outline-none"
                                                        placeholder="Recompensa 1&#10;Recompensa 2"
                                                    />
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedEntityDoc.rewards?.map((reward: string, i: number) => (
                                                            <div key={i} className="px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-200/80 flex items-center gap-2">
                                                                <Coins size={12} className="text-amber-500" /> {reward}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                                    <Users size={12} /> NPCs Chave
                                                </h4>
                                                {isEditing ? (
                                                    <textarea
                                                        value={editedData.keyNpcs?.join('\n')}
                                                        onChange={e => setEditedData({ ...editedData, keyNpcs: e.target.value.split('\n') })}
                                                        className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-foreground outline-none"
                                                        placeholder="NPC 1&#10;NPC 2"
                                                    />
                                                ) : (
                                                    <div className="space-y-2">
                                                        {selectedEntityDoc.keyNpcs?.map((npc: string, i: number) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleCrosslink('npcs', npc)}
                                                                className="w-full text-left p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/40 hover:bg-primary/10 transition-all group flex justify-between items-center"
                                                            >
                                                                <p className="text-[10px] font-bold text-primary group-hover:text-white transition-colors">@{npc.replace('@', '')}</p>
                                                                <ChevronRight size={12} className="text-primary/50 group-hover:text-white transition-colors" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                                    <MapPin size={12} /> Localidades Chave
                                                </h4>
                                                {isEditing ? (
                                                    <textarea
                                                        value={editedData.keyLocations?.join('\n')}
                                                        onChange={e => setEditedData({ ...editedData, keyLocations: e.target.value.split('\n') })}
                                                        className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-foreground outline-none"
                                                        placeholder="Local 1&#10;Local 2"
                                                    />
                                                ) : (
                                                    <div className="space-y-2">
                                                        {selectedEntityDoc.keyLocations?.map((loc: string, i: number) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleCrosslink('locations', loc)}
                                                                className="w-full text-left p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-400/40 hover:bg-emerald-500/10 transition-all group flex justify-between items-center"
                                                            >
                                                                <p className="text-[10px] font-bold text-emerald-400 group-hover:text-white transition-colors">#{loc.replace('#', '')}</p>
                                                                <ChevronRight size={12} className="text-emerald-400/50 group-hover:text-white transition-colors" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hazards & Effects (Locations) */}
                            {(isEditing ? editedData.hazards : selectedEntityDoc.hazards) && (isEditing || selectedEntityDoc.hazards?.length > 0) && (
                                <div className="md:col-span-2 glass-card p-6 rounded-2xl border-red-500/20 bg-red-500/[0.02] space-y-4">
                                    <div className="flex items-center gap-2 border-b border-red-500/10 pb-2">
                                        <ShieldAlert size={14} className="text-red-400" />
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Hazards & Perigos</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {isEditing ? (
                                            <textarea
                                                value={editedData.hazards?.join('\n\n') || ''}
                                                onChange={(e) => {
                                                    const hazards = e.target.value.split('\n\n').filter((h: string) => h.trim() !== '');
                                                    setEditedData({ ...editedData, hazards });
                                                }}
                                                className="md:col-span-2 w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white outline-none"
                                                placeholder="Perigo 1: Descrição...&#10;&#10;Perigo 2: Descrição..."
                                            />
                                        ) : selectedEntityDoc.hazards.map((h: string, i: number) => {
                                            const [name, ...descParts] = h.split(':');
                                            const desc = descParts.join(':').trim();
                                            return (
                                                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <p className="text-xs font-bold text-white mb-1">{name ? name + ':' : ''}</p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">{desc || name}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {(isEditing ? editedData.regionalEffects : selectedEntityDoc.regionalEffects) && (isEditing || selectedEntityDoc.regionalEffects?.length > 0) && (
                                <div className="md:col-span-2 glass-card p-6 rounded-2xl border-primary/20 bg-primary/[0.02] space-y-4">
                                    <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                                        <Sparkles size={14} className="text-primary" />
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Efeitos Regionais</h4>
                                    </div>
                                    {isEditing ? (
                                        <textarea
                                            value={editedData.regionalEffects?.join('\n')}
                                            onChange={(e) => setEditedData({ ...editedData, regionalEffects: e.target.value.split('\n') })}
                                            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white outline-none"
                                            placeholder="Efeito 1&#10;Efeito 2&#10;Efeito 3"
                                        />
                                    ) : (
                                        <ul className="space-y-2">
                                            {selectedEntityDoc.regionalEffects.map((e: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                    {e}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Outras chaves automáticas */}
                            {Object.entries(isEditing ? editedData : selectedEntityDoc).map(([key, value]) => {
                                if (key === 'id' || key === 'name' || key === 'ownerId' || key === 'createdAt' || key === 'role' || key === 'type' || key === 'statBlock' || key === 'hazards' || key === 'regionalEffects' || key === 'ideology' || key === 'imageUrl') return null;
                                if (!isEditing && (!value || (Array.isArray(value) && value.length === 0))) return null;

                                return (
                                    <div key={key} className="glass-card p-5 rounded-2xl border-white/5 space-y-2 hover:border-white/10 transition-colors">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </h4>
                                        {isEditing ? (
                                            <textarea
                                                value={Array.isArray(value) ? value.join('\n') : String(value || '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditedData({ ...editedData, [key]: Array.isArray(value) ? val.split('\n') : val });
                                                }}
                                                className="w-full bg-black/20 border border-white/5 rounded p-2 text-sm text-white focus:border-primary/30 outline-none resize-y min-h-[60px]"
                                            />
                                        ) : Array.isArray(value) ? (
                                            <ul className="list-disc pl-4 space-y-1">
                                                {value.map((v, i) => <li key={i} className="text-sm text-foreground/90">{String(v)}</li>)}
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

            {/* Hidden canvas for token generation */}
            <canvas ref={tokenCanvasRef} className="hidden" />
        </div>
    );
}
