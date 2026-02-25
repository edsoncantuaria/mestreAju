'use server';
/**
 * @fileOverview Fluxo para geração de eventos e encontros dinâmicos ramificados.
 * Integrado ao Sistema de World Design Profissional para garantir que cada passo
 * da sessão esteja ancorado na política, religião e conflitos do mundo.
 */

import { ai, fetchDndRuleTool, fetchMonsterStatblockTool } from '@/ai/genkit';
import { z } from 'genkit';

const PartyMemberSchema = z.object({
  name: z.string().optional(),
  level: z.number().min(1).max(20),
  race: z.string().optional(),
  class: z.string().optional(),
});

const PartyInfoSchema = z.object({
  members: z.array(PartyMemberSchema).min(1).describe('A lista de personagens jogadores e seus níveis/raças.'),
  xpThresholds: z.object({
    easy: z.number(),
    medium: z.number(),
    hard: z.number(),
    deadly: z.number(),
  }).optional().describe('Limites de XP para o grupo calculados via DMG.'),
});

const DynamicEncounterInputSchema = z.object({
  currentSituation: z.string().describe('A situação atual e a LORE ativa do mundo enviada pelo Live Session Tool.'),
  partyInfo: PartyInfoSchema,
  lastChoice: z.string().optional().describe('A última escolha feita pelo mestre ou jogadores.'),
  customInput: z.string().optional().describe('Entrada manual do mestre para desviar das opções.'),
});
export type DynamicEncounterInput = z.infer<typeof DynamicEncounterInputSchema>;

const OptionSchema = z.object({
  label: z.string().describe('Título curto da opção.'),
  description: z.string().describe('O que acontece nesta opção, citando regras do SRD se aplicável.'),
  difficulty: z.enum(['Seguro', 'Arriscado', 'Muito Fácil', 'Fácil', 'Médio', 'Difícil', 'Mortal']).describe('Dificuldade tática ou risco político/narrativo da ação.'),
  xpValue: z.number().optional().describe('Valor total de XP planejado para o encontro (se for combate).'),
  roll20Macro: z.string().optional().describe('Um comando de chat/macro para o Roll20 (&{template:npc} ou &{template:simple}).'),
});

const DynamicEncounterOutputSchema = z.object({
  narrativa: z.string().describe('Texto descrevendo o desenrolar da cena atual. DEVE conectar a situação à lore política, religiosa ou facções do mundo.'),
  opcoes: z.array(OptionSchema).min(2).max(4).describe('Próximos passos possíveis.'),
  detalheOculto: z.string().optional().describe('Um segredo, item, nome de NPC ou Local relevante para os Ganchos ou Conflitos do mundo.'),
  tipoDescoberta: z.enum(['npc', 'location', 'item', 'secret']).optional().describe('Classificação da descoberta.'),
  sugestaoMecanica: z.string().optional().describe('Sugestão de CD, penalidade, vantagem ou monstros específicos do SRD para o momento.'),
});
export type DynamicEncounterOutput = z.infer<typeof DynamicEncounterOutputSchema>;

export async function generateEncounterStep(input: DynamicEncounterInput): Promise<DynamicEncounterOutput> {
  return dynamicEncounterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicEncounterPrompt',
  tools: [fetchDndRuleTool, fetchMonsterStatblockTool],
  input: { schema: DynamicEncounterInputSchema },
  output: { schema: DynamicEncounterOutputSchema },
  prompt: `Você é o Copiloto de Sessão Ativa para D&D 5e do MestreAju.
Sua tarefa é planejar o próximo passo da aventura Sandbox de forma emergente, tática e profundeamente enraizada no estado atual do mundo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINCÍPIOS DE SESSÃO VIVA (WORLD DESIGN PROFISSIONAL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NUNCA GERE CENAS GENÉRICAS. Conecte o que está acontecendo à LORE do mundo fornecida na string de situação (política, facções, NPCs conhecidos, divindades).
2. Se houver combate, ele deve ter uma MOTOVAÇÃO clara dentro do ecossistema das facções locais.
3. Se houver exploração, revele "Detalhes Ocultos" que liguem a ruínas antigas ou segredos de NPCs importantes.
4. Equilíbrio Mecânico: Use a terminologia correta de D&D 5e (Vantagem, Desvantagem, CD, Terreno Difícil, Dano Perfurante, etc). Cite regras do SRD ativamente.
5. Orçamento de XP: Nunca sugira um combate além da soma 'Mortal' do grupo sem explícito aviso logístico.

ORÇAMENTO DE XP ATUAL DO GRUPO:
- Fácil: {{{partyInfo.xpThresholds.easy}}} XP
- Médio: {{{partyInfo.xpThresholds.medium}}} XP
- Difícil: {{{partyInfo.xpThresholds.hard}}} XP
- Mortal: {{{partyInfo.xpThresholds.deadly}}} XP

SITUAÇÃO ATUAL E LORE:
{{{currentSituation}}}

{{#if lastChoice}}
Ação Anterior Escolhida: {{{lastChoice}}}
{{/if}}

{{#if customInput}}
Intervenção Direta do Mestre: {{{customInput}}}
{{/if}}

Responda exclusivamente em Português Brasileiro.`,
});

const dynamicEncounterFlow = ai.defineFlow(
  {
    name: 'dynamicEncounterFlow',
    inputSchema: DynamicEncounterInputSchema,
    outputSchema: DynamicEncounterOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
