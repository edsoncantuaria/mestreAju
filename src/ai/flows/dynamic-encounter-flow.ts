'use server';
/**
 * @fileOverview Fluxo para geração de eventos e encontros dinâmicos ramificados com suporte a regras oficiais e orçamento de XP real.
 * Garante que a narrativa reflita os bônus e penalidades mecânicas.
 */

import {ai, fetchDndRuleTool, fetchMonsterStatblockTool} from '@/ai/genkit';
import {z} from 'genkit';

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
  currentSituation: z.string().describe('A situação ou local atual.'),
  partyInfo: PartyInfoSchema,
  lastChoice: z.string().optional().describe('A última escolha feita pelo mestre ou jogadores.'),
  customInput: z.string().optional().describe('Entrada manual do mestre para desviar das opções.'),
});
export type DynamicEncounterInput = z.infer<typeof DynamicEncounterInputSchema>;

const OptionSchema = z.object({
  label: z.string().describe('Título curto da opção.'),
  description: z.string().describe('O que acontece nesta opção, mencionando CDs de testes se necessário.'),
  difficulty: z.enum(['Muito Fácil', 'Fácil', 'Médio', 'Difícil', 'Mortal']).describe('Dificuldade baseada no orçamento de XP do grupo.'),
  xpValue: z.number().optional().describe('Valor total de XP planejado para o encontro.'),
  roll20Macro: z.string().optional().describe('Um comando de chat/macro para o Roll20.'),
});

const DynamicEncounterOutputSchema = z.object({
  narrativa: z.string().describe('Texto descrevendo o desenrolar da cena atual com termos mecânicos integrados.'),
  opcoes: z.array(OptionSchema).min(2).max(4).describe('Próximos passos possíveis.'),
  detalheOculto: z.string().optional().describe('Um segredo, item ou nome de NPC/Local encontrado.'),
  tipoDescoberta: z.enum(['npc', 'location', 'item', 'secret']).optional().describe('Classificação da descoberta.'),
  sugestaoMecanica: z.string().optional().describe('Sugestão de CD ou monstros específicos do SRD para o encontro.'),
});
export type DynamicEncounterOutput = z.infer<typeof DynamicEncounterOutputSchema>;

export async function generateEncounterStep(input: DynamicEncounterInput): Promise<DynamicEncounterOutput> {
  return dynamicEncounterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicEncounterPrompt',
  tools: [fetchDndRuleTool, fetchMonsterStatblockTool],
  input: {schema: DynamicEncounterInputSchema},
  output: {schema: DynamicEncounterOutputSchema},
  prompt: `Você é o Copiloto de Sessão Ativa para D&D 5e.
Sua tarefa é planejar o próximo passo da aventura Sandbox de forma emergente, política e RIGOROSAMENTE fiel às regras.

ORÇAMENTO DE XP (Thresholds por Encontro do DMG):
- Fácil: {{{partyInfo.xpThresholds.easy}}} XP
- Médio: {{{partyInfo.xpThresholds.medium}}} XP
- Difícil: {{{partyInfo.xpThresholds.hard}}} XP
- Mortal: {{{partyInfo.xpThresholds.deadly}}} XP

SITUAÇÃO ATUAL: {{{currentSituation}}}

INSTRUÇÕES:
1. **Narrativa Mecânica**: Use frases como "Você percebe que o terreno é difícil (difficult terrain)" ou "O inimigo parece ter vantagem (advantage)".
2. **Equilíbrio de XP**: Nunca sugira um combate que ultrapasse o XP 'Mortal' sem avisar explicitamente.
3. **Monstros SRD**: Sugira monstros reais que existam no SRD 5e.
4. **Macros Roll20**: Gere macros ricas que usem o template '&{template:npc}' se for um monstro ou '&{template:simple}' para testes.

Responda em Português Brasileiro.`,
});

const dynamicEncounterFlow = ai.defineFlow(
  {
    name: 'dynamicEncounterFlow',
    inputSchema: DynamicEncounterInputSchema,
    outputSchema: DynamicEncounterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
