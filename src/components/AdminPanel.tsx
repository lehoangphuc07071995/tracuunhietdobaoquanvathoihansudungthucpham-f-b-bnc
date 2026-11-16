import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Cloud,
  Database,
  Download,
  Edit3,
  KeyRound,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
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
  deleteFoodItemInDb,
  exportCatalogToCsv,
  exportCatalogToJson,
  exportCatalogToXlsx,
  getCloudSyncStatus,
  getDefaultSupabaseConfigFromEnv,
  loadCloudConfig,
  parseImportFile,
  pullCatalogFromCloud,
  resetCatalogToDefaultBaseline,
  saveCloudConfig,
  syncCatalogToCloud,
  upsertFoodItemInDb,
  type ImportMode,
  type SupabaseCloudConfig,
} from '../services/storageService';
import type {
  AdminPermission,
  AdminUser,
  AppendixCode,
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
    cloudTitle: string;
    cloudStatusLabel: string;
    cloudDesc: string;
    cloudSaveBtn: string;
    cloudPushBtn: string;
    cloudPullBtn: string;
  }
> = {
  VI: {
    dialogLabel: 'Hệ thống Quản trị Admin',
    close: 'Đóng',
    headerTitle: 'Quản Trị Hệ Thống & Phân Quyền',
    authSubtitlePrefix: 'Đang đăng nhập:',
    roleSuper: 'Super Admin',
    roleSub: 'User Phân quyền',
    authProtected: 'Xác thực bảo mật SHA-256',
    logout: 'Đăng xuất',
    loginTitle: 'Đăng nhập Quản trị viên',
    loginDesc: 'Nhập tên tài khoản và mật khẩu để truy cập hệ thống quản lý dữ liệu.',
    usernameLabel: 'Tên đăng nhập',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu...',
    loginButton: 'Xác thực & Đăng nhập',
    loginLoading: 'Đang xác thực...',
    loginInvalid: 'Sai tên đăng nhập hoặc mật khẩu.',
    tabData: 'Quản lý dữ liệu',
    tabConfig: 'Cấu hình hệ thống',
    tabIo: 'Import / Export',
    tabUsers: 'Phân quyền & Mật khẩu',
    tabCloud: 'Đồng bộ Cloud',
    permManageConfig: 'Cấu hình giao diện & thông báo',
    permEditItems: 'Thêm & chỉnh sửa sản phẩm',
    permDeleteItems: 'Xóa sản phẩm',
    permViewExport: 'Xem & Export báo cáo (.json/.csv/.xlsx)',
    permImportData: 'Import / Upload dữ liệu',
    cloudTitle: 'Đồng bộ Đám mây (Supabase)',
    cloudStatusLabel: 'Trạng thái hiện tại:',
    cloudDesc:
      'Hệ thống sử dụng IndexedDB làm cơ sở dữ liệu chính trên thiết bị (hoạt động Offline 100%). Điền trực tiếp 4 thông số Supabase bên dưới (hoặc cấu hình trong Vercel Environment Variables) để đồng bộ dữ liệu giữa nhiều thiết bị:',
    cloudSaveBtn: 'Lưu cấu hình Supabase',
    cloudPushBtn: 'Đẩy dữ liệu lên Supabase',
    cloudPullBtn: 'Tải dữ liệu từ Supabase',
  },
  EN: {
    dialogLabel: 'Admin Management System',
    close: 'Close',
    headerTitle: 'System Admin & Access Control',
    authSubtitlePrefix: 'Signed in:',
    roleSuper: 'Super Admin',
    roleSub: 'Scoped User',
    authProtected: 'SHA-256 Protected Authentication',
    logout: 'Sign out',
    loginTitle: 'Administrator Sign In',
    loginDesc: 'Enter your username and passcode to access catalog & system controls.',
    usernameLabel: 'Username',
    passwordLabel: 'Passcode',
    passwordPlaceholder: 'Enter passcode...',
    loginButton: 'Verify & Sign In',
    loginLoading: 'Verifying...',
    loginInvalid: 'Invalid username or passcode.',
    tabData: 'Catalog CRUD',
    tabConfig: 'System Config',
    tabIo: 'Import / Export',
    tabUsers: 'Roles & Passwords',
    tabCloud: 'Cloud Sync',
    permManageConfig: 'UI configuration & alert banner',
    permEditItems: 'Add & edit food items',
    permDeleteItems: 'Delete food items',
    permViewExport: 'View & Export reports (.json/.csv/.xlsx)',
    permImportData: 'Import / Upload catalog data',
    cloudTitle: 'Cloud Sync (Supabase)',
    cloudStatusLabel: 'Current status:',
    cloudDesc:
      'IndexedDB is the primary on-device database (100% Offline-First). Fill in the 4 Supabase fields below (or configure Vercel Environment Variables) to sync across devices:',
    cloudSaveBtn: 'Save Supabase Config',
    cloudPushBtn: 'Push Data to Supabase',
    cloudPullBtn: 'Pull Data from Supabase',
  },
  KO: {
    dialogLabel: '관리자 시스템',
    close: '닫기',
    headerTitle: '시스템 관리 및 권한 제어',
    authSubtitlePrefix: '로그인됨:',
    roleSuper: '최고 관리자',
    roleSub: '권한 사용자',
    authProtected: 'SHA-256 보안 인증',
    logout: '로그아웃',
    loginTitle: '관리자 로그인',
    loginDesc: '데이터 관리 시스템에 접근하려면 계정과 비밀번호를 입력하세요.',
    usernameLabel: '사용자 이름',
    passwordLabel: '비밀번호',
    passwordPlaceholder: '비밀번호 입력...',
    loginButton: '인증 및 로그인',
    loginLoading: '인증 중...',
    loginInvalid: '사용자 이름 또는 비밀번호가 올바르지 않습니다.',
    tabData: '데이터 관리',
    tabConfig: '시스템 설정',
    tabIo: '가져오기 / 내보내기',
    tabUsers: '권한 및 비밀번호',
    tabCloud: '클라우드 동기화',
    permManageConfig: 'UI 설정 및 공지 배너',
    permEditItems: '품목 추가 및 수정',
    permDeleteItems: '품목 삭제',
    permViewExport: '보고서 조회 및 내보내기 (.json/.csv/.xlsx)',
    permImportData: '데이터 가져오기 / 업로드',
    cloudTitle: '클라우드 동기화 (Supabase)',
    cloudStatusLabel: '현재 상태:',
    cloudDesc:
      '기기의 IndexedDB를 기본 데이터베이스로 사용합니다 (100% 오프라인 작동). 아래 Supabase 4개 항목을 입력하거나 Vercel 환경 변수를 설정하여 여러 기기와 동기화하세요:',
    cloudSaveBtn: 'Supabase 설정 저장',
    cloudPushBtn: 'Supabase로 데이터 업로드',
    cloudPullBtn: 'Supabase에서 데이터 다운로드',
  },
  HI: {
    dialogLabel: 'एडमिन प्रबंधन प्रणाली',
    close: 'बंद करें',
    headerTitle: 'सिस्टम एडमिन और एक्सेस कंट्रोल',
    authSubtitlePrefix: 'लॉग इन:',
    roleSuper: 'सुपर एडमिन',
    roleSub: 'सीमित उपयोगकर्ता',
    authProtected: 'SHA-256 सुरक्षित प्रमाणीकरण',
    logout: 'लॉग आउट',
    loginTitle: 'एडमिनिस्ट्रेटर लॉगिन',
    loginDesc: 'डेटा प्रबंधन प्रणाली तक पहुँचने के लिए उपयोगकर्ता नाम और पासवर्ड दर्ज करें।',
    usernameLabel: 'उपयोगकर्ता नाम',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'पासवर्ड दर्ज करें...',
    loginButton: 'सत्यापित करें और लॉगिन करें',
    loginLoading: 'सत्यापन जारी...',
    loginInvalid: 'गलत उपयोगकर्ता नाम या पासवर्ड।',
    tabData: 'डेटा प्रबंधन',
    tabConfig: 'सिस्टम सेटिंग्स',
    tabIo: 'इम्पोर्ट / एक्सपोर्ट',
    tabUsers: 'भूमिकाएँ और पासवर्ड',
    tabCloud: 'क्लाउड सिंक',
    permManageConfig: 'UI सेटिंग्स और अलर्ट बैनर',
    permEditItems: 'आइटम जोड़ें और संपादित करें',
    permDeleteItems: 'आइटम हटाएं',
    permViewExport: 'रिपोर्ट देखें और एक्सपोर्ट करें (.json/.csv/.xlsx)',
    permImportData: 'डेटा इम्पोर्ट / अपलोड करें',
    cloudTitle: 'क्लाउड सिंक (Supabase)',
    cloudStatusLabel: 'वर्तमान स्थिति:',
    cloudDesc:
      'डिवाइस पर IndexedDB मुख्य डेटाबेस के रूप में उपयोग होता है (100% ऑफ़लाइन)। विभिन्न उपकरणों में सिंक करने के लिए नीचे 4 Supabase फ़ील्ड भरें:',
    cloudSaveBtn: 'Supabase सेटिंग सहेजें',
    cloudPushBtn: 'Supabase पर डेटा भेजें',
    cloudPullBtn: 'Supabase से डेटा डाउनलोड करें',
  },
};

const PERMISSION_LABELS: Record<AdminPermission, string> = {
  manage_config: 'Cấu hình giao diện & thông báo',
  edit_items: 'Thêm & chỉnh sửa sản phẩm',
  delete_items: 'Xóa sản phẩm',
  view_export_reports: 'Xem & Export báo cáo (.json/.csv/.xlsx)',
  import_data: 'Import / Upload dữ liệu',
};

const ALL_PERMISSIONS: AdminPermission[] = [
  'manage_config',
  'edit_items',
  'delete_items',
  'view_export_reports',
  'import_data',
];

function createEmptyItemDraft(items: FoodItem[], allowedGroups: string[]): FoodItem {
  const pl1Max = items
    .filter((i) => i.a === 'PL1')
    .reduce((max, i) => Math.max(max, i.n), 0);
  const defaultGroup =
    allowedGroups.includes('ALL') || allowedGroups.length === 0
      ? ALL_GROUPS[0] || 'Bánh ngọt / Pastry'
      : allowedGroups[0];

  return {
    a: 'PL1',
    n: pl1Max + 1,
    g: defaultGroup,
    name: '',
    enName: '',
    weight: '',
    room: '—',
    cool: '—',
    freeze: '—',
    displayCool: '',
    displayHot: '',
    standardTemp: '',
    shelfLifeUnopened: '',
    shelfLifeOpened: '',
    packagingSpec: '',
    note: '—',
    flag: '',
    haccpNote: '',
  };
}

export function AdminPanel({
  open,
  onClose,
  items,
  onItemsUpdated,
  config,
  onConfigUpdated,
  lang = 'VI',
}: AdminPanelProps) {
  const L = ADMIN_TEXT[lang];
  const permissionLabels: Record<AdminPermission, string> = {
    manage_config: L.permManageConfig,
    edit_items: L.permEditItems,
    delete_items: L.permDeleteItems,
    view_export_reports: L.permViewExport,
    import_data: L.permImportData,
  };
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('data');
  const [toastMsg, setToastMsg] = useState('');

  // Config draft state
  const [configDraft, setConfigDraft] = useState<SystemConfig>(config);

  // Data CRUD state
  const [dataFilterQuery, setDataFilterQuery] = useState('');
  const [dataFilterGroup, setDataFilterGroup] = useState('ALL');
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

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
    }, 3200);
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
    else if (hasPerm('manage_config')) setActiveTab('config');
    else if (hasPerm('view_export_reports') || hasPerm('import_data')) {
      setActiveTab('io');
    }
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

  const filteredCrudItems = useMemo(() => {
    const q = dataFilterQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (!canAccessGroup(item.g)) return false;
      if (dataFilterGroup !== 'ALL' && item.g !== dataFilterGroup) return false;
      if (!q) return true;
      return (
        getItemCode(item).toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.g.toLowerCase().includes(q)
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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveSystemConfig(configDraft);
    onConfigUpdated(saved);
    showStatus('Đã lưu cấu hình hệ thống vào IndexedDB.');
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

  const handleDeleteItem = async (item: FoodItem) => {
    if (!hasPerm('delete_items')) return;
    const code = getItemCode(item);
    const next = await deleteFoodItemInDb(code);
    onItemsUpdated(next);
    showStatus(`Đã xóa mặt hàng ${code}.`);
  };

  const handleResetBaseline = async () => {
    const next = await resetCatalogToDefaultBaseline();
    onItemsUpdated(next);
    onConfigUpdated({ ...DEFAULT_SYSTEM_CONFIG, updatedAt: Date.now() });
    showStatus('Đã khôi phục toàn bộ 145 dữ liệu gốc & giao diện mặc định.');
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
      createdAt: Date.now(),
    };
    await db.users.put(subUser);
    setNewSubUsername('');
    setNewSubPassword('');
    await loadUsers();
    showStatus(`Đã tạo tài khoản phân quyền "${uname}".`);
  };

  const handleDeleteSubUser = async (userId: string) => {
    await db.users.delete(userId);
    await loadUsers();
    showStatus('Đã xóa tài khoản phụ.');
  };

  const cloudStatus = getCloudSyncStatus(cloudConfigDraft);

  return (
    <div
      className="fade-in fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={L.dialogLabel}
    >
      <button
        type="button"
        aria-label={L.close}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <div className="sheet-up relative w-full max-w-[960px] max-h-[92dvh] flex flex-col bg-white text-[#182230] border border-[#E2DDD0] rounded-t-[24px] sm:rounded-[20px] shadow-2xl overflow-hidden">
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
          <div className="bg-[#EEF6F8] border-b border-[#BBD7E3] px-5 py-2 text-[12.5px] font-bold text-[#0F5E6E] flex items-center gap-2">
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
              <p className="text-[12.5px] text-[#5C6573]">
                {L.loginDesc}
              </p>
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

              {hasPerm('manage_config') && (
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

              {(currentUser.role === 'super_admin' || hasPerm('manage_config')) && (
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
              {/* TAB 1: SYSTEM CONFIG */}
              {activeTab === 'config' && hasPerm('manage_config') && (
                <form
                  onSubmit={(e) => void handleSaveConfig(e)}
                  className="space-y-4"
                >
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
                  </div>

                  {/* Logo & Banner */}
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
                        placeholder="/bnc-logo.jpg"
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

                  {/* Alert Banner Marquee */}
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

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="submit"
                      className="h-10 px-5 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold flex items-center gap-1.5"
                    >
                      <Save size={15} />
                      <span>Lưu cấu hình</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfigDraft(DEFAULT_SYSTEM_CONFIG)}
                      className="h-10 px-4 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] text-[13px] font-bold text-[#2B3647]"
                    >
                      Đặt lại mặc định giao diện
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: DATA CRUD */}
              {activeTab === 'data' &&
                (hasPerm('edit_items') || hasPerm('delete_items')) && (
                  <div className="space-y-4">
                    {!editingItem ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                            <input
                              value={dataFilterQuery}
                              onChange={(e) => setDataFilterQuery(e.target.value)}
                              placeholder="Tìm tên, mã PL1-01, nhóm..."
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

                          <div className="flex items-center gap-2">
                            {hasPerm('edit_items') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNew(true);
                                  setEditingItem(
                                    createEmptyItemDraft(items, allowedGroupsForUser)
                                  );
                                }}
                                className="h-10 px-4 rounded-xl bg-[#122A47] hover:bg-[#1E4A75] text-white text-[13px] font-bold flex items-center gap-1.5"
                              >
                                <Plus size={15} />
                                <span>Thêm mặt hàng</span>
                              </button>
                            )}
                            {currentUser.role === 'super_admin' && (
                              <button
                                type="button"
                                onClick={() => void handleResetBaseline()}
                                title="Khôi phục 145 dữ liệu chuẩn ban đầu"
                                className="h-10 px-3 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] hover:bg-[#F2EFE8] text-[#8A6510] text-[12px] font-bold flex items-center gap-1.5"
                              >
                                <RotateCcw size={14} />
                                <span className="hidden sm:inline">
                                  Khôi phục gốc (145)
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border border-[#EAE5DA] divide-y divide-[#EAE5DA] max-h-[420px] overflow-y-auto">
                          {filteredCrudItems.map((item) => {
                            const code = getItemCode(item);
                            return (
                              <div
                                key={code}
                                className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF9F6]"
                              >
                                <div className="min-w-0">
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
                                    Phòng: {item.room} · Mát: {item.cool} · Đông:{' '}
                                    {item.freeze}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {hasPerm('edit_items') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsAddingNew(false);
                                        setEditingItem({ ...item });
                                      }}
                                      className="h-9 px-3 rounded-lg border border-[#DFD9CB] bg-white hover:border-[#1E4A75] text-[#122A47] text-[12px] font-bold flex items-center gap-1"
                                    >
                                      <Edit3 size={13} />
                                      <span>Sửa</span>
                                    </button>
                                  )}
                                  {hasPerm('delete_items') && (
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteItem(item)}
                                      aria-label={`Xóa ${code}`}
                                      className="h-9 w-9 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] flex items-center justify-center"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                              Phụ lục
                            </label>
                            <select
                              disabled={!isAddingNew}
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
                              <option value="PL1">PL1 — Phụ lục 1</option>
                              <option value="PL2">PL2 — Phụ lục 2</option>
                              <option value="PL3">PL3 — Phụ lục 3</option>
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
                              Nhóm hàng
                            </label>
                            <input
                              list="bnc-groups-list"
                              value={editingItem.g}
                              onChange={(e) =>
                                setEditingItem((p) =>
                                  p ? { ...p, g: e.target.value } : p
                                )
                              }
                              required
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                            <datalist id="bnc-groups-list">
                              {scopedGroups.map((g) => (
                                <option key={g} value={g} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Tên sản phẩm *
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
                              placeholder="Ví dụ: 1-4°C hoặc ≤ -18°C"
                              className="w-full h-10 rounded-lg border border-[#D8D2C2] bg-white px-3 text-[13px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11.5px] font-bold text-[#2B3647] mb-1">
                              Nhiệt độ phòng
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
                              Kho mát (1-4°C)
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
                              Kho đông (≤ -18°C)
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
                          Tải bản sao lưu đầy đủ để lưu trữ hoặc mở trực tiếp bằng Excel.
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
                  {/* Change Super Admin Password */}
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

                  {/* Sub-users List */}
                  <div className="rounded-xl border border-[#EAE5DA] divide-y divide-[#EAE5DA]">
                    {usersList.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-bold text-[#122A47]">
                            {u.username}{' '}
                            <span className="text-[11px] font-semibold text-[#8A6510]">
                              ·{' '}
                              {u.role === 'super_admin'
                                ? 'Super Admin (Toàn quyền)'
                                : 'Sub-User'}
                            </span>
                          </p>
                          <p className="text-[11.5px] text-[#5C6573] truncate">
                            Quyền:{' '}
                            {u.permissions
                              .map((p) => permissionLabels[p])
                              .join(', ')}
                          </p>
                          <p className="text-[11px] text-[#6B7280] truncate">
                            Nhóm: {u.allowedGroups.join(', ')}
                          </p>
                        </div>
                        {u.role !== 'super_admin' && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteSubUser(u.id)}
                            className="h-9 px-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-[12px] font-bold shrink-0"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: CLOUD SYNC LAYER (SUPABASE ONLY) */}
              {activeTab === 'cloud' && (
                <div className="rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] p-4 space-y-4">
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
                          list="bnc-cloud-provider-options"
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
                        <datalist id="bnc-cloud-provider-options">
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
                          placeholder="bnc_food_catalog"
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
                      SQL tạo bảng nhanh trên Supabase SQL Editor
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-[#F6F4EF] p-2.5 font-mono text-[11px] text-[#182230]">
{`create table if not exists ${cloudConfigDraft.VITE_SUPABASE_TABLE.trim() || 'foods'} (
  code text primary key,
  updated_at timestamptz default now(),
  payload jsonb not null
);`}
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
