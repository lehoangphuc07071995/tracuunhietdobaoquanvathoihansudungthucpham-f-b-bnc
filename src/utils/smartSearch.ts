import { getItemCode, hasCellValue, hasUseToday, isEmptyCell } from '../data/foodData';
import { translateGroup, translateItemName, translateItemNote } from '../data/translations';
import type { FoodItem, Lang } from '../types';

const COMPOUND_REPLACEMENTS: Array<[RegExp, string]> = [
  [/so\s*co\s*la|sô\s*cô\s*la/g, 'socola'],
  [/pho\s*mai/g, 'phomai'],
  [/banh\s*m[iy]/g, 'banhmi'],
  [/ca\s*phe/g, 'caphe'],
  [/tra\s*sua/g, 'trasua'],
  [/ca\s*hoi/g, 'cahoi'],
  [/thit\s*bo/g, 'thitbo'],
  [/thit\s*heo/g, 'thitheo'],
  [/thit\s*ga/g, 'thitga'],
  [/hai\s*san/g, 'haisan'],
  [/thuy\s*san/g, 'thuysan'],
  [/ruou\s*vang/g, 'ruouvang'],
  [/dau\s*hu/g, 'dauhu'],
  [/sua\s*tuoi/g, 'suatuoi'],
  [/kem\s*tuoi/g, 'kemtuoi'],
  [/banh\s*ngot/g, 'banhngot'],
  [/banh\s*quy/g, 'banhquy'],
  [/banh\s*can/g, 'banhcan'],
  [/banh\s*man/g, 'banhman'],
  [/sung\s*bo/g, 'sungbo'],
  [/trai\s*cay/g, 'traicay'],
  [/nho\s*kho/g, 'nhokho'],
  [/nhiet\s*do\s*phong/g, 'nhietdophong'],
  [/trong\s*ngay/g, 'trongngay'],
  [/ra\s*dong/g, 'radong'],
  [/cap\s*dong|kho\s*dong|tu\s*dong/g, 'khodong'],
  [/tu\s*mat|kho\s*mat|kho\s*lanh|tu\s*lanh/g, 'kholanh'],
  [/trung\s*bay\s*nong/g, 'trungbaynong'],
  [/trung\s*bay\s*lanh/g, 'trungbaylanh'],
  [/hut\s*chan\s*khong/g, 'hutchankhong'],
];

const SEARCH_SYNONYMS: Record<string, string> = {
  // Chocolate / Cocoa
  chocolate: 'socola',
  chocolat: 'socola',
  cacao: 'socola',
  cocoa: 'socola',
  choco: 'socola',
  // Dairy & Cheese
  cheese: 'phomai',
  mascarpone: 'phomai',
  cheddar: 'phomai',
  mozzarella: 'phomai',
  mozzarela: 'phomai',
  parmesan: 'phomai',
  creamcheese: 'phomai',
  butter: 'bo',
  whipping: 'kem',
  cream: 'kem',
  milk: 'sua',
  yogurt: 'suachua',
  yoghurt: 'suachua',
  egg: 'trung',
  eggs: 'trung',
  // Coffee / Tea / Drinks
  cafe: 'caphe',
  coffee: 'caphe',
  espresso: 'caphe',
  tea: 'tra',
  matcha: 'tra',
  oolong: 'tra',
  wine: 'ruou',
  alcohol: 'ruou',
  liquor: 'ruou',
  spirits: 'ruou',
  liqueur: 'ruou',
  syrup: 'siro',
  puree: 'sinhto',
  juice: 'nuocep',
  // Tofu & Meat & Seafood
  tofu: 'dauhu',
  beef: 'thitbo',
  wagyu: 'thitbo',
  steak: 'thitbo',
  tenderloin: 'thitbo',
  ribeye: 'thitbo',
  pork: 'thitheo',
  bacon: 'thitheo',
  ham: 'thitheo',
  sausage: 'xucxich',
  chicken: 'thitga',
  poultry: 'giacam',
  duck: 'vit',
  salmon: 'cahoi',
  shrimp: 'tom',
  prawn: 'tom',
  prawns: 'tom',
  seafood: 'haisan',
  fish: 'ca',
  squid: 'muc',
  octopus: 'bachtuoc',
  crab: 'cua',
  oyster: 'hau',
  // Bakery & Pastry
  bread: 'banhmi',
  baguette: 'banhmi',
  sandwich: 'banhmi',
  ciabatta: 'banhmi',
  toast: 'banhmi',
  croissant: 'sungbo',
  danish: 'banhcan',
  viennoiserie: 'banhcan',
  brioche: 'banhcan',
  cake: 'banhngot',
  pastry: 'banhngot',
  pastries: 'banhngot',
  tiramisu: 'banhngot',
  mousse: 'banhngot',
  cheesecake: 'banhngot',
  brownie: 'banhngot',
  eclair: 'banhngot',
  tart: 'banhngot',
  macaron: 'macaron',
  cookie: 'banhquy',
  biscuit: 'banhquy',
  biscuits: 'banhquy',
  icecream: 'kem',
  gelato: 'kem',
  sorbet: 'kem',
  savory: 'banhman',
  quiche: 'banhman',
  pie: 'banhman',
  // Sauces & Flavors
  sauce: 'sot',
  mayonnaise: 'mayonnaise',
  mayo: 'mayonnaise',
  mustard: 'mutat',
  vanilla: 'vani',
  strawberry: 'dau',
  mango: 'xoai',
  blueberry: 'vietquat',
  raspberry: 'phucbontu',
  passionfruit: 'chanhday',
  fig: 'sung',
  raisin: 'nhokho',
  raisins: 'nhokho',
  // Storage & Hygiene
  frozen: 'khodong',
  freeze: 'khodong',
  freezer: 'khodong',
  chilled: 'kholanh',
  chill: 'kholanh',
  fridge: 'kholanh',
  cooler: 'kholanh',
  ambient: 'nhietdophong',
  room: 'nhietdophong',
  thaw: 'radong',
  thawing: 'radong',
  defrost: 'radong',
  vacuum: 'hutchankhong',
  conflict: 'qa',
};

export function normalizeText(s: string): string {
  let out = s
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

function scoreTokenAgainst(qt: string, tokens: string[]): number {
  let best = 0;
  for (const tk of tokens) {
    if (tk === qt) best = Math.max(best, 100);
    else if (tk.indexOf(qt) === 0 && qt.length >= 2) best = Math.max(best, 88);
    else if (tk.includes(qt) && qt.length >= 3) best = Math.max(best, 72);
    else if (
      qt.length >= 5 &&
      tk.length >= 5 &&
      tk[0] === qt[0] &&
      levenshtein(qt, tk) <= (qt.length >= 7 ? 2 : 1)
    ) {
      best = Math.max(best, 54);
    }
  }
  return best;
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

  // AI rank map (earlier in array = higher relevance)
  const aiRankMap = new Map<string, number>();
  aiMatchedCodes.forEach((code, idx) => {
    aiRankMap.set(code.toUpperCase(), idx);
  });

  // Detect explicit hygiene/storage intents in the query
  const wantsUseToday =
    qNorm.includes('trongngay') || qNorm.includes('today') || qNorm.includes('sameday');
  const wantsQa =
    qNorm.includes('qa') || qNorm.includes('mauthuan') || qNorm.includes('xacnhan');
  const wantsHotDisplay =
    qNorm.includes('trungbaynong') || qNorm.includes('hotdisplay') || qNorm.includes('30-40');
  const wantsColdDisplay =
    qNorm.includes('trungbaylanh') || qNorm.includes('colddisplay');
  const wantsFreeze =
    qNorm.includes('khodong') || qNorm.includes('-18');
  const wantsCool =
    qNorm.includes('kholanh') || qNorm.includes('1-4') || qNorm.includes('0-4');
  const wantsRoom = qNorm.includes('nhietdophong');

  const scored: Array<{ item: FoodItem; score: number; len: number }> = [];

  for (const item of items) {
    const code = getItemCode(item);
    const displayName = translateItemName(item, lang);
    const aiRank = aiRankMap.get(code.toUpperCase());

    // 1. Direct Item Code Match (e.g. "PL1-65", "PL3 02", "65")
    const normalizedCode = code.toUpperCase();
    const numericMatch = /^\d{1,2}$/.test(compactQ) && String(item.n) === String(Number(compactQ));
    if (
      normalizedCode === compactQ ||
      normalizedCode.replace('-', '') === compactQ.replace('-', '') ||
      numericMatch
    ) {
      scored.push({
        item,
        score: normalizedCode.replace('-', '') === compactQ.replace('-', '') ? 300 : 185,
        len: displayName.length,
      });
      continue;
    }

    // 2. Bilingual Name + English Name + Localized Name token scoring
    const namePool = `${displayName} ${item.name} ${item.enName || ''}`;
    const nameNorm = normalizeText(namePool);
    const nameTokens = tokenizeTarget(nameNorm);
    const perTokenScores = queryTokens.map((qt) => scoreTokenAgainst(qt, nameTokens));
    const allNameTokensPass =
      queryTokens.length > 0 && perTokenScores.every((s) => s >= 54);

    if (allNameTokensPass) {
      const avg =
        perTokenScores.reduce((acc, v) => acc + v, 0) / perTokenScores.length;
      let bonus = 0;
      if (nameNorm.includes(qNorm)) bonus += 38;
      if (nameTokens[0] === queryTokens[0]) bonus += 14;
      if (aiRank !== undefined) bonus += Math.max(8, 30 - aiRank * 2);
      bonus += Math.max(0, 10 - Math.abs(displayName.length - q.length) / 8);
      scored.push({ item, score: avg + bonus, len: displayName.length });
      continue;
    }

    // 3. Group Phrase Fallback
    const joinedQ = queryTokens.join(' ');
    const groupNorm = normalizeText(
      `${translateGroup(item.g, lang)} ${item.g}`
    );
    if (joinedQ.length >= 2 && groupNorm.includes(joinedQ)) {
      const aiBonus = aiRank !== undefined ? Math.max(6, 24 - aiRank) : 0;
      scored.push({ item, score: 52 + aiBonus, len: displayName.length });
      continue;
    }

    // 4. Hygiene / Storage / Note / QA Intent Matching
    let hygieneScore = 0;
    if (wantsUseToday && hasUseToday(item)) hygieneScore = Math.max(hygieneScore, 50);
    if (wantsQa && item.flag) hygieneScore = Math.max(hygieneScore, 55);
    if (
      wantsHotDisplay &&
      item.displayHot &&
      item.displayHot !== '—' &&
      item.displayHot !== '-'
    ) {
      hygieneScore = Math.max(hygieneScore, 48);
    }
    if (wantsColdDisplay && item.displayCool && item.displayCool !== '—') {
      hygieneScore = Math.max(hygieneScore, 48);
    }
    if (wantsFreeze && hasCellValue(item.freeze)) hygieneScore = Math.max(hygieneScore, 44);
    if (wantsCool && hasCellValue(item.cool)) hygieneScore = Math.max(hygieneScore, 44);
    if (wantsRoom && hasCellValue(item.room)) hygieneScore = Math.max(hygieneScore, 44);

    if (hygieneScore === 0 && qNorm.length >= 4) {
      const storageAndNotePool = normalizeText(
        `${item.room} ${item.cool} ${item.freeze} ${item.displayCool || ''} ${item.displayHot || ''} ${isEmptyCell(item.note) ? '' : `${item.note} ${translateItemNote(item, lang)}`} ${item.flag}`
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
        }
      }
    }

    if (hygieneScore > 0) {
      const aiBonus = aiRank !== undefined ? Math.max(10, 32 - aiRank * 2) : 0;
      scored.push({ item, score: hygieneScore + aiBonus, len: displayName.length });
      continue;
    }

    // 5. Pure AI Semantic Match (e.g. "nguyên liệu làm tiramisu", "rã đông giữ được mấy ngày")
    if (aiRank !== undefined) {
      scored.push({
        item,
        score: Math.max(35, 85 - aiRank * 2),
        len: displayName.length,
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.len !== b.len) return a.len - b.len;
    return a.item.a === b.item.a
      ? a.item.n - b.item.n
      : a.item.a < b.item.a
        ? -1
        : 1;
  });

  return scored.map((entry) => entry.item);
}
