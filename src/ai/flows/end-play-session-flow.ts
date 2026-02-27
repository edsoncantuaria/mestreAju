'use server';
/**
 * @fileOverview A Genkit flow to close a D&D session, generating a final consolidated summary
 * based on the running story, the turn-by-turn logs, and the DM's final notes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EndPlaySessionInputSchema = z.object({
    liveSummary: z
        .string()
        .describe('O parágrafo de história contínua que foi gerado até o momento na Sessão.'),
    turnLogs: z
        .array(z.string())
        .describe('Lista com o resumo de cada passo/turno gerado pela IA durante a Sessão.'),
    dmNotes: z
        .string()
        .describe('Anotações finais improvisadas pelo Mestre sobre o que rolou no final da sessão.'),
    currentConflicts: z
        .array(z.string())
        .describe('Lista de conflitos ativos atualmente no mundo (antes desta sessão).'),
    currentRumors: z
        .array(z.object({ rumor: z.string(), truthLevel: z.string(), source: z.string() }))
        .describe('Tabela de boatos atual do mundo (antes desta sessão).')
});
export type EndPlaySessionInput = z.infer<typeof EndPlaySessionInputSchema>;

const EndPlaySessionOutputSchema = z.object({
    finalSummary: z
        .string()
        .describe('Um parágrafo consolidado, longo e épico resumindo toda a sessão.'),
    nextSessionHook: z
        .string()
        .describe('Um gancho claro sugerindo onde a próxima sessão deve começar (Ex: "A sessão 2 começará com os heróis diante da porta do Rei").'),
    newActiveConflicts: z
        .array(z.string())
        .describe('A lista ATUALIZADA de conflitos. Remova os que foram resolvidos nesta sessão e adicione novos baseados nas consequências das ações dos jogadores.'),
    newRumorTable: z
        .array(z.object({
            rumor: z.string(),
            truthLevel: z.enum(['true', 'false', 'partial']),
            source: z.string()
        }))
        .describe('Tabela D10 de boatos NOVINHA. Mantenha os não resolvidos (se úteis) e crie novos baseados no que os heróis fizeram. As pessoas fofocam!'),
});
export type EndPlaySessionOutput = z.infer<typeof EndPlaySessionOutputSchema>;

export async function endPlaySession(
    input: EndPlaySessionInput
): Promise<EndPlaySessionOutput> {
    return endPlaySessionFlow(input);
}

const endPlaySessionPrompt = ai.definePrompt({
    name: 'endPlaySessionPrompt',
    input: { schema: EndPlaySessionInputSchema },
    output: { schema: EndPlaySessionOutputSchema },
    prompt: `Você é o Escrivão Mágico de D&D 5e responsável por documentar o fim de uma Sessão de Jogo.
Sua missão é pegar os dados em tempo real + as anotações improvisadas do Mestre e transformá-los no registro final desta sessão para o Livro de Histórias da Campanha.

---
História Contínua (gerada durante a sessão):
{{{liveSummary}}}

---
Passos/Turnos que rolaram (Em Ordem Cronológica):
{{#each turnLogs}}
- {{this}}
{{/each}}

---
Anotações Finais do Mestre (Imediatas, o que aconteceu no final que não estava no log):
{{{dmNotes}}}

---
Conflitos Ativos (Início da Sessão):
{{#each currentConflicts}}
- {{this}}
{{/each}}

Boatos (Início da Sessão):
{{#each currentRumors}}
- {{this.rumor}} ({{this.truthLevel}}) - Fonte: {{this.source}}
{{/each}}


Crie o \`finalSummary\` misturando todos esses elementos numa narrativa coesa e épica.
E gere um \`nextSessionHook\` prático para o Mestre saber onde ele deve dar o "Play" na semana que vem.

MUITO IMPORTANTE: Baseado nas ações dos jogadores (finalSummary e turnLogs), atualize os \`newActiveConflicts\` e a \`newRumorTable\`. 
- Se os jogadores mataram um lorde, o boato na rua amanhã será sobre o assassinato. 
- Se eles resolveram uma seca, esse conflito some de "newActiveConflicts" e surge um novo sobre o vácuo de poder na guilda das águas.

Em português brasileiro.`,
});

const endPlaySessionFlow = ai.defineFlow(
    {
        name: 'endPlaySessionFlow',
        inputSchema: EndPlaySessionInputSchema,
        outputSchema: EndPlaySessionOutputSchema,
    },
    async (input) => {
        const { output } = await endPlaySessionPrompt(input);
        if (!output) {
            throw new Error('Failed to generate end session summary.');
        }
        return output;
    }
);
