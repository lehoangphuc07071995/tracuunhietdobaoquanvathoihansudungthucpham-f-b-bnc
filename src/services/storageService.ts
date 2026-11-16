import * as XLSX from 'xlsx';
import { FOOD_ITEMS, getItemCode } from '../data/foodData';
import {
  DEFAULT_SYSTEM_CONFIG,
  db,
  initializeLocalDatabase,
  toStoredRecord,
  type StoredFoodRecord,
} from '../db/dexieDb';
import type { AppendixCode, FoodItem, SystemConfig } from '../types';

export type ImportMode = 'overwrite' | 'merge';

export interface ExportBackupPayload {
  schemaVersion: string;
  exportedAt: string;
  itemCount: number;
  config: SystemConfig;
  items: FoodItem[];
}

export interface SupabaseCloudConfig {
  VITE_CLOUD_SYNC_PROVIDER: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_TABLE: string;
}

export interface CloudSyncStatus {
  provider: 'none' | 'supabase';
  configured: boolean;
  label: string;
}

const CLOUD_CONFIG_META_KEY = 'supabase_cloud_config';

export function getDefaultSupabaseConfigFromEnv(): SupabaseCloudConfig {
  return {
    VITE_CLOUD_SYNC_PROVIDER:
      import.meta.env.VITE_CLOUD_SYNC_PROVIDER || 'none',
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_SUPABASE_TABLE:
      import.meta.env.VITE_SUPABASE_TABLE || 'bnc_food_catalog',
  };
}

export async function loadCloudConfig(): Promise<SupabaseCloudConfig> {
  const envDefaults = getDefaultSupabaseConfigFromEnv();
  try {
    await initializeLocalDatabase();
    const row = await db.meta.get(CLOUD_CONFIG_META_KEY);
    if (!row?.value) return envDefaults;
    const parsed = JSON.parse(row.value) as Partial<SupabaseCloudConfig>;
    return {
      VITE_CLOUD_SYNC_PROVIDER:
        parsed.VITE_CLOUD_SYNC_PROVIDER ?? envDefaults.VITE_CLOUD_SYNC_PROVIDER,
      VITE_SUPABASE_URL:
        parsed.VITE_SUPABASE_URL ?? envDefaults.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY:
        parsed.VITE_SUPABASE_ANON_KEY ?? envDefaults.VITE_SUPABASE_ANON_KEY,
      VITE_SUPABASE_TABLE:
        parsed.VITE_SUPABASE_TABLE || envDefaults.VITE_SUPABASE_TABLE,
    };
  } catch {
    return envDefaults;
  }
}

export async function saveCloudConfig(
  cfg: SupabaseCloudConfig
): Promise<SupabaseCloudConfig> {
  await initializeLocalDatabase();
  const normalized: SupabaseCloudConfig = {
    VITE_CLOUD_SYNC_PROVIDER:
      cfg.VITE_CLOUD_SYNC_PROVIDER.trim() || 'none',
    VITE_SUPABASE_URL: cfg.VITE_SUPABASE_URL.trim(),
    VITE_SUPABASE_ANON_KEY: cfg.VITE_SUPABASE_ANON_KEY.trim(),
    VITE_SUPABASE_TABLE:
      cfg.VITE_SUPABASE_TABLE.trim() || 'bnc_food_catalog',
  };
  await db.meta.put({
    key: CLOUD_CONFIG_META_KEY,
    value: JSON.stringify(normalized),
  });
  return normalized;
}

export function getCloudSyncStatus(
  cfg?: SupabaseCloudConfig
): CloudSyncStatus {
  const resolved = cfg || getDefaultSupabaseConfigFromEnv();
  const providerRaw = (resolved.VITE_CLOUD_SYNC_PROVIDER || 'none').toLowerCase();

  if (providerRaw === 'supabase') {
    const configured = Boolean(
      resolved.VITE_SUPABASE_URL.trim() &&
        resolved.VITE_SUPABASE_ANON_KEY.trim() &&
        resolved.VITE_SUPABASE_TABLE.trim()
    );
    return {
      provider: 'supabase',
      configured,
      label: configured
        ? 'Supabase REST đã cấu hình sẵn sàng'
        : 'Supabase (chưa điền đủ URL / Anon Key / Table)',
    };
  }

  return {
    provider: 'none',
    configured: false,
    label: 'Chế độ Offline-First (IndexedDB cục bộ trên thiết bị)',
  };
}

export async function syncCatalogToCloud(
  items: FoodItem[],
  config: SystemConfig,
  overrideCfg?: SupabaseCloudConfig
): Promise<{ ok: boolean; message: string }> {
  const resolved = overrideCfg || (await loadCloudConfig());
  const status = getCloudSyncStatus(resolved);
  if (!status.configured) {
    return {
      ok: false,
      message:
        'Vui lòng đặt VITE_CLOUD_SYNC_PROVIDER = "supabase" và điền đủ VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_TABLE.',
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      message: 'Đang Offline — dữ liệu sẽ đồng bộ khi thiết bị kết nối lại mạng.',
    };
  }

  try {
    const baseUrl = resolved.VITE_SUPABASE_URL.trim().replace(/[.\s/]+$/, '');
    const anonKey = resolved.VITE_SUPABASE_ANON_KEY.trim();
    const table = resolved.VITE_SUPABASE_TABLE.trim() || 'bnc_food_catalog';

    const keyCol = await detectSupabaseKeyColumn(baseUrl, anonKey, table);
    const syncedAt = Date.now();
    const res = await fetch(
      `${baseUrl}/rest/v1/${encodeURIComponent(table)}?on_conflict=${encodeURIComponent(keyCol)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          [keyCol]: 'main_catalog',
          updated_at: new Date(syncedAt).toISOString(),
          payload: { items, config, syncedAt },
        }),
      }
    );
    if (!res.ok) {
      const errDetail = await extractSupabaseError(res);
      throw new Error(`HTTP ${res.status}: ${errDetail}`);
    }
    await db.meta.put({ key: 'lastCloudSyncedAt', value: String(syncedAt) });
    return {
      ok: true,
      message: `Đã đồng bộ thành công ${items.length} mặt hàng lên Supabase (${table}).`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Lỗi đồng bộ Supabase: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function detectSupabaseKeyColumn(
  baseUrl: string,
  anonKey: string,
  table: string
): Promise<'code' | 'id'> {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
  const checkCode = await fetch(
    `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=code&limit=1`,
    { headers }
  );
  if (checkCode.ok) return 'code';

  const checkId = await fetch(
    `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=id&limit=1`,
    { headers }
  );
  if (checkId.ok) return 'id';

  const errDetail = await extractSupabaseError(checkId);
  throw new Error(
    `Bảng "${table}" cần có cột khóa chính "code" hoặc "id" (Chi tiết: ${errDetail})`
  );
}

async function extractSupabaseError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return res.statusText || 'Unknown error';
    try {
      const parsed = JSON.parse(text) as {
        message?: string;
        details?: string;
        hint?: string;
      };
      return (
        [parsed.message, parsed.details, parsed.hint].filter(Boolean).join(' — ') ||
        text
      );
    } catch {
      return text;
    }
  } catch {
    return res.statusText || 'Unknown error';
  }
}

export async function pullCatalogFromCloud(
  overrideCfg?: SupabaseCloudConfig
): Promise<{
  ok: boolean;
  message: string;
  items?: FoodItem[];
  config?: SystemConfig;
  syncedAt?: number;
}> {
  const resolved = overrideCfg || (await loadCloudConfig());
  const status = getCloudSyncStatus(resolved);
  if (!status.configured) {
    return {
      ok: false,
      message:
        'Vui lòng đặt VITE_CLOUD_SYNC_PROVIDER = "supabase" và điền đủ thông tin Supabase.',
    };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, message: 'Thiết bị đang Offline.' };
  }

  try {
    const baseUrl = resolved.VITE_SUPABASE_URL.trim().replace(/[.\s/]+$/, '');
    const anonKey = resolved.VITE_SUPABASE_ANON_KEY.trim();
    const table = resolved.VITE_SUPABASE_TABLE.trim() || 'bnc_food_catalog';

    const keyCol = await detectSupabaseKeyColumn(baseUrl, anonKey, table);
    const res = await fetch(
      `${baseUrl}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(
        keyCol
      )}=eq.main_catalog&select=payload,updated_at`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );
    if (!res.ok) {
      const errDetail = await extractSupabaseError(res);
      throw new Error(`HTTP ${res.status}: ${errDetail}`);
    }
    const rows = (await res.json()) as Array<{
      payload?: { items?: FoodItem[]; config?: SystemConfig; syncedAt?: number };
      updated_at?: string;
    }>;
    const payload = rows[0]?.payload;
    if (!payload || !Array.isArray(payload.items)) {
      return {
        ok: false,
        message: `Chưa có bản dữ liệu nào trên bảng "${table}". Hãy nhấn "Đẩy dữ liệu lên Supabase" trước.`,
      };
    }
    const remoteTs =
      payload.syncedAt ||
      (rows[0]?.updated_at ? Date.parse(rows[0].updated_at) : 0) ||
      0;
    return {
      ok: true,
      message: `Đã tải ${payload.items.length} mặt hàng từ Supabase (${table}).`,
      items: payload.items,
      config: payload.config,
      syncedAt: remoteTs,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Lỗi tải dữ liệu Supabase: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function upsertFoodItemInDb(item: FoodItem): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  const record: StoredFoodRecord = {
    ...toStoredRecord(item),
    isCustom: true,
    updatedAt: Date.now(),
  };
  await db.items.put(record);
  const rows = await db.items.toArray();
  rows.sort((a, b) => (a.a === b.a ? a.n - b.n : a.a < b.a ? -1 : 1));
  return rows;
}

export async function deleteFoodItemInDb(code: string): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  await db.items.delete(code);
  const rows = await db.items.toArray();
  rows.sort((a, b) => (a.a === b.a ? a.n - b.n : a.a < b.a ? -1 : 1));
  return rows;
}

export async function resetCatalogToDefaultBaseline(): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  await db.items.clear();
  await db.items.bulkPut(FOOD_ITEMS.map(toStoredRecord));
  await db.config.put({ ...DEFAULT_SYSTEM_CONFIG, updatedAt: Date.now() });
  return [...FOOD_ITEMS];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCatalogToJson(items: FoodItem[], config: SystemConfig) {
  const payload: ExportBackupPayload = {
    schemaVersion: 'bnc-food-backup-v1',
    exportedAt: new Date().toISOString(),
    itemCount: items.length,
    config,
    items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `bnc-food-backup-${dateTag}.json`);
}

function toFlatRow(item: FoodItem) {
  return {
    Ma_So: getItemCode(item),
    Phu_Luc: item.a,
    STT: item.n,
    Nhom_Hang: item.g,
    Ten_San_Pham: item.name,
    Ten_Tieng_Anh: item.enName || '',
    Khoi_Luong: item.weight || '',
    Nhiet_Do_Phong: item.room,
    Kho_Mat_1_4C: item.cool,
    Kho_Dong_18C: item.freeze,
    Trung_Bay_Lanh: item.displayCool || '',
    Trung_Bay_Nong: item.displayHot || '',
    Nhiet_Do_Chuan: item.standardTemp || '',
    HSD_Chua_Mo_Bao_Bi: item.shelfLifeUnopened || '',
    HSD_Sau_Mo_Bao_Bi: item.shelfLifeOpened || '',
    Quy_Cach_Bao_Quan: item.packagingSpec || '',
    Ghi_Chu_Goc: item.note,
    Ghi_Chu_HACCP_QA: item.haccpNote || item.flag || '',
  };
}

export function exportCatalogToCsv(items: FoodItem[]) {
  const rows = items.map(toFlatRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `bnc-food-report-${dateTag}.csv`);
}

export function exportCatalogToXlsx(items: FoodItem[]) {
  const rows = items.map(toFlatRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BNC_ShelfLife');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `bnc-food-report-${dateTag}.xlsx`);
}

function normalizeAppendixCode(raw: unknown): AppendixCode {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'PL2' || s.startsWith('PL2')) return 'PL2';
  if (s === 'PL3' || s.startsWith('PL3')) return 'PL3';
  return 'PL1';
}

function parseNumberFromCodeOrField(rawNo: unknown, rawCode: unknown, fallback: number): number {
  const n = Number(rawNo);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  const match = String(rawCode || '').match(/(\d+)$/);
  if (match) return Number(match[1]);
  return fallback;
}

function normalizeImportedRow(
  raw: Record<string, unknown>,
  fallbackIndex: number
): FoodItem | null {
  const name = String(
    raw.name ?? raw.Ten_San_Pham ?? raw['Tên sản phẩm'] ?? ''
  ).trim();
  if (!name) return null;

  const codeRaw = raw.code ?? raw.Ma_So ?? raw['Mã số'] ?? '';
  const a = normalizeAppendixCode(raw.a ?? raw.Phu_Luc ?? codeRaw);
  const n = parseNumberFromCodeOrField(
    raw.n ?? raw.STT,
    codeRaw,
    fallbackIndex + 1
  );

  return {
    a,
    n,
    g:
      String(raw.g ?? raw.Nhom_Hang ?? raw['Nhóm hàng'] ?? 'Khác').trim() ||
      'Khác',
    name,
    enName: String(raw.enName ?? raw.Ten_Tieng_Anh ?? '').trim() || undefined,
    weight: String(raw.weight ?? raw.Khoi_Luong ?? '').trim() || undefined,
    room: String(raw.room ?? raw.Nhiet_Do_Phong ?? '—').trim() || '—',
    cool: String(raw.cool ?? raw.Kho_Mat_1_4C ?? '—').trim() || '—',
    freeze: String(raw.freeze ?? raw.Kho_Dong_18C ?? '—').trim() || '—',
    displayCool:
      String(raw.displayCool ?? raw.Trung_Bay_Lanh ?? '').trim() || undefined,
    displayHot:
      String(raw.displayHot ?? raw.Trung_Bay_Nong ?? '').trim() || undefined,
    standardTemp:
      String(raw.standardTemp ?? raw.Nhiet_Do_Chuan ?? '').trim() || undefined,
    shelfLifeUnopened:
      String(raw.shelfLifeUnopened ?? raw.HSD_Chua_Mo_Bao_Bi ?? '').trim() ||
      undefined,
    shelfLifeOpened:
      String(raw.shelfLifeOpened ?? raw.HSD_Sau_Mo_Bao_Bi ?? '').trim() ||
      undefined,
    packagingSpec:
      String(raw.packagingSpec ?? raw.Quy_Cach_Bao_Quan ?? '').trim() ||
      undefined,
    note: String(raw.note ?? raw.Ghi_Chu_Goc ?? '—').trim() || '—',
    flag: String(raw.flag ?? '').trim(),
    haccpNote:
      String(raw.haccpNote ?? raw.Ghi_Chu_HACCP_QA ?? '').trim() || undefined,
    isCustom: true,
    updatedAt: Date.now(),
  };
}

export async function parseImportFile(
  file: File
): Promise<{ items: FoodItem[]; config?: SystemConfig }> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text) as
      | FoodItem[]
      | { items?: unknown[]; config?: SystemConfig };

    const rawItems = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

    const items = rawItems
      .map((row, idx) =>
        row && typeof row === 'object'
          ? normalizeImportedRow(row as Record<string, unknown>, idx)
          : null
      )
      .filter((x): x is FoodItem => Boolean(x));

    if (items.length === 0) {
      throw new Error('File JSON không chứa dữ liệu sản phẩm hợp lệ.');
    }

    const config =
      !Array.isArray(parsed) && parsed?.config ? parsed.config : undefined;
    return { items, config };
  }

  if (lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('File bảng tính không có trang dữ liệu.');
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[firstSheetName]
    );
    const items = rows
      .map((row, idx) => normalizeImportedRow(row, idx))
      .filter((x): x is FoodItem => Boolean(x));

    if (items.length === 0) {
      throw new Error('Không đọc được sản phẩm hợp lệ từ file CSV/Excel.');
    }
    return { items };
  }

  throw new Error('Chỉ hỗ trợ định dạng .json, .csv hoặc .xlsx');
}

export async function applyImportedItemsToDb(
  importedItems: FoodItem[],
  mode: ImportMode,
  importedConfig?: SystemConfig
): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  const records = importedItems.map((it) => ({
    ...toStoredRecord(it),
    isCustom: true,
    updatedAt: Date.now(),
  }));

  if (mode === 'overwrite') {
    await db.items.clear();
    await db.items.bulkPut(records);
    if (importedConfig) {
      await db.config.put({ ...importedConfig, id: 'system', updatedAt: Date.now() });
    }
  } else {
    await db.items.bulkPut(records);
  }

  const all = await db.items.toArray();
  all.sort((a, b) => (a.a === b.a ? a.n - b.n : a.a < b.a ? -1 : 1));
  return all;
}
