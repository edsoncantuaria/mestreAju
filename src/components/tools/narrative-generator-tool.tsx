'use client';

import React, { useState, useEffect } from 'react';
import { PenTool, Loader2, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateNarrativeText, type GenerateNarrativeTextOutput } from '@/ai/flows/generate-narrative-text-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface NarrativeGeneratorToolProps {
  activeSession: any | null;
  setGlobalLoading: (loading: boolean) => void;
}

export function NarrativeGeneratorTool({ activeSession, setGlobalLoading }: NarrativeGeneratorToolProps) {
  const { user } = useUser();
  const db = useFirestore();
  
  const [formData, setFormData] = useState({
    worldLore: '',
    documentType: 'carta' as 'carta' | 'rumor' | 'documento',
    tone: 'nobre',
    messageContent: '',
    involvedCharacters: ''
  });
  const [result, setResult] = useState<GenerateNarrativeTextOutput | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeSession?.toolStates?.narrative) {
      setFormData(prev => ({
        ...prev,
        ...activeSession.toolStates.narrative
      }));
    }
    if (activeSession?.toolStates?.narrative_result) {
      setResult(activeSession.toolStates.narrative_result);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    if (activeSession?.activeContext?.targetTool === 'narrative') {
      const incomingData = activeSession.activeContext.data;
      
      setFormData(prev => ({
        ...prev,
        messageContent: incomingData.messageContent || prev.messageContent,
        documentType: incomingData.documentType || prev.documentType
      }));

      if (db && user && activeSession.id) {
        const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
        updateDoc(sessionRef, { 'activeContext': null });
      }
    }
  }, [activeSession?.activeContext, db, user, activeSession?.id]);

  const persistToolState = async (updates: any) => {
    if (!db || !user || !activeSession) return;
    const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
    updateDoc(sessionRef, { 
      [`toolStates.narrative`]: { ...formData, ...updates } 
    });
  };

  const handleGenerate = async () => {
    if (!formData.messageContent.trim()) return;
    setGlobalLoading(true);
    try {
      const data = await generateNarrativeText({
        ...formData,
        worldLore: activeSession?.worldLore || formData.worldLore
      });
      setResult(data);
      
      if (db && user && activeSession.id) {
        const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
        updateDoc(sessionRef, { 'toolStates.narrative_result': data });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateForm = (updates: any) => {
    setFormData(prev => {
      const newState = { ...prev, ...updates };
      persistToolState(updates);
      return newState;
    });
  };

  return (
    <div className="space-y-4">
      {!result ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest">Tipo</label>
              <Select 
                value={formData.documentType} 
                onValueChange={(val: any) => updateForm({ documentType: val })}
              >
                <SelectTrigger className="h-8 bg-background/30 border-white/5 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carta">Carta</SelectItem>
                  <SelectItem value="rumor">Rumor</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest">Tom</label>
              <Input 
                value={formData.tone} 
                onChange={(e) => updateForm({ tone: e.target.value })}
                placeholder="Ex: Arcaico..."
                className="h-8 bg-background/30 border-white/5 text-[10px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest">Conteúdo Principal</label>
            <Textarea 
              placeholder="O que o texto deve transmitir?"
              value={formData.messageContent}
              onChange={(e) => updateForm({ messageContent: e.target.value })}
              className="bg-background/30 border-white/5 h-24 text-[10px] leading-relaxed"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={!formData.messageContent.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Canalizar Texto
          </Button>
        </div>
      ) : null}

      {result && (
        <div className="space-y-3 animate-in zoom-in-95 duration-500">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg relative group shadow-inner">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyToClipboard} 
              className="absolute top-2 right-2 h-6 w-6 text-accent opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </Button>
            <div className="font-body text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {result.narrativeText}
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => {
            setResult(null);
            if (db && user && activeSession.id) {
               const sessionRef = doc(db, `users/${user.uid}/campaigns/default-campaign/sessions/${activeSession.id}`);
               updateDoc(sessionRef, { 'toolStates.narrative_result': null });
            }
          }}>
            Escrever Outro
          </Button>
        </div>
      )}
    </div>
  );
}
