import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { FOOD_ITEMS, getItemCode } from './src/data/foodData.ts';
import type { Lang } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_ITEM_CODES = new Set(FOOD_ITEMS.map((item) => getItemCode(item)));

const COMPACT_CATALOG = FOOD_ITEMS.map((item) => {
  const code = getItemCode(item);
  const parts = [
    code,
    item.g,
    item.name,
    item.enName || '',
    `R:${item.room}`,
    `C:${item.cool}`,
    `F:${item.freeze}`,
  ];
  if (item.displayCool && item.displayCool !== '—') {
    parts.push(`DC:${item.displayCool}`);
  }
  if (item.displayHot && item.displayHot !== '—' && item.displayHot !== '-') {
    parts.push(`DH:${item.displayHot}`);
  }
  if (item.weight) {
    parts.push(`W:${item.weight}`);
  }
  if (item.note && item.note !== '—') {
    parts.push(`N:${item.note}`);
  }
  if (item.flag) {
    parts.push(`QA:${item.flag}`);
  }
  return parts.filter(Boolean).join(' | ');
}).join('\n');

interface CachedAiResult {
  matchedCodes: string[];
  reason: string;
  expiresAt: number;
}

const AI_CACHE = new Map<string, CachedAiResult>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 120;

const LANG_LABEL: Record<Lang, string> = {
  VI: 'Vietnamese',
  EN: 'English',
  KO: 'Korean',
  HI: 'Hindi',
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '128kb' }));

  app.post('/api/ai-search', async (req, res) => {
    try {
      const rawQuery = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
      const rawLang = typeof req.body?.lang === 'string' ? req.body.lang : 'VI';
      const lang: Lang =
        rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

      if (!rawQuery || rawQuery.length > 300) {
        res.status(400).json({ error: 'INVALID_QUERY' });
        return;
      }

      const cacheKey = `${lang}::${rawQuery.toLowerCase()}`;
      const cached = AI_CACHE.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.json({
          matchedCodes: cached.matchedCodes,
          reason: cached.reason,
          cached: true,
        });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI_UNAVAILABLE',
          matchedCodes: [],
          reason: '',
        });
        return;
      }

      const systemInstruction = `You are a food hygiene and F&B storage compliance search assistant for Sun World Ba Na Hills (BNC).
Your ONLY job is to map the user's search query (which may be natural language, ingredients, recipes, kitchen slang, typos, storage temperature conditions, shelf-life rules, Vietnamese without accents, English, Korean, or Hindi) to the exact matching item codes in the official 145-item BNC Food Storage & Shelf Life Catalog below.

CRITICAL LEGAL & DATA INTEGRITY RULES:
1. NEVER invent, guess, alter, or recalculate any shelf life, temperature, weight, or note.
2. ONLY return item codes that explicitly exist in the catalog (format PL1-01 to PL3-57).
3. Rank codes strictly from MOST relevant to least relevant (maximum 24 codes). If no item matches, return an empty array.
4. Explain briefly in 1 concise sentence in ${LANG_LABEL[lang]} why those items matched (e.g., matching ingredient, storage condition, same-day rule, or QA conflict), without quoting fabricated durations.

OFFICIAL CATALOG (Code | Group | Name | EnName | Room(R) | Cool 1-4C(C) | Freeze <=-18C(F) | DisplayCool(DC) | DisplayHot(DH) | Weight(W) | Note(N) | QA Flag):
${COMPACT_CATALOG}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `User query (${LANG_LABEL[lang]}): "${rawQuery}"`,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchedCodes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'Exact official item codes from the catalog ordered by relevance (max 24).',
              },
              reason: {
                type: Type.STRING,
                description: `One short, clear sentence in ${LANG_LABEL[lang]} explaining the search match.`,
              },
            },
            required: ['matchedCodes', 'reason'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      let parsed: { matchedCodes?: unknown; reason?: unknown } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {};
      }

      const seen = new Set<string>();
      const matchedCodes: string[] = Array.isArray(parsed.matchedCodes)
        ? parsed.matchedCodes
            .filter((code): code is string => typeof code === 'string')
            .map((code) => code.trim().toUpperCase())
            .filter((code) => {
              if (!VALID_ITEM_CODES.has(code) || seen.has(code)) return false;
              seen.add(code);
              return true;
            })
            .slice(0, 24)
        : [];

      const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';

      if (AI_CACHE.size >= MAX_CACHE_SIZE) {
        const oldestKey = AI_CACHE.keys().next().value;
        if (oldestKey) AI_CACHE.delete(oldestKey);
      }
      AI_CACHE.set(cacheKey, {
        matchedCodes,
        reason,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      res.json({ matchedCodes, reason, cached: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[api/ai-search] error:', msg);
      res.status(502).json({
        error: 'AI_REQUEST_FAILED',
        matchedCodes: [],
        reason: '',
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

createApp();
