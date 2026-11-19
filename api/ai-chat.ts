import type { IncomingMessage, ServerResponse } from 'node:http';
import { Type, type Content } from '@google/genai';
import {
  buildSheGeminiSystemInstruction,
  extractMatchedCodesFromText,
} from '../src/utils/aiPromptBuilder';
import {
  createServerGeminiClient,
  generateContentWithFlashFallback,
} from '../src/server/geminiClient';
import type { Lang } from '../src/types';

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

    if (!message || message.length > 1000) {
      sendJson(res, 400, { error: 'INVALID_MESSAGE', reply: '', matchedCodes: [] });
      return;
    }

    const ai = createServerGeminiClient();
    if (!ai) {
      sendJson(res, 503, { error: 'AI_UNAVAILABLE', reply: '', matchedCodes: [] });
      return;
    }

    const { systemInstruction, validCodes } = buildSheGeminiSystemInstruction(
      body.catalog,
      lang
    );

    const rawHistory = Array.isArray(body.history)
      ? body.history
          .filter(
            (h): h is HistoryTurn =>
              Boolean(
                h &&
                  typeof h === 'object' &&
                  ((h as HistoryTurn).role === 'user' ||
                    (h as HistoryTurn).role === 'assistant') &&
                  typeof (h as HistoryTurn).content === 'string' &&
                  (h as HistoryTurn).content.trim()
              )
          )
          .slice(-6)
      : [];

    const contents: Content[] = rawHistory.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content.trim() }],
    }));

    const lastTurn = contents[contents.length - 1];
    if (
      !lastTurn ||
      lastTurn.role !== 'user' ||
      lastTurn.parts?.[0]?.text !== message
    ) {
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

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
