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
(Capital, cidades, vilas, ruínas, locais mágicos, rotas. Para cada local, defina todos os campos do LocationSchema, incluindo obrigatoriamente Efeitos Regionais de D&D 5e e Perigos/Hazards se aplicável).

## 🕴 NPCs Principais
(Mínimo 5: Gobernante, Líder Religioso, Líder Clandestino, Herói Popular, Antagonista Oculto. Para CADA UM, defina todos os campos do NpcSchema, incluindo OBJETIVAMENTE um StatBlock de D&D 5e com Atributos, AC, HP, CR, Habilidades Especiais e Ações de Combate).

## 🛡 Facções
(Mínimo 3. Para cada: Ideologia, Método, Inimigos, Fonte de poder, Sede (HQ), Recursos Específicos (Frotas, Espiões, etc.), Plano de 6 meses, Plano de 5 anos).

## 📆 Calendário
(Nome, divisão do ano, feriados, evento profético marcado no calendário).

## 🔥 Conflitos Ativos
(Mínimo 2 conflitos evoluindo em paralelo, mesmo sem os jogadores envolverem).

## 🎣 Ganchos de Aventura
(Mínimo 5 ligados aos conflitos/NPCs/Facções reais listados acima).

## 🧨 Segredos Ocultos do Mundo (não revelados aos jogadores)
(Verdades estruturais que mudariam tudo. Quem sabe e por que cala).

## 🗣 Tabela de Boatos (d10)
(Gere 10 boatos. Use o campo truthLevel para definir se o boato é Verdadeiro, Falso ou Parcial. Defina a fonte de onde o boato é ouvido).

## 🎲 Encontros Ativos
(Mínimo 5 encontros rápidos e "assinados" pelo tom do mundo. Defina o gatilho, a cena e sugestões de monstros/fichas do SRD).

## 💰 Padrões de Recompensa (Loot)
(Como é o tesouro nesta região? O que é comum encontrar em masmorras ou como recompensa? Liste itens temáticos).

## 📜 Missões Iniciais (Quests)
(Gere EXATAMENTE 3 missões estruturadas que sirvam de ponto de partida. Cada missão DEVE obrigatoriamente referenciar pelo menos um NPC e uma Localidade gerados acima, criando um "Grafo de Conexão". Defina o gancho, o objetivo principal e as recompensas específicas).

## 🛠 Sessão 0 (Campaign Genesis)
(Defina os pilares da campanha, ferramentas de segurança/gatilhos recomendados, expectativas de comportamento e ganchos de criação de personagens que façam sentido neste lore).

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
