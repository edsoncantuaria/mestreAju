'use client';

import React, { useState } from 'react';
import {
    History,
    ChevronRight,
    MapPin,
    Calendar,
    BookOpen,
    Scroll,
    Sparkles,
    ChevronDown,
    Layout,
    PenTool,
    Search,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SessionHistoryToolProps {
    activeSession: any | null;
}

export function SessionHistoryTool({ activeSession }: SessionHistoryToolProps) {
    const [expandedSession, setExpandedSession] = useState<number | null>(null);

    const playSessions: any[] = (activeSession?.playSessions || []).sort((a: any, b: any) => b.number - a.number);

    if (playSessions.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/30">
                    <History size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white/50">Arquivo Vazio</h3>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                        As sessões encerradas no Live Copilot aparecerão aqui como crônicas eternas.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center gap-2 px-1">
                <History size={14} className="text-accent" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Crônicas Anteriores</h3>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-3 pb-4">
                    {playSessions.map((s, idx) => (
                        <div key={idx} className="group">
                            <div
                                onClick={() => setExpandedSession(expandedSession === s.number ? null : s.number)}
                                className={cn(
                                    "p-3 rounded-xl border transition-all cursor-pointer select-none",
                                    expandedSession === s.number
                                        ? "bg-primary/10 border-primary/30"
                                        : "bg-black/20 border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] font-[Fira_Code] border-primary/30 text-primary bg-primary/5">
                                            SESSÃO {s.number}
                                        </Badge>
                                        <span className="text-[9px] text-muted-foreground font-[Fira_Code]">
                                            {new Date(s.date).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    {expandedSession === s.number ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} className="text-muted-foreground group-hover:text-white" />}
                                </div>

                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={10} className="text-amber-500/50" />
                                        <span>{s.inGameDate}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin size={10} className="text-sky-500/50" />
                                        <span>{s.location}</span>
                                    </div>
                                </div>

                                {expandedSession !== s.number && (
                                    <p className="text-[11px] leading-relaxed text-white/60 line-clamp-2 italic italic mt-2">
                                        "{s.finalSummary}"
                                    </p>
                                )}

                                {expandedSession === s.number && (
                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1.5">
                                            <h4 className="text-[9px] font-bold uppercase tracking-widest text-accent flex items-center gap-1.5 text-primary">
                                                <Scroll size={10} /> Registro da Crônica
                                            </h4>
                                            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                                <p className="text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                                    {s.finalSummary}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                            <h4 className="text-[9px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1.5">
                                                <Sparkles size={10} /> Onde Paramos
                                            </h4>
                                            <p className="text-[10px] italic text-amber-200/70">
                                                {s.nextSessionHook}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                <BookOpen size={10} /> Log da Sessão
                                            </h4>
                                            <div className="space-y-2">
                                                {s.rawLogs?.map((log: any, lIdx: number) => (
                                                    <div key={lIdx} className="p-2 bg-white/[0.02] border border-white/5 rounded-md text-[10px] text-muted-foreground/80 leading-snug">
                                                        <span className="text-accent/50 mr-1.5">[{lIdx + 1}]</span>
                                                        {log.narrativa}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {s.finalInventory && s.finalInventory.length > 0 && (
                                            <div className="space-y-3 pt-2 border-t border-white/5">
                                                <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                    <Package size={10} /> Inventário Final da Sessão
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {s.finalInventory.map((item: any) => (
                                                        <Badge key={item.id} variant="secondary" className="bg-white/5 border-white/10 text-[9px] h-5 py-0">
                                                            {item.quantity}x {item.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(s.archivedTools?.documents || s.archivedTools?.analysis) && (
                                            <div className="space-y-3 pt-2 border-t border-white/5">
                                                <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                    <Layout size={10} /> Artefatos Gerados
                                                </h4>

                                                <div className="grid grid-cols-1 gap-2">
                                                    {s.archivedTools?.documents && (
                                                        <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-tighter flex items-center gap-1">
                                                                    <PenTool size={10} /> Documento Gerado
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed italic line-clamp-4">
                                                                "{s.archivedTools.documents.narrativeText}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {s.archivedTools?.analysis && (
                                                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter flex items-center gap-1 mb-2">
                                                                <Search size={10} /> Análise Tática/Contextual
                                                            </span>
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                                {s.archivedTools.analysis.insights?.[0] || "Análise detalhada anexada."}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
