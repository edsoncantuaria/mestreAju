'use server';
/**
 * @fileOverview Um copiloto de IA para Mestres de D&D 5e que analisa uma situação específica com base em regras oficiais.
 */

import {ai, fetchDndRuleTool} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeContextInputSchema = z.object({
  situation: z.string().describe('A descrição da situação específica apresentada pelo Mestre.'),
  pastEvents: z.string().describe('Um resumo dos eventos passados relevantes para a situação.'),
  npcs: z.string().describe('Descrições dos NPCs relevantes envolvidos na situação.'),
  factions: z.string().describe('Descrições das facções relevantes envolvidas na situação.'),
  promises: z.string().describe('Quaisquer promessas importantes feitas que podem influenciar a situação.'),
});
export type AnalyzeContextInput = z.infer<typeof AnalyzeContextInputSchema>;

const AnalyzeContextOutputSchema = z.object({
  analise: z.string().describe('Breve leitura do cenário e análise do contexto.'),
  caminhosPossiveis: z.array(z.string()).describe('Sugestões de caminhos incluindo cenários de sucesso e falha.'),
  consequencias: z.object({
    curtoPrazo: z.string().describe('Impactos imediatos.'),
    medioPrazo: z.string().describe('Desdobramentos próximos.'),
    longoPrazo: z.string().describe('Efeitos duradouros.')
  }).describe('Consequências das ações dos jogadores.'),
  complicacaoOculta: z.string().describe('Uma complicação inesperada.'),
  escalonamentoTensao: z.string().describe('Sugestões para o escalonamento da tensão.'),
  baseRegras: z.string().optional().describe('Referência a uma regra oficial de D&D 5e que se aplica aqui (ex: Condições, Testes de Perícia).'),
}).describe('A análise completa do contexto para uma situação específica.');
export type AnalyzeContextOutput = z.infer<typeof AnalyzeContextOutputSchema>;

export async function analyzeContext(input: AnalyzeContextInput): Promise<AnalyzeContextOutput> {
  return analyzeContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeContextPrompt',
  tools: [fetchDndRuleTool],
  input: {schema: AnalyzeContextInputSchema},
  output: {schema: AnalyzeContextOutputSchema},
  prompt: `Você é um Copiloto Supremo para Mestre de Dungeons & Dragons 5ª Edição (5e).
Sempre responda em português brasileiro.

### ESTILO DE SUPORTE
O Mestre joga em estilo sandbox político e emergente. Portanto:
* Nunca force um roteiro.
* Ofereça consequências naturais e mecânicas precisas.

### REGRAS OFICIAIS
Use a ferramenta fetchDndRule para confirmar mecânicas se a situação envolver perícias específicas, condições (como envenenado, caído) ou regras de ambiente. Cite a regra brevemente no campo "baseRegras".

### CONTEXTO
* Eventos passados: {{{pastEvents}}}
* NPCs: {{{npcs}}}
* Facções: {{{factions}}}
* Situação: {{{situation}}}
`,
});

const analyzeContextFlow = ai.defineFlow(
  {
    name: 'analyzeContextFlow',
    inputSchema: AnalyzeContextInputSchema,
    outputSchema: AnalyzeContextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
