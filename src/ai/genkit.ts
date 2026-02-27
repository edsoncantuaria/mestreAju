import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash', // Atualizado para o modelo 2.5 Flash como padrão do sistema
});

/**
 * Tool para buscar regras oficiais do D&D 5e (SRD)
 */
export const fetchDndRuleTool = ai.defineTool(
  {
    name: 'fetchDndRule',
    description: 'Busca o conteúdo oficial de uma regra de D&D 5e (SRD) pela API pública. Use para esclarecer mecânicas de combate, exploração, condições ou ambiente.',
    inputSchema: z.object({
      ruleIndex: z.string().describe('O índice da regra ou seção (ex: "combat", "resting", "cover", "ability-checks", "conditions").'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await fetch(`https://www.dnd5eapi.co/api/rule-sections/${input.ruleIndex}`);
      if (!response.ok) {
        const ruleResponse = await fetch(`https://www.dnd5eapi.co/api/rules/${input.ruleIndex}`);
        if (!ruleResponse.ok) return "Regra ou mecânica não encontrada na base SRD.";
        const ruleData = await ruleResponse.json();
        return `Regra: ${ruleData.name}\n\n${ruleData.desc || "Descrição não disponível."}`;
      }
      const data = await response.json();
      return `Seção: ${data.name}\n\n${data.desc || "Descrição não disponível."}`;
    } catch (e) {
      return "Erro técnico ao acessar a API de regras de D&D.";
    }
  }
);

/**
 * Tool para buscar Statblocks de monstros (Open5e)
 */
export const fetchMonsterStatblockTool = ai.defineTool(
  {
    name: 'fetchMonsterStatblock',
    description: 'Busca a ficha (statblock) oficial de um monstro do SRD 5e via Open5e API.',
    inputSchema: z.object({
      monsterSlug: z.string().describe('O slug do monstro em inglês (ex: "aboleth", "adult-red-dragon").'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const response = await fetch(`https://api.open5e.com/monsters/${input.monsterSlug}/`);
      if (!response.ok) return { error: "Monstro não encontrado." };
      return await response.json();
    } catch (e) {
      return { error: "Erro ao acessar a API Open5e." };
    }
  }
);
