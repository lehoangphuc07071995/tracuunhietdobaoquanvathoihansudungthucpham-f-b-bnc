import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { FOOD_ITEMS, getItemCode } from './src/data/foodData.ts';
import { runSmartSearch } from './src/utils/smartSearch.ts';
import type { FoodItem, Lang } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type CanonicalFoodItem = FoodItem & { code: string };

const CANONICAL_ITEMS: CanonicalFoodItem[] = FOOD_ITEMS.map((item) => ({
  ...item,
  code: getItemCode(item),
}));

const VALID_ITEM_CODES = new Set(CANONICAL_ITEMS.map((item) => item.code));
const ITEMS_BY_CODE = new Map<string, CanonicalFoodItem>(
  CANONICAL_ITEMS.map((item) => [item.code.toUpperCase(), item])
);

const SCAN_DATABASE_JSON = JSON.stringify(
  CANONICAL_ITEMS.map((item) => ({
    code: item.code,
    group: item.g,
    name: item.name,
    ...(item.enName ? { enName: item.enName } : {}),
    ...(item.note && item.note !== '—' ? { note: item.note } : {}),
  }))
);

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

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

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

  app.post('/api/ai-vision-scan', async (req, res) => {
    try {
      const rawImage =
        typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64.trim() : '';
      const rawMime =
        typeof req.body?.mimeType === 'string'
          ? req.body.mimeType.trim().toLowerCase()
          : 'image/jpeg';
      const rawLang = typeof req.body?.lang === 'string' ? req.body.lang : 'VI';
      const lang: Lang =
        rawLang === 'EN' || rawLang === 'KO' || rawLang === 'HI' ? rawLang : 'VI';

      if (!rawImage) {
        res.status(400).json({ error: 'MISSING_IMAGE', recognized_item: '', matched_data: null });
        return;
      }

      const cleanBase64 = rawImage.replace(/^data:[^;]+;base64,/, '');
      const mimeType = ALLOWED_IMAGE_MIMES.has(rawMime)
        ? rawMime === 'image/jpg'
          ? 'image/jpeg'
          : rawMime
        : 'image/jpeg';

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI_UNAVAILABLE',
          recognized_item: '',
          matched_data: null,
        });
        return;
      }

      const promptText = `Bạn là chuyên gia QA/QC hệ thống F&B. Hãy nhìn bức ảnh nhãn mác/nguyên liệu này, đọc kỹ toàn bộ văn bản trên bao bì/tem nhãn (tiếng Việt, tiếng Anh, tiếng Hàn, tiếng Pháp, thương hiệu, thành phần, quy cách) và nhận diện hình ảnh thực phẩm/nguyên liệu để xác định chính xác tên loại thực phẩm.

Sau đó, dò tìm tên thực phẩm vừa nhận diện được bên trong danh sách dữ liệu cơ sở (Database) sau đây của ứng dụng:
${SCAN_DATABASE_JSON}

QUY TẮC ÁNH XẠ CHÍNH XÁC:
- Quy đổi chính xác tên thương mại, tiếng Anh hoặc thành phần chính sang đúng mặt hàng trong Database (ví dụ: Whipping Cream -> Kem sữa béo/Kem tươi; Mozzarella/Cheddar/Mascarpone -> Phô mai; Salmon -> Cá hồi; Croissant -> Bánh sừng bò; Soy sauce -> Nước tương; Mayonnaise -> Xốt Mayonnaise; Coffee beans -> Cà phê).
- Nếu ảnh quá mờ không đọc được, hoặc chắc chắn KHÔNG phải thực phẩm/nguyên liệu F&B có trong hệ thống tiêu chuẩn thì đặt is_food_or_beverage = false và matched_code = null.
- Trả về đúng JSON với:
  + "recognized_item": tên sản phẩm/nhãn mác đọc được rõ ràng bằng ${LANG_LABEL[lang]}.
  + "ocr_keywords": các từ khóa văn bản quan trọng đọc được từ nhãn mác/bao bì (tiếng Việt + tiếng Anh) để đối chiếu ngược vào Database.
  + "is_food_or_beverage": true nếu ảnh là thực phẩm/nguyên liệu/đồ uống/bao bì F&B hợp lệ, ngược lại false.
  + "matched_code": mã code khớp nhất trong Database (ví dụ "PL1-05") hoặc null nếu không khớp.
  + "related_codes": danh sách tối đa 5 mã code liên quan sát nghĩa nhất trong Database.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recognized_item: {
                type: Type.STRING,
                description: 'Recognized food item name or packaging label text.',
              },
              ocr_keywords: {
                type: Type.STRING,
                description: 'Key OCR words read from the label for reverse catalog lookup.',
              },
              is_food_or_beverage: {
                type: Type.BOOLEAN,
                description: 'True if image shows identifiable food, ingredient, or F&B packaging.',
              },
              matched_code: {
                type: Type.STRING,
                nullable: true,
                description: 'Best matching official catalog code (e.g. PL1-05) or null.',
              },
              related_codes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Closely related official catalog codes.',
              },
            },
            required: ['recognized_item', 'is_food_or_beverage'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      let parsed: {
        recognized_item?: unknown;
        ocr_keywords?: unknown;
        is_food_or_beverage?: unknown;
        matched_code?: unknown;
        related_codes?: unknown;
      } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {};
      }

      const recognizedItem =
        typeof parsed.recognized_item === 'string'
          ? parsed.recognized_item.trim()
          : '';
      const ocrKeywords =
        typeof parsed.ocr_keywords === 'string' ? parsed.ocr_keywords.trim() : '';
      const isFood = parsed.is_food_or_beverage !== false;

      let canonicalMatch: CanonicalFoodItem | null = null;
      if (isFood && typeof parsed.matched_code === 'string') {
        canonicalMatch = ITEMS_BY_CODE.get(parsed.matched_code.trim().toUpperCase()) ?? null;
      }

      const relatedCodes: string[] = [];
      const seenCodes = new Set<string>();
      if (canonicalMatch) {
        relatedCodes.push(canonicalMatch.code);
        seenCodes.add(canonicalMatch.code);
      }
      if (isFood && Array.isArray(parsed.related_codes)) {
        for (const c of parsed.related_codes) {
          if (typeof c !== 'string') continue;
          const up = c.trim().toUpperCase();
          if (VALID_ITEM_CODES.has(up) && !seenCodes.has(up)) {
            seenCodes.add(up);
            relatedCodes.push(up);
          }
        }
      }

      if (isFood && !canonicalMatch && relatedCodes.length > 0) {
        canonicalMatch = ITEMS_BY_CODE.get(relatedCodes[0]) ?? null;
      }

      // Reverse lookup fallback via runSmartSearch if Gemini extracted clear F&B label text
      if (isFood && !canonicalMatch && (recognizedItem || ocrKeywords)) {
        const lookupTerms = [recognizedItem, ocrKeywords].filter(Boolean).join(' ');
        const reverseMatches = runSmartSearch({
          items: FOOD_ITEMS,
          query: lookupTerms,
          lang,
        });
        if (reverseMatches.length > 0) {
          const topCode = getItemCode(reverseMatches[0]);
          canonicalMatch = ITEMS_BY_CODE.get(topCode.toUpperCase()) ?? null;
          for (const rm of reverseMatches.slice(0, 5)) {
            const c = getItemCode(rm).toUpperCase();
            if (!seenCodes.has(c)) {
              seenCodes.add(c);
              relatedCodes.push(c);
            }
          }
        }
      }

      res.json({
        recognized_item: recognizedItem,
        matched_data: canonicalMatch,
        related_codes: relatedCodes.slice(0, 8),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[api/ai-vision-scan] error:', msg);
      res.status(502).json({
        error: 'VISION_SCAN_FAILED',
        recognized_item: '',
        matched_data: null,
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
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

createApp();
