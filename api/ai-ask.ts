import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Content } from '@google/genai';
import {
  buildSheGeminiSystemInstruction,
  extractMatchedCodesFromText,
} from '../src/utils/aiPromptBuilder';
import {
  createServerGeminiClient,
  openStreamWithFlashFallback,
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
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  let headersSentForSse = false;
  try {
    const body = await readJsonBody(req);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const rawLang = typeof body.lang === 'string' ? body.lang : 'VI';
    const lang: Lang =
      rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

    if (!message || message.length > 1000) {
      sendJson(res, 400, {
        error: 'INVALID_MESSAGE',
        message: 'Câu hỏi không hợp lệ hoặc quá dài.',
      });
      return;
    }

    const ai = createServerGeminiClient();
    if (!ai) {
      sendJson(res, 503, {
        error: 'AI_UNAVAILABLE',
        message:
          'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.',
      });
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

    const { firstText, restIterator } = await openStreamWithFlashFallback(ai, {
      contents,
      systemInstruction,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    (res as ServerResponse & { flushHeaders?: () => void }).flushHeaders?.();
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
      sendJson(res, isAuth ? 403 : isQuota ? 429 : 502, {
        error: isAuth ? 'API_KEY_INVALID' : isQuota ? 'RESOURCE_EXHAUSTED' : 'AI_ASK_FAILED',
        message: userMsg,
      });
    }
  }
}
