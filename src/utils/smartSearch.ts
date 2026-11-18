import {
  getItemCode,
  hasCellValue,
  hasUseToday,
  isEmptyCell,
  isNoFreezeCell,
} from '../data/foodData';
import {
  translateGroup,
  translateItemName,
  translateItemNote,
} from '../data/translations';
import type { FoodItem, Lang } from '../types';

const COMPOUND_REPLACEMENTS: Array<[RegExp, string]> = [
  [/so\s*co\s*la|sô\s*cô\s*la/g, 'socola'],
  [/pho\s*mai/g, 'phomai'],
  [/banh\s*m[iy]/g, 'banhmi'],
  [/banh\s*bao/g, 'banhbao'],
  [/banh\s*kem/g, 'banhkem'],
  [/banh\s*ngot/g, 'banhngot'],
  [/banh\s*quy/g, 'banhquy'],
  [/banh\s*cuon/g, 'banhcuon'],
  [/ha\s*cao/g, 'hacao'],
  [/ca\s*phe/g, 'caphe'],
  [/ca\s*hoi/g, 'cahoi'],
  [/thit\s*bo/g, 'thitbo'],
  [/thit\s*heo/g, 'thitheo'],
  [/thit\s*ga/g, 'thitga'],
  [/thit\s*xay/g, 'thitxay'],
  [/gia\s*cam/g, 'giacam'],
  [/hai\s*san/g, 'haisan'],
  [/thuy\s*san/g, 'thuysan'],
  [/gio\s*cha/g, 'giocha'],
  [/cha\s*lua/g, 'chalua'],
  [/dau\s*hu|dau\s*phu/g, 'dauhu'],
  [/sua\s*tuoi/g, 'suatuoi'],
  [/sua\s*dac/g, 'suadac'],
  [/sua\s*chua/g, 'suachua'],
  [/kem\s*tuoi/g, 'kemtuoi'],
  [/long\s*do/g, 'longdo'],
  [/long\s*trang/g, 'longtrang'],
  [/trai\s*cay/g, 'traicay'],
  [/rau\s*cu/g, 'raucu'],
  [/khoai\s*tay/g, 'khoaitay'],
  [/com\s*trang/g, 'comtrang'],
  [/nuoc\s*cot\s*dua|cot\s*dua/g, 'cotdua'],
  [/nuoc\s*ep/g, 'nuocep'],
  [/nuoc\s*mam/g, 'nuocmam'],
  [/nuoc\s*tuong/g, 'nuoctuong'],
  [/dau\s*an/g, 'dauan'],
  [/bap\s*rang\s*bo/g, 'baprangbo'],
  [/yen\s*mach/g, 'yenmach'],
  [/nhiet\s*do\s*phong|15\s*[-–]\s*25/g, 'nhietdophong'],
  [/nhiet\s*do\s*lanh|tu\s*mat|kho\s*mat|kho\s*lanh|tu\s*lanh|0\s*[-–]\s*5/g, 'kholanh'],
  [/khong\s*cap\s*dong/g, 'khongcapdong'],
  [/nhiet\s*do\s*dong|cap\s*dong|kho\s*dong|tu\s*dong|-?\s*18/g, 'khodong'],
  [/trong\s*ngay|theo\s*gio/g, 'trongngay'],
  [/ra\s*dong/g, 'radong'],
  [/hut\s*chan\s*khong/g, 'hutchankhong'],
  [/\b(?:unsalted|salted|melted)\s*butter\b/g, 'butter'],
  [/\bbo\s*(?:lat|man|nhat|thuc\s*vat|anchor|president)\b/g, 'bo'],
];

const SEARCH_SYNONYMS: Record<string, string> = {
  // Dairy & Egg
  cheese: 'phomai',
  mascarpone: 'phomai',
  cheddar: 'phomai',
  mozzarella: 'phomai',
  parmesan: 'phomai',
  brie: 'phomai',
  feta: 'phomai',
  gouda: 'phomai',
  camembert: 'phomai',
  ricotta: 'phomai',
  creamcheese: 'phomai',
  butter: 'bo',
  margarine: 'bo',
  whipping: 'kem',
  cream: 'kem',
  gelato: 'kem',
  sorbet: 'kem',
  icecream: 'kem',
  milk: 'sua',
  yogurt: 'suachua',
  yoghurt: 'suachua',
  egg: 'trung',
  eggs: 'trung',
  // Chocolate / Bakery / Flour
  chocolate: 'socola',
  cocoa: 'socola',
  cacao: 'socola',
  bread: 'banhmi',
  baguette: 'banhmi',
  sandwich: 'banhmi',
  sourdough: 'banhmi',
  focaccia: 'banhmi',
  brioche: 'banhmi',
  bagel: 'banhmi',
  danish: 'banhmi',
  pastry: 'banhngot',
  cake: 'banhngot',
  mousse: 'banhngot',
  tiramisu: 'banhngot',
  muffin: 'banhngot',
  brownie: 'banhngot',
  macaron: 'banhngot',
  flan: 'banhngot',
  pudding: 'banhngot',
  cookie: 'banhquy',
  biscuit: 'banhquy',
  flour: 'bot',
  cereal: 'ngucoc',
  oats: 'yenmach',
  popcorn: 'baprangbo',
  // Meat / Poultry / Seafood
  beef: 'thitbo',
  lamb: 'cuu',
  pork: 'thitheo',
  bacon: 'thitheo',
  ham: 'jambon',
  jambon: 'jambon',
  sausage: 'xucxich',
  chicken: 'thitga',
  duck: 'vit',
  poultry: 'giacam',
  salmon: 'cahoi',
  fish: 'ca',
  shrimp: 'tom',
  prawn: 'tom',
  seafood: 'haisan',
  shellfish: 'nhuyenthe',
  oyster: 'hau',
  sashimi: 'sashimi',
  sushi: 'sushi',
  // Produce / Rice / Noodles / Dry / Condiments / Beverages
  vegetable: 'raucu',
  vegetables: 'raucu',
  lettuce: 'xalach',
  cucumber: 'dualeo',
  tomato: 'cachua',
  onion: 'hanhtay',
  garlic: 'toi',
  herb: 'rauthom',
  herbs: 'rauthom',
  salad: 'xalach',
  fruit: 'traicay',
  fruits: 'traicay',
  pineapple: 'dua',
  mango: 'xoai',
  apple: 'tao',
  orange: 'cam',
  lemon: 'chanh',
  strawberry: 'dautay',
  potato: 'khoaitay',
  rice: 'com',
  sticky: 'xoi',
  porridge: 'chao',
  noodle: 'mi',
  noodles: 'mi',
  pasta: 'mi',
  vermicelli: 'bun',
  pho: 'pho',
  tofu: 'dauhu',
  juice: 'nuocep',
  smoothie: 'sinhto',
  syrup: 'siro',
  jam: 'mut',
  coffee: 'caphe',
  espresso: 'caphe',
  latte: 'caphe',
  americano: 'caphe',
  coldbrew: 'caphe',
  tea: 'tra',
  beer: 'bia',
  wine: 'ruou',
  soda: 'nuocngot',
  sauce: 'sot',
  broth: 'nuocdung',
  stock: 'nuocdung',
  soup: 'sup',
  mayo: 'mayonnaise',
  mayonnaise: 'mayonnaise',
  mayonaise: 'mayonnaise',
  mustard: 'mutat',
  ketchup: 'tuongca',
  vinegar: 'giam',
  sugar: 'duong',
  salt: 'muoi',
  pepper: 'tieu',
  oil: 'dauan',
  spice: 'giavi',
  spices: 'giavi',
  honey: 'matong',
  coconut: 'cotdua',
  kimchi: 'kimchi',
  squid: 'muc',
  crab: 'cua',
  octopus: 'bachuot',
  croissant: 'banhsungbo',
  custard: 'kemtrung',
  // Storage conditions
  frozen: 'khodong',
  freeze: 'khodong',
  freezer: 'khodong',
  nofreeze: 'khongcapdong',
  chilled: 'kholanh',
  chill: 'kholanh',
  fridge: 'kholanh',
  cooler: 'kholanh',
  ambient: 'nhietdophong',
  room: 'nhietdophong',
  today: 'trongngay',
  defrost: 'radong',
  thaw: 'radong',
  thawed: 'radong',
  reheat: 'hamnong',
  cooling: 'lamnguoi',
  vacuum: 'hutchankhong',
};

export function normalizeText(s: string): string {
  let out = s
    .replace(/(^|[^\p{L}])m[ỳýỷỹỵ](?=$|[^\p{L}])/gu, '$1mi')
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
  for (const [pattern, replacement] of COMPOUND_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

const SYNONYM_KEYS = Object.keys(SEARCH_SYNONYMS);

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

function resolveSynonym(word: string): string {
  if (SEARCH_SYNONYMS[word]) return SEARCH_SYNONYMS[word];
  if (word.length >= 5) {
    const maxDist = word.length >= 7 ? 2 : 1;
    for (const key of SYNONYM_KEYS) {
      if (
        key.length >= 5 &&
        key[0] === word[0] &&
        Math.abs(key.length - word.length) <= maxDist &&
        levenshtein(word, key) <= maxDist
      ) {
        return SEARCH_SYNONYMS[key];
      }
    }
  }
  return word;
}

function tokenizeQuery(normalized: string): string[] {
  return normalized
    .split(/[\s\-_\/.,;():°≤≥]+/)
    .filter(Boolean)
    .map(resolveSynonym);
}

function tokenizeTarget(normalized: string): string[] {
  const raw = normalized
    .split(/[\s\-_\/.,;():°≤≥]+/)
    .filter(Boolean);
  const expanded: string[] = [];
  for (const w of raw) {
    expanded.push(w);
    const syn = SEARCH_SYNONYMS[w];
    if (syn && syn !== w) expanded.push(syn);
  }
  return expanded;
}

function scoreTokenAgainst(qt: string, tokens: string[]): number {
  let best = 0;
  for (const tk of tokens) {
    if (tk === qt) best = Math.max(best, 100);
    else if (tk.indexOf(qt) === 0 && qt.length >= 3) best = Math.max(best, 88);
    else if (tk.includes(qt) && qt.length >= 3) best = Math.max(best, 72);
    else if (
      qt.length >= 4 &&
      tk.length >= 4 &&
      tk[0] === qt[0] &&
      levenshtein(qt, tk) <= (qt.length >= 7 ? 2 : 1)
    ) {
      best = Math.max(best, 54);
    }
  }
  return best;
}

function hasUnicodeWord(raw: string, wordWithAccent: string): boolean {
  try {
    return new RegExp(`(^|[^\\p{L}])${wordWithAccent}(?=$|[^\\p{L}])`, 'iu').test(raw);
  } catch {
    return raw.toLowerCase().includes(wordWithAccent.toLowerCase());
  }
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
  const q = query.trim();
  if (!q) return items;

  const qNorm = normalizeText(q);
  const queryTokens = tokenizeQuery(qNorm);
  const compactQ = q.toUpperCase().replace(/\s+/g, '');

  const hasButterAccent = hasUnicodeWord(q, 'bơ');
  const hasBeefAccent = hasUnicodeWord(q, 'bò');
  const hasPineappleAccent = hasUnicodeWord(q, 'dứa');
  const hasCoconutAccent = hasUnicodeWord(q, 'dừa');

  // AI rank map (earlier in array = higher relevance)
  const aiRankMap = new Map<string, number>();
  aiMatchedCodes.forEach((code, idx) => {
    aiRankMap.set(code.toUpperCase(), idx);
  });

  // Detect explicit SHE storage intents
  const wantsUseToday =
    qNorm.includes('trongngay') || qNorm.includes('today') || qNorm.includes('8gio') || qNorm.includes('4gio');
  const wantsNoFreeze =
    qNorm.includes('khongcapdong') || qNorm.includes('khongduoccapdong');
  const wantsFreeze = !wantsNoFreeze && qNorm.includes('khodong');
  const wantsCool = qNorm.includes('kholanh');
  const wantsRoom = qNorm.includes('nhietdophong');

  const scored: Array<{ item: FoodItem; score: number; len: number }> = [];
  const headFallbackScored: Array<{ item: FoodItem; score: number; len: number }> = [];

  for (const item of items) {
    const code = getItemCode(item);
    const displayName = translateItemName(item, lang);
    const aiRank = aiRankMap.get(code.toUpperCase());

    const rawTextPool = `${item.name} ${item.g} ${(item.keywords || []).join(' ')}`;
    if (hasButterAccent && !hasBeefAccent && hasUnicodeWord(rawTextPool, 'bò') && !hasUnicodeWord(rawTextPool, 'bơ')) {
      continue;
    }
    if (hasBeefAccent && !hasButterAccent && hasUnicodeWord(rawTextPool, 'bơ') && !hasUnicodeWord(rawTextPool, 'bò')) {
      continue;
    }
    if (hasPineappleAccent && !hasCoconutAccent && hasUnicodeWord(rawTextPool, 'dừa') && !hasUnicodeWord(rawTextPool, 'dứa')) {
      continue;
    }
    if (hasCoconutAccent && !hasPineappleAccent && hasUnicodeWord(rawTextPool, 'dứa') && !hasUnicodeWord(rawTextPool, 'dừa')) {
      continue;
    }

    // 1. Direct SHE Item Code Match (e.g. "SHE-23", "SHE 23", "23")
    const normalizedCode = code.toUpperCase();
    const compactSheNoDash = normalizedCode.replace('-', '');
    const numericMatch =
      /^\d{1,2}$/.test(compactQ) && String(item.n) === String(Number(compactQ));
    if (
      normalizedCode === compactQ ||
      compactSheNoDash === compactQ.replace('-', '') ||
      numericMatch
    ) {
      scored.push({
        item,
        score:
          normalizedCode === compactQ ||
          compactSheNoDash === compactQ.replace('-', '')
            ? 300
            : 185,
        len: displayName.length,
      });
      continue;
    }

    // 2. Bilingual Name + English Name + SHE Keywords + Custom Columns token scoring
    const queryHasKhong = queryTokens.includes('khong') || qNorm.includes('khong');
    const cleanViName = queryHasKhong
      ? item.name
      : item.name.replace(/\(\s*không[^)]*\)/gi, ' ');
    const enTranslatedName = translateItemName(item, 'EN');
    const kwStr = (item.keywords || []).join(' ');
    const customStr = item.customFields
      ? Object.values(item.customFields).join(' ')
      : '';
    const namePool = `${displayName} ${cleanViName} ${enTranslatedName} ${item.enName || ''} ${kwStr} ${customStr}`;
    const nameNorm = normalizeText(namePool);
    const nameTokens = tokenizeTarget(nameNorm);
    const perTokenScores = queryTokens.map((qt) =>
      scoreTokenAgainst(qt, nameTokens)
    );
    const allNameTokensPass =
      queryTokens.length > 0 && perTokenScores.every((s) => s >= 54);

    if (allNameTokensPass) {
      const avg =
        perTokenScores.reduce((acc, v) => acc + v, 0) / perTokenScores.length;
      let bonus = 0;
      const coreNameNorm = normalizeText(`${displayName} ${cleanViName} ${enTranslatedName}`);
      if (coreNameNorm.includes(qNorm)) bonus += 42;
      else if (nameNorm.includes(qNorm)) bonus += 28;
      if (nameTokens[0] === queryTokens[0]) bonus += 14;
      if (aiRank !== undefined) bonus += Math.max(8, 30 - aiRank * 2);
      bonus += Math.max(0, 10 - Math.abs(displayName.length - q.length) / 8);
      scored.push({ item, score: avg + bonus, len: displayName.length });
      continue;
    }

    // 2b. Partial Multi-Token High-Overlap Fallback (>= 60% of tokens with min 2 hits)
    if (queryTokens.length >= 2) {
      const strongHits = perTokenScores.filter((s) => s >= 70);
      const hitRatio = strongHits.length / queryTokens.length;
      if (strongHits.length >= 2 && hitRatio >= 0.6) {
        const avgHit =
          strongHits.reduce((acc, v) => acc + v, 0) / strongHits.length;
        const aiBonus = aiRank !== undefined ? Math.max(8, 28 - aiRank * 2) : 0;
        scored.push({
          item,
          score: avgHit * 0.72 * hitRatio + aiBonus,
          len: displayName.length,
        });
        continue;
      }
    }

    // 3. Group Phrase Fallback (localized + VI + EN group)
    const joinedQ = queryTokens.join(' ');
    const groupNorm = normalizeText(
      `${translateGroup(item.g, lang)} ${translateGroup(item.g, 'EN')} ${item.g}`
    );
    const groupWords = tokenizeTarget(groupNorm);
    const groupMatchesPhrase =
      joinedQ.length >= 2 &&
      (joinedQ.length <= 4
        ? groupWords.includes(joinedQ)
        : new RegExp(
            `(?:^|[\\s/(),.-])${joinedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\\s/(),.-])`
          ).test(groupNorm));
    if (groupMatchesPhrase) {
      const aiBonus = aiRank !== undefined ? Math.max(6, 24 - aiRank) : 0;
      scored.push({ item, score: 52 + aiBonus, len: displayName.length });
      continue;
    }

    // 4. Storage / Note / NoFreeze Intent Matching
    let hygieneScore = 0;
    if (wantsUseToday && hasUseToday(item)) hygieneScore = Math.max(hygieneScore, 52);
    if (wantsNoFreeze && isNoFreezeCell(item.freeze)) hygieneScore = Math.max(hygieneScore, 52);
    if (wantsFreeze && hasCellValue(item.freeze)) hygieneScore = Math.max(hygieneScore, 46);
    if (wantsCool && hasCellValue(item.cool)) hygieneScore = Math.max(hygieneScore, 46);
    if (wantsRoom && hasCellValue(item.room)) hygieneScore = Math.max(hygieneScore, 46);

    if (hygieneScore === 0 && qNorm.length >= 3) {
      const noteText = isEmptyCell(item.note)
        ? ''
        : `${item.note} ${translateItemNote(item, lang)}`;
      const extraMeta = [
        item.standardTemp || '',
        item.packagingSpec || '',
        item.shelfLifeUnopened || '',
        item.shelfLifeOpened || '',
        customStr,
      ].join(' ');
      const storageAndNotePool = normalizeText(
        `${item.room} ${item.cool} ${item.freeze} ${noteText} ${item.flag} ${extraMeta}`
      );
      if (storageAndNotePool.includes(qNorm)) {
        hygieneScore = 46;
      } else if (queryTokens.length >= 2) {
        const metaTokens = tokenizeTarget(storageAndNotePool);
        const combinedTokens = [...nameTokens, ...metaTokens];
        const crossScores = queryTokens.map((qt) =>
          scoreTokenAgainst(qt, combinedTokens)
        );
        if (crossScores.every((s) => s >= 70)) {
          hygieneScore = 45;
        } else {
          const hitCount = crossScores.filter((s) => s >= 70).length;
          if (hitCount >= 2 && hitCount / queryTokens.length >= 0.65) {
            hygieneScore = 41;
          }
        }
      }
    }

    if (hygieneScore > 0) {
      const aiBonus = aiRank !== undefined ? Math.max(10, 32 - aiRank * 2) : 0;
      scored.push({ item, score: hygieneScore + aiBonus, len: displayName.length });
      continue;
    }

    // 5. Pure AI Semantic Match
    if (aiRank !== undefined) {
      scored.push({
        item,
        score: Math.max(35, 85 - aiRank * 2),
        len: displayName.length,
      });
      continue;
    }

    // 6. Primary Head-Noun Variant Fallback (only used if strict tiers yield 0 results, e.g. "bơ lạt", "trứng cút")
    if (queryTokens.length >= 2) {
      const genericSkip = new Set(['cac', 'loai', 'do', 'thuc', 'pham', 'che', 'bien', 'khong', 'co', 'da', 'chua', 'moi']);
      const headTokens = tokenizeTarget(normalizeText(cleanViName)).filter((t) => !genericSkip.has(t));
      const matchedHeadCount = queryTokens.filter(
        (qt) => qt.length >= 2 && !genericSkip.has(qt) && (headTokens[0] === qt || (item.keywords || []).some((kw) => normalizeText(kw) === qt))
      ).length;
      if (matchedHeadCount >= 1) {
        headFallbackScored.push({
          item,
          score: 36 + matchedHeadCount * 4,
          len: displayName.length,
        });
      }
    }
  }

  const finalResults = scored.length > 0 ? scored : headFallbackScored;

  finalResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.len !== b.len) return a.len - b.len;
    return (a.item.order ?? a.item.n) - (b.item.order ?? b.item.n);
  });

  return finalResults.map((entry) => entry.item);
}
