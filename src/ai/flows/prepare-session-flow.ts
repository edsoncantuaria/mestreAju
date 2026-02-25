'use server';
/**
 * @fileOverview Genkit flow for preparing D&D 5e sessions.
 * Integrates the Professional World Design System for deep, contextual session prep.
 */

import { ai, fetchDndRuleTool } from '@/ai/genkit';
import { z } from 'genkit';

const PrepareSessionInputSchema = z.object({
  mapDescription: z.string().describe('Descrição do mapa ou local principal da sessão.'),
  worldLore: z.string().describe('Lore do mundo, estrutura política, religião e conflitos ativos.'),
  currentAgendas: z.string().optional().describe('Agendas das facções e NPCs ativos no momento.'),
  activeConflicts: z.string().optional().describe('Conflitos em andamento que podem eclodir nesta sessão.'),
  partyLevel: z.number().optional().describe('Nível médio da party para calibrar desafios.'),
});
export type PrepareSessionInput = z.infer<typeof PrepareSessionInputSchema>;

const PrepareSessionOutputSchema = z.object({
  sessionTitle: z.string().describe('Título cinematográfico para esta sessão.'),
  openingScene: z.string().describe('Cena de abertura sugerida — algo que coloca os jogadores imediatamente em ação ou mistério.'),
  plotHooks: z.array(z.object({
    hook: z.string(),
    whoIsPlanning: z.string().describe('Qual NPC ou facção está por trás deste gancho.'),
    consequence30Days: z.string().describe('O que acontece se ignorado por 30 dias.'),
  })).describe('3-5 ganchos ativos, todos conectados ao mundo vivo.'),
  activeConflicts: z.array(z.object({
    conflict: z.string(),
    sides: z.string(),
    escalation: z.string().describe('Como vai escalar esta sessão.'),
  })).describe('Conflitos que podem eclodir.'),
  environmentalRules: z.array(z.object({
    feature: z.string(),
    rule: z.string().describe('Regra oficial D&D 5e citada.'),
    tacticalImplication: z.string().describe('Como isso afeta o combate ou roleplay.'),
  })).describe('Regras de ambiente baseadas no mapa.'),
  unexpectedComplication: z.string().describe('Uma reviravolta ou complicação inesperada — algo que muda a mesa.'),
  politicalIntrigueSummary: z.string().describe('Estado atual das tensões políticas — quem está movendo peças agora.'),
  npcAgendas: z.array(z.object({
    npcName: z.string(),
    publicAction: z.string().describe('O que este NPC fará visivelmente esta sessão.'),
    hiddenAction: z.string().describe('O que este NPC fará nas sombras.'),
  })).describe('O que NPCs chave estão fazendo nesta sessão.'),
  suggestedNpcs: z.array(z.object({
    name: z.string(),
    role: z.string(),
    motivation: z.string(),
    secret: z.string().describe('Segredo que pode ser descoberto pelos jogadores.'),
  })).describe('NPCs sugeridos para esta sessão.'),
  encounterIdeas: z.array(z.object({
    type: z.enum(['Combate', 'Social', 'Exploração', 'Mistério', 'Armadilha']),
    description: z.string(),
    suggestedCR: z.string().optional(),
  })).describe('2-3 ideias de encontros balanceadas por tipo.'),
  sessionEndHook: z.string().describe('Como terminar a sessão com um cliffhanger ou revelação que os jogadores vão lembrar.'),
});
export type PrepareSessionOutput = z.infer<typeof PrepareSessionOutputSchema>;

export async function prepareSession(input: PrepareSessionInput): Promise<PrepareSessionOutput> {
  return prepareSessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prepareSessionPrompt',
  tools: [fetchDndRuleTool],
  input: { schema: PrepareSessionInputSchema },
  output: { schema: PrepareSessionOutputSchema },
  prompt: `Você é o Arquiteto de Sandbox do MestreAju — Preparador Profissional de Sessões de D&D 5e.
Sua missão é transformar o estado atual do mundo vivo em uma sessão memorável, conectada e cheia de consequências reais.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINCÍPIOS DE SESSÃO PROFISSIONAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Todo gancho deve estar conectado a um NPC ou facção real do mundo.
2. Todo conflito deve ter dois lados que os jogadores podem se aliar, ignorar ou destruir.
3. Regras de ambiente citam sempre a fonte oficial do D&D 5e SRD.
4. NPCs têm ações públicas E ocultas — a mesa não sabe tudo.
5. A sessão deve terminar com algo que faz os jogadores quererem mais.
6. O mundo evolui — ações (ou inações) têm consequências a 30 dias.
7. Balancear: Combate, Social, Exploração, Mistério em proporções variadas.

MAPA / LOCAL PRINCIPAL:
{{{mapDescription}}}

LORE DO MUNDO (política, religião, conflitos):
{{{worldLore}}}

{{#if currentAgendas}}
AGENDAS ATIVAS DAS FACÇÕES E NPCs:
{{{currentAgendas}}}
{{/if}}

{{#if activeConflicts}}
CONFLITOS EM ANDAMENTO:
{{{activeConflicts}}}
{{/if}}

{{#if partyLevel}}
NÍVEL DA PARTY: {{{partyLevel}}} (calibre os desafios para este nível)
{{/if}}

Use a ferramenta fetchDndRuleTool para citar regras ambientais precisas do SRD.
Responda exclusivamente em Português Brasileiro.`,
});

const prepareSessionFlow = ai.defineFlow(
  {
    name: 'prepareSessionFlow',
    inputSchema: PrepareSessionInputSchema,
    outputSchema: PrepareSessionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
