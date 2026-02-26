'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LongRestSchema = z.object({
    timeLapseNarrative: z.string().describe('Uma breve narrativa (2-3 parágrafos) descrevendo o que aconteceu no mundo durante o descanso.'),
    upcomingHooks: z.array(z.string()).describe('Novos ganchos ou rumores que surgiram.'),
    worldChanges: z.array(z.string()).describe('Pequenas mudanças no estado do mundo.'),
});

const longRestFlowImpl = ai.defineFlow(
    {
        name: 'longRestFlow',
        inputSchema: z.object({
            currentLocation: z.string(),
            inGameDate: z.string(),
            liveSummary: z.string(),
            campaignLore: z.string().optional(),
        }),
        outputSchema: LongRestSchema,
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'longRestPrompt',
            input: { schema: z.object({ currentLocation: z.string(), inGameDate: z.string(), liveSummary: z.string(), campaignLore: z.string().optional() }) },
            output: { schema: LongRestSchema },
            prompt: `
Contexto de Campanha: {{campaignLore}}
Data Atual: {{inGameDate}}
Localização: {{currentLocation}}
Resumo da Situação Atual: {{liveSummary}}

A party decidiu fazer um **Descanso Longo**. 
Gere um "Salto Temporal" (Time Lapse) que descreva a passagem das horas/dia.
Foque em:
1. Como o ambiente mudou (noite para dia, clima, atmosfera).
2. O que aconteceu no mundo enquanto eles dormiam (rumores, eventos distantes).
3. Sensação de progressão do tempo.

Mantenha o tom imersivo e coerente com o resumo fornecido.
`,
        });

        const { output } = await prompt(input);
        return output!;
    }
);

export async function longRestFlow(input: {
    currentLocation: string;
    inGameDate: string;
    liveSummary: string;
    campaignLore?: string;
}) {
    return longRestFlowImpl(input);
}
