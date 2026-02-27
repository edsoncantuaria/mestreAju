'use server';
/**
 * @fileOverview Genkit flow for generating deep-dive expansions of existing World Lore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExpansionTopicSchema = z.enum(['economy', 'politics', 'simulation', 'consequences']);

const ExpandWorldLoreInputSchema = z.object({
    currentLore: z.string().describe('A Lore do Mundo atual gerada anteriormente.'),
    topic: ExpansionTopicSchema.describe('Qual tópico deve ser expandido.'),
});

const ExpandWorldLorePromptInputSchema = ExpandWorldLoreInputSchema.extend({
    isEconomy: z.boolean(),
    isPolitics: z.boolean(),
    isSimulation: z.boolean(),
    isConsequences: z.boolean(),
});

export type ExpandWorldLoreInput = z.infer<typeof ExpandWorldLoreInputSchema>;

export type ExpandWorldLoreOutput = {
    expandedText: string;
};

export async function expandWorldLore(input: ExpandWorldLoreInput): Promise<ExpandWorldLoreOutput> {
    return expandWorldLoreFlow(input);
}

const expandWorldLorePrompt = ai.definePrompt({
    name: 'expandWorldLorePrompt',
    input: { schema: ExpandWorldLorePromptInputSchema },
    output: { format: 'text' },
    prompt: `Você é o Arquiteto de Mundo & Designer de Campanha Profissional para D&D 5e.
Sua missão é aprofundar um aspecto específico da Lore do Mundo existente, adicionando detalhes suculentos, nomes, intrigas e ramificações reais que o Mestre pode usar imediatamente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LORE DO MUNDO ATUAL:
{{{currentLore}}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O Mestre solicitou uma EXPANSÃO PROFUNDA para o seguinte tópico:
**Tópico Solicitado:** {{topic}}

Dependendo do tópico, gere o conteúdo usando as seguintes DIRETRIZES OBRIGATÓRIAS (substitua pelo conteúdo solicitado):

{{#if isEconomy}}
### 🪙 Aprofundamento Econômico
Descreva os motores econômicos que movem esta região:
1. **Moeda e Câmbio**: A cunhagem local. Há mais de um padrão? Moedas manchadas de sangue? Corrupção na pesagem?
2. **Monopólios e Controle**: Quem controla os recursos mais escassos (ex: especiarias, minérios, magia)?
3. **Contrabando e Mercado Negro**: Quais itens são ilegais e quem lidera este submundo? Quais as rotas furtivas?
4. **Tributação e Miséria**: Como os líderes exploram a população? Onde o dinheiro é extorquido com mais força territorial?
5. **Relações Comerciais Externas**: Quem supre o que a região não tem? Qual a fragilidade na cadeia de suprimentos?
{{/if}}

{{#if isPolitics}}
### 🗺️ Mapa Político Detalhado
Detalhe as teias políticas ocultas e visíveis:
1. **O Balanço de Poder Real**: Quem realmente governa das sombras, usando os governantes como fantoches?
2. **Tratados e Alianças Frágeis**: Pactos mantidos por um fio (casamentos forçados, reféns de alto nível).
3. **Escândalos Políticos Iminentes**: Um segredo sujo (bastardos, assassinatos encobertos) prestes a vazar.
4. **A Teia de Favores**: Quem deve a quem? (e.g. O Bispo deve ouro à Guilda dos Ladrões).
5. **Zonas Contendidas**: Territórios (físicos ou burocráticos) onde a guerra fria está fervendo.
{{/if}}

{{#if isSimulation}}
### ⏳ Simulação: 1 Ano de Evolução
Projete como o mundo evoluirá nos próximos 12 meses **SE OS JOGADORES NÃO FIZEREM NADA**:
1. **Mês 1-3 (O Estopim)**: Qual conflito ativo estoura e qual a primeira consequência mortal?
2. **Mês 4-6 (Escalada)**: Quem aproveita o caos para expandir território/poder? Quem é aniquilado?
3. **Mês 7-9 (Nova Ordem)**: Uma fação/NPC toma uma atitude drástica (guerra civil aberta, golpe, ritual sombrio).
4. **Mês 10-12 (O Status Quo Rompido)**: Como o mundo estará ao final de um ano? Desenhe o novo mapa terrível se intervenção não ocorrer.
{{/if}}

{{#if isConsequences}}
### 🔮 Projeção de Impactos
Mapeie o "Efeito Borboleta" caso o principal conflito político/econômico atual caia. Analise:
1. **Impacto Econômico Cascateante**: Quem vai à falência? Quais mercadorias somem do mercado? O que fica inflacionado?
2. **Efeitos Religiosos**: A fé do povo se quebra ou vira radicalismo profundo? Cultos heréticos que ganham vida.
3. **Facções Oportunistas**: Quem estava só esperando o momento no escuro para desferir a adaga e tomar o posto caído?
4. **Danos Colaterais (NPCs de Baixo Escalão)**: Como isso afeta o ferreiro, o taverneiro, e o povo comum que o Mestre usa como rosto do sofrimento?
{{/if}}

**REGRAS DE CONTEXTO:**
1. Leia a "Lore do Mundo Atual" com atenção. Todos os nomes, facções e locais que você citar DEVEM usar o que já existe (ou adicionar novos que façam perfeito sentido orgânico como subordinados aos existentes).
2. Não repita a introdução. Comece diretamente escrevendo o título correspondente acima.
3. Responda EXCLUSIVAMENTE em Português Brasileiro.
4. Use o formato Markdown de alta qualidade (Negritos, Bullet Points e Emojis) para ficar belo na interface.`,
});

export const expandWorldLoreFlow = ai.defineFlow(
    {
        name: 'expandWorldLoreFlow',
        inputSchema: ExpandWorldLoreInputSchema,
        outputSchema: z.object({ expandedText: z.string() }),
    },
    async (input) => {
        try {
            const { text } = await expandWorldLorePrompt({
                ...input,
                isEconomy: input.topic === 'economy',
                isPolitics: input.topic === 'politics',
                isSimulation: input.topic === 'simulation',
                isConsequences: input.topic === 'consequences'
            });
            return { expandedText: text };
        } catch (error) {
            console.error("Error in expandWorldLoreFlow:", error);
            throw error;
        }
    }
);
