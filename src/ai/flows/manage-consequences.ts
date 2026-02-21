'use server';
/**
 * @fileOverview Um fluxo Genkit para sugerir consequências de curto, médio e longo prazo para ações dos jogadores em D&D 5e.
 *
 * - manageConsequences - Uma função que gera consequências sociais, econômicas e políticas para as ações dos jogadores.
 * - ManageConsequencesInput - O tipo de entrada para a função manageConsequences.
 * - ManageConsequencesOutput - O tipo de retorno para a função manageConsequences.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ManageConsequencesInputSchema = z.object({
  playerAction: z.string().describe('A descrição detalhada da ação tomada pelos jogadores.'),
  context: z.string().describe('O contexto atual do mundo do jogo, incluindo NPCs, facções, eventos passados e quaisquer informações relevantes.'),
});
export type ManageConsequencesInput = z.infer<typeof ManageConsequencesInputSchema>;

const ManageConsequencesOutputSchema = z.object({
  shortTerm: z.array(z.string().describe('Uma descrição da consequência de curto prazo (imediata a poucos dias), incluindo seu impacto social, econômico ou político.')),
  mediumTerm: z.array(z.string().describe('Uma descrição da consequência de médio prazo (semanas a meses), incluindo seu impacto social, econômico ou político.')),
  longTerm: z.array(z.string().describe('Uma descrição da consequência de longo prazo (meses a anos), incluindo seu impacto social, econômico ou político.')),
});
export type ManageConsequencesOutput = z.infer<typeof ManageConsequencesOutputSchema>;

export async function manageConsequences(input: ManageConsequencesInput): Promise<ManageConsequencesOutput> {
  return manageConsequencesFlow(input);
}

const consequencesPrompt = ai.definePrompt({
  name: 'consequencesPrompt',
  input: { schema: ManageConsequencesInputSchema },
  output: { schema: ManageConsequencesOutputSchema },
  prompt: `Você é um Copiloto Supremo para Mestre de Dungeons & Dragons 5ª Edição (5e), especializado em auxiliar o Mestre com ideias narrativas coerentes, consequências lógicas e expansão de mundo consistente. O Mestre joga em um estilo sandbox político e emergente.

Nunca force um roteiro. Sempre ofereça múltiplas possibilidades. Trabalhe com consequências naturais. Considere impacto social, econômico e político. Sugira efeitos de curto, médio e longo prazo.

Dada a seguinte ação dos jogadores e o contexto atual do mundo, forneça sugestões de consequências em curto, médio e longo prazo. As consequências devem cobrir impactos sociais, econômicos e políticos, onde aplicável, e ser relevantes para o estilo sandbox do Mestre.

Ação dos Jogadores: {{{playerAction}}}

Contexto Atual:
{{{context}}}

Sugira de 2 a 3 consequências para cada período (curto, médio, longo prazo).`,
});

const manageConsequencesFlow = ai.defineFlow(
  {
    name: 'manageConsequencesFlow',
    inputSchema: ManageConsequencesInputSchema,
    outputSchema: ManageConsequencesOutputSchema,
  },
  async (input) => {
    const { output } = await consequencesPrompt(input);
    return output!;
  }
);
