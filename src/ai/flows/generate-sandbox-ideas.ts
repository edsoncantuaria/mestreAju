'use server';
/**
 * @fileOverview A Genkit flow for generating sandbox ideas for a D&D 5e Dungeon Master.
 *
 * - generateSandboxIdeas - A function that generates narrative paths, impacts, and hidden agendas.
 * - GenerateSandboxIdeasInput - The input type for the generateSandboxIdeas function.
 * - GenerateSandboxIdeasOutput - The return type for the generateSandboxIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const GenerateSandboxIdeasInputSchema = z.object({
  situation: z.string().describe('A descrição da situação atual para a qual o Mestre busca ideias sandbox.'),
  factionsContext: z.string().optional().describe('Informações detalhadas sobre facções envolvidas, seus objetivos, relacionamentos e agendas conhecidas ou ocultas.'),
  npcsContext: z.string().optional().describe('Informações detalhadas sobre NPCs envolvidos, suas personalidades, relacionamentos e agendas conhecidas ou ocultas.'),
  pastEventsSummary: z.string().optional().describe('Um resumo de eventos passados relevantes que moldam o contexto atual.'),
  additionalContext: z.string().optional().describe('Qualquer contexto adicional fornecido pelo Mestre.'),
});
export type GenerateSandboxIdeasInput = z.infer<typeof GenerateSandboxIdeasInputSchema>;

// Output Schema
const SandboxPathAgendaSchema = z.object({
  whoGains: z.array(z.string()).describe('Lista de facções ou NPCs que se beneficiam com este caminho narrativo.'),
  whoLoses: z.array(z.string()).describe('Lista de facções ou NPCs que são prejudicados com este caminho narrativo.'),
  whoSeemsToGainButLoses: z.array(z.string()).describe('Lista de facções ou NPCs que inicialmente parecem se beneficiar, mas acabam sendo prejudicados ou manipulados neste caminho narrativo.'),
  manipulators: z.array(z.string()).describe('Lista de facções ou NPCs que estão manipulando os eventos nos bastidores neste caminho narrativo.'),
  betrayals: z.string().describe('Sugestões de traições possíveis que podem ocorrer neste caminho narrativo.'),
  incompleteInformation: z.string().describe('Exemplos de informações incompletas ou enganosas que podem surgir neste caminho narrativo.'),
  conflictingMotivations: z.string().describe('Descrição das motivações conflitantes que impulsionam os eventos neste caminho narrativo.'),
});

const SandboxPathImpactsSchema = z.object({
  shortTerm: z.string().describe('Impactos e consequências no curto prazo (imediatos, próximos 1-3 dias no jogo) para este caminho narrativo.'),
  mediumTerm: z.string().describe('Impactos e consequências no médio prazo (semanas a meses no jogo) para este caminho narrativo.'),
  longTerm: z.string().describe('Impactos e consequências no longo prazo (meses a anos no jogo) para este caminho narrativo.'),
});

const SandboxPossiblePathSchema = z.object({
  description: z.string().describe('Uma descrição clara e concisa de um possível caminho narrativo sandbox.'),
  impacts: SandboxPathImpactsSchema.describe('Os impactos sociais, econômicos e políticos deste caminho narrativo.'),
  agendas: SandboxPathAgendaSchema.describe('Análise das agendas ocultas, manipulações e jogos de poder envolvidos neste caminho narrativo.'),
});

const GenerateSandboxIdeasOutputSchema = z.object({
  analysis: z.string().describe('Uma breve análise do cenário atual.'),
  possiblePaths: z.array(SandboxPossiblePathSchema).describe('Uma lista de múltiplos caminhos narrativos sandbox possíveis, com seus impactos detalhados e considerações de agendas ocultas.'),
});
export type GenerateSandboxIdeasOutput = z.infer<typeof GenerateSandboxIdeasOutputSchema>;

// Wrapper function
export async function generateSandboxIdeas(input: GenerateSandboxIdeasInput): Promise<GenerateSandboxIdeasOutput> {
  return generateSandboxIdeasFlow(input);
}

// Prompt definition
const generateSandboxIdeasPrompt = ai.definePrompt({
  name: 'generateSandboxIdeasPrompt',
  input: { schema: GenerateSandboxIdeasInputSchema },
  output: { schema: GenerateSandboxIdeasOutputSchema },
  prompt: `Você é o Copiloto Supremo para Mestre de Dungeons & Dragons 5ª Edição (5e). Sua função é auxiliar o Mestre com ideias narrativas coerentes, consequências lógicas, ganchos sandbox, política e intrigas, sempre em português brasileiro.

O Mestre joga em estilo sandbox político e emergente. Nunca force um roteiro. Sempre ofereça múltiplas possibilidades. Trabalhe com consequências naturais. Considere impacto social, econômico e político. Sugira efeitos de curto, médio e longo prazo. Não indique "melhor escolha". Mostre impactos diferentes e considere agendas ocultas.

**Situação Atual:**
{{{situation}}}

{{#if factionsContext}}
**Contexto de Facções:**
{{{factionsContext}}}
{{/if}}

{{#if npcsContext}}
**Contexto de NPCs:**
{{{npcsContext}}}
{{/if}}

{{#if pastEventsSummary}}
**Eventos Passados Relevantes:**
{{{pastEventsSummary}}}
{{/if}}

{{#if additionalContext}}
**Contexto Adicional:**
{{{additionalContext}}}
{{/if}}

Gere múltiplos caminhos narrativos sandbox para a situação apresentada, seus impactos (curto, médio e longo prazo) e uma análise detalhada das agendas ocultas, incluindo quem ganha, quem perde, quem parece ganhar mas perde depois, quem manipula, traições possíveis, informações incompletas e motivações conflitantes para cada caminho.

Sua resposta DEVE ser um objeto JSON que estritamente adere ao esquema de saída fornecido, sem qualquer texto adicional fora do JSON.`,
});

// Flow definition
const generateSandboxIdeasFlow = ai.defineFlow(
  {
    name: 'generateSandboxIdeasFlow',
    inputSchema: GenerateSandboxIdeasInputSchema,
    outputSchema: GenerateSandboxIdeasOutputSchema,
  },
  async (input) => {
    const { output } = await generateSandboxIdeasPrompt(input);
    return output!;
  }
);
