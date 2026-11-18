import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { FOOD_ITEMS, getItemCode } from '../src/data/foodData';
import { serializeSheRegulationForAiPrompt } from '../src/data/sheRegulationData';
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
  standardTemp?: string;
  shelfLifeUnopened?: string;
  shelfLifeOpened?: string;
  packagingSpec?: string;
  note: string;
  haccpNote?: string;
  customFields?: Record<string, string>;
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
      `Room(15-25C):${item.room}`,
      `Cool(0-5C):${item.cool}`,
      `Freeze(<=-18C):${item.freeze}`,
    ];
    if (item.standardTemp) parts.push(`StdTemp:${item.standardTemp}`);
    if (item.shelfLifeUnopened) parts.push(`Unopened:${item.shelfLifeUnopened}`);
    if (item.shelfLifeOpened) parts.push(`Opened:${item.shelfLifeOpened}`);
    if (item.packagingSpec) parts.push(`Packaging:${item.packagingSpec}`);
    if (item.note && item.note !== '—') parts.push(`Note:${item.note}`);
    if (item.haccpNote) parts.push(`HACCP/QA:${item.haccpNote}`);
    if (item.customFields && typeof item.customFields === 'object') {
      for (const [k, v] of Object.entries(item.customFields)) {
        if (v && String(v).trim()) parts.push(`${k}:${String(v).trim()}`);
      }
    }
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
7. Output Language & Style: Auto-detect the language of the user's question (${lang} fallback), cite exact codes [SHE-xx] and Articles/Sections (Điều 1–9), and end grounded answers with: "Bản trích lục tuân thủ Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13). Không thay thế văn bản gốc; khi có mâu thuẫn, ưu tiên văn bản gốc và khuyến cáo NSX trên bao bì." (or its equivalent in the question language). Keep matchedCodes aligned strictly with cited SHE-xx codes.

ACTIVE SHE DATABASE CATALOG (including any Admin updates):
${catalogText}

${sheKnowledgeText}`;

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
                'Concise bullet-point answer strictly grounded in SHE-QĐ-FB13, or exact NOT_FOUND_RESPONSE when absent.',
            },
            matchedCodes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exact SHE-xx item codes cited in the answer (max 15).',
            },
            notFound: {
              type: Type.BOOLEAN,
              description: 'True only when no grounded answer exists in SHE-QĐ-FB13.',
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
