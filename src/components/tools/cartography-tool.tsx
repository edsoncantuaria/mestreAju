'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin, Palette, Upload, Copy, Check, Loader2, Trash2,
    Plus, ArrowRight, Compass, Download, Sparkles, Image as ImageIcon,
    Mountain, Trees, Castle, Landmark, CloudSun, Clock, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { generateBattlegridPrompt, generateRegionalMapPrompt } from '@/ai/flows/generate-battlegrid-prompt-flow';
import type { BattlegridPromptInput } from '@/ai/flows/generate-battlegrid-prompt-flow';
import { useToast } from '@/hooks/use-toast';

type CartographyTab = 'battlegrid' | 'regional';

const TERRAIN_PRESETS = [
    { value: 'floresta densa', label: 'Floresta Densa', icon: '🌲' },
    { value: 'caverna subterrânea', label: 'Caverna', icon: '🕳️' },
    { value: 'taverna medieval', label: 'Taverna', icon: '🍺' },
    { value: 'praia rochosa', label: 'Praia', icon: '🏖️' },
    { value: 'planície aberta', label: 'Planície', icon: '🌾' },
    { value: 'castelo interior', label: 'Castelo', icon: '🏰' },
    { value: 'ruínas antigas', label: 'Ruínas', icon: '🏛️' },
    { value: 'pântano sombrio', label: 'Pântano', icon: '🌿' },
    { value: 'montanha nevada', label: 'Montanha', icon: '🏔️' },
    { value: 'deserto arenoso', label: 'Deserto', icon: '🏜️' },
    { value: 'porto e docas', label: 'Porto', icon: '⚓' },
    { value: 'templo sagrado', label: 'Templo', icon: '⛩️' },
];

interface CartographyToolProps {
    activeSession: any | null;
    setGlobalLoading: (loading: boolean) => void;
    onContextAction?: (toolId: any, data: any) => void;
}

export function CartographyTool({ activeSession, setGlobalLoading, onContextAction }: CartographyToolProps) {
    const [activeTab, setActiveTab] = useState<CartographyTab>('battlegrid');
    const { user } = useUser();
    const db = useFirestore();
    const { toast } = useToast();

    const campaignPath = user ? `users/${user.uid}/campaigns/default-campaign` : null;

    // Battlegrid State
    const [bgForm, setBgForm] = useState<BattlegridPromptInput>({
        terrain: '',
        keyElements: '',
        timeOfDay: '',
        weather: '',
        mapSize: '25x25',
        style: 'hand-drawn',
        locationContext: '',
    });
    const [generatedPrompt, setGeneratedPrompt] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Context Listener for incoming data from Live Session
    useEffect(() => {
        if (activeSession?.activeContext?.targetTool === 'cartography') {
            const { terrain, context, keyElements } = activeSession.activeContext.data;
            setActiveTab('battlegrid');
            setBgForm(prev => {
                const newState = {
                    ...prev,
                    terrain: terrain || prev.terrain,
                    locationContext: context || prev.locationContext,
                    keyElements: keyElements || prev.keyElements
                };
                persistToolState({ bgForm: newState });
                return newState;
            });

            // Clear context in Firestore
            if (db && user && activeSession.id) {
                updateDoc(doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`), {
                    'activeContext': null
                });
            }
        }
    }, [activeSession?.activeContext, db, user, activeSession?.id]);

    useEffect(() => {
        if (activeSession?.toolStates?.cartography) {
            if (activeSession.toolStates.cartography.bgForm) {
                setBgForm(activeSession.toolStates.cartography.bgForm);
            }
            if (activeSession.toolStates.cartography.activeTab) {
                setActiveTab(activeSession.toolStates.cartography.activeTab);
            }
        }
        if (activeSession?.toolStates?.cartography_bg_result) {
            setGeneratedPrompt(activeSession.toolStates.cartography_bg_result);
        }
    }, [activeSession?.id]);

    const persistToolState = async (updates: any) => {
        if (!db || !user || !activeSession) return;
        const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
        updateDoc(sessionRef, {
            [`toolStates.cartography`]: { bgForm, activeTab, ...updates }
        });
    };

    // Gallery
    const battlemapsQuery = useMemoFirebase(() =>
        (user && campaignPath) ? query(collection(db, `${campaignPath}/battlemaps`)) : null,
        [db, user, campaignPath]
    );
    const { data: battlemapsRaw } = useCollection(battlemapsQuery);
    const battlemaps = battlemapsRaw || [];

    // Locations for regional map
    const locationsQuery = useMemoFirebase(() =>
        (user && campaignPath) ? query(collection(db, `${campaignPath}/locations`)) : null,
        [db, user, campaignPath]
    );
    const { data: locationsRaw } = useCollection(locationsQuery);
    const locations = locationsRaw || [];

    // Routes
    const routesQuery = useMemoFirebase(() =>
        (user && campaignPath) ? query(collection(db, `${campaignPath}/routes`)) : null,
        [db, user, campaignPath]
    );
    const { data: routesRaw } = useCollection(routesQuery);
    const routes = routesRaw || [];

    // Route form
    const [routeForm, setRouteForm] = useState({ from: '', to: '', distanceKm: 0, terrainType: 'estrada', description: '' });
    const [isGenRegionalPrompt, setIsGenRegionalPrompt] = useState(false);
    const [regionalPrompt, setRegionalPrompt] = useState<any>(null);
    const [copiedRegional, setCopiedRegional] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Battlegrid Handlers ──

    const handleGeneratePrompt = async () => {
        if (!bgForm.terrain || !bgForm.keyElements) return;
        setIsGenerating(true);
        setGlobalLoading(true);
        try {
            const result = await generateBattlegridPrompt(bgForm);
            setGeneratedPrompt(result);
            if (db && user && activeSession) {
                const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
                updateDoc(sessionRef, { 'toolStates.cartography_bg_result': result });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao gerar prompt', variant: 'destructive' });
        } finally {
            setIsGenerating(false);
            setGlobalLoading(false);
        }
    };

    const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const handleUploadBattlemap = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !campaignPath) return;

        setIsUploading(true);
        setGlobalLoading(true);
        try {
            const storage = getStorage(getApp());
            const storageRef = ref(storage, `battlemaps/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, `${campaignPath}/battlemaps`), {
                name: file.name.replace(/\.[^/.]+$/, ''),
                imageUrl: downloadUrl,
                prompt: generatedPrompt?.promptEnglish || '',
                terrain: bgForm.terrain,
                ownerId: user.uid,
                createdAt: new Date().toISOString(),
            });

            toast({ title: 'Mapa salvo na galeria!' });
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro no upload', variant: 'destructive' });
        } finally {
            setIsUploading(false);
            setGlobalLoading(false);
        }
    };

    const handleDeleteBattlemap = async (mapId: string) => {
        if (!campaignPath) return;
        try {
            await deleteDoc(doc(db, `${campaignPath}/battlemaps/${mapId}`));
            toast({ title: 'Mapa removido.' });
        } catch (error) {
            console.error(error);
        }
    };

    // ── Regional Map Handlers ──

    const handleAddRoute = async () => {
        if (!routeForm.from || !routeForm.to || !campaignPath || !user) return;
        try {
            await addDoc(collection(db, `${campaignPath}/routes`), {
                ...routeForm,
                ownerId: user.uid
            });
            setRouteForm({ from: '', to: '', distanceKm: 0, terrainType: 'estrada', description: '' });
            toast({ title: 'Rota adicionada!' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteRoute = async (routeId: string) => {
        if (!campaignPath) return;
        try {
            await deleteDoc(doc(db, `${campaignPath}/routes/${routeId}`));
        } catch (error) {
            console.error(error);
        }
    };

    const handleGenerateRegionalPrompt = async () => {
        if (locations.length === 0) return;
        setIsGenRegionalPrompt(true);
        setGlobalLoading(true);
        try {
            const result = await generateRegionalMapPrompt({
                regionName: activeSession?.title || 'Região Desconhecida',
                locations: locations.map((l: any) => ({ name: l.name, type: l.type, description: l.description })),
                routes: routes.map((r: any) => ({ from: r.from, to: r.to, distanceKm: r.distanceKm, terrainType: r.terrainType })),
                biome: activeSession?.overview?.biome || '',
                style: 'parchment, Tolkien-style, fantasy cartography',
            });
            setRegionalPrompt(result);
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao gerar prompt regional', variant: 'destructive' });
        } finally {
            setIsGenRegionalPrompt(false);
            setGlobalLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-3">
            {/* Tab Header */}
            <div className="flex gap-1 p-0.5 bg-black/40 rounded-xl border border-white/5 shrink-0">
                <button
                    onClick={() => { setActiveTab('battlegrid'); persistToolState({ activeTab: 'battlegrid' }); }}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                        activeTab === 'battlegrid' ? "bg-primary/90 text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                    )}
                >
                    <Palette size={12} /> Battlegrid Studio
                </button>
                <button
                    onClick={() => { setActiveTab('regional'); persistToolState({ activeTab: 'regional' }); }}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                        activeTab === 'regional' ? "bg-primary/90 text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                    )}
                >
                    <Compass size={12} /> Mapa Regional
                </button>
            </div>

            <ScrollArea className="flex-1">
                {activeTab === 'battlegrid' ? (
                    <div className="space-y-4 p-1 animate-in fade-in duration-300">

                        {/* Terrain Presets */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Terreno</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {TERRAIN_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => {
                                            const nextForm = { ...bgForm, terrain: preset.value };
                                            setBgForm(nextForm);
                                            persistToolState({ bgForm: nextForm });
                                        }}
                                        className={cn(
                                            "p-2 rounded-lg border text-center transition-all text-[9px]",
                                            bgForm.terrain === preset.value
                                                ? "bg-primary/20 border-primary/50 text-white"
                                                : "border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        <span className="text-base block">{preset.icon}</span>
                                        <span className="truncate">{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                            <Input
                                placeholder="Ou descreva o terreno..."
                                value={bgForm.terrain}
                                onChange={e => {
                                    const nextForm = { ...bgForm, terrain: e.target.value };
                                    setBgForm(nextForm);
                                    persistToolState({ bgForm: nextForm });
                                }}
                                className="h-7 text-[10px] bg-black/40 border-white/5"
                            />
                        </div>

                        {/* Key Elements */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Elementos-chave</label>
                            <Textarea
                                placeholder="Ex: acampamento com 4 tendas, fogueira central, troncos como assentos, arbustos dispersos..."
                                value={bgForm.keyElements}
                                onChange={e => {
                                    const nextForm = { ...bgForm, keyElements: e.target.value };
                                    setBgForm(nextForm);
                                    persistToolState({ bgForm: nextForm });
                                }}
                                className="bg-black/40 border-white/5 h-16 text-[10px] resize-none"
                            />
                        </div>

                        {/* Time + Weather + Size row */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock size={8} /> Hora</label>
                                <Input placeholder="Noite..." value={bgForm.timeOfDay || ''} onChange={e => {
                                    const nextForm = { ...bgForm, timeOfDay: e.target.value };
                                    setBgForm(nextForm);
                                    persistToolState({ bgForm: nextForm });
                                }} className="h-6 text-[9px] bg-black/40 border-white/5" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><CloudSun size={8} /> Clima</label>
                                <Input placeholder="Nevoeiro..." value={bgForm.weather || ''} onChange={e => {
                                    const nextForm = { ...bgForm, weather: e.target.value };
                                    setBgForm(nextForm);
                                    persistToolState({ bgForm: nextForm });
                                }} className="h-6 text-[9px] bg-black/40 border-white/5" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Maximize2 size={8} /> Tamanho</label>
                                <Input placeholder="25x25" value={bgForm.mapSize || ''} onChange={e => {
                                    const nextForm = { ...bgForm, mapSize: e.target.value };
                                    setBgForm(nextForm);
                                    persistToolState({ bgForm: nextForm });
                                }} className="h-6 text-[9px] bg-black/40 border-white/5" />
                            </div>
                        </div>

                        {/* Style */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Estilo Artístico</label>
                            <Select value={bgForm.style} onValueChange={v => {
                                const nextForm = { ...bgForm, style: v as any };
                                setBgForm(nextForm);
                                persistToolState({ bgForm: nextForm });
                            }}>
                                <SelectTrigger className="h-7 text-[10px] bg-black/40 border-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hand-drawn">✏️ Hand-Drawn (Rune Foundry)</SelectItem>
                                    <SelectItem value="watercolor">🎨 Watercolor</SelectItem>
                                    <SelectItem value="realistic">📷 Realístico</SelectItem>
                                    <SelectItem value="comic">💥 Comic / Cartoon</SelectItem>
                                    <SelectItem value="oil-painting">🖌️ Pintura a Óleo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGeneratePrompt}
                            disabled={!bgForm.terrain || !bgForm.keyElements || isGenerating}
                            className="w-full bg-primary hover:bg-primary/80 text-xs font-bold"
                        >
                            {isGenerating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Sparkles size={14} className="mr-1.5" />}
                            Gerar Prompt para NanoBanana
                        </Button>

                        {/* Generated Prompt Result */}
                        {generatedPrompt && (
                            <div className="space-y-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                        <Sparkles size={10} /> Prompt Gerado
                                    </h4>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-[9px] text-emerald-400 hover:text-emerald-300"
                                        onClick={() => copyToClipboard(generatedPrompt.promptEnglish, setCopied)}
                                    >
                                        {copied ? <Check size={10} /> : <Copy size={10} />}
                                        <span className="ml-1">{copied ? 'Copiado!' : 'Copiar'}</span>
                                    </Button>
                                </div>
                                <p className="text-[10px] text-foreground/90 leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-white/5 select-all">
                                    {generatedPrompt.promptEnglish}
                                </p>
                                <div className="flex gap-2 text-[9px]">
                                    <Badge variant="secondary" className="bg-black/40 text-[8px]">
                                        Negative: {generatedPrompt.negativePrompt.substring(0, 60)}...
                                    </Badge>
                                    <Badge variant="secondary" className="bg-black/40 text-[8px]">
                                        {generatedPrompt.suggestedSettings?.aspectRatio}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                            <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <Upload size={10} /> Importar Battlegrid
                            </h4>
                            <p className="text-[9px] text-muted-foreground/60">Salve o resultado do NanoBanana e importe aqui.</p>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadBattlemap} className="hidden" />
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-[10px] border-white/10"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <ImageIcon size={12} className="mr-1.5" />}
                                {isUploading ? 'Enviando...' : 'Escolher Imagem'}
                            </Button>
                        </div>

                        {/* Gallery */}
                        {battlemaps.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <ImageIcon size={10} /> Galeria ({battlemaps.length})
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {battlemaps.map((bm: any) => (
                                        <div key={bm.id} className="relative group rounded-lg overflow-hidden border border-white/5 bg-black/40">
                                            <img src={bm.imageUrl} alt={bm.name} className="w-full aspect-square object-cover" loading="lazy" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                <span className="text-[9px] font-bold text-white truncate">{bm.name}</span>
                                                {bm.terrain && <span className="text-[8px] text-muted-foreground">{bm.terrain}</span>}
                                                <div className="flex gap-1 mt-1">
                                                    <Button size="icon" variant="ghost" className="h-5 w-5 text-white/60 hover:text-white" onClick={() => window.open(bm.imageUrl, '_blank')}>
                                                        <Download size={10} />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5 text-white/60 hover:text-destructive" onClick={() => handleDeleteBattlemap(bm.id)}>
                                                        <Trash2 size={10} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── REGIONAL MAP TAB ── */
                    <div className="space-y-4 p-1 animate-in fade-in duration-300">

                        {/* Location Graph (Parchment Style) */}
                        <div className="relative p-4 rounded-xl border border-amber-500/20 bg-[#2a2216] overflow-hidden">
                            {/* Parchment texture overlay */}
                            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43IiBudW1PY3RhdmVzPSI0Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==')] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-amber-200/90 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                                        <Compass size={14} className="text-amber-400" />
                                        {activeSession?.title || 'Mapa da Região'}
                                    </h3>
                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[8px]">
                                        {locations.length} locais · {routes.length} rotas
                                    </Badge>
                                </div>

                                {locations.length === 0 ? (
                                    <div className="text-center py-8 text-amber-200/30">
                                        <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-[10px]" style={{ fontFamily: 'Georgia, serif' }}>Crie locais no Grimório para populá-los aqui.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {locations.map((loc: any, idx: number) => {
                                            const locRoutes = routes.filter((r: any) => r.from === loc.name || r.to === loc.name);
                                            return (
                                                <div key={loc.id || idx} className="p-3 bg-black/30 border border-amber-500/10 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{
                                                            loc.type?.toLowerCase().includes('cidade') || loc.type?.toLowerCase().includes('capital') ? '🏰' :
                                                                loc.type?.toLowerCase().includes('vila') ? '🏘️' :
                                                                    loc.type?.toLowerCase().includes('floresta') || loc.type?.toLowerCase().includes('bosque') ? '🌲' :
                                                                        loc.type?.toLowerCase().includes('ruín') ? '🏛️' :
                                                                            loc.type?.toLowerCase().includes('montanha') ? '🏔️' :
                                                                                loc.type?.toLowerCase().includes('rio') || loc.type?.toLowerCase().includes('lago') ? '🌊' :
                                                                                    loc.type?.toLowerCase().includes('templo') ? '⛩️' : '📍'
                                                        }</span>
                                                        <div>
                                                            <span className="text-[11px] font-bold text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>{loc.name}</span>
                                                            <span className="text-[9px] text-amber-200/40 ml-2">{loc.type}</span>
                                                        </div>
                                                    </div>
                                                    {locRoutes.length > 0 && (
                                                        <div className="mt-2 pl-6 space-y-1">
                                                            {locRoutes.map((r: any, rIdx: number) => (
                                                                <div key={rIdx} className="flex items-center gap-1.5 text-[9px] text-amber-200/50">
                                                                    <ArrowRight size={8} />
                                                                    <span>{r.from === loc.name ? r.to : r.from}</span>
                                                                    {r.distanceKm > 0 && <Badge variant="secondary" className="text-[7px] h-3.5 bg-amber-500/10 text-amber-300/70">{r.distanceKm}km</Badge>}
                                                                    {r.terrainType && <span className="opacity-50">({r.terrainType})</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add Route Form */}
                        <div className="space-y-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                            <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <ArrowRight size={10} /> Adicionar Rota
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={routeForm.from} onValueChange={v => setRouteForm(f => ({ ...f, from: v }))}>
                                    <SelectTrigger className="h-7 text-[9px] bg-black/40 border-white/5"><SelectValue placeholder="De..." /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map((l: any) => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={routeForm.to} onValueChange={v => setRouteForm(f => ({ ...f, to: v }))}>
                                    <SelectTrigger className="h-7 text-[9px] bg-black/40 border-white/5"><SelectValue placeholder="Para..." /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map((l: any) => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="number" placeholder="Distância (km)" value={routeForm.distanceKm || ''} onChange={e => setRouteForm(f => ({ ...f, distanceKm: parseInt(e.target.value) || 0 }))} className="h-7 text-[9px] bg-black/40 border-white/5" />
                                <Input placeholder="Terreno (estrada, trilha...)" value={routeForm.terrainType} onChange={e => setRouteForm(f => ({ ...f, terrainType: e.target.value }))} className="h-7 text-[9px] bg-black/40 border-white/5" />
                            </div>
                            <Button size="sm" className="w-full h-7 text-[9px]" onClick={handleAddRoute} disabled={!routeForm.from || !routeForm.to}>
                                <Plus size={10} className="mr-1" /> Adicionar Rota
                            </Button>
                        </div>

                        {/* Existing Routes */}
                        {routes.length > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Rotas Cadastradas</h4>
                                {routes.map((r: any) => (
                                    <div key={r.id} className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg group">
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="text-foreground/80">{r.from}</span>
                                            <ArrowRight size={10} className="text-muted-foreground" />
                                            <span className="text-foreground/80">{r.to}</span>
                                            {r.distanceKm > 0 && <Badge variant="secondary" className="text-[8px] h-4">{r.distanceKm}km</Badge>}
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteRoute(r.id)}>
                                            <Trash2 size={10} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Generate Regional Map Prompt */}
                        <Button
                            onClick={handleGenerateRegionalPrompt}
                            disabled={locations.length === 0 || isGenRegionalPrompt}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-xs font-bold"
                        >
                            {isGenRegionalPrompt ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Compass size={14} className="mr-1.5" />}
                            Gerar Prompt do Mapa Regional
                        </Button>

                        {regionalPrompt && (
                            <div className="space-y-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                                        <Compass size={10} /> Prompt do Mapa Regional
                                    </h4>
                                    <Button size="sm" variant="ghost" className="h-6 text-[9px] text-amber-400" onClick={() => copyToClipboard(regionalPrompt.promptEnglish, setCopiedRegional)}>
                                        {copiedRegional ? <Check size={10} /> : <Copy size={10} />}
                                        <span className="ml-1">{copiedRegional ? 'Copiado!' : 'Copiar'}</span>
                                    </Button>
                                </div>
                                <p className="text-[10px] text-foreground/90 leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-white/5 select-all">
                                    {regionalPrompt.promptEnglish}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
