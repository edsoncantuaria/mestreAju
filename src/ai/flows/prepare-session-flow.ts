'use server';
/**
 * @fileOverview Fluxo Genkit para preparar sessões de D&D 5e.
 * Integra regras de ambiente e sugestões táticas baseadas no SRD.
 */

import {ai, fetchDndRuleTool} from '@/ai/genkit';
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
  environmentalRules: z.array(z.object({
    feature: z.string().describe('Característica do ambiente (Ex: Nevoeiro, Rio Corrente).'),
    rule: z.string().describe('Regra oficial associada (Ex: Heavy Obscurement, Strength Save para nadar).'),
  })).describe('Sugestões de regras de ambiente baseadas no mapa.'),
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
  tools: [fetchDndRuleTool],
  input: {schema: PrepareSessionInputSchema},
  output: {schema: PrepareSessionOutputSchema},
  prompt: `Você é o Arquiteto de Sandbox para D&D 5e. Sua tarefa é transformar um mapa em um ambiente vivo e REGRADO.

MAPA: {{{mapDescription}}}
LORE: {{{worldLore}}}

INSTRUÇÕES:
1. **Ambiente Tático**: Para cada característica do mapa, sugira uma regra do SRD 5e (Ex: Se há fogo, use regras de 'Damage from Hazards').
2. **Conflitos Sandbox**: Gere tensões que os jogadores possam resolver de múltiplas formas (combate, social, furtividade).
3. **Citação de Regras**: Sempre cite o nome da regra oficial no campo 'environmentalRules'.

Responda em Português Brasileiro.`,
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
