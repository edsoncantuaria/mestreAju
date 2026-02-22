import { config } from 'dotenv';
config();

import '@/ai/flows/manage-consequences.ts';
import '@/ai/flows/generate-narrative-text-flow.ts';
import '@/ai/flows/summarize-session.ts';
import '@/ai/flows/generate-sandbox-ideas.ts';
import '@/ai/flows/analyze-context.ts';
import '@/ai/flows/dynamic-encounter-flow.ts';
import '@/ai/flows/prepare-session-flow.ts';
import '@/ai/flows/generate-npc-flow.ts';
import '@/ai/flows/generate-faction-flow.ts';
import '@/ai/flows/generate-location-flow.ts';
import '@/ai/flows/generate-image-flow.ts';
