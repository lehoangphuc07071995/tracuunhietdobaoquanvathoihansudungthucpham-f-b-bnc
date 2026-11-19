import {
  GoogleGenAI,
  ThinkingLevel,
  type Content,
  type GenerateContentConfig,
  type GenerateContentResponse,
} from '@google/genai';

const TRANSIENT_MODEL_ERROR_RE =
  /404|503|UNAVAILABLE|high demand|NOT_FOUND|not found|not supported|overloaded/i;

export function createServerGeminiClient(): GoogleGenAI | null {
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

function isTransientOrModelError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT_MODEL_ERROR_RE.test(msg);
}

export async function generateContentWithFlashFallback(
  ai: GoogleGenAI,
  params: {
    contents: Content[] | string;
    systemInstruction: string;
    responseMimeType?: string;
    responseSchema?: GenerateContentConfig['responseSchema'];
  }
): Promise<GenerateContentResponse> {
  const baseJsonConfig = {
    systemInstruction: params.systemInstruction,
    ...(params.responseMimeType ? { responseMimeType: params.responseMimeType } : {}),
    ...(params.responseSchema ? { responseSchema: params.responseSchema } : {}),
  };

  try {
    return await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: params.contents,
      config: {
        ...baseJsonConfig,
        temperature: 0.2,
      },
    });
  } catch (err1) {
    if (!isTransientOrModelError(err1)) throw err1;
    await new Promise((r) => setTimeout(r, 250));
    try {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: params.contents,
        config: {
          ...baseJsonConfig,
          temperature: 0.2,
        },
      });
    } catch (err2) {
      if (!isTransientOrModelError(err2)) throw err2;
      try {
        return await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: params.contents,
          config: {
            ...baseJsonConfig,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
      } catch (err3) {
        if (!isTransientOrModelError(err3)) throw err3;
        return await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: params.contents,
          config: {
            ...baseJsonConfig,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        });
      }
    }
  }
}

export async function openStreamWithFlashFallback(
  ai: GoogleGenAI,
  params: {
    contents: Content[];
    systemInstruction: string;
  }
): Promise<{
  firstText: string;
  restIterator: AsyncIterator<GenerateContentResponse>;
}> {
  const tryOpen = async (
    model: string,
    config: GenerateContentConfig
  ): Promise<{
    firstText: string;
    restIterator: AsyncIterator<GenerateContentResponse>;
  }> => {
    const stream = await ai.models.generateContentStream({
      model,
      contents: params.contents,
      config,
    });
    const iterator = stream[Symbol.asyncIterator]();
    let firstText = '';
    while (true) {
      const next = await iterator.next();
      if (next.done) break;
      const chunkText = next.value?.text ?? '';
      if (chunkText) {
        firstText = chunkText;
        break;
      }
    }
    return { firstText, restIterator: iterator };
  };

  try {
    return await tryOpen('gemini-2.5-flash', {
      systemInstruction: params.systemInstruction,
      temperature: 0.2,
    });
  } catch (err1) {
    if (!isTransientOrModelError(err1)) throw err1;
    await new Promise((r) => setTimeout(r, 250));
    try {
      return await tryOpen('gemini-2.5-flash', {
        systemInstruction: params.systemInstruction,
        temperature: 0.2,
      });
    } catch (err2) {
      if (!isTransientOrModelError(err2)) throw err2;
      try {
        return await tryOpen('gemini-4-hydrogen', {
          systemInstruction: params.systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        });
      } catch (err3) {
        if (!isTransientOrModelError(err3)) throw err3;
        return await tryOpen('gemini-3.1-flash-lite', {
          systemInstruction: params.systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        });
      }
    }
  }
}
