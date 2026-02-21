'use server';
/**
 * @fileOverview Fluxo Genkit para gerar Facções e Organizações para D&D 5e Sandbox.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFactionInputSchema = z.object({
  context: z.string().describe('O contexto da região ou conflito principal.'),
  influence: z.enum(['Local', 'Regional', 'Global']).default('Regional'),
});
export type GenerateFactionInput = z.infer<typeof GenerateFactionInputSchema>;

const GenerateFactionOutputSchema = z.object({
  name: z.string(),
  description: z.string().describe('Ideologia, métodos e recursos.'),
  alignment: z.string(),
  powerLevel: z.string(),
  agendas: z.array(z.string()).describe('3-5 objetivos atuais (abertos ou ocultos).'),
});
export type GenerateFactionOutput = z.infer<typeof GenerateFactionOutputSchema>;

export async function generateFaction(input: GenerateFactionInput): Promise<GenerateFactionOutput> {
  return generateFactionFlow(input);
}

const generateFactionFlow = ai.defineFlow(
  {
    name: 'generateFactionFlow',
    inputSchema: GenerateFactionInputSchema,
    outputSchema: GenerateFactionOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'generateFactionPrompt',
      input: {schema: GenerateFactionInputSchema},
      output: {schema: GenerateFactionOutputSchema},
      prompt: `Você é o Arquiteto de Sociedades do MestreAju. 
Crie uma facção para D&D 5e que se encaixe em um cenário de Sandbox.
A facção deve ter interesses claros que podem colidir com os jogadores ou outras facções.

CONTEXTO REGIONAL: {{{context}}}
INFLUÊNCIA: {{{influence}}}

Responda em Português Brasileiro.`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
