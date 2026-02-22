'use client';

import React, { useState } from 'react';
import { BookOpen, Loader2, Save, Globe, Map as MapIcon, Send, Sparkles, X, ChevronLeft, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { prepareSession, type PrepareSessionOutput } from '@/ai/flows/prepare-session-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

interface PrepareSessionToolProps {
  onSessionLoad: (data: any) => void;
  activeSession: any | null;
  onCancel?: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export function PrepareSessionTool({ onSessionLoad, activeSession, onCancel, setGlobalLoading }: PrepareSessionToolProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: activeSession?.title || '',
    mapDescription: activeSession?.mapDescription || '',
    mapImageUrl: activeSession?.mapImageUrl || '',
    worldLore: activeSession?.worldLore || '',
    currentAgendas: activeSession?.currentAgendas || ''
  });
  
  const [result, setResult] = useState<PrepareSessionOutput | null>(null);

  const handlePrepare = async () => {
    if (!formData.title.trim() || !formData.mapDescription.trim() || !formData.worldLore.trim()) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Preencha o título, mapa e lore.",
      });
      return;
    }
    setGlobalLoading(true);
    try {
      const data = await prepareSession(formData);
      setResult(data);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na IA", description: "Falha na preparação mecânica." });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleFinishAndSave = async () => {
    if (!user || !db || !result) return;
    setGlobalLoading(true);
    
    const sessionId = formData.title.toLowerCase().replace(/\s+/g, '-') || `session-${Date.now()}`;
    const sessionPath = `users/${user.uid}/campaigns/default-campaign/sessions/${sessionId}`;
    const sessionDocRef = doc(db, sessionPath);
    
    const dataToSave = {
      ...formData,
      ...result,
      ownerId: user.uid,
      id: sessionId,
      campaignId: 'default-campaign',
      dateCreated: serverTimestamp(),
      dateLastModified: serverTimestamp(),
      datePreparedOrPlayed: new Date().toISOString(),
      sessionNumber: 1,
      description: formData.worldLore,
      involvedFactionIds: [],
      involvedNpcIds: [],
      involvedLocationIds: []
    };

    setDoc(sessionDocRef, dataToSave, { merge: true })
      .then(() => {
        toast({ title: "Mundo Sincronizado!", description: "Tudo pronto no Grimório." });
        onSessionLoad(dataToSave);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: sessionDocRef.path,
          operation: 'write',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setGlobalLoading(false));
  };

  return (
    <div className="space-y-4 max-h-[75vh] flex flex-col">
      {!result ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-accent uppercase tracking-widest">Título da Crônica</label>
            <Input 
              placeholder="Ex: As Crônicas de Ravenloft"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="bg-background/30 border-white/5 h-12 text-sm font-headline"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                <MapIcon size={12} className="text-primary" /> Descrição do Mapa
              </label>
              <Textarea 
                placeholder="Geografia, cidades, biomas..."
                value={formData.mapDescription}
                onChange={(e) => setFormData({...formData, mapDescription: e.target.value})}
                className="bg-background/30 border-white/5 h-24 text-xs resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                <LinkIcon size={12} className="text-primary" /> URL do Mapa (Roll20)
              </label>
              <Input 
                placeholder="Link da imagem..."
                value={formData.mapImageUrl}
                onChange={(e) => setFormData({...formData, mapImageUrl: e.target.value})}
                className="bg-background/30 border-white/5 h-10 text-[10px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Globe size={12} className="text-primary" /> Lore e História do Mundo
            </label>
            <Textarea 
              placeholder="Fatos históricos, deuses, contexto político..."
              value={formData.worldLore}
              onChange={(e) => setFormData({...formData, worldLore: e.target.value})}
              className="bg-background/30 border-white/5 h-32 text-xs resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="ghost" className="flex-1 h-12" onClick={onCancel}>
              Voltar
            </Button>
            <Button 
              onClick={handlePrepare} 
              disabled={!formData.title || !formData.mapDescription || !formData.worldLore}
              className="flex-[2] bg-primary hover:bg-primary/80 font-headline h-12 text-lg shadow-xl shadow-primary/20"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Manifestar Sandbox
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl italic text-xs text-muted-foreground">
                <h4 className="font-bold text-accent mb-2 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Resumo do Mundo
                </h4>
                {formData.worldLore}
              </div>

              {result.environmentalRules && result.environmentalRules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={12} /> Regras de Ambiente
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {result.environmentalRules.map((er, i) => (
                      <div key={i} className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center group">
                        <span className="text-[10px] font-bold text-foreground">{er.feature}</span>
                        <span className="text-[9px] font-bold text-accent group-hover:text-white transition-colors">[{er.rule}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Card className="border-white/5 bg-black/40 rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/[0.02]">
                  <CardTitle className="text-[10px] font-headline uppercase tracking-widest text-accent">Ganchos de Aventura</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-3">
                    {result.plotHooks.map((hook, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex gap-3 group">
                        <span className="text-primary font-bold text-lg leading-none shrink-0">•</span>
                        <span className="group-hover:text-white transition-colors">{hook}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t border-white/5 mt-auto">
            <Button variant="outline" className="flex-1 h-14 rounded-xl" onClick={() => setResult(null)}>
              <ChevronLeft size={16} className="mr-2" /> Ajustar
            </Button>
            <Button 
              onClick={handleFinishAndSave}
              className="flex-[2] bg-accent text-accent-foreground hover:bg-accent/90 font-headline h-14 rounded-xl text-lg shadow-2xl shadow-accent/20 gap-3"
            >
              <Save size={24} />
              CARREGAR GRIMÓRIO
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
