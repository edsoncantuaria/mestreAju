
'use client';

import React, { useState } from 'react';
import { PenTool, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateNarrativeText, type GenerateNarrativeTextOutput } from '@/ai/flows/generate-narrative-text-flow';
import { FeatureHeader } from '@/components/shared/feature-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NarrativeGeneratorTool() {
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <FeatureHeader 
        title="Gerador Narrativo" 
        description="Crie cartas, rumores e documentos imersivos com tons específicos."
        icon={PenTool}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Texto</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(val: any) => setFormData({...formData, documentType: val})}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carta">Carta</SelectItem>
                    <SelectItem value="rumor">Rumor</SelectItem>
                    <SelectItem value="documento">Documento Oficial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tom</Label>
                <Input 
                  value={formData.tone} 
                  onChange={(e) => setFormData({...formData, tone: e.target.value})}
                  placeholder="Ex: Nobre, Ameaçador..."
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mensagem Principal</Label>
              <Textarea 
                placeholder="O que o texto deve transmitir?"
                value={formData.messageContent}
                onChange={(e) => setFormData({...formData, messageContent: e.target.value})}
                className="bg-background/50 h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Personagens Envolvidos</Label>
              <Input 
                value={formData.involvedCharacters} 
                onChange={(e) => setFormData({...formData, involvedCharacters: e.target.value})}
                placeholder="NPCs ou Facções interessadas..."
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Lore do Mundo (Contexto)</Label>
              <Textarea 
                placeholder="Detalhes do mundo para manter a coerência..."
                value={formData.worldLore}
                onChange={(e) => setFormData({...formData, worldLore: e.target.value})}
                className="bg-background/50 h-32"
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || !formData.messageContent.trim()}
              className="w-full bg-primary hover:bg-primary/80 font-headline h-12"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <PenTool className="mr-2" />}
              Redigir Texto
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-card/20 rounded-xl border border-dashed border-primary/20">
              <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
              <p className="font-headline italic">As penas mágicas estão escrevendo...</p>
            </div>
          ) : result ? (
            <Card className="h-full bg-white/5 border-accent/20 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">Resultado Gerado</span>
                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-accent hover:text-accent/80 hover:bg-accent/10">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2">{copied ? 'Copiado' : 'Copiar'}</span>
                </Button>
              </div>
              <CardContent className="flex-1 p-8 overflow-y-auto">
                <div className="font-body text-lg leading-relaxed whitespace-pre-wrap selection:bg-accent/30">
                  {result.narrativeText}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-primary/10 rounded-xl py-20">
              <PenTool size={80} />
              <p className="mt-4 font-headline text-xl">Prepare a tinta e o pergaminho...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
