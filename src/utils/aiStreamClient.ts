import { getItemCode } from '../data/foodData';
import { translateItemName } from '../data/translations';
import type { AiChatTurn, FoodItem, Lang } from '../types';

export interface StreamAskParams {
  message: string;
  lang: Lang;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  items: FoodItem[];
  signal?: AbortSignal;
  onDelta: (accumulatedText: string, deltaText: string) => void;
}

export interface StreamAskResult {
  reply: string;
  matchedCodes: string[];
}

export class AiStreamHttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function serializeItemsForApi(items: FoodItem[]) {
  return items.map((it) => {
    const out: Record<string, unknown> = {
      code: getItemCode(it),
      g: it.g,
      name: it.name,
      enName: it.enName || translateItemName(it, 'EN'),
    };
    if (it.room && it.room !== '—') out.room = it.room;
    if (it.cool && it.cool !== '—') out.cool = it.cool;
    if (it.freeze && it.freeze !== '—') out.freeze = it.freeze;
    if (it.standardTemp) out.standardTemp = it.standardTemp;
    if (it.shelfLifeUnopened) out.shelfLifeUnopened = it.shelfLifeUnopened;
    if (it.shelfLifeOpened) out.shelfLifeOpened = it.shelfLifeOpened;
    if (it.packagingSpec) out.packagingSpec = it.packagingSpec;
    if (it.note && it.note !== '—') out.note = it.note;
    if (it.haccpNote || it.flag) out.haccpNote = it.haccpNote || it.flag;
    if (it.customFields && Object.keys(it.customFields).length > 0) {
      out.customFields = it.customFields;
    }
    return out;
  });
}

export function buildHistoryPayload(turns: AiChatTurn[]) {
  return turns
    .filter((t) => Boolean(t.content?.trim()))
    .slice(-6)
    .map((t) => ({
      role: t.role,
      content: t.content,
    }));
}

export async function streamAskGemini({
  message,
  lang,
  history,
  items,
  signal,
  onDelta,
}: StreamAskParams): Promise<StreamAskResult> {
  const response = await fetch('/api/ai-ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      lang,
      history,
      catalog: serializeItemsForApi(items),
    }),
    signal,
  });

  if (!response.ok) {
    let errCode = `HTTP_${response.status}`;
    let errMessage = `Máy chủ AI phản hồi lỗi (${response.status}).`;
    try {
      const json = (await response.json()) as { error?: string; message?: string };
      if (json.error) errCode = json.error;
      if (json.message) errMessage = json.message;
    } catch {
      // ignore non-json error body
    }
    throw new AiStreamHttpError(response.status, errCode, errMessage);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!response.body || !contentType.includes('text/event-stream')) {
    const data = (await response.json()) as {
      reply?: string;
      matchedCodes?: string[];
    };
    const text = typeof data.reply === 'string' ? data.reply : '';
    onDelta(text, text);
    return {
      reply: text,
      matchedCodes: Array.isArray(data.matchedCodes) ? data.matchedCodes : [],
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let accumulated = '';
  let matchedCodes: string[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundaryIdx: number;
    while ((boundaryIdx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, boundaryIdx);
      buffer = buffer.slice(boundaryIdx + 2);

      const dataLines = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart());

      if (dataLines.length === 0) continue;
      const payloadStr = dataLines.join('\n');
      if (!payloadStr) continue;

      try {
        const evt = JSON.parse(payloadStr) as {
          type?: string;
          text?: string;
          matchedCodes?: string[];
          message?: string;
        };
        if (evt.type === 'delta' && typeof evt.text === 'string') {
          accumulated += evt.text;
          onDelta(accumulated, evt.text);
        } else if (evt.type === 'done' && Array.isArray(evt.matchedCodes)) {
          matchedCodes = evt.matchedCodes;
        } else if (evt.type === 'error') {
          throw new AiStreamHttpError(
            502,
            'AI_STREAM_ERROR',
            evt.message || 'Lỗi nhận phản hồi từ Gemini.'
          );
        }
      } catch (parseErr) {
        if (parseErr instanceof AiStreamHttpError) throw parseErr;
      }
    }
  }

  return {
    reply: accumulated.trim(),
    matchedCodes,
  };
}
