'use server';
/**
 * @fileOverview Fluxo para geração de eventos e encontros dinâmicos ramificados com suporte a regras oficiais.
 */

import {ai, fetchDndRuleTool} from '@/ai/genkit';
import {z} from 'genkit';

const PartyInfoSchema = z.object({
  playerCount: z.number().default(4),
  averageLevel: z.number().default(1),
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
  difficulty: z.enum(['Muito Fácil', 'Fácil', 'Médio', 'Difícil', 'Mortal']).describe('Dificuldade relativa ao nível do grupo.'),
});

const DynamicEncounterOutputSchema = z.object({
  narrativa: z.string().describe('Texto descrevendo o desenrolar da cena atual.'),
  opcoes: z.array(OptionSchema).min(2).max(4).describe('Próximos passos possíveis.'),
  detalheOculto: z.string().optional().describe('Um segredo, item ou gancho encontrado.'),
  sugestaoMecanica: z.string().optional().describe('Sugestão de CD (Dificuldade) ou monstros específicos baseados nas regras oficiais.'),
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
O grupo tem {{partyInfo.playerCount}} jogadores de nível {{partyInfo.averageLevel}}.

SITUAÇÃO ATUAL: {{{currentSituation}}}
{{#if lastChoice}}ESCOLHA ANTERIOR: {{{lastChoice}}}{{/if}}
{{#if customInput}}O MESTRE DECIDIU: {{{customInput}}}{{/if}}

Gere o próximo passo da narrativa de forma fluida. 
As opções devem ser variadas (Combate, Social, Exploração).
Considere o nível do grupo para sugerir a dificuldade e monstros.

**IMPORTANTE**: Você tem acesso às regras oficiais do D&D 5e via ferramenta fetchDndRule. 
Se a situação envolver mecânicas complexas (como escalada, luz, cobertura ou condições), use a ferramenta para garantir que a dificuldade e as sugestões mecânicas estejam corretas.

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
