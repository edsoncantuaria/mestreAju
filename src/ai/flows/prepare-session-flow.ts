'use server';
/**
 * @fileOverview Fluxo Genkit para preparar sessões de D&D 5e.
 * Gera ganchos, complicações e resumos políticos baseados em mapa e lore.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrepareSessionInputSchema = z.object({
  mapDescription: z.string().describe('Descrição do mapa ou local principal da sessão.'),
  worldLore: z.string().describe('Lore do mundo, história e contexto atual.'),
  currentAgendas: z.string().optional().describe('Agendas das facções ou NPCs no momento.'),
});
export type PrepareSessionInput = z.infer<typeof PrepareSessionInputSchema>;

const PrepareSessionOutputSchema = z.object({
  plotHooks: z.array(z.string()).describe('3-5 ganchos de aventura iniciais.'),
  activeConflicts: z.array(z.string()).describe('Conflitos ativos que podem eclodir.'),
  unexpectedComplication: z.string().describe('Uma reviravolta ou complicação inesperada.'),
  politicalIntrigueSummary: z.string().describe('Resumo das tensões políticas locais.'),
  suggestedNpcs: z.array(z.object({
    name: z.string(),
    role: z.string(),
    motivation: z.string(),
  })).describe('Sugestões de NPCs chave para esta preparação.'),
});
export type PrepareSessionOutput = z.infer<typeof PrepareSessionOutputSchema>;

export async function prepareSession(input: PrepareSessionInput): Promise<PrepareSessionOutput> {
  return prepareSessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prepareSessionPrompt',
  input: {schema: PrepareSessionInputSchema},
  output: {schema: PrepareSessionOutputSchema},
  prompt: `Você é o Arquiteto de Sandbox para D&D 5e. Sua tarefa é transformar uma descrição de mapa e lore em uma sessão viva e reativa.

MAPA: {{{mapDescription}}}
LORE: {{{worldLore}}}
{{#if currentAgendas}}AGENDAS ATUAIS: {{{currentAgendas}}}{{/if}}

Com base nisso, gere uma preparação de sessão que ofereça liberdade aos jogadores (sandbox), mas com ganchos fortes e tensões políticas claras. Use o sistema D&D 5e como base mecânica e narrativa.

Sua resposta deve ser em Português Brasileiro.`,
});

const prepareSessionFlow = ai.defineFlow(
  {
    name: 'prepareSessionFlow',
    inputSchema: PrepareSessionInputSchema,
    outputSchema: PrepareSessionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
