
'use client';

import React, { useState, useEffect } from 'react';
import { PenTool, Loader2, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateNarrativeText, type GenerateNarrativeTextOutput } from '@/ai/flows/generate-narrative-text-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface NarrativeGeneratorToolProps {
  sharedContext?: {
    messageContent?: string;
    documentType?: 'carta' | 'rumor' | 'documento';
  };
}

export function NarrativeGeneratorTool({ sharedContext }: NarrativeGeneratorToolProps) {
  const [formData, setFormData] = useState({
    worldLore: '',
    documentType: 'carta' as 'carta' | 'rumor' | 'documento',
    tone: 'nobre',
    messageContent: '',
    involvedCharacters: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateNarrativeTextOutput | null>(null);
  const [copied, setCopied] = useState(false);

  // Pick up context from the Mind Map
  useEffect(() => {
    if (sharedContext?.messageContent) {
      setFormData(prev => ({
        ...prev,
        messageContent: sharedContext.messageContent || '',
        documentType: sharedContext.documentType || prev.documentType
      }));
    }
  }, [sharedContext]);

  const handleGenerate = async () => {
    if (!formData.messageContent.trim()) return;
    setLoading(true);
    try {
      const data = await generateNarrativeText(formData);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {!result && !loading ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          {sharedContext?.messageContent && (
            <div className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] text-purple-400">
              <LinkIcon size={10} /> Contexto da Sessão Ativa Aplicado
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest">Tipo</label>
              <Select 
                value={formData.documentType} 
                onValueChange={(val: any) => setFormData({...formData, documentType: val})}
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
                onChange={(e) => setFormData({...formData, tone: e.target.value})}
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
              onChange={(e) => setFormData({...formData, messageContent: e.target.value})}
              className="bg-background/30 border-white/5 h-24 text-[10px] leading-relaxed"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={loading || !formData.messageContent.trim()}
            className="w-full bg-primary hover:bg-primary/80 font-headline"
          >
            Canalizar Texto
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
          <p className="font-headline italic text-xs">As penas mágicas estão escrevendo...</p>
        </div>
      )}

      {result && !loading && (
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
          
          <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => setResult(null)}>
            Escrever Outro
          </Button>
        </div>
      )}
    </div>
  );
}
