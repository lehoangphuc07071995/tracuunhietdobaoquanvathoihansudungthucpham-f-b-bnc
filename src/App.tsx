import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Globe,
  History,
  House,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  Megaphone,
  PackageSearch,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Thermometer,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  ALL_GROUPS,
  FOOD_ITEMS,
  getItemCode,
  hasCellValue,
  hasUseToday,
  isDisallowedCell,
  isEmptyCell,
  isNoFreezeCell,
} from './data/foodData';
import {
  SHE_DOC_METADATA,
  SHE_NO_FREEZE_ITEMS,
  SHE_POLICY_SECTIONS,
} from './data/sheRegulationData';
import {
  LANGS,
  UI_TRANSLATIONS,
  translateDuration,
  translateFlag,
  translateGroup,
  translateItemName,
  translateItemNote,
  translateNoFreezeItem,
  translatePolicySection,
} from './data/translations';
import {
  DEFAULT_SYSTEM_CONFIG,
  db,
  loadAllItemsFromDb,
  loadSystemConfig,
  recordItemViewBehavior,
  recordSearchBehavior,
} from './db/dexieDb';
import {
  applyImportedItemsToDb,
  getCloudSyncStatus,
  loadCloudConfig,
  pullCatalogFromCloud,
  subscribeToSupabaseRealtime,
  syncCatalogToCloud,
  type RealtimeConnectionState,
} from './services/storageService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { normalizeText, runSmartSearch } from './utils/smartSearch';
import { AdminPanel } from './components/AdminPanel';
import { AIChatbox } from './components/AIChatbox';
import { MyHistoryPanel } from './components/MyHistoryPanel';
import {
  OfflineStatusBadge,
  PWAInstallButton,
} from './components/PWAInstallButton';
import type {
  FoodItem,
  Lang,
  MainWorkspaceTab,
  StorageFilter,
  SystemConfig,
  ViewMode,
} from './types';

interface ExtraLabels {
  aiTag: string;
  aiSearching: string;
  aiButtonTitle: string;
  aiBannerTitle: string;
  aiLegalNotice: string;
  aiDismiss: string;
  quickLabel: string;
  quickToday: string;
  quickRoom: string;
  quickFrozen: string;
  quickCool: string;
  quickNoFreeze: string;
  allOption: string;
  copyShort: string;
  mobileTitleLine1: string;
  mobileTitleLine2: string;
  mobileSearchPlaceholder: string;
  desktopSearchPlaceholder: string;
  footerInternal: string;
  historyBtn: string;
  historyTitle: string;
  adminBtn: string;
  adminTitle: string;
  stdTempLabel: string;
  hsdUnopenedLabel: string;
  hsdOpenedLabel: string;
  packSpecLabel: string;
  lockTitle: string;
  lockDefaultMsg: string;
  lockPinPlaceholder: string;
  lockPinBtn: string;
  lockPinWrong: string;
  lockAdminBtn: string;
  noFreezeIntro: string;
  noFreezeColIdx: string;
  noFreezeColGroup: string;
  noFreezeColDetail: string;
  noFreezeColReason: string;
  rulesIntro: string;
  chillerOrderTitle: string;
  chillerTiers: string[];
  floorClearance: string;
  coolingTitle: string;
  coolingSteps: string[];
  labelingTitle: string;
  labelingFields: string[];
  thawTitle: string;
  thawRules: string[];
  tableReadPoints: string[];
  art8MatchTitle: string;
}

const EXTRA_LABELS: Record<Lang, ExtraLabels> = {
  VI: {
    aiTag: 'Tìm thông minh AI',
    aiSearching: 'AI đang phân tích...',
    aiButtonTitle: 'Nhấn để AI phân tích ngữ cảnh & đồng nghĩa',
    aiBannerTitle: 'Gợi ý ngữ nghĩa AI',
    aiLegalNotice: 'Thông số hiển thị giữ nguyên 100% từ văn bản Quyết định 107/2026/QĐ-SHE/SG.',
    aiDismiss: 'Tắt gợi ý AI',
    quickLabel: 'Lọc nhanh:',
    quickToday: 'Theo giờ / Trong ngày',
    quickRoom: 'Phòng 15–25°C',
    quickCool: 'Lạnh 0–5°C',
    quickFrozen: 'Đông ≤ −18°C',
    quickNoFreeze: 'Không cấp đông',
    allOption: 'Tất cả',
    copyShort: 'Sao chép',
    mobileTitleLine1: 'TRA CỨU BẢO QUẢN & HSD THỰC PHẨM',
    mobileTitleLine2: 'KHỐI SHE · QĐ 107/2026 (SHE-QĐ-FB13)',
    mobileSearchPlaceholder: 'Tìm món, mã SHE-01, nhóm, không cấp đông...',
    desktopSearchPlaceholder: 'Tìm tên loại thực phẩm, mã SHE-01, nhóm hàng, hoặc quy trình bảo quản...',
    footerInternal: 'HỆ THỐNG TRA CỨU NỘI BỘ - BAN ẨM THỰC - SUN WORLD BA NA HILLS',
    historyBtn: 'Lịch sử',
    historyTitle: 'Lịch sử tra cứu của tôi',
    adminBtn: 'Admin',
    adminTitle: 'Quản trị hệ thống (Admin)',
    stdTempLabel: 'Nhiệt độ bảo quản chuẩn:',
    hsdUnopenedLabel: 'HSD chưa mở bao bì:',
    hsdOpenedLabel: 'HSD sau mở bao bì:',
    packSpecLabel: 'Quy cách bảo quản:',
    lockTitle: 'HỆ THỐNG ĐANG TẠM KHÓA BỞI QUẢN TRỊ VIÊN',
    lockDefaultMsg: 'Ứng dụng tạm khóa để rà soát và cập nhật quy định SHE. Vui lòng nhập mã PIN mở khóa hoặc liên hệ Admin.',
    lockPinPlaceholder: 'Nhập mã PIN mở khóa...',
    lockPinBtn: 'Mở khóa',
    lockPinWrong: 'Mã PIN mở khóa không chính xác.',
    lockAdminBtn: 'Đăng nhập Admin mở khóa',
    noFreezeIntro:
      'Theo Điều 8 — Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13): 11 nhóm thực phẩm tuyệt đối KHÔNG cấp đông để bảo toàn cấu trúc, cảm quan và an toàn thực phẩm.',
    noFreezeColIdx: 'TT',
    noFreezeColGroup: 'Nhóm thực phẩm',
    noFreezeColDetail: 'Chi tiết',
    noFreezeColReason: 'Lý do không nên cấp đông',
    rulesIntro:
      'Tổng hợp đầy đủ Điều 1 đến Điều 9 và các quy trình kiểm soát vệ sinh an toàn thực phẩm theo Quyết định 107/2026/QĐ-SHE/SG (Mã hiệu: SHE-QĐ-FB13 · Hiệu lực: 12/11/2026).',
    chillerOrderTitle: 'Thứ tự xếp tủ mát (Mục 6.4 · Trên → Dưới)',
    chillerTiers: [
      '1. Thực phẩm ăn liền / chín (RTE)',
      '2. Thủy hải sản tươi sống',
      '3. Thịt đỏ nguyên miếng',
      '4. Thịt xay / nghiền',
      '5. Gia cầm (tầng dưới cùng)',
    ],
    floorClearance: 'Cách sàn tối thiểu 15 cm · FIFO / FEFO · Đậy kín tách sống/chín',
    coolingTitle: 'Làm nguội 2 giai đoạn & Hâm nóng (Mục 6.6)',
    coolingSteps: [
      'GĐ1: 57°C → 21°C trong tối đa 02 giờ',
      'GĐ2: 21°C → ≤ 5°C trong tối đa 04 giờ (khay nông ≤ 5 cm)',
      'Hâm nóng: Tâm ≥ 75°C (hoặc 82°C trong 2 phút) · Chỉ 01 lần',
    ],
    labelingTitle: 'Quy tắc Ghi nhãn 4 nội dung (Mục 6.3)',
    labelingFields: [
      '1. Tên thực phẩm rõ ràng',
      '2. Ngày 1 (kèm giờ nếu tính theo giờ)',
      '3. Ngày hết hạn / giờ hết hạn',
      '4. Tên nhân viên thực hiện',
    ],
    thawTitle: 'Rã đông & Giới hạn 4h / 7 ngày (Mục 6.1, 6.2, 6.7)',
    thawRules: [
      '3 cách rã đông: Tủ mát 0–5°C · Nước chảy liên tục ≤ 21°C · Lò vi sóng nấu ngay',
      'Dùng hết trong 24 giờ sau rã đông · Không cấp đông lại',
      'Ngoài dải nhiệt độ: tối đa 04 giờ cộng dồn · TCS ăn liền lạnh: tối đa 07 ngày',
    ],
    tableReadPoints: [
      'Hạn áp dụng sau khi mở bao bì, sơ chế, chế biến hoặc rã đông.',
      '"Không": Không bảo quản ở khung nhiệt độ đó (trừ thao tác ≤ 4 giờ ở Mục 6.1).',
      '"Không cấp đông": Không cấp đông theo Điều 8.',
      '"Theo NSX": Theo bao bì; nếu không ghi hướng dẫn cho nhiệt độ đó thì không áp dụng. Không cộng dồn các cột.',
    ],
    art8MatchTitle: 'CẢNH BÁO ĐIỀU 8 — KHÔNG CẤP ĐÔNG',
  },
  EN: {
    aiTag: 'AI Smart Search',
    aiSearching: 'AI analyzing...',
    aiButtonTitle: 'Run AI semantic & ingredient matching',
    aiBannerTitle: 'AI Semantic Match',
    aiLegalNotice: 'All displayed figures remain 100% verbatim from Decision 107/2026/QĐ-SHE/SG.',
    aiDismiss: 'Clear AI',
    quickLabel: 'Quick filters:',
    quickToday: 'Hours / Same day',
    quickRoom: 'Room 15–25°C',
    quickCool: 'Chilled 0–5°C',
    quickFrozen: 'Frozen ≤ −18°C',
    quickNoFreeze: 'Do not freeze',
    allOption: 'All',
    copyShort: 'Copy',
    mobileTitleLine1: 'FOOD STORAGE & SHELF-LIFE LOOKUP',
    mobileTitleLine2: 'SHE DIVISION · DEC 107/2026 (SHE-QĐ-FB13)',
    mobileSearchPlaceholder: 'Search food, SHE-01, group, no freeze...',
    desktopSearchPlaceholder: 'Search food type, SHE-01 code, group, or storage procedure...',
    footerInternal: 'INTERNAL LOOKUP SYSTEM - CULINARY DIVISION - SUN WORLD BA NA HILLS',
    historyBtn: 'History',
    historyTitle: 'My Lookup History',
    adminBtn: 'Admin',
    adminTitle: 'System Administration (Admin)',
    stdTempLabel: 'Standard storage temperature:',
    hsdUnopenedLabel: 'Unopened shelf life:',
    hsdOpenedLabel: 'Opened shelf life:',
    packSpecLabel: 'Packaging & storage spec:',
    lockTitle: 'SYSTEM TEMPORARILY LOCKED BY ADMINISTRATOR',
    lockDefaultMsg: 'Access is paused for SHE regulation updates. Enter the unlock PIN or sign in as Admin.',
    lockPinPlaceholder: 'Enter unlock PIN...',
    lockPinBtn: 'Unlock',
    lockPinWrong: 'Incorrect unlock PIN.',
    lockAdminBtn: 'Sign in as Admin to unlock',
    noFreezeIntro:
      'Under Article 8 — Decision 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13): 11 food groups that must NOT be frozen to preserve texture, quality, and food safety.',
    noFreezeColIdx: 'No.',
    noFreezeColGroup: 'Food Group',
    noFreezeColDetail: 'Details',
    noFreezeColReason: 'Reason Not to Freeze',
    rulesIntro:
      'Complete reference for Articles 1–9 and food safety operational procedures under Decision 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13 · Effective 12/11/2026).',
    chillerOrderTitle: 'Chiller Stacking Order (Sec 6.4 · Top → Bottom)',
    chillerTiers: [
      '1. Ready-to-eat / Cooked foods (RTE)',
      '2. Raw seafood',
      '3. Whole cuts of red meat',
      '4. Ground / minced meat',
      '5. Poultry (lowest shelf)',
    ],
    floorClearance: 'Store ≥ 15 cm off floor · FIFO / FEFO · Keep covered & separated',
    coolingTitle: '2-Stage Cooling & Reheating (Sec 6.6)',
    coolingSteps: [
      'Stage 1: 57°C → 21°C within 02 hours max',
      'Stage 2: 21°C → ≤ 5°C within 04 hours max (shallow trays ≤ 5 cm)',
      'Reheating: Core ≥ 75°C (or 82°C for 2 min) · Reheat once only',
    ],
    labelingTitle: 'Mandatory 4-Field Food Label (Sec 6.3)',
    labelingFields: [
      '1. Clear food name',
      '2. Day 1 date (plus time for hourly items)',
      '3. Expiration date / time',
      '4. Staff member name',
    ],
    thawTitle: 'Thawing & 4h / 7-Day Limits (Sec 6.1, 6.2, 6.7)',
    thawRules: [
      '3 approved methods: Chiller 0–5°C · Running water ≤ 21°C · Microwave (cook immediately)',
      'Use within 24 hours after thawing · Never refreeze',
      'Outside temp band: ≤ 04h cumulative · Cold RTE TCS max 07 days',
    ],
    tableReadPoints: [
      'Durations apply after opening, prep, cooking, or thawing.',
      '"No": Do not store at that temperature (except ≤ 4h prep under Sec 6.1).',
      '"Do not freeze": Prohibited under Article 8.',
      '"Per manufacturer": Follow label; if omitted for that band, consider prohibited. Never add columns together.',
    ],
    art8MatchTitle: 'ARTICLE 8 WARNING — DO NOT FREEZE',
  },
  KO: {
    aiTag: 'AI 스마트 검색',
    aiSearching: 'AI 분석 중...',
    aiButtonTitle: 'AI 문맥 및 동의어 검색 실행',
    aiBannerTitle: 'AI 의미 기반 추천',
    aiLegalNotice: '표시된 모든 수치는 결정 107/2026/QĐ-SHE/SG 원문을 100% 준수합니다.',
    aiDismiss: 'AI 해제',
    quickLabel: '빠른 필터:',
    quickToday: '시간/당일',
    quickRoom: '상온 15–25°C',
    quickCool: '냉장 0–5°C',
    quickFrozen: '냉동 ≤ −18°C',
    quickNoFreeze: '냉동 금지',
    allOption: '전체',
    copyShort: '복사',
    mobileTitleLine1: 'SHE 식품 보관·소비기한 조회',
    mobileTitleLine2: '결정 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13)',
    mobileSearchPlaceholder: '식품, SHE-01, 그룹, 냉동 금지 검색...',
    desktopSearchPlaceholder: '식품 유형, SHE-01 코드, 그룹 또는 보관 규정 검색...',
    footerInternal: '내부 조회 시스템 - 식음료부 - SUN WORLD BA NA HILLS',
    historyBtn: '기록',
    historyTitle: '내 조회 기록',
    adminBtn: '관리자',
    adminTitle: '시스템 관리 (Admin)',
    stdTempLabel: '표준 보관 온도:',
    hsdUnopenedLabel: '미개봉 유통기한:',
    hsdOpenedLabel: '개봉 후 소비기한:',
    packSpecLabel: '포장 및 보관 규격:',
    lockTitle: '관리자에 의해 시스템이 잠금 상태입니다',
    lockDefaultMsg: 'SHE 규정 업데이트 및 점검 중입니다. PIN을 입력하거나 관리자로 로그인하여 잠금을 해제하세요.',
    lockPinPlaceholder: '잠금 해제 PIN 입력...',
    lockPinBtn: '잠금 해제',
    lockPinWrong: '잠금 해제 PIN이 올바르지 않습니다.',
    lockAdminBtn: '관리자 로그인으로 해제',
    noFreezeIntro:
      '제8조 — 결정 107/2026/QĐ-SHE/SG(SHE-QĐ-FB13): 식감·품질·식품 안전 유지를 위해 냉동 보관이 금지된 11개 식품 그룹입니다.',
    noFreezeColIdx: '번호',
    noFreezeColGroup: '식품 그룹',
    noFreezeColDetail: '세부 품목',
    noFreezeColReason: '냉동 금지 사유',
    rulesIntro:
      '결정 107/2026/QĐ-SHE/SG(SHE-QĐ-FB13 · 시행일 2026년 11월 12일) 제1조~제9조 및 위생 관리 표준 절차 안내입니다.',
    chillerOrderTitle: '냉장고 적재 순서 (6.4절 · 위→아래)',
    chillerTiers: [
      '1. 즉석섭취/조리 완료 식품(RTE)',
      '2. 생 해산물',
      '3. 원물 덩어리 고기',
      '4. 다짐육',
      '5. 가금류(맨 아래층)',
    ],
    floorClearance: '바닥에서 최소 15cm 이격 · FIFO / FEFO · 밀폐 및 생/익 분리',
    coolingTitle: '2단계 냉각 및 재가열 (6.6절)',
    coolingSteps: [
      '1단계: 57°C → 21°C (최대 2시간 이내)',
      '2단계: 21°C → ≤ 5°C (최대 4시간 이내, ≤ 5cm 얕은 트레이)',
      '재가열: 중심온도 ≥ 75°C (또는 82°C 2분) · 1회만 허용',
    ],
    labelingTitle: '필수 라벨 4대 기재 항목 (6.3절)',
    labelingFields: [
      '1. 정확한 식품명',
      '2. 1일차 날짜 (시간 단위 품목은 시각 포함)',
      '3. 소비기한 날짜/시각',
      '4. 담당 직원명',
    ],
    thawTitle: '해동 및 4시간·7일 제한 (6.1, 6.2, 6.7절)',
    thawRules: [
      '허용 방법 3가지: 냉장(0–5°C) · ≤ 21°C 흐르는 물 · 전자레인지(즉시 조리)',
      '해동 후 24시간 이내 사용 · 재냉동 절대 금지',
      '기준 온도 이탈 누적 최대 4시간 · 냉장 RTE TCS 최대 7일',
    ],
    tableReadPoints: [
      '개봉·손질·조리·해동 이후 기간이 적용됩니다.',
      '“금지”: 해당 온도 보관 불가(6.1절 4시간 작업 예외 제외).',
      '“냉동 금지”: 제8조에 따라 냉동 불가.',
      '“제조사 기준”: 포장 표시 우선(해당 온도 안내 없으면 금지). 열 간 기간 합산 금지.',
    ],
    art8MatchTitle: '제8조 주의 — 냉동 금지 품목',
  },
  HI: {
    aiTag: 'AI स्मार्ट खोज',
    aiSearching: 'AI विश्लेषण...',
    aiButtonTitle: 'AI संदर्भ और समानार्थी खोज चलाएं',
    aiBannerTitle: 'AI प्रासंगिक मिलान',
    aiLegalNotice: 'सभी प्रदर्शित आँकड़े निर्णय 107/2026/QĐ-SHE/SG के 100% अनुरूप हैं।',
    aiDismiss: 'AI हटाएं',
    quickLabel: 'त्वरित फ़िल्टर:',
    quickToday: 'घंटे / उसी दिन',
    quickRoom: 'कमरा 15–25°C',
    quickCool: 'ठंडा 0–5°C',
    quickFrozen: 'फ़्रीज़ ≤ −18°C',
    quickNoFreeze: 'फ़्रीज़ न करें',
    allOption: 'सभी',
    copyShort: 'कॉपी',
    mobileTitleLine1: 'खाद्य भंडारण व शेल्फ-लाइफ़ (SHE)',
    mobileTitleLine2: 'निर्णय 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13)',
    mobileSearchPlaceholder: 'खाद्य, SHE-01, समूह, फ़्रीज़ नहीं खोजें...',
    desktopSearchPlaceholder: 'खाद्य प्रकार, SHE-01 कोड, समूह या भंडारण नियम खोजें...',
    footerInternal: 'आंतरिक खोज प्रणाली - खाद्य एवं पेय प्रभाग - SUN WORLD BA NA HILLS',
    historyBtn: 'इतिहास',
    historyTitle: 'मेरा खोज इतिहास',
    adminBtn: 'एडमिन',
    adminTitle: 'सिस्टम प्रशासन (Admin)',
    stdTempLabel: 'मानक भंडारण तापमान:',
    hsdUnopenedLabel: 'बिना खुले शेल्फ लाइफ:',
    hsdOpenedLabel: 'खुलने के बाद शेल्फ लाइफ:',
    packSpecLabel: 'पैकेजिंग और भंडारण नियम:',
    lockTitle: 'एडमिन द्वारा सिस्टम अस्थायी रूप से लॉक है',
    lockDefaultMsg: 'SHE नियम अपडेट के लिए ऐप रोका गया है। अनलॉक PIN दर्ज करें या एडमिन के रूप में लॉगिन करें।',
    lockPinPlaceholder: 'अनलॉक PIN दर्ज करें...',
    lockPinBtn: 'अनलॉक करें',
    lockPinWrong: 'अनलॉक PIN गलत है।',
    lockAdminBtn: 'एडमिन लॉगिन से अनलॉक करें',
    noFreezeIntro:
      'अनुच्छेद 8 — निर्णय 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13) के अनुसार: गुणवत्ता व सुरक्षा हेतु फ़्रीज़ न किए जाने वाले 11 खाद्य समूह।',
    noFreezeColIdx: 'क्र.',
    noFreezeColGroup: 'खाद्य समूह',
    noFreezeColDetail: 'विवरण',
    noFreezeColReason: 'फ़्रीज़ न करने का कारण',
    rulesIntro:
      'निर्णय 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13 · प्रभावी 12/11/2026) के अनुच्छेद 1 से 9 और खाद्य सुरक्षा प्रक्रियाएँ।',
    chillerOrderTitle: 'चिलर भंडारण क्रम (6.4 · ऊपर → नीचे)',
    chillerTiers: [
      '1. खाने के लिए तैयार / पके भोजन (RTE)',
      '2. ताज़ा समुद्री भोजन',
      '3. साबुत लाल मांस',
      '4. कीमा / पिसा मांस',
      '5. पोल्ट्री (सबसे नीचे)',
    ],
    floorClearance: 'फर्श से ≥ 15 सेमी ऊपर · FIFO / FEFO · ढका व पृथक रखें',
    coolingTitle: '2-चरणीय कूलिंग और रीहीटिंग (6.6)',
    coolingSteps: [
      'चरण 1: 57°C → 21°C अधिकतम 02 घंटे में',
      'चरण 2: 21°C → ≤ 5°C अधिकतम 04 घंटे में (≤ 5 सेमी उथली ट्रे)',
      'रीहीटिंग: केंद्र ≥ 75°C (या 82°C पर 2 मिनट) · केवल 1 बार',
    ],
    labelingTitle: 'अनिवार्य 4-बिंदु खाद्य लेबल (6.3)',
    labelingFields: [
      '1. स्पष्ट नाम',
      '2. दिन 1 तिथि (घंटे वाली वस्तुओं में समय सहित)',
      '3. समाप्ति तिथि/समय',
      '4. कर्मचारी का नाम',
    ],
    thawTitle: 'डीफ़्रॉस्ट व 4घंटे/7दिन नियम (6.1, 6.2, 6.7)',
    thawRules: [
      '3 तरीके: चिलर 0–5°C · बहता पानी ≤ 21°C · माइक्रोवेव (तुरंत पकाएँ)',
      'डीफ़्रॉस्ट के 24 घंटे में उपयोग करें · दोबारा फ़्रीज़ न करें',
      'सीमा से बाहर अधिकतम 4 घंटे · ठंडा RTE TCS अधिकतम 7 दिन',
    ],
    tableReadPoints: [
      'खोलने, तैयारी, पकाने या डीफ़्रॉस्ट के बाद लागू।',
      '“नहीं”: उस तापमान पर भंडारण वर्जित (6.1 के 4 घंटे अपवाद को छोड़कर)।',
      '“फ़्रीज़ न करें”: अनुच्छेद 8 के तहत वर्जित।',
      '“NSX अनुसार”: पैकेट अनुसार; न होने पर वर्जित मानें। कॉलम न जोड़ें।',
    ],
    art8MatchTitle: 'अनुच्छेद 8 चेतावनी — फ़्रीज़ न करें',
  },
};

type QuickHygieneMode = 'none' | 'today' | 'noFreeze';

const LANG_FULL_NAMES: Record<Lang, string> = {
  VI: 'Tiếng Việt',
  EN: 'English',
  KO: '한국어',
  HI: 'हिन्दी',
};

function SheMonogramEmblem() {
  return (
    <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg border border-[#C9A227]/65 bg-[#012E43] overflow-hidden shadow-sm select-none">
      <img
        src="/assets/aistudio/f607abb135050e38-image_70D56EB4-2160-4774-BBB0-8008B40A9514_12ee1e5b.jpeg"
        alt="BNC F&B"
        className="h-full w-full object-cover scale-[1.16]"
      />
    </div>
  );
}

interface StorageCellProps {
  label: string;
  rawValue: string;
  displayValue: string;
  tone: 'amber' | 'teal' | 'indigo';
  icon: React.ReactNode;
}

function StorageCell({
  label,
  rawValue,
  displayValue,
  tone,
  icon,
}: StorageCellProps) {
  const empty = isEmptyCell(rawValue);
  const noFreeze = isNoFreezeCell(rawValue);
  const disallowed = isDisallowedCell(rawValue);

  if (empty) {
    return (
      <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-[#F4F2EC]/70 text-[#8E96A3] opacity-45 select-none">
        <div className="flex items-start sm:items-center gap-1 text-[10px] sm:text-[10.5px] font-semibold tracking-wide leading-tight text-[#8A92A0]">
          <span className="shrink-0 mt-[1px] sm:mt-0">{icon}</span>
          <span className="break-words">{label}</span>
        </div>
        <div className="mt-1 tabular-nums text-[13px] sm:text-[14px] font-medium text-[#8E96A3] leading-snug">
          —
        </div>
      </div>
    );
  }

  if (noFreeze) {
    return (
      <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-[#FDF3F2]/80 text-[#9A2E2A] ring-1 ring-inset ring-[#E9B8B4] opacity-85">
        <div className="flex items-start sm:items-center gap-1 text-[10px] sm:text-[10.5px] font-bold tracking-wide leading-tight text-[#9A2E2A]">
          <span className="shrink-0 mt-[1px] sm:mt-0">{icon}</span>
          <span className="break-words">{label}</span>
        </div>
        <div className="mt-1 tabular-nums text-[12px] sm:text-[13px] font-bold text-[#9A2E2A] leading-snug">
          {displayValue}
        </div>
      </div>
    );
  }

  if (disallowed) {
    return (
      <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-[#F4F2EC]/75 text-[#64748B] ring-1 ring-inset ring-[#E6E2D8] opacity-45">
        <div className="flex items-start sm:items-center gap-1 text-[10px] sm:text-[10.5px] font-semibold tracking-wide leading-tight text-[#64748B]">
          <span className="shrink-0 mt-[1px] sm:mt-0">{icon}</span>
          <span className="break-words">{label}</span>
        </div>
        <div className="mt-1 tabular-nums text-[12.5px] sm:text-[13.5px] font-semibold text-[#64748B] leading-snug">
          {displayValue}
        </div>
      </div>
    );
  }

  const toneClasses =
    tone === 'amber'
      ? 'z-[2] bg-gradient-to-b from-[#FFFDF4] to-[#FCEFCE] text-[#7D5B0F] ring-2 ring-inset ring-[#D9AF38] shadow-[0_6px_16px_rgba(138,101,16,0.16)]'
      : tone === 'teal'
        ? 'z-[2] bg-gradient-to-b from-[#F8FEFF] to-[#DDF1F5] text-[#0E4D5B] ring-2 ring-inset ring-[#3F97AA] shadow-[0_6px_16px_rgba(15,94,110,0.16)]'
        : 'z-[2] bg-gradient-to-b from-[#F9FBFF] to-[#E1E7F9] text-[#22335C] ring-2 ring-inset ring-[#5D73BB] shadow-[0_6px_16px_rgba(43,62,107,0.16)]';

  const labelColor =
    tone === 'amber'
      ? 'text-[#8A6510]'
      : tone === 'teal'
        ? 'text-[#0F5E6E]'
        : 'text-[#2B3E6B]';

  const dotColor =
    tone === 'amber'
      ? 'bg-[#B98512]'
      : tone === 'teal'
        ? 'bg-[#0F5E6E]'
        : 'bg-[#2B3E6B]';

  return (
    <div className={`relative px-2 sm:px-3 py-2 sm:py-2.5 transition-all ${toneClasses}`}>
      <div
        className={`flex items-start sm:items-center gap-1 text-[10px] sm:text-[10.5px] font-extrabold tracking-wide leading-tight ${labelColor}`}
      >
        <span className="shrink-0 mt-[1px] sm:mt-0">{icon}</span>
        <span className="break-words">{label}</span>
        <span
          aria-hidden="true"
          className={`ml-auto mt-1 sm:mt-0 h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`}
        />
      </div>
      <div className="mt-1 tabular-nums text-[13.5px] sm:text-[14.5px] font-extrabold text-[#0F233D] leading-snug">
        {displayValue}
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>('VI');
  const t = UI_TRANSLATIONS[lang];
  const ex = EXTRA_LABELS[lang];

  const [items, setItems] = useState<FoodItem[]>(() => [...FOOD_ITEMS]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(
    DEFAULT_SYSTEM_CONFIG
  );
  const isOnline = useOnlineStatus();
  const [adminOpen, setAdminOpen] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeConnectionState>('disconnected');
  const [realtimeEpoch, setRealtimeEpoch] = useState<number>(0);
  const [pinUnlockedAt, setPinUnlockedAt] = useState<number>(0);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 639px)').matches
      : false
  );
  const [workspaceTab, setWorkspaceTab] = useState<MainWorkspaceTab>('table');
  const [query, setQuery] = useState<string>('');
  const [group, setGroup] = useState<string>('ALL');
  const [storageFilter, setStorageFilter] = useState<StorageFilter>('all');
  const [quickHygiene, setQuickHygiene] = useState<QuickHygieneMode>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string>('');
  const [groupMenuOpen, setGroupMenuOpen] = useState<boolean>(false);
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [dbItems, dbConfig, cloudCfg] = await Promise.all([
        loadAllItemsFromDb(),
        loadSystemConfig(),
        loadCloudConfig(),
      ]);
      if (!active) return;
      if (dbItems.length > 0) setItems(dbItems);
      setSystemConfig(dbConfig);

      if (isOnline && getCloudSyncStatus(cloudCfg).configured) {
        const lastSyncRow = await db.meta.get('lastCloudSyncedAt');
        const localSyncedAt = Number(lastSyncRow?.value || 0);
        const remote = await pullCatalogFromCloud(cloudCfg);
        const remoteIsSheCatalog =
          Boolean(remote.items && remote.items.length > 0) &&
          (remote.items!.some((it) => (it.a as string) === 'SHE') ||
            Boolean(remote.config?.customColumns) ||
            remote.config?.appLocked !== undefined);
        if (
          active &&
          remote.ok &&
          remote.items &&
          remote.items.length > 0 &&
          remoteIsSheCatalog &&
          (remote.syncedAt || 0) > localSyncedAt
        ) {
          const syncedItems = await applyImportedItemsToDb(
            remote.items,
            'overwrite',
            remote.config
          );
          await db.meta.put({
            key: 'lastCloudSyncedAt',
            value: String(remote.syncedAt || Date.now()),
          });
          if (!active) return;
          setItems(syncedItems);
          if (remote.config) setSystemConfig(remote.config);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [isOnline]);

  // Global Supabase Realtime WebSocket + adaptive fallback listener
  useEffect(() => {
    if (!isOnline) {
      setRealtimeStatus('disconnected');
      return;
    }
    let disposed = false;
    let cleanup: (() => void) | null = null;

    void loadCloudConfig().then((cloudCfg) => {
      if (disposed) return;
      if (!getCloudSyncStatus(cloudCfg).configured) {
        setRealtimeStatus('disconnected');
        return;
      }
      cleanup = subscribeToSupabaseRealtime(cloudCfg, {
        onStatusChange: (nextState) => {
          if (!disposed) setRealtimeStatus(nextState);
        },
        onRemoteUpdate: ({ items: remoteItems, config: remoteConfig }) => {
          if (disposed || !remoteItems || remoteItems.length === 0) return;
          const isValidSheRemote =
            remoteItems.some((it) => (it.a as string) === 'SHE') ||
            Boolean(remoteConfig?.customColumns) ||
            remoteConfig?.appLocked !== undefined;
          if (!isValidSheRemote) return;
          void applyImportedItemsToDb(remoteItems, 'overwrite', remoteConfig).then(
            (syncedItems) => {
              if (disposed) return;
              setItems(syncedItems);
              if (remoteConfig) setSystemConfig(remoteConfig);
            }
          );
        },
      });
    });

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
  }, [isOnline, realtimeEpoch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // AI Semantic Search state
  const [aiMatchedCodes, setAiMatchedCodes] = useState<string[]>([]);
  const [aiReason, setAiReason] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiLastQuery, setAiLastQuery] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const groupDropdownRef = useRef<HTMLDivElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiLastKeyRef = useRef<string>('');
  const aiEndpointAvailableRef = useRef<boolean>(
    typeof window !== 'undefined' ? window.location.protocol !== 'file:' : true
  );

  const openItemDetail = useCallback((item: FoodItem) => {
    setSelectedItem(item);
    void recordItemViewBehavior(item);
  }, []);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.g] = (counts[item.g] || 0) + 1;
    }
    return counts;
  }, [items]);

  const visibleGroupOptions = useMemo(() => {
    const set = new Set<string>(ALL_GROUPS);
    for (const item of items) {
      if (item.g) set.add(item.g);
    }
    return Array.from(set);
  }, [items]);

  useEffect(() => {
    if (!groupMenuOpen && !langMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupMenuOpen &&
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(event.target as Node)
      ) {
        setGroupMenuOpen(false);
      }
      if (
        langMenuOpen &&
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setGroupMenuOpen(false);
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [groupMenuOpen, langMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        document.activeElement !== searchInputRef.current
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (
        event.key === 'Escape' &&
        document.activeElement === searchInputRef.current
      ) {
        setQuery('');
        setAiMatchedCodes([]);
        setAiReason('');
        setAiLastQuery('');
        aiLastKeyRef.current = '';
        searchInputRef.current?.blur();
      }
      if (event.key === 'Escape') {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      aiAbortRef.current?.abort();
    };
  }, []);

  const triggerAiSearch = useCallback(
    async (targetQuery: string, targetLang: Lang) => {
      const q = targetQuery.trim();
      if (!q) {
        setAiMatchedCodes([]);
        setAiReason('');
        setAiLastQuery('');
        aiLastKeyRef.current = '';
        return;
      }

      if (!aiEndpointAvailableRef.current) {
        setAiMatchedCodes([]);
        setAiReason('');
        return;
      }

      const requestKey = `${targetLang}::${q.toLowerCase()}`;
      aiAbortRef.current?.abort();
      const controller = new AbortController();
      aiAbortRef.current = controller;

      setAiLoading(true);
      try {
        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, lang: targetLang }),
          signal: controller.signal,
        });

        if (response.status === 404 || response.status === 405) {
          aiEndpointAvailableRef.current = false;
        }
        if (!response.ok) {
          setAiMatchedCodes([]);
          setAiReason('');
          return;
        }

        const data = (await response.json()) as {
          matchedCodes?: string[];
          reason?: string;
        };
        if (controller.signal.aborted) return;
        aiLastKeyRef.current = requestKey;
        setAiMatchedCodes(
          Array.isArray(data.matchedCodes) ? data.matchedCodes : []
        );
        setAiReason(typeof data.reason === 'string' ? data.reason : '');
        setAiLastQuery(q);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          setAiMatchedCodes([]);
          setAiReason('');
        }
      } finally {
        if (!controller.signal.aborted) {
          setAiLoading(false);
        }
      }
    },
    []
  );

  // Automatic smart debounced AI boost on Table tab when online
  useEffect(() => {
    if (workspaceTab !== 'table') return;
    const q = query.trim();
    if (!q) {
      aiAbortRef.current?.abort();
      aiLastKeyRef.current = '';
      setAiLoading(false);
      setAiMatchedCodes([]);
      setAiReason('');
      setAiLastQuery('');
      return;
    }

    const requestKey = `${lang}::${q.toLowerCase()}`;
    if (aiLastQuery && aiLastQuery.toLowerCase() !== q.toLowerCase()) {
      setAiMatchedCodes([]);
      setAiReason('');
    }
    if (aiLastKeyRef.current === requestKey) return;

    const localInstant = runSmartSearch({
      items,
      query: q,
      lang,
      aiMatchedCodes: [],
    });

    const wordCount = q.split(/\s+/).filter(Boolean).length;
    const isCodeQuery = /^she[- ]?\d{1,2}$/i.test(q);
    const shouldAutoTriggerAi =
      isOnline &&
      !isCodeQuery &&
      (localInstant.length === 0 || wordCount >= 2 || q.length >= 6);

    if (!shouldAutoTriggerAi) return;

    const timer = window.setTimeout(() => {
      void triggerAiSearch(q, lang);
    }, 520);

    return () => window.clearTimeout(timer);
  }, [query, lang, workspaceTab, triggerAiSearch, aiLastQuery, items, isOnline]);

  const handleSelectGroup = (nextGroup: string) => {
    setGroup(nextGroup);
    setGroupMenuOpen(false);
  };

  const toggleQuickHygiene = (mode: QuickHygieneMode) => {
    setQuickHygiene((prev) => (prev === mode ? 'none' : mode));
  };

  const resetFilters = () => {
    aiAbortRef.current?.abort();
    setQuery('');
    setGroup('ALL');
    setStorageFilter('all');
    setQuickHygiene('none');
    setAiMatchedCodes([]);
    setAiReason('');
    setAiLastQuery('');
    aiLastKeyRef.current = '';
  };

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (group !== 'ALL') list = list.filter((item) => item.g === group);
    if (storageFilter === 'room') {
      list = list.filter((item) => hasCellValue(item.room));
    }
    if (storageFilter === 'cool') {
      list = list.filter((item) => hasCellValue(item.cool));
    }
    if (storageFilter === 'freeze') {
      list = list.filter((item) => hasCellValue(item.freeze));
    }

    if (quickHygiene === 'today') {
      list = list.filter((item) => hasUseToday(item));
    } else if (quickHygiene === 'noFreeze') {
      list = list.filter((item) => isNoFreezeCell(item.freeze));
    }

    const q = query.trim();
    if (q) {
      return runSmartSearch({
        items: list,
        query: q,
        lang,
        aiMatchedCodes,
      });
    }

    list.sort((a, b) => (a.order ?? a.n) - (b.order ?? b.n) || a.n - b.n);
    return list;
  }, [
    items,
    query,
    group,
    storageFilter,
    quickHygiene,
    lang,
    aiMatchedCodes,
  ]);

  const filteredNoFreeze = useMemo(() => {
    const qNorm = normalizeText(query.trim());
    return SHE_NO_FREEZE_ITEMS.map((nf, idx) => ({
      raw: nf,
      localized: translateNoFreezeItem(nf, idx, lang),
      index: idx,
    })).filter(({ raw, localized }) => {
      if (!qNorm) return true;
      const pool = normalizeText(
        `${raw.group} ${raw.detail} ${raw.reason} ${(raw.keywords || []).join(' ')} ${localized.group} ${localized.detail} ${localized.reason}`
      );
      return qNorm.split(/\s+/).every((tk) => pool.includes(tk));
    });
  }, [query, lang]);

  const filteredPolicies = useMemo(() => {
    const qNorm = normalizeText(query.trim());
    return SHE_POLICY_SECTIONS.map((sec) => ({
      raw: sec,
      localized: translatePolicySection(sec, lang),
    })).filter(({ raw, localized }) => {
      if (!qNorm) return true;
      const pool = normalizeText(
        `${raw.article} ${raw.title} ${raw.summary} ${raw.keywords.join(' ')} ${localized.article} ${localized.title} ${localized.summary}`
      );
      return qNorm.split(/\s+/).every((tk) => pool.includes(tk));
    });
  }, [query, lang]);

  // Matching Điều 8 items for detail modal callout
  const selectedItemArt8Warnings = useMemo(() => {
    if (!selectedItem) return [];
    const textNorm = normalizeText(
      `${selectedItem.name} ${selectedItem.g} ${(selectedItem.keywords || []).join(' ')}`
    );
    const words = textNorm.split(/\s+/).filter(Boolean);
    return SHE_NO_FREEZE_ITEMS.map((nf, idx) => ({
      nf,
      idx,
      loc: translateNoFreezeItem(nf, idx, lang),
    })).filter(({ nf }) => {
      const kws = (nf.keywords || []).map((k) => normalizeText(k));
      return kws.some((kw) => kw.length >= 3 && (textNorm.includes(kw) || words.includes(kw)));
    });
  }, [selectedItem, lang]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      void recordSearchBehavior(q, lang, filteredItems.length);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [query, lang, filteredItems.length]);

  const copyExcerpt = (text: string, label: string) => {
    const showToast = () => {
      setCopiedLabel(label);
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setCopiedLabel('');
      }, 2200);
    };

    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast();
      } catch {
        // ignore clipboard failure
      }
      document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showToast).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  const activeCustomColumns = useMemo(
    () =>
      [...(systemConfig.customColumns || [])]
        .filter((col) => col.visible)
        .sort((a, b) => a.order - b.order),
    [systemConfig.customColumns]
  );

  const isAppLocked =
    Boolean(systemConfig.appLocked) &&
    pinUnlockedAt < (systemConfig.updatedAt || 1);

  const formatExcerpt = (item: FoodItem): string => {
    const customLines = activeCustomColumns
      .map((col) => {
        const val = item.customFields?.[col.id]?.trim();
        return val ? `${col.label}: ${val}` : '';
      })
      .filter(Boolean);
    return `${t.excerptLabel} — ${getItemCode(item)} — ${translateItemName(item, lang)}
${t.groupLabel}: ${translateGroup(item.g, lang)}
${t.colRoom}: ${translateDuration(item.room, lang)}
${t.colCool}: ${translateDuration(item.cool, lang)}
${t.colFreeze}: ${translateDuration(item.freeze, lang)}
${t.noteLabel}: ${isEmptyCell(item.note) ? t.emptyNote : translateItemNote(item, lang)}${customLines.length > 0 ? `\n${customLines.join('\n')}` : ''}
${t.sourceDoc}`;
  };

  const hasActiveFilters =
    Boolean(query) ||
    group !== 'ALL' ||
    storageFilter !== 'all' ||
    quickHygiene !== 'none';

  const hasCustomLogo =
    Boolean(systemConfig.logoUrl) &&
    systemConfig.logoUrl !== '/bnc-logo.jpg' &&
    systemConfig.logoUrl !== '/she-logo.svg';

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#182230]"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      {/* Top Bar */}
      <header className="relative z-50 bg-[#122A47] text-white border-b border-[#C9A227]/60">
        <div className="mx-auto max-w-[1360px] px-3.5 sm:px-6 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {hasCustomLogo ? (
                <img
                  src={systemConfig.logoUrl}
                  alt="Khối SHE"
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg border border-white/25 object-cover shadow-sm"
                />
              ) : (
                <SheMonogramEmblem />
              )}
              <div className="min-w-0 flex-1">
                <p className="sm:hidden text-[13.5px] font-extrabold tracking-tight leading-[1.3] text-white whitespace-nowrap truncate">
                  {lang === 'VI'
                    ? systemConfig.mobileTitleLine1 || ex.mobileTitleLine1
                    : ex.mobileTitleLine1}
                </p>
                <p className="sm:hidden text-[clamp(8.4px,2.25vw,10.5px)] font-semibold tracking-[0.015em] text-white/85 mt-0.5 leading-[1.55] pt-[1px] truncate">
                  {lang === 'VI'
                    ? systemConfig.appSubtitle || t.subtitle
                    : t.subtitle}
                </p>
                <h1 className="hidden sm:block text-[17px] lg:text-[19px] font-extrabold tracking-tight leading-snug text-white text-balance">
                  {lang === 'VI' ? systemConfig.appTitle || t.title : t.title}
                </h1>
                <p className="hidden sm:block text-[11px] font-semibold tracking-wider text-[#E2C665] mt-0.5 leading-normal truncate">
                  {lang === 'VI'
                    ? systemConfig.appSubtitle || t.subtitle
                    : t.subtitle}
                </p>
              </div>
            </div>

            {/* Mobile Utility Cluster */}
            <div className="flex items-center gap-1 sm:hidden shrink-0">
              <PWAInstallButton compact lang={lang} />
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label={ex.historyTitle}
                title={ex.historyTitle}
                className="h-[28px] w-[28px] rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 flex items-center justify-center text-white"
              >
                <History size={13} />
              </button>
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                aria-label={ex.adminTitle}
                title={ex.adminTitle}
                className="h-[28px] w-[28px] rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 flex items-center justify-center text-[#E2C665]"
              >
                <ShieldCheck size={13} />
              </button>

              <div ref={langDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={langMenuOpen}
                  aria-label="Language"
                  className="h-[28px] px-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 flex items-center gap-1 text-[11px] font-bold text-white transition-colors"
                >
                  <Globe size={12} className="text-[#E2C665] shrink-0" />
                  <span>{lang}</span>
                  <ChevronDown
                    size={11}
                    className={`text-white/80 transition-transform duration-150 ${
                      langMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {langMenuOpen && (
                  <div
                    role="listbox"
                    aria-label="Language"
                    className="fade-in absolute right-0 top-full z-50 mt-1.5 w-40 rounded-xl border border-[#DFD9CB] bg-white p-1 text-[#182230] shadow-[0_16px_36px_rgba(15,23,42,0.22)]"
                  >
                    {LANGS.map((code) => {
                      const active = lang === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setLang(code);
                            setLangMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                            active
                              ? 'bg-[#F2EFE8] font-bold text-[#122A47]'
                              : 'font-medium text-[#182230] hover:bg-[#F6F4EF]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#8A6510]">
                              {code}
                            </span>
                            <span>{LANG_FULL_NAMES[code]}</span>
                          </span>
                          {active && <Check size={14} className="text-[#1E4A75]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop / Tablet Action Cluster */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <PWAInstallButton lang={lang} />
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                title={ex.historyTitle}
                aria-label={ex.historyTitle}
                className="h-[34px] px-2.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-[12px] font-bold text-white flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <History size={14} className="text-[#E2C665]" />
                <span className="hidden lg:inline">{ex.historyBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                title={ex.adminTitle}
                aria-label={ex.adminTitle}
                className="h-[34px] px-2.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-[12px] font-bold text-white flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <ShieldCheck size={14} className="text-[#E2C665]" />
                <span>{ex.adminBtn}</span>
              </button>

              <div
                className="flex items-center shrink-0 rounded-lg border border-white/20 bg-white/10 p-0.5"
                role="group"
                aria-label="Language"
              >
                {LANGS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    aria-label={code}
                    className={`h-[34px] min-w-[38px] px-2 rounded-md text-[12px] font-bold whitespace-nowrap transition-colors ${
                      lang === code
                        ? 'bg-[#C9A227] text-[#122A47]'
                        : 'text-white/85 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Line 2 Descriptor */}
          <p
            role="heading"
            aria-level={1}
            className="sm:hidden mt-2 pt-1.5 border-t border-white/12 text-[clamp(8.8px,2.56vw,11.5px)] font-extrabold tracking-[-0.012em] leading-tight text-[#F3DA7B] whitespace-nowrap truncate"
          >
            {lang === 'VI'
              ? systemConfig.mobileTitleLine2 || ex.mobileTitleLine2
              : ex.mobileTitleLine2}
          </p>
        </div>
      </header>

      <OfflineStatusBadge isOnline={isOnline} lang={lang} />

      {/* Compact Sticky Search Dock */}
      <div className="sticky top-[var(--safe-area-inset-top)] z-40 bg-[#122A47]/95 backdrop-blur-md border-b border-[#C9A227]/70 shadow-[0_8px_24px_rgba(18,42,71,0.16)]">
        <div className="mx-auto max-w-[1360px] px-3.5 sm:px-6 py-2 sm:py-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (workspaceTab !== 'table') setWorkspaceTab('table');
              void triggerAiSearch(query, lang);
            }}
            className="relative flex items-center"
          >
            <Search
              className="pointer-events-none absolute left-3 sm:left-3.5 text-[#1E4A75]"
              size={17}
            />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isMobileViewport
                  ? ex.mobileSearchPlaceholder
                  : ex.desktopSearchPlaceholder
              }
              aria-label={t.searchPlaceholder}
              className={`w-full h-[42px] sm:h-[50px] bg-white border border-[#D8D2C2] focus:border-[#C9A227] rounded-xl pl-9 sm:pl-10 ${
                query ? 'pr-[104px] sm:pr-44' : 'pr-[72px] sm:pr-40'
              } text-[13.5px] sm:text-[15px] font-medium text-[#182230] placeholder:text-[#7A8291] shadow-sm transition-colors`}
            />

            <div className="absolute right-1.5 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    aiAbortRef.current?.abort();
                    setQuery('');
                    setAiMatchedCodes([]);
                    setAiReason('');
                    setAiLastQuery('');
                    aiLastKeyRef.current = '';
                    searchInputRef.current?.focus();
                  }}
                  aria-label={t.clearSearch}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-[#6B7280] hover:text-[#182230] hover:bg-[#F2EFE8] flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="submit"
                disabled={!query.trim() || aiLoading}
                title={ex.aiButtonTitle}
                className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-[11.5px] sm:text-[12px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  query.trim()
                    ? 'bg-[#1E4A75] text-white hover:bg-[#122A47]'
                    : 'bg-[#F2EFE8] text-[#8A92A0] cursor-not-allowed'
                }`}
              >
                {aiLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span className="hidden sm:inline">
                  {aiLoading ? ex.aiSearching : ex.aiTag}
                </span>
                <span className="sm:hidden">AI</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-3.5 sm:px-6 py-3.5 sm:py-5 pb-10">
        {systemConfig.alertBannerEnabled && systemConfig.alertBannerText && (
          <div className="mb-3 rounded-xl border border-[#DFBA51] bg-[#FDF8EB] px-3.5 py-2.5 flex items-center gap-2 text-[12.5px] font-bold text-[#7D5B0F]">
            <Megaphone size={15} className="shrink-0 text-[#9A6700]" />
            <span className="leading-snug">{systemConfig.alertBannerText}</span>
          </div>
        )}
        {systemConfig.bannerImageUrl && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-[#E2DDD0] bg-white">
            <img
              src={systemConfig.bannerImageUrl}
              alt="Banner hệ thống"
              className="w-full max-h-40 object-cover"
            />
          </div>
        )}

        {/* 3 Primary SHE Workspace Tabs */}
        <div className="relative -mx-3.5 sm:mx-0">
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x snap-proximity touch-pan-x scroll-px-3.5 px-3.5 pr-8 sm:px-0 sm:pr-0 pb-0.5"
            style={{ WebkitOverflowScrolling: 'touch' }}
            role="tablist"
            aria-label={t.appendixLabel}
          >
            {(
              [
                ['table', t.tabTable, items.length, <Thermometer key="t" size={14} />],
                ['nofreeze', t.tabNoFreeze, SHE_NO_FREEZE_ITEMS.length, <AlertOctagon key="n" size={14} />],
                ['rules', t.tabRules, SHE_POLICY_SECTIONS.length, <BookOpen key="r" size={14} />],
              ] as const
            ).map(([tabKey, label, count, icon]) => {
              const active = workspaceTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setWorkspaceTab(tabKey);
                    setGroupMenuOpen(false);
                  }}
                  className={`snap-start min-h-[40px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12.5px] sm:text-[13px] font-bold border whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 transition-colors ${
                    active
                      ? 'bg-[#122A47] text-white border-[#122A47]'
                      : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#1E4A75]'
                  }`}
                >
                  <span className={active ? 'text-[#E2C665]' : 'text-[#5C6573]'}>{icon}</span>
                  <span>{label}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] font-semibold ${
                      active ? 'text-[#E2C665]' : 'text-[#6B7280]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-7 bg-gradient-to-l from-[#F6F4EF] via-[#F6F4EF]/75 to-transparent sm:hidden"
          />
        </div>

        {/* ================= TAB 1: STORAGE TABLE (ARTICLE 7) ================= */}
        {workspaceTab === 'table' && (
          <>
            {/* Quick Storage & Operational Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mt-3">
              <span className="text-[11px] sm:text-[11.5px] font-bold sm:font-semibold text-[#5C6573] whitespace-nowrap shrink-0">
                {ex.quickLabel}
              </span>
              <div className="relative -mx-3.5 sm:mx-0 flex-1 min-w-0">
                <div
                  className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar snap-x snap-proximity touch-pan-x scroll-px-3.5 px-3.5 pr-8 sm:px-0 sm:pr-0"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <button
                    type="button"
                    onClick={() => toggleQuickHygiene('today')}
                    aria-pressed={quickHygiene === 'today'}
                    className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                      quickHygiene === 'today'
                        ? 'bg-[#1E4A75] text-white border-[#1E4A75]'
                        : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#1E4A75]'
                    }`}
                  >
                    <Clock3 size={13} />
                    <span>{ex.quickToday}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStorageFilter((prev) => (prev === 'room' ? 'all' : 'room'))
                    }
                    aria-pressed={storageFilter === 'room'}
                    className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                      storageFilter === 'room'
                        ? 'bg-[#8A6510] text-white border-[#8A6510]'
                        : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#8A6510]'
                    }`}
                  >
                    <House size={13} />
                    <span>{ex.quickRoom}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStorageFilter((prev) => (prev === 'cool' ? 'all' : 'cool'))
                    }
                    aria-pressed={storageFilter === 'cool'}
                    className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                      storageFilter === 'cool'
                        ? 'bg-[#0F5E6E] text-white border-[#0F5E6E]'
                        : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#0F5E6E]'
                    }`}
                  >
                    <Thermometer size={13} />
                    <span>{ex.quickCool}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStorageFilter((prev) =>
                        prev === 'freeze' ? 'all' : 'freeze'
                      )
                    }
                    aria-pressed={storageFilter === 'freeze'}
                    className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                      storageFilter === 'freeze'
                        ? 'bg-[#2B3E6B] text-white border-[#2B3E6B]'
                        : 'bg-white border-[#DFD9CB] text-[#2B3647] hover:border-[#2B3E6B]'
                    }`}
                  >
                    <Snowflake size={13} />
                    <span>{ex.quickFrozen}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleQuickHygiene('noFreeze')}
                    aria-pressed={quickHygiene === 'noFreeze'}
                    className={`snap-start min-h-[34px] px-2.5 py-1.5 rounded-md border text-[12px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                      quickHygiene === 'noFreeze'
                        ? 'bg-[#9A2E2A] text-white border-[#9A2E2A]'
                        : 'bg-white border-[#DFD9CB] text-[#9A2E2A] hover:border-[#9A2E2A]'
                    }`}
                  >
                    <AlertOctagon size={13} />
                    <span>{ex.quickNoFreeze}</span>
                  </button>
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 bottom-0 w-7 bg-gradient-to-l from-[#F6F4EF] via-[#F6F4EF]/75 to-transparent sm:hidden"
                />
              </div>
            </div>

            {/* Structured Control Toolbar (Group & Display Mode) */}
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2.5 sm:gap-3 mt-3 sm:mt-4 items-end">
              <div ref={groupDropdownRef} className="relative min-w-0">
                <span className="block text-[11px] font-bold tracking-wide text-[#5C6573]">
                  {t.filterGroup}
                </span>
                <button
                  type="button"
                  onClick={() => setGroupMenuOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={groupMenuOpen}
                  aria-label={t.filterGroup}
                  className={`mt-1 flex h-[44px] w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-[13.5px] font-semibold text-[#182230] transition-colors ${
                    groupMenuOpen
                      ? 'border-[#1E4A75] ring-2 ring-[#1E4A75]/15'
                      : 'border-[#DFD9CB] hover:border-[#1E4A75]'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {group === 'ALL' ? t.all : translateGroup(group, lang)}
                  </span>
                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-[#1E4A75] transition-transform duration-150 ${
                      groupMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {groupMenuOpen && (
                  <div
                    className="fade-in absolute left-0 right-0 top-full z-30 mt-1.5 max-h-[320px] overflow-y-auto rounded-xl border border-[#DFD9CB] bg-white p-1.5 shadow-[0_20px_44px_rgba(15,23,42,0.16)]"
                    role="listbox"
                    aria-label={t.filterGroup}
                  >
                    {['ALL', ...visibleGroupOptions].map((optionValue) => {
                      const optionLabel =
                        optionValue === 'ALL'
                          ? t.all
                          : translateGroup(optionValue, lang);
                      const count =
                        optionValue === 'ALL'
                          ? items.length
                          : groupCounts[optionValue] || 0;
                      const isSelected = group === optionValue;
                      return (
                        <button
                          key={optionValue}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectGroup(optionValue)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                            isSelected
                              ? 'bg-[#F2EFE8] font-bold text-[#122A47]'
                              : 'font-medium text-[#182230] hover:bg-[#F6F4EF]'
                          }`}
                        >
                          <span className="min-w-0 flex-1">{optionLabel}</span>
                          <span className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums text-[11px] text-[#6B7280]">
                            {count}
                            {isSelected && (
                              <Check size={15} className="text-[#1E4A75]" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="min-w-0">
                <span className="block text-[11px] font-bold tracking-wide text-[#5C6573]">
                  {t.displayLabel}
                </span>
                <div className="mt-1 flex h-[44px] w-full sm:w-auto rounded-xl border border-[#DFD9CB] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label={t.viewGrid}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-[#122A47] text-white'
                        : 'text-[#2B3647] hover:text-[#122A47]'
                    }`}
                  >
                    <LayoutGrid size={15} />
                    <span>{t.viewGrid}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label={t.viewList}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors ${
                      viewMode === 'list'
                        ? 'bg-[#122A47] text-white'
                        : 'text-[#2B3647] hover:text-[#122A47]'
                    }`}
                  >
                    <List size={15} />
                    <span>{t.viewList}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Semantic Banner */}
            {query.trim() && (aiReason || aiMatchedCodes.length > 0) && (
              <div className="fade-in mt-4 rounded-xl border border-[#D4E2EA] bg-[#F1F7FA] px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Sparkles
                    size={16}
                    className="text-[#1E4A75] shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#122A47] leading-snug">
                      {ex.aiBannerTitle}
                      {aiMatchedCodes.length > 0 && (
                        <span className="font-mono tabular-nums text-[#1E4A75]">
                          {' '}
                          · {aiMatchedCodes.length}
                        </span>
                      )}
                    </p>
                    {aiReason && (
                      <p className="text-[13px] text-[#2B3647] mt-0.5 leading-snug">
                        {aiReason}
                      </p>
                    )}
                    <p className="text-[11px] font-medium text-[#5C6573] mt-1">
                      {ex.aiLegalNotice}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiMatchedCodes([]);
                    setAiReason('');
                  }}
                  aria-label={ex.aiDismiss}
                  className="text-[12px] font-semibold text-[#1E4A75] hover:underline whitespace-nowrap shrink-0 py-1"
                >
                  {ex.aiDismiss}
                </button>
              </div>
            )}

            {/* Results Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-5 mb-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] font-bold text-[#182230]">
                <span>
                  <span className="font-mono tabular-nums text-[#1E4A75] font-extrabold">
                    {filteredItems.length}
                  </span>{' '}
                  {t.results}
                </span>
                {group !== 'ALL' && (
                  <span className="text-[13px] font-medium text-[#5C6573]">
                    · {translateGroup(group, lang)}
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[12.5px] font-bold text-[#1E4A75] hover:underline whitespace-nowrap"
                >
                  {t.resetFilter} →
                </button>
              )}
            </div>

            {/* Results Area */}
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D6D0C0] bg-white px-6 py-12 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-[#EEF6F8] flex items-center justify-center">
                  <PackageSearch size={28} className="text-[#1E4A75]" />
                </div>
                <h2 className="font-extrabold text-[18px] mt-4 text-[#182230]">
                  {t.noResultTitle}
                </h2>
                <p className="text-[#5C6573] text-[14px] mt-1 max-w-md mx-auto">
                  {t.noResultDesc}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  {query.trim() && !aiLoading && (
                    <button
                      type="button"
                      onClick={() => void triggerAiSearch(query, lang)}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-[#1E4A75] bg-white text-[#1E4A75] font-bold text-[13px] hover:bg-[#F1F7FA] flex items-center gap-1.5"
                    >
                      <Sparkles size={15} />
                      <span>{ex.aiTag}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[#122A47] text-white font-bold text-[13px] hover:bg-[#1E4A75]"
                  >
                    {t.resetFilter}
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const itemCode = getItemCode(item);
                  const itemName = translateItemName(item, lang);
                  const useToday = hasUseToday(item);
                  const noFreeze = isNoFreezeCell(item.freeze);
                  const qaFlag = translateFlag(item, lang);

                  return (
                    <article
                      key={itemCode}
                      className="rounded-2xl border border-[#E2DDD0] bg-white flex flex-col overflow-hidden transition-colors hover:border-[#C9A227]"
                    >
                      <div className="p-4 sm:p-5 pb-3.5">
                        <div className="flex items-center justify-between gap-2 text-[12px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono tabular-nums font-bold text-[#8A6510]">
                              {itemCode}
                            </span>
                            <span className="text-[#C5BEB0]" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-semibold text-[#5C6573] truncate">
                              {t.appendixLabel}
                            </span>
                          </div>

                          {useToday ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E4A75] whitespace-nowrap shrink-0">
                              <Clock3 size={12} />
                              <span>{t.useToday}</span>
                            </span>
                          ) : noFreeze ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9A2E2A] whitespace-nowrap shrink-0">
                              <AlertOctagon size={12} />
                              <span>{t.noFreezeBadge}</span>
                            </span>
                          ) : null}
                        </div>

                        <p className="text-[11.5px] font-medium text-[#5C6573] mt-1.5 leading-snug line-clamp-1">
                          {translateGroup(item.g, lang)}
                        </p>

                        <button
                          type="button"
                          onClick={() => openItemDetail(item)}
                          className="text-left mt-2 w-full group"
                        >
                          <h3 className="font-extrabold text-[16.5px] leading-snug text-[#122A47] group-hover:text-[#1E4A75] transition-colors">
                            {itemName}
                          </h3>
                          {lang !== 'VI' && (
                            <p className="text-[12px] font-medium text-[#64748B] mt-0.5 line-clamp-1">
                              {item.name}
                            </p>
                          )}
                        </button>

                        {qaFlag && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-bold text-[#9A6700]">
                            <TriangleAlert size={13} className="shrink-0" />
                            <span>{t.qaTitle}</span>
                          </div>
                        )}
                      </div>

                      {/* 3-Column SHE Storage Matrix */}
                      <div className="grid grid-cols-3 border-t border-b border-[#EAE5DA] divide-x divide-[#EAE5DA]">
                        <StorageCell
                          label={t.colRoom}
                          rawValue={item.room}
                          displayValue={translateDuration(item.room, lang)}
                          tone="amber"
                          icon={<House size={12} />}
                        />
                        <StorageCell
                          label={t.colCool}
                          rawValue={item.cool}
                          displayValue={translateDuration(item.cool, lang)}
                          tone="teal"
                          icon={<Thermometer size={12} />}
                        />
                        <StorageCell
                          label={t.colFreeze}
                          rawValue={item.freeze}
                          displayValue={translateDuration(item.freeze, lang)}
                          tone="indigo"
                          icon={<Snowflake size={12} />}
                        />
                      </div>

                      {/* Note Excerpt + Custom Columns + Card Actions */}
                      <div className="p-4 sm:px-5 sm:py-3.5 flex flex-col flex-1 justify-between bg-white">
                        <div>
                          <p className="text-[12.5px] text-[#334155] leading-relaxed line-clamp-3 mb-3">
                            <span className="font-bold text-[#182230]">
                              {t.noteLabel}:{' '}
                            </span>
                            {isEmptyCell(item.note)
                              ? t.emptyNote
                              : translateItemNote(item, lang)}
                          </p>
                          {activeCustomColumns.some((col) =>
                            Boolean(item.customFields?.[col.id]?.trim())
                          ) && (
                            <div className="mb-3 space-y-1 border-t border-[#EAE5DA] pt-2 text-[11.5px] text-[#334155]">
                              {activeCustomColumns.map((col) => {
                                const val = item.customFields?.[col.id]?.trim();
                                if (!val) return null;
                                return (
                                  <div key={col.id} className="leading-snug">
                                    <span className="font-bold text-[#122A47]">
                                      {col.label}:{' '}
                                    </span>
                                    <span>{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-auto">
                          <button
                            type="button"
                            onClick={() => openItemDetail(item)}
                            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#122A47] text-white text-[13px] font-bold hover:bg-[#1E4A75] flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>{t.detail}</span>
                            <ChevronRight size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyExcerpt(
                                formatExcerpt(item),
                                `${itemCode} ${itemName}`
                              )
                            }
                            aria-label={`${t.copy} ${itemName}`}
                            title={t.copy}
                            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] text-[#1E4A75] hover:bg-[#EFECE4] flex items-center justify-center transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Audit Table View */
              <div className="rounded-2xl border border-[#E2DDD0] bg-white overflow-hidden">
                <div className="hidden lg:grid grid-cols-[84px_minmax(0,1.45fr)_130px_130px_136px_minmax(0,1.45fr)_128px] gap-3 px-5 py-3 text-[11px] font-bold tracking-wider uppercase text-[#5C6573] border-b border-[#EAE5DA] bg-[#FAF9F6]">
                  <span>{t.codeLabel.replace(':', '')}</span>
                  <span>{t.colName}</span>
                  <span>{t.colRoom}</span>
                  <span>{t.colCool}</span>
                  <span>{t.colFreeze}</span>
                  <span>{t.noteLabel}</span>
                  <span className="text-right">{t.colAction}</span>
                </div>

                {filteredItems.map((item) => {
                  const itemCode = getItemCode(item);
                  const itemName = translateItemName(item, lang);
                  const roomVal = translateDuration(item.room, lang);
                  const coolVal = translateDuration(item.cool, lang);
                  const freezeVal = translateDuration(item.freeze, lang);

                  const renderTableBadge = (
                    raw: string,
                    display: string,
                    tone: 'amber' | 'teal' | 'indigo'
                  ) => {
                    if (isEmptyCell(raw)) {
                      return (
                        <span className="opacity-40 text-[12.5px] font-medium text-[#8E96A3] select-none">
                          —
                        </span>
                      );
                    }
                    if (isNoFreezeCell(raw)) {
                      return (
                        <span className="opacity-85 inline-flex items-center px-2.5 py-1 rounded-md bg-[#FDF3F2]/85 ring-1 ring-inset ring-[#E9B8B4] text-[12px] font-bold text-[#9A2E2A]">
                          {display}
                        </span>
                      );
                    }
                    if (isDisallowedCell(raw)) {
                      return (
                        <span className="opacity-45 inline-flex items-center px-2.5 py-1 rounded-md bg-[#F4F2EC] ring-1 ring-inset ring-[#E5E1D5] text-[12px] font-semibold text-[#64748B]">
                          {display}
                        </span>
                      );
                    }
                    const cls =
                      tone === 'amber'
                        ? 'bg-gradient-to-b from-[#FFFDF4] to-[#FCEFCE] ring-[#D9AF38] text-[#122A47]'
                        : tone === 'teal'
                          ? 'bg-gradient-to-b from-[#F8FEFF] to-[#DDF1F5] ring-[#3F97AA] text-[#0E4D5B]'
                          : 'bg-gradient-to-b from-[#F9FBFF] to-[#E1E7F9] ring-[#5D73BB] text-[#22335C]';
                    const dot =
                      tone === 'amber'
                        ? 'bg-[#B98512]'
                        : tone === 'teal'
                          ? 'bg-[#0F5E6E]'
                          : 'bg-[#2B3E6B]';
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ring-2 ring-inset shadow-sm tabular-nums text-[12.5px] font-extrabold ${cls}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
                        <span>{display}</span>
                      </span>
                    );
                  };

                  return (
                    <div
                      key={itemCode}
                      className="px-4 sm:px-5 py-3.5 border-b border-[#EAE5DA] last:border-b-0 hover:bg-[#FAF9F6] transition-colors"
                    >
                      {/* Desktop Row */}
                      <div className="hidden lg:grid grid-cols-[84px_minmax(0,1.45fr)_130px_130px_136px_minmax(0,1.45fr)_128px] gap-3 items-center">
                        <span className="font-mono tabular-nums text-[12px] font-bold text-[#8A6510]">
                          {itemCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => openItemDetail(item)}
                          className="text-left"
                        >
                          <p className="font-bold text-[14px] text-[#122A47] hover:text-[#1E4A75]">
                            {itemName}
                          </p>
                          <p className="text-[11.5px] text-[#5C6573] truncate">
                            {translateGroup(item.g, lang)}
                          </p>
                        </button>
                        <div>{renderTableBadge(item.room, roomVal, 'amber')}</div>
                        <div>{renderTableBadge(item.cool, coolVal, 'teal')}</div>
                        <div>
                          {renderTableBadge(item.freeze, freezeVal, 'indigo')}
                        </div>
                        <div className="text-[12px] text-[#334155]">
                          <span className="line-clamp-2">
                            {isEmptyCell(item.note)
                              ? t.emptyNote
                              : translateItemNote(item, lang)}
                          </span>
                          {activeCustomColumns.some((col) =>
                            Boolean(item.customFields?.[col.id]?.trim())
                          ) && (
                            <div className="mt-1 space-y-0.5 text-[11px] text-[#1E4A75]">
                              {activeCustomColumns.map((col) => {
                                const val = item.customFields?.[col.id]?.trim();
                                return val ? (
                                  <div key={col.id} className="truncate">
                                    <strong>{col.label}:</strong> {val}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                        <span className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => openItemDetail(item)}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#122A47] text-white text-[12px] font-bold hover:bg-[#1E4A75]"
                          >
                            {t.detail}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyExcerpt(formatExcerpt(item), itemCode)
                            }
                            aria-label={t.copy}
                            title={t.copy}
                            className="min-h-[36px] min-w-[36px] px-2.5 py-1.5 rounded-lg border border-[#DFD9CB] bg-[#FAF9F6] text-[#1E4A75] hover:bg-[#EFECE4] flex items-center justify-center"
                          >
                            <Copy size={14} />
                          </button>
                        </span>
                      </div>

                      {/* Mobile / Tablet Compact Row */}
                      <div className="lg:hidden">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openItemDetail(item)}
                            className="text-left min-w-0 flex-1"
                          >
                            <div className="flex items-center gap-1.5 text-[11.5px]">
                              <span className="font-mono tabular-nums font-bold text-[#8A6510]">
                                {itemCode}
                              </span>
                              {hasUseToday(item) && (
                                <span className="font-bold text-[#1E4A75]">
                                  · {t.useToday}
                                </span>
                              )}
                              {isNoFreezeCell(item.freeze) && (
                                <span className="font-bold text-[#9A2E2A]">
                                  · {t.noFreezeBadge}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-[14.5px] text-[#122A47] mt-0.5 leading-snug">
                              {itemName}
                            </p>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openItemDetail(item)}
                              className="min-h-[40px] px-3 rounded-lg bg-[#122A47] text-white text-[12px] font-bold"
                            >
                              {t.detail}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyExcerpt(formatExcerpt(item), itemCode)
                              }
                              aria-label={t.copy}
                              className="min-h-[40px] min-w-[40px] rounded-lg border border-[#DFD9CB] bg-[#FAF9F6] text-[#1E4A75] flex items-center justify-center"
                            >
                              <Copy size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2.5 text-[12px]">
                          <div className="rounded-lg border border-[#EAE5DA] overflow-hidden">
                            <StorageCell
                              label={t.colRoom}
                              rawValue={item.room}
                              displayValue={roomVal}
                              tone="amber"
                              icon={<House size={11} />}
                            />
                          </div>
                          <div className="rounded-lg border border-[#EAE5DA] overflow-hidden">
                            <StorageCell
                              label={t.colCool}
                              rawValue={item.cool}
                              displayValue={coolVal}
                              tone="teal"
                              icon={<Thermometer size={11} />}
                            />
                          </div>
                          <div className="rounded-lg border border-[#EAE5DA] overflow-hidden">
                            <StorageCell
                              label={t.colFreeze}
                              rawValue={item.freeze}
                              displayValue={freezeVal}
                              tone="indigo"
                              icon={<Snowflake size={11} />}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: ARTICLE 8 — DO NOT FREEZE ================= */}
        {workspaceTab === 'nofreeze' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#E9B8B4] bg-[#FDF3F2] px-4 py-3.5 flex items-start gap-3">
              <AlertOctagon
                size={18}
                className="text-[#9A2E2A] shrink-0 mt-0.5"
              />
              <div className="text-[13px] font-semibold text-[#5E1B18] leading-relaxed">
                {ex.noFreezeIntro}
              </div>
            </div>

            {filteredNoFreeze.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D6D0C0] bg-white px-6 py-12 text-center">
                <p className="font-bold text-[15px] text-[#122A47]">
                  {t.noResultTitle}
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-4 min-h-[40px] px-4 rounded-xl bg-[#122A47] text-white text-[13px] font-bold"
                >
                  {t.resetFilter}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E2DDD0] bg-white overflow-hidden">
                <div className="hidden md:grid grid-cols-[56px_220px_minmax(0,1fr)_minmax(0,1.1fr)] gap-4 px-5 py-3 text-[11px] font-bold tracking-wider uppercase text-[#5C6573] border-b border-[#EAE5DA] bg-[#FAF9F6]">
                  <span>{ex.noFreezeColIdx}</span>
                  <span>{ex.noFreezeColGroup}</span>
                  <span>{ex.noFreezeColDetail}</span>
                  <span>{ex.noFreezeColReason}</span>
                </div>
                {filteredNoFreeze.map(({ localized, index }) => (
                  <div
                    key={index}
                    className="px-4 sm:px-5 py-3.5 border-b border-[#EAE5DA] last:border-b-0 hover:bg-[#FAF9F6]"
                  >
                    <div className="hidden md:grid grid-cols-[56px_220px_minmax(0,1fr)_minmax(0,1.1fr)] gap-4 items-start text-[13.5px]">
                      <span className="font-mono tabular-nums font-bold text-[#9A2E2A]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-extrabold text-[#122A47]">
                        {localized.group}
                      </span>
                      <span className="text-[#182230] font-medium leading-relaxed">
                        {localized.detail}
                      </span>
                      <span className="text-[#334155] leading-relaxed">
                        {localized.reason}
                      </span>
                    </div>

                    <div className="md:hidden space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-[12px] font-bold text-[#9A2E2A]">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-extrabold text-[15px] text-[#122A47]">
                          {localized.group}
                        </h3>
                      </div>
                      <p className="text-[13px] font-semibold text-[#1E4A75]">
                        {localized.detail}
                      </p>
                      <p className="text-[13px] text-[#334155] leading-relaxed">
                        <strong className="text-[#9A2E2A]">
                          {ex.noFreezeColReason}:{' '}
                        </strong>
                        {localized.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ARTICLES 1–9 & SOPs ================= */}
        {workspaceTab === 'rules' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#D4E2EA] bg-[#F1F7FA] px-4 py-3.5 flex items-start gap-3">
              <BookOpen size={18} className="text-[#1E4A75] shrink-0 mt-0.5" />
              <p className="text-[13px] font-semibold text-[#122A47] leading-relaxed">
                {ex.rulesIntro}
              </p>
            </div>

            {/* Visual Operational Reference Grid */}
            {!query.trim() && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Chiller Order */}
                <div className="rounded-2xl border border-[#E2DDD0] bg-white p-4 sm:p-5 space-y-2.5">
                  <h3 className="text-[14px] font-extrabold text-[#122A47] flex items-center gap-2">
                    <Thermometer size={16} className="text-[#0F5E6E] shrink-0" />
                    <span>{ex.chillerOrderTitle}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {ex.chillerTiers.map((tier, idx) => (
                      <div
                        key={tier}
                        className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold ${
                          idx === 0
                            ? 'bg-[#EEF6F8] text-[#0F5E6E] font-bold'
                            : idx === ex.chillerTiers.length - 1
                              ? 'bg-[#FDF3F2] text-[#9A2E2A] font-bold'
                              : 'bg-[#FAF9F6] text-[#182230]'
                        }`}
                      >
                        {tier}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11.5px] font-bold text-[#5C6573] pt-1">
                    {ex.floorClearance}
                  </p>
                </div>

                {/* 2. Cooling & Reheating + Labeling + Thawing */}
                <div className="space-y-3.5">
                  <div className="rounded-2xl border border-[#E2DDD0] bg-white p-4 space-y-2">
                    <h3 className="text-[14px] font-extrabold text-[#122A47] flex items-center gap-2">
                      <Clock3 size={16} className="text-[#8A6510] shrink-0" />
                      <span>{ex.coolingTitle}</span>
                    </h3>
                    <ul className="space-y-1 text-[12.5px] text-[#334155]">
                      {ex.coolingSteps.map((step) => (
                        <li key={step} className="leading-relaxed">
                          • {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-[#E2DDD0] bg-white p-4 space-y-2">
                    <h3 className="text-[14px] font-extrabold text-[#122A47] flex items-center gap-2">
                      <Snowflake size={16} className="text-[#2B3E6B] shrink-0" />
                      <span>{ex.thawTitle}</span>
                    </h3>
                    <ul className="space-y-1 text-[12.5px] text-[#334155]">
                      {ex.thawRules.map((rule) => (
                        <li key={rule} className="leading-relaxed">
                          • {rule}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-[#E2DDD0] bg-white p-4 space-y-2">
                    <h3 className="text-[14px] font-extrabold text-[#122A47]">
                      {ex.labelingTitle}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12.5px] font-semibold text-[#1E4A75]">
                      {ex.labelingFields.map((fld) => (
                        <div
                          key={fld}
                          className="rounded-lg bg-[#FAF9F6] border border-[#EAE5DA] px-2.5 py-1.5"
                        >
                          {fld}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All 16 Policy Articles */}
            {filteredPolicies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D6D0C0] bg-white px-6 py-12 text-center">
                <p className="font-bold text-[15px] text-[#122A47]">
                  {t.noResultTitle}
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-4 min-h-[40px] px-4 rounded-xl bg-[#122A47] text-white text-[13px] font-bold"
                >
                  {t.resetFilter}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {filteredPolicies.map(({ raw, localized }) => (
                  <article
                    key={raw.id}
                    className="rounded-2xl border border-[#E2DDD0] bg-white p-4 sm:p-5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11.5px] font-extrabold tracking-wide text-[#8A6510]">
                        {localized.article}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#64748B]">
                        {SHE_DOC_METADATA.docCode}
                      </span>
                    </div>
                    <h3 className="text-[15.5px] font-extrabold text-[#122A47] leading-snug">
                      {localized.title}
                    </h3>
                    <p className="text-[13px] text-[#334155] leading-relaxed whitespace-pre-line">
                      {localized.summary}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#C9A227]/70 bg-[#122A47]">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col sm:flex-row items-center justify-between gap-1 px-4 sm:px-6 py-4 pb-16 sm:pb-4 sm:pr-44 text-[12.5px] font-semibold text-[#E2C665]">
          <span>{ex.footerInternal}</span>
          <span className="font-normal">Developed by Le Hoang Phuc</span>
        </div>
      </footer>

      {/* Copy Toast */}
      {copiedLabel && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-[#122A47] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-xl flex items-center gap-2 border border-[#C9A227]/60 whitespace-nowrap max-w-[90vw] truncate"
        >
          <Check size={16} className="text-[#E2C665] shrink-0" />
          <span className="truncate">
            {t.copied} {copiedLabel}
          </span>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={translateItemName(selectedItem, lang)}
        >
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setSelectedItem(null)}
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
          />
          <div className="sheet-up relative w-full max-w-[760px] max-h-[90dvh] flex flex-col bg-white text-[#182230] border border-[#E2DDD0] rounded-t-[24px] sm:rounded-[20px] shadow-2xl overflow-hidden">
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#D6D0C0] sm:hidden shrink-0" />

            <div className="bg-white border-b border-[#EAE5DA] px-5 sm:px-6 py-4 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span className="font-mono tabular-nums font-bold text-[#8A6510]">
                    {getItemCode(selectedItem)}
                  </span>
                  <span className="text-[#C5BEB0]" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-semibold text-[#5C6573]">
                    {translateGroup(selectedItem.g, lang)}
                  </span>
                  {hasUseToday(selectedItem) && (
                    <>
                      <span className="text-[#C5BEB0]" aria-hidden="true">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#1E4A75]">
                        <Clock3 size={12} />
                        {t.useToday}
                      </span>
                    </>
                  )}
                  {isNoFreezeCell(selectedItem.freeze) && (
                    <>
                      <span className="text-[#C5BEB0]" aria-hidden="true">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#9A2E2A]">
                        <AlertOctagon size={12} />
                        {t.noFreezeBadge}
                      </span>
                    </>
                  )}
                </div>

                <h3 className="text-[19px] sm:text-[21px] font-extrabold leading-snug mt-1 text-[#122A47]">
                  {translateItemName(selectedItem, lang)}
                </h3>

                {lang !== 'VI' && (
                  <p className="text-[13px] font-medium text-[#5C6573] mt-0.5">
                    {selectedItem.name}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label={t.close}
                className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-xl bg-[#F6F4EF] text-[#182230] hover:bg-[#EAE5DA] flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="rounded-xl border border-[#EAE5DA] overflow-hidden grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE5DA]">
                <StorageCell
                  label={t.colRoom}
                  rawValue={selectedItem.room}
                  displayValue={translateDuration(selectedItem.room, lang)}
                  tone="amber"
                  icon={<House size={12} />}
                />
                <StorageCell
                  label={t.colCool}
                  rawValue={selectedItem.cool}
                  displayValue={translateDuration(selectedItem.cool, lang)}
                  tone="teal"
                  icon={<Thermometer size={12} />}
                />
                <StorageCell
                  label={t.colFreeze}
                  rawValue={selectedItem.freeze}
                  displayValue={translateDuration(selectedItem.freeze, lang)}
                  tone="indigo"
                  icon={<Snowflake size={12} />}
                />
              </div>

              <div className="rounded-xl border border-[#EAE5DA] bg-[#FAF9F6] p-4">
                <p className="text-[11px] font-bold tracking-wider text-[#5C6573]">
                  {t.originalNote}
                </p>
                <p className="text-[14px] leading-relaxed mt-1.5 text-[#182230]">
                  {isEmptyCell(selectedItem.note)
                    ? t.emptyNote
                    : translateItemNote(selectedItem, lang)}
                </p>
              </div>

              {/* Automatic Article 8 Warning if item overlaps Do-Not-Freeze table */}
              {(isNoFreezeCell(selectedItem.freeze) ||
                selectedItemArt8Warnings.length > 0) && (
                <div className="rounded-xl border border-[#E9B8B4] bg-[#FDF3F2] p-4 space-y-1.5">
                  <p className="text-[11px] font-bold tracking-wider text-[#9A2E2A] flex items-center gap-1.5">
                    <AlertOctagon size={13} />
                    <span>{ex.art8MatchTitle}</span>
                  </p>
                  {selectedItemArt8Warnings.length > 0 ? (
                    selectedItemArt8Warnings.map(({ idx, loc }) => (
                      <p
                        key={idx}
                        className="text-[13px] leading-relaxed text-[#5E1B18]"
                      >
                        <strong>{loc.group}</strong> ({loc.detail}): {loc.reason}
                      </p>
                    ))
                  ) : (
                    <p className="text-[13px] leading-relaxed text-[#5E1B18]">
                      {ex.noFreezeIntro}
                    </p>
                  )}
                </div>
              )}

              {(selectedItem.standardTemp ||
                selectedItem.shelfLifeUnopened ||
                selectedItem.shelfLifeOpened ||
                selectedItem.packagingSpec ||
                activeCustomColumns.some((col) =>
                  Boolean(selectedItem.customFields?.[col.id]?.trim())
                )) && (
                <div className="rounded-xl border border-[#D4E2EA] bg-[#F1F7FA] p-4 space-y-1.5 text-[13px] text-[#182230]">
                  {selectedItem.standardTemp && (
                    <p>
                      <strong className="text-[#122A47]">
                        {ex.stdTempLabel}
                      </strong>{' '}
                      {selectedItem.standardTemp}
                    </p>
                  )}
                  {selectedItem.shelfLifeUnopened && (
                    <p>
                      <strong className="text-[#122A47]">
                        {ex.hsdUnopenedLabel}
                      </strong>{' '}
                      {selectedItem.shelfLifeUnopened}
                    </p>
                  )}
                  {selectedItem.shelfLifeOpened && (
                    <p>
                      <strong className="text-[#122A47]">
                        {ex.hsdOpenedLabel}
                      </strong>{' '}
                      {selectedItem.shelfLifeOpened}
                    </p>
                  )}
                  {selectedItem.packagingSpec && (
                    <p>
                      <strong className="text-[#122A47]">
                        {ex.packSpecLabel}
                      </strong>{' '}
                      {selectedItem.packagingSpec}
                    </p>
                  )}
                  {activeCustomColumns.map((col) => {
                    const val = selectedItem.customFields?.[col.id]?.trim();
                    if (!val) return null;
                    return (
                      <p key={col.id}>
                        <strong className="text-[#122A47]">
                          {col.label}:
                        </strong>{' '}
                        {val}
                      </p>
                    );
                  })}
                </div>
              )}

              {(translateFlag(selectedItem, lang) || selectedItem.haccpNote) && (
                <div className="rounded-xl border border-[#E8D9A8] bg-[#FDF8EB] p-4">
                  <p className="text-[11px] font-bold tracking-wider text-[#8A6510] flex items-center gap-1.5">
                    <TriangleAlert size={13} />
                    <span>{t.qaTitle}</span>
                  </p>
                  <p className="text-[14px] leading-relaxed mt-1.5 text-[#182230]">
                    {selectedItem.haccpNote || translateFlag(selectedItem, lang)}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[#EAE5DA] bg-white p-3.5 space-y-1">
                <p className="text-[11px] font-bold tracking-wider text-[#5C6573]">
                  {t.tableReadingTitle}
                </p>
                <ul className="space-y-1 text-[12px] text-[#475569] leading-relaxed">
                  {ex.tableReadPoints.map((pt) => (
                    <li key={pt}>• {pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              className="border-t border-[#EAE5DA] bg-white px-5 sm:px-6 py-3.5 flex items-center gap-2.5 shrink-0"
              style={{
                paddingBottom: 'calc(0.875rem + var(--safe-area-inset-bottom))',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  copyExcerpt(
                    formatExcerpt(selectedItem),
                    translateItemName(selectedItem, lang)
                  )
                }
                className="flex-1 sm:flex-none min-h-[48px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] text-[#122A47] font-bold text-[13.5px] hover:bg-[#EFECE4] transition-colors"
              >
                <Copy size={16} />
                <span>{t.copy}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex-1 sm:flex-none min-h-[48px] px-6 py-2.5 rounded-xl bg-[#122A47] text-white text-[13.5px] font-bold hover:bg-[#1E4A75] transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Behavior History Panel */}
      <MyHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        items={items}
        lang={lang}
        onApplySearch={(kw) => {
          setWorkspaceTab('table');
          setQuery(kw);
        }}
        onSelectItem={(item) => openItemDetail(item)}
      />

      {/* Global App Lock Overlay (when enabled by Super Admin) */}
      {isAppLocked && !adminOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ex.lockTitle}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0D1E34]/95 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-[460px] rounded-2xl border border-[#C9A227]/65 bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#122A47] text-[#F3DA7B] border border-[#C9A227]/60 shadow-sm">
              <Lock size={26} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[16px] font-extrabold tracking-tight text-[#122A47]">
                {ex.lockTitle}
              </h2>
              <p className="text-[13.5px] text-[#334155] leading-relaxed">
                {systemConfig.appLockMessage?.trim() || ex.lockDefaultMsg}
              </p>
            </div>

            {Boolean(systemConfig.appLockPin?.trim()) && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (pinInput.trim() === systemConfig.appLockPin?.trim()) {
                    setPinError('');
                    setPinInput('');
                    setPinUnlockedAt(Date.now());
                  } else {
                    setPinError(ex.lockPinWrong);
                  }
                }}
                className="space-y-2.5 pt-1 text-left"
              >
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(event) => {
                      setPinInput(event.target.value);
                      if (pinError) setPinError('');
                    }}
                    placeholder={ex.lockPinPlaceholder}
                    className="h-11 flex-1 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] px-3.5 text-[14px] font-semibold text-[#182230] focus:border-[#1E4A75] outline-none"
                  />
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-xl bg-[#122A47] text-white text-[13px] font-bold hover:bg-[#1E4A75] whitespace-nowrap"
                  >
                    {ex.lockPinBtn}
                  </button>
                </div>
                {pinError && (
                  <p className="text-[12px] font-bold text-[#9A2E2A]">
                    {pinError}
                  </p>
                )}
              </form>
            )}

            <div className="pt-2 border-t border-[#EAE5DA]">
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="w-full h-11 rounded-xl border border-[#DFD9CB] bg-[#FAF9F6] text-[#122A47] hover:bg-[#EFECE4] text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck size={16} className="text-[#8A6510]" />
                <span>{ex.lockAdminBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RBAC Admin Management Panel */}
      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        items={items}
        lang={lang}
        realtimeStatus={realtimeStatus}
        onItemsUpdated={(next) => {
          setItems(next);
          if (isOnline && systemConfig.autoSyncCloud !== false) {
            void syncCatalogToCloud(next, systemConfig);
          }
        }}
        config={systemConfig}
        onConfigUpdated={(cfg) => {
          setSystemConfig(cfg);
          if (isOnline && cfg.autoSyncCloud !== false) {
            void syncCatalogToCloud(items, cfg);
          }
          setRealtimeEpoch((prev) => prev + 1);
        }}
      />

      {/* Smart Compliance AI Chatbox */}
      {!isAppLocked && (
        <AIChatbox
          items={items}
          lang={lang}
          isOnline={isOnline}
          onSelectItem={(item) => openItemDetail(item)}
        />
      )}
    </div>
  );
}
