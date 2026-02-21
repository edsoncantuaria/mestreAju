'use server';
/**
 * @fileOverview A Genkit flow for generating narrative text such as letters, rumors, or documents for D&D 5e.
 *
 * - generateNarrativeText - A function that handles the generation of narrative text.
 * - GenerateNarrativeTextInput - The input type for the generateNarrativeText function.
 * - GenerateNarrativeTextOutput - The return type for the generateNarrativeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNarrativeTextInputSchema = z.object({
  worldLore: z
    .string()
    .describe(
      'Uma descrição detalhada da lore do mundo de jogo, incluindo facções, eventos recentes e contexto relevante.'
    ),
  documentType: z
    .enum(['carta', 'rumor', 'documento'])
    .describe('O tipo de texto narrativo a ser gerado (carta, rumor, ou documento).'),
  tone: z
    .string()
    .describe('O tom desejado para o texto (ex: nobre, ameaçador, desesperado, político, formal, informal).'),
  messageContent: z
    .string()
    .describe('A mensagem principal ou conteúdo central que o texto deve transmitir.'),
  involvedCharacters: z
    .string()
    .optional()
    .describe(
      'Nomes de NPCs ou facções relevantes e seus interesses/agendas em relação a esta narrativa, para adicionar profundidade (opcional).'
    ),
});
export type GenerateNarrativeTextInput = z.infer<typeof GenerateNarrativeTextInputSchema>;

const GenerateNarrativeTextOutputSchema = z.object({
  narrativeText: z.string().describe('O texto narrativo gerado, pronto para ser usado na mesa de D&D.'),
});
export type GenerateNarrativeTextOutput = z.infer<typeof GenerateNarrativeTextOutputSchema>;

export async function generateNarrativeText(
  input: GenerateNarrativeTextInput
): Promise<GenerateNarrativeTextOutput> {
  return generateNarrativeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNarrativeTextPrompt',
  input: {schema: GenerateNarrativeTextInputSchema},
  output: {schema: GenerateNarrativeTextOutputSchema},
  prompt: `Você é um Copiloto Supremo para Mestre de Dungeons & Dragons 5ª Edição (5e). Sua função é auxiliar o Mestre a gerar textos narrativos como cartas, rumores ou documentos que sejam coerentes com a lore do mundo de jogo e adaptados a um tom específico.

---
INFORMAÇÕES DO MUNDO DE JOGO:
{{{worldLore}}}
---
TIPO DE TEXTO: {{{documentType}}}
TOM DESEJADO: {{{tone}}}
MENSAGEM PRINCIPAL: {{{messageContent}}}
{{#if involvedCharacters}}
PERSONAGENS/FACÇÕES ENVOLVIDAS E SEUS INTERESSES: {{{involvedCharacters}}}
{{/if}}

Com base nas informações acima, produza um texto narrativo completo para uma {{documentType}}. Mantenha a coerência com a lore do mundo de jogo e adapte o tom conforme especificado. Se houver personagens ou facções envolvidas, certifique-se de que a narrativa reflita seus interesses ou a forma como eles interagiriam com o conteúdo. O texto deve estar pronto para leitura em mesa.

`,
});

const generateNarrativeTextFlow = ai.defineFlow(
  {
    name: 'generateNarrativeTextFlow',
    inputSchema: GenerateNarrativeTextInputSchema,
    outputSchema: GenerateNarrativeTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
