'use server';
/**
 * @fileOverview Fluxo para geração de eventos e encontros dinâmicos ramificados com suporte a regras oficiais e macros para Roll20.
 */

import {ai, fetchDndRuleTool} from '@/ai/genkit';
import {z} from 'genkit';

const PartyMemberSchema = z.object({
  name: z.string().optional(),
  level: z.number().min(1).max(20),
  race: z.string().optional(),
  class: z.string().optional(),
});

const PartyInfoSchema = z.object({
  members: z.array(PartyMemberSchema).min(1).describe('A lista de personagens jogadores e seus níveis/raças.'),
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
  description: z.string().describe('O que acontece nesta opção.'),
  difficulty: z.enum(['Muito Fácil', 'Fácil', 'Médio', 'Difícil', 'Mortal']).describe('Dificuldade baseada no orçamento de XP do grupo.'),
  xpValue: z.number().optional().describe('Valor total de XP planejado para o encontro.'),
  roll20Macro: z.string().optional().describe('Um comando de chat/macro para o Roll20 (ex: /roll 1d20+5 ou comandos de ataque).'),
});

const DynamicEncounterOutputSchema = z.object({
  narrativa: z.string().describe('Texto descrevendo o desenrolar da cena atual.'),
  opcoes: z.array(OptionSchema).min(2).max(4).describe('Próximos passos possíveis.'),
  detalheOculto: z.string().optional().describe('Um segredo, item ou gancho encontrado.'),
  sugestaoMecanica: z.string().optional().describe('Sugestão de CD ou monstros específicos com base no XP total permitido.'),
});
export type DynamicEncounterOutput = z.infer<typeof DynamicEncounterOutputSchema>;

export async function generateEncounterStep(input: DynamicEncounterInput): Promise<DynamicEncounterOutput> {
  return dynamicEncounterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicEncounterPrompt',
  tools: [fetchDndRuleTool],
  input: {schema: DynamicEncounterInputSchema},
  output: {schema: DynamicEncounterOutputSchema},
  prompt: `Você é o Copiloto de Sessão Ativa para D&D 5e.
Você deve calcular a dificuldade dos encontros usando o Orçamento de XP oficial do DMG 5e.

COMPONENTES DO GRUPO:
{{#each partyInfo.members}}
- {{#if name}}{{name}}: {{/if}}Nível {{level}} {{race}} {{class}}
{{/each}}

SITUAÇÃO ATUAL: {{{currentSituation}}}
{{#if lastChoice}}ESCOLHA ANTERIOR: {{{lastChoice}}}{{/if}}
{{#if customInput}}O MESTRE DECIDIU: {{{customInput}}}{{/if}}

INSTRUÇÕES:
1. Calcule o limite de XP (Easy/Medium/Hard/Deadly) total e sugira monstros reais do SRD 5e.
2. Para cada opção, se houver combate ou teste, forneça um "roll20Macro" (ex: /roll 1d20+4 para iniciativa ou /roll 2d6+3 para dano de um monstro).
3. Gere o próximo passo da narrativa de forma fluida e sandbox.

Sua resposta deve ser em Português Brasileiro.`,
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
