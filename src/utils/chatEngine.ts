import { getItemCode, hasCellValue, hasUseToday, isEmptyCell } from '../data/foodData';
import type { AiChatTurn, FoodItem, Lang } from '../types';

export type ChatIntentType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'AMBIGUOUS';

export interface ChatPaginationState {
  codes: string[];
  offset: number;
  headingPrefix: string;
  includeDisclaimer: boolean;
  includeDisplayLine: boolean;
  emptyNoteText: string;
}

export interface PendingDisambiguation {
  type: 'bo' | 'dua';
}

export interface ChatEngineResult {
  handled: boolean;
  intent: ChatIntentType;
  reply: string;
  matchedCodes: string[];
  nextPagination: ChatPaginationState | null;
  nextDisambiguation: PendingDisambiguation | null;
  detectedLang: Lang;
  extractedKeyword: string;
}

const LEGAL_FOOTER: Record<Lang, string> = {
  VI: 'Bản trích lục không thay thế văn bản gốc. Khi có mâu thuẫn, ưu tiên văn bản gốc và khuyến cáo NSX trên bao bì.',
  EN: 'This excerpt does not replace the original document. In case of conflict, the issued original document and manufacturer packaging guidelines prevail.',
  KO: '본 발췌문은 원본 문서를 대체하지 않습니다. 상충 시 발행된 원본 문서 및 포장의 제조사 권장 사항을 우선합니다.',
  HI: 'यह अंश मूल दस्तावेज़ का स्थान नहीं लेता है। विरोधाभास की स्थिति में, मूल दस्तावेज़ और पैकेजिंग पर निर्माता के निर्देश मान्य होंगे।',
};

export const OUT_OF_SCOPE_MSG: Record<Lang, string> = {
  VI: 'Câu này ngoài dữ liệu hệ thống, vui lòng liên hệ Quản lý trực tiếp để được hướng dẫn.',
  EN: 'This question is outside the system database; please contact your direct Manager for guidance.',
  KO: '이 질문은 시스템 데이터 범위를 벗어났습니다. 담당 관리자에게 직접 문의해 주세요.',
  HI: 'यह प्रश्न सिस्टम डेटा से बाहर है, कृपया मार्गदर्शन के लिए अपने सीधे प्रबंधक से संपर्क करें।',
};

const SYNONYM_PHRASES: Array<[RegExp, string]> = [
  [/\bbanh\s*m[iy]\b/g, 'banh mi'],
  [/\bso[\s-]*co[\s-]*la\b|\bsocola\b|\bchocolate\b|\bchocolat\b|\bchoco\b|\bcacao\b|\bcocoa\b/g, 'socola'],
  [/\bpho[\s-]*mai\b|\bphomai\b|\bphomat\b|\bcheese\b|\bmascarpone\b|\bcheddar\b|\bmozzarell?a\b|\bparmesan\b/g, 'phomai'],
  [/\bmilk\b/g, 'sua'],
  [/\bcondensed\s+milk\b/g, 'sua dac'],
  [/\bfresh\s+milk\b/g, 'sua tuoi'],
  [/\bcroissant\b/g, 'sung bo'],
  [/\bbread\b|\bbaguette\b/g, 'banh mi'],
  [/\bpastry\b|\bpastries\b|\bcake\b/g, 'banh ngot'],
  [/\bice\s*cream\b|\bgelato\b/g, 'kem'],
  [/\bwhipping(\s+cream)?\b/g, 'kem whipping'],
  [/\bsalmon\b/g, 'ca hoi'],
  [/\bseafood\b/g, 'hai san'],
  [/\bchicken\b/g, 'thit ga'],
  [/\bpork\b/g, 'thit heo'],
  [/\bsyrup\b/g, 'siro'],
  [/\bcoffee\b|\bcafe\b/g, 'ca phe'],
  [/\begg(s)?\b/g, 'trung'],
  [/\bsugar\b/g, 'duong'],
  [/\bjam\b/g, 'mut'],
  [/\bflour\b/g, 'bot'],
  [/\byogurt\b|\byoghurt\b/g, 'sua chua'],
  [/\btu\s*lanh\b|\btu\s*mat\b|\bkho\s*lanh\b|\bkho\s*mat\b|\bde\s*lanh\b|\bde\s*mat\b|\bbao\s*quan\s*lanh\b|\bbao\s*quan\s*mat\b|\b1\s*-\s*4\s*(?:do\s*c|c|°c)?\b|\b0\s*-\s*4\s*(?:do\s*c|c|°c)?\b|\bfridge\b|\bchilled\b|\bcooler\b/g, ' __COL_COOL__ '],
  [/\btu\s*dong\b|\bkho\s*dong\b|\bcap\s*dong\b|\bdo\s*dong\b|\bde\s*dong\b|\bbao\s*quan\s*dong\b|\b-?\s*18\s*(?:do\s*c|c|°c)?\b|\bfreezer\b|\bfrozen\b/g, ' __COL_FREEZE__ '],
  [/\bnhiet\s*do\s*phong\b|\bo\s*phong\b|\bnhiet\s*phong\b|\bnhiet\s*thuong\b|\bthuong\s*nhiet\b|\bde\s*ngoai\b|\broom\s*temp(?:erature)?\b|\bambient\b/g, ' __COL_ROOM__ '],
  [/\btrung\s*bay\s*nong\b|\bhot\s*display\b|\b30\s*-\s*40\b/g, ' __COL_DHOT__ '],
  [/\btrung\s*bay\s*lanh\b|\bcold\s*display\b/g, ' __COL_DCOOL__ '],
  [/\bdung\s*trong\s*ngay\b|\bsu\s*dung\s*trong\s*ngay\b|\btrong\s*ngay\b|\buse\s*(?:within\s*)?today\b/g, ' __COL_TODAY__ '],
];

const NOISE_PHRASES: RegExp[] = [
  /\bcho\s+toi\s+biet\b/g,
  /\bcho\s+minh\s+hoi\b/g,
  /\bcho\s+em\s+hoi\b/g,
  /\bxin\s+hoi\b/g,
  /\bgiup\s+toi\b/g,
  /\bnhiet\s+do\s+bao\s+quan\b/g,
  /\bthoi\s+han\s+su\s+dung\b/g,
  /\bhan\s+su\s+dung\b/g,
  /\bbao\s+quan\s+o\b/g,
  /\bbao\s+quan\b/g,
  /\bnhiet\s+do\s+bao\s+nhieu\b/g,
  /\bo\s+nhiet\s+do\b/g,
  /\bnhiet\s+do\b/g,
  /\bco\s+bao\s+nhieu\b/g,
  /\bbao\s+nhieu\b/g,
  /\bduoc\s+may\s+ngay\b/g,
  /\bduoc\s+bao\s+lau\b/g,
  /\bbao\s+lau\b/g,
  /\bmay\s+ngay\b/g,
  /\bmay\s+gio\b/g,
  /\bmay\s+thang\b/g,
  /\bnhu\s+the\s+nao\b/g,
  /\bthe\s+nao\b/g,
  /\bra\s+sao\b/g,
  /\bla\s+gi\b/g,
  /\bluu\s+tru\b/g,
  /\bsan\s+pham\b/g,
  /\bnhung\s+mon\s+nao\b/g,
  /\bcac\s+mon\b/g,
  /\bnhung\s+mon\b/g,
  /\bmon\s+nao\b/g,
  /\bco\s+the\b/g,
  /\bco\s+may\b/g,
  /\bliet\s+ke\b/g,
  /\bdanh\s+sach\b/g,
  /\bsau\s+khi\s+mo\s*(?:nap|hop|bao\s*bi)?\b/g,
  /\bsau\s+mo\b/g,
  /\bchua\s+mo\b/g,
  /\bmo\s+hop\b/g,
  /\bmo\s+nap\b/g,
  /\bde\s+duoc\b/g,
  /\bo\s+dau\b/g,
  /\btrung\s+bay\b/g,
  /\bhow\s+long\b/g,
  /\bhow\s+many\b/g,
  /\bhow\s+should\b/g,
  /\bwhat\s+temperature\b/g,
  /\bshelf\s+life\b/g,
  /\bcan\s+be\s+stored\b/g,
  /\bkept\s+in\b/g,
  /\bstored\s+at\b/g,
  /\bstored\s+in\b/g,
];

const NOISE_WORDS = new Set([
  'tim', 'kiem', 'hoi', 'xem', 'cho', 'toi', 'minh', 'em', 'anh', 'chi', 'ban',
  'la', 'gi', 'co', 'khong', 'duoc', 'de', 'o', 'tai', 'trong', 'ngoai', 'khi',
  'va', 'hay', 'hoac', 'voi', 'cua', 've', 'thi', 'sao', 'nay', 'kia', 'do',
  'mon', 'loai', 'cai', 'nhung', 'cac', 'nhieu', 'may', 'ngay', 'gio', 'thang',
  'tuan', 'nam', 'nha', 'nhe', 'a', 'hsd', 'temp', 'temperature', 'storage',
  'store', 'stored', 'keep', 'kept', 'item', 'items', 'product', 'products',
  'what', 'which', 'how', 'are', 'is', 'in', 'on', 'at', 'for', 'the', 'be',
  'can', 'do', 'does', 'days', 'hours', 'months',
]);

export function normVN(s: string): string {
  let out = (s || '')
    .toLowerCase()
    .replace(/(^|[^\p{L}])m[ỳýỷỹỵ](?=$|[^\p{L}])/gu, '$1mi')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bpl\s*([123])\s*[-_\s]*0*(\d{1,2})\b/g, (_, a, n) => `pl${a}-${String(Number(n)).padStart(2, '0')}`)
    .replace(/([a-z])-([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9\s\-_°≤≥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, replacement] of SYNONYM_PHRASES) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function normNameForCompare(s: string): string {
  return normVN(s)
    .replace(/__col_[a-z]+__/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasUnicodeWord(raw: string, wordWithAccent: string): boolean {
  try {
    return new RegExp(`(^|[^\\p{L}])${wordWithAccent}(?=$|[^\\p{L}])`, 'iu').test(raw);
  } catch {
    return raw.toLowerCase().includes(wordWithAccent.toLowerCase());
  }
}

export function detectQuestionLang(question: string, uiLang: Lang): Lang {
  if (/[\uAC00-\uD7AF]/.test(question)) return 'KO';
  if (/[\u0900-\u097F]/.test(question)) return 'HI';
  const hasViDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(question);
  if (hasViDiacritics) return 'VI';
  const lower = question.toLowerCase();
  if (
    /\b(how|what|which|many|long|compare|between|store|stored|storage|fridge|freezer|room|bread|milk|butter|beef|show\s+more|first|second|next)\b/.test(
      lower
    )
  ) {
    return 'EN';
  }
  if (
    /\b(banh|sua|thit|bo|dua|bao|nhiet|nhieu|mon|xem|them|dong|mat|lanh|phong|sanh|lau|ngay|gio|pl[123])\b/.test(
      lower
    )
  ) {
    return 'VI';
  }
  return uiLang;
}

function extractCleanKeyword(rawQuestion: string): {
  cleaned: string;
  tokens: string[];
  colFilter: 'room' | 'cool' | 'freeze' | 'displayHot' | 'displayCool' | 'today' | null;
  asksDisplay: boolean;
} {
  let text = normVN(rawQuestion);
  const asksDisplay =
    text.includes('__COL_DHOT__') ||
    text.includes('__COL_DCOOL__') ||
    /\btrung\s*bay\b|\bdisplay\b/.test(
      rawQuestion
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
    );

  let colFilter: 'room' | 'cool' | 'freeze' | 'displayHot' | 'displayCool' | 'today' | null = null;
  if (text.includes('__COL_ROOM__')) colFilter = 'room';
  else if (text.includes('__COL_COOL__')) colFilter = 'cool';
  else if (text.includes('__COL_FREEZE__')) colFilter = 'freeze';
  else if (text.includes('__COL_DHOT__')) colFilter = 'displayHot';
  else if (text.includes('__COL_DCOOL__')) colFilter = 'displayCool';
  else if (text.includes('__COL_TODAY__')) colFilter = 'today';

  text = text.replace(/__col_[a-z]+__/gi, ' ');
  for (const np of NOISE_PHRASES) {
    text = text.replace(np, ' ');
  }

  const rawTokens = text
    .split(/[\s,.;:!?()[\]{}"'\/\\|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !NOISE_WORDS.has(t));

  const cleaned = rawTokens.join(' ').trim();
  return { cleaned, tokens: rawTokens, colFilter, asksDisplay };
}

function formatSingleItemBlock(item: FoodItem, asksDisplay: boolean): string {
  const code = getItemCode(item);
  const room = hasCellValue(item.room) ? item.room : '—';
  const cool = hasCellValue(item.cool) ? item.cool : '—';
  const freeze = hasCellValue(item.freeze) ? item.freeze : '—';
  const note = isEmptyCell(item.note) ? '—' : item.note;

  const lines = [
    `- [${code}] ${item.name}`,
    `  Nhiệt độ phòng: ${room} | 1-4°C: ${cool} | ≤ -18°C: ${freeze} | Ghi chú: ${note}`,
  ];

  if (item.a === 'PL3' && asksDisplay) {
    const dc = item.displayCool && !isEmptyCell(item.displayCool) ? item.displayCool : '—';
    const dh = item.displayHot && !isEmptyCell(item.displayHot) ? item.displayHot : '—';
    lines.push(`  Tủ trưng bày lạnh: ${dc} | Tủ trưng bày nóng: ${dh}`);
  }
  return lines.join('\n');
}

function formatLocalizedItemBlock(item: FoodItem, lang: Lang, asksDisplay: boolean): string {
  if (lang === 'VI') {
    return formatSingleItemBlock(item, asksDisplay);
  }
  const code = getItemCode(item);
  const room = hasCellValue(item.room) ? item.room : '—';
  const cool = hasCellValue(item.cool) ? item.cool : '—';
  const freeze = hasCellValue(item.freeze) ? item.freeze : '—';
  const note = isEmptyCell(item.note) ? '—' : item.note;

  const lbl =
    lang === 'EN'
      ? { r: 'Room temp', c: '1-4°C', f: '≤ -18°C', n: 'Note', dc: 'Cold display', dh: 'Hot display' }
      : lang === 'KO'
        ? { r: '상온', c: '1-4°C', f: '≤ -18°C', n: '비고', dc: '전시 냉장', dh: '전시 온장' }
        : { r: 'कमरे का तापमान', c: '1-4°C', f: '≤ -18°C', n: 'नोट', dc: 'कोल्ड डिस्प्ले', dh: 'हॉट डिस्प्ले' };

  const lines = [
    `- [${code}] ${item.name}`,
    `  ${lbl.r}: ${room} | ${lbl.c}: ${cool} | ${lbl.f}: ${freeze} | ${lbl.n}: ${note}`,
  ];
  if (item.a === 'PL3' && asksDisplay) {
    const dc = item.displayCool && !isEmptyCell(item.displayCool) ? item.displayCool : '—';
    const dh = item.displayHot && !isEmptyCell(item.displayHot) ? item.displayHot : '—';
    lines.push(`  ${lbl.dc}: ${dc} | ${lbl.dh}: ${dh}`);
  }
  return lines.join('\n');
}

export function formatPaginatedReply(
  itemsMap: Map<string, FoodItem>,
  pagination: ChatPaginationState,
  lang: Lang
): { reply: string; pageCodes: string[]; nextPagination: ChatPaginationState | null } {
  const pageSize = 5;
  const sliceCodes = pagination.codes.slice(pagination.offset, pagination.offset + pageSize);
  const blocks = sliceCodes
    .map((code) => itemsMap.get(code))
    .filter((it): it is FoodItem => Boolean(it))
    .map((it) => formatLocalizedItemBlock(it, lang, pagination.includeDisplayLine));

  const nextOffset = pagination.offset + sliceCodes.length;
  const remaining = pagination.codes.length - nextOffset;

  const morePrompt =
    remaining > 0
      ? lang === 'EN'
        ? `${remaining} more items remaining, type 'see more' (or 'xem thêm').`
        : lang === 'KO'
          ? `${remaining}개 항목이 더 있습니다. '더 보기'(또는 'xem thêm')를 입력하세요.`
          : lang === 'HI'
            ? `${remaining} और आइटम शेष हैं, 'और देखें' (या 'xem thêm') टाइप करें।`
            : `Còn ${remaining} món nữa, gõ 'xem thêm'.`
      : '';

  const parts: string[] = [];
  if (pagination.offset === 0) {
    parts.push(pagination.headingPrefix);
  } else {
    const contLabel =
      lang === 'EN'
        ? `Showing next ${sliceCodes.length} items (${pagination.offset + 1}–${nextOffset}/${pagination.codes.length}):`
        : lang === 'KO'
          ? `다음 ${sliceCodes.length}개 항목 (${pagination.offset + 1}–${nextOffset}/${pagination.codes.length}):`
          : lang === 'HI'
            ? `अगले ${sliceCodes.length} आइटम (${pagination.offset + 1}–${nextOffset}/${pagination.codes.length}):`
            : `Tiếp theo (${pagination.offset + 1}–${nextOffset}/${pagination.codes.length} món):`;
    parts.push(contLabel);
  }

  parts.push(blocks.join('\n\n'));
  if (morePrompt) parts.push(morePrompt);
  if (pagination.includeDisclaimer) parts.push(LEGAL_FOOTER[lang]);

  return {
    reply: parts.join('\n\n'),
    pageCodes: sliceCodes,
    nextPagination: remaining > 0 ? { ...pagination, offset: nextOffset } : null,
  };
}

function parseMaxDurationHours(val: string): number {
  if (!hasCellValue(val)) return 0;
  const rawNorm = normVN(val);
  if (rawNorm.includes('__COL_TODAY__') || rawNorm.includes('trong ngay')) return 24;
  const s = normNameForCompare(val);
  if (s.includes('nsx')) return 24 * 365;
  let maxHours = 0;
  const matches = s.matchAll(/(\d+(?:[.,]\d+)?)\s*(tieng|gio|h|ngay|day|days|tuan|week|thang|month|nam|year)/g);
  for (const m of matches) {
    const num = Number(m[1].replace(',', '.'));
    if (!Number.isFinite(num)) continue;
    const unit = m[2];
    let hours = num;
    if (unit === 'ngay' || unit.startsWith('day')) hours = num * 24;
    else if (unit === 'tuan' || unit === 'week') hours = num * 24 * 7;
    else if (unit === 'thang' || unit.startsWith('month')) hours = num * 24 * 30;
    else if (unit === 'nam' || unit === 'year') hours = num * 24 * 365;
    if (hours > maxHours) maxHours = hours;
  }
  return maxHours;
}

function getStrictDairyMeatFlags(rawQuestion: string) {
  const hasButterAccent = hasUnicodeWord(rawQuestion, 'bơ');
  const hasBeefAccent = hasUnicodeWord(rawQuestion, 'bò');
  const hasPineappleAccent = hasUnicodeWord(rawQuestion, 'dứa');
  const hasCoconutAccent = hasUnicodeWord(rawQuestion, 'dừa');

  const noAccent = rawQuestion
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  const hasBareBo =
    !hasButterAccent &&
    !hasBeefAccent &&
    /\bbo\b/.test(noAccent) &&
    !/\bsung\s+bo\b|\bbo\s+toi\b|\bbo\s+dau\s+phong\b|\bthit\s+bo\b|\bsot\s+thit\s+bo\b|\bsot\s+bo\b/.test(noAccent);

  const hasBareDua =
    !hasPineappleAccent &&
    !hasCoconutAccent &&
    /\bdua\b/.test(noAccent) &&
    !/\bcot\s+dua\b|\bkem\s+dua\b|\bdua\s+hau\b/.test(noAccent);

  return {
    hasButterAccent,
    hasBeefAccent,
    hasPineappleAccent,
    hasCoconutAccent,
    hasBareBo,
    hasBareDua,
  };
}

function violatesStrictDiacriticFilter(
  item: FoodItem,
  flags: ReturnType<typeof getStrictDairyMeatFlags>
): boolean {
  const text = `${item.name} ${item.g}`;
  if (flags.hasButterAccent && hasUnicodeWord(text, 'bò') && !hasUnicodeWord(item.name, 'bơ')) {
    return true;
  }
  if (flags.hasBeefAccent && hasUnicodeWord(item.name, 'bơ') && !hasUnicodeWord(item.name, 'bò')) {
    return true;
  }
  if (flags.hasPineappleAccent && hasUnicodeWord(text, 'dừa') && !hasUnicodeWord(text, 'dứa')) {
    return true;
  }
  if (flags.hasCoconutAccent && hasUnicodeWord(text, 'dứa') && !hasUnicodeWord(text, 'dừa')) {
    return true;
  }
  return false;
}

function scoreItemsForKeyword(
  items: FoodItem[],
  cleanedKeyword: string,
  tokens: string[],
  rawQuestion: string
): Array<{ item: FoodItem; score: number }> {
  if (!cleanedKeyword || tokens.length === 0) return [];

  const flags = getStrictDairyMeatFlags(rawQuestion);
  const scored: Array<{ item: FoodItem; score: number }> = [];

  for (const item of items) {
    if (violatesStrictDiacriticFilter(item, flags)) continue;

    // Additional strict exclusion when user explicitly typed "bơ" / "bò" / "dứa" / "dừa"
    if (
      flags.hasButterAccent &&
      !hasUnicodeWord(item.name, 'bơ') &&
      !hasUnicodeWord(item.name, 'butter')
    ) {
      continue;
    }
    if (flags.hasBeefAccent && !hasUnicodeWord(item.name, 'bò')) {
      continue;
    }
    if (flags.hasPineappleAccent && !hasUnicodeWord(item.name, 'dứa')) {
      continue;
    }
    if (flags.hasCoconutAccent && !hasUnicodeWord(item.name, 'dừa')) {
      continue;
    }

    const nameNorm = normNameForCompare(item.name);
    const enNorm = normNameForCompare(item.enName || '');
    const groupNorm = normNameForCompare(item.g);
    const fullPool = `${nameNorm} ${enNorm} ${groupNorm}`.trim();
    const fullTokens = fullPool.split(/\s+/).filter(Boolean);

    let score = 0;

    if (nameNorm === cleanedKeyword) {
      score += 500;
    } else if (nameNorm === `cac loai ${cleanedKeyword}`) {
      score += 420;
    } else if (nameNorm.includes(cleanedKeyword)) {
      score += 320;
    } else if (enNorm && enNorm.includes(cleanedKeyword)) {
      score += 270;
    } else if (groupNorm.includes(cleanedKeyword)) {
      score += 210;
    } else {
      const nameTokenList = nameNorm.split(/\s+/).filter(Boolean);
      const enTokenList = enNorm.split(/\s+/).filter(Boolean);
      const tokenMatchesWord = (word: string, tk: string) =>
        word === tk || (tk.length >= 4 && word.startsWith(tk));
      const nameHits = tokens.filter((tk) =>
        nameTokenList.some((nt) => tokenMatchesWord(nt, tk))
      ).length;
      const allPoolHits = tokens.filter((tk) =>
        fullTokens.some((ft) => tokenMatchesWord(ft, tk))
      ).length;

      if (nameHits === tokens.length) {
        score += 240;
      } else if (allPoolHits === tokens.length) {
        score += 180;
      } else if (
        tokens.length === 1 &&
        tokens[0].length >= 2 &&
        enTokenList.some((et) => et === tokens[0])
      ) {
        score += 170;
      }
    }

    if (score > 0) {
      // Tie-breaker: PL1 before PL2 before PL3, mild preference for concise names
      const appendixBonus = item.a === 'PL1' ? 30 : item.a === 'PL2' ? 20 : 10;
      const lengthBonus = Math.max(0, 8 - Math.floor(item.name.length / 15));
      scored.push({ item, score: score + appendixBonus + lengthBonus });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.a !== b.item.a) return a.item.a < b.item.a ? -1 : 1;
    return a.item.n - b.item.n;
  });

  return scored;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

export function findNearestItemsAndGroups(
  items: FoodItem[],
  cleanedKeyword: string,
  tokens: string[]
): { nearestItems: FoodItem[]; nearestGroups: string[]; hasStrongFoodSimilarity: boolean } {
  if (!cleanedKeyword || tokens.length === 0) {
    return { nearestItems: [], nearestGroups: [], hasStrongFoodSimilarity: false };
  }

  const scored: Array<{ item: FoodItem; sim: number }> = [];
  for (const item of items) {
    const nameNorm = normNameForCompare(item.name);
    const enNorm = normNameForCompare(item.enName || '');
    const groupNorm = normNameForCompare(item.g);
    const nameWords = nameNorm.split(/\s+/).filter(Boolean);
    const poolWords = `${nameNorm} ${enNorm} ${groupNorm}`.split(/\s+/).filter(Boolean);

    let sim = 0;
    for (const qt of tokens) {
      if (qt.length < 2) continue;
      let bestWordSim = 0;
      for (const pw of poolWords) {
        const inName = nameWords.includes(pw);
        const weightBonus = inName ? 10 : 0;
        if (pw === qt) {
          bestWordSim = Math.max(bestWordSim, 100 + weightBonus);
        } else if (
          Math.min(pw.length, qt.length) >= 4 &&
          (pw.startsWith(qt) || qt.startsWith(pw))
        ) {
          bestWordSim = Math.max(bestWordSim, 70 + weightBonus);
        } else if (Math.min(pw.length, qt.length) >= 4 && Math.abs(pw.length - qt.length) <= 1) {
          const d = levenshtein(qt, pw);
          if (d === 1) bestWordSim = Math.max(bestWordSim, 55 + weightBonus);
        }
      }
      sim += bestWordSim;
    }

    if (sim > 0) {
      scored.push({ item, sim });
    }
  }

  scored.sort((a, b) => {
    if (b.sim !== a.sim) return b.sim - a.sim;
    return a.item.a === b.item.a ? a.item.n - b.item.n : a.item.a < b.item.a ? -1 : 1;
  });

  const nearestItems = scored.slice(0, 3).map((x) => x.item);
  const groupSet = new Set<string>();
  for (const s of scored) {
    if (s.item.g) groupSet.add(s.item.g);
    if (groupSet.size >= 2) break;
  }

  const topSim = scored[0]?.sim ?? 0;
  return {
    nearestItems,
    nearestGroups: Array.from(groupSet),
    hasStrongFoodSimilarity: topSim >= 70,
  };
}

function buildDisambiguationReply(
  type: 'bo' | 'dua',
  items: FoodItem[],
  lang: Lang
): { reply: string; matchedCodes: string[] } {
  if (type === 'bo') {
    const butterItems = items
      .filter((it) => hasUnicodeWord(it.name, 'bơ') || hasUnicodeWord(it.name, 'butter'))
      .slice(0, 4);
    const beefItems = items
      .filter((it) => hasUnicodeWord(it.name, 'bò') && !normNameForCompare(it.name).includes('sung bo'))
      .slice(0, 4);

    const codes = [...butterItems, ...beefItems].map(getItemCode);
    const butterLines = butterItems.map((it) => `- [${getItemCode(it)}] ${it.name}`).join('\n');
    const beefLines = beefItems.map((it) => `- [${getItemCode(it)}] ${it.name}`).join('\n');

    const header =
      lang === 'EN'
        ? 'Bạn ý là bơ hay bò? (Did you mean Butter "bơ" or Beef "bò"?)'
        : lang === 'KO'
          ? 'Bạn ý là bơ hay bò? (버터 "bơ"와 소고기 "bò" 중 어느 쪽인가요?)'
          : lang === 'HI'
            ? 'Bạn ý là bơ hay bò? (क्या आपका मतलब मक्खन "bơ" है या बीफ़ "bò"?)'
            : 'Bạn ý là bơ hay bò?';

    const footer =
      lang === 'EN'
        ? 'Please type "bơ" or "bò" (or item code PLx-xx) to view exact storage details.'
        : lang === 'KO'
          ? '정확한 보관 기준을 보려면 "bơ" 또는 "bò"(또는 코드 PLx-xx)를 입력해 주세요.'
          : lang === 'HI'
            ? 'सही भंडारण नियम देखने के लिए कृपया "bơ" या "bò" (या कोड PLx-xx) टाइप करें।'
            : 'Vui lòng gõ rõ có dấu "bơ" hoặc "bò" (hoặc chọn mã PLx-xx) để xem chi tiết nhiệt độ bảo quản!';

    return {
      reply: `${header}\n\n1. Bơ (Butter):\n${butterLines}\n\n2. Bò (Thịt bò):\n${beefLines}\n\n${footer}`,
      matchedCodes: codes,
    };
  }

  const pineappleItems = items.filter((it) => hasUnicodeWord(it.name, 'dứa')).slice(0, 4);
  const coconutItems = items.filter((it) => hasUnicodeWord(it.name, 'dừa')).slice(0, 4);
  const codes = [...pineappleItems, ...coconutItems].map(getItemCode);

  const pLines = pineappleItems.map((it) => `- [${getItemCode(it)}] ${it.name}`).join('\n');
  const cLines = coconutItems.map((it) => `- [${getItemCode(it)}] ${it.name}`).join('\n');

  const header =
    lang === 'EN'
      ? 'Bạn ý là dứa hay dừa? (Did you mean Pineapple "dứa" or Coconut "dừa"?)'
      : 'Bạn ý là dứa hay dừa?';
  const footer =
    lang === 'EN'
      ? 'Please type "dứa" or "dừa" (or item code PLx-xx) to view exact storage details.'
      : 'Vui lòng gõ rõ có dấu "dứa" hoặc "dừa" (hoặc chọn mã PLx-xx) để xem chi tiết!';

  return {
    reply: `${header}\n\n1. Dứa (Pineapple):\n${pLines}\n\n2. Dừa (Coconut):\n${cLines}\n\n${footer}`,
    matchedCodes: codes,
  };
}

export function resolveChatQueryLocally(
  rawQuestion: string,
  items: FoodItem[],
  uiLang: Lang,
  pagination: ChatPaginationState | null,
  pendingDisambiguation: PendingDisambiguation | null,
  turns: AiChatTurn[]
): ChatEngineResult {
  const question = rawQuestion.trim();
  const lang = detectQuestionLang(question, uiLang);
  const itemsMap = new Map(items.map((it) => [getItemCode(it).toUpperCase(), it]));
  const normQ = normVN(question);

  // 0. Resolve follow-up after ambiguity prompt ("bơ", "bò", "1", "2")
  if (pendingDisambiguation) {
    if (normQ === '1' || normQ === 'so 1' || normQ === 'thu 1') {
      return resolveChatQueryLocally(
        pendingDisambiguation.type === 'bo' ? 'bơ' : 'dứa',
        items,
        lang,
        null,
        null,
        turns
      );
    }
    if (normQ === '2' || normQ === 'so 2' || normQ === 'thu 2') {
      return resolveChatQueryLocally(
        pendingDisambiguation.type === 'bo' ? 'bò' : 'dừa',
        items,
        lang,
        null,
        null,
        turns
      );
    }
  }

  // 1. Type E1: Pagination ("xem thêm", "tiep", "more", "next")
  if (
    pagination &&
    /^(xem\s+them|them|tiep|tiep\s+tuc|more|see\s+more|show\s+more|next|더\s*보기|और\s*देखें)$/.test(
      normQ
    )
  ) {
    const page = formatPaginatedReply(itemsMap, pagination, lang);
    return {
      handled: true,
      intent: 'E',
      reply: page.reply,
      matchedCodes: page.pageCodes,
      nextPagination: page.nextPagination,
      nextDisambiguation: null,
      detectedLang: lang,
      extractedKeyword: '',
    };
  }

  // 2. Type D: Direct Item Code Lookup (e.g., "PL1-03", "pl1 03", "mã PL2-08 bảo quản sao")
  const codeMatch = normQ.match(/\bpl([123])-(\d{2})\b/);
  if (codeMatch) {
    const targetCode = `PL${codeMatch[1]}-${codeMatch[2]}`;
    const exactItem = itemsMap.get(targetCode);
    const { asksDisplay } = extractCleanKeyword(question);
    if (exactItem) {
      const heading =
        lang === 'EN'
          ? `Found 1 item matching '${targetCode}':`
          : lang === 'KO'
            ? `'${targetCode}' 항목 1건 조회:`
            : lang === 'HI'
              ? `'${targetCode}' के लिए 1 आइटम मिला:`
              : `Tìm thấy 1 món liên quan đến '${targetCode}':`;
      return {
        handled: true,
        intent: 'D',
        reply: `${heading}\n\n${formatLocalizedItemBlock(exactItem, lang, asksDisplay || exactItem.a === 'PL3')}\n\n${LEGAL_FOOTER[lang]}`,
        matchedCodes: [targetCode],
        nextPagination: null,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: targetCode,
      };
    }
  }

  // 3. Strict Ambiguity Check ("bo" / "dua" without accents)
  const flags = getStrictDairyMeatFlags(question);
  if (flags.hasBareBo) {
    const disamb = buildDisambiguationReply('bo', items, lang);
    return {
      handled: true,
      intent: 'AMBIGUOUS',
      reply: disamb.reply,
      matchedCodes: disamb.matchedCodes,
      nextPagination: null,
      nextDisambiguation: { type: 'bo' },
      detectedLang: lang,
      extractedKeyword: 'bo',
    };
  }
  if (flags.hasBareDua) {
    const disamb = buildDisambiguationReply('dua', items, lang);
    return {
      handled: true,
      intent: 'AMBIGUOUS',
      reply: disamb.reply,
      matchedCodes: disamb.matchedCodes,
      nextPagination: null,
      nextDisambiguation: { type: 'dua' },
      detectedLang: lang,
      extractedKeyword: 'dua',
    };
  }

  // 4. Type E2: Conversational Follow-up ("món đầu tiên", "cái thứ 2", "còn món kia thì sao")
  const recentAssistantWithCodes = [...turns]
    .reverse()
    .find((t) => t.role === 'assistant' && t.matchedCodes && t.matchedCodes.length > 0);
  const isOrdinalOrPronounRef =
    /\b(mon\s+dau(\s+tien)?|cai\s+dau(\s+tien)?|dau\s+tien|thu\s*[12345]|mon\s+kia|cai\s+kia|mon\s+cuoi|vua\s+roi|vua\s+nay|cai\s+do|mon\s+do|no\s+bao\s+quan|first\s+one|second\s+one|third\s+one|that\s+item)\b/.test(
      normQ
    );

  if (recentAssistantWithCodes && isOrdinalOrPronounRef) {
    const prevCodes = recentAssistantWithCodes.matchedCodes || [];
    let targetIdx = 0;
    if (/\b(thu\s*2|second|mon\s+kia|cai\s+kia)\b/.test(normQ)) targetIdx = Math.min(1, prevCodes.length - 1);
    else if (/\b(thu\s*3|third)\b/.test(normQ)) targetIdx = Math.min(2, prevCodes.length - 1);
    else if (/\bthu\s*4\b/.test(normQ)) targetIdx = Math.min(3, prevCodes.length - 1);
    else if (/\bthu\s*5\b/.test(normQ)) targetIdx = Math.min(4, prevCodes.length - 1);
    else if (/\bmon\s+cuoi\b/.test(normQ)) targetIdx = prevCodes.length - 1;

    const chosenCode = prevCodes[targetIdx];
    const chosenItem = chosenCode ? itemsMap.get(chosenCode.toUpperCase()) : undefined;
    if (chosenItem) {
      const heading =
        lang === 'EN'
          ? `Details for [${getItemCode(chosenItem)}] ${chosenItem.name}:`
          : `Chi tiết món bạn đang hỏi (${targetIdx + 1}/${prevCodes.length}):`;
      return {
        handled: true,
        intent: 'E',
        reply: `${heading}\n\n${formatLocalizedItemBlock(chosenItem, lang, chosenItem.a === 'PL3')}\n\n${LEGAL_FOOTER[lang]}`,
        matchedCodes: [getItemCode(chosenItem)],
        nextPagination: null,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: chosenItem.name,
      };
    }
  }

  // 5. Type C: Comparison Query ("bánh mì với bánh ngọt cái nào để lâu hơn", "so sánh A và B")
  const isCompareIntent =
    /\b(so\s+sanh|cai\s+nao\s+de\s+lau\s+hon|nao\s+de\s+lau\s+hon|de\s+lau\s+hon|lau\s+hon|compare|longer)\b/.test(
      normQ
    );
  if (isCompareIntent) {
    const compareCleaned = question
      .replace(/so\s*sánh|cái\s*nào\s*(để\s*)?lâu\s*hơn|nào\s*(để\s*)?lâu\s*hơn|để\s*lâu\s*hơn|lâu\s*hơn|compare|which\s+lasts\s+longer/gi, '')
      .trim();
    const halves = compareCleaned
      .split(/\s+(?:với|và|hay|vs\.?|versus|and|or)\s+|[,/]/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);

    if (halves.length >= 2) {
      const leftExt = extractCleanKeyword(halves[0]);
      const rightExt = extractCleanKeyword(halves[1]);
      const leftHits = scoreItemsForKeyword(items, leftExt.cleaned, leftExt.tokens, halves[0]);
      const rightHits = scoreItemsForKeyword(items, rightExt.cleaned, rightExt.tokens, halves[1]);

      if (leftHits.length > 0 && rightHits.length > 0) {
        const leftItem = leftHits[0].item;
        const rightItem = rightHits[0].item;
        const leftCode = getItemCode(leftItem);
        const rightCode = getItemCode(rightItem);

        const lRoom = hasCellValue(leftItem.room) ? leftItem.room : '—';
        const lCool = hasCellValue(leftItem.cool) ? leftItem.cool : '—';
        const lFreeze = hasCellValue(leftItem.freeze) ? leftItem.freeze : '—';

        const rRoom = hasCellValue(rightItem.room) ? rightItem.room : '—';
        const rCool = hasCellValue(rightItem.cool) ? rightItem.cool : '—';
        const rFreeze = hasCellValue(rightItem.freeze) ? rightItem.freeze : '—';

        const leftMax = Math.max(
          parseMaxDurationHours(leftItem.room),
          parseMaxDurationHours(leftItem.cool),
          parseMaxDurationHours(leftItem.freeze)
        );
        const rightMax = Math.max(
          parseMaxDurationHours(rightItem.room),
          parseMaxDurationHours(rightItem.cool),
          parseMaxDurationHours(rightItem.freeze)
        );

        const colCompare = (label: string, v1: string, v2: string) => {
          const h1 = parseMaxDurationHours(v1);
          const h2 = parseMaxDurationHours(v2);
          if (h1 === 0 && h2 === 0) return `• ${label}: — vs —`;
          if (h1 === h2) return `• ${label}: ${v1} = ${v2}`;
          return h1 > h2
            ? `• ${label}: [${leftCode}] (${v1}) > [${rightCode}] (${v2})`
            : `• ${label}: [${rightCode}] (${v2}) > [${leftCode}] (${v1})`;
        };

        const conclusion =
          lang === 'EN'
            ? leftMax === rightMax
              ? `=> Overall max storage duration is equivalent.`
              : leftMax > rightMax
                ? `=> [${leftCode}] ${leftItem.name} lasts longer overall than [${rightCode}] ${rightItem.name}.`
                : `=> [${rightCode}] ${rightItem.name} lasts longer overall than [${leftCode}] ${leftItem.name}.`
            : leftMax === rightMax
              ? `=> Thời hạn bảo quản tối đa tương đương nhau.`
              : leftMax > rightMax
                ? `=> [${leftCode}] ${leftItem.name} giữ được lâu hơn so với [${rightCode}] ${rightItem.name}.`
                : `=> [${rightCode}] ${rightItem.name} giữ được lâu hơn so với [${leftCode}] ${leftItem.name}.`;

        const compareHeading =
          lang === 'EN'
            ? `Comparison across 3 temperature columns:`
            : lang === 'KO'
              ? `3가지 온도 기준 비교표:`
              : lang === 'HI'
                ? `3 तापमान कॉलम तुलना तालिका:`
                : `Bảng so sánh 3 cột nhiệt độ:`;

        const tableText = [
          `| Sản phẩm | Phòng | 1-4°C | ≤ -18°C |`,
          `| [${leftCode}] ${leftItem.name} | ${lRoom} | ${lCool} | ${lFreeze} |`,
          `| [${rightCode}] ${rightItem.name} | ${rRoom} | ${rCool} | ${rFreeze} |`,
        ].join('\n');

        const summaryCols = [
          colCompare(lang === 'EN' ? 'Room temp' : 'Nhiệt độ phòng', lRoom, rRoom),
          colCompare('1-4°C', lCool, rCool),
          colCompare('≤ -18°C', lFreeze, rFreeze),
        ].join('\n');

        const reply = [
          compareHeading,
          tableText,
          summaryCols,
          conclusion,
          LEGAL_FOOTER[lang],
        ].join('\n\n');

        return {
          handled: true,
          intent: 'C',
          reply,
          matchedCodes: [leftCode, rightCode],
          nextPagination: null,
          nextDisambiguation: null,
          detectedLang: lang,
          extractedKeyword: compareCleaned,
        };
      }
    }
  }

  // Extract normalized keyword & column filter
  const { cleaned, tokens, colFilter, asksDisplay } = extractCleanKeyword(question);

  // Follow-up storage-only question with previous item context (e.g., "còn tủ đông thì sao?" without repeating food name)
  if (!cleaned && colFilter && recentAssistantWithCodes && !/\b(bao\s+nhieu|nhung\s+mon|mon\s+nao|cac\s+mon|liet\s+ke|how\s+many|which)\b/.test(normQ)) {
    const prevItems = (recentAssistantWithCodes.matchedCodes || [])
      .map((c) => itemsMap.get(c.toUpperCase()))
      .filter((it): it is FoodItem => Boolean(it))
      .slice(0, 5);
    if (prevItems.length > 0) {
      const blocks = prevItems.map((it) => formatLocalizedItemBlock(it, lang, asksDisplay || it.a === 'PL3'));
      return {
        handled: true,
        intent: 'E',
        reply: `${blocks.join('\n\n')}\n\n${LEGAL_FOOTER[lang]}`,
        matchedCodes: prevItems.map(getItemCode),
        nextPagination: null,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: prevItems[0].name,
      };
    }
  }

  // 6. Type B: Count / Column Filter (NO leftover food name OR explicit counting phrase)
  const isCountingPhrase = /\b(co\s+bao\s+nhieu|bao\s+nhieu\s+(?:mon|san\s+pham)|co\s+may\s+(?:mon|san\s+pham)|nhung\s+mon\s+nao|mon\s+nao|cac\s+mon|liet\s+ke|danh\s+sach|how\s+many|which\s+items|list\s+all)\b/.test(
    normQ
  );
  if (colFilter && (tokens.length === 0 || isCountingPhrase)) {
    let matched: FoodItem[] = [];
    let condLabel = '';
    if (colFilter === 'room') {
      matched = items.filter((it) => hasCellValue(it.room));
      condLabel =
        lang === 'EN'
          ? 'can be stored at room temperature'
          : lang === 'KO'
            ? '상온 보관이 가능한 항목'
            : lang === 'HI'
              ? 'कमरे के तापमान पर रखे जा सकते हैं'
              : 'để được ở nhiệt độ phòng';
    } else if (colFilter === 'cool') {
      matched = items.filter((it) => hasCellValue(it.cool));
      condLabel =
        lang === 'EN'
          ? 'can be stored chilled (1-4°C)'
          : lang === 'KO'
            ? '냉장(1-4°C) 보관이 가능한 항목'
            : lang === 'HI'
              ? 'फ्रिज (1-4°C) में रखे जा सकते हैं'
              : 'để được ở tủ lạnh / kho mát (1-4°C)';
    } else if (colFilter === 'freeze') {
      matched = items.filter((it) => hasCellValue(it.freeze));
      condLabel =
        lang === 'EN'
          ? 'can be stored frozen (≤ -18°C)'
          : lang === 'KO'
            ? '냉동(≤ -18°C) 보관이 가능한 항목'
            : lang === 'HI'
              ? 'फ़्रीज़र (≤ -18°C) में रखे जा सकते हैं'
              : 'để được ở tủ đông / kho đông (≤ -18°C)';
    } else if (colFilter === 'displayHot') {
      matched = items.filter(
        (it) => Boolean(it.displayHot) && it.displayHot !== '—' && it.displayHot !== '-'
      );
      condLabel = lang === 'EN' ? 'for hot display (30-40°C)' : 'trưng bày nóng (30-40°C)';
    } else if (colFilter === 'displayCool') {
      matched = items.filter(
        (it) => typeof it.displayCool === 'string' && !isEmptyCell(it.displayCool)
      );
      condLabel = lang === 'EN' ? 'for cold display (1-4°C)' : 'trưng bày lạnh (1-4°C)';
    } else if (colFilter === 'today') {
      matched = items.filter((it) => hasUseToday(it));
      condLabel = lang === 'EN' ? 'use within the day' : 'sử dụng trong ngày';
    }

    const codes = matched.map(getItemCode);
    const heading =
      lang === 'EN'
        ? `There are ${matched.length} items that ${condLabel}:`
        : lang === 'KO'
          ? `${condLabel}: 총 ${matched.length}개`
          : lang === 'HI'
            ? `${condLabel} वाले कुल ${matched.length} आइटम हैं:`
            : `Có ${matched.length} món ${condLabel}:`;

    const pagState: ChatPaginationState = {
      codes,
      offset: 0,
      headingPrefix: heading,
      includeDisclaimer: true,
      includeDisplayLine: colFilter === 'displayHot' || colFilter === 'displayCool',
      emptyNoteText: '—',
    };
    const page = formatPaginatedReply(itemsMap, pagState, lang);

    return {
      handled: true,
      intent: 'B',
      reply: page.reply,
      matchedCodes: page.pageCodes,
      nextPagination: page.nextPagination,
      nextDisambiguation: null,
      detectedLang: lang,
      extractedKeyword: condLabel,
    };
  }

  // 7. Type A: Item / Group Search Lookup
  if (cleaned && tokens.length > 0) {
    const scored = scoreItemsForKeyword(items, cleaned, tokens, question);
    if (scored.length > 0) {
      const codes = scored.map((s) => getItemCode(s.item));
      const prettyMap: Record<string, string> = {
        'banh mi': 'bánh mì',
        'banh ngot': 'bánh ngọt',
        'sua dac': 'sữa đặc',
        'sua tuoi': 'sữa tươi',
        'phomai': 'phô mai',
        'socola': 'sô cô la',
        'ca hoi': 'cá hồi',
        'thit bo': 'thịt bò',
        'sung bo': 'bánh sừng bò',
        'nuoc mam': 'nước mắm',
        'hat rang': 'hạt rang',
        'dau hu': 'đậu hũ',
        'trai cay': 'trái cây',
      };
      const displayKw = prettyMap[cleaned] || recoverAccentedPhrase(question, cleaned, tokens);
      const heading =
        lang === 'EN'
          ? `Found ${codes.length} items related to '${displayKw}':`
          : lang === 'KO'
            ? `'${displayKw}' 관련 ${codes.length}개 항목을 찾았습니다:`
            : lang === 'HI'
              ? `'${displayKw}' से संबंधित ${codes.length} आइटम मिले:`
              : `Tìm thấy ${codes.length} món liên quan đến '${displayKw}':`;

      const pagState: ChatPaginationState = {
        codes,
        offset: 0,
        headingPrefix: heading,
        includeDisclaimer: true,
        includeDisplayLine: asksDisplay,
        emptyNoteText: '—',
      };
      const page = formatPaginatedReply(itemsMap, pagState, lang);

      return {
        handled: true,
        intent: 'A',
        reply: page.reply,
        matchedCodes: page.pageCodes,
        nextPagination: page.nextPagination,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: displayKw,
      };
    }
  }

  // Not handled deterministically yet -> let online Gemini AI attempt semantic matching OR fallback to Rule 6 / Type F
  return {
    handled: false,
    intent: 'F',
    reply: '',
    matchedCodes: [],
    nextPagination: null,
    nextDisambiguation: null,
    detectedLang: lang,
    extractedKeyword: cleaned ? recoverAccentedPhrase(question, cleaned, tokens) : question,
  };
}

function recoverAccentedPhrase(rawQuestion: string, cleanedFallback: string, tokens: string[]): string {
  const rawWords = rawQuestion
    .split(/[\s,.;:!?()[\]{}"'\/\\|]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const picked: string[] = [];
  for (const tk of tokens) {
    const found = rawWords.find((rw) => {
      const rwNorm = rw
        .toLowerCase()
        .replace(/đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return rwNorm === tk;
    });
    picked.push(found ? found.toLowerCase() : tk);
  }
  return picked.join(' ').trim() || cleanedFallback;
}

export function buildNotFoundFallbackReply(
  rawQuestion: string,
  items: FoodItem[],
  lang: Lang,
  extractedKeyword: string
): { reply: string; matchedCodes: string[] } {
  const { tokens } = extractCleanKeyword(rawQuestion);
  const { nearestItems, nearestGroups, hasStrongFoodSimilarity } =
    findNearestItemsAndGroups(items, normNameForCompare(extractedKeyword), tokens);

  if (hasStrongFoodSimilarity && nearestItems.length > 0) {
    const kwLabel = extractedKeyword.slice(0, 40);
    const intro =
      lang === 'EN'
        ? `Could not find exact name '${kwLabel}' in the system. Did you mean one of these 3 closest items?`
        : lang === 'KO'
          ? `시스템에서 '${kwLabel}' 정확한 이름을 찾지 못했습니다. 가장 유사한 3가지 품목 중 하나를 찾으셨나요?`
          : lang === 'HI'
            ? `सिस्टम में सटीक नाम '${kwLabel}' नहीं मिला। क्या आपका आशय इन 3 सबसे करीबी आइटमों में से किसी एक से है?`
            : `Không thấy đúng tên '${kwLabel}' trong hệ thống, bạn có ý là 1 trong 3 món gần nhất này không?`;

    const listText = nearestItems
      .map((it) => formatLocalizedItemBlock(it, lang, false))
      .join('\n\n');

    const ask =
      lang === 'EN'
        ? 'Which item would you like to view? Or type another name / code (PLx-xx).'
        : lang === 'KO'
          ? '어떤 항목을 보시겠습니까? 또는 다른 이름이나 코드(PLx-xx)를 입력해 주세요.'
          : lang === 'HI'
            ? 'आप कौन सा आइटम देखना चाहते हैं? या दूसरा नाम / कोड (PLx-xx) टाइप करें।'
            : 'Bạn muốn xem món nào? Hoặc gõ lại tên khác / mã PLx-xx.';

    return {
      reply: `${intro}\n\n${listText}\n\n${ask}`,
      matchedCodes: nearestItems.map(getItemCode),
    };
  }

  const groupSuggestion =
    nearestGroups.length > 0
      ? nearestGroups
      : items
          .map((i) => i.g)
          .filter((g, idx, arr) => Boolean(g) && arr.indexOf(g) === idx)
          .slice(0, 2);

  const suggestLine =
    lang === 'EN'
      ? `Suggested nearby groups: ${groupSuggestion.join(' | ')}`
      : lang === 'KO'
        ? `가까운 추천 그룹: ${groupSuggestion.join(' | ')}`
        : lang === 'HI'
          ? `निकटतम सुझाए गए समूह: ${groupSuggestion.join(' | ')}`
          : `Gợi ý nhóm gần nhất: ${groupSuggestion.join(' | ')}`;

  return {
    reply: `${OUT_OF_SCOPE_MSG[lang]}\n\n${suggestLine}`,
    matchedCodes: [],
  };
}
