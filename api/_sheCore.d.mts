import type {
  Content,
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
} from '@google/genai';

export type Lang = 'VI' | 'EN' | 'KO' | 'HI';

export interface VercelFoodItem {
  a: 'SHE';
  g: string;
  n: number;
  name: string;
  enName?: string;
  room: string;
  cool: string;
  freeze: string;
  note: string;
  flag: string;
  keywords?: string[];
}

export declare const FOOD_ITEMS: VercelFoodItem[];
export declare function getItemCode(item: VercelFoodItem): string;

export declare function buildSheGeminiSystemInstruction(
  rawCatalog: unknown,
  lang?: Lang
): {
  systemInstruction: string;
  validCodes: Set<string>;
};

export declare function extractMatchedCodesFromText(
  text: string,
  validCodes: Set<string>
): string[];

export declare function createServerGeminiClient(): GoogleGenAI | null;

export declare function generateContentWithFlashFallback(
  ai: GoogleGenAI,
  params: {
    contents: Content[] | string;
    systemInstruction: string;
    responseMimeType?: string;
    responseSchema?: GenerateContentConfig['responseSchema'];
  }
): Promise<GenerateContentResponse>;

export declare function openStreamWithFlashFallback(
  ai: GoogleGenAI,
  params: {
    contents: Content[];
    systemInstruction: string;
  }
): Promise<{
  firstText: string;
  restIterator: AsyncIterator<GenerateContentResponse>;
}>;
