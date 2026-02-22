'use server';
/**
 * @fileOverview A Genkit flow to summarize previous D&D 5e sessions, identifying key elements
 * and highlighting mechanical changes (XP, gold, status).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSessionInputSchema = z.object({
  sessionSummary: z
    .string()
    .describe('Um resumo das sessões anteriores, cobrindo eventos, NPCs e ações dos jogadores.'),
});
export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  factions: z
    .array(z.string())
    .describe('Facções envolvidas e seus interesses.'),
  conflicts: z
    .array(z.string())
    .describe('Conflitos ativos identificados.'),
  mechanicalImpact: z.object({
    xpAwarded: z.string().optional().describe('Sugestão de XP total para a sessão.'),
    lootAcquired: z.array(z.string()).optional().describe('Itens mágicos ou tesouros citados.'),
    statusChanges: z.array(z.string()).optional().describe('Mudanças de status (Ex: nível de exaustão, mortes, maldições).'),
  }).describe('Análise mecânica da sessão.'),
  futureDevelopments: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('Desenvolvimentos futuros possíveis.'),
  unexpectedComplication: z
    .string()
    .describe('Uma complicação emergente baseada em regras.'),
  hiddenHook: z
    .string()
    .describe('Um gancho oculto para futuras aventuras.'),
});
export type SummarizeSessionOutput = z.infer<typeof SummarizeSessionOutputSchema>;

export async function summarizeSession(
  input: SummarizeSessionInput
): Promise<SummarizeSessionOutput> {
  return summarizeSessionFlow(input);
}

const summarizeSessionPrompt = ai.definePrompt({
  name: 'summarizeSessionPrompt',
  input: {schema: SummarizeSessionInputSchema},
  output: {schema: SummarizeSessionOutputSchema},
  prompt: `Você é o Arquivista Supremo de D&D 5e.
Sua função é resumir a sessão focando no equilíbrio entre NARRATIVA e REGRAS.

Destaque:
1. **Impacto Mecânico**: Quem subiu de nível? Quem ganhou exaustão? Quais itens mágicos foram encontrados?
2. **Evolução de Facções**: Como o poder político mudou?
3. **Sandbox**: Quais caminhos se abriram?

Resumo da Sessão:
{{{sessionSummary}}}

Responda em português brasileiro.`,
});

const summarizeSessionFlow = ai.defineFlow(
  {
    name: 'summarizeSessionFlow',
    inputSchema: SummarizeSessionInputSchema,
    outputSchema: SummarizeSessionOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeSessionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate session summary.');
    }
    return output;
  }
);
