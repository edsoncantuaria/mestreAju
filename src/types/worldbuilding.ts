import { z } from 'genkit';

export const FactionSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe('Nome da facção'),
  ideology: z.string().describe('Ideologia e motivações principais'),
  method: z.string().describe('Métodos de atuação'),
  enemies: z.array(z.string()).describe('Inimigos declarados ou ocultos'),
  powerSource: z.string().describe('Fonte do poder da facção (recursos, magia, influência, etc)'),
  hq: z.string().optional().describe('Sede ou base de operações'),
  assets: z.array(z.string()).optional().describe('Recursos específicos (frotas, espiões, artefatos)'),
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
  statBlock: z.object({
    alignment: z.string(),
    ac: z.number(),
    hp: z.number(),
    speed: z.string(),
    stats: z.object({
      str: z.number(),
      dex: z.number(),
      con: z.number(),
      int: z.number(),
      wis: z.number(),
      cha: z.number(),
    }),
    saves: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    senses: z.string().optional(),
    languages: z.array(z.string()).optional(),
    cr: z.string(),
    traits: z.array(z.object({ name: z.string(), desc: z.string() })).describe('Habilidades passivas/especiais'),
    actions: z.array(z.object({ name: z.string(), desc: z.string() })).describe('Ações de combate'),
    reactions: z.array(z.object({ name: z.string(), desc: z.string() })).optional(),
    legendaryActions: z.array(z.object({ name: z.string(), desc: z.string() })).optional(),
  }).optional().describe('Stat-block para D&D 5e'),
});
export type NpcData = z.infer<typeof NpcSchema>;

export const LocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().describe('Nome do local'),
  type: z.string().describe('Tipo do local (Capital, Vila, Ruína, Bosque, etc)'),
  description: z.string().describe('Descrição visual e sensorial do local'),
  connections: z.array(z.string()).describe('Como se conecta a outros pontos (estradas, rios, portais)'),
  keyFeatures: z.array(z.string()).describe('Características marcantes do local'),
  hazards: z.array(z.object({ name: z.string(), desc: z.string() })).optional().describe('Perigos ambientais, armadilhas ou Lair Actions'),
  regionalEffects: z.array(z.string()).optional().describe('Efeitos regionais mágicos ou geográficos do local'),
});
export type LocationData = z.infer<typeof LocationSchema>;

export const QuestSchema = z.object({
  id: z.string().optional(),
  title: z.string().describe('Título da missão/aventura'),
  hook: z.string().describe('O gancho inicial para os jogadores'),
  objective: z.string().describe('O objetivo principal (o que eles precisam fazer)'),
  status: z.enum(['active', 'completed', 'failed']).default('active').describe('Estado atual da missão'),
  keyNpcs: z.array(z.string()).describe('Nomes dos NPCs chaves envolvidos'),
  keyLocations: z.array(z.string()).describe('Nomes dos locais chaves envolvidos'),
  rewards: z.array(z.string()).describe('Recompensas e tesouros específicos desta missão'),
});
export type QuestData = z.infer<typeof QuestSchema>;

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

  rumorTable: z.array(z.object({
    rumor: z.string(),
    truthLevel: z.enum(['true', 'false', 'partial']),
    source: z.string().describe('Quem contou ou onde foi ouvido')
  })).describe('Tabela d10 de boatos locais'),

  thematicEncounters: z.array(z.object({
    title: z.string(),
    description: z.string(),
    trigger: z.string().describe('Condição ou local onde ocorre'),
    combatStats: z.string().optional().describe('Sugestão de monstros ou NPCs do SRD')
  })).describe('Encontros aleatórios "assinados" pelo tema do mundo'),

  lootPatterns: z.array(z.object({
    category: z.string().describe('Tipo de loot (ex: Arcano, Urbano, Deserto)'),
    items: z.array(z.string()).describe('Exemplos de itens de loot característicos')
  })).describe('Padrões de tesouro e recompensas da região'),

  factions: z.array(FactionSchema).describe('Principais facções operando na região'),
  npcs: z.array(NpcSchema).describe('Os NPCs chave (atores políticos, heróis, antagonistas)'),
  locations: z.array(LocationSchema).describe('Pontos de interesse da região'),
  quests: z.array(QuestSchema).describe('Missões iniciais que conectam NPCs e Localidades'),
});

export type RegionWorldbuildingData = z.infer<typeof RegionDataSchema>;

// ... rest of the file

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
