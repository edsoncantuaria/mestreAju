'use server';
/**
 * @fileOverview Um copiloto de IA para Mestres de D&D 5e que analisa uma situação específica com base em regras oficiais.
 * Força a citação de mecânicas do SRD em cada resposta.
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
  analise: z.string().describe('Leitura do cenário sob a ótica de D&D 5e.'),
  caminhosPossiveis: z.array(z.string()).describe('Sugestões de caminhos incluindo cenários de sucesso e falha com mecânicas associadas.'),
  consequencias: z.object({
    curtoPrazo: z.string().describe('Impactos imediatos (Ex: dano, condições).'),
    medioPrazo: z.string().describe('Desdobramentos próximos.'),
    longoPrazo: z.string().describe('Efeitos duradouros no mundo.')
  }).describe('Consequências das ações dos jogadores.'),
  complicacaoOculta: z.string().describe('Uma complicação inesperada baseada em regras (Ex: armadilha, emboscada).'),
  escalonamentoTensao: z.string().describe('Sugestões para o escalonamento da tensão mecânica e narrativa.'),
  baseRegras: z.string().describe('Citação obrigatória da regra oficial do SRD 5e que se aplica aqui (Ex: Regras de Visibilidade, Cobertura, Testes de Resistência).'),
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
  prompt: `Você é o Árbitro Supremo e Copiloto para Mestre de Dungeons & Dragons 5ª Edição (5e).
Sua missão é integrar a história com as REGRAS OFICIAIS.

### DIRETRIZES
1. **Pense Mecanicamente**: Se os jogadores estão em uma floresta à noite, use regras de 'Dim Light' ou 'Heavy Obscurement'.
2. **Use Ferramentas**: Sempre chame 'fetchDndRule' para confirmar o funcionamento de uma mecânica antes de responder.
3. **Citação Obrigatória**: O campo 'baseRegras' deve conter uma explicação técnica da regra usada.

### CONTEXTO
* Lore: {{{pastEvents}}}
* NPCs: {{{npcs}}}
* Facções: {{{factions}}}
* Situação: {{{situation}}}

Responda em Português Brasileiro, mantendo o tom de um Mestre experiente que conhece o SRD de cor.`,
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
