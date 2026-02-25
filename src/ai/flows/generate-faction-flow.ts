'use server';
/**
 * @fileOverview Genkit flow for generating Factions for D&D 5e campaigns.
 * Implements the Professional World Design Faction specification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFactionInputSchema = z.object({
  context: z.string().describe('O contexto da região, conflito central e poder vigente.'),
  influence: z.enum(['Local', 'Regional', 'Global']).default('Regional'),
  existingFactions: z.string().optional().describe('Facções já existentes para criar relações e conflitos cruzados.'),
  ideologyHint: z.string().optional().describe('Ideologia ou método sugerido para a facção (ex: supremacistas mágicos, guilda mercantil corrupta).'),
});
export type GenerateFactionInput = z.infer<typeof GenerateFactionInputSchema>;

const GenerateFactionOutputSchema = z.object({
  name: z.string(),
  motto: z.string().describe('Lema da facção — o que declaram publicamente.'),
  ideology: z.string().describe('O que a facção realmente acredita e por quê.'),
  method: z.string().describe('Como agem: sedução política, violência calculada, espionagem, acumulação de riqueza, manipulação religiosa, etc.'),
  alignment: z.string(),
  influence: z.string().describe('Local, Regional ou Global.'),
  powerSource: z.string().describe('De onde vem o poder desta facção: ouro, fé, segredos, força militar, magia, informação.'),
  publicFace: z.string().describe('Como a facção se apresenta ao mundo — o que os cidadãos comuns acreditam sobre ela.'),
  hiddenAgenda: z.string().describe('O verdadeiro plano que poucos dentro da própria facção conhecem.'),
  enemies: z.array(z.object({
    name: z.string(),
    reason: z.string().describe('Por que são inimigos: conflito de interesse, trauma histórico, competição por recurso.'),
    currentTension: z.string().describe('O que está acontecendo agora entre eles.'),
  })).describe('Inimigos declarados e ocultos.'),
  allies: z.array(z.object({
    name: z.string(),
    type: z.string().describe('Aliança real, conveniente, forçada ou infiltrada.'),
  })).optional(),
  agendas: z.array(z.string()).describe('3-5 objetivos ativos visíveis ou ocultos agora.'),
  shortTermPlan: z.string().describe('Plano de 6 meses: o que vão fazer concretamente nas próximas semanas.'),
  longTermPlan: z.string().describe('Plano de 5 anos: o que o mundo parecerá se conseguirem.'),
  internalConflict: z.string().describe('Tensão interna — fação ou membro que pode trair ou rachar a organização.'),
  notableMembers: z.array(z.object({
    name: z.string(),
    role: z.string(),
    secret: z.string().describe('O que este membro esconde da própria facção.'),
  })).describe('2-3 membros notáveis com segredos internos.'),
});
export type GenerateFactionOutput = z.infer<typeof GenerateFactionOutputSchema>;

export async function generateFaction(input: GenerateFactionInput): Promise<GenerateFactionOutput> {
  return generateFactionFlow(input);
}

const generateFactionFlow = ai.defineFlow(
  {
    name: 'generateFactionFlow',
    inputSchema: GenerateFactionInputSchema,
    outputSchema: GenerateFactionOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'generateFactionPrompt',
      input: { schema: GenerateFactionInputSchema },
      output: { schema: GenerateFactionOutputSchema },
      prompt: `Você é o Arquiteto de Sociedades do MestreAju — especialista em facções para campanhas sandbox de D&D 5e.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS PARA FACÇÕES PROFISSIONAIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Toda facção tem uma FACE PÚBLICA (o que declara) e uma AGENDA OCULTA (o que realmente quer).
2. Toda facção tem uma FONTE DE PODER específica e defensável.
3. Toda facção tem INIMIGOS com histórico concreto — não apenas "são do lado oposto".
4. O PLANO DE 6 MESES deve ter ações concretas acontecendo agora.
5. O PLANO DE 5 ANOS deve reconfigurar o poder da região se bem-sucedido.
6. Toda facção tem uma TENSÃO INTERNA — ninguém é monolítico.
7. Membros notáveis têm segredos que podem ser explorados pelos jogadores.
8. Use apenas panteão oficial D&D 5e para afiliações religiosas.

CONTEXTO REGIONAL: {{{context}}}
ESCALA DE INFLUÊNCIA: {{{influence}}}

{{#if ideologyHint}}
DICA IDEOLÓGICA DO MESTRE: {{{ideologyHint}}}
{{/if}}

{{#if existingFactions}}
FACÇÕES JÁ EXISTENTES (crie relações, conflitos e alianças cruzadas):
{{{existingFactions}}}
{{/if}}

Responda exclusivamente em Português Brasileiro.`,
    });

    const { output } = await prompt(input);
    return output!;
  }
);
