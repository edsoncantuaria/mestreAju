'use server';
/**
 * @fileOverview Fluxo Genkit para gerar prompts otimizados de battlegrid
 * para geradores de imagem AI (NanoBanana, Midjourney, etc).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BattlegridPromptInputSchema = z.object({
    terrain: z.string().describe('Tipo de terreno (ex: floresta densa, caverna, taverna, praia rochosa).'),
    keyElements: z.string().describe('Elementos-chave do mapa (ex: acampamento com 4 tendas e fogueira, rio cruzando).'),
    timeOfDay: z.string().optional().describe('Hora do dia (ex: noite com lua cheia, amanhecer).'),
    weather: z.string().optional().describe('Condição climática (ex: nevoeiro leve, chuva forte).'),
    mapSize: z.string().optional().describe('Tamanho do mapa em quadrados (ex: 30x30). Default: 25x25.'),
    style: z.enum(['watercolor', 'realistic', 'hand-drawn', 'comic', 'oil-painting']).default('hand-drawn'),
    locationContext: z.string().optional().describe('Lore ou contexto do local do Grimório para enriquecer o prompt.'),
});
export type BattlegridPromptInput = z.infer<typeof BattlegridPromptInputSchema>;

const BattlegridPromptOutputSchema = z.object({
    promptEnglish: z.string().describe('Prompt final em inglês, otimizado para AI image generators. DEVE ser detalhado e profissional.'),
    negativePrompt: z.string().describe('Negative prompt — lista do que evitar na geração.'),
    suggestedSettings: z.object({
        aspectRatio: z.string().describe('Aspect ratio ideal (ex: 1:1, 4:3, 16:9).'),
        style: z.string().describe('Estilo sugerido para o gerador.'),
    }),
});
export type BattlegridPromptOutput = z.infer<typeof BattlegridPromptOutputSchema>;

export async function generateBattlegridPrompt(input: BattlegridPromptInput): Promise<BattlegridPromptOutput> {
    return battlegridPromptFlow(input);
}

const battlegridPromptFlow = ai.defineFlow(
    {
        name: 'generateBattlegridPromptFlow',
        inputSchema: BattlegridPromptInputSchema,
        outputSchema: BattlegridPromptOutputSchema,
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'battlegridPromptGen',
            input: { schema: BattlegridPromptInputSchema },
            output: { schema: BattlegridPromptOutputSchema },
            prompt: `Você é um especialista em gerar prompts perfeitos para geradores de imagem AI (NanoBanana, Midjourney, DALL-E).
Sua missão é criar um prompt DETALHADO e PROFISSIONAL para um BATTLEGRID MAP de D&D 5e.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. O mapa é SEMPRE visto de cima (top-down / bird's eye view).
2. NUNCA inclua grid, quadrados, hexágonos ou qualquer overlay de interface.
3. NUNCA inclua tokens, miniaturas, dados ou elementos de jogo.
4. O mapa deve parecer uma ilustração artística rica, como os mapas do estúdio Rune Foundry.
5. SEMPRE inclua detalhes ambientais ricos: vegetação, sombras, texturas de chão, objetos decorativos.
6. O mapa deve ter iluminação coerente com a hora do dia especificada.
7. O prompt deve ser em INGLÊS pois geradores funcionam melhor em inglês.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO MAPA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terreno: {{{terrain}}}
Elementos-chave: {{{keyElements}}}
{{#if timeOfDay}}Hora do dia: {{{timeOfDay}}}{{/if}}
{{#if weather}}Clima: {{{weather}}}{{/if}}
{{#if mapSize}}Tamanho: {{{mapSize}}}{{/if}}
Estilo artístico: {{{style}}}
{{#if locationContext}}Contexto/Lore do local: {{{locationContext}}}{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DO PROMPT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Construa o prompt com esta estrutura:
[VIEW] + [SUBJECT] + [ENVIRONMENT DETAILS] + [LIGHTING] + [STYLE] + [QUALITY TAGS]

Exemplo de prompt profissional:
"Top-down bird's eye view of a forest clearing campsite, four canvas tents arranged in a semicircle around a crackling campfire with glowing embers, fallen logs as seating, scattered rocks and small bushes, dense treeline surrounding the clearing casting long shadows, dappled sunlight filtering through canopy, hand-drawn watercolor illustration style, tabletop RPG battlemap, rich environmental detail, no grid, high resolution, artstation quality"

O negative prompt deve incluir: grid, squares, hexagons, tokens, miniatures, dice, UI elements, text, watermark, frame, border, low quality, blurry.

Responda APENAS com o JSON do output schema.`,
        });

        const { output } = await prompt(input);
        return output!;
    }
);

// --- Regional Map Prompt Flow ---

const RegionalMapPromptInputSchema = z.object({
    regionName: z.string().describe('Nome da região.'),
    locations: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional(),
    })).describe('Locais da região.'),
    routes: z.array(z.object({
        from: z.string(),
        to: z.string(),
        distanceKm: z.number().optional(),
        terrainType: z.string().optional(),
    })).optional().describe('Rotas entre locais.'),
    biome: z.string().optional().describe('Bioma predominante.'),
    style: z.string().optional().describe('Estilo artístico desejado.'),
});
export type RegionalMapPromptInput = z.infer<typeof RegionalMapPromptInputSchema>;

const RegionalMapPromptOutputSchema = z.object({
    promptEnglish: z.string().describe('Prompt em inglês para gerar o mapa regional ilustrado.'),
    negativePrompt: z.string(),
});
export type RegionalMapPromptOutput = z.infer<typeof RegionalMapPromptOutputSchema>;

export async function generateRegionalMapPrompt(input: RegionalMapPromptInput): Promise<RegionalMapPromptOutput> {
    return regionalMapPromptFlow(input);
}

const regionalMapPromptFlow = ai.defineFlow(
    {
        name: 'generateRegionalMapPromptFlow',
        inputSchema: RegionalMapPromptInputSchema,
        outputSchema: RegionalMapPromptOutputSchema,
    },
    async (input) => {
        const locList = input.locations.map(l => `${l.name} (${l.type})`).join(', ');
        const routeList = input.routes?.map(r => `${r.from} → ${r.to} (${r.distanceKm || '?'}km, ${r.terrainType || 'road'})`).join('; ') || 'no specific routes';

        const prompt = ai.definePrompt({
            name: 'regionalMapPromptGen',
            input: { schema: z.object({ regionName: z.string(), locList: z.string(), routeList: z.string(), biome: z.string().optional(), style: z.string().optional() }) },
            output: { schema: RegionalMapPromptOutputSchema },
            prompt: `Você cria prompts para mapas regionais de fantasia estilo pergaminho antigo.

Gere um prompt DETALHADO e PROFISSIONAL em INGLÊS para um mapa regional de fantasia.

Região: {{{regionName}}}
Bioma: {{{biome}}}
Locais: {{{locList}}}
Rotas: {{{routeList}}}
Estilo: {{{style}}}

O mapa deve:
- Parecer um pergaminho antigo com bordas desgastadas
- Mostrar todos os locais com ícones temáticos (castelo, vila, floresta, ruínas)
- Incluir rotas/estradas entre pontos com distâncias
- Ter uma rosa dos ventos ornamentada
- Incluir rótulos elegantes em caligrafia para cada local
- Ter terreno ilustrado (montanhas, florestas, rios) de forma artística
- Estilo Tolkien / Forgotten Realms official map

Responda APENAS com o JSON do output schema.`,
        });

        const { output } = await prompt({
            regionName: input.regionName,
            locList,
            routeList,
            biome: input.biome,
            style: input.style,
        });
        return output!;
    }
);
