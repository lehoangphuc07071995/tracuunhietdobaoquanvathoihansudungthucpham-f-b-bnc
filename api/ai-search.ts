import type { IncomingMessage, ServerResponse } from 'node:http';
import { Type } from '@google/genai';
import {
  FOOD_ITEMS,
  createServerGeminiClient,
  generateContentWithFlashFallback,
  getItemCode,
  type Lang,
} from './_sheCore.mjs';

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

const LANG_LABEL: Record<Lang, string> = {
  VI: 'Vietnamese',
  EN: 'English',
  KO: 'Korean',
  HI: 'Hindi',
};

type VercelReq = IncomingMessage & {
  body?: unknown;
};

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: VercelReq): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default async function handler(req: VercelReq, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', matchedCodes: [], reason: '' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const rawQuery = typeof body.query === 'string' ? body.query.trim() : '';
    const rawLang = typeof body.lang === 'string' ? body.lang : 'VI';
    const lang: Lang =
      rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

    if (!rawQuery || rawQuery.length > 300) {
      sendJson(res, 400, { error: 'INVALID_QUERY', matchedCodes: [], reason: '' });
      return;
    }

    const ai = createServerGeminiClient();
    if (!ai) {
      sendJson(res, 503, { error: 'AI_UNAVAILABLE', matchedCodes: [], reason: '' });
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
              'Exact official SHE item codes from the catalog ordered by relevance (max 24).',
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

    sendJson(res, 200, { matchedCodes, reason, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/ai-search] error:', msg);
    sendJson(res, 502, {
      error: 'AI_REQUEST_FAILED',
      matchedCodes: [],
      reason: '',
    });
  }
}
