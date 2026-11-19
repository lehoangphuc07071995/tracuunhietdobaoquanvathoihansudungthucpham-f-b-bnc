import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  Cloud,
  Columns3,
  Copy,
  Database,
  Download,
  Edit3,
  FolderEdit,
  KeyRound,
  Lock,
  LogOut,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Unlock,
  Upload,
  UserCog,
  UserPlus,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { ALL_GROUPS, getItemCode } from '../data/foodData';
import {
  DEFAULT_SYSTEM_CONFIG,
  authenticateAdminUser,
  db,
  hashPasswordSha256,
  initializeLocalDatabase,
  saveSystemConfig,
} from '../db/dexieDb';
import {
  applyImportedItemsToDb,
  bulkDeleteItemsInDb,
  bulkMoveGroupInDb,
  deleteFoodItemInDb,
  duplicateFoodItemInDb,
  exportCatalogToCsv,
  exportCatalogToJson,
  exportCatalogToXlsx,
  getCloudSyncStatus,
  getDefaultSupabaseConfigFromEnv,
  loadCloudConfig,
  parseImportFile,
  pullCatalogFromCloud,
  renameGroupInDb,
  resetCatalogToDefaultBaseline,
  saveCloudConfig,
  saveOrderedItemsInDb,
  syncCatalogToCloud,
  testSupabaseConnection,
  upsertFoodItemInDb,
  type ImportMode,
  type RealtimeConnectionState,
  type SupabaseCloudConfig,
} from '../services/storageService';
import type {
  AdminPermission,
  AdminUser,
  AppendixCode,
  CustomColumnDef,
  FoodItem,
  Lang,
  SystemConfig,
} from '../types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  items: FoodItem[];
  onItemsUpdated: (nextItems: FoodItem[]) => void;
  config: SystemConfig;
  onConfigUpdated: (nextConfig: SystemConfig) => void;
  realtimeStatus?: RealtimeConnectionState;
  lang?: Lang;
}

type AdminTab = 'config' | 'data' | 'io' | 'users' | 'cloud';

const ADMIN_TEXT: Record<
  Lang,
  {
    dialogLabel: string;
    close: string;
    headerTitle: string;
    authSubtitlePrefix: string;
    roleSuper: string;
    roleSub: string;
    authProtected: string;
    logout: string;
    loginTitle: string;
    loginDesc: string;
    usernameLabel: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginButton: string;
    loginLoading: string;
    loginInvalid: string;
    tabData: string;
    tabConfig: string;
    tabIo: string;
    tabUsers: string;
    tabCloud: string;
    permManageConfig: string;
    permEditItems: string;
    permDeleteItems: string;
    permViewExport: string;
    permImportData: string;
    permLockApp: string;
    permManageCloud: string;
    cloudTitle: string;
    cloudStatusLabel: string;
    cloudDesc: string;
    cloudSaveBtn: string;
    cloudTestBtn: string;
    cloudPushBtn: string;
    cloudPullBtn: string;
  }
> = {
  VI: {
    dialogLabel: 'Hệ thống Quản trị Admin',
    close: 'Đóng',
    headerTitle: 'Trung Tâm Điều Hành & Quản Trị Toàn Quyền',
    authSubtitlePrefix: 'Đang đăng nhập:',
    roleSuper: 'Super Admin',
    roleSub: 'User Phân quyền',
    authProtected: 'Xác thực bảo mật SHA-256',
    logout: 'Đăng xuất',
    loginTitle: 'Đăng nhập Quản trị viên',
    loginDesc: 'Nhập tên tài khoản và mật khẩu để truy cập hệ thống quản lý & điều hành.',
    usernameLabel: 'Tên đăng nhập',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu...',
    loginButton: 'Xác thực & Đăng nhập',
    loginLoading: 'Đang xác thực...',
    loginInvalid: 'Sai tên đăng nhập/mật khẩu hoặc tài khoản đang bị khóa.',
    tabData: 'Bảng dữ liệu & Cột/Hàng',
    tabConfig: 'Cấu hình & Khóa App',
    tabIo: 'Import / Export',
    tabUsers: 'Tài khoản & Phân quyền',
    tabCloud: 'Supabase Realtime',
    permManageConfig: 'Cấu hình giao diện, cột & thông báo',
    permEditItems: 'Thêm, sửa nhanh, sắp xếp hàng',
    permDeleteItems: 'Xóa sản phẩm (đơn lẻ & hàng loạt)',
    permViewExport: 'Xem & Export báo cáo (.json/.csv/.xlsx)',
    permImportData: 'Import / Upload dữ liệu',
    permLockApp: 'Khóa / mở khóa truy cập App toàn hệ thống',
    permManageCloud: 'Quản lý kết nối & đồng bộ Supabase Cloud',
    cloudTitle: 'Đồng bộ Realtime Toàn Cầu (Supabase)',
    cloudStatusLabel: 'Trạng thái cấu hình:',
    cloudDesc:
      'Mọi thay đổi dữ liệu, cấu trúc cột và trạng thái khóa ứng dụng sẽ được đẩy lên Supabase và phát Realtime tức thì tới mọi thiết bị đang mở trên toàn thế giới (kèm IndexedDB Offline-First):',
    cloudSaveBtn: 'Lưu cấu hình Supabase',
    cloudTestBtn: 'Kiểm tra kết nối',
    cloudPushBtn: 'Đẩy dữ liệu & Cấu hình lên Cloud',
    cloudPullBtn: 'Tải từ Supabase về máy',
  },
  EN: {
    dialogLabel: 'Admin Management System',
    close: 'Close',
    headerTitle: 'Command Center & Full Access Control',
    authSubtitlePrefix: 'Signed in:',
    roleSuper: 'Super Admin',
    roleSub: 'Scoped User',
    authProtected: 'SHA-256 Protected Authentication',
    logout: 'Sign out',
    loginTitle: 'Administrator Sign In',
    loginDesc: 'Enter your username and passcode to access catalog, columns, app lock, and cloud sync.',
    usernameLabel: 'Username',
    passwordLabel: 'Passcode',
    passwordPlaceholder: 'Enter passcode...',
    loginButton: 'Verify & Sign In',
    loginLoading: 'Verifying...',
    loginInvalid: 'Invalid credentials or account is disabled.',
    tabData: 'Rows & Data CRUD',
    tabConfig: 'Config, Columns & Lock',
    tabIo: 'Import / Export',
    tabUsers: 'Users & Permissions',
    tabCloud: 'Supabase Realtime',
    permManageConfig: 'UI config, custom columns & alerts',
    permEditItems: 'Add, inline edit & reorder rows',
    permDeleteItems: 'Delete items (single & bulk)',
    permViewExport: 'View & Export reports (.json/.csv/.xlsx)',
    permImportData: 'Import / Upload catalog data',
    permLockApp: 'Lock / unlock app globally',
    permManageCloud: 'Manage Supabase Cloud sync & test connection',
    cloudTitle: 'Global Realtime Cloud Sync (Supabase)',
    cloudStatusLabel: 'Config status:',
    cloudDesc:
      'All edits to food items, custom columns, and global app-lock states push to Supabase and broadcast in realtime to all connected devices worldwide:',
    cloudSaveBtn: 'Save Supabase Config',
    cloudTestBtn: 'Test Connection',
    cloudPushBtn: 'Push Catalog & Config to Cloud',
    cloudPullBtn: 'Pull from Supabase',
  },
  KO: {
    dialogLabel: '관리자 시스템',
    close: '닫기',
    headerTitle: '시스템 전체 제어 및 권한 관리',
    authSubtitlePrefix: '로그인됨:',
    roleSuper: '최고 관리자',
    roleSub: '권한 사용자',
    authProtected: 'SHA-256 보안 인증',
    logout: '로그아웃',
    loginTitle: '관리자 로그인',
    loginDesc: '데이터, 열/행 구성, 앱 잠금 및 클라우드 동기화를 위해 로그인하세요.',
    usernameLabel: '사용자 이름',
    passwordLabel: '비밀번호',
    passwordPlaceholder: '비밀번호 입력...',
    loginButton: '인증 및 로그인',
    loginLoading: '인증 중...',
    loginInvalid: '계정 정보가 잘못되었거나 비활성화된 계정입니다.',
    tabData: '행·데이터 관리',
    tabConfig: '설정·열·앱 잠금',
    tabIo: '가져오기 / 내보내기',
    tabUsers: '사용자 및 권한',
    tabCloud: 'Supabase 실시간',
    permManageConfig: 'UI 설정, 사용자 정의 열 및 공지',
    permEditItems: '품목 추가, 인라인 수정 및 순서 변경',
    permDeleteItems: '품목 삭제 (단일·일괄)',
    permViewExport: '보고서 조회 및 내보내기',
    permImportData: '데이터 가져오기 / 업로드',
    permLockApp: '전체 앱 잠금 / 해제',
    permManageCloud: 'Supabase 클라우드 동기화 관리',
    cloudTitle: '글로벌 실시간 클라우드 동기화 (Supabase)',
    cloudStatusLabel: '구성 상태:',
    cloudDesc:
      '모든 데이터, 열 구성 및 앱 잠금 상태 변경 사항이 전 세계 연결된 모든 기기로 실시간 동기화됩니다:',
    cloudSaveBtn: 'Supabase 설정 저장',
    cloudTestBtn: '연결 테스트',
    cloudPushBtn: '클라우드로 업로드',
    cloudPullBtn: 'Supabase에서 가져오기',
  },
  HI: {
    dialogLabel: 'एडमिन प्रबंधन प्रणाली',
    close: 'बंद करें',
    headerTitle: 'सिस्टम एडमिन व पूर्ण नियंत्रण केंद्र',
    authSubtitlePrefix: 'लॉग इन:',
    roleSuper: 'सुपर एडमिन',
    roleSub: 'सीमित उपयोगकर्ता',
    authProtected: 'SHA-256 सुरक्षित प्रमाणीकरण',
    logout: 'लॉग आउट',
    loginTitle: 'एडमिनिस्ट्रेटर लॉगिन',
    loginDesc: 'डेटा, कॉलम, ऐप लॉक व क्लाउड सिंक प्रबंधित करने के लिए लॉगिन करें।',
    usernameLabel: 'उपयोगकर्ता नाम',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'पासवर्ड दर्ज करें...',
    loginButton: 'सत्यापित करें और लॉगिन करें',
    loginLoading: 'सत्यापन जारी...',
    loginInvalid: 'गलत जानकारी या खाता निष्क्रिय है।',
    tabData: 'डेटा व पंक्ति प्रबंधन',
    tabConfig: 'सेटिंग्स, कॉलम व लॉक',
    tabIo: 'इम्पोर्ट / एक्सपोर्ट',
    tabUsers: 'उपयोगकर्ता व अधिकार',
    tabCloud: 'Supabase रीयलटाइम',
    permManageConfig: 'UI सेटिंग्स, कॉलम व अलर्ट बैनर',
    permEditItems: 'आइटम जोड़ें, इनलाइन संपादन व क्रम बदलें',
    permDeleteItems: 'आइटम हटाएं (एकल व बैच)',
    permViewExport: 'रिपोर्ट देखें और एक्सपोर्ट करें',
    permImportData: 'डेटा इम्पोर्ट / अपलोड करें',
    permLockApp: 'पूरे ऐप को लॉक / अनलॉक करें',
    permManageCloud: 'Supabase क्लाउड सिंक प्रबंधन',
    cloudTitle: 'ग्लोबल रीयलटाइम क्लाउड सिंक (Supabase)',
    cloudStatusLabel: 'कॉन्फ़िग स्थिति:',
    cloudDesc:
      'सभी डेटा, कस्टम कॉलम और ऐप-लॉक अपडेट दुनिया भर के सभी जुड़े उपकरणों पर रीयलटाइम में सिंक होते हैं:',
    cloudSaveBtn: 'Supabase सेटिंग सहेजें',
    cloudTestBtn: 'कनेक्शन जांचें',
    cloudPushBtn: 'क्लाउड पर डेटा भेजें',
    cloudPullBtn: 'Supabase से डाउनलोड करें',
  },
};

const ALL_PERMISSIONS: AdminPermission[] = [
  'manage_config',
  'edit_items',
  'delete_items',
  'view_export_reports',
  'import_data',
  'lock_app',
  'manage_cloud',
];

function createEmptyItemDraft(items: FoodItem[], allowedGroups: string[]): FoodItem {
  const sheMax = items.reduce((max, i) => Math.max(max, i.n), 0);
  const orderMax = items.reduce((max, i) => Math.max(max, i.order ?? i.n), 0);
  const defaultGroup =
    allowedGroups.includes('ALL') || allowedGroups.length === 0
      ? ALL_GROUPS[0] || 'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)'
      : allowedGroups[0];

  return {
    a: 'SHE',
    n: sheMax + 1,
    order: orderMax + 1,
    g: defaultGroup,
    name: '',
    enName: '',
    room: 'Không',
    cool: '—',
    freeze: '—',
    standardTemp: '',
    shelfLifeUnopened: '',
    shelfLifeOpened: '',
    packagingSpec: '',
    note: '—',
    flag: '',
    haccpNote: '',
    customFields: {},
  };
}

function slugifyColumnId(label: string): string {
  const clean = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || `col_${Date.now().toString(36)}`;
}

export function AdminPanel({
  open,
  onClose,
  items,
  onItemsUpdated,
  config,
  onConfigUpdated,
  realtimeStatus = 'disconnected',
  lang = 'VI',
}: AdminPanelProps) {
  const L = ADMIN_TEXT[lang];
  const permissionLabels: Record<AdminPermission, string> = {
    manage_config: L.permManageConfig,
    edit_items: L.permEditItems,
    delete_items: L.permDeleteItems,
    view_export_reports: L.permViewExport,
    import_data: L.permImportData,
    lock_app: L.permLockApp,
    manage_cloud: L.permManageCloud,
  };

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('data');
  const [toastMsg, setToastMsg] = useState('');

  // Config & Custom Columns draft state
  const [configDraft, setConfigDraft] = useState<SystemConfig>(config);
  const [newColLabel, setNewColLabel] = useState('');

  // Data CRUD + Inline + Bulk + Group Rename state
  const [dataFilterQuery, setDataFilterQuery] = useState('');
  const [dataFilterGroup, setDataFilterGroup] = useState('ALL');
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, FoodItem>>({});
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [bulkMoveTargetGroup, setBulkMoveTargetGroup] = useState('');
  const [showGroupTools, setShowGroupTools] = useState(false);
  const [renameOldGroup, setRenameOldGroup] = useState('');
  const [renameNewGroup, setRenameNewGroup] = useState('');

  // Import/Export state
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importPreview, setImportPreview] = useState<{
    filename: string;
    items: FoodItem[];
    config?: SystemConfig;
  } | null>(null);
  const [importError, setImportError] = useState('');

  // Users / RBAC state
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [oldAdminPass, setOldAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newSubUsername, setNewSubUsername] = useState('');
  const [newSubPassword, setNewSubPassword] = useState('');
  const [newSubPermissions, setNewSubPermissions] = useState<AdminPermission[]>([
    'edit_items',
    'view_export_reports',
  ]);
  const [newSubAllGroups, setNewSubAllGroups] = useState(true);
  const [newSubGroups, setNewSubGroups] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserPerms, setEditUserPerms] = useState<AdminPermission[]>([]);
  const [editUserAllGroups, setEditUserAllGroups] = useState(true);
  const [editUserGroups, setEditUserGroups] = useState<string[]>([]);
  const [editUserDisabled, setEditUserDisabled] = useState(false);
  const [editUserNewPassword, setEditUserNewPassword] = useState('');

  // Cloud Sync Supabase state
  const [cloudConfigDraft, setCloudConfigDraft] = useState<SupabaseCloudConfig>(
    () => getDefaultSupabaseConfigFromEnv()
  );
  const [cloudMessage, setCloudMessage] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);

  const showStatus = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? '' : prev));
    }, 3400);
  };

  useEffect(() => {
    setConfigDraft(config);
  }, [config]);

  useEffect(() => {
    if (open) {
      void loadCloudConfig().then((loaded) => setCloudConfigDraft(loaded));
    }
  }, [open]);

  const loadUsers = async () => {
    await initializeLocalDatabase();
    const all = await db.users.toArray();
    setUsersList(all);
  };

  const hasPerm = (perm: AdminPermission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return currentUser.permissions.includes(perm);
  };

  const allowedGroupsForUser = useMemo(() => {
    if (!currentUser || currentUser.role === 'super_admin') return ['ALL'];
    return currentUser.allowedGroups.length > 0
      ? currentUser.allowedGroups
      : ['ALL'];
  }, [currentUser]);

  const canAccessGroup = (groupName: string): boolean => {
    if (allowedGroupsForUser.includes('ALL')) return true;
    return allowedGroupsForUser.includes(groupName);
  };

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'super_admin') {
      void loadUsers();
      setActiveTab('data');
      return;
    }
    if (hasPerm('edit_items') || hasPerm('delete_items')) setActiveTab('data');
    else if (hasPerm('manage_config') || hasPerm('lock_app')) setActiveTab('config');
    else if (hasPerm('view_export_reports') || hasPerm('import_data')) setActiveTab('io');
    else if (hasPerm('manage_cloud')) setActiveTab('cloud');
  }, [currentUser]);

  const availableGroups = useMemo(() => {
    const set = new Set<string>(ALL_GROUPS);
    for (const it of items) {
      if (it.g) set.add(it.g);
    }
    return Array.from(set);
  }, [items]);

  const scopedGroups = useMemo(() => {
    if (allowedGroupsForUser.includes('ALL')) return availableGroups;
    return availableGroups.filter((g) => allowedGroupsForUser.includes(g));
  }, [availableGroups, allowedGroupsForUser]);

  const customColumnsSorted = useMemo<CustomColumnDef[]>(() => {
    return [...(configDraft.customColumns || [])].sort(
      (a, b) => a.order - b.order
    );
  }, [configDraft.customColumns]);

  const filteredCrudItems = useMemo(() => {
    const q = dataFilterQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (!canAccessGroup(item.g)) return false;
      if (dataFilterGroup !== 'ALL' && item.g !== dataFilterGroup) return false;
      if (!q) return true;
      return (
        getItemCode(item).toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.g.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q)
      );
    });
  }, [items, dataFilterQuery, dataFilterGroup, allowedGroupsForUser]);

  if (!open) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);
    try {
      const user = await authenticateAdminUser(loginUsername, loginPassword);
      if (!user) {
        setLoginError(L.loginInvalid);
        return;
      }
      setCurrentUser(user);
      setLoginPassword('');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleImageFileUpload = (
    file: File | undefined,
    field: 'logoUrl' | 'bannerImageUrl'
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setConfigDraft((prev) => ({ ...prev, [field]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveConfig = async (
    e?: React.FormEvent,
    overridePartial?: Partial<SystemConfig>
  ) => {
    if (e) e.preventDefault();
    const merged = overridePartial
      ? { ...configDraft, ...overridePartial }
      : configDraft;
    const saved = await saveSystemConfig(merged);
    setConfigDraft(saved);
    onConfigUpdated(saved);
    showStatus('Đã lưu cấu hình & đồng bộ trạng thái hệ thống.');
  };

  const handleAddCustomColumn = () => {
    const label = newColLabel.trim();
    if (!label) return;
    const existing = configDraft.customColumns || [];
    const baseId = slugifyColumnId(label);
    const id = existing.some((c) => c.id === baseId)
      ? `${baseId}_${Date.now().toString(36).slice(-4)}`
      : baseId;
    const nextCols: CustomColumnDef[] = [
      ...existing,
      { id, label, visible: true, order: existing.length + 1 },
    ];
    setConfigDraft((prev) => ({ ...prev, customColumns: nextCols }));
    setNewColLabel('');
    showStatus(`Đã thêm cột "${label}" — nhấn Lưu cấu hình để áp dụng.`);
  };

  const handleMoveCustomColumn = (colId: string, dir: -1 | 1) => {
    const list = [...customColumnsSorted];
    const idx = list.findIndex((c) => c.id === colId);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= list.length) return;
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);
    const reindexed = list.map((c, i) => ({ ...c, order: i + 1 }));
    setConfigDraft((prev) => ({ ...prev, customColumns: reindexed }));
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    if (!canAccessGroup(editingItem.g)) {
      showStatus('Bạn không có quyền quản lý nhóm hàng này.');
      return;
    }
    const next = await upsertFoodItemInDb(editingItem);
    onItemsUpdated(next);
    setEditingItem(null);
    setIsAddingNew(false);
    showStatus(`Đã lưu sản phẩm ${getItemCode(editingItem)}.`);
  };

  const handleInlineFieldChange = (
    item: FoodItem,
    field: keyof FoodItem,
    value: string
  ) => {
    const code = getItemCode(item);
    setInlineDrafts((prev) => ({
      ...prev,
      [code]: {
        ...(prev[code] || item),
        [field]: value,
      },
    }));
  };

  const handleInlineCustomFieldChange = (
    item: FoodItem,
    colId: string,
    value: string
  ) => {
    const code = getItemCode(item);
    const base = inlineDrafts[code] || item;
    setInlineDrafts((prev) => ({
      ...prev,
      [code]: {
        ...base,
        customFields: {
          ...(base.customFields || {}),
          [colId]: value,
        },
      },
    }));
  };

  const handleSaveInlineRow = async (code: string) => {
    const draft = inlineDrafts[code];
    if (!draft) return;
    const next = await upsertFoodItemInDb(draft);
    onItemsUpdated(next);
    setInlineDrafts((prev) => {
      const clone = { ...prev };
      delete clone[code];
      return clone;
    });
    showStatus(`Đã cập nhật nhanh hàng ${code}.`);
  };

  const handleMoveItemRow = async (item: FoodItem, dir: -1 | 1) => {
    const code = getItemCode(item);
    const idx = items.findIndex((it) => getItemCode(it) === code);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    const saved = await saveOrderedItemsInDb(reordered);
    onItemsUpdated(saved);
    showStatus(`Đã di chuyển hàng ${code} ${dir < 0 ? 'lên trên' : 'xuống dưới'}.`);
  };

  const handleDuplicateItem = async (item: FoodItem) => {
    const { items: next, createdCode } = await duplicateFoodItemInDb(item);
    onItemsUpdated(next);
    showStatus(`Đã nhân bản thành ${createdCode}.`);
  };

  const handleDeleteItem = async (item: FoodItem) => {
    if (!hasPerm('delete_items')) return;
    const code = getItemCode(item);
    const next = await deleteFoodItemInDb(code);
    setSelectedCodes((prev) => prev.filter((c) => c !== code));
    onItemsUpdated(next);
    showStatus(`Đã xóa mặt hàng ${code}.`);
  };

  const handleBulkDelete = async () => {
    if (!hasPerm('delete_items') || selectedCodes.length === 0) return;
    const next = await bulkDeleteItemsInDb(selectedCodes);
    const count = selectedCodes.length;
    setSelectedCodes([]);
    onItemsUpdated(next);
    showStatus(`Đã xóa ${count} mục đã chọn.`);
  };

  const handleBulkMoveGroup = async () => {
    if (!bulkMoveTargetGroup.trim() || selectedCodes.length === 0) return;
    const next = await bulkMoveGroupInDb(selectedCodes, bulkMoveTargetGroup.trim());
    const count = selectedCodes.length;
    setSelectedCodes([]);
    onItemsUpdated(next);
    showStatus(`Đã chuyển ${count} mục sang nhóm "${bulkMoveTargetGroup.trim()}".`);
  };

  const handleRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameOldGroup || !renameNewGroup.trim()) return;
    const next = await renameGroupInDb(renameOldGroup, renameNewGroup.trim());
    onItemsUpdated(next);
    showStatus(`Đã đổi tên nhóm "${renameOldGroup}" thành "${renameNewGroup.trim()}".`);
    setRenameOldGroup('');
    setRenameNewGroup('');
  };

  const handleResetBaseline = async () => {
    const next = await resetCatalogToDefaultBaseline();
    setSelectedCodes([]);
    setInlineDrafts({});
    onItemsUpdated(next);
    onConfigUpdated({ ...DEFAULT_SYSTEM_CONFIG, updatedAt: Date.now() });
    showStatus('Đã khôi phục toàn bộ 66 mục chuẩn SHE-QĐ-FB13 & giao diện mặc định.');
  };

  const handleFilePickForImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImportError('');
    setImportPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseImportFile(file);
      setImportPreview({
        filename: file.name,
        items: parsed.items,
        config: parsed.config,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleApplyImport = async () => {
    if (!importPreview) return;
    const next = await applyImportedItemsToDb(
      importPreview.items,
      importMode,
      importPreview.config
    );
    onItemsUpdated(next);
    if (importMode === 'overwrite' && importPreview.config) {
      onConfigUpdated(importPreview.config);
    }
    setImportPreview(null);
    showStatus(
      `Import thành công (${importMode === 'overwrite' ? 'Ghi đè toàn bộ' : 'Cập nhật & Bổ sung'})`
    );
  };

  const handleChangeSuperPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'super_admin') return;
    if (newAdminPass.length < 4) {
      showStatus('Mật khẩu mới cần ít nhất 4 ký tự.');
      return;
    }
    const oldHash = await hashPasswordSha256(oldAdminPass);
    if (oldHash !== currentUser.passwordHash) {
      showStatus('Mật khẩu hiện tại không đúng.');
      return;
    }
    const nextHash = await hashPasswordSha256(newAdminPass);
    const updatedUser: AdminUser = { ...currentUser, passwordHash: nextHash };
    await db.users.put(updatedUser);
    setCurrentUser(updatedUser);
    setOldAdminPass('');
    setNewAdminPass('');
    await loadUsers();
    showStatus('Đã cập nhật mật khẩu Super Admin (băm SHA-256).');
  };

  const handleCreateSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = newSubUsername.trim().toLowerCase();
    if (!uname || newSubPassword.length < 4) {
      showStatus('Vui lòng nhập tên user và mật khẩu >= 4 ký tự.');
      return;
    }
    if (usersList.some((u) => u.username.toLowerCase() === uname)) {
      showStatus('Tên đăng nhập đã tồn tại.');
      return;
    }
    const passwordHash = await hashPasswordSha256(newSubPassword);
    const subUser: AdminUser = {
      id: `user-${Date.now()}`,
      username: uname,
      passwordHash,
      role: 'sub_admin',
      permissions: newSubPermissions,
      allowedGroups: newSubAllGroups
        ? ['ALL']
        : newSubGroups.length > 0
          ? newSubGroups
          : ['ALL'],
      disabled: false,
      createdAt: Date.now(),
    };
    await db.users.put(subUser);
    setNewSubUsername('');
    setNewSubPassword('');
    await loadUsers();
    showStatus(`Đã tạo tài khoản phân quyền "${uname}".`);
  };

  const startEditingSubUser = (u: AdminUser) => {
    setEditingUserId(u.id);
    setEditUserPerms([...u.permissions]);
    const isAll = u.allowedGroups.includes('ALL');
    setEditUserAllGroups(isAll);
    setEditUserGroups(isAll ? [] : [...u.allowedGroups]);
    setEditUserDisabled(Boolean(u.disabled));
    setEditUserNewPassword('');
  };

  const handleSaveEditedSubUser = async (user: AdminUser) => {
    let passwordHash = user.passwordHash;
    if (editUserNewPassword.trim()) {
      if (editUserNewPassword.trim().length < 4) {
        showStatus('Mật khẩu mới cần tối thiểu 4 ký tự.');
        return;
      }
      passwordHash = await hashPasswordSha256(editUserNewPassword.trim());
    }
    const updated: AdminUser = {
      ...user,
      passwordHash,
      permissions: editUserPerms,
      allowedGroups: editUserAllGroups
        ? ['ALL']
        : editUserGroups.length > 0
          ? editUserGroups
          : ['ALL'],
      disabled: editUserDisabled,
    };
    await db.users.put(updated);
    setEditingUserId(null);
    setEditUserNewPassword('');
    await loadUsers();
    showStatus(`Đã cập nhật quyền cho tài khoản "${user.username}".`);
  };

  const handleDeleteSubUser = async (userId: string) => {
    await db.users.delete(userId);
    if (editingUserId === userId) setEditingUserId(null);
    await loadUsers();
    showStatus('Đã xóa tài khoản phụ.');
  };

  const cloudStatus = getCloudSyncStatus(cloudConfigDraft);

  const realtimeBadge =
    realtimeStatus === 'connected'
      ? {
          cls: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]',
          label: 'Realtime WebSocket Live',
        }
      : realtimeStatus === 'polling'
        ? {
            cls: 'bg-[#EEF6F8] border-[#BBD7E3] text-[#0F5E6E]',
            label: 'Đồng bộ nền (Auto Polling)',
          }
        : realtimeStatus === 'connecting'
          ? {
              cls: 'bg-[#FDF8EB] border-[#DFBA51] text-[#8A6510]',
              label: 'Đang kết nối Realtime...',
            }
          : {
              cls: 'bg-[#F3F4F6] border-[#D1D5DB] text-[#4B5563]',
              label: 'Offline / Chưa bật Cloud',
            };

  const allFilteredSelected =
    filteredCrudItems.length > 0 &&
    filteredCrudItems.every((it) => selectedCodes.includes(getItemCode(it)));

  return (
    <div
      className="fade-in fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={L.dialogLabel}
    >
      <button
        type="button"
        aria-label={L.close}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
      />

      <div className="sheet-up relative w-full max-w-[1060px] max-h-[94dvh] flex flex-col bg-white text-[#182230] border border-[#E2DDD0] rounded-t-[24px] sm:rounded-[20px] shadow-2xl overflow-hidden">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#D6D0C0] sm:hidden shrink-0" />

        {/* Header */}
        <div className="bg-[#122A47] text-white px-5 py-3.5 border-b border-[#C9A227]/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-white/10 border border-[#C9A227]/50 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-[#E2C665]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15.5px] font-extrabold truncate">
                {L.headerTitle}
              </h2>
              <p className="text-[11px] text-[#E2C665] truncate">
                {currentUser
                  ? `${L.authSubtitlePrefix} ${currentUser.username} (${currentUser.role === 'super_admin' ? L.roleSuper : L.roleSub})`
                  : L.authProtected}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {currentUser && (
              <button
                type="button"
                onClick={() => setCurrentUser(null)}
                title={L.logout}
                className="h-9 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-bold flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">{L.logout}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={L.close}
              className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Toast Inside Modal */}
        {toastMsg && (
          <div className="bg-[#EEF6F8] border-b border-[#BBD7E3] px-5 py-2 text-[12.5px] font-bold text-[#0F5E6E] flex items-center gap-2 shrink-0">
            <Check size={15} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Auth Screen OR Authenticated Dashboard */}
        {!currentUser ? (
          <form
            onSubmit={(e) => void handleLoginSubmit(e)}
            className="p-6 sm:p-8 max-w-md mx-auto w-full space-y-4 my-auto"
          >
            <div className="text-center space-y-1.5">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#F2EFE8] border border-[#DFD9CB] text-[#122A47] flex items-center justify-center">
                <Lock size={22} />
              </div>
              <h3 className="text-[18px] font-extrabold text-[#122A47]">
                {L.loginTitle}
              </h3>
              <p className="text-[12.5px] text-[#5C6573]">{L.loginDesc}</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                {L.usernameLabel}
              </label>
              <input
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full h-11 rounded-xl border border-[#D8D2C2] focus:border-[#1E4A75] px-3.5 text-[14px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                {L.passwordLabel}
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={L.passwordPlaceholder}
                autoFocus
                required
                className="w-full h-11 rounded-xl border border-[#D8D2C2] focus:border-[#1E4A75] px-3.5 text-[14px] font-medium"
              />
            </div>

            {loginError && (
              <p className="text-[12.5px] font-bold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white font-bold text-[14px] transition-colors"
            >
              {authLoading ? L.loginLoading : L.loginButton}
            </button>
          </form>
        ) : (
          <>
            {/* RBAC-Gated Tabs */}
            <div className="px-4 sm:px-5 py-2.5 bg-[#FAF9F6] border-b border-[#EAE5DA] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {(hasPerm('edit_items') || hasPerm('delete_items')) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('data')}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'data'
                      ? 'bg-[#122A47] text-white'
                      : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
                  }`}
                >
                  <Database size={14} />
                  <span>
                    {L.tabData} ({filteredCrudItems.length})
                  </span>
                </button>
              )}

              {(hasPerm('manage_config') || hasPerm('lock_app')) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'config'
                      ? 'bg-[#122A47] text-white'
                      : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
                  }`}
                >
                  <Settings size={14} />
                  <span>{L.tabConfig}</span>
                  {configDraft.appLocked && (
                    <span className="ml-0.5 rounded px-1.5 py-0.5 text-[10px] bg-[#FEE2E2] text-[#B91C1C]">
                      LOCKED
                    </span>
                  )}
                </button>
              )}

              {(hasPerm('view_export_reports') || hasPerm('import_data')) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('io')}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'io'
                      ? 'bg-[#122A47] text-white'
                      : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
                  }`}
                >
                  <Download size={14} />
                  <span>{L.tabIo}</span>
                </button>
              )}

              {currentUser.role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'bg-[#122A47] text-white'
                      : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
                  }`}
                >
                  <Users size={14} />
                  <span>{L.tabUsers}</span>
                </button>
              )}

              {(currentUser.role === 'super_admin' ||
                hasPerm('manage_cloud') ||
                hasPerm('manage_config')) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('cloud')}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'cloud'
                      ? 'bg-[#122A47] text-white'
                      : 'bg-white border border-[#DFD9CB] text-[#2B3647]'
                  }`}
                >
                  <Cloud size={14} />
                  <span>{L.tabCloud}</span>
                </button>
              )}
            </div>

            {/* Active Tab Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
              {/* TAB 1: SYSTEM CONFIG, CUSTOM COLUMNS & APP LOCK */}
              {activeTab === 'config' &&
                (hasPerm('manage_config') || hasPerm('lock_app')) && (
                  <form
                    onSubmit={(e) => void handleSaveConfig(e)}
                    className="space-y-5"
                  >
                    {/* Global App Lock Control */}
                    {(hasPerm('lock_app') || currentUser.role === 'super_admin') && (
                      <div
                        className={`rounded-2xl border p-4 space-y-3 ${
                          configDraft.appLocked
                            ? 'border-[#FCA5A5] bg-[#FEF2F2]'
                            : 'border-[#DFD9CB] bg-[#FAF9F6]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {configDraft.appLocked ? (
                              <Lock size={18} className="text-[#B91C1C]" />
                            ) : (
                              <Unlock size={18} className="text-[#0F5E6E]" />
                            )}
                            <div>
                              <h3 className="text-[14px] font-extrabold text-[#122A47]">
                                Khóa truy cập App toàn hệ thống (Global App Lock)
                              </h3>
                              <p className="text-[12px] text-[#5C6573]">
                                Khi bật, toàn bộ người dùng trên mọi thiết bị sẽ thấy màn hình khóa (Admin vẫn đăng nhập mở khóa được).
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const nextLocked = !configDraft.appLocked;
                              setConfigDraft((p) => ({
                                ...p,
                                appLocked: nextLocked,
                              }));
                              void handleSaveConfig(undefined, {
                                appLocked: nextLocked,
                              });
                            }}
                            className={`h-9 px-3.5 rounded-xl font-bold text-[12.5px] flex items-center gap-1.5 transition-colors ${
                              configDraft.appLocked
                                ? 'bg-[#0F5E6E] text-white hover:opacity-90'
                                : 'bg-[#B91C1C] text-white hover:opacity-90'
                            }`}
                          >
                            {configDraft.appLocked ? (
                              <>
                                <Unlock size={14} />
                                <span>Mở khóa App ngay</span>
                              </>
                            ) : (
                              <>
                                <Lock size={14} />
                                <span>Khóa App ngay</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Thông báo hiển thị trên màn hình khóa
                            </label>
                            <input
                              value={configDraft.appLockMessage || ''}
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  appLockMessage: e.target.value,
                                }))
                              }
                              placeholder="Ví dụ: Hệ thống đang tạm khóa để kiểm kê & cập nhật quy định mới Khối SHE."
                              className="w-full h-9 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[12.5px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Mã PIN mở khóa nhanh (tùy chọn)
                            </label>
                            <input
                              value={configDraft.appLockPin || ''}
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  appLockPin: e.target.value,
                                }))
                              }
                              placeholder="VD: 10726 (để trống = chỉ Admin mở)"
                              className="w-full h-9 rounded-lg border border-[#D8D2C2] bg-white px-3 font-mono text-[12.5px]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Assistant Toggle (Bước 1) */}
                    {hasPerm('manage_config') && (
                      <div className="rounded-2xl border border-[#DFD9CB] bg-[#FAF9F6] p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-[#122A47] text-[#E2C665] flex items-center justify-center shrink-0">
                            <Bot size={18} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-extrabold text-[#122A47]">
                              Hiển thị nút &quot;Trợ lý AI&quot; nổi góc màn hình
                            </h3>
                            <p className="text-[12px] text-[#5C6573]">
                              Bật hoặc tắt nút &quot;Trợ lý AI&quot; ở góc dưới bên phải (đồng bộ cho mọi thiết bị nếu bật Cloud).
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const nextEnabled =
                              configDraft.aiAssistantEnabled === false;
                            setConfigDraft((p) => ({
                              ...p,
                              aiAssistantEnabled: nextEnabled,
                            }));
                            void handleSaveConfig(undefined, {
                              aiAssistantEnabled: nextEnabled,
                            });
                          }}
                          className={`h-9 px-3.5 rounded-xl font-bold text-[12.5px] flex items-center gap-1.5 transition-colors shrink-0 ${
                            configDraft.aiAssistantEnabled !== false
                              ? 'bg-[#0F5E6E] text-white hover:opacity-90'
                              : 'bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB]'
                          }`}
                        >
                          <Bot size={14} />
                          <span>
                            {configDraft.aiAssistantEnabled !== false
                              ? 'Đang BẬT (Nhấn để Tắt)'
                              : 'Đang TẮT (Nhấn để Bật)'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Custom Columns Manager */}
                    {hasPerm('manage_config') && (
                      <div className="rounded-2xl border border-[#DFD9CB] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Columns3 size={17} className="text-[#1E4A75]" />
                          <div>
                            <h3 className="text-[14px] font-extrabold text-[#122A47]">
                              Quản lý Cột hiển thị bổ sung (Thêm / Sửa / Di chuyển / Ẩn / Xóa)
                            </h3>
                            <p className="text-[12px] text-[#5C6573]">
                              Các cột tùy chỉnh xuất hiện trong Form nhập liệu, Bảng danh sách, Thẻ sản phẩm và Trợ lý AI.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <input
                            value={newColLabel}
                            onChange={(e) => setNewColLabel(e.target.value)}
                            placeholder="Tên cột mới (ví dụ: Vị trí tủ, Nhà cung cấp, Tiêu chuẩn QA...)"
                            className="flex-1 min-w-[220px] h-9 rounded-lg border border-[#D8D2C2] px-3 text-[13px]"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomColumn}
                            className="h-9 px-3.5 rounded-lg bg-[#122A47] hover:bg-[#1E4A75] text-white text-[12.5px] font-bold flex items-center gap-1"
                          >
                            <Plus size={14} />
                            <span>Thêm cột</span>
                          </button>
                        </div>

                        {customColumnsSorted.length > 0 && (
                          <div className="divide-y divide-[#EAE5DA] rounded-xl border border-[#EAE5DA]">
                            {customColumnsSorted.map((col, idx) => (
                              <div
                                key={col.id}
                                className="p-2.5 flex flex-wrap items-center justify-between gap-2 bg-[#FAF9F6]"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                  <span className="font-mono text-[11px] text-[#8A6510] font-bold">
                                    #{idx + 1}
                                  </span>
                                  <input
                                    value={col.label}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setConfigDraft((p) => ({
                                        ...p,
                                        customColumns: (p.customColumns || []).map(
                                          (c) =>
                                            c.id === col.id ? { ...c, label: val } : c
                                        ),
                                      }));
                                    }}
                                    className="h-8 flex-1 rounded-lg border border-[#D8D2C2] bg-white px-2.5 text-[12.5px] font-bold"
                                  />
                                  <span className="font-mono text-[10.5px] text-[#64748B]">
                                    {col.id}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <label className="flex items-center gap-1 text-[12px] font-semibold cursor-pointer px-2">
                                    <input
                                      type="checkbox"
                                      checked={col.visible}
                                      onChange={(e) => {
                                        const chk = e.target.checked;
                                        setConfigDraft((p) => ({
                                          ...p,
                                          customColumns: (p.customColumns || []).map(
                                            (c) =>
                                              c.id === col.id
                                                ? { ...c, visible: chk }
                                                : c
                                          ),
                                        }));
                                      }}
                                      className="accent-[#122A47]"
                                    />
                                    <span>Hiện</span>
                                  </label>
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveCustomColumn(col.id, -1)}
                                    title="Di chuyển cột lên / sang trái"
                                    className="h-8 w-8 rounded-lg border border-[#DFD9CB] bg-white disabled:opacity-35 flex items-center justify-center"
                                  >
                                    <ArrowUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === customColumnsSorted.length - 1}
                                    onClick={() => handleMoveCustomColumn(col.id, 1)}
                                    title="Di chuyển cột xuống / sang phải"
                                    className="h-8 w-8 rounded-lg border border-[#DFD9CB] bg-white disabled:opacity-35 flex items-center justify-center"
                                  >
                                    <ArrowDown size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfigDraft((p) => ({
                                        ...p,
                                        customColumns: (p.customColumns || []).filter(
                                          (c) => c.id !== col.id
                                        ),
                                      }));
                                    }}
                                    title="Xóa cột"
                                    className="h-8 w-8 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* General Title, Logo, Banner & Alert Banner */}
                    {hasPerm('manage_config') && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                              Tên ứng dụng (Desktop Title)
                            </label>
                            <input
                              value={configDraft.appTitle}
                              onChange={(e) =>
                                setConfigDraft((p) => ({ ...p, appTitle: e.target.value }))
                              }
                              className="w-full h-10 rounded-xl border border-[#D8D2C2] px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                              Tiêu đề phụ (Subtitle / Đơn vị)
                            </label>
                            <input
                              value={configDraft.appSubtitle}
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  appSubtitle: e.target.value,
                                }))
                              }
                              className="w-full h-10 rounded-xl border border-[#D8D2C2] px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                              Dòng 1 trên Mobile
                            </label>
                            <input
                              value={configDraft.mobileTitleLine1}
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  mobileTitleLine1: e.target.value,
                                }))
                              }
                              className="w-full h-10 rounded-xl border border-[#D8D2C2] px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                              Dòng 2 trên Mobile
                            </label>
                            <input
                              value={configDraft.mobileTitleLine2}
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  mobileTitleLine2: e.target.value,
                                }))
                              }
                              className="w-full h-10 rounded-xl border border-[#D8D2C2] px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                              Nội dung Footer bên trái (Chân trang)
                            </label>
                            <input
                              value={
                                configDraft.footerLeftText ??
                                DEFAULT_SYSTEM_CONFIG.footerLeftText ??
                                ''
                              }
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  footerLeftText: e.target.value,
                                }))
                              }
                              placeholder="HỆ THỐNG TRA CỨU NỘI BỘ - BAN ẨM THỰC - SUN WORLD BA NA HILLS"
                              className="w-full h-10 rounded-xl border border-[#D8D2C2] px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#2B3647] mb-1">
                              Nội dung Footer bên phải (Tác giả / Bản quyền)
                            </label>
                            <input
                              value={
                                configDraft.footerRightText ??
                                DEFAULT_SYSTEM_CONFIG.footerRightText ??
                                ''
                              }
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  footerRightText: e.target.value,
                                }))
                              }
                              placeholder="Developed by Le Hoang Phuc"
                              className="w-full h-10 rounded-xl border border-[#D8D2C2] px-3 text-[13px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="rounded-xl border border-[#EAE5DA] p-3.5 bg-[#FAF9F6] space-y-2">
                            <label className="block text-[12px] font-bold text-[#122A47]">
                              Logo ứng dụng (URL hoặc Tải ảnh lên)
                            </label>
                            <input
                              value={configDraft.logoUrl}
                              onChange={(e) =>
                                setConfigDraft((p) => ({ ...p, logoUrl: e.target.value }))
                              }
                              placeholder="Để trống để dùng huy hiệu SHE mặc định"
                              className="w-full h-9 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[12.5px]"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageFileUpload(e.target.files?.[0], 'logoUrl')
                              }
                              className="block w-full text-[12px] text-[#5C6573]"
                            />
                          </div>

                          <div className="rounded-xl border border-[#EAE5DA] p-3.5 bg-[#FAF9F6] space-y-2">
                            <label className="block text-[12px] font-bold text-[#122A47]">
                              Banner trang chủ (tùy chọn)
                            </label>
                            <input
                              value={configDraft.bannerImageUrl}
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  bannerImageUrl: e.target.value,
                                }))
                              }
                              placeholder="Để trống nếu không dùng banner"
                              className="w-full h-9 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[12.5px]"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageFileUpload(
                                  e.target.files?.[0],
                                  'bannerImageUrl'
                                )
                              }
                              className="block w-full text-[12px] text-[#5C6573]"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-[#E8D9A8] bg-[#FDF8EB] p-4 space-y-2.5">
                          <label className="flex items-center gap-2 text-[13px] font-bold text-[#122A47] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={configDraft.alertBannerEnabled}
                              onChange={(e) =>
                                setConfigDraft((p) => ({
                                  ...p,
                                  alertBannerEnabled: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 accent-[#122A47]"
                            />
                            <span>Bật thông báo nổi bật trên trang chủ (Alert Banner)</span>
                          </label>
                          <input
                            value={configDraft.alertBannerText}
                            onChange={(e) =>
                              setConfigDraft((p) => ({
                                ...p,
                                alertBannerText: e.target.value,
                              }))
                            }
                            placeholder="Ví dụ: Lưu ý kiểm tra nhiệt độ tủ mát đầu ca lúc 07:00 hằng ngày..."
                            className="w-full h-10 rounded-xl border border-[#DFBA51] bg-white px-3 text-[13px]"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="submit"
                        className="h-10 px-5 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold flex items-center gap-1.5"
                      >
                        <Save size={15} />
                        <span>Lưu &amp; Đồng bộ cấu hình</span>
                      </button>
                      {hasPerm('manage_config') && (
                        <button
                          type="button"
                          onClick={() => setConfigDraft(DEFAULT_SYSTEM_CONFIG)}
                          className="h-10 px-4 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] text-[13px] font-bold text-[#2B3647]"
                        >
                          Đặt lại mặc định giao diện
                        </button>
                      )}
                    </div>
                  </form>
                )}

              {/* TAB 2: DATA CRUD + INLINE EDIT + REORDER + BULK ACTIONS */}
              {activeTab === 'data' &&
                (hasPerm('edit_items') || hasPerm('delete_items')) && (
                  <div className="space-y-3.5">
                    {!editingItem ? (
                      <>
                        {/* Search + Group + Action Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                            <input
                              value={dataFilterQuery}
                              onChange={(e) => setDataFilterQuery(e.target.value)}
                              placeholder="Tìm loại thực phẩm, mã SHE-01, nhóm..."
                              className="h-10 flex-1 min-w-[180px] rounded-xl border border-[#D8D2C2] px-3 text-[13px]"
                            />
                            <select
                              value={dataFilterGroup}
                              onChange={(e) => setDataFilterGroup(e.target.value)}
                              className="h-10 max-w-[220px] rounded-xl border border-[#D8D2C2] px-2.5 text-[12.5px] font-semibold"
                            >
                              <option value="ALL">Tất cả nhóm được phân quyền</option>
                              {scopedGroups.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {hasPerm('edit_items') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineEditMode((v) => !v);
                                    setInlineDrafts({});
                                  }}
                                  className={`h-10 px-3 rounded-xl border text-[12.5px] font-bold flex items-center gap-1.5 ${
                                    inlineEditMode
                                      ? 'bg-[#0F5E6E] border-[#0F5E6E] text-white'
                                      : 'bg-white border-[#DFD9CB] text-[#122A47]'
                                  }`}
                                >
                                  <Edit3 size={14} />
                                  <span>
                                    {inlineEditMode ? 'Đang Sửa Ô Trực Tiếp' : 'Sửa ô trực tiếp'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowGroupTools((v) => !v)}
                                  className={`h-10 px-3 rounded-xl border text-[12.5px] font-bold flex items-center gap-1.5 ${
                                    showGroupTools
                                      ? 'bg-[#EEF6F8] border-[#1E4A75] text-[#122A47]'
                                      : 'bg-white border-[#DFD9CB] text-[#122A47]'
                                  }`}
                                >
                                  <FolderEdit size={14} />
                                  <span>Nhóm</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingNew(true);
                                    setEditingItem(
                                      createEmptyItemDraft(items, allowedGroupsForUser)
                                    );
                                  }}
                                  className="h-10 px-3.5 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold flex items-center gap-1.5"
                                >
                                  <Plus size={15} />
                                  <span>Thêm hàng</span>
                                </button>
                              </>
                            )}
                            {currentUser.role === 'super_admin' && (
                              <button
                                type="button"
                                onClick={() => void handleResetBaseline()}
                                title="Khôi phục 66 mục chuẩn SHE-QĐ-FB13"
                                className="h-10 px-3 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] hover:bg-[#F2EFE8] text-[#8A6510] text-[12px] font-bold flex items-center gap-1.5"
                              >
                                <RotateCcw size={14} />
                                <span className="hidden sm:inline">Gốc (66)</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Group Rename Tool */}
                        {showGroupTools && hasPerm('edit_items') && (
                          <form
                            onSubmit={(e) => void handleRenameGroup(e)}
                            className="rounded-xl border border-[#D4E2EA] bg-[#F1F7FA] p-3 flex flex-wrap items-end gap-2.5"
                          >
                            <div className="flex-1 min-w-[180px]">
                              <label className="block text-[11px] font-bold text-[#122A47] mb-1">
                                Chọn nhóm cần đổi tên
                              </label>
                              <select
                                value={renameOldGroup}
                                onChange={(e) => setRenameOldGroup(e.target.value)}
                                required
                                className="w-full h-9 rounded-lg border border-[#D8D2C2] bg-white px-2.5 text-[12.5px]"
                              >
                                <option value="">-- Chọn nhóm --</option>
                                {scopedGroups.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[180px]">
                              <label className="block text-[11px] font-bold text-[#122A47] mb-1">
                                Tên nhóm mới
                              </label>
                              <input
                                value={renameNewGroup}
                                onChange={(e) => setRenameNewGroup(e.target.value)}
                                placeholder="Nhập tên nhóm mới..."
                                required
                                className="w-full h-9 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[12.5px]"
                              />
                            </div>
                            <button
                              type="submit"
                              className="h-9 px-4 rounded-lg bg-[#122A47] text-white text-[12.5px] font-bold"
                            >
                              Đổi tên toàn nhóm
                            </button>
                          </form>
                        )}

                        {/* Bulk Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] px-3 py-2 text-[12px]">
                          <label className="flex items-center gap-2 font-bold text-[#122A47] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCodes(
                                    filteredCrudItems.map((it) => getItemCode(it))
                                  );
                                } else {
                                  setSelectedCodes([]);
                                }
                              }}
                              className="h-4 w-4 accent-[#122A47]"
                            />
                            <span>
                              Chọn tất cả ({selectedCodes.length}/{filteredCrudItems.length})
                            </span>
                          </label>

                          {selectedCodes.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              {hasPerm('edit_items') && (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    list="she-bulk-groups"
                                    value={bulkMoveTargetGroup}
                                    onChange={(e) =>
                                      setBulkMoveTargetGroup(e.target.value)
                                    }
                                    placeholder="Nhóm đích để chuyển..."
                                    className="h-8 w-44 rounded-lg border border-[#D8D2C2] bg-white px-2.5 text-[12px]"
                                  />
                                  <datalist id="she-bulk-groups">
                                    {scopedGroups.map((g) => (
                                      <option key={g} value={g} />
                                    ))}
                                  </datalist>
                                  <button
                                    type="button"
                                    onClick={() => void handleBulkMoveGroup()}
                                    className="h-8 px-3 rounded-lg bg-[#1E4A75] text-white font-bold text-[12px]"
                                  >
                                    Chuyển nhóm
                                  </button>
                                </div>
                              )}
                              {hasPerm('delete_items') && (
                                <button
                                  type="button"
                                  onClick={() => void handleBulkDelete()}
                                  className="h-8 px-3 rounded-lg bg-[#B91C1C] text-white font-bold text-[12px] flex items-center gap-1"
                                >
                                  <Trash2 size={13} />
                                  <span>Xóa {selectedCodes.length} mục</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Items List or Inline Spreadsheet Table */}
                        {inlineEditMode ? (
                          <div className="rounded-xl border border-[#EAE5DA] overflow-x-auto max-h-[430px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[12px]">
                              <thead className="sticky top-0 z-10 bg-[#122A47] text-white">
                                <tr>
                                  <th className="p-2 w-8"></th>
                                  <th className="p-2 whitespace-nowrap">Mã</th>
                                  <th className="p-2 min-w-[170px]">Loại cụ thể</th>
                                  <th className="p-2 min-w-[115px]">Phòng (15–25°C)</th>
                                  <th className="p-2 min-w-[115px]">Lạnh (0–5°C)</th>
                                  <th className="p-2 min-w-[125px]">Đông (≤ −18°C)</th>
                                  <th className="p-2 min-w-[180px]">Lưu ý</th>
                                  {customColumnsSorted.map((col) => (
                                    <th key={col.id} className="p-2 min-w-[120px]">
                                      {col.label}
                                    </th>
                                  ))}
                                  <th className="p-2 whitespace-nowrap text-right">
                                    Hành động
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EAE5DA] bg-white">
                                {filteredCrudItems.map((item) => {
                                  const code = getItemCode(item);
                                  const draft = inlineDrafts[code] || item;
                                  const isDirty = Boolean(inlineDrafts[code]);
                                  return (
                                    <tr key={code} className="hover:bg-[#FAF9F6]">
                                      <td className="p-2">
                                        <input
                                          type="checkbox"
                                          checked={selectedCodes.includes(code)}
                                          onChange={(e) => {
                                            setSelectedCodes((prev) =>
                                              e.target.checked
                                                ? [...prev, code]
                                                : prev.filter((c) => c !== code)
                                            );
                                          }}
                                          className="accent-[#122A47]"
                                        />
                                      </td>
                                      <td className="p-2 font-mono font-bold text-[#8A6510] whitespace-nowrap">
                                        {code}
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          value={draft.name}
                                          onChange={(e) =>
                                            handleInlineFieldChange(
                                              item,
                                              'name',
                                              e.target.value
                                            )
                                          }
                                          className="w-full h-8 rounded border border-[#D8D2C2] px-2 text-[12px] font-semibold"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          value={draft.room}
                                          onChange={(e) =>
                                            handleInlineFieldChange(
                                              item,
                                              'room',
                                              e.target.value
                                            )
                                          }
                                          className="w-full h-8 rounded border border-[#D8D2C2] px-2 text-[12px]"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          value={draft.cool}
                                          onChange={(e) =>
                                            handleInlineFieldChange(
                                              item,
                                              'cool',
                                              e.target.value
                                            )
                                          }
                                          className="w-full h-8 rounded border border-[#D8D2C2] px-2 text-[12px]"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          value={draft.freeze}
                                          onChange={(e) =>
                                            handleInlineFieldChange(
                                              item,
                                              'freeze',
                                              e.target.value
                                            )
                                          }
                                          className="w-full h-8 rounded border border-[#D8D2C2] px-2 text-[12px]"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          value={draft.note}
                                          onChange={(e) =>
                                            handleInlineFieldChange(
                                              item,
                                              'note',
                                              e.target.value
                                            )
                                          }
                                          className="w-full h-8 rounded border border-[#D8D2C2] px-2 text-[12px]"
                                        />
                                      </td>
                                      {customColumnsSorted.map((col) => (
                                        <td key={col.id} className="p-1.5">
                                          <input
                                            value={draft.customFields?.[col.id] || ''}
                                            onChange={(e) =>
                                              handleInlineCustomFieldChange(
                                                item,
                                                col.id,
                                                e.target.value
                                              )
                                            }
                                            className="w-full h-8 rounded border border-[#D8D2C2] px-2 text-[12px]"
                                          />
                                        </td>
                                      ))}
                                      <td className="p-1.5 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1">
                                          <button
                                            type="button"
                                            disabled={!isDirty}
                                            onClick={() => void handleSaveInlineRow(code)}
                                            className={`h-8 px-2.5 rounded font-bold text-[11.5px] ${
                                              isDirty
                                                ? 'bg-[#0F5E6E] text-white'
                                                : 'bg-[#F2EFE8] text-[#9CA3AF]'
                                            }`}
                                          >
                                            Lưu
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => void handleMoveItemRow(item, -1)}
                                            title="Di chuyển lên"
                                            className="h-8 w-7 rounded border border-[#DFD9CB] bg-white flex items-center justify-center"
                                          >
                                            <ArrowUp size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => void handleMoveItemRow(item, 1)}
                                            title="Di chuyển xuống"
                                            className="h-8 w-7 rounded border border-[#DFD9CB] bg-white flex items-center justify-center"
                                          >
                                            <ArrowDown size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[#EAE5DA] divide-y divide-[#EAE5DA] max-h-[420px] overflow-y-auto">
                            {filteredCrudItems.map((item) => {
                              const code = getItemCode(item);
                              const isChecked = selectedCodes.includes(code);
                              return (
                                <div
                                  key={code}
                                  className={`p-3 flex items-center justify-between gap-2.5 hover:bg-[#FAF9F6] ${
                                    isChecked ? 'bg-[#EEF6F8]/60' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        setSelectedCodes((prev) =>
                                          e.target.checked
                                            ? [...prev, code]
                                            : prev.filter((c) => c !== code)
                                        );
                                      }}
                                      className="mt-1 h-4 w-4 accent-[#122A47] shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 text-[11.5px]">
                                        <span className="font-mono font-bold text-[#8A6510]">
                                          {code}
                                        </span>
                                        <span className="text-[#5C6573] truncate">
                                          {item.g}
                                        </span>
                                      </div>
                                      <p className="font-bold text-[13.5px] text-[#122A47] truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[11.5px] text-[#5C6573] truncate">
                                        Phòng: {item.room} · Lạnh: {item.cool} · Đông:{' '}
                                        {item.freeze}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {hasPerm('edit_items') && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => void handleMoveItemRow(item, -1)}
                                          title="Di chuyển lên"
                                          className="h-8 w-8 rounded-lg border border-[#DFD9CB] bg-white hover:border-[#1E4A75] text-[#475569] flex items-center justify-center"
                                        >
                                          <ArrowUp size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void handleMoveItemRow(item, 1)}
                                          title="Di chuyển xuống"
                                          className="h-8 w-8 rounded-lg border border-[#DFD9CB] bg-white hover:border-[#1E4A75] text-[#475569] flex items-center justify-center"
                                        >
                                          <ArrowDown size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void handleDuplicateItem(item)}
                                          title="Nhân bản mặt hàng"
                                          className="h-8 w-8 rounded-lg border border-[#DFD9CB] bg-white hover:border-[#1E4A75] text-[#1E4A75] flex items-center justify-center"
                                        >
                                          <Copy size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsAddingNew(false);
                                            setEditingItem({
                                              ...item,
                                              customFields: {
                                                ...(item.customFields || {}),
                                              },
                                            });
                                          }}
                                          className="h-8 px-2.5 rounded-lg border border-[#DFD9CB] bg-white hover:border-[#1E4A75] text-[#122A47] text-[12px] font-bold flex items-center gap-1"
                                        >
                                          <Edit3 size={13} />
                                          <span className="hidden sm:inline">Sửa</span>
                                        </button>
                                      </>
                                    )}
                                    {hasPerm('delete_items') && (
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteItem(item)}
                                        aria-label={`Xóa ${code}`}
                                        className="h-8 w-8 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] flex items-center justify-center"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <form
                        onSubmit={(e) => void handleSaveItem(e)}
                        className="rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] p-4 space-y-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-[15px] font-extrabold text-[#122A47]">
                            {isAddingNew
                              ? 'Thêm mặt hàng mới'
                              : `Chỉnh sửa ${getItemCode(editingItem)}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(null);
                              setIsAddingNew(false);
                            }}
                            className="text-[12.5px] font-bold text-[#5C6573] hover:text-[#122A47]"
                          >
                            ← Quay lại danh sách
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Quy định áp dụng
                            </label>
                            <select
                              disabled
                              value={editingItem.a}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p
                                    ? { ...p, a: e.target.value as AppendixCode }
                                    : p
                                )
                              }
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-2.5 text-[13px]"
                            >
                              <option value="SHE">SHE — SHE-QĐ-FB13</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Số thứ tự (STT)
                            </label>
                            <input
                              type="number"
                              min={1}
                              disabled={!isAddingNew}
                              value={editingItem.n}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, n: Number(e.target.value) || 1 } : p
                                )
                              }
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Nhóm thực phẩm
                            </label>
                            <input
                              list="she-groups-list"
                              value={editingItem.g}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, g: e.target.value } : p
                                )
                              }
                              required
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                            <datalist id="she-groups-list">
                              {scopedGroups.map((g) => (
                                <option key={g} value={g} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Loại thực phẩm cụ thể *
                            </label>
                            <input
                              value={editingItem.name}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, name: e.target.value } : p
                                )
                              }
                              required
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Nhiệt độ bảo quản chuẩn (nếu có)
                            </label>
                            <input
                              value={editingItem.standardTemp || ''}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, standardTemp: e.target.value } : p
                                )
                              }
                              placeholder="Ví dụ: 0–5°C hoặc ≤ −18°C"
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Nhiệt độ phòng (15–25°C)
                            </label>
                            <input
                              value={editingItem.room}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, room: e.target.value } : p
                                )
                              }
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Nhiệt độ lạnh (0–5°C)
                            </label>
                            <input
                              value={editingItem.cool}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, cool: e.target.value } : p
                                )
                              }
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Nhiệt độ đông (≤ −18°C)
                            </label>
                            <input
                              value={editingItem.freeze}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, freeze: e.target.value } : p
                                )
                              }
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              HSD chưa mở bao bì
                            </label>
                            <input
                              value={editingItem.shelfLifeUnopened || ''}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, shelfLifeUnopened: e.target.value } : p
                                )
                              }
                              placeholder="Theo NSX / 6 tháng..."
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              HSD sau mở bao bì
                            </label>
                            <input
                              value={editingItem.shelfLifeOpened || ''}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, shelfLifeOpened: e.target.value } : p
                                )
                              }
                              placeholder="3 ngày / Trong ngày..."
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Quy cách bảo quản
                            </label>
                            <input
                              value={editingItem.packagingSpec || ''}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, packagingSpec: e.target.value } : p
                                )
                              }
                              placeholder="Hút chân không / Bọc màng bọc..."
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Ghi chú vận hành
                            </label>
                            <input
                              value={editingItem.note}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, note: e.target.value } : p
                                )
                              }
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Ghi chú HACCP / QA
                            </label>
                            <input
                              value={editingItem.haccpNote || editingItem.flag}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p
                                    ? {
                                        ...p,
                                        haccpNote: e.target.value,
                                        flag: e.target.value,
                                      }
                                    : p
                                )
                              }
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                        </div>

                        {customColumnsSorted.length > 0 && (
                          <div className="rounded-xl border border-[#D4E2EA] bg-white p-3 space-y-2">
                            <p className="text-[11.5px] font-extrabold text-[#122A47]">
                              Giá trị các Cột tùy chỉnh
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {customColumnsSorted.map((col) => (
                                <div key={col.id}>
                                  <label className="block text-[11px] font-bold text-[#2B3647] mb-1">
                                    {col.label}
                                  </label>
                                  <input
                                    value={editingItem.customFields?.[col.id] || ''}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setEditingItem((p) =>
                                        p
                                          ? {
                                              ...p,
                                              customFields: {
                                                ...(p.customFields || {}),
                                                [col.id]: v,
                                              },
                                            }
                                          : p
                                      );
                                    }}
                                    className="w-full h-9 rounded-lg border border-[#D8D2C2] px-3 text-[12.5px]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            className="h-10 px-5 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold flex items-center gap-1.5"
                          >
                            <Save size={15} />
                            <span>Lưu vào hệ thống</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(null);
                              setIsAddingNew(false);
                            }}
                            className="h-10 px-4 rounded-xl border border-[#DFD9CB] bg-white text-[13px] font-bold"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              {/* TAB 3: IMPORT / EXPORT */}
              {activeTab === 'io' &&
                (hasPerm('view_export_reports') || hasPerm('import_data')) && (
                  <div className="space-y-4">
                    {hasPerm('view_export_reports') && (
                      <div className="rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] p-4 space-y-3">
                        <h3 className="text-[14.5px] font-extrabold text-[#122A47]">
                          Xuất toàn bộ dữ liệu (Export)
                        </h3>
                        <p className="text-[12.5px] text-[#5C6573]">
                          Tải bản sao lưu đầy đủ (bao gồm cả thứ tự hàng &amp; cột tùy chỉnh) để lưu trữ hoặc mở bằng Excel.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => exportCatalogToJson(items, config)}
                            className="h-10 px-4 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold flex items-center gap-1.5"
                          >
                            <Download size={15} />
                            <span>Backup .JSON</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => exportCatalogToXlsx(items)}
                            className="h-10 px-4 rounded-xl bg-[#0F5E6E] hover:opacity-90 text-white text-[13px] font-bold flex items-center gap-1.5"
                          >
                            <Download size={15} />
                            <span>Báo cáo .XLSX</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => exportCatalogToCsv(items)}
                            className="h-10 px-4 rounded-xl border border-[#DFD9CB] bg-white hover:border-[#122A47] text-[#122A47] text-[13px] font-bold flex items-center gap-1.5"
                          >
                            <Download size={15} />
                            <span>Báo cáo .CSV</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {hasPerm('import_data') && (
                      <div className="rounded-xl border border-[#EAE5DA] bg-white p-4 space-y-3">
                        <h3 className="text-[14.5px] font-extrabold text-[#122A47]">
                          Nhập dữ liệu từ File (.JSON / .CSV / .XLSX)
                        </h3>

                        <div className="flex flex-wrap gap-3 text-[13px]">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold">
                            <input
                              type="radio"
                              name="importMode"
                              checked={importMode === 'merge'}
                              onChange={() => setImportMode('merge')}
                              className="accent-[#122A47]"
                            />
                            <span>Cập nhật &amp; Bổ sung thêm (Giữ dữ liệu cũ)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#9A3412]">
                            <input
                              type="radio"
                              name="importMode"
                              checked={importMode === 'overwrite'}
                              onChange={() => setImportMode('overwrite')}
                              className="accent-[#9A3412]"
                            />
                            <span>Ghi đè toàn bộ (Thay thế danh mục hiện tại)</span>
                          </label>
                        </div>

                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#D8D2C2] hover:border-[#1E4A75] rounded-xl p-5 cursor-pointer bg-[#FAF9F6] text-[13px] font-bold text-[#1E4A75]">
                          <Upload size={18} />
                          <span>Chọn file .json, .csv hoặc .xlsx để kiểm tra</span>
                          <input
                            type="file"
                            accept=".json,.csv,.xlsx,.xls"
                            onChange={(e) => void handleFilePickForImport(e)}
                            className="hidden"
                          />
                        </label>

                        {importError && (
                          <p className="text-[12.5px] font-bold text-[#B91C1C]">
                            {importError}
                          </p>
                        )}

                        {importPreview && (
                          <div className="rounded-xl border border-[#BBD7E3] bg-[#EEF6F8] p-3.5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[13px] font-bold text-[#122A47]">
                                Đọc được {importPreview.items.length} sản phẩm từ{' '}
                                {importPreview.filename}
                              </p>
                              <p className="text-[11.5px] text-[#5C6573]">
                                Chế độ:{' '}
                                {importMode === 'overwrite'
                                  ? 'Ghi đè toàn bộ'
                                  : 'Cập nhật & Bổ sung thêm'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleApplyImport()}
                              className="h-9 px-4 rounded-lg bg-[#122A47] text-white text-[12.5px] font-bold"
                            >
                              Xác nhận Import
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* TAB 4: RBAC USERS & PASSWORD (SUPER ADMIN ONLY) */}
              {activeTab === 'users' && currentUser.role === 'super_admin' && (
                <div className="space-y-5">
                  <form
                    onSubmit={(e) => void handleChangeSuperPassword(e)}
                    className="rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] p-4 space-y-3"
                  >
                    <h3 className="text-[14px] font-extrabold text-[#122A47] flex items-center gap-1.5">
                      <KeyRound size={16} className="text-[#8A6510]" />
                      <span>Đổi mật khẩu Super Admin (Lưu dạng Hash SHA-256)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="password"
                        value={oldAdminPass}
                        onChange={(e) => setOldAdminPass(e.target.value)}
                        placeholder="Mật khẩu hiện tại"
                        required
                        className="h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                      />
                      <input
                        type="password"
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                        placeholder="Mật khẩu mới (>= 4 ký tự)"
                        required
                        className="h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                      />
                      <button
                        type="submit"
                        className="h-10 rounded-lg bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold"
                      >
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </form>

                  {/* Create Sub-User with Granular Permissions */}
                  <form
                    onSubmit={(e) => void handleCreateSubUser(e)}
                    className="rounded-xl border border-[#EAE5DA] bg-white p-4 space-y-3"
                  >
                    <h3 className="text-[14px] font-extrabold text-[#122A47] flex items-center gap-1.5">
                      <UserPlus size={16} className="text-[#1E4A75]" />
                      <span>Tạo tài khoản nhân viên &amp; Phân quyền chi tiết</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={newSubUsername}
                        onChange={(e) => setNewSubUsername(e.target.value)}
                        placeholder="Tên đăng nhập (ví dụ: bepbanh, qa_audit)"
                        required
                        className="h-10 rounded-lg border border-[#D8D2C2] px-3 text-[13px]"
                      />
                      <input
                        type="password"
                        value={newSubPassword}
                        onChange={(e) => setNewSubPassword(e.target.value)}
                        placeholder="Mật khẩu riêng (>= 4 ký tự)"
                        required
                        className="h-10 rounded-lg border border-[#D8D2C2] px-3 text-[13px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[12px] font-bold text-[#2B3647]">
                        Quyền được cấp:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12.5px]">
                        {ALL_PERMISSIONS.map((perm) => (
                          <label
                            key={perm}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={newSubPermissions.includes(perm)}
                              onChange={(e) => {
                                setNewSubPermissions((prev) =>
                                  e.target.checked
                                    ? [...prev, perm]
                                    : prev.filter((p) => p !== perm)
                                );
                              }}
                              className="accent-[#122A47]"
                            />
                            <span>{permissionLabels[perm]}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[12px] font-bold text-[#2B3647]">
                        Phạm vi nhóm thực phẩm được quản lý:
                      </p>
                      <label className="flex items-center gap-2 text-[12.5px] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newSubAllGroups}
                          onChange={(e) => setNewSubAllGroups(e.target.checked)}
                          className="accent-[#122A47]"
                        />
                        <span>Tất cả các nhóm</span>
                      </label>
                      {!newSubAllGroups && (
                        <div className="max-h-32 overflow-y-auto rounded-lg border border-[#EAE5DA] p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[12px]">
                          {availableGroups.map((g) => (
                            <label
                              key={g}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={newSubGroups.includes(g)}
                                onChange={(e) => {
                                  setNewSubGroups((prev) =>
                                    e.target.checked
                                      ? [...prev, g]
                                      : prev.filter((x) => x !== g)
                                  );
                                }}
                                className="accent-[#122A47]"
                              />
                              <span className="truncate">{g}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold"
                    >
                      Tạo tài khoản phân quyền
                    </button>
                  </form>

                  {/* Sub-users List with Inline Permission / Lock Editor */}
                  <div className="rounded-xl border border-[#EAE5DA] divide-y divide-[#EAE5DA]">
                    {usersList.map((u) => {
                      const isEditing = editingUserId === u.id;
                      return (
                        <div key={u.id} className="p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13.5px] font-bold text-[#122A47] flex items-center gap-2">
                                <span>{u.username}</span>
                                <span className="text-[11px] font-semibold text-[#8A6510]">
                                  ·{' '}
                                  {u.role === 'super_admin'
                                    ? 'Super Admin (Toàn quyền)'
                                    : 'Sub-User'}
                                </span>
                                {u.disabled && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-extrabold">
                                    ĐÃ KHÓA
                                  </span>
                                )}
                              </p>
                              <p className="text-[11.5px] text-[#5C6573] truncate">
                                Quyền:{' '}
                                {u.permissions
                                  .map((p) => permissionLabels[p] || p)
                                  .join(', ')}
                              </p>
                              <p className="text-[11px] text-[#6B7280] truncate">
                                Nhóm: {u.allowedGroups.join(', ')}
                              </p>
                            </div>
                            {u.role !== 'super_admin' && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    isEditing
                                      ? setEditingUserId(null)
                                      : startEditingSubUser(u)
                                  }
                                  className="h-9 px-3 rounded-lg border border-[#DFD9CB] bg-white text-[#122A47] text-[12px] font-bold flex items-center gap-1"
                                >
                                  <UserCog size={13} />
                                  <span>{isEditing ? 'Đóng' : 'Sửa quyền'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteSubUser(u.id)}
                                  className="h-9 px-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-[12px] font-bold"
                                >
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing && u.role !== 'super_admin' && (
                            <div className="rounded-xl border border-[#D4E2EA] bg-[#F1F7FA] p-3.5 space-y-3 text-[12.5px]">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {ALL_PERMISSIONS.map((perm) => (
                                  <label
                                    key={perm}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editUserPerms.includes(perm)}
                                      onChange={(e) =>
                                        setEditUserPerms((prev) =>
                                          e.target.checked
                                            ? [...prev, perm]
                                            : prev.filter((p) => p !== perm)
                                        )
                                      }
                                      className="accent-[#122A47]"
                                    />
                                    <span>{permissionLabels[perm]}</span>
                                  </label>
                                ))}
                              </div>

                              <div className="space-y-1.5">
                                <label className="flex items-center gap-2 font-bold cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editUserAllGroups}
                                    onChange={(e) =>
                                      setEditUserAllGroups(e.target.checked)
                                    }
                                    className="accent-[#122A47]"
                                  />
                                  <span>Quản lý tất cả các nhóm thực phẩm</span>
                                </label>
                                {!editUserAllGroups && (
                                  <div className="max-h-28 overflow-y-auto rounded-lg border border-[#D8D2C2] bg-white p-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11.5px]">
                                    {availableGroups.map((g) => (
                                      <label
                                        key={g}
                                        className="flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={editUserGroups.includes(g)}
                                          onChange={(e) =>
                                            setEditUserGroups((prev) =>
                                              e.target.checked
                                                ? [...prev, g]
                                                : prev.filter((x) => x !== g)
                                            )
                                          }
                                          className="accent-[#122A47]"
                                        />
                                        <span className="truncate">{g}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                                <input
                                  type="password"
                                  value={editUserNewPassword}
                                  onChange={(e) =>
                                    setEditUserNewPassword(e.target.value)
                                  }
                                  placeholder="Đổi mật khẩu mới (để trống = giữ nguyên)"
                                  className="h-9 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[12px]"
                                />
                                <label className="flex items-center gap-2 font-bold text-[#B91C1C] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editUserDisabled}
                                    onChange={(e) =>
                                      setEditUserDisabled(e.target.checked)
                                    }
                                    className="accent-[#B91C1C]"
                                  />
                                  <span>Tạm khóa tài khoản này</span>
                                </label>
                              </div>

                              <button
                                type="button"
                                onClick={() => void handleSaveEditedSubUser(u)}
                                className="h-9 px-4 rounded-lg bg-[#122A47] text-white font-bold text-[12.5px]"
                              >
                                Lưu cập nhật tài khoản
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: CLOUD SYNC LAYER (SUPABASE REALTIME) */}
              {activeTab === 'cloud' && (
                <div className="rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <Cloud size={20} className="text-[#1E4A75]" />
                      <div>
                        <h3 className="text-[14.5px] font-extrabold text-[#122A47]">
                          {L.cloudTitle}
                        </h3>
                        <p className="text-[12px] text-[#5C6573]">
                          {L.cloudStatusLabel} <strong>{cloudStatus.label}</strong>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11.5px] font-bold ${realtimeBadge.cls}`}
                    >
                      <Radio size={12} />
                      <span>{realtimeBadge.label}</span>
                    </span>
                  </div>

                  <p className="text-[12.5px] text-[#2B3647] leading-relaxed">
                    {L.cloudDesc}
                  </p>

                  {/* 4 Editable Supabase Fields */}
                  <div className="rounded-xl border border-[#DFD9CB] bg-white p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11.5px] font-mono font-bold text-[#122A47] mb-1">
                          VITE_CLOUD_SYNC_PROVIDER
                        </label>
                        <input
                          list="she-cloud-provider-options"
                          value={cloudConfigDraft.VITE_CLOUD_SYNC_PROVIDER}
                          onChange={(e) =>
                            setCloudConfigDraft((p) => ({
                              ...p,
                              VITE_CLOUD_SYNC_PROVIDER: e.target.value,
                            }))
                          }
                          placeholder="supabase"
                          className="w-full h-10 rounded-lg border border-[#D8D2C2] focus:border-[#1E4A75] px-3 font-mono text-[12.5px]"
                        />
                        <datalist id="she-cloud-provider-options">
                          <option value="supabase" />
                          <option value="none" />
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[11.5px] font-mono font-bold text-[#122A47] mb-1">
                          VITE_SUPABASE_TABLE
                        </label>
                        <input
                          value={cloudConfigDraft.VITE_SUPABASE_TABLE}
                          onChange={(e) =>
                            setCloudConfigDraft((p) => ({
                              ...p,
                              VITE_SUPABASE_TABLE: e.target.value,
                            }))
                          }
                          placeholder="foods"
                          className="w-full h-10 rounded-lg border border-[#D8D2C2] focus:border-[#1E4A75] px-3 font-mono text-[12.5px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-mono font-bold text-[#122A47] mb-1">
                        VITE_SUPABASE_URL
                      </label>
                      <input
                        value={cloudConfigDraft.VITE_SUPABASE_URL}
                        onChange={(e) =>
                          setCloudConfigDraft((p) => ({
                            ...p,
                            VITE_SUPABASE_URL: e.target.value,
                          }))
                        }
                        placeholder="https://your-project-id.supabase.co"
                        className="w-full h-10 rounded-lg border border-[#D8D2C2] focus:border-[#1E4A75] px-3 font-mono text-[12.5px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-mono font-bold text-[#122A47] mb-1">
                        VITE_SUPABASE_ANON_KEY
                      </label>
                      <input
                        value={cloudConfigDraft.VITE_SUPABASE_ANON_KEY}
                        onChange={(e) =>
                          setCloudConfigDraft((p) => ({
                            ...p,
                            VITE_SUPABASE_ANON_KEY: e.target.value,
                          }))
                        }
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full h-10 rounded-lg border border-[#D8D2C2] focus:border-[#1E4A75] px-3 font-mono text-[12.5px]"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-[12.5px] font-bold text-[#122A47] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={configDraft.autoSyncCloud !== false}
                        onChange={(e) => {
                          const nextAuto = e.target.checked;
                          setConfigDraft((p) => ({ ...p, autoSyncCloud: nextAuto }));
                          void handleSaveConfig(undefined, { autoSyncCloud: nextAuto });
                        }}
                        className="h-4 w-4 accent-[#122A47]"
                      />
                      <span>
                        Tự động đẩy lên Supabase ngay khi Admin thêm / sửa / xóa / khóa App
                      </span>
                    </label>

                    <div className="pt-1 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const saved = await saveCloudConfig(cloudConfigDraft);
                          setCloudConfigDraft(saved);
                          setCloudMessage('Đã lưu cấu hình Supabase vào thiết bị.');
                          showStatus('Đã lưu thông số Supabase.');
                        }}
                        className="h-10 px-4 rounded-xl bg-[#0F5E6E] hover:opacity-90 text-white text-[13px] font-bold flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{L.cloudSaveBtn}</span>
                      </button>

                      <button
                        type="button"
                        disabled={cloudBusy}
                        onClick={async () => {
                          setCloudBusy(true);
                          const res = await testSupabaseConnection(cloudConfigDraft);
                          setCloudMessage(res.message);
                          setCloudBusy(false);
                        }}
                        className="h-10 px-4 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] hover:border-[#1E4A75] text-[#122A47] text-[13px] font-bold flex items-center gap-1.5"
                      >
                        <Wifi size={14} />
                        <span>{L.cloudTestBtn}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={cloudBusy}
                      onClick={async () => {
                        setCloudBusy(true);
                        const saved = await saveCloudConfig(cloudConfigDraft);
                        setCloudConfigDraft(saved);
                        const res = await syncCatalogToCloud(
                          items,
                          config,
                          saved
                        );
                        setCloudMessage(res.message);
                        setCloudBusy(false);
                      }}
                      className="h-10 px-4 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold flex items-center gap-1.5"
                    >
                      <RefreshCw size={14} />
                      <span>{L.cloudPushBtn}</span>
                    </button>
                    <button
                      type="button"
                      disabled={cloudBusy}
                      onClick={async () => {
                        setCloudBusy(true);
                        const saved = await saveCloudConfig(cloudConfigDraft);
                        setCloudConfigDraft(saved);
                        const res = await pullCatalogFromCloud(saved);
                        if (res.ok && res.items) {
                          const merged = await applyImportedItemsToDb(
                            res.items,
                            'overwrite',
                            res.config
                          );
                          onItemsUpdated(merged);
                          if (res.config) onConfigUpdated(res.config);
                        }
                        setCloudMessage(res.message);
                        setCloudBusy(false);
                      }}
                      className="h-10 px-4 rounded-xl border border-[#DFD9CB] bg-white hover:border-[#122A47] text-[#122A47] text-[13px] font-bold flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      <span>{L.cloudPullBtn}</span>
                    </button>
                  </div>

                  {cloudMessage && (
                    <p className="text-[12.5px] font-bold text-[#1E4A75] bg-white border border-[#DFD9CB] rounded-xl px-3.5 py-2.5">
                      {cloudMessage}
                    </p>
                  )}

                  <details className="rounded-xl border border-[#E2DDD0] bg-white p-3 text-[12px] text-[#2B3647]">
                    <summary className="font-bold text-[#122A47] cursor-pointer">
                      SQL cài đặt Bảng + Realtime trên Supabase SQL Editor
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-[#F6F4EF] p-2.5 font-mono text-[11px] text-[#182230]">
{`create table if not exists ${cloudConfigDraft.VITE_SUPABASE_TABLE.trim() || 'foods'} (
  code text primary key,
  updated_at timestamptz default now(),
  payload jsonb not null
);

alter table ${cloudConfigDraft.VITE_SUPABASE_TABLE.trim() || 'foods'} enable row level security;
create policy "Allow anon read/write ${cloudConfigDraft.VITE_SUPABASE_TABLE.trim() || 'foods'}"
  on ${cloudConfigDraft.VITE_SUPABASE_TABLE.trim() || 'foods'}
  for all using (true) with check (true);

alter publication supabase_realtime add table ${cloudConfigDraft.VITE_SUPABASE_TABLE.trim() || 'foods'};`}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
