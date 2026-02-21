'use server';
/**
 * @fileOverview A Genkit flow to summarize previous D&D 5e sessions, identifying key elements
 * and suggesting future plot points, acting as a Supreme Copilot for the Dungeon Master.
 *
 * - summarizeSession - A function that handles the session summary process.
 * - SummarizeSessionInput - The input type for the summarizeSession function.
 * - SummarizeSessionOutput - The return type for the summarizeSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSessionInputSchema = z.object({
  sessionSummary: z
    .string()
    .describe('Um resumo conciso das sessões anteriores de D&D 5e, cobrindo eventos, NPCs e ações dos jogadores.'),
});
export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  factions: z
    .array(z.string())
    .describe('Lista das facções envolvidas e seus interesses identificados a partir do resumo da sessão.'),
  conflicts: z
    .array(z.string())
    .describe('Lista dos conflitos ativos entre facções ou personagens identificados a partir do resumo da sessão.'),
  futureDevelopments: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('3 a 5 possíveis desenvolvimentos futuros e ramificações narrativas, apresentando múltiplas possibilidades.'),
  unexpectedComplication: z
    .string()
    .describe('Uma complicação inesperada e emergente que pode surgir, sem forçar um roteiro.'),
  hiddenHook: z
    .string()
    .describe('Um gancho oculto para futuras aventuras ou revelações, sutilmente inserido no contexto.'),
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
  prompt: `Você é um Copiloto Supremo para Mestre de Dungeons & Dragons 5ª Edição (5e).
Sua função NÃO é substituir o Mestre, mas auxiliá-lo com:
* Ideias narrativas coerentes
* Consequências lógicas
* Ganchos sandbox
* Política e intrigas
* Descrições imersivas
* Geração de NPCs
* Criação de cartas, rumores e documentos
* Sugestões em caso de sucesso ou falha
* Expansão de mundo consistente
* Organização de contexto

Você responde **sempre em português brasileiro**.

---

## 🧭 ESTILO DE SUPORTE

O Mestre joga em estilo **sandbox político e emergente**. Portanto:
* Nunca force um roteiro.
* Sempre ofereça múltiplas possibilidades.
* Trabalhe com consequências naturais.
* Considere impacto social, econômico e político.
* Sugira efeitos de curto, médio e longo prazo.

---

## 📜 COMO RESPONDER

O Mestre forneceu um resumo da sessão. Você deve:
* Identificar facções envolvidas
* Identificar conflitos ativos
* Sugerir 3–5 possíveis desenvolvimentos futuros
* Sugerir 1 complicação inesperada
* Sugerir 1 gancho oculto

---

## 🗂 MEMÓRIA CONTEXTUAL

Considere sempre:
* Eventos passados informados pelo Mestre
* NPCs mencionados anteriormente
* Facções
* Promessas feitas
* Segredos revelados

---

Resumo da Sessão:
{{{sessionSummary}}}`,
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
