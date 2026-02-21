'use server';
/**
 * @fileOverview Fluxo Genkit para gerar NPCs profundos para D&D 5e Sandbox com comandos de importação Roll20.
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
  stats: z.object({
    hp: z.number(),
    ac: z.number(),
    speed: z.string(),
    str: z.number(),
    dex: z.number(),
    con: z.number(),
    int: z.number(),
    wis: z.number(),
    cha: z.number(),
    cr: z.string(),
  }),
  roll20Macro: z.string().describe('Macro &{template:npc} para exibição visual no chat.'),
  roll20Import: z.string().describe('Comando !setattr para preencher automaticamente os campos da ficha no Roll20.'),
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
Gere um NPC de D&D 5e completo para Sandbox Político.

REGRAS PARA MACROS ROLL20:
1. roll20Macro: Use &{template:npc}. Deve ser visualmente rico.
2. roll20Import: Gere um comando !setattr para o script ChatSetAttr do Roll20.
   Formato: !setattr --sel --npc_name "{{name}}" --hp {{hp}} --hp|max {{hp}} --npc_ac {{ac}} --strength {{str}} --dexterity {{dex}} --constitution {{con}} --intelligence {{int}} --wisdom {{wis}} --charisma {{cha}} --npc_type "{{race}} {{dndClass}}" --npc_challenge {{cr}}

CONTEXTO: {{{context}}}
{{#if race}}RAÇA DESEJADA: {{{race}}}{{/if}}
{{#if role}}PAPEL DESEJADO: {{{role}}}{{/if}}

Responda em Português Brasileiro.`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
