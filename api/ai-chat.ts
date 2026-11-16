import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { FOOD_ITEMS, getItemCode } from '../src/data/foodData';
import type { Lang } from '../src/types';

const NOT_FOUND_RESPONSE =
  'Không tìm thấy kết quả trong dữ liệu hệ thống, vui lòng liên hệ Quản lý trực tiếp để được hướng dẫn.';

interface CatalogEntry {
  code: string;
  g: string;
  name: string;
  enName?: string;
  room: string;
  cool: string;
  freeze: string;
  displayCool?: string;
  displayHot?: string;
  weight?: string;
  standardTemp?: string;
  shelfLifeUnopened?: string;
  shelfLifeOpened?: string;
  packagingSpec?: string;
  note: string;
  haccpNote?: string;
}

interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

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

function serializeCatalog(rawCatalog: unknown): {
  text: string;
  validCodes: Set<string>;
} {
  const entries: CatalogEntry[] =
    Array.isArray(rawCatalog) && rawCatalog.length > 0
      ? rawCatalog
          .filter((x): x is CatalogEntry => Boolean(x && typeof x === 'object'))
          .slice(0, 600)
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
  const lines = entries.map((item) => {
    const code = String(item.code || '').trim().toUpperCase();
    if (code) validCodes.add(code);
    const parts = [
      code,
      item.g,
      item.name,
      item.enName || '',
      `Room:${item.room}`,
      `Cool(1-4C):${item.cool}`,
      `Freeze(<=-18C):${item.freeze}`,
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
  });

  return { text: lines.join('\n'), validCodes };
}

export default async function handler(req: VercelReq, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', reply: '', matchedCodes: [] });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const rawLang = typeof body.lang === 'string' ? body.lang : 'VI';
    const lang: Lang =
      rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

    if (!message || message.length > 600) {
      sendJson(res, 400, { error: 'INVALID_MESSAGE', reply: '', matchedCodes: [] });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      sendJson(res, 503, { error: 'AI_UNAVAILABLE', reply: '', matchedCodes: [] });
      return;
    }

    const { text: catalogText, validCodes } = serializeCatalog(body.catalog);

    const historyTurns: HistoryTurn[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (h): h is HistoryTurn =>
              Boolean(
                h &&
                  typeof h === 'object' &&
                  ((h as HistoryTurn).role === 'user' ||
                    (h as HistoryTurn).role === 'assistant') &&
                  typeof (h as HistoryTurn).content === 'string'
              )
          )
          .slice(-20)
      : [];

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are the strict internal F&B QA/QC Compliance AI Assistant for Sun World Ba Na Hills (BNC).
CRITICAL ANTI-HALLUCINATION PROTOCOL (MUST FOLLOW 100%):
1. Ground EVERY fact strictly and exclusively on the INTERNAL DATABASE CATALOG below.
2. NEVER guess, estimate, extrapolate, assume general culinary knowledge, or invent any temperature, duration, shelf life, opened/unopened rule, or product that is not explicitly written in the catalog below.
3. Empty/dash cells ("—"): If a product exists in the catalog, NEVER invent a duration for columns marked "—". State clearly that the original regulation leaves that condition blank / unspecified ("—").
4. Multi-turn follow-up resolution: If the user asks a follow-up with pronouns or ellipsis ("cái đó", "nó", "món vừa rồi", "that item", "room temp?"), resolve it ONLY from the Recent conversation AND verify every quoted figure against the INTERNAL DATABASE CATALOG.
5. Missing or unsupported questions: If the requested product, ingredient, or specific question is NOT present in the catalog or lacks grounded evidence in the catalog, set notFound=true and set reply EXACTLY verbatim to:
"${NOT_FOUND_RESPONSE}"
6. NLP Flexibility: Understand Vietnamese without diacritics, kitchen slang, typos, abbreviations (HSD, TBM, TBN, PL1-PL3, rã đông, sau mở, chưa mở), inverted sentences, and logical filtering (e.g., all items stored at ≤ -18°C, comparison before vs after opening).
7. Output Language & Style: Auto-detect the language of the user's question (fallback ${lang}), reply concisely with clear bullet points, and cite each referenced item using exact format [Code] Product Name (e.g. [PL1-01] Bột ngũ vị hương). Keep matchedCodes aligned strictly with the cited items.

INTERNAL DATABASE CATALOG:
${catalogText}`;

    const conversationContext = historyTurns
      .map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
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

    sendJson(res, 200, { reply, matchedCodes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/ai-chat] error:', msg);
    sendJson(res, 502, {
      error: 'AI_CHAT_FAILED',
      reply: '',
      matchedCodes: [],
    });
  }
}
