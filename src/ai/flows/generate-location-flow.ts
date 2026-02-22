'use server';
/**
 * @fileOverview Fluxo Genkit para gerar Locais Sandbox para D&D 5e.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLocationInputSchema = z.object({
  context: z.string().describe('O contexto da região ou lore do mundo.'),
  type: z.string().optional().describe('Tipo de local (ex: Cidade, Masmorra, Taverna).'),
});
export type GenerateLocationInput = z.infer<typeof GenerateLocationInputSchema>;

const GenerateLocationOutputSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().describe('Atmosfera, aparência e história breve.'),
  features: z.array(z.string()).describe('3-5 características marcantes ou pontos de interesse.'),
});
export type GenerateLocationOutput = z.infer<typeof GenerateLocationOutputSchema>;

export async function generateLocation(input: GenerateLocationInput): Promise<GenerateLocationOutput> {
  return generateLocationFlow(input);
}

const generateLocationFlow = ai.defineFlow(
  {
    name: 'generateLocationFlow',
    inputSchema: GenerateLocationInputSchema,
    outputSchema: GenerateLocationOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'generateLocationPrompt',
      input: {schema: GenerateLocationInputSchema},
      output: {schema: GenerateLocationOutputSchema},
      prompt: `Você é o Arquiteto de Mundos do MestreAju.
Crie um local para D&D 5e Sandbox que seja evocativo e cheio de potencial narrativo.

CONTEXTO: {{{context}}}
{{#if type}}TIPO DESEJADO: {{{type}}}{{/if}}

Responda em Português Brasileiro.`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
