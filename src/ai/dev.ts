import { config } from 'dotenv';
config();

import '@/ai/flows/manage-consequences.ts';
import '@/ai/flows/generate-narrative-text-flow.ts';
import '@/ai/flows/summarize-session.ts';
import '@/ai/flows/generate-sandbox-ideas.ts';
import '@/ai/flows/analyze-context.ts';