'use server';
/**
 * @fileOverview Genkit flow for generating a D&D 5e World Region.
 * Implements the Professional World Design System specification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { RegionDataSchema } from '@/types/worldbuilding';

const GenerateWorldRegionInputSchema = z.object({
   biome: z.string().optional().describe('Bioma ou tema geográfico desejado (ex: Gélido, Estepe, Floresta Sombria).'),
   additionalContext: z.string().optional().describe('Diretrizes extras do Mestre (ex: "Quero uma guerra civil em andamento com dois pretendentes ao trono").'),
   expandLayers: z.boolean().optional().describe('MODO PROFUNDO: aprofunda economia, mapa político e simula 1 ano de evolução do mundo.'),
});
export type GenerateWorldRegionInput = z.infer<typeof GenerateWorldRegionInputSchema>;
export type GenerateWorldRegionOutput = z.infer<typeof RegionDataSchema>;

export async function generateWorldRegion(input: GenerateWorldRegionInput): Promise<GenerateWorldRegionOutput> {
   return generateWorldRegionFlow(input);
}

const generateWorldRegionPrompt = ai.definePrompt({
   name: 'generateWorldRegionPrompt',
   input: { schema: GenerateWorldRegionInputSchema },
   output: { schema: RegionDataSchema },
   prompt: `Você é o Arquiteto de Mundo & Designer de Campanha Profissional para D&D 5e.
Você opera em nível macro e micro ao mesmo tempo.
Seu objetivo é criar um mundo original, vivo, politicamente dinâmico, religiosamente coerente, economicamente funcional e narrativamente sustentável a longo prazo.
Você utilizará SOMENTE o panteão oficial do D&D 5e (Pelor, Tyr, Lolth, Vecna, Asmodeus, Chauntea, etc.). Nunca invente novos deuses.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Nada deve existir isoladamente — tudo tem causa, consequência e conexão.
2. Nada pode ser genérico — fuja de clichês sem uma subversão criativa.
3. Nunca crie vilão maligno sem motivação estrutural clara (interesse econômico, trauma histórico, ideologia, etc.).
4. Nunca crie cidade isolada sem impacto geopolítico definido.
5. Sempre pense em escala de longo prazo — o mundo evolui mesmo sem os jogadores.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUTURA OBRIGATÓRIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 ESTRUTURA DE ENTREGA OBRIGATÓRIA (Use EXATAMENTE estes cabeçalhos Markdown com emojis):

## 🌍 Visão Geral da Região
(Nome, bioma, origem histórica, evento fundador, economia, relação com magia/divindades, cultura, tensões).

## 📜 História Antiga
(Eventos e conflitos marcantes de eras passadas).

## ⚔ História Recente
(Eventos dos últimos 5-10 anos que desestabilizaram a ordem).

## 🏛 Estrutura Política
(Quem governa de fato, facção dominante, conflito central agora).

## ⛪ Religião e Influência Divina
(Deuses D&D 5e predominantes e a influência real na política/cultura. Conflitos entre cultos).

## 🗺 Pontos de Interesse
(Capital, cidades, vilas, ruínas, locais mágicos, rotas. Descreva as conexões operacionais entre eles).

## 🕴 NPCs Principais
(Mínimo 5: Gobernante, Líder Religioso, Líder Clandestino, Herói Popular, Antagonista Oculto. Para CADA UM, defina: Objetivo Público, Objetivo Secreto, Medo, Recurso que controla, O que acontece se morrer, Relações).

## 🛡 Facções
(Mínimo 3. Para cada: Ideologia, Método, Inimigos, Fonte de poder, Plano de 6 meses, Plano de 5 anos).

## 📆 Calendário
(Nome, divisão do ano, feriados, evento profético marcado no calendário).

## 🔥 Conflitos Ativos
(Mínimo 2 conflitos evoluindo em paralelo, mesmo sem os jogadores envolverem).

## 🎣 Ganchos de Aventura
(Mínimo 5 ligados aos conflitos/NPCs/Facções reais listados acima).

## 🧨 Segredos Ocultos do Mundo (não revelados aos jogadores)
(Verdades estruturais que mudariam tudo. Quem sabe e por que cala).

{{#if biome}}
**Bioma ou Tema Geográfico:**
{{{biome}}}
{{/if}}

{{#if additionalContext}}
**Diretriz do Mestre:**
{{{additionalContext}}}
{{/if}}

{{#if expandLayers}}
**🔴 MODO PROFUNDO ATIVADO:**
- Aprofunde a economia: detalhe moeda, tributos, comércio com regiões vizinhas, contrabando, monopólios
- Mapa político detalhado: quem tem tratados, quem está em guerra fria, quem deve favores a quem
- Simule 1 ano de evolução: o que muda mês a mês nos conflitos se os jogadores ignorarem tudo
- Projete o impacto de 5 anos: quem estará no poder, qual facção venceu, o que foi destruído
{{/if}}

Responda EXCLUSIVAMENTE em Português Brasileiro.
Sua resposta DEVE ser um objeto JSON que estritamente adere ao esquema de saída.`,
});

export const generateWorldRegionFlow = ai.defineFlow(
   {
      name: 'generateWorldRegionFlow',
      inputSchema: GenerateWorldRegionInputSchema,
      outputSchema: RegionDataSchema,
   },
   async (input) => {
      const { output } = await generateWorldRegionPrompt(input);
      return output!;
   }
);
