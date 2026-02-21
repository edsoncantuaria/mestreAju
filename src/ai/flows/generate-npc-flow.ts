'use server';
/**
 * @fileOverview Fluxo Genkit para gerar NPCs profundos para D&D 5e Sandbox.
 * Inclui geração de macro para Roll20 baseada no template oficial "D&D 5E by Roll20".
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
  roll20Macro: z.string().describe('Uma macro do Roll20 usando &{template:npc} que mostra os principais atributos, ataques e defesas compatível com a ficha oficial 5E by Roll20.'),
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
A macro deve usar o template oficial da ficha 5E do Roll20: &{template:npc}.
Estrutura esperada:
&{template:npc} {{name=Nome}} {{npc_type=Raça Classe}} {{npc_alignment=Alinhamento}} {{npc_ac=Valor}} {{npc_hp=Valor}} {{npc_speed=Valor}} {{npc_str=For (Mod)}} {{npc_dex=Des (Mod)}} {{npc_con=Con (Mod)}} {{npc_int=Int (Mod)}} {{npc_wis=Sab (Mod)}} {{npc_cha=Car (Mod)}} {{description=Descrição Curta}} {{actions=Ação Principal}}.

CONTEXTO: {{{context}}}
{{#if race}}RAÇA DESEJADA: {{{race}}}{{/if}}
{{#if role}}PAPEL DESEJADO: {{{role}}}{{/if}}

Responda em Português Brasileiro.`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);