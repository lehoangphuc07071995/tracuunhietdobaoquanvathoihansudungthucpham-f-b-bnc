import {
  getItemCode,
  hasCellValue,
  hasUseToday,
  isEmptyCell,
  isNoFreezeCell,
} from '../data/foodData';
import {
  SHE_DOC_METADATA,
  SHE_NO_FREEZE_ITEMS,
  SHE_POLICY_SECTIONS,
  type SheNoFreezeItem,
  type ShePolicySection,
} from '../data/sheRegulationData';
import {
  translateDuration,
  translateGroup,
  translateItemName,
  translateItemNote,
  translateNoFreezeItem,
  translatePolicySection,
} from '../data/translations';
import type { AiChatTurn, FoodItem, Lang } from '../types';

export type ChatIntentType =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'AMBIGUOUS'
  | 'POLICY';

export interface ChatPaginationState {
  codes: string[];
  offset: number;
  headingPrefix: string;
  includeDisclaimer: boolean;
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
  VI: 'Bản trích lục tuân thủ Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13). Không thay thế văn bản gốc; khi có mâu thuẫn, ưu tiên văn bản gốc và khuyến cáo NSX trên bao bì.',
  EN: 'Excerpt complies with Decision 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13). Does not replace the official original; in case of conflict, the issued document and manufacturer instructions prevail.',
  KO: '본 발췌문은 결정 107/2026/QĐ-SHE/SG(SHE-QĐ-FB13)를 준수합니다. 원본 문서를 대체하지 않으며, 상충 시 원본 문서 및 제조사 표시 기준이 우선합니다.',
  HI: 'यह अंश निर्णय 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13) के अनुरूप है। यह मूल दस्तावेज़ का स्थान नहीं लेता; विरोधाभास की स्थिति में मूल दस्तावेज़ व निर्माता के निर्देश मान्य होंगे।',
};

export const OUT_OF_SCOPE_MSG: Record<Lang, string> = {
  VI: 'Câu này ngoài dữ liệu quy định SHE-QĐ-FB13, vui lòng liên hệ Quản lý trực tiếp hoặc Phòng QLCL / Bộ phận Ẩm thực Khối SHE để được hướng dẫn.',
  EN: 'This question is outside the SHE-QĐ-FB13 database; please contact your direct Manager or Quality Control / Culinary Department (SHE) for guidance.',
  KO: '이 질문은 SHE-QĐ-FB13 규정 데이터 범위를 벗어났습니다. 담당 관리자 또는 SHE 품질관리/조리 부서에 문의해 주세요.',
  HI: 'यह प्रश्न SHE-QĐ-FB13 डेटा से बाहर है; कृपया अपने सीधे प्रबंधक या SHE गुणवत्ता नियंत्रण / पाक कला विभाग से संपर्क करें।',
};

const SYNONYM_PHRASES: Array<[RegExp, string]> = [
  [/\bbanh\s*m[iy]\b/g, 'banh mi'],
  [/\bbanh\s*bao\b/g, 'banh bao'],
  [/\bbanh\s*kem\b/g, 'banh kem'],
  [/\bso[\s-]*co[\s-]*la\b|\bsocola\b|\bchocolate\b|\bchocolat\b|\bchoco\b|\bcacao\b|\bcocoa\b/g, 'socola'],
  [/\bpho[\s-]*mai\b|\bphomai\b|\bphomat\b|\bcheese\b|\bmascarpone\b|\bcheddar\b|\bmozzarell?a\b|\bparmesan\b|\bricotta\b/g, 'phomai'],
  [/\bmilk\b/g, 'sua'],
  [/\bcondensed\s+milk\b/g, 'sua dac'],
  [/\bfresh\s+milk\b/g, 'sua tuoi'],
  [/\bbread\b|\bbaguette\b/g, 'banh mi'],
  [/\bpastry\b|\bpastries\b|\bcake\b/g, 'banh ngot'],
  [/\bice\s*cream\b|\bgelato\b/g, 'kem'],
  [/\bwhipping(\s+cream)?\b/g, 'kem whipping'],
  [/\bsalmon\b/g, 'ca hoi'],
  [/\bseafood\b/g, 'hai san'],
  [/\bchicken\b/g, 'thit ga'],
  [/\bpork\b/g, 'thit heo'],
  [/\bcoffee\b|\bcafe\b/g, 'ca phe'],
  [/\begg(s)?\b/g, 'trung'],
  [/\bflour\b/g, 'bot'],
  [/\byogurt\b|\byoghurt\b/g, 'sua chua'],
  [/\bkhong\s*(?:duoc\s*)?cap\s*dong\b|\bkhong\s*nen\s*cap\s*dong\b|\bno\s*freeze\b|\bdo\s*not\s*freeze\b/g, ' __COL_NOFREEZE__ '],
  [/\btu\s*lanh\b|\btu\s*mat\b|\bkho\s*lanh\b|\bkho\s*mat\b|\bde\s*lanh\b|\bde\s*mat\b|\bbao\s*quan\s*lanh\b|\bbao\s*quan\s*mat\b|\bnhiet\s*do\s*lanh\b|\b0\s*[-–]\s*5\s*(?:do\s*c|c|°c)?\b|\b1\s*[-–]\s*4\s*(?:do\s*c|c|°c)?\b|\bfridge\b|\bchilled\b|\bcooler\b/g, ' __COL_COOL__ '],
  [/\btu\s*dong\b|\bkho\s*dong\b|\bcap\s*dong\b|\bdo\s*dong\b|\bde\s*dong\b|\bbao\s*quan\s*dong\b|\bnhiet\s*do\s*dong\b|\b-?\s*18\s*(?:do\s*c|c|°c)?\b|\bfreezer\b|\bfrozen\b/g, ' __COL_FREEZE__ '],
  [/\bnhiet\s*do\s*phong\b|\bo\s*phong\b|\bnhiet\s*phong\b|\bnhiet\s*thuong\b|\bthuong\s*nhiet\b|\bde\s*ngoai\b|\b15\s*[-–]\s*25\s*(?:do\s*c|c|°c)?\b|\broom\s*temp(?:erature)?\b|\bambient\b/g, ' __COL_ROOM__ '],
  [/\bdung\s*trong\s*ngay\b|\bsu\s*dung\s*trong\s*ngay\b|\btrong\s*ngay\b|\btheo\s*gio\b|\buse\s*(?:within\s*)?today\b/g, ' __COL_TODAY__ '],
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
  /\bthuc\s+pham\b/g,
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
  'can', 'do', 'does', 'days', 'hours', 'months', 'why', 'tai', 'sao',
]);

export function normVN(s: string): string {
  let out = (s || '')
    .toLowerCase()
    .replace(/(^|[^\p{L}])m[ỳýỷỹỵ](?=$|[^\p{L}])/gu, '$1mi')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bshe\s*[-_\s]*0*(\d{1,2})\b/g, (_, n) => `she-${String(Number(n)).padStart(2, '0')}`)
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
  const qWithoutDocCodes = question.replace(/SHE-QĐ-FB13|QĐ-SHE\/SG|QĐ-SHE|QĐ/gi, ' ');
  const hasViDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    qWithoutDocCodes
  );
  if (hasViDiacritics) return 'VI';
  const lower = qWithoutDocCodes.toLowerCase();
  if (
    /\b(how|what|which|many|long|compare|between|store|stored|storage|fridge|freezer|room|bread|milk|butter|beef|show\s+more|see\s+more|first|second|next|thaw|thawing|defrost|cool|cooling|reheat|procedure|procedures|article|cannot|frozen|unlisted|label|labeling)\b/.test(
      lower
    )
  ) {
    return 'EN';
  }
  if (
    /\b(banh|sua|thit|bo|dua|bao|nhiet|nhieu|mon|xem|them|dong|mat|lanh|phong|sanh|lau|ngay|gio|she-\d+)\b/.test(
      lower
    )
  ) {
    return 'VI';
  }
  return uiLang;
}

type ColFilterType = 'room' | 'cool' | 'freeze' | 'noFreeze' | 'today' | null;

function extractCleanKeyword(rawQuestion: string): {
  cleaned: string;
  tokens: string[];
  colFilter: ColFilterType;
} {
  let text = normVN(rawQuestion);

  let colFilter: ColFilterType = null;
  if (text.includes('__COL_NOFREEZE__')) colFilter = 'noFreeze';
  else if (text.includes('__COL_ROOM__')) colFilter = 'room';
  else if (text.includes('__COL_COOL__')) colFilter = 'cool';
  else if (text.includes('__COL_FREEZE__')) colFilter = 'freeze';
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
  return { cleaned, tokens: rawTokens, colFilter };
}

function formatCellDisplay(val: string, lang: Lang): string {
  if (!val || isEmptyCell(val)) return '—';
  return translateDuration(val, lang);
}

function formatLocalizedItemBlock(item: FoodItem, lang: Lang): string {
  const code = getItemCode(item);
  const name = lang === 'VI' ? item.name : `${item.name} (${translateItemName(item, lang)})`;
  const room = formatCellDisplay(item.room, lang);
  const cool = formatCellDisplay(item.cool, lang);
  const freeze = formatCellDisplay(item.freeze, lang);
  const note = isEmptyCell(item.note) ? '—' : translateItemNote(item, lang);

  const lbl =
    lang === 'EN'
      ? { r: 'Room (15–25°C)', c: 'Chilled (0–5°C)', f: 'Frozen (≤ −18°C)', n: 'Note' }
      : lang === 'KO'
        ? { r: '상온(15–25°C)', c: '냉장(0–5°C)', f: '냉동(≤ −18°C)', n: '비고' }
        : lang === 'HI'
          ? { r: 'कमरा (15–25°C)', c: 'ठंडा (0–5°C)', f: 'फ़्रीज़ (≤ −18°C)', n: 'नोट' }
          : { r: 'Phòng (15–25°C)', c: 'Lạnh (0–5°C)', f: 'Đông (≤ −18°C)', n: 'Lưu ý' };

  const customParts = item.customFields
    ? Object.entries(item.customFields)
        .filter(([, val]) => val && val.trim())
        .map(([k, val]) => `${k}: ${val}`)
    : [];

  const line2 = [
    `${lbl.r}: ${room}`,
    `${lbl.c}: ${cool}`,
    `${lbl.f}: ${freeze}`,
    `${lbl.n}: ${note}`,
    ...customParts,
  ].join(' | ');

  return [`- [${code}] ${name}`, `  ${line2}`].join('\n');
}

export function formatPaginatedReply(
  itemsMap: Map<string, FoodItem>,
  pagination: ChatPaginationState,
  lang: Lang
): { reply: string; pageCodes: string[]; nextPagination: ChatPaginationState | null } {
  const pageSize = 5;
  const sliceCodes = pagination.codes.slice(pagination.offset, pagination.offset + pageSize);
  const blocks = sliceCodes
    .map((code) => itemsMap.get(code.toUpperCase()))
    .filter((it): it is FoodItem => Boolean(it))
    .map((it) => formatLocalizedItemBlock(it, lang));

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
  if (s.includes('theo nsx')) {
    const dayBound = s.match(/toi\s+da\s+(\d+)\s*ngay/);
    return dayBound ? Number(dayBound[1]) * 24 : 24 * 365;
  }
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
    else if (unit === 'nam' || unit.startsWith('year')) hours = num * 24 * 365;
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
    !/\bsung\s+bo\b|\bbo\s+toi\b|\bbap\s+rang\s+bo\b|\bthit\s+bo\b|\bsot\s+bo\b|\bqua\s+bo\b/.test(noAccent);

  const hasBareDua =
    !hasPineappleAccent &&
    !hasCoconutAccent &&
    /\bdua\b/.test(noAccent) &&
    !/\bcot\s+dua\b|\bnuoc\s+dua\b|\bdua\s+hau\b/.test(noAccent);

  return {
    hasButterAccent,
    hasBeefAccent,
    hasPineappleAccent,
    hasCoconutAccent,
    hasBareBo,
    hasBareDua,
  };
}

function getItemSearchableText(item: FoodItem): string {
  return `${item.name} ${item.g} ${(item.keywords || []).join(' ')}`;
}

function violatesStrictDiacriticFilter(
  item: FoodItem,
  flags: ReturnType<typeof getStrictDairyMeatFlags>
): boolean {
  const text = getItemSearchableText(item);
  if (flags.hasButterAccent && !flags.hasBeefAccent && hasUnicodeWord(text, 'bò') && !hasUnicodeWord(text, 'bơ')) {
    return true;
  }
  if (flags.hasBeefAccent && !flags.hasButterAccent && hasUnicodeWord(text, 'bơ') && !hasUnicodeWord(text, 'bò')) {
    return true;
  }
  if (flags.hasPineappleAccent && !flags.hasCoconutAccent && hasUnicodeWord(text, 'dừa') && !hasUnicodeWord(text, 'dứa')) {
    return true;
  }
  if (flags.hasCoconutAccent && !flags.hasPineappleAccent && hasUnicodeWord(text, 'dứa') && !hasUnicodeWord(text, 'dừa')) {
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
  const headFallbackScored: Array<{ item: FoodItem; score: number }> = [];
  const genericWords = new Set(['cac', 'loai', 'do', 'thuc', 'pham', 'che', 'bien', 'khong', 'co', 'da', 'chua', 'moi']);

  for (const item of items) {
    if (violatesStrictDiacriticFilter(item, flags)) continue;

    const fullTextRaw = getItemSearchableText(item);
    if (
      flags.hasButterAccent &&
      !flags.hasBeefAccent &&
      !hasUnicodeWord(fullTextRaw, 'bơ') &&
      !hasUnicodeWord(item.enName || '', 'butter')
    ) {
      continue;
    }
    if (flags.hasBeefAccent && !flags.hasButterAccent && !hasUnicodeWord(fullTextRaw, 'bò')) {
      continue;
    }
    if (flags.hasPineappleAccent && !flags.hasCoconutAccent && !hasUnicodeWord(fullTextRaw, 'dứa')) {
      continue;
    }
    if (flags.hasCoconutAccent && !flags.hasPineappleAccent && !hasUnicodeWord(fullTextRaw, 'dừa')) {
      continue;
    }

    const queryHasKhong = tokens.includes('khong');
    const positiveItemName = queryHasKhong
      ? item.name
      : item.name.replace(/\(\s*không[^)]*\)/gi, ' ');
    const enTranslated = translateItemName(item, 'EN');
    const customText = item.customFields
      ? Object.values(item.customFields).join(' ')
      : '';
    const nameNorm = normNameForCompare(positiveItemName);
    const enNorm = normNameForCompare(`${enTranslated} ${item.enName || ''}`);
    const groupNorm = normNameForCompare(`${item.g} ${translateGroup(item.g, 'EN')}`);
    const kwNorm = normNameForCompare(`${(item.keywords || []).join(' ')} ${customText}`);
    const fullPool = `${nameNorm} ${enNorm} ${kwNorm} ${groupNorm}`.trim();
    const fullTokens = fullPool.split(/\s+/).filter(Boolean);

    const containsWholePhrase = (haystack: string, needle: string): boolean => {
      if (!haystack || !needle) return false;
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`).test(haystack);
    };

    let score = 0;

    if (nameNorm === cleanedKeyword) {
      score += 500;
    } else if (nameNorm === `cac loai ${cleanedKeyword}`) {
      score += 420;
    } else if (containsWholePhrase(nameNorm, cleanedKeyword) || (cleanedKeyword.length >= 5 && nameNorm.includes(cleanedKeyword))) {
      score += 340;
    } else if (kwNorm && (containsWholePhrase(kwNorm, cleanedKeyword) || (cleanedKeyword.length >= 5 && kwNorm.includes(cleanedKeyword)))) {
      score += 290;
    } else if (enNorm && containsWholePhrase(enNorm, cleanedKeyword)) {
      score += 270;
    } else if (containsWholePhrase(groupNorm, cleanedKeyword)) {
      score += 210;
    } else {
      const nameTokenList = nameNorm.split(/\s+/).filter(Boolean);
      const kwTokenList = `${nameNorm} ${kwNorm}`.split(/\s+/).filter(Boolean);
      const enTokenList = enNorm.split(/\s+/).filter(Boolean);
      const tokenMatchesWord = (word: string, tk: string) =>
        word === tk || (tk.length >= 4 && word.startsWith(tk));
      const nameHits = tokens.filter((tk) =>
        nameTokenList.some((nt) => tokenMatchesWord(nt, tk))
      ).length;
      const nameAndKwHits = tokens.filter((tk) =>
        kwTokenList.some((nt) => tokenMatchesWord(nt, tk))
      ).length;
      const allPoolHits = tokens.filter((tk) =>
        fullTokens.some((ft) => tokenMatchesWord(ft, tk))
      ).length;

      if (nameHits === tokens.length) {
        score += 250;
      } else if (nameAndKwHits === tokens.length) {
        score += 220;
      } else if (allPoolHits === tokens.length) {
        score += 180;
      } else if (
        tokens.length === 1 &&
        tokens[0].length >= 2 &&
        enTokenList.some((et) => et === tokens[0])
      ) {
        score += 170;
      } else if (
        tokens.length >= 2 &&
        nameAndKwHits >= 1 &&
        allPoolHits >= Math.max(2, Math.ceil(tokens.length * 0.6))
      ) {
        score += 110 + allPoolHits * 15;
      }
    }

    if (score > 0) {
      const lengthBonus = Math.max(0, 8 - Math.floor(item.name.length / 18));
      scored.push({ item, score: score + lengthBonus });
    } else if (tokens.length >= 2) {
      const headWords = nameNorm.split(/\s+/).filter((w) => w && !genericWords.has(w));
      const kwExactList = (item.keywords || []).map((k) => normNameForCompare(k));
      const matchedHead = tokens.some(
        (tk) =>
          tk.length >= 2 &&
          !genericWords.has(tk) &&
          (headWords[0] === tk || kwExactList.includes(tk))
      );
      if (matchedHead) {
        headFallbackScored.push({ item, score: 85 });
      }
    }
  }

  const results = scored.length > 0 ? scored : headFallbackScored;
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.item.order ?? a.item.n) - (b.item.order ?? b.item.n);
  });

  return results;
}

function scoreSheNoFreezeItems(
  cleanedKeyword: string,
  tokens: string[],
  rawQuestion: string
): Array<{ nf: SheNoFreezeItem; idx: number }> {
  if (!cleanedKeyword || tokens.length === 0) return [];
  const flags = getStrictDairyMeatFlags(rawQuestion);
  const matched: Array<{ nf: SheNoFreezeItem; idx: number }> = [];
  const escapedPhrase = cleanedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phraseRegex = new RegExp(`(?:^|\\s)${escapedPhrase}(?=\\s|$)`);

  SHE_NO_FREEZE_ITEMS.forEach((nf, idx) => {
    const rawDetail = `${nf.group} ${nf.detail}`;
    if (flags.hasBeefAccent && !flags.hasButterAccent && hasUnicodeWord(rawDetail, 'bơ')) {
      return;
    }
    if (flags.hasButterAccent && !flags.hasBeefAccent && hasUnicodeWord(rawDetail, 'bò')) {
      return;
    }
    if (flags.hasCoconutAccent && !flags.hasPineappleAccent && hasUnicodeWord(rawDetail, 'dứa')) {
      return;
    }
    if (flags.hasPineappleAccent && !flags.hasCoconutAccent && hasUnicodeWord(rawDetail, 'dừa')) {
      return;
    }
    const textNorm = normNameForCompare(
      `${nf.group} ${nf.detail} ${(nf.keywords || []).join(' ')}`
    ).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textNorm.split(/\s+/).filter(Boolean);
    if (phraseRegex.test(textNorm)) {
      matched.push({ nf, idx });
      return;
    }
    const allHit = tokens.every((tk) =>
      words.some((w) => w === tk || (tk.length >= 4 && w.startsWith(tk)))
    );
    if (allHit) {
      matched.push({ nf, idx });
    }
  });
  return matched;
}

function formatSheNoFreezeCallout(
  matches: Array<{ nf: SheNoFreezeItem; idx: number }>,
  lang: Lang
): string {
  if (matches.length === 0) return '';
  const title =
    lang === 'EN'
      ? `Article 8 (${SHE_DOC_METADATA.docCode}) — Foods NOT allowed to freeze:`
      : lang === 'KO'
        ? `제8조 (${SHE_DOC_METADATA.docCode}) — 냉동 보관 금지 식품 안내:`
        : lang === 'HI'
          ? `अनुच्छेद 8 (${SHE_DOC_METADATA.docCode}) — फ़्रीज़ न किए जाने वाले खाद्य पदार्थ:`
          : `Lưu ý Điều 8 (${SHE_DOC_METADATA.docCode}) — Thực phẩm KHÔNG cấp đông:`;
  const lines = matches.map(({ nf, idx }) => {
    const loc = translateNoFreezeItem(nf, idx, lang);
    return `- ${loc.group} (${loc.detail}): ${loc.reason}`;
  });
  return `${title}\n${lines.join('\n')}`;
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
    const enNorm = normNameForCompare(`${translateItemName(item, 'EN')} ${item.enName || ''}`);
    const kwNorm = normNameForCompare((item.keywords || []).join(' '));
    const groupNorm = normNameForCompare(`${item.g} ${translateGroup(item.g, 'EN')}`);
    const nameWords = `${nameNorm} ${kwNorm}`.split(/\s+/).filter(Boolean);
    const poolWords = `${nameNorm} ${enNorm} ${kwNorm} ${groupNorm}`.split(/\s+/).filter(Boolean);

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
    return a.item.n - b.item.n;
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
      .filter((it) => {
        const txt = getItemSearchableText(it);
        return hasUnicodeWord(txt, 'bơ') || hasUnicodeWord(it.enName || '', 'butter');
      })
      .slice(0, 4);
    const beefItems = items
      .filter((it) => {
        const txt = getItemSearchableText(it);
        return hasUnicodeWord(txt, 'bò') && !hasUnicodeWord(txt, 'bơ');
      })
      .slice(0, 4);

    const codes = [...butterItems, ...beefItems].map(getItemCode);
    const butterLines = butterItems
      .map((it) => `- [${getItemCode(it)}] ${it.name}`)
      .join('\n');
    const beefLines = beefItems
      .map((it) => `- [${getItemCode(it)}] ${it.g}: ${it.name}`)
      .join('\n');

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
        ? 'Please type "bơ" or "bò" (or item code SHE-xx) to view exact storage rules.'
        : lang === 'KO'
          ? '정확한 보관 기준을 보려면 "bơ" 또는 "bò"(또는 코드 SHE-xx)를 입력해 주세요.'
          : lang === 'HI'
            ? 'सही भंडारण नियम देखने के लिए कृपया "bơ" या "bò" (या कोड SHE-xx) टाइप करें।'
            : 'Vui lòng gõ rõ có dấu "bơ" hoặc "bò" (hoặc chọn mã SHE-xx) để xem chi tiết nhiệt độ bảo quản!';

    return {
      reply: `${header}\n\n1. Bơ (Butter):\n${butterLines}\n\n2. Bò (Thịt bò / Thịt đỏ):\n${beefLines}\n\n${footer}`,
      matchedCodes: codes,
    };
  }

  const pineappleItems = items
    .filter((it) => hasUnicodeWord(getItemSearchableText(it), 'dứa'))
    .slice(0, 4);
  const coconutItems = items
    .filter((it) => hasUnicodeWord(getItemSearchableText(it), 'dừa'))
    .slice(0, 4);
  const codes = [...pineappleItems, ...coconutItems].map(getItemCode);

  const pLines = pineappleItems
    .map((it) => `- [${getItemCode(it)}] ${it.name} (${it.g})`)
    .join('\n');
  const cLines = coconutItems
    .map((it) => `- [${getItemCode(it)}] ${it.name}`)
    .join('\n');

  const header =
    lang === 'EN'
      ? 'Bạn ý là dứa hay dừa? (Did you mean Pineapple "dứa" or Coconut "dừa"?)'
      : 'Bạn ý là dứa hay dừa?';
  const footer =
    lang === 'EN'
      ? 'Please type "dứa" or "dừa" (or item code SHE-xx) to view exact storage rules.'
      : 'Vui lòng gõ rõ có dấu "dứa" hoặc "dừa" (hoặc chọn mã SHE-xx) để xem chi tiết!';

  return {
    reply: `${header}\n\n1. Dứa (Pineapple / Trái cây tươi):\n${pLines}\n\n2. Dừa (Coconut / Nước cốt dừa):\n${cLines}\n\n${footer}`,
    matchedCodes: codes,
  };
}

function resolveShePolicyQuery(
  rawQuestion: string,
  normQ: string,
  lang: Lang
): string | null {
  // Check explicit Article 8 / reasons / list of non-freezable items
  const asksAllNoFreeze =
    /\b(dieu\s*8|article\s*8|ly\s+do\s+khong\s+(?:duoc\s+|nen\s+)?cap\s+dong|danh\s+sach.*khong\s+(?:duoc\s+|nen\s+)?cap\s+dong|nhung\s+(?:mon|thuc\s+pham).*khong\s+(?:duoc\s+|nen\s+)?cap\s+dong|thuc\s+pham\s+khong\s+cap\s+dong|khong\s+nen\s+cap\s+dong|list.*not.*freeze|cannot\s+be\s+frozen|not\s+allowed.*freez)\b/.test(
      normQ
    ) || /제8조|냉동\s*금지|अनुच्छेद\s*8|फ़्रीज़\s*नहीं/.test(rawQuestion);

  if (asksAllNoFreeze) {
    const header =
      lang === 'EN'
        ? `Article 8 — ${SHE_DOC_METADATA.docCode} (${SHE_DOC_METADATA.decisionNo}): 11 food groups NOT allowed to be frozen:`
        : lang === 'KO'
          ? `제8조 — SHE 규정 (${SHE_DOC_METADATA.decisionNo} · ${SHE_DOC_METADATA.docCode}): 냉동 보관 금지 식품 11개 그룹:`
          : lang === 'HI'
            ? `अनुच्छेद 8 — SHE नियम (${SHE_DOC_METADATA.decisionNo} · ${SHE_DOC_METADATA.docCode}): फ़्रीज़ न किए जाने वाले 11 खाद्य समूह:`
            : `Điều 8 — Quy định Khối SHE (${SHE_DOC_METADATA.decisionNo} · ${SHE_DOC_METADATA.docCode}): 11 nhóm thực phẩm KHÔNG cấp đông:`;
    const reasonLbl =
      lang === 'EN'
        ? 'Reason'
        : lang === 'KO'
          ? '사유'
          : lang === 'HI'
            ? 'कारण'
            : 'Lý do';
    const body = SHE_NO_FREEZE_ITEMS.map((nf, i) => {
      const loc = translateNoFreezeItem(nf, i, lang);
      return `${i + 1}. ${loc.group} (${loc.detail})\n   • ${reasonLbl}: ${loc.reason}`;
    }).join('\n');
    return `${header}\n\n${body}\n\n${LEGAL_FOOTER[lang]}`;
  }

  const isPolicyTrigger =
    /\b(quyet\s+dinh|107|fb13|she\s+qd|dieu\s*[1-9]|article\s*[1-9]|muc\s*6|quy\s+trinh|quy\s+dinh\s+chung|quy\s+tac|khung\s+nhiet\s+do|nhiet\s+do\s+chuan|ra\s+dong|lam\s+nguoi|ham\s+nong|ghi\s+nhan|dan\s+nhan|tem\s+nhan|thu\s+tu\s+xep|sap\s+xep\s+tu|cach\s+san|15\s*cm|4\s+gio|04\s+gio|ngay\s+1|han\s+thu\s+cap|han\s+noi\s+bo|7\s+ngay|07\s+ngay|tcs|fifo|fefo|fda|3\s*501|chua\s+(?:duoc\s+)?liet\s+ke|mac\s+dinh\s+3\s+ngay|nghiem\s+cam|gia\s+han|thay\s+doi\s+nhan|cach\s+tinh|cach\s+doc\s+bang|trach\s+nhiem|phong\s+qlcl|phong\s+am\s+thuc|bep\s+truong|pham\s+vi\s+ap\s+dung|hieu\s+luc|ai\s+ky|thai\s+ngoc\s+son|2\s+lan|02\s+lan|vuot\s+nguong|57\s*do|75\s*do|82\s*do|khay\s+nong|5\s*cm|thaw(?:ing)?|defrost(?:ing)?|reheat(?:ing)?|cool(?:ing)?\s+(?:process|procedure|step)|(?:thawing|cooling)\s+(?:and|&)?\s*(?:cooling|thawing)?\s*procedure|labeling\s+rule|unlisted)\b/.test(
      normQ
    ) || /해동|냉각|규정|라벨|보관\s*온도|डीफ़्रॉस्ट|कूलिंग|लेबल|नियम/.test(rawQuestion);

  if (!isPolicyTrigger) return null;

  const { tokens } = extractCleanKeyword(rawQuestion);
  const extraTokens = normQ.split(/\s+/).filter((t) => t.length >= 2);
  const searchPool = Array.from(new Set([...tokens, ...extraTokens]));

  const localizedClues: string[] = [];
  if (/해동|डीफ़्रॉस्ट/.test(rawQuestion)) localizedClues.push('ra dong');
  if (/냉각|कूलिंग/.test(rawQuestion)) localizedClues.push('lam nguoi');
  if (/재가열|गरम/.test(rawQuestion)) localizedClues.push('ham nong');
  if (/라벨|लेबल/.test(rawQuestion)) localizedClues.push('ghi nhan');

  const scored: Array<{ sec: ShePolicySection; score: number }> = [];
  for (const sec of SHE_POLICY_SECTIONS) {
    let score = 0;
    const titleNorm = normNameForCompare(`${sec.article} ${sec.title}`);
    for (const kw of sec.keywords) {
      const kwPattern = new RegExp(`(?:^|\\s)${kw.replace(/\s+/g, '\\s+')}(?:$|\\s)`);
      if (kwPattern.test(normQ) || localizedClues.includes(kw)) {
        score += kw.includes(' ') ? 45 : 22;
      }
    }
    for (const tk of searchPool) {
      if (tk.length >= 3 && titleNorm.includes(tk)) score += 12;
    }
    if (score > 0) scored.push({ sec, score });
  }

  const explicitMetaQuestion =
    /\b(ai\s+ky|ngay\s+ky|hieu\s+luc|ngay\s+hieu\s+luc|pham\s+vi\s+ap\s+dung|doi\s+tuong\s+ap\s+dung|so\s+quyet\s+dinh|phien\s+ban|thai\s+ngoc\s+son|bao\s+mat\s+tai\s+lieu|don\s+vi\s+chu\s+so\s+huu|effective\s+date|decision\s+number|scope\s+of\s+application)\b/.test(
      normQ
    );

  const nonMetaScored = scored.filter((s) => s.sec.id !== 'META');
  const filteredScored =
    explicitMetaQuestion || nonMetaScored.length === 0 ? scored : nonMetaScored;

  filteredScored.sort((a, b) => b.score - a.score);
  if (filteredScored.length === 0) return null;

  const top = filteredScored.slice(0, 2).map((s) => s.sec);
  const heading =
    lang === 'EN'
      ? `According to Decision ${SHE_DOC_METADATA.decisionNo} (${SHE_DOC_METADATA.docCode}):`
      : lang === 'KO'
        ? `결정 ${SHE_DOC_METADATA.decisionNo} (${SHE_DOC_METADATA.docCode}) 기준:`
        : lang === 'HI'
          ? `निर्णय ${SHE_DOC_METADATA.decisionNo} (${SHE_DOC_METADATA.docCode}) के अनुसार:`
          : `Theo ${SHE_DOC_METADATA.title} (${SHE_DOC_METADATA.decisionNo} · ${SHE_DOC_METADATA.docCode}):`;

  const blocks = top.map((s) => {
    const loc = translatePolicySection(s, lang);
    return `[${loc.article} — ${loc.title}]\n${loc.summary}`;
  });
  return `${heading}\n\n${blocks.join('\n\n')}\n\n${LEGAL_FOOTER[lang]}`;
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

  // 2. Type D: Direct SHE Item Code Lookup ("SHE-01".."SHE-66")
  const sheCodeMatch = normQ.match(/\bshe-(\d{2})\b/);
  if (sheCodeMatch) {
    const targetCode = `SHE-${sheCodeMatch[1]}`;
    const exactItem = itemsMap.get(targetCode);
    if (exactItem) {
      const heading =
        lang === 'EN'
          ? `Found 1 SHE regulation item matching '${targetCode}' (${SHE_DOC_METADATA.docCode}):`
          : lang === 'KO'
            ? `SHE 규정(${SHE_DOC_METADATA.docCode}) '${targetCode}' 1건 조회:`
            : lang === 'HI'
              ? `SHE नियम (${SHE_DOC_METADATA.docCode}) में '${targetCode}' के लिए 1 आइटम मिला:`
              : `Tìm thấy 1 mục theo mã '${targetCode}' (${SHE_DOC_METADATA.docCode}):`;
      const noFreezeHits = isNoFreezeCell(exactItem.freeze)
        ? scoreSheNoFreezeItems(
            normNameForCompare(exactItem.name),
            normNameForCompare(exactItem.name).split(/\s+/).filter(Boolean),
            exactItem.name
          )
        : [];
      const noFreezeCallout = formatSheNoFreezeCallout(noFreezeHits.slice(0, 2), lang);
      const parts = [heading, formatLocalizedItemBlock(exactItem, lang)];
      if (noFreezeCallout) parts.push(noFreezeCallout);
      parts.push(LEGAL_FOOTER[lang]);

      return {
        handled: true,
        intent: 'D',
        reply: parts.join('\n\n'),
        matchedCodes: [targetCode],
        nextPagination: null,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: targetCode,
      };
    }
  }

  // 2b. Policy / Operational Procedure Lookup (Điều 1–9, Điều 8)
  const policyReply = resolveShePolicyQuery(question, normQ, lang);
  if (policyReply) {
    return {
      handled: true,
      intent: 'POLICY',
      reply: policyReply,
      matchedCodes: [],
      nextPagination: null,
      nextDisambiguation: null,
      detectedLang: lang,
      extractedKeyword: question,
    };
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
          : `Chi tiết mục bạn đang hỏi (${targetIdx + 1}/${prevCodes.length}):`;
      return {
        handled: true,
        intent: 'E',
        reply: `${heading}\n\n${formatLocalizedItemBlock(chosenItem, lang)}\n\n${LEGAL_FOOTER[lang]}`,
        matchedCodes: [getItemCode(chosenItem)],
        nextPagination: null,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: chosenItem.name,
      };
    }
  }

  // 5. Type C: Comparison Query ("so sánh A với B", "cái nào để lâu hơn")
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

        const lRoom = formatCellDisplay(leftItem.room, lang);
        const lCool = formatCellDisplay(leftItem.cool, lang);
        const lFreeze = formatCellDisplay(leftItem.freeze, lang);

        const rRoom = formatCellDisplay(rightItem.room, lang);
        const rCool = formatCellDisplay(rightItem.cool, lang);
        const rFreeze = formatCellDisplay(rightItem.freeze, lang);

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

        const colCompare = (label: string, raw1: string, raw2: string, d1: string, d2: string) => {
          const h1 = parseMaxDurationHours(raw1);
          const h2 = parseMaxDurationHours(raw2);
          if (h1 === 0 && h2 === 0) return `• ${label}: ${d1} / ${d2}`;
          if (h1 === h2) return `• ${label}: ${d1} = ${d2}`;
          return h1 > h2
            ? `• ${label}: [${leftCode}] (${d1}) > [${rightCode}] (${d2})`
            : `• ${label}: [${rightCode}] (${d2}) > [${leftCode}] (${d1})`;
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
            ? `Comparison across 3 SHE temperature columns:`
            : lang === 'KO'
              ? `SHE 3가지 온도 기준 비교표:`
              : lang === 'HI'
                ? `SHE 3 तापमान कॉलम तुलना तालिका:`
                : `Bảng so sánh 3 cột nhiệt độ (SHE-QĐ-FB13):`;

        const tableText = [
          `| Thực phẩm | Phòng (15–25°C) | Lạnh (0–5°C) | Đông (≤ −18°C) |`,
          `| [${leftCode}] ${leftItem.name} | ${lRoom} | ${lCool} | ${lFreeze} |`,
          `| [${rightCode}] ${rightItem.name} | ${rRoom} | ${rCool} | ${rFreeze} |`,
        ].join('\n');

        const summaryCols = [
          colCompare(lang === 'EN' ? 'Room (15–25°C)' : 'Phòng (15–25°C)', leftItem.room, rightItem.room, lRoom, rRoom),
          colCompare(lang === 'EN' ? 'Chilled (0–5°C)' : 'Lạnh (0–5°C)', leftItem.cool, rightItem.cool, lCool, rCool),
          colCompare(lang === 'EN' ? 'Frozen (≤ −18°C)' : 'Đông (≤ −18°C)', leftItem.freeze, rightItem.freeze, lFreeze, rFreeze),
        ].join('\n');

        return {
          handled: true,
          intent: 'C',
          reply: [compareHeading, tableText, summaryCols, conclusion, LEGAL_FOOTER[lang]].join('\n\n'),
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
  const { cleaned, tokens, colFilter } = extractCleanKeyword(question);

  // Follow-up storage-only question with previous item context
  if (!cleaned && colFilter && recentAssistantWithCodes && !/\b(bao\s+nhieu|nhung\s+mon|mon\s+nao|cac\s+mon|liet\s+ke|how\s+many|which)\b/.test(normQ)) {
    const prevItems = (recentAssistantWithCodes.matchedCodes || [])
      .map((c) => itemsMap.get(c.toUpperCase()))
      .filter((it): it is FoodItem => Boolean(it))
      .slice(0, 5);
    if (prevItems.length > 0) {
      const blocks = prevItems.map((it) => formatLocalizedItemBlock(it, lang));
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

  // 6. Type B: Count / Column Filter
  const isCountingPhrase = /\b(co\s+bao\s+nhieu|bao\s+nhieu\s+(?:mon|san\s+pham|muc)|co\s+may\s+(?:mon|san\s+pham|muc)|nhung\s+mon\s+nao|mon\s+nao|cac\s+mon|liet\s+ke|danh\s+sach|how\s+many|which\s+items|list\s+all)\b/.test(
    normQ
  );
  if (colFilter && (tokens.length === 0 || isCountingPhrase)) {
    let matched: FoodItem[] = [];
    let condLabel = '';
    if (colFilter === 'room') {
      matched = items.filter((it) => hasCellValue(it.room));
      condLabel =
        lang === 'EN'
          ? 'can be stored at room temperature (15–25°C)'
          : lang === 'KO'
            ? '상온(15–25°C) 보관 가능 항목'
            : lang === 'HI'
              ? 'कमरे के तापमान (15–25°C) पर रखे जा सकते हैं'
              : 'để được ở nhiệt độ phòng (15–25°C)';
    } else if (colFilter === 'cool') {
      matched = items.filter((it) => hasCellValue(it.cool));
      condLabel =
        lang === 'EN'
          ? 'can be stored chilled (0–5°C)'
          : lang === 'KO'
            ? '냉장(0–5°C) 보관 가능 항목'
            : lang === 'HI'
              ? 'ठंडे तापमान (0–5°C) में रखे जा सकते हैं'
              : 'để được ở nhiệt độ lạnh (0–5°C)';
    } else if (colFilter === 'freeze') {
      matched = items.filter((it) => hasCellValue(it.freeze));
      condLabel =
        lang === 'EN'
          ? 'can be stored frozen (≤ −18°C)'
          : lang === 'KO'
            ? '냉동(≤ −18°C) 보관 가능 항목'
            : lang === 'HI'
              ? 'फ़्रीज़र (≤ −18°C) में रखे जा सकते हैं'
              : 'để được ở nhiệt độ đông (≤ −18°C)';
    } else if (colFilter === 'noFreeze') {
      matched = items.filter((it) => isNoFreezeCell(it.freeze));
      condLabel =
        lang === 'EN'
          ? 'marked "Do not freeze" (Art. 7 & Art. 8)'
          : lang === 'KO'
            ? '냉동 금지로 지정된 항목 (제7조·제8조)'
            : lang === 'HI'
              ? 'जिन्हें फ़्रीज़ नहीं किया जाता (अनुच्छेद 7 व 8)'
              : 'thuộc diện Không cấp đông (Điều 7 & Điều 8)';
    } else if (colFilter === 'today') {
      matched = items.filter((it) => hasUseToday(it));
      condLabel =
        lang === 'EN'
          ? 'use within the day / by hours (4–8h)'
          : lang === 'KO'
            ? '당일/시간 단위 사용 항목 (4–8시간)'
            : lang === 'HI'
              ? 'उसी दिन / घंटों में उपयोग होने वाले आइटम (4–8 घंटे)'
              : 'sử dụng theo giờ / trong ngày (4–8 giờ)';
    }

    const codes = matched.map(getItemCode);
    const heading =
      lang === 'EN'
        ? `There are ${matched.length} items that ${condLabel}:`
        : lang === 'KO'
          ? `${condLabel}: 총 ${matched.length}건`
          : lang === 'HI'
            ? `${condLabel} वाले कुल ${matched.length} आइटम हैं:`
            : `Có ${matched.length} mục ${condLabel}:`;

    const pagState: ChatPaginationState = {
      codes,
      offset: 0,
      headingPrefix: heading,
      includeDisclaimer: true,
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

  // 7. Type A: Direct Search against SHE-QĐ-FB13 Table (Điều 7) + Điều 8 Warnings
  if (cleaned && tokens.length > 0) {
    const scored = scoreItemsForKeyword(items, cleaned, tokens, question);
    const noFreezeHits = scoreSheNoFreezeItems(cleaned, tokens, question);

    if (scored.length > 0) {
      const codes = scored.map((s) => getItemCode(s.item));
      const prettyMap: Record<string, string> = {
        'banh mi': 'bánh mì',
        'banh bao': 'bánh bao',
        'banh kem': 'bánh kem',
        'banh ngot': 'bánh ngọt',
        'sua dac': 'sữa đặc',
        'sua tuoi': 'sữa tươi',
        'phomai': 'phô mai',
        'socola': 'sô cô la',
        'ca hoi': 'cá hồi',
        'thit bo': 'thịt bò',
        'nuoc mam': 'nước mắm',
        'dau hu': 'đậu hũ',
        'trai cay': 'trái cây',
      };
      const displayKw = prettyMap[cleaned] || recoverAccentedPhrase(question, cleaned, tokens);
      const heading =
        lang === 'EN'
          ? `Found ${codes.length} SHE regulation items related to '${displayKw}':`
          : lang === 'KO'
            ? `'${displayKw}' 관련 SHE 기준 ${codes.length}건 조회:`
            : lang === 'HI'
              ? `'${displayKw}' से संबंधित ${codes.length} SHE नियम आइटम मिले:`
              : `Tìm thấy ${codes.length} mục liên quan đến '${displayKw}':`;

      const pagState: ChatPaginationState = {
        codes,
        offset: 0,
        headingPrefix: heading,
        includeDisclaimer: noFreezeHits.length === 0,
      };
      const page = formatPaginatedReply(itemsMap, pagState, lang);
      let finalReply = page.reply;
      if (noFreezeHits.length > 0) {
        finalReply = `${finalReply}\n\n${formatSheNoFreezeCallout(noFreezeHits.slice(0, 2), lang)}\n\n${LEGAL_FOOTER[lang]}`;
      }

      return {
        handled: true,
        intent: 'A',
        reply: finalReply,
        matchedCodes: page.pageCodes,
        nextPagination: page.nextPagination,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: displayKw,
      };
    }

    if (noFreezeHits.length > 0) {
      const displayKw = recoverAccentedPhrase(question, cleaned, tokens);
      return {
        handled: true,
        intent: 'A',
        reply: `${formatSheNoFreezeCallout(noFreezeHits.slice(0, 4), lang)}\n\n${LEGAL_FOOTER[lang]}`,
        matchedCodes: [],
        nextPagination: null,
        nextDisambiguation: null,
        detectedLang: lang,
        extractedKeyword: displayKw,
      };
    }
  }

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
        ? `Could not find exact name '${kwLabel}' in SHE-QĐ-FB13. Did you mean one of these 3 closest items?`
        : lang === 'KO'
          ? `SHE-QĐ-FB13에서 '${kwLabel}' 정확한 항목을 찾지 못했습니다. 가장 유사한 3가지 품목 중 하나를 찾으셨나요?`
          : lang === 'HI'
            ? `SHE-QĐ-FB13 में सटीक नाम '${kwLabel}' नहीं मिला। क्या आपका आशय इन 3 सबसे करीबी आइटमों में से किसी एक से है?`
            : `Không thấy đúng tên '${kwLabel}' trong bảng Điều 7 (SHE-QĐ-FB13), bạn có ý là 1 trong 3 mục gần nhất này không?`;

    const listText = nearestItems
      .map((it) => formatLocalizedItemBlock(it, lang))
      .join('\n\n');

    const ask =
      lang === 'EN'
        ? 'Which item would you like to view? Or type another name / code (SHE-xx).'
        : lang === 'KO'
          ? '어떤 항목을 보시겠습니까? 또는 다른 이름이나 코드(SHE-xx)를 입력해 주세요.'
          : lang === 'HI'
            ? 'आप कौन सा आइटम देखना चाहते हैं? या दूसरा नाम / कोड (SHE-xx) टाइप करें।'
            : 'Bạn muốn xem mục nào? Hoặc gõ lại tên khác / mã SHE-xx.';

    return {
      reply: `${intro}\n\n${listText}\n\n${ask}`,
      matchedCodes: nearestItems.map(getItemCode),
    };
  }

  const groupSuggestion =
    nearestGroups.length > 0
      ? nearestGroups
      : items
          .map((i) => translateGroup(i.g, lang))
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
