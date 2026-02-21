'use client';

import React, { useState } from 'react';
import { BookOpen, Loader2, Save, Globe, Map as MapIcon, Send, Sparkles, X } from 'lucide-react';
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
}

export function PrepareSessionTool({ onSessionLoad, activeSession, onCancel }: PrepareSessionToolProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: activeSession?.title || '',
    mapDescription: activeSession?.mapDescription || '',
    worldLore: activeSession?.worldLore || '',
    currentAgendas: activeSession?.currentAgendas || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<PrepareSessionOutput | null>(null);

  const handlePrepare = async () => {
    if (!formData.mapDescription.trim() || !formData.worldLore.trim()) return;
    setLoading(true);
    try {
      const data = await prepareSession(formData);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAndLoad = async () => {
    if (!user || !db || !result) return;
    setSaving(true);
    
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
    };

    setDoc(sessionDocRef, dataToSave, { merge: true })
      .then(() => {
        toast({
          title: "Sessão Forjada!",
          description: "Dados salvos e carregados no Copiloto.",
        });
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
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-4 max-h-[70vh] flex flex-col">
      <div className="shrink-0 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-accent uppercase tracking-widest">Título da Jornada</label>
          <Input 
            placeholder="Ex: A Queda de Silverkeep"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="bg-background/30 border-white/5 h-10 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 pr-3 -mr-3">
        {!result && !loading ? (
          <div className="space-y-4 pb-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <MapIcon size={10} /> O Mapa / Localização
              </label>
              <Textarea 
                placeholder="Descreva as salas, geografia ou pontos de interesse..."
                value={formData.mapDescription}
                onChange={(e) => setFormData({...formData, mapDescription: e.target.value})}
                className="bg-background/30 border-white/5 h-24 text-xs resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Globe size={10} /> História e Lore do Mundo
              </label>
              <Textarea 
                placeholder="Qual o contexto político e histórico atual?"
                value={formData.worldLore}
                onChange={(e) => setFormData({...formData, worldLore: e.target.value})}
                className="bg-background/30 border-white/5 h-32 text-xs resize-none"
              />
            </div>
          </div>
        ) : null}

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
            <p className="font-headline italic text-xs text-center">Tecendo os fios da narrativa para sua mesa...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500 pb-4">
             <Card className="border-white/5 bg-black/40">
              <CardHeader className="py-2 px-3 border-b border-white/5">
                <CardTitle className="text-[10px] font-headline uppercase tracking-widest text-accent">Ganchos Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ul className="space-y-2">
                  {result.plotHooks.map((h, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex gap-2">
                      <span className="text-primary font-bold">•</span> {h}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2 pt-4 border-t border-white/5 shrink-0">
        <Button 
          variant="ghost" 
          className="flex-1 text-xs h-10 gap-2" 
          onClick={onCancel}
        >
          Cancelar
        </Button>
        {!result ? (
          <Button 
            onClick={handlePrepare} 
            disabled={loading || !formData.mapDescription || !formData.worldLore}
            className="flex-1 bg-primary hover:bg-primary/80 font-headline h-10"
          >
            Gerar Ganchos
          </Button>
        ) : (
          <Button 
            onClick={handleFinishAndLoad}
            disabled={saving}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-headline h-10 gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            FINALIZAR & CARREGAR
          </Button>
        )}
      </div>
    </div>
  );
}
