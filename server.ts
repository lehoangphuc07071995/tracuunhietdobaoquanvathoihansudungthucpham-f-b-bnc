import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Type, type Content } from '@google/genai';
import { FOOD_ITEMS, getItemCode } from './src/data/foodData.ts';
import {
  buildSheGeminiSystemInstruction,
  extractMatchedCodesFromText,
} from './src/utils/aiPromptBuilder.ts';
import {
  createServerGeminiClient,
  generateContentWithFlashFallback,
  openStreamWithFlashFallback,
} from './src/server/geminiClient.ts';
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
    `Room(15-25C):${item.room}`,
    `Cool(0-5C):${item.cool}`,
    `Freeze(<=-18C):${item.freeze}`,
  ];
  if (item.keywords && item.keywords.length > 0) {
    parts.push(`KW:${item.keywords.join(',')}`);
  }
  if (item.note && item.note !== '—') {
    parts.push(`Note:${item.note}`);
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

function buildMultiTurnContents(rawHistory: unknown, message: string): Content[] {
  const turns = Array.isArray(rawHistory)
    ? (rawHistory as Array<{ role?: unknown; content?: unknown }>)
        .filter(
          (h) =>
            (h.role === 'user' || h.role === 'assistant') &&
            typeof h.content === 'string' &&
            h.content.trim()
        )
        .slice(-6)
    : [];

  const contents: Content[] = turns.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(turn.content).trim() }],
  }));

  const last = contents[contents.length - 1];
  if (!last || last.role !== 'user' || last.parts?.[0]?.text !== message) {
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });
  }
  return contents;
}

async function createApp() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '2mb' }));

  // Streaming Ask AI endpoint (SSE) using gemini-2.5-flash + temperature 0.2 + Full Context Grounding
  app.post('/api/ai-ask', async (req, res) => {
    let headersSentForSse = false;
    try {
      const message =
        typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      const rawLang = typeof req.body?.lang === 'string' ? req.body.lang : 'VI';
      const lang: Lang =
        rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

      if (!message || message.length > 1000) {
        res.status(400).json({
          error: 'INVALID_MESSAGE',
          message: 'Câu hỏi không hợp lệ hoặc quá dài.',
        });
        return;
      }

      const ai = createServerGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI_UNAVAILABLE',
          message:
            'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.',
        });
        return;
      }

      const { systemInstruction, validCodes } = buildSheGeminiSystemInstruction(
        req.body?.catalog,
        lang
      );
      const contents = buildMultiTurnContents(req.body?.history, message);

      const { firstText, restIterator } = await openStreamWithFlashFallback(ai, {
        contents,
        systemInstruction,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      headersSentForSse = true;

      let fullText = '';
      if (firstText) {
        fullText += firstText;
        res.write(`data: ${JSON.stringify({ type: 'delta', text: firstText })}\n\n`);
      }

      while (true) {
        const next = await restIterator.next();
        if (next.done) break;
        const delta = next.value?.text ?? '';
        if (delta) {
          fullText += delta;
          res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
        }
      }

      const matchedCodes = extractMatchedCodesFromText(fullText, validCodes);
      res.write(`data: ${JSON.stringify({ type: 'done', matchedCodes })}\n\n`);
      res.end();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[api/ai-ask] error:', msg);
      const isQuota = /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
      const isAuth = /401|403|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg);
      const userMsg = isAuth
        ? 'GEMINI_API_KEY không hợp lệ hoặc không có quyền truy cập.'
        : isQuota
          ? 'Gemini API đang quá tải hoặc hết hạn mức tạm thời. Vui lòng thử lại sau.'
          : 'Không thể kết nối Gemini API lúc này. Vui lòng thử lại.';

      if (headersSentForSse) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: userMsg })}\n\n`);
        res.end();
      } else {
        res.status(isAuth ? 403 : isQuota ? 429 : 502).json({
          error: isAuth
            ? 'API_KEY_INVALID'
            : isQuota
              ? 'RESOURCE_EXHAUSTED'
              : 'AI_ASK_FAILED',
          message: userMsg,
          detail: process.env.NODE_ENV !== 'production' ? msg.slice(0, 220) : undefined,
        });
      }
    }
  });

  // Non-streaming JSON Chat endpoint
  app.post('/api/ai-chat', async (req, res) => {
    try {
      const message =
        typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      const rawLang = typeof req.body?.lang === 'string' ? req.body.lang : 'VI';
      const lang: Lang =
        rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

      if (!message || message.length > 1000) {
        res.status(400).json({ error: 'INVALID_MESSAGE', reply: '', matchedCodes: [] });
        return;
      }

      const ai = createServerGeminiClient();
      if (!ai) {
        res.status(503).json({ error: 'AI_UNAVAILABLE', reply: '', matchedCodes: [] });
        return;
      }

      const { systemInstruction, validCodes } = buildSheGeminiSystemInstruction(
        req.body?.catalog,
        lang
      );
      const contents = buildMultiTurnContents(req.body?.history, message);

      const response = await generateContentWithFlashFallback(ai, {
        contents,
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                'Concise bullet-point answer strictly grounded in the regulation dataset, bolding temperatures and shelf lives.',
            },
            matchedCodes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exact catalog item codes cited in the answer (max 15).',
            },
          },
          required: ['reply', 'matchedCodes'],
        },
      });

      const rawText = (response.text ?? '{}').trim();
      let parsed: { reply?: unknown; matchedCodes?: unknown } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { reply: rawText };
      }

      const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
      const seen = new Set<string>();
      const schemaCodes = Array.isArray(parsed.matchedCodes)
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

      const matchedCodes =
        schemaCodes.length > 0
          ? schemaCodes
          : extractMatchedCodesFromText(reply, validCodes);

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

      const ai = createServerGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI_UNAVAILABLE',
          matchedCodes: [],
          reason: '',
        });
        return;
      }

      const systemInstruction = `You are a food hygiene and F&B storage compliance search assistant for Sun Group SHE Division (Quyết định 107/2026/QĐ-SHE/SG, Code SHE-QĐ-FB13).
Your ONLY job is to map the user's search query (natural language, ingredients, recipes, kitchen terms, typos, storage temperature conditions, shelf-life rules, Vietnamese without accents, English, Korean, or Hindi) to the exact matching item codes in the official 66-item SHE-QĐ-FB13 Food Storage & Shelf Life Catalog below.

CRITICAL LEGAL & DATA INTEGRITY RULES:
1. NEVER invent, guess, alter, or recalculate any shelf life, temperature, or note.
2. ONLY return item codes that explicitly exist in the catalog (format SHE-01 to SHE-66).
3. Respect Vietnamese diacritics strictly: "bơ" (butter) vs "bò" (beef); "dứa" (pineapple) vs "dừa" (coconut).
4. Rank codes strictly from MOST relevant to least relevant (maximum 24 codes). If no item matches, return an empty array.
5. Explain briefly in 1 concise sentence in ${LANG_LABEL[lang]} why those items matched (e.g., matching food group, temperature band, no-freeze rule, or shelf-life note), without quoting fabricated durations.

OFFICIAL SHE-QĐ-FB13 CATALOG (Code | Group | Name | EnName | Room 15-25C | Cool 0-5C | Freeze <=-18C | Keywords | Note | QA):
${COMPACT_CATALOG}`;

      const response = await generateContentWithFlashFallback(ai, {
        contents: `User query (${LANG_LABEL[lang]}): "${rawQuery}"`,
        systemInstruction,
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
    if (process.env.DISABLE_HMR === 'true') {
      app.get('/@vite/client', (_req, res) => {
        res.type('application/javascript').send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay {}
`);
      });
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr:
          process.env.DISABLE_HMR === 'true'
            ? false
            : { server: httpServer },
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
