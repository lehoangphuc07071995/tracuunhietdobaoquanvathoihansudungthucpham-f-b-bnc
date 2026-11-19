import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

await build({
  entryPoints: [path.join(rootDir, 'src/server/vercelCoreEntry.ts')],
  outfile: path.join(rootDir, 'api/_sheCore.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['@google/genai'],
  legalComments: 'none',
  banner: {
    js: '// AUTO-GENERATED from src/server/vercelCoreEntry.ts — do not edit manually.\n// Run `npm run build:api` after modifying src/data/ or src/utils/aiPromptBuilder.ts.',
  },
});

console.log('Generated api/_sheCore.mjs');
