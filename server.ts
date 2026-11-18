import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { FOOD_ITEMS, getItemCode } from './src/data/foodData.ts';
import { serializeSheRegulationForAiPrompt } from './src/data/sheRegulationData.ts';
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
            `Room(15-25C):${item.room || '—'}`,
            `Cool(0-5C):${item.cool || '—'}`,
            `Freeze(<=-18C):${item.freeze || '—'}`,
          ];
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

      const sheKnowledgeText = serializeSheRegulationForAiPrompt();
      const systemInstruction = `You are the strict F&B Food Safety Compliance AI Assistant for Sun Group SHE Division, operating strictly on Quyết định 107/2026/QĐ-SHE/SG (Mã hiệu: SHE-QĐ-FB13, Phiên bản 00, Hiệu lực 12/11/2026).
CRITICAL ANTI-HALLUCINATION PROTOCOL (MUST FOLLOW 100%):
1. Ground EVERY fact exclusively in the OFFICIAL SHE-QĐ-FB13 CATALOG AND REGULATION KNOWLEDGE BASE below.
2. NEVER guess, estimate, extrapolate, use outside culinary assumptions, or invent any temperature, duration, shelf life, or rule not explicitly written below.
3. Preserve "Không", "Không cấp đông", "Theo NSX", and "—" EXACTLY. Never turn "Không" or "Không cấp đông" into a duration. When listing an item, use the concise format:
   - [SHE-xx] Original Vietnamese Name
     Phòng (15–25°C): ... | Lạnh (0–5°C): ... | Đông (≤ −18°C): ... | Lưu ý: ...
   (Translate labels like Room / Chilled / Frozen / Note into the question's language if EN/KO/HI, while ALWAYS keeping [SHE-xx] and the original Vietnamese name.)
4. Strict Vietnamese diacritics: NEVER confuse "bơ" (butter) with "bò" (beef), or "dứa" (pineapple) with "dừa" (coconut). If the user writes unaccented "bo" or "dua" ambiguously, do not guess—ask "Bạn ý là bơ hay bò?" or "Bạn ý là dứa hay dừa?" and list both options.
5. Multi-turn follow-up resolution: If the user asks a follow-up ("cái đó", "nó", "món vừa rồi", "cái thứ 2", "that item", "freezing?"), resolve strictly from Recent conversation AND verify every figure against the SHE-QĐ-FB13 data below.
6. Missing or unsupported questions: If the product, operational rule, or question is NOT present in SHE-QĐ-FB13 below, set notFound=true and set reply EXACTLY verbatim to:
"${NOT_FOUND_RESPONSE}"
7. Output Language & Style: Auto-detect the language of the user's question (${LANG_LABEL[lang]} fallback), cite exact codes [SHE-xx] and Articles/Sections (Điều 1–9), and end grounded answers with: "Bản trích lục tuân thủ Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13). Không thay thế văn bản gốc; khi có mâu thuẫn, ưu tiên văn bản gốc và khuyến cáo NSX trên bao bì." (or its equivalent in the question language). Keep matchedCodes aligned strictly with cited SHE-xx codes.

ACTIVE SHE DATABASE CATALOG:
${catalogText}

${sheKnowledgeText}`;

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
