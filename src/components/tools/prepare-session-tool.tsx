'use client';

import React, { useState } from 'react';
import { BookOpen, Loader2, Save, Globe, Map as MapIcon, Send, CheckCircle2 } from 'lucide-react';
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

export function PrepareSessionTool() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    mapDescription: '',
    worldLore: '',
    currentAgendas: ''
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

  const saveToFirebase = async () => {
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
      sessionNumber: 1, // Mock or user input
      description: formData.worldLore, // Mapping lore to description for backend schema
    };

    setDoc(sessionDocRef, dataToSave, { merge: true })
      .then(() => {
        toast({
          title: "Sessão Salva!",
          description: "Os dados foram persistidos no Firebase.",
        });
        
        // Webhook Trigger
        triggerWebhook(dataToSave);
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

  const triggerWebhook = async (data: any) => {
    // Exemplo de integração com sua API/Servidor
    try {
      await fetch('https://sua-api.exemplo.com/webhook/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast({
        title: "Webhook Disparado!",
        description: "Dados sincronizados com seu servidor externo.",
      });
    } catch (e) {
      console.warn("Webhook falhou ou não configurado:", e);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="space-y-3 shrink-0">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-accent uppercase tracking-widest">Título da Preparação</label>
          <Input 
            placeholder="Ex: A Queda de Silverkeep"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="bg-background/30 border-white/5 h-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 pr-3 -mr-3">
        {!result && !loading ? (
          <div className="space-y-4 animate-in fade-in duration-300 pb-4">
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
            <Button 
              onClick={handlePrepare} 
              disabled={loading || !formData.mapDescription || !formData.worldLore}
              className="w-full bg-primary hover:bg-primary/80 font-headline"
            >
              Gerar Estrutura de Sessão
            </Button>
          </div>
        ) : null}

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
            <p className="font-headline italic text-xs text-center">Consultando as Crônicas do Mundo...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500 pb-4">
            <div className="grid grid-cols-1 gap-3">
              <Card className="border-white/5 bg-black/40">
                <CardHeader className="py-2 px-3 border-b border-white/5">
                  <CardTitle className="text-[10px] font-headline uppercase tracking-widest text-accent">Ganchos de Trama</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ul className="space-y-2">
                    {result.plotHooks.map((h, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex gap-2">
                        <span className="text-primary">•</span> {h}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/40">
                <CardHeader className="py-2 px-3 border-b border-white/5">
                  <CardTitle className="text-[10px] font-headline uppercase tracking-widest text-primary">Intriga Política</CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-[11px] text-muted-foreground italic leading-relaxed">
                  {result.politicalIntrigueSummary}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-[10px] h-9 gap-2" 
                onClick={() => setResult(null)}
              >
                Refazer
              </Button>
              <Button 
                size="sm" 
                className="flex-1 text-[10px] h-9 bg-green-600 hover:bg-green-700 gap-2"
                onClick={saveToFirebase}
                disabled={saving || !user}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar & Sincronizar
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
