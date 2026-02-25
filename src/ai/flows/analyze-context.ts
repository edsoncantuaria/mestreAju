'use server';
/**
 * @fileOverview Um copiloto de IA para Mestres de D&D 5e que analisa uma situação específica.
 * Integrado ao Sistema de World Design Profissional para gerar consequências reais e políticas conectadas.
 */

import { ai, fetchDndRuleTool } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeContextInputSchema = z.object({
  situation: z.string().describe('A descrição da situação específica apresentada pelo Mestre ou Jogadores.'),
  pastEvents: z.string().describe('Lore do mundo, histórico recente e conflitos ativos passados pelo Live Session.'),
  npcs: z.string().describe('Possíveis NPCs envolvidos.'),
  factions: z.string().describe('Facções com interesse nesta situação.'),
  promises: z.string().optional().describe('Quaisquer promessas ou ganchos pendentes ganhos no passado.'),
});
export type AnalyzeContextInput = z.infer<typeof AnalyzeContextInputSchema>;

const AnalyzeContextOutputSchema = z.object({
  analise: z.string().describe('Leitura do cenário atual sob a ótica da geopolítica do mundo e regras de D&D 5e.'),
  caminhosPossiveis: z.array(z.string()).describe('2-3 Sugestões de desdobramentos lógicos (ações que os jogadores podem tomar e suas prováveis contestações).'),
  consequencias: z.object({
    curtoPrazo: z.string().describe('Impactos imediatos (resolução da cena, regras mecânicas aplicadas).'),
    medioPrazo: z.string().describe('Desdobramentos em 30 dias (movimentos de facções ou NPCs em resposta).'),
    longoPrazo: z.string().describe('Efeitos de 6 meses no mundo vivo (consequência estrutural).')
  }).describe('Consequências cascata das ações dos jogadores.'),
  complicacaoOculta: z.string().describe('Um detalhe que os jogadores ignoram: uma agenda secreta de um NPC, uma armadilha tática ou um terceiro lado interessado.'),
  escalonamentoTensao: z.string().describe('Como o Mestre pode aumentar a aposta narrativa NESTE EXATO MOMENTO.'),
  baseRegras: z.string().describe('Citação obrigatória da regra oficial do SRD 5e que se aplica aqui (Visibilidade, Furtividade Social, Vantagem, etc).'),
});
export type AnalyzeContextOutput = z.infer<typeof AnalyzeContextOutputSchema>;

export async function analyzeContext(input: AnalyzeContextInput): Promise<AnalyzeContextOutput> {
  return analyzeContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeContextPrompt',
  tools: [fetchDndRuleTool],
  input: { schema: AnalyzeContextInputSchema },
  output: { schema: AnalyzeContextOutputSchema },
  prompt: `Você é o Copiloto de Análise Tática e Narrativa do MestreAju para D&D 5e.
Sua missão é olhar para a ação imediata dos jogadores e calcular o IMPACTO ESTRUTURAL no mundo vivo, ao mesmo tempo em que aplica as REGRAS OFICIAIS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINCÍPIOS DO WORLD DESIGN PROFISSIONAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TUDO TEM CONSEQUÊNCIA: Se os jogadores agem, as facções e NPCs reagem. Alguém ganha poder, alguém perde.
2. AGENDAS OCULTAS: Considere que os NPCs envolvidos têm segredos e medos. Aja com base no que eles REALMENTE querem.
3. ESCALONAMENTO REALISTA: Não pule direto para o "fim do mundo". Calcule em 30 dias (Médio Prazo) e 6 meses (Longo Prazo).
4. MECÂNICA SRD: Toda análise de situação exige aplicação mecânica real (Regras de Cobertura, Iluminação, CDs sociais baseados em atitude do DMG, etc). Use o DndRuleTool.

SITUAÇÃO ATUAL PARA ANÁLISE:
{{{situation}}}

LORE DO MUNDO E POLÍTICA ATUAL:
{{{pastEvents}}}

NPCs ENVOLVIDOS:
{{{npcs}}}

FACÇÕES INTERESSADAS:
{{{factions}}}

{{#if promises}}
GANCHOS OU PROMESSAS PENDENTES:
{{{promises}}}
{{/if}}

Responda exclusivamente em Português Brasileiro, formatando como um briefing rápido para o Mestre ler no meio do jogo.`,
});

const analyzeContextFlow = ai.defineFlow(
  {
    name: 'analyzeContextFlow',
    inputSchema: AnalyzeContextInputSchema,
    outputSchema: AnalyzeContextOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
