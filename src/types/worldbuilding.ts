import { z } from 'genkit';

export const FactionSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe('Nome da facção'),
  ideology: z.string().describe('Ideologia e motivações principais'),
  method: z.string().describe('Métodos de atuação'),
  enemies: z.array(z.string()).describe('Inimigos declarados ou ocultos'),
  powerSource: z.string().describe('Fonte do poder da facção (recursos, magia, influência, etc)'),
  sixMonthPlan: z.string().describe('O que a facção planeja alcançar em 6 meses'),
  fiveYearPlan: z.string().describe('O grande plano de 5 anos da facção'),
});
export type FactionData = z.infer<typeof FactionSchema>;

export const NpcSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe('Nome do NPC'),
  role: z.string().describe('Papel do NPC (ex: governante, líder religioso, antagonista, herói local)'),
  publicGoal: z.string().describe('Objetivo público e conhecido do NPC'),
  secretGoal: z.string().describe('Objetivo secreto ou verdadeira agenda'),
  fear: z.string().describe('O maior medo do NPC'),
  controlledResource: z.string().describe('Recurso que o NPC controla (informação, exército, dinheiro, etc)'),
  relationships: z.array(z.string()).describe('Relação com outros NPCs ou facções'),
  consequenceOfDeath: z.string().describe('O que acontece na região se o NPC morrer ou sumir'),
});
export type NpcData = z.infer<typeof NpcSchema>;

export const LocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe('Nome do local'),
  type: z.string().describe('Tipo do local (Capital, Vila, Ruína, Bosque, etc)'),
  description: z.string().describe('Descrição visual e sensorial do local'),
  connections: z.array(z.string()).describe('Como se conecta a outros pontos (estradas, rios, portais)'),
  keyFeatures: z.array(z.string()).describe('Características marcantes do local'),
});
export type LocationData = z.infer<typeof LocationSchema>;

export const RegionDataSchema = z.object({
  overview: z.object({
    name: z.string().describe('Nome da região'),
    biome: z.string().describe('Bioma predominante'),
    economy: z.string().describe('Economia e recursos principais'),
    structuralConflicts: z.string().describe('Conflitos e tensões estruturais da região'),
  }),
  history: z.object({
    ancient: z.string().describe('História antiga e mitos fundadores'),
    recent: z.string().describe('História recente (últimos 100 anos)'),
    foundingEvent: z.string().describe('O evento fundador ou catacrísmo que moldou a região'),
  }),
  politics: z.object({
    structure: z.string().describe('Estrutura de governo e leis'),
    socialTensions: z.string().describe('Tensões sociais de classes ou guildas'),
  }),
  religion: z.object({
    dominantGods: z.array(z.string()).describe('Deuses predominantes (oficiais 5e)'),
    influence: z.string().describe('Influência real da religião na política e dia a dia'),
    conflicts: z.string().describe('Conflitos entre cultos ou seitas heréticas'),
    recentMiracles: z.string().describe('Milagres recentes ou a notável ausência deles'),
  }),
  calendar: z.object({
    name: z.string().describe('Nome do calendário regional'),
    yearDivisions: z.string().describe('Como o ano é dividido (meses, estações diferentes)'),
    holidays: z.array(z.string()).describe('Feriados religiosos ou cívicos'),
    seasonalEvents: z.array(z.string()).describe('Eventos sazonais ou climáticos'),
    futureProphecyEvent: z.string().describe('Um evento profético marcado para o futuro'),
  }),
  activeConflicts: z.array(z.string()).describe('Conflitos acontecendo agora independente dos jogadores'),
  adventureHooks: z.array(z.string()).describe('Ganchos de aventura ativos ligados à economia ou política'),
  worldSecrets: z.array(z.string()).describe('Segredos absolutos do mundo (DMs only)'),

  factions: z.array(FactionSchema).describe('Principais facções operando na região'),
  npcs: z.array(NpcSchema).describe('Os NPCs chave (atores políticos, heróis, antagonistas)'),
  locations: z.array(LocationSchema).describe('Pontos de interesse da região'),
});

export type RegionWorldbuildingData = z.infer<typeof RegionDataSchema>;

// ── Cartography Schemas ──

export const RouteSchema = z.object({
  id: z.string().optional(),
  from: z.string().describe('Nome do local de origem'),
  to: z.string().describe('Nome do local de destino'),
  distanceKm: z.number().describe('Distância em km'),
  travelTimeHours: z.number().optional().describe('Tempo de viagem em horas a pé'),
  terrainType: z.string().optional().describe('Tipo de terreno da rota (estrada, trilha, rio, etc)'),
  description: z.string().optional().describe('Descrição da rota'),
});
export type RouteData = z.infer<typeof RouteSchema>;

export const BattlemapSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe('Nome do battlegrid'),
  locationId: z.string().optional().describe('ID do local associado no Grimório'),
  locationName: z.string().optional().describe('Nome do local associado'),
  imageUrl: z.string().describe('URL da imagem do battlemap (Firebase Storage)'),
  prompt: z.string().optional().describe('Prompt usado para gerar o mapa'),
  terrain: z.string().optional(),
  createdAt: z.string().optional(),
});
export type BattlemapData = z.infer<typeof BattlemapSchema>;
