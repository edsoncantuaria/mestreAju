
'use server';
/**
 * @fileOverview Fluxo Genkit para gerar NPCs profundos para D&D 5e Sandbox.
 * Inclui geração de macro para Roll20 baseada em Roll Templates.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNpcInputSchema = z.object({
  context: z.string().describe('O contexto atual da sessão ou local.'),
  race: z.string().optional().describe('Raça desejada (ex: Humano, Elfo).'),
  role: z.string().optional().describe('Papel social (ex: Ferreiro, Espião, Nobre).'),
});
export type GenerateNpcInput = z.infer<typeof GenerateNpcInputSchema>;

const GenerateNpcOutputSchema = z.object({
  name: z.string(),
  race: z.string(),
  dndClass: z.string(),
  description: z.string().describe('Aparência física e trejeitos.'),
  backstory: z.string().describe('Resumo da história pessoal.'),
  alignment: z.string(),
  motivations: z.string().describe('O que move este NPC agora?'),
  secrets: z.string().describe('Algo que ele esconde dos jogadores.'),
  roll20Macro: z.string().describe('Uma macro do Roll20 usando &{template:default} que mostra os principais atributos, ataques e defesas para uso imediato no chat.'),
});
export type GenerateNpcOutput = z.infer<typeof GenerateNpcOutputSchema>;

export async function generateNpc(input: GenerateNpcInput): Promise<GenerateNpcOutput> {
  return generateNpcFlow(input);
}

const generateNpcFlow = ai.defineFlow(
  {
    name: 'generateNpcFlow',
    inputSchema: GenerateNpcInputSchema,
    outputSchema: GenerateNpcOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'generateNpcPrompt',
      input: {schema: GenerateNpcInputSchema},
      output: {schema: GenerateNpcOutputSchema},
      prompt: `Você é o Criador de Personagens do MestreAju. 
Gere um NPC de D&D 5e altamente detalhado e pronto para um jogo de Sandbox Político.
O NPC deve ter profundidade, motivações conflitantes e um segredo que pode ser um gancho de trama.

ALÉM DISSO, gere uma macro para Roll20 no campo "roll20Macro".
A macro deve usar o template padrão: &{template:default} {{name=FICHA: NomeDoNPC}} {{Raça=Raça}} {{Classe=Classe}} {{CA=Valor}} {{HP=Valor}} {{Ataque=[[1d20+Bônus]]}} {{Dano=[[Dado+Bônus]]}} {{Segredo/Nota=Descrição Curta}}.

CONTEXTO: {{{context}}}
{{#if race}}RAÇA DESEJADA: {{{race}}}{{/if}}
{{#if role}}PAPEL DESEJADO: {{{role}}}{{/if}}

Responda em Português Brasileiro.`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
