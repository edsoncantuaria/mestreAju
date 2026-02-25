'use server';
/**
 * @fileOverview Genkit flow for generating deep, interconnected NPCs for D&D 5e.
 * Implements the Professional World Design NPC specification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateNpcInputSchema = z.object({
  context: z.string().describe('Contexto da região, evento atual ou local.'),
  role: z.string().optional().describe('Papel social desejado (ex: Governante, Líder Religioso, Antagonista Oculto, Herói Popular, Líder Clandestino).'),
  race: z.string().optional().describe('Raça desejada (ex: Humano, Elfo, Anão).'),
  existingNpcs: z.string().optional().describe('NPCs já existentes para criar conexões (nomes e papéis).'),
  existingFactions: z.string().optional().describe('Facções existentes para criar filiações.'),
});
export type GenerateNpcInput = z.infer<typeof GenerateNpcInputSchema>;

const GenerateNpcOutputSchema = z.object({
  name: z.string(),
  race: z.string(),
  dndClass: z.string(),
  description: z.string().describe('Aparência física marcante + trejeitos únicos que o tornam memorável.'),
  backstory: z.string().describe('História pessoal com evento traumático ou definidor.'),
  alignment: z.string(),
  // Public vs Secret layer
  publicObjective: z.string().describe('O que este NPC diz que quer. O que os jogadores vão ouvir.'),
  secretObjective: z.string().describe('O que ele realmente quer — diferente do público.'),
  fear: z.string().describe('O medo profundo que o paralisa ou o torna vulnerável.'),
  resource: z.string().describe('O recurso que ele controla e que o torna poderoso (ouro, segredos, exército, fé, informação).'),
  deathConsequence: z.string().describe('O que acontece estruturalmente no mundo se este NPC morrer. Preencha o vazio de poder.'),
  // Relationships
  relationships: z.array(z.object({
    npcName: z.string(),
    type: z.string().describe('Ex: Aliado falso, Mentor que manipula, Rival secreto, Informante comprado'),
    details: z.string(),
  })).describe('Relações com outros NPCs ou facções.'),
  // Stats
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
    savingThrows: z.string().optional(),
    skills: z.string().optional(),
    actions: z.array(z.string()).optional(),
  }),
  // Roll20 integration
  roll20Macro: z.string().describe('Macro &{template:npc} para exibição visual no chat do Roll20.'),
  roll20Import: z.string().describe('Comando !setattr para ChatSetAttr preenchimento automático da ficha no Roll20.'),
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
      input: { schema: GenerateNpcInputSchema },
      output: { schema: GenerateNpcOutputSchema },
      prompt: `Você é o Criador de Personagens do MestreAju — especialista em NPCs de D&D 5e para campanhas sandbox politicamente complexas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS PARA NPCs PROFISSIONAIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TODO NPC tem um objetivo PÚBLICO (o que diz que quer) E um objetivo SECRETO (o que realmente quer).
2. TODO NPC tem um MEDO que o torna vulnerável — não genérico ("morte"), mas específico e exploitável.
3. TODO NPC controla um RECURSO que o torna relevante politicamente.
4. A MORTE de qualquer NPC deve criar um vácuo de poder com consequências concretas.
5. RELACIONAMENTOS são teia: ninguém é neutro. Todo aliado pode virar inimigo, todo inimigo pode ser comprado.
6. Jamais crie um NPC "puramente maligno" sem motivação estrutural (ideologia, trauma, interesse econômico).
7. Use apenas o panteão oficial D&D 5e para afiliações religiosas.

CONTEXTO ATUAL:
{{{context}}}

{{#if role}}
PAPEL DESTE NPC: {{{role}}}
(Adapte toda a psicologia e posicionamento ao papel pedido.)
{{/if}}

{{#if race}}
RAÇA DESEJADA: {{{race}}}
{{/if}}

{{#if existingNpcs}}
NPCs JÁ EXISTENTES (crie relações cruzadas):
{{{existingNpcs}}}
{{/if}}

{{#if existingFactions}}
FACÇÕES EXISTENTES (crie filiação ou oposição):
{{{existingFactions}}}
{{/if}}

REGRAS PARA ROLL20:
- roll20Macro: Use &{template:npc}. Inclua nome, tipo, AC, HP, velocidade e ações principais.
- roll20Import: Formato !setattr --sel --npc_name "{{name}}" --hp {{hp}} --hp|max {{hp}} --npc_ac {{ac}} --strength {{str}} --dexterity {{dex}} --constitution {{con}} --intelligence {{int}} --wisdom {{wis}} --charisma {{cha}} --npc_type "{{race}} {{dndClass}}" --npc_challenge {{cr}}

Responda exclusivamente em Português Brasileiro.`,
    });

    const { output } = await prompt(input);
    return output!;
  }
);
