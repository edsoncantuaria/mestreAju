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
            partyMembers: z.array(z.object({
                name: z.string().optional(),
                race: z.string().optional(),
                class: z.string().optional(),
                level: z.number().optional(),
            })).optional(),
            narrativeStyle: z.enum(['minimalist', 'immersive', 'theatrical']).optional(),
        }),
        outputSchema: LongRestSchema,
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'longRestPrompt',
            input: {
                schema: z.object({
                    currentLocation: z.string(),
                    inGameDate: z.string(),
                    liveSummary: z.string(),
                    campaignLore: z.string().optional(),
                    partyMembers: z.array(z.any()).optional(),
                    narrativeStyle: z.string().optional(),
                })
            },
            output: { schema: LongRestSchema },
            prompt: `
Contexto de Campanha: {{campaignLore}}
Data Atual: {{inGameDate}}
Localização: {{currentLocation}}
Resumo da Situação Atual: {{liveSummary}}

{{#if narrativeStyle}}
**ESTILO NARRATIVO REQUERIDO: {{narrativeStyle}}**
- Se "minimalist": Descrições curtas, factuais e diretas.
- Se "immersive": Descrições ricas, sensoriais (cheiro, som, luz) e atmosféricas.
- Se "theatrical": Foque no drama, impacto emocional e frases de efeito.
{{/if}}

GRUPO (PARTY):
{{#each partyMembers}}
- {{name}} ({{race}} {{class}})
{{/each}}

A party decidiu fazer um **Descanso Longo**. 
Gere um "Salto Temporal" (Time Lapse) que descreva a passagem das horas/dia.
Foque em:
1. Como o ambiente mudou (noite para dia, clima, atmosfera).
2. O que aconteceu no mundo enquanto eles dormiam (rumores, eventos distantes).
3. Personalize a narrativa mencionando ações sutis de membros da party durante o descanso (ex: alguém meditando, limpando armas, ou tendo sonhos proféticos). Se houver multiclasse (Ex: Guerreiro 1 / Mago 2), mencione como o herói equilibra essas naturezas distintas durante o repouso.

Mantenha o tom de acordo com o ESTILO NARRATIVO REQUERIDO e coerente com o resumo fornecido.
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
    partyMembers?: any[];
    narrativeStyle?: 'minimalist' | 'immersive' | 'theatrical';
}) {
    return longRestFlowImpl(input);
}
