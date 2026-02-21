'use server';
/**
 * @fileOverview Um copiloto de IA para Mestres de D&D 5e que analisa uma situação específica,
 * oferecendo insights contextuais, consequências plausíveis para sucesso e falha,
 * e sugestões para escalonamento de tensão.
 *
 * - analyzeContext - Uma função que inicia o processo de análise de contexto.
 * - AnalyzeContextInput - O tipo de entrada para a função analyzeContext.
 * - AnalyzeContextOutput - O tipo de retorno para a função analyzeContext.
 */

import {ai} from '@/ai/genkit';
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
  analise: z.string().describe('Breve leitura do cenário e análise do contexto, considerando eventos passados, NPCs, facções e promessas.'),
  caminhosPossiveis: z.array(z.string()).describe('Sugestões de 3 a 5 possíveis caminhos ou desdobramentos para a situação, incluindo cenários de sucesso e falha.'),
  consequencias: z.object({
    curtoPrazo: z.string().describe('Impactos e resultados imediatos das ações, considerando sucesso e falha.'),
    medioPrazo: z.string().describe('Desdobramentos e impactos em um futuro próximo.'),
    longoPrazo: z.string().describe('Efeitos e ramificações duradouras no mundo do jogo.')
  }).describe('Consequências plausíveis das ações dos jogadores em diferentes horizontes de tempo.'),
  complicacaoOculta: z.string().describe('Uma complicação inesperada ou um gancho oculto que adiciona uma camada extra de interesse.'),
  escalonamentoTensao: z.string().describe('Sugestões para o escalonamento da tensão na situação atual.'),
}).describe('A análise completa do contexto para uma situação específica, incluindo caminhos possíveis, consequências e escalonamento de tensão.');
export type AnalyzeContextOutput = z.infer<typeof AnalyzeContextOutputSchema>;

export async function analyzeContext(input: AnalyzeContextInput): Promise<AnalyzeContextOutput> {
  return analyzeContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeContextPrompt',
  input: {schema: AnalyzeContextInputSchema},
  output: {schema: AnalyzeContextOutputSchema},
  prompt: `Você é um Copiloto Supremo para Mestre de Dungeons & Dragons 5ª Edição (5e).
Sua função é auxiliar o Mestre com ideias narrativas coerentes, consequências lógicas e ganchos sandbox.

**Sempre responda em português brasileiro.**

### ESTILO DE SUPORTE
O Mestre joga em estilo sandbox político e emergente. Portanto:
* Nunca force um roteiro.
* Sempre ofereça múltiplas possibilidades.
* Trabalhe com consequências naturais.
* Considere impacto social, econômico e político.
* Sugira efeitos de curto, médio e longo prazo.

### COMO RESPONDER A UMA SITUAÇÃO ESPECÍFICA
O Mestre forneceu uma situação específica. Você deve:
* Analisar o contexto, considerando eventos passados, NPCs, facções e promessas.
* Integrar consequências plausíveis para SUCESSO e complicações interessantes (não apenas punições) para FALHA dentro das seções de "Caminhos Possíveis" e "Consequências".
* Sugerir escalonamento de tensão.

### MEMÓRIA CONTEXTUAL
Considere sempre os seguintes elementos para a análise:
* Eventos passados: {{{pastEvents}}}
* NPCs mencionados: {{{npcs}}}
* Facções relevantes: {{{factions}}}
* Promessas feitas: {{{promises}}}

### SITUAÇÃO ESPECÍFICA A SER ANALISADA
{{{situation}}}

---

**Sua resposta deve seguir estritamente o seguinte formato JSON, com todo o conteúdo em português brasileiro:**
{
  "analise": "...",
  "caminhosPossiveis": [
    "...",
    "...",
    "..."
  ],
  "consequencias": {
    "curtoPrazo": "...",
    "medioPrazo": "...",
    "longoPrazo": "..."
  },
  "complicacaoOculta": "...",
  "escalonamentoTensao": "..."
}
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
