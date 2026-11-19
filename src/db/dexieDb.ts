import Dexie, { type Table } from 'dexie';
import { FOOD_ITEMS, getItemCode } from '../data/foodData';
import type {
  AdminUser,
  AiHistoryEntry,
  FoodItem,
  Lang,
  SearchHistoryEntry,
  SystemConfig,
  ViewStatEntry,
} from '../types';

export interface StoredFoodRecord extends FoodItem {
  code: string;
}

export interface DbMetaEntry {
  key: string;
  value: string;
}

// Precomputed SHA-256 hex digest of default Super Admin passcode (no plaintext stored)
const DEFAULT_SUPER_ADMIN_HASH =
  '137051d2738559de3325416cbb65a14c74775923e4c42e43c933d55f384e9037';
const BASELINE_VERSION = 'she-qd-fb13-v00-20261112';

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  id: 'system',
  appTitle: 'QUY ĐỊNH BẢO QUẢN VÀ HẠN SỬ DỤNG THỰC PHẨM TẠI KHỐI SHE',
  appSubtitle: 'QUYẾT ĐỊNH 107/2026/QĐ-SHE/SG · MÃ HIỆU SHE-QĐ-FB13 (PB 00)',
  mobileTitleLine1: 'TRA CỨU BẢO QUẢN & HSD THỰC PHẨM',
  mobileTitleLine2: 'KHỐI SHE · QĐ 107/2026 (SHE-QĐ-FB13)',
  logoUrl: '',
  bannerImageUrl: '',
  alertBannerText: '',
  alertBannerEnabled: false,
  appLocked: false,
  appLockMessage: '',
  appLockPin: '',
  customColumns: [],
  autoSyncCloud: true,
  footerLeftText:
    'HỆ THỐNG TRA CỨU NỘI BỘ - BAN ẨM THỰC - SUN WORLD BA NA HILLS',
  footerRightText: 'Developed by Le Hoang Phuc',
  aiAssistantEnabled: true,
  updatedAt: 0,
};

export async function hashPasswordSha256(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Minimal deterministic SHA-256 pure-TS fallback for insecure/non-HTTPS contexts
  return sha256Fallback(input);
}

function sha256Fallback(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = true;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const bytes = Array.from(new TextEncoder().encode(ascii));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) - 56) bytes.push(0);
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << (((3 - i) % 4) * 8);
  }
  words[words.length] = (bitLen / maxWord) | 0;
  words[words.length] = bitLen | 0;
  void asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

class SheFoodDatabase extends Dexie {
  items!: Table<StoredFoodRecord, string>;
  config!: Table<SystemConfig, string>;
  users!: Table<AdminUser, string>;
  searchLogs!: Table<SearchHistoryEntry, number>;
  viewStats!: Table<ViewStatEntry, string>;
  aiLogs!: Table<AiHistoryEntry, number>;
  meta!: Table<DbMetaEntry, string>;

  constructor() {
    super('BncFoodLookupDB');
    this.version(1).stores({
      items: 'code, a, g, n, name, updatedAt',
      config: 'id',
      users: 'id, &username, role',
      searchLogs: '++id, keyword, timestamp',
      viewStats: 'itemCode, viewCount, lastViewedAt',
      aiLogs: '++id, timestamp, mode',
      meta: 'key',
    });
  }
}

export const db = new SheFoodDatabase();

export function toStoredRecord(item: FoodItem): StoredFoodRecord {
  return {
    ...item,
    code: getItemCode(item),
  };
}

let initPromise: Promise<void> | null = null;

export function initializeLocalDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const existingCount = await db.items.count();
      const baselineMeta = await db.meta.get('baselineVersion');

      if (existingCount === 0) {
        await db.items.bulkPut(FOOD_ITEMS.map(toStoredRecord));
        await db.meta.put({ key: 'baselineVersion', value: BASELINE_VERSION });
      } else if (!baselineMeta || baselineMeta.value !== BASELINE_VERSION) {
        const allExisting = await db.items.toArray();
        const hasLegacyVer1 = allExisting.some((r) => (r.a as string) !== 'SHE');
        if (hasLegacyVer1) {
          // Purge all legacy Ver 1 PL1/PL2/PL3 rows and install clean SHE baseline
          const customSheItems = allExisting.filter(
            (r) => r.a === 'SHE' && r.isCustom
          );
          await db.items.clear();
          await db.items.bulkPut(FOOD_ITEMS.map(toStoredRecord));
          if (customSheItems.length > 0) {
            await db.items.bulkPut(customSheItems);
          }
          // Clean up legacy viewStats & searchLogs pointing to deleted PLx codes if desired, keeping custom SHE stats
          const legacyStatKeys = (await db.viewStats.toArray())
            .filter((vs) => (vs.appendix as string) !== 'SHE')
            .map((vs) => vs.itemCode);
          if (legacyStatKeys.length > 0) {
            await db.viewStats.bulkDelete(legacyStatKeys);
          }
        } else {
          const existingMap = new Map<string, StoredFoodRecord>();
          for (const rec of allExisting) {
            existingMap.set(rec.code, rec);
          }
          const updates: StoredFoodRecord[] = [];
          for (const baseItem of FOOD_ITEMS) {
            const code = getItemCode(baseItem);
            const current = existingMap.get(code);
            if (!current || (!current.isCustom && !current.updatedAt)) {
              updates.push(toStoredRecord(baseItem));
            }
          }
          if (updates.length > 0) {
            await db.items.bulkPut(updates);
          }
        }
        await db.meta.put({ key: 'baselineVersion', value: BASELINE_VERSION });
      }

      const configRow = await db.config.get('system');
      const isLegacyConfig =
        !configRow ||
        configRow.appSubtitle?.includes('BA NA HILLS') ||
        configRow.appSubtitle?.includes('BAN ẨM THỰC') ||
        configRow.logoUrl === '/bnc-logo.jpg';
      if (isLegacyConfig) {
        await db.config.put({ ...DEFAULT_SYSTEM_CONFIG, updatedAt: Date.now() });
      }

      const superAdmin = await db.users.get('super-admin');
      if (!superAdmin) {
        await db.users.put({
          id: 'super-admin',
          username: 'admin',
          passwordHash: DEFAULT_SUPER_ADMIN_HASH,
          role: 'super_admin',
          permissions: [
            'manage_config',
            'edit_items',
            'delete_items',
            'view_export_reports',
            'import_data',
            'lock_app',
            'manage_cloud',
          ],
          allowedGroups: ['ALL'],
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('[dexieDb] init fallback error:', err);
    }
  })();

  return initPromise;
}

export function sortCatalogItems(items: FoodItem[]): FoodItem[] {
  return [...items].sort((a, b) => {
    const ao = a.order ?? a.n;
    const bo = b.order ?? b.n;
    if (ao !== bo) return ao - bo;
    return a.a === b.a ? a.n - b.n : a.a < b.a ? -1 : 1;
  });
}

export async function loadAllItemsFromDb(): Promise<FoodItem[]> {
  try {
    await initializeLocalDatabase();
    const rows = await db.items.toArray();
    if (rows.length === 0) return [...FOOD_ITEMS];
    return sortCatalogItems(rows);
  } catch {
    return [...FOOD_ITEMS];
  }
}

export async function loadSystemConfig(): Promise<SystemConfig> {
  try {
    await initializeLocalDatabase();
    const cfg = await db.config.get('system');
    return cfg || DEFAULT_SYSTEM_CONFIG;
  } catch {
    return DEFAULT_SYSTEM_CONFIG;
  }
}

export async function saveSystemConfig(
  partial: Partial<SystemConfig>
): Promise<SystemConfig> {
  await initializeLocalDatabase();
  const current = await loadSystemConfig();
  const next: SystemConfig = {
    ...current,
    ...partial,
    id: 'system',
    updatedAt: Date.now(),
  };
  await db.config.put(next);
  return next;
}

export async function recordSearchBehavior(
  keyword: string,
  lang: Lang,
  resultCount: number
): Promise<void> {
  const trimmed = keyword.trim();
  if (trimmed.length < 2) return;
  try {
    await initializeLocalDatabase();
    const recent = await db.searchLogs
      .orderBy('timestamp')
      .reverse()
      .limit(1)
      .toArray();
    if (
      recent[0] &&
      recent[0].keyword.toLowerCase() === trimmed.toLowerCase() &&
      Date.now() - recent[0].timestamp < 8000
    ) {
      return;
    }
    await db.searchLogs.add({
      keyword: trimmed,
      lang,
      resultCount,
      timestamp: Date.now(),
    });
    const total = await db.searchLogs.count();
    if (total > 200) {
      const oldest = await db.searchLogs
        .orderBy('timestamp')
        .limit(total - 200)
        .primaryKeys();
      await db.searchLogs.bulkDelete(oldest);
    }
  } catch {
    // ignore tracking errors offline
  }
}

export async function recordItemViewBehavior(item: FoodItem): Promise<void> {
  const itemCode = getItemCode(item);
  try {
    await initializeLocalDatabase();
    const existing = await db.viewStats.get(itemCode);
    await db.viewStats.put({
      itemCode,
      itemName: item.name,
      group: item.g,
      appendix: item.a,
      viewCount: (existing?.viewCount || 0) + 1,
      lastViewedAt: Date.now(),
    });
  } catch {
    // ignore tracking errors
  }
}

export async function recordAiHistory(entry: Omit<AiHistoryEntry, 'id'>): Promise<void> {
  try {
    await initializeLocalDatabase();
    await db.aiLogs.add(entry);
    const total = await db.aiLogs.count();
    if (total > 100) {
      const oldest = await db.aiLogs
        .orderBy('timestamp')
        .limit(total - 100)
        .primaryKeys();
      await db.aiLogs.bulkDelete(oldest);
    }
  } catch {
    // ignore tracking errors
  }
}

export async function authenticateAdminUser(
  usernameInput: string,
  passwordInput: string
): Promise<AdminUser | null> {
  await initializeLocalDatabase();
  const normalizedUser = usernameInput.trim().toLowerCase() || 'admin';
  const users = await db.users.toArray();
  const target = users.find((u) => u.username.toLowerCase() === normalizedUser);
  if (!target || target.disabled) return null;

  const candidateHash = await hashPasswordSha256(passwordInput);
  if (candidateHash !== target.passwordHash) return null;
  return target;
}
