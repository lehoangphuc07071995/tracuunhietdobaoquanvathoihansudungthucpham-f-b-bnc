import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
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
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '512kb' }));

  app.post('/api/ai-chat', async (req, res) => {
    const NOT_FOUND_RESPONSE =
      'Không tìm thấy kết quả trong dữ liệu hệ thống, vui lòng liên hệ Quản lý trực tiếp để được hướng dẫn.';
    try {
      const message =
        typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      const rawLang = typeof req.body?.lang === 'string' ? req.body.lang : 'VI';
      const lang: Lang =
        rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

      if (!message || message.length > 600) {
        res.status(400).json({ error: 'INVALID_MESSAGE', reply: '', matchedCodes: [] });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({ error: 'AI_UNAVAILABLE', reply: '', matchedCodes: [] });
        return;
      }

      interface ChatCatalogItem {
        code?: string;
        g?: string;
        name?: string;
        enName?: string;
        room?: string;
        cool?: string;
        freeze?: string;
        displayCool?: string;
        displayHot?: string;
        weight?: string;
        standardTemp?: string;
        shelfLifeUnopened?: string;
        shelfLifeOpened?: string;
        packagingSpec?: string;
        note?: string;
        haccpNote?: string;
      }

      const clientCatalog: ChatCatalogItem[] =
        Array.isArray(req.body?.catalog) && req.body.catalog.length > 0
          ? (req.body.catalog as ChatCatalogItem[]).slice(0, 600)
          : FOOD_ITEMS.map((item) => ({
              code: getItemCode(item),
              g: item.g,
              name: item.name,
              enName: item.enName || '',
              room: item.room,
              cool: item.cool,
              freeze: item.freeze,
              displayCool: item.displayCool || '',
              displayHot: item.displayHot || '',
              weight: item.weight || '',
              note: item.note,
              haccpNote: item.flag || '',
            }));

      const validCodes = new Set<string>();
      const catalogText = clientCatalog
        .map((item) => {
          const code = String(item.code || '').trim().toUpperCase();
          if (code) validCodes.add(code);
          const parts = [
            code,
            item.g || '',
            item.name || '',
            item.enName || '',
            `Room:${item.room || '—'}`,
            `Cool(1-4C):${item.cool || '—'}`,
            `Freeze(<=-18C):${item.freeze || '—'}`,
          ];
          if (item.displayCool && item.displayCool !== '—') {
            parts.push(`DisplayCool:${item.displayCool}`);
          }
          if (item.displayHot && item.displayHot !== '—' && item.displayHot !== '-') {
            parts.push(`DisplayHot:${item.displayHot}`);
          }
          if (item.weight) parts.push(`Weight:${item.weight}`);
          if (item.standardTemp) parts.push(`StdTemp:${item.standardTemp}`);
          if (item.shelfLifeUnopened) parts.push(`Unopened:${item.shelfLifeUnopened}`);
          if (item.shelfLifeOpened) parts.push(`Opened:${item.shelfLifeOpened}`);
          if (item.packagingSpec) parts.push(`Packaging:${item.packagingSpec}`);
          if (item.note && item.note !== '—') parts.push(`Note:${item.note}`);
          if (item.haccpNote) parts.push(`HACCP/QA:${item.haccpNote}`);
          return parts.filter(Boolean).join(' | ');
        })
        .join('\n');

      const historyTurns = Array.isArray(req.body?.history)
        ? (req.body.history as Array<{ role?: unknown; content?: unknown }>)
            .filter(
              (h) =>
                (h.role === 'user' || h.role === 'assistant') &&
                typeof h.content === 'string'
            )
            .slice(-20)
        : [];

      const systemInstruction = `You are the strict internal F&B QA/QC Compliance AI Assistant for Sun World Ba Na Hills (BNC).
CRITICAL ANTI-HALLUCINATION PROTOCOL (MUST FOLLOW 100%):
1. Ground EVERY fact strictly and exclusively on the INTERNAL DATABASE CATALOG below.
2. NEVER guess, estimate, extrapolate, assume general culinary knowledge, or invent any temperature, duration, shelf life, opened/unopened rule, or product that is not explicitly written in the catalog below.
3. Empty/dash cells ("—"): If a product exists in the catalog, NEVER invent a duration for columns marked "—". State clearly that the original regulation leaves that condition blank / unspecified ("—").
4. Multi-turn follow-up resolution: If the user asks a follow-up with pronouns or ellipsis ("cái đó", "nó", "món vừa rồi", "that item", "room temp?"), resolve it ONLY from the Recent conversation AND verify every quoted figure against the INTERNAL DATABASE CATALOG.
5. Missing or unsupported questions: If the requested product, ingredient, or specific question is NOT present in the catalog or lacks grounded evidence in the catalog, set notFound=true and set reply EXACTLY verbatim to:
"${NOT_FOUND_RESPONSE}"
6. NLP Flexibility: Understand Vietnamese without diacritics, kitchen slang, typos, abbreviations (HSD, TBM, TBN, PL1-PL3, rã đông, sau mở, chưa mở), inverted sentences, and logical filtering (e.g., all items stored at ≤ -18°C, comparison before vs after opening).
7. Output Language & Style: Auto-detect the language of the user's question (fallback ${LANG_LABEL[lang]}), reply concisely with clear bullet points, and cite each referenced item using exact format [Code] Product Name (e.g. [PL1-01] Bột ngũ vị hương). Keep matchedCodes aligned strictly with the cited items.

INTERNAL DATABASE CATALOG:
${catalogText}`;

      const conversationContext = historyTurns
        .map(
          (t) =>
            `${t.role === 'user' ? 'User' : 'Assistant'}: ${String(t.content)}`
        )
        .join('\n');

      const prompt = conversationContext
        ? `Recent conversation (up to 10 turns):\n${conversationContext}\n\nLatest User Question: "${message}"`
        : `User Question: "${message}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  'Concise bullet-point answer strictly grounded in catalog, or exact NOT_FOUND_RESPONSE when absent.',
              },
              matchedCodes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exact catalog item codes cited in the answer (max 15).',
              },
              notFound: {
                type: Type.BOOLEAN,
                description: 'True only when no grounded answer exists in the catalog.',
              },
            },
            required: ['reply', 'matchedCodes', 'notFound'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      let parsed: {
        reply?: unknown;
        matchedCodes?: unknown;
        notFound?: unknown;
      } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {};
      }

      const seen = new Set<string>();
      const matchedCodes = Array.isArray(parsed.matchedCodes)
        ? parsed.matchedCodes
            .filter((c): c is string => typeof c === 'string')
            .map((c) => c.trim().toUpperCase())
            .filter((c) => {
              if (!validCodes.has(c) || seen.has(c)) return false;
              seen.add(c);
              return true;
            })
            .slice(0, 15)
        : [];

      const reply =
        parsed.notFound === true ||
        typeof parsed.reply !== 'string' ||
        !parsed.reply.trim()
          ? NOT_FOUND_RESPONSE
          : parsed.reply.trim();

      res.json({ reply, matchedCodes });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[api/ai-chat] error:', msg);
      res.status(502).json({
        error: 'AI_CHAT_FAILED',
        reply: '',
        matchedCodes: [],
      });
    }
  });

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
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr:
          process.env.DISABLE_HMR === 'true'
            ? false
            : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port =
    process.env.PORT && process.env.PORT !== '8080'
      ? Number(process.env.PORT) || 3000
      : 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

createApp();
