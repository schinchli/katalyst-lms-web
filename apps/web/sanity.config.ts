import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production';

export default defineConfig({
  name: 'learnkloud-studio',
  title: 'LearnKloud CMS',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool(),
    visionTool(),  // GROQ query explorer — remove in production if desired
  ],
  schema: { types: schemaTypes },
});
