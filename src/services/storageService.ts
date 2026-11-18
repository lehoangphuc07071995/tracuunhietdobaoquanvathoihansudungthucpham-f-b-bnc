import * as XLSX from 'xlsx';
import { FOOD_ITEMS, getItemCode } from '../data/foodData';
import {
  DEFAULT_SYSTEM_CONFIG,
  db,
  initializeLocalDatabase,
  sortCatalogItems,
  toStoredRecord,
  type StoredFoodRecord,
} from '../db/dexieDb';
import type { AppendixCode, FoodItem, SystemConfig } from '../types';

export type ImportMode = 'overwrite' | 'merge';

export type RealtimeConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'polling'
  | 'error';

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
      import.meta.env.VITE_SUPABASE_TABLE || 'foods',
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
      cfg.VITE_SUPABASE_TABLE.trim() || 'foods',
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
        ? 'Supabase Realtime & REST đã cấu hình sẵn sàng'
        : 'Supabase (chưa điền đủ URL / Anon Key / Table)',
    };
  }

  return {
    provider: 'none',
    configured: false,
    label: 'Chế độ Offline-First (IndexedDB cục bộ trên thiết bị)',
  };
}

function cleanSupabaseBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/[.\s/]+$/, '');
}

export async function testSupabaseConnection(
  overrideCfg?: SupabaseCloudConfig
): Promise<{ ok: boolean; message: string; keyCol?: 'code' | 'id' }> {
  const resolved = overrideCfg || (await loadCloudConfig());
  const status = getCloudSyncStatus(resolved);
  if (!status.configured) {
    return {
      ok: false,
      message: 'Thiếu thông số cấu hình Supabase (Provider / URL / Anon Key / Table).',
    };
  }
  try {
    const baseUrl = cleanSupabaseBaseUrl(resolved.VITE_SUPABASE_URL);
    const anonKey = resolved.VITE_SUPABASE_ANON_KEY.trim();
    const table = resolved.VITE_SUPABASE_TABLE.trim() || 'foods';
    const keyCol = await detectSupabaseKeyColumn(baseUrl, anonKey, table);
    const checkRes = await fetch(
      `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=${keyCol},updated_at&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );
    if (!checkRes.ok) {
      const detail = await extractSupabaseError(checkRes);
      return { ok: false, message: `HTTP ${checkRes.status}: ${detail}` };
    }
    return {
      ok: true,
      keyCol,
      message: `Kết nối thành công tới bảng "${table}" (khóa chính: ${keyCol}).`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Không kết nối được Supabase: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function syncCatalogToCloud(
  items: FoodItem[],
  config: SystemConfig,
  overrideCfg?: SupabaseCloudConfig
): Promise<{ ok: boolean; message: string; syncedAt?: number }> {
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
    const baseUrl = cleanSupabaseBaseUrl(resolved.VITE_SUPABASE_URL);
    const anonKey = resolved.VITE_SUPABASE_ANON_KEY.trim();
    const table = resolved.VITE_SUPABASE_TABLE.trim() || 'foods';

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
      syncedAt,
      message: `Đã đồng bộ thành công ${items.length} mặt hàng & cấu hình lên Supabase (${table}).`,
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
    const baseUrl = cleanSupabaseBaseUrl(resolved.VITE_SUPABASE_URL);
    const anonKey = resolved.VITE_SUPABASE_ANON_KEY.trim();
    const table = resolved.VITE_SUPABASE_TABLE.trim() || 'foods';

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

export interface SupabaseRealtimeCallbacks {
  onStatusChange?: (state: RealtimeConnectionState) => void;
  onRemoteUpdate: (payload: {
    items: FoodItem[];
    config?: SystemConfig;
    syncedAt: number;
  }) => void;
}

export function subscribeToSupabaseRealtime(
  cfg: SupabaseCloudConfig,
  callbacks: SupabaseRealtimeCallbacks
): () => void {
  const status = getCloudSyncStatus(cfg);
  if (!status.configured || typeof window === 'undefined') {
    callbacks.onStatusChange?.('disconnected');
    return () => {};
  }

  const baseUrl = cleanSupabaseBaseUrl(cfg.VITE_SUPABASE_URL);
  const anonKey = cfg.VITE_SUPABASE_ANON_KEY.trim();
  const table = cfg.VITE_SUPABASE_TABLE.trim() || 'foods';
  const wsBase = baseUrl.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  const wsUrl = `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(
    anonKey
  )}&vsn=1.0.0`;
  const topic = `realtime:public:${table}`;

  let closedByCaller = false;
  let ws: WebSocket | null = null;
  let heartbeatTimer: number | null = null;
  let pollTimer: number | null = null;
  let reconnectTimer: number | null = null;
  let joinVerifyTimer: number | null = null;
  let reconnectAttempts = 0;
  let msgRef = 1;
  let pulling = false;

  const checkAndPullRemote = async () => {
    if (closedByCaller || pulling) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    pulling = true;
    try {
      const lastSyncRow = await db.meta.get('lastCloudSyncedAt');
      const localSyncedAt = Number(lastSyncRow?.value || 0);
      const remote = await pullCatalogFromCloud(cfg);
      if (
        !closedByCaller &&
        remote.ok &&
        remote.items &&
        remote.items.length > 0 &&
        (remote.syncedAt || 0) > localSyncedAt
      ) {
        await db.meta.put({
          key: 'lastCloudSyncedAt',
          value: String(remote.syncedAt || Date.now()),
        });
        callbacks.onRemoteUpdate({
          items: remote.items,
          config: remote.config,
          syncedAt: remote.syncedAt || Date.now(),
        });
      }
    } catch {
      // silent retry on next event/poll
    } finally {
      pulling = false;
    }
  };

  const startFallbackPolling = (intervalMs: number) => {
    if (pollTimer !== null) window.clearInterval(pollTimer);
    pollTimer = window.setInterval(() => {
      void checkAndPullRemote();
    }, intervalMs);
  };

  const connectWs = () => {
    if (closedByCaller) return;
    if (typeof WebSocket === 'undefined') {
      callbacks.onStatusChange?.('polling');
      startFallbackPolling(12000);
      return;
    }

    callbacks.onStatusChange?.('connecting');
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      callbacks.onStatusChange?.('polling');
      startFallbackPolling(12000);
      return;
    }

    const joinRef = String(msgRef++);
    if (joinVerifyTimer !== null) window.clearTimeout(joinVerifyTimer);
    joinVerifyTimer = window.setTimeout(() => {
      if (!closedByCaller && ws && ws.readyState === WebSocket.OPEN) {
        callbacks.onStatusChange?.('polling');
      }
    }, 6000);

    ws.onopen = () => {
      if (closedByCaller || !ws) return;
      reconnectAttempts = 0;
      ws.send(
        JSON.stringify({
          topic,
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { self: false },
              presence: { key: '' },
              postgres_changes: [{ event: '*', schema: 'public', table }],
            },
          },
          ref: joinRef,
        })
      );

      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      heartbeatTimer = window.setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              topic: 'phoenix',
              event: 'heartbeat',
              payload: {},
              ref: String(msgRef++),
            })
          );
        }
      }, 25000);
    };

    ws.onmessage = (evt) => {
      if (closedByCaller) return;
      try {
        const msg = JSON.parse(String(evt.data || '{}')) as {
          topic?: string;
          event?: string;
          payload?: { status?: string };
          ref?: string;
        };
        if (msg.event === 'phx_reply' && msg.ref === joinRef) {
          if (joinVerifyTimer !== null) {
            window.clearTimeout(joinVerifyTimer);
            joinVerifyTimer = null;
          }
          if (msg.payload?.status === 'ok') {
            callbacks.onStatusChange?.('connected');
            // Safety low-frequency background pull even when WS is connected
            startFallbackPolling(45000);
          } else {
            callbacks.onStatusChange?.('polling');
            startFallbackPolling(12000);
          }
        } else if (
          msg.event === 'postgres_changes' ||
          msg.event === 'broadcast'
        ) {
          void checkAndPullRemote();
        }
      } catch {
        // ignore malformed frame
      }
    };

    ws.onerror = () => {
      if (closedByCaller) return;
      callbacks.onStatusChange?.('polling');
      startFallbackPolling(12000);
    };

    ws.onclose = () => {
      if (heartbeatTimer !== null) {
        window.clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (joinVerifyTimer !== null) {
        window.clearTimeout(joinVerifyTimer);
        joinVerifyTimer = null;
      }
      if (closedByCaller) return;
      callbacks.onStatusChange?.('polling');
      startFallbackPolling(12000);
      reconnectAttempts += 1;
      const delay = Math.min(30000, 4000 * Math.pow(1.5, reconnectAttempts - 1));
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => {
        connectWs();
      }, delay);
    };
  };

  const handleFocusOrVisible = () => {
    if (document.visibilityState === 'visible') {
      void checkAndPullRemote();
    }
  };

  window.addEventListener('focus', handleFocusOrVisible);
  document.addEventListener('visibilitychange', handleFocusOrVisible);
  connectWs();

  return () => {
    closedByCaller = true;
    window.removeEventListener('focus', handleFocusOrVisible);
    document.removeEventListener('visibilitychange', handleFocusOrVisible);
    if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
    if (pollTimer !== null) window.clearInterval(pollTimer);
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    if (joinVerifyTimer !== null) window.clearTimeout(joinVerifyTimer);
    try {
      ws?.close();
    } catch {
      // ignore close errors
    }
  };
}

export async function upsertFoodItemInDb(item: FoodItem): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  const record: StoredFoodRecord = {
    ...toStoredRecord(item),
    order: item.order ?? item.n,
    isCustom: true,
    updatedAt: Date.now(),
  };
  await db.items.put(record);
  const rows = await db.items.toArray();
  return sortCatalogItems(rows);
}

export async function deleteFoodItemInDb(code: string): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  await db.items.delete(code);
  const rows = await db.items.toArray();
  return sortCatalogItems(rows);
}

export async function saveOrderedItemsInDb(
  orderedItems: FoodItem[]
): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  const now = Date.now();
  const records: StoredFoodRecord[] = orderedItems.map((it, idx) => ({
    ...toStoredRecord(it),
    order: idx + 1,
    isCustom: true,
    updatedAt: now,
  }));
  await db.items.bulkPut(records);
  return sortCatalogItems(records);
}

export async function duplicateFoodItemInDb(
  sourceItem: FoodItem
): Promise<{ items: FoodItem[]; createdCode: string }> {
  await initializeLocalDatabase();
  const currentRows = sortCatalogItems(await db.items.toArray());
  const maxN = currentRows.reduce((m, it) => Math.max(m, it.n), 0);
  const newN = maxN + 1;
  const copyName = `${sourceItem.name} (Bản sao)`;
  const createdItem: FoodItem = {
    ...sourceItem,
    n: newN,
    name: copyName,
    customFields: sourceItem.customFields ? { ...sourceItem.customFields } : undefined,
    isCustom: true,
    updatedAt: Date.now(),
  };

  const srcCode = getItemCode(sourceItem);
  const idx = currentRows.findIndex((r) => getItemCode(r) === srcCode);
  const nextList = [...currentRows];
  if (idx >= 0) nextList.splice(idx + 1, 0, createdItem);
  else nextList.push(createdItem);

  const saved = await saveOrderedItemsInDb(nextList);
  return { items: saved, createdCode: getItemCode(createdItem) };
}

export async function bulkDeleteItemsInDb(codes: string[]): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  if (codes.length > 0) {
    await db.items.bulkDelete(codes);
  }
  const rows = await db.items.toArray();
  return sortCatalogItems(rows);
}

export async function bulkMoveGroupInDb(
  codes: string[],
  targetGroup: string
): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  const cleanGroup = targetGroup.trim();
  if (!cleanGroup || codes.length === 0) {
    return sortCatalogItems(await db.items.toArray());
  }
  const targetSet = new Set(codes.map((c) => c.toUpperCase()));
  const rows = await db.items.toArray();
  const now = Date.now();
  const updates = rows
    .filter((r) => targetSet.has(r.code.toUpperCase()))
    .map((r) => ({ ...r, g: cleanGroup, isCustom: true, updatedAt: now }));
  if (updates.length > 0) {
    await db.items.bulkPut(updates);
  }
  return sortCatalogItems(await db.items.toArray());
}

export async function renameGroupInDb(
  oldGroup: string,
  newGroup: string
): Promise<FoodItem[]> {
  await initializeLocalDatabase();
  const cleanNew = newGroup.trim();
  if (!oldGroup || !cleanNew || oldGroup === cleanNew) {
    return sortCatalogItems(await db.items.toArray());
  }
  const rows = await db.items.toArray();
  const now = Date.now();
  const updates = rows
    .filter((r) => r.g === oldGroup)
    .map((r) => ({ ...r, g: cleanNew, isCustom: true, updatedAt: now }));
  if (updates.length > 0) {
    await db.items.bulkPut(updates);
  }
  return sortCatalogItems(await db.items.toArray());
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
    schemaVersion: 'she-fb13-backup-v2',
    exportedAt: new Date().toISOString(),
    itemCount: items.length,
    config,
    items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `she-fb13-backup-${dateTag}.json`);
}

function toFlatRow(item: FoodItem) {
  const base: Record<string, string | number> = {
    Ma_So: getItemCode(item),
    Quy_Dinh: item.a,
    STT: item.n,
    Thu_Tu: item.order ?? item.n,
    Nhom_Thuc_Pham: item.g,
    Loai_Cu_The: item.name,
    Ten_Tieng_Anh: item.enName || '',
    Phong_15_25C: item.room,
    Lanh_0_5C: item.cool,
    Dong_Am_18C: item.freeze,
    Luu_Y_Bao_Quan: item.note,
    Nhiet_Do_Chuan: item.standardTemp || '',
    HSD_Chua_Mo_Bao_Bi: item.shelfLifeUnopened || '',
    HSD_Sau_Mo_Bao_Bi: item.shelfLifeOpened || '',
    Quy_Cach_Bao_Quan: item.packagingSpec || '',
    Ghi_Chu_HACCP_QA: item.haccpNote || item.flag || '',
    Tu_Khoa: (item.keywords || []).join(', '),
  };
  if (item.customFields) {
    for (const [k, v] of Object.entries(item.customFields)) {
      base[`Col_${k}`] = v;
    }
  }
  return base;
}

export function exportCatalogToCsv(items: FoodItem[]) {
  const rows = items.map(toFlatRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `she-fb13-report-${dateTag}.csv`);
}

export function exportCatalogToXlsx(items: FoodItem[]) {
  const rows = items.map(toFlatRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SHE_QD_FB13');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `she-fb13-report-${dateTag}.xlsx`);
}

function normalizeAppendixCode(_raw: unknown): AppendixCode {
  return 'SHE';
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
    raw.name ??
      raw.Loai_Cu_The ??
      raw.Ten_San_Pham ??
      raw['Loại cụ thể'] ??
      raw['Tên sản phẩm'] ??
      ''
  ).trim();
  if (!name) return null;

  const codeRaw = raw.code ?? raw.Ma_So ?? raw['Mã số'] ?? '';
  const a = normalizeAppendixCode(raw.a ?? raw.Quy_Dinh ?? codeRaw);
  const n = parseNumberFromCodeOrField(
    raw.n ?? raw.STT,
    codeRaw,
    fallbackIndex + 1
  );
  const rawOrder = Number(raw.order ?? raw.Thu_Tu);
  const order = Number.isFinite(rawOrder) && rawOrder > 0 ? rawOrder : n;

  const kwRaw = raw.keywords ?? raw.Tu_Khoa;
  const keywords = Array.isArray(kwRaw)
    ? kwRaw.map((x) => String(x).trim()).filter(Boolean)
    : typeof kwRaw === 'string' && kwRaw.trim()
      ? kwRaw
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : undefined;

  const customFields: Record<string, string> =
    raw.customFields && typeof raw.customFields === 'object'
      ? { ...(raw.customFields as Record<string, string>) }
      : {};
  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith('Col_') && val !== undefined && val !== null) {
      customFields[key.slice(4)] = String(val);
    }
  }

  return {
    a,
    n,
    order,
    g:
      String(
        raw.g ??
          raw.Nhom_Thuc_Pham ??
          raw.Nhom_Hang ??
          raw['Nhóm thực phẩm'] ??
          raw['Nhóm hàng'] ??
          'Khác'
      ).trim() || 'Khác',
    name,
    enName: String(raw.enName ?? raw.Ten_Tieng_Anh ?? '').trim() || undefined,
    room:
      String(raw.room ?? raw.Phong_15_25C ?? raw.Nhiet_Do_Phong ?? '—').trim() ||
      '—',
    cool:
      String(raw.cool ?? raw.Lanh_0_5C ?? raw.Kho_Mat_1_4C ?? '—').trim() ||
      '—',
    freeze:
      String(raw.freeze ?? raw.Dong_Am_18C ?? raw.Kho_Dong_18C ?? '—').trim() ||
      '—',
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
    note:
      String(raw.note ?? raw.Luu_Y_Bao_Quan ?? raw.Ghi_Chu_Goc ?? '—').trim() ||
      '—',
    flag: String(raw.flag ?? '').trim(),
    haccpNote:
      String(raw.haccpNote ?? raw.Ghi_Chu_HACCP_QA ?? '').trim() || undefined,
    keywords,
    customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
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
    order: it.order ?? it.n,
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
  return sortCatalogItems(all);
}
