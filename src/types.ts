export type Lang = 'VI' | 'EN' | 'KO' | 'HI';
export type AppendixCode = 'PL1' | 'PL2' | 'PL3';
export type AppendixFilter = 'ALL' | AppendixCode;
export type StorageFilter = 'all' | 'room' | 'cool' | 'freeze';
export type SortOption = 'no' | 'name';
export type ViewMode = 'grid' | 'list';

export interface RawCvItem {
  a: 'PL1' | 'PL2';
  g: string;
  n: number;
  name: string;
  room: string;
  cool: string;
  freeze: string;
  note: string;
  flag: string;
}

export type Pl3Tuple = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export interface FoodItem {
  a: AppendixCode;
  g: string;
  n: number;
  name: string;
  room: string;
  cool: string;
  freeze: string;
  note: string;
  flag: string;
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
  updatedAt: number;
}

export type AdminPermission =
  | 'manage_config'
  | 'edit_items'
  | 'delete_items'
  | 'view_export_reports'
  | 'import_data';

export type AdminRole = 'super_admin' | 'sub_admin';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  permissions: AdminPermission[];
  allowedGroups: string[]; // ['ALL'] or specific food group names
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
  mode?: 'online_ai' | 'offline_local';
  timestamp: number;
}

export interface AiHistoryEntry {
  id?: number;
  question: string;
  answer: string;
  matchedCodes: string[];
  mode: 'online_ai' | 'offline_local';
  timestamp: number;
}

export interface UiTranslation {
  title: string;
  subtitle: string;
  pageTitle: string;
  searchPlaceholder: string;
  all: string;
  appendix1: string;
  appendix2: string;
  appendix3: string;
  filterGroup: string;
  filterStorage: string;
  sort: string;
  sortId: string;
  sortName: string;
  viewGrid: string;
  viewList: string;
  hasRoom: string;
  hasCool: string;
  hasFreeze: string;
  results: string;
  colRoom: string;
  colCool: string;
  colFreeze: string;
  colWeight: string;
  colCold: string;
  colFrozen: string;
  colDisplayCool: string;
  colDisplayHot: string;
  colEnglish: string;
  sourcePL3: string;
  noteLabel: string;
  emptyNote: string;
  emptyCell: string;
  detail: string;
  copy: string;
  copied: string;
  noResultTitle: string;
  noResultDesc: string;
  resetFilter: string;
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
}
