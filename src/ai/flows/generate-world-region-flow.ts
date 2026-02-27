'use server';
/**
 * @fileOverview Genkit flows for generating a D&D 5e World Region in 3 stages.
 * Implements the Professional World Design System specification.
 * 
 * STABILIZED: Using Gemini 1.5 Pro for maximum worldbuilding reasoning with reliable quota.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
   RegionFoundationSchema,
   RegionEntitiesSchema,
   RegionGameplaySchema
} from '@/types/worldbuilding';

const BaseInputSchema = z.object({
   biome: z.string().optional().describe('Bioma ou tema geográfico desejado (ex: Gélido, Estepe, Floresta Sombria).'),
   additionalContext: z.string().optional().describe('Diretrizes extras do Mestre (ex: "Quero uma guerra civil em andamento com dois pretendentes ao trono").'),
   expandLayers: z.boolean().optional().describe('MODO PROFUNDO: aprofunda economia, mapa político e simula 1 ano de evolução do mundo.'),
});

export type GenerateWorldRegionInput = z.infer<typeof BaseInputSchema>;

const baseSystemInstruction = `Você é o Arquiteto de Mundo & Designer de Campanha Profissional para D&D 5e.
Você opera em nível macro e micro ao mesmo tempo.
Seu objetivo é criar um mundo original, vivo, politicamente dinâmico, religiosamente coerente, economicamente funcional e narrativamente sustentável a longo prazo.
Você utilizará SOMENTE o panteão oficial do D&D 5e (Pelor, Tyr, Lolth, Vecna, Asmodeus, Chauntea, etc.). Nunca invente novos deuses.

REGRAS ABSOLUTAS:
1. Nada deve existir isoladamente — tudo tem causa, consequência e conexão.
2. Nada pode ser genérico — fuja de clichês sem uma subversão criativa.
3. Sempre pense em escala de longo prazo — o mundo evolui mesmo sem os jogadores.
4. Responda EXCLUSIVAMENTE em Português Brasileiro.`;

// Utilizando o 1.5 Pro estável para garantir que o processo de worldbuilding não falhe por falta de cota.
const PRO_MODEL = 'googleai/gemini-1.5-pro';

// ==========================================
// 1. FOUNDATION FLOW (Using Pro Model)
// ==========================================
export const generateWorldFoundationFlow = ai.defineFlow(
   {
      name: 'generateWorldFoundationFlow',
      inputSchema: BaseInputSchema,
      outputSchema: RegionFoundationSchema,
   },
   async (input) => {
      const { output } = await ai.generate({
         model: PRO_MODEL,
         system: baseSystemInstruction,
         prompt: `OBJETIVO DA ETAPA 1: CRIAR AS BASES DO MUNDO (Fundação Histórica, Política e Religiosa).
         
Biome/Tema: ${input.biome || 'Qualquer um'}
Diretriz do Mestre: ${input.additionalContext || 'Nenhuma'}
Modo Profundo: ${input.expandLayers ? 'ATIVADO (Aprofunde a economia: detalhe moeda, tributos, comércio com regiões vizinhas, contrabando, monopólios. Mapa político detalhado: quem tem tratados, quem está em guerra fria, quem deve favores a quem. Simulação de 1 ano de evolução)' : 'DESATIVADO'}

Sua tarefa é focar exclusivamente no panorama macro da região. Elabore os conflitos basilares (structuralConflicts), a história (recente e fundadora), a estrutura de governo, as tensões sociais, e os deuses que ditam a norma moral da região. Crie uma fundação tão rica que o mundo se sustentaria sozinho. Elabore também Ganchos de Aventura políticos e Segredos Absolutos do Mundo.`,
         output: { schema: RegionFoundationSchema },
         config: {
            temperature: 0.8,
         }
      });
      return output!;
   }
);


// ==========================================
// 2. ENTITIES FLOW (Using Pro Model)
// ==========================================
const EntitiesInputSchema = BaseInputSchema.extend({
   foundationData: z.any().describe('JSON das fundações da Etapa 1'),
});

export const generateWorldEntitiesFlow = ai.defineFlow(
   {
      name: 'generateWorldEntitiesFlow',
      inputSchema: EntitiesInputSchema,
      outputSchema: RegionEntitiesSchema,
   },
   async (input) => {
      const { output } = await ai.generate({
         model: PRO_MODEL,
         system: baseSystemInstruction,
         prompt: `OBJETIVO DA ETAPA 2: POVOAR O MUNDO (Facções, NPCs e Locais).
         
Você DEVE criar entidades que se conectem e reajam diretamente à fundação estabelecida na Etapa 1 (cenário político, história e economia). Não invente elementos isolados.

[CONTEXTO DA ETAPA 1 - FUNDAÇÃO DO MUNDO]
${JSON.stringify(input.foundationData, null, 2)}

Biome/Tema: ${input.biome || 'Qualquer'}
Diretriz do Mestre: ${input.additionalContext || 'Nenhuma'}

Sua tarefa:
1. FACÇÕES (Mínimo 3): Grupos secretos, exércitos ou guildas. Elas DEVEM reagir às tensões sociais ou religião da Etapa 1. Detalhe seus Planos de 6 meses e Recursos.
2. LOCAIS (Mínimo 5): A Capital, vilas, ruínas e pontos geológicos importantes da região atual. Use o que há na "economia" e no "evento fundador" como base. Crie Efeitos Regionais de D&D 5e e Perigos (Hazards).
3. NPCS PRINCIPAIS (Mínimo 5): O Governante de fato, um Líder Religioso, um Antagonista Oculto, etc. Para CADA UM, escreva todos os detalhes de um bloco de estatísticas do D&D 5e e defina seus objetivos secretos intimamente ligados aos "Conflitos Ativos" do mundo.`,
         output: { schema: RegionEntitiesSchema },
         config: {
            temperature: 0.8,
         }
      });
      return output!;
   }
);


// ==========================================
// 3. GAMEPLAY FLOW (Using Pro Model)
// ==========================================
const GameplayInputSchema = BaseInputSchema.extend({
   foundationData: z.any(),
   entitiesData: z.any(),
});

export const generateWorldGameplayFlow = ai.defineFlow(
   {
      name: 'generateWorldGameplayFlow',
      inputSchema: GameplayInputSchema,
      outputSchema: RegionGameplaySchema,
   },
   async (input) => {
      const { output } = await ai.generate({
         model: PRO_MODEL,
         system: baseSystemInstruction,
         prompt: `OBJETIVO DA ETAPA 3: GERAR GAMEPLAY (Rumores, Encontros, Quests, Loot e Sessão 0).
         
Você deve gerar os elementos "de mesa" que o Mestre usará nas sessões. ELES DEVEM ESTAR ENTRELAÇADOS com a Etapa 1 e Etapa 2, citando NOMES que você já conhece.

[CONTEXTO DA ETAPA 1 - FUNDAÇÃO DO MUNDO]
${JSON.stringify(input.foundationData, null, 2)}

[CONTEXTO DA ETAPA 2 - ENTIDADES DO MUNDO (FACÇÕES, NPCS E LOCAIS)]
${JSON.stringify(input.entitiesData, null, 2)}

Biome/Tema: ${input.biome || 'Qualquer'}
Diretriz do Mestre: ${input.additionalContext || 'Nenhuma'}

Sua Tarefa (SEJA ESPECÍFICO E NÃO CONTRADIGA O CONTEXTO):
1. MISSÕES INICIAIS (Quests): EXATAMENTE 3 missões que referenciem EXPLICITAMENTE os nomes dos NPCs e Locais do contexto acima. Elas são a porta de entrada para os Conflitos da Etapa 1.
2. ENCONTROS TEMÁTICOS: Aventuras rápidas ou perigos ambientais coerentes. Forneça títulos, cenas e estatísticas de monstros SRD recomendadas.
3. TABELA DE BOATOS: O que se ouve nas tavernas sobre as Facções ou NPCs do Contexto 2? (d10)
4. PADRÕES DE LOOT: Tesouros lógicos para a economia da Etapa 1.
5. SESSÃO ZERO (Campaign Genesis): Guias estruturados, Ganchos de Background e Expectativas de Tom sugeridos para os jogadores integrarem esse mundo de forma natural.`,
         output: { schema: RegionGameplaySchema },
         config: {
            temperature: 0.8,
         }
      });
      return output!;
   }
);
