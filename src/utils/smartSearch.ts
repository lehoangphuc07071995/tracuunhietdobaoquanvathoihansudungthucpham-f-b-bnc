import {
  getItemCode,
  hasCellValue,
  hasUseToday,
  isNoFreezeCell,
} from '../data/foodData';
import {
  translateGroup,
  translateItemName,
} from '../data/translations';
import type { FoodItem, Lang } from '../types';

const VN_ACCENTED_CHAR_RE =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

export function toLowerNFC(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/\bbánh\s+mỳ\b/g, 'bánh mì')
    .replace(/\bmỳ\b/g, 'mì');
}

export function stripAccents(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

export function hasVietnameseDiacritics(input: string): boolean {
  return VN_ACCENTED_CHAR_RE.test(input.normalize('NFC'));
}

export function normalizeText(input: string): string {
  return stripAccents(input)
    .replace(/\bbanh\s*my\b/g, 'banh mi')
    .replace(/\bmy\b/g, 'mi')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeWords(input: string): string[] {
  return toLowerNFC(input)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

// Bi-directional F&B synonym dictionary (preserved with accurate diacritics)
const WORD_SYNONYMS: Record<string, string[]> = {
  heo: ['lợn'],
  lợn: ['heo'],
  bò: ['thịt bò'],
  bắp: ['ngô'],
  ngô: ['bắp'],
  thơm: ['dứa', 'khóm'],
  dứa: ['thơm', 'khóm'],
  khóm: ['dứa', 'thơm'],
  mè: ['vừng'],
  vừng: ['mè'],
  lạc: ['đậu phộng'],
  gà: ['gia cầm', 'chicken'],
  vịt: ['gia cầm', 'duck'],
  beef: ['bò', 'thịt bò'],
  pork: ['heo', 'lợn', 'thịt heo'],
  lamb: ['cừu'],
  veal: ['bê'],
  chicken: ['gà', 'gia cầm'],
  duck: ['vịt', 'gia cầm'],
  poultry: ['gia cầm'],
  seafood: ['hải sản'],
  fish: ['cá'],
  shrimp: ['tôm'],
  prawn: ['tôm'],
  crab: ['cua'],
  squid: ['mực'],
  octopus: ['bạch tuộc'],
  butter: ['bơ'],
  milk: ['sữa'],
  egg: ['trứng'],
  eggs: ['trứng'],
  bread: ['bánh mì'],
  baguette: ['bánh mì'],
  flour: ['bột'],
  sugar: ['đường'],
  coffee: ['cà phê'],
  cafe: ['cà phê'],
  tea: ['trà'],
  cocoa: ['ca cao'],
  chocolate: ['ca cao', 'sô cô la'],
  sauce: ['sốt'],
  mustard: ['mù tạt'],
  ketchup: ['tương cà'],
  chili: ['ớt'],
  oats: ['yến mạch'],
  granola: ['ngũ cốc'],
  rice: ['cơm', 'gạo'],
  vegetable: ['rau'],
  vegetables: ['rau củ'],
  fruit: ['quả', 'trái cây'],
  fruits: ['trái cây'],
  cheese: ['phô mai'],
  cream: ['kem'],
  bacon: ['thịt xông khói'],
  sausage: ['xúc xích'],
  ham: ['jambon'],
};

const PHRASE_SYNONYMS: Array<[string, string[]]> = [
  ['thịt bò', ['bò', 'thịt đỏ']],
  ['thịt heo', ['heo', 'lợn', 'thịt đỏ']],
  ['thịt lợn', ['heo', 'thịt heo', 'thịt đỏ']],
  ['đậu phộng', ['lạc', 'hạt']],
  ['xì dầu', ['nước tương']],
  ['nước tương', ['xì dầu']],
  ['phô mai', ['phomai', 'cheese', 'cheddar', 'mozzarella', 'ricotta', 'cream cheese']],
  ['phomai', ['phô mai', 'cheese']],
  ['sô cô la', ['ca cao', 'bột ca cao', 'chocolate']],
  ['socola', ['ca cao', 'bột ca cao', 'chocolate']],
  ['sữa chua', ['yaourt', 'yogurt']],
  ['bắp cải', ['rau lá', 'cải']],
  ['bông cải', ['súp lơ']],
  ['súp lơ', ['bông cải']],
  ['măng tây', ['rau củ cứng']],
  ['dưa leo', ['dưa chuột', 'quả']],
  ['dưa chuột', ['dưa leo', 'quả']],
  ['nước cốt dừa', ['cốt dừa']],
  ['cà phê', ['cafe', 'coffee']],
  ['bánh mì', ['bánh nướng chín', 'bread', 'baguette']],
  ['sữa tươi', ['sữa béo', 'kem tươi']],
  ['whipping cream', ['kem tươi', 'sữa béo']],
];

// Curated accented culinary aliases scoped strictly to [Name / Group] per official SHE code
const ACCENTED_ITEM_ALIASES: Record<string, string[]> = {
  'SHE-01': ['thịt bò', 'bò', 'thịt bê', 'bê', 'thịt cừu', 'cừu', 'thịt heo', 'heo', 'thịt lợn', 'lợn', 'thịt đỏ', 'thịt tươi', 'sườn', 'bít tết', 'steak'],
  'SHE-02': ['thịt bò xay', 'thịt heo xay', 'thịt lợn xay', 'thịt xay', 'bò xay', 'heo xay', 'lợn xay', 'thịt băm'],
  'SHE-03': ['nước súp', 'nước dùng', 'nước hầm xương', 'súp xương', 'súp thịt'],
  'SHE-04': ['thịt chín', 'thịt bò chín', 'thịt heo chín', 'thịt lợn chín', 'đồ ăn thừa'],
  'SHE-05': ['thịt nhồi', 'gà cuộn nhồi thịt', 'đậu hũ nhồi'],
  'SHE-06': ['thịt gà chín', 'gà chín', 'vịt chín', 'gia cầm chín', 'gà nướng', 'gà luộc'],
  'SHE-07': ['thịt gà', 'gà nguyên con', 'vịt nguyên con', 'gà sống', 'vịt sống', 'gia cầm'],
  'SHE-08': ['thịt gà', 'gà cắt khúc', 'vịt cắt khúc', 'ức gà', 'đùi gà', 'cánh gà'],
  'SHE-09': ['gà xay', 'vịt xay', 'gia cầm xay'],
  'SHE-10': ['lòng gà', 'mề gà', 'tim gà', 'nội tạng gia cầm'],
  'SHE-11': ['cá hồi', 'cá ngừ', 'cá thu', 'cá chép', 'cá tuyết', 'cá diêu hồng', 'cá tươi', 'cá phi lê', 'cá sống', 'salmon', 'tuna'],
  'SHE-12': ['tôm sú', 'tôm thẻ', 'tôm hùm', 'tôm tươi', 'cua', 'ghẹ', 'giáp xác'],
  'SHE-13': ['mực', 'bạch tuộc', 'nghêu', 'sò', 'ngao', 'hàu', 'vẹm', 'nhuyễn thể'],
  'SHE-14': ['hải sản chín', 'tôm luộc', 'tôm hấp', 'cá nấu chín', 'hải sản hấp'],
  'SHE-15': ['cá hồi xông khói', 'cá xông khói', 'thịt xông khói', 'ba rọi xông khói', 'bacon'],
  'SHE-16': ['xúc xích', 'lạp xưởng', 'sausage'],
  'SHE-17': ['giò lụa', 'chả lụa', 'jambon', 'thịt nguội', 'thịt xông khói cắt lát'],
  'SHE-18': ['xúc xích chín', 'thịt nguội nấu chín'],
  'SHE-19': ['phô mai cứng', 'phô mai', 'cheddar', 'mozzarella', 'parmesan', 'gouda'],
  'SHE-20': ['phô mai mềm', 'phô mai tươi', 'phô mai', 'ricotta', 'cream cheese', 'mascarpone'],
  'SHE-21': ['sữa tươi', 'sữa béo', 'kem tươi', 'whipping cream', 'heavy cream', 'sữa chua'],
  'SHE-22': ['bơ', 'bơ lạt', 'bơ mặn', 'bơ thực vật', 'bơ động vật', 'butter'],
  'SHE-23': ['sữa đặc', 'sữa đặc có đường'],
  'SHE-24': ['trứng gà', 'trứng vịt', 'trứng cút', 'trứng sống', 'trứng tươi', 'trứng nguyên vỏ'],
  'SHE-25': ['trứng luộc', 'trứng chiên', 'trứng hấp', 'trứng chín'],
  'SHE-26': ['rau lá', 'rau cải', 'xà lách', 'cải thìa', 'cải ngọt', 'rau muống', 'rau thơm'],
  'SHE-27': ['cam', 'quýt', 'bưởi', 'chanh', 'quả có múi'],
  'SHE-28': ['dứa', 'thơm', 'khóm', 'dừa', 'xoài', 'táo', 'chuối', 'nho', 'dâu tây', 'dưa hấu', 'trái cây'],
  'SHE-29': ['cà rốt', 'súp lơ', 'bông cải', 'đậu que', 'bí đỏ', 'su su', 'củ cải', 'rau củ cứng'],
  'SHE-30': ['khoai tây', 'khoai lang', 'hành tây', 'tỏi', 'gừng', 'sả', 'hành tím'],
  'SHE-31': ['rau củ sơ chế', 'rau gọt vỏ'],
  'SHE-32': ['rau cắt sẵn', 'trái cây cắt sẵn', 'salad trộn'],
  'SHE-33': ['nước tương', 'xì dầu', 'nước mắm'],
  'SHE-34': ['tương ớt'],
  'SHE-35': ['tương cà', 'tương cà chua', 'ketchup'],
  'SHE-36': ['mù tạt', 'mustard'],
  'SHE-37': ['sốt mayonnaise', 'mayonnaise', 'sốt trứng', 'sốt sữa', 'sốt kem', 'hollandaise'],
  'SHE-38': ['sốt tự nấu', 'nước chấm', 'sốt cà chua tự nấu'],
  'SHE-39': ['cốt hoa quả', 'nước cốt trái cây'],
  'SHE-40': ['sirô', 'syrup'],
  'SHE-41': ['nước đường', 'nước đường cô đặc'],
  'SHE-42': ['nước ép tươi', 'nước ép tự làm'],
  'SHE-43': ['nước ép đóng hộp', 'nước trái cây đóng chai'],
  'SHE-44': ['sữa hạt', 'sữa đậu nành', 'sữa hạnh nhân', 'sữa óc chó', 'sữa thực vật'],
  'SHE-45': ['nước ngọt', 'nước khoáng có gas', 'bia', 'soda', 'cola'],
  'SHE-46': ['trà pha sẵn', 'cà phê pha sẵn', 'cold brew'],
  'SHE-47': ['bột mì trộn sẵn', 'bột bánh', 'bột trộn sẵn'],
  'SHE-48': ['bánh bao'],
  'SHE-49': ['bánh mì', 'bánh mỳ', 'bánh nướng chín', 'baguette', 'sandwich'],
  'SHE-50': ['bánh kem', 'bánh ngọt có kem', 'tiramisu', 'mousse', 'bánh flan'],
  'SHE-51': ['bánh chưa nướng', 'bột đông lạnh', 'croissant đông lạnh'],
  'SHE-52': ['mì tươi', 'mì chín', 'bún', 'miến', 'mì ý', 'pasta', 'spaghetti', 'tinh bột chín'],
  'SHE-53': ['cơm', 'cơm trắng', 'xôi', 'khoai chín'],
  'SHE-54': ['bắp rang bơ', 'ngô rang bơ', 'popcorn'],
  'SHE-55': ['bột trà', 'lá trà khô', 'trà khô'],
  'SHE-56': ['trà túi', 'trà túi lọc'],
  'SHE-57': ['bột ca cao', 'ca cao', 'sô cô la', 'socola'],
  'SHE-58': ['bột cà phê', 'cà phê rang xay', 'cà phê hạt'],
  'SHE-59': ['bột matcha', 'matcha', 'bột sữa', 'bột kem béo'],
  'SHE-60': ['ngô hạt khô', 'bắp hạt khô'],
  'SHE-61': ['gia vị khô', 'thảo mộc khô', 'tiêu', 'quế', 'hồi', 'ớt khô'],
  'SHE-62': ['bột mì', 'bột gạo', 'tinh bột', 'bột bắp', 'bột năng'],
  'SHE-63': ['ngũ cốc', 'yến mạch', 'granola'],
  'SHE-64': ['gạo', 'mì khô', 'bún khô', 'miến khô', 'nui khô', 'mì gói'],
  'SHE-65': ['hạnh nhân', 'óc chó', 'hạt điều', 'đậu phộng', 'lạc', 'hạt khô'],
  'SHE-66': ['đồ hộp', 'đồ đóng lon', 'nước cốt dừa đóng hộp', 'cá hộp', 'thịt hộp', 'đậu hộp'],
};

type StorageConstraint = 'room' | 'cool' | 'freeze' | 'noFreeze' | 'today';

const STORAGE_PHRASE_MAP: Array<[RegExp, StorageConstraint]> = [
  [/\b(?:không|khong)\s*(?:được\s*|duoc\s*)?(?:cấp\s*đông|cap\s*dong)\b/i, 'noFreeze'],
  [/\b(?:tủ\s*mát|tu\s*mat|kho\s*mát|kho\s*mat|kho\s*lạnh|kho\s*lanh|tủ\s*lạnh|tu\s*lanh|chiller|fridge)\b/i, 'cool'],
  [/\b(?:tủ\s*đông|tu\s*dong|kho\s*đông|kho\s*dong|cấp\s*đông|cap\s*dong|freezer|frozen)\b/i, 'freeze'],
  [/\b(?:nhiệt\s*độ\s*phòng|nhiet\s*do\s*phong|kho\s*khô|kho\s*kho|ambient|room)\b/i, 'room'],
  [/\b(?:trong\s*ngày|trong\s*ngay|theo\s*giờ|theo\s*gio)\b/i, 'today'],
];

const SINGLE_STORAGE_WORD: Record<string, StorageConstraint> = {
  mát: 'cool',
  mat: 'cool',
  lạnh: 'cool',
  lanh: 'cool',
  chiller: 'cool',
  đông: 'freeze',
  dong: 'freeze',
  freezer: 'freeze',
  phòng: 'room',
  phong: 'room',
  ambient: 'room',
};

function matchesSingleWord(queryWord: string, targetWords: string[]): boolean {
  const accented = hasVietnameseDiacritics(queryWord);
  if (accented) {
    const qNfc = toLowerNFC(queryWord);
    return targetWords.some((tw) => toLowerNFC(tw) === qNfc);
  }
  const qAscii = stripAccents(queryWord);
  return targetWords.some((tw) => stripAccents(tw) === qAscii);
}

function phraseRegexForQuery(phrase: string, strictAccents: boolean): RegExp {
  const words = tokenizeWords(phrase);
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join('[^\\p{L}\\p{N}]+');
  try {
    return new RegExp(`(?<!\\p{L})${pattern}(?!\\p{L})`, strictAccents ? 'iu' : 'iu');
  } catch {
    return new RegExp(`(?:^|\\s)${pattern}(?=$|\\s)`, 'i');
  }
}

function containsWholePhrase(
  targetText: string,
  queryPhrase: string,
  strictAccents: boolean
): boolean {
  if (!queryPhrase.trim() || !targetText.trim()) return false;
  const hay = strictAccents ? toLowerNFC(targetText) : stripAccents(targetText);
  const needle = strictAccents ? toLowerNFC(queryPhrase) : stripAccents(queryPhrase);
  const rx = phraseRegexForQuery(needle, strictAccents);
  return rx.test(hay);
}

function startsWithWholePhrase(
  targetText: string,
  queryPhrase: string,
  strictAccents: boolean
): boolean {
  const targetWords = tokenizeWords(targetText);
  const queryWords = tokenizeWords(queryPhrase);
  if (queryWords.length === 0 || targetWords.length < queryWords.length) return false;
  for (let i = 0; i < queryWords.length; i++) {
    const qw = queryWords[i];
    const tw = targetWords[i];
    if (strictAccents ? toLowerNFC(tw) !== toLowerNFC(qw) : stripAccents(tw) !== stripAccents(qw)) {
      return false;
    }
  }
  return true;
}

function satisfiesStorageConstraint(item: FoodItem, c: StorageConstraint): boolean {
  if (c === 'room') return hasCellValue(item.room);
  if (c === 'cool') return hasCellValue(item.cool);
  if (c === 'freeze') return hasCellValue(item.freeze);
  if (c === 'noFreeze') return isNoFreezeCell(item.freeze);
  if (c === 'today') return hasUseToday(item);
  return false;
}

function buildTokenVariants(token: string, strictAccents: boolean): string[] {
  const variants = new Set<string>([token]);
  const nfc = toLowerNFC(token);
  const direct = WORD_SYNONYMS[nfc];
  if (direct) {
    for (const s of direct) variants.add(s);
  }
  if (!strictAccents) {
    const ascii = stripAccents(token);
    for (const [k, vals] of Object.entries(WORD_SYNONYMS)) {
      if (stripAccents(k) === ascii) {
        for (const s of vals) variants.add(s);
      }
    }
  }
  return Array.from(variants);
}

export interface SmartSearchOptions {
  items: FoodItem[];
  query: string;
  lang: Lang;
  aiMatchedCodes?: string[];
}

export function runSmartSearch({
  items,
  query,
  lang,
  aiMatchedCodes = [],
}: SmartSearchOptions): FoodItem[] {
  const rawQuery = query.trim();
  if (!rawQuery) return items;

  const compactCodeQ = rawQuery.toUpperCase().replace(/\s+/g, '');
  const queryStrictAccents = hasVietnameseDiacritics(rawQuery);

  // Extract explicit storage conditions & strip matched multi-word storage phrases from food tokens
  const storageConstraints: StorageConstraint[] = [];
  let residualQuery = toLowerNFC(rawQuery);
  for (const [rx, constraint] of STORAGE_PHRASE_MAP) {
    if (rx.test(residualQuery)) {
      if (!storageConstraints.includes(constraint)) {
        storageConstraints.push(constraint);
      }
      residualQuery = residualQuery.replace(rx, ' ').trim();
    }
  }

  // Extract phrase synonyms before word tokenization (e.g. "thịt lợn" -> "thịt heo", "đậu phộng" -> "lạc")
  const rawTokens = tokenizeWords(residualQuery);
  const expandedPhraseAlts: string[] = [residualQuery];
  for (const [phrase, alts] of PHRASE_SYNONYMS) {
    if (
      residualQuery &&
      containsWholePhrase(residualQuery, phrase, queryStrictAccents)
    ) {
      for (const alt of alts) {
        expandedPhraseAlts.push(
          toLowerNFC(residualQuery).replace(phrase, alt).trim()
        );
      }
    }
  }

  // Separate optional single-word storage tokens if combined with food words (e.g., "cá hồi đông" or just "mát")
  const foodTokens: string[] = [];
  const ambiguousStorageTokens: Array<{ word: string; constraint: StorageConstraint }> = [];
  for (const tk of rawTokens) {
    const key = hasVietnameseDiacritics(tk) ? toLowerNFC(tk) : stripAccents(tk);
    const sc = SINGLE_STORAGE_WORD[key];
    if (sc && rawTokens.length > 1) {
      ambiguousStorageTokens.push({ word: tk, constraint: sc });
    } else if (sc && rawTokens.length === 1 && storageConstraints.length === 0) {
      ambiguousStorageTokens.push({ word: tk, constraint: sc });
    } else {
      foodTokens.push(tk);
    }
  }

  // AI rank map (only used if explicitly provided)
  const aiRankMap = new Map<string, number>();
  aiMatchedCodes.forEach((c, idx) => aiRankMap.set(c.toUpperCase(), idx));

  const scored: Array<{ item: FoodItem; score: number; nameLen: number }> = [];

  for (const item of items) {
    const code = getItemCode(item);
    const normalizedCode = code.toUpperCase();
    const compactSheNoDash = normalizedCode.replace('-', '');

    // 1. Direct SHE Code Match (e.g. "SHE-01", "SHE 01", "11")
    const numericMatch =
      /^\d{1,2}$/.test(compactCodeQ) &&
      String(item.n) === String(Number(compactCodeQ));
    if (
      normalizedCode === compactCodeQ ||
      compactSheNoDash === compactCodeQ.replace('-', '') ||
      numericMatch
    ) {
      scored.push({
        item,
        score: numericMatch ? 950 : 1000,
        nameLen: item.name.length,
      });
      continue;
    }

    // Check mandatory explicit multi-word storage constraints (e.g., "tủ mát", "tủ đông", "không cấp đông")
    if (
      storageConstraints.length > 0 &&
      !storageConstraints.every((c) => satisfiesStorageConstraint(item, c))
    ) {
      continue;
    }

    // Build STRICTLY scoped [Tên thực phẩm] & [Nhóm thực phẩm] fields (NO note/description!)
    const displayName = translateItemName(item, lang);
    const enName = item.enName || translateItemName(item, 'EN');
    const nameFieldList = [item.name, displayName, enName].filter(Boolean);
    const primaryName = displayName || item.name;

    const localizedGroup = translateGroup(item.g, lang);
    const enGroup = translateGroup(item.g, 'EN');
    const groupFieldList = [item.g, localizedGroup, enGroup].filter(Boolean);

    const curatedAliases = ACCENTED_ITEM_ALIASES[normalizedCode] || [];

    const nameWords = nameFieldList.flatMap(tokenizeWords);
    const groupWords = groupFieldList.flatMap(tokenizeWords);
    const aliasWords = curatedAliases.flatMap(tokenizeWords);

    // Note: Only consult raw item.keywords when user query has NO diacritics!
    const unaccentedKeywordsWords =
      !queryStrictAccents && Array.isArray(item.keywords)
        ? item.keywords.flatMap(tokenizeWords)
        : [];

    const allNameAndAliasWords = [
      ...nameWords,
      ...aliasWords,
      ...unaccentedKeywordsWords,
    ];
    const allAllowedWords = [...allNameAndAliasWords, ...groupWords];

    // Verify ambiguous single storage words (e.g. "đông" in "cá hồi đông" or "mát"):
    // Satisfied if EITHER storage column matches OR the word appears in Name/Group!
    let ambiguousStoragePass = true;
    for (const amb of ambiguousStorageTokens) {
      const inText = matchesSingleWord(amb.word, allAllowedWords);
      const inStorage = satisfiesStorageConstraint(item, amb.constraint);
      if (!inText && !inStorage) {
        ambiguousStoragePass = false;
        break;
      }
    }
    if (!ambiguousStoragePass) continue;

    // Pure storage query (e.g., "tủ mát", "chiller", "không cấp đông", "tủ đông")
    if (foodTokens.length === 0) {
      const storageBonus = nameWords.some((w) =>
        ambiguousStorageTokens.some((a) => matchesSingleWord(a.word, [w]))
      )
        ? 450
        : 400;
      scored.push({
        item,
        score: storageBonus,
        nameLen: primaryName.length,
      });
      continue;
    }

    // Require ALL food tokens to match (tokenMatch: 'all') in Name or Group (with bi-directional synonyms)
    const tokenMatchIn = (token: string, poolWords: string[]): boolean => {
      const tokenStrict = hasVietnameseDiacritics(token);
      const variants = buildTokenVariants(token, tokenStrict);
      for (const variant of variants) {
        const vWords = tokenizeWords(variant);
        if (vWords.length === 1) {
          if (matchesSingleWord(vWords[0], poolWords)) return true;
        } else if (vWords.length > 1) {
          if (vWords.every((vw) => matchesSingleWord(vw, poolWords))) return true;
        }
      }
      return false;
    };

    const allInAllowed = foodTokens.every((tk) =>
      tokenMatchIn(tk, allAllowedWords)
    );
    if (!allInAllowed) {
      // Check whole phrase synonym match against Name / Aliases / Group
      const matchesAnyPhraseAlt = expandedPhraseAlts.some(
        (alt) =>
          alt &&
          tokenizeWords(alt).every((tk) => tokenMatchIn(tk, allAllowedWords))
      );
      if (!matchesAnyPhraseAlt) continue;
    }

    // Scoring & Ranking: Exact Name -> Starts With Name -> Contains in Name -> All Tokens in Name -> Group
    const phraseToCheck = foodTokens.join(' ');
    let score = 420;

    const exactNameMatch = nameFieldList.some((nf) => {
      const a = queryStrictAccents ? toLowerNFC(nf) : stripAccents(nf);
      const b = queryStrictAccents
        ? toLowerNFC(phraseToCheck)
        : stripAccents(phraseToCheck);
      return a.trim() === b.trim();
    });

    const startsWithName = nameFieldList.some((nf) =>
      startsWithWholePhrase(nf, phraseToCheck, queryStrictAccents)
    );
    const containsPhraseInName = nameFieldList.some((nf) =>
      containsWholePhrase(nf, phraseToCheck, queryStrictAccents)
    );
    const allTokensInPrimaryName = foodTokens.every((tk) =>
      tokenMatchIn(tk, nameWords)
    );
    const matchesAliasPhrase = curatedAliases.some(
      (al) =>
        containsWholePhrase(al, phraseToCheck, queryStrictAccents) ||
        foodTokens.every((tk) => tokenMatchIn(tk, tokenizeWords(al)))
    );
    const startsWithGroup = groupFieldList.some((gf) =>
      startsWithWholePhrase(gf, phraseToCheck, queryStrictAccents)
    );
    const containsPhraseInGroup = groupFieldList.some((gf) =>
      containsWholePhrase(gf, phraseToCheck, queryStrictAccents)
    );
    const allTokensInGroup = foodTokens.every((tk) =>
      tokenMatchIn(tk, groupWords)
    );

    if (exactNameMatch) {
      score = 920;
    } else if (startsWithName) {
      score = 840;
    } else if (containsPhraseInName) {
      score = 760;
    } else if (allTokensInPrimaryName) {
      score = 680;
    } else if (matchesAliasPhrase) {
      score = 620;
    } else if (startsWithGroup) {
      score = 540;
    } else if (containsPhraseInGroup) {
      score = 510;
    } else if (allTokensInGroup) {
      score = 480;
    } else {
      score = 440;
    }

    const aiRank = aiRankMap.get(normalizedCode);
    if (aiRank !== undefined) {
      score += Math.max(2, 20 - aiRank);
    }

    scored.push({
      item,
      score,
      nameLen: primaryName.length,
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.nameLen !== b.nameLen) return a.nameLen - b.nameLen;
    return (a.item.order ?? a.item.n) - (b.item.order ?? b.item.n);
  });

  return scored.map((s) => s.item);
}

export interface HighlightSegment {
  text: string;
  matched: boolean;
}

/**
 * Splits `text` into segments highlighting matched whole words from `query`
 * while honoring Smart Diacritics (accented queries strictly match accents;
 * unaccented queries match accent-insensitively at whole-word boundaries).
 */
export function getHighlightSegments(
  text: string,
  query: string
): HighlightSegment[] {
  const q = query.trim();
  if (!q || !text) return [{ text, matched: false }];

  // Collect candidate word matchers (including bi-directional word synonyms)
  const rawTokens = tokenizeWords(q).filter((tk) => tk.length >= 1);
  if (rawTokens.length === 0) return [{ text, matched: false }];

  const tokenMatchers: Array<{ token: string; strict: boolean }> = [];
  for (const tk of rawTokens) {
    const strict = hasVietnameseDiacritics(tk);
    tokenMatchers.push({ token: tk, strict });
    for (const v of buildTokenVariants(tk, strict)) {
      for (const vw of tokenizeWords(v)) {
        tokenMatchers.push({
          token: vw,
          strict: strict && hasVietnameseDiacritics(vw),
        });
      }
    }
  }

  // Walk `text` by word & non-word chunks so Unicode word boundaries are 100% preserved
  const parts = text.split(/([^\p{L}\p{N}]+)/u).filter(Boolean);
  const segments: HighlightSegment[] = [];

  for (const part of parts) {
    const isWord = /\p{L}|\p{N}/u.test(part);
    if (!isWord) {
      const prev = segments[segments.length - 1];
      if (prev && !prev.matched) prev.text += part;
      else segments.push({ text: part, matched: false });
      continue;
    }

    const partNfc = toLowerNFC(part);
    const partAscii = stripAccents(part);
    const isMatch = tokenMatchers.some(({ token, strict }) =>
      strict ? partNfc === toLowerNFC(token) : partAscii === stripAccents(token)
    );

    const prev = segments[segments.length - 1];
    if (prev && prev.matched === isMatch) {
      prev.text += part;
    } else {
      segments.push({ text: part, matched: isMatch });
    }
  }

  return segments;
}

const COMPLEX_TIER2_PATTERNS: RegExp[] = [
  /[?？]/,
  /\b(?:mấy|may|bao nhiêu|bao nhieu|bao lâu|bao lau|khi nào|khi nao|thế nào|the nao|như thế nào|nhu the nao|ra sao|tại sao|tai sao|vì sao|vi sao|làm sao|lam sao)\b/iu,
  /\b(?:so sánh|so sanh|khác nhau|khac nhau|khác gì|khac gi|phân biệt|phan biet|tốt hơn|tot hon|nên|nen)\b/iu,
  /\b(?:rã đông|ra dong|hâm nóng|ham nong|làm nguội|lam nguoi|cộng dồn|cong don|ghi nhãn|ghi nhan|xếp tủ|xep tu|sống chín|song chin)\b/iu,
  /\b(?:quy trình|quy trinh|quy định|quy dinh|nguyên tắc|nguyen tac|điều|dieu|mục|muc|hướng dẫn|huong dan)\b/iu,
  /\b(?:mở nắp|mo nap|mở bao|mo bao|mở bịch|mo bich|mở gói|mo goi|mở hộp|mo hop|chưa mở|chua mo|nguyên bao|nguyen bao|lấy ra|lay ra|để ngoài|de ngoai|bảo quản|bao quan|để được|de duoc|hạn|han|nhiệt độ|nhiet do)\b/iu,
  /\b(?:chào|chao|cảm ơn|cam on|tư vấn|tu van|giải thích|giai thich|chi tiết|chi tiet|vậy còn|vay con|thế còn|the con|còn nếu|con neu|trường hợp|truong hop)\b/iu,
  /\b(?:how|what|why|when|compare|difference|thaw|defrost|reheat|label|opened|unopened|hello|hi|thank|explain)\b/iu,
];

/**
 * Two-Tier Routing Classifier:
 * - Tier 1 (0 Token, <0.01s): Short pure item/code lookups when catalog matches locally.
 * - Tier 2 (Gemini API): Complex questions, comparisons, thawing/SOP logic, conversations,
 *   follow-up pronouns, or queries with 0 Tier-1 matches.
 */
export function shouldRouteToGeminiTier2(
  rawQuery: string,
  tier1MatchedCount: number,
  hasPriorConversation: boolean
): boolean {
  const q = rawQuery.trim();
  if (!q) return false;
  if (tier1MatchedCount === 0) return true;

  const words = tokenizeWords(q);
  if (words.length >= 5) return true;

  for (const rx of COMPLEX_TIER2_PATTERNS) {
    if (rx.test(q)) return true;
  }

  if (
    hasPriorConversation &&
    /\b(?:nó|no|đó|do|vậy|vay|thế|the|còn|con|này|nay|trên|tren)\b/iu.test(q)
  ) {
    return true;
  }

  return false;
}
