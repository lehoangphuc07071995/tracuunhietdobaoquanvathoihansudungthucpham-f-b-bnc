export type Lang = 'VI' | 'EN' | 'KO' | 'HI';
export type AppendixCode = 'SHE';
export type MainWorkspaceTab = 'table' | 'nofreeze' | 'rules';
export type StorageFilter = 'all' | 'room' | 'cool' | 'freeze';
export type SortOption = 'no' | 'name';
export type ViewMode = 'grid' | 'list';

export interface CustomColumnDef {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface FoodItem {
  a: AppendixCode;
  g: string;
  n: number;
  order?: number;
  name: string;
  room: string;
  cool: string;
  freeze: string;
  note: string;
  flag: string;
  keywords?: string[];
  enName?: string;
  weight?: string;
  displayCool?: string;
  displayHot?: string;
  // Extended admin/QA metadata (preserved alongside official baseline fields)
  standardTemp?: string;
  shelfLifeUnopened?: string;
  shelfLifeOpened?: string;
  packagingSpec?: string;
  haccpNote?: string;
  customFields?: Record<string, string>;
  isCustom?: boolean;
  updatedAt?: number;
}

export interface SystemConfig {
  id: 'system';
  appTitle: string;
  appSubtitle: string;
  mobileTitleLine1: string;
  mobileTitleLine2: string;
  logoUrl: string;
  bannerImageUrl: string;
  alertBannerText: string;
  alertBannerEnabled: boolean;
  appLocked?: boolean;
  appLockMessage?: string;
  appLockPin?: string;
  customColumns?: CustomColumnDef[];
  autoSyncCloud?: boolean;
  footerLeftText?: string;
  footerRightText?: string;
  aiAssistantEnabled?: boolean;
  updatedAt: number;
}

export type AdminPermission =
  | 'manage_config'
  | 'edit_items'
  | 'delete_items'
  | 'view_export_reports'
  | 'import_data'
  | 'lock_app'
  | 'manage_cloud';

export type AdminRole = 'super_admin' | 'sub_admin';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  permissions: AdminPermission[];
  allowedGroups: string[]; // ['ALL'] or specific food group names
  disabled?: boolean;
  createdAt: number;
}

export interface SearchHistoryEntry {
  id?: number;
  keyword: string;
  lang: Lang;
  resultCount: number;
  timestamp: number;
}

export interface ViewStatEntry {
  itemCode: string;
  itemName: string;
  group: string;
  appendix: AppendixCode;
  viewCount: number;
  lastViewedAt: number;
}

export interface AiChatTurn {
  role: 'user' | 'assistant';
  content: string;
  matchedCodes?: string[];
  mode?: 'online_ai' | 'offline_local' | 'tier1_instant';
  deepPrompt?: string;
  timestamp: number;
}

export interface AiHistoryEntry {
  id?: number;
  question: string;
  answer: string;
  matchedCodes: string[];
  mode: 'online_ai' | 'offline_local' | 'tier1_instant';
  timestamp: number;
}

export interface UiTranslation {
  title: string;
  subtitle: string;
  pageTitle: string;
  searchPlaceholder: string;
  all: string;
  appendixLabel: string;
  tabTable: string;
  tabNoFreeze: string;
  tabRules: string;
  filterGroup: string;
  filterStorage: string;
  hasRoom: string;
  hasCool: string;
  hasFreeze: string;
  sort: string;
  sortId: string;
  sortName: string;
  viewGrid: string;
  viewList: string;
  colRoom: string;
  colCool: string;
  colFreeze: string;
  colWeight: string;
  colCold: string;
  colFrozen: string;
  colDisplayCool: string;
  colDisplayHot: string;
  colEnglish: string;
  sourceDoc: string;
  noteLabel: string;
  emptyNote: string;
  emptyCell: string;
  detail: string;
  copy: string;
  copied: string;
  noResultTitle: string;
  noResultDesc: string;
  resetFilter: string;
  results: string;
  principle: string;
  detailTitle: string;
  close: string;
  groupLabel: string;
  displayLabel: string;
  colName: string;
  colAction: string;
  codeLabel: string;
  useToday: string;
  originalNote: string;
  emptyCellHint: string;
  clearSearch: string;
  focusLabel: string;
  clearLabel: string;
  qaTitle: string;
  excerptLabel: string;
  noFreezeBadge: string;
  tableReadingTitle: string;
}
