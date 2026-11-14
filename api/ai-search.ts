import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { FOOD_ITEMS, getItemCode } from '../src/data/foodData';
import type { Lang } from '../src/types';

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

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      sendJson(res, 503, { error: 'AI_UNAVAILABLE', matchedCodes: [], reason: '' });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
