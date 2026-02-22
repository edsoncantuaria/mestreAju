'use server';
/**
 * @fileOverview Fluxo para geração de imagens para NPCs e Locais usando Imagen.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  description: z.string().describe('Descrição visual do que deve ser gerado.'),
  type: z.enum(['npc', 'location']).default('npc'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('A URL (Data URI) da imagem gerada.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateVisualArt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async input => {
    const style = input.type === 'npc' 
      ? "Dungeons & Dragons official art style, detailed character portrait, fantasy illustration, sharp focus, digital painting" 
      : "Epic fantasy environment art, D&D official book style, atmospheric lighting, detailed landscape, matte painting";

    const { media } = await ai.generate({
      model: 'googleai/imagen-3.0-fast-generate-001',
      prompt: `${style}. ${input.description}`,
    });

    if (!media) throw new Error('Falha ao gerar imagem.');

    return {
      imageUrl: media.url,
    };
  }
);
