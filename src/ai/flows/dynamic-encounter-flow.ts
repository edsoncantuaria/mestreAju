'use server';
/**
 * @fileOverview Fluxo para geração de eventos e encontros dinâmicos ramificados com suporte a regras oficiais e cálculo preciso de CR.
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

INSTRUÇÕES DE CÁLCULO (DMG):
1. Calcule o limite de XP (Easy/Medium/Hard/Deadly) para cada personagem e some-os.
2. Ao sugerir encontros de combate, use monstros cujo XP total (ajustado pelo multiplicador de número de monstros) se encaixe nesses limites.
3. Considere as habilidades de raça (ex: Changeling Shapechanger) ao sugerir opções sociais ou de infiltração.

Gere o próximo passo da narrativa de forma fluida.
As opções devem ser variadas. Cite monstros reais do SRD 5e e suas dificuldades.

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
