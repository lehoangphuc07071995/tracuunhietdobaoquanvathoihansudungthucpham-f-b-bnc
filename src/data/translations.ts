import type { FoodItem, Lang, UiTranslation } from '../types';
import { getItemCode, isEmptyCell } from './foodData';
import type { SheNoFreezeItem, ShePolicySection } from './sheRegulationData';

export const LANGS: Lang[] = ['VI', 'EN', 'KO', 'HI'];

export const getLangIndex = (lang: Lang): 0 | 1 | 2 =>
  lang === 'EN' ? 0 : lang === 'KO' ? 1 : 2;

export const UI_TRANSLATIONS: Record<Lang, UiTranslation> = {
  VI: {
    title: 'QUY ĐỊNH BẢO QUẢN VÀ HẠN SỬ DỤNG THỰC PHẨM TẠI KHỐI SHE',
    subtitle: 'QUYẾT ĐỊNH 107/2026/QĐ-SHE/SG · MÃ HIỆU SHE-QĐ-FB13 (PB 00)',
    pageTitle: 'Tra Cứu Bảo Quản & Hạn Sử Dụng Thực Phẩm - Khối SHE (SHE-QĐ-FB13)',
    searchPlaceholder: 'Tìm:',
    all: 'Tất cả nhóm (13)',
    appendixLabel: 'Điều 7 · SHE-QĐ-FB13',
    tabTable: 'Bảng bảo quản (Điều 7)',
    tabNoFreeze: 'Không cấp đông (Điều 8)',
    tabRules: 'Quy định & Quy trình (Điều 1–9)',
    filterGroup: 'Nhóm thực phẩm',
    filterStorage: 'Điều kiện bảo quản',
    hasRoom: 'Phòng 15–25°C',
    hasCool: 'Lạnh 0–5°C',
    hasFreeze: 'Đông ≤ −18°C',
    sort: 'Sắp xếp',
    sortId: 'Theo mã SHE',
    sortName: 'Tên A–Z',
    viewGrid: 'Lưới',
    viewList: 'Danh sách',
    colRoom: 'Nhiệt độ phòng (15–25°C)',
    colCool: 'Nhiệt độ lạnh (0–5°C)',
    colFreeze: 'Nhiệt độ đông (≤ −18°C)',
    colWeight: 'Định lượng',
    colCold: 'Kho lạnh (0–5°C)',
    colFrozen: 'Kho đông (≤ −18°C)',
    colDisplayCool: 'Trưng bày lạnh',
    colDisplayHot: 'Trưng bày nóng',
    colEnglish: 'Tên tiếng Anh',
    sourceDoc: 'Quyết định 107/2026/QĐ-SHE/SG (Mã hiệu: SHE-QĐ-FB13 · Phiên bản 00 · Hiệu lực: 12/11/2026)',
    noteLabel: 'Lưu ý bảo quản',
    emptyNote: 'Không có ghi chú thêm',
    emptyCell: '—',
    detail: 'Chi tiết',
    copy: 'Copy trích lục',
    copied: 'Đã copy!',
    noResultTitle: 'Không tìm thấy',
    noResultDesc: 'Hãy thử từ khóa ngắn hơn, tên nhóm thực phẩm hoặc đổi bộ lọc.',
    resetFilter: 'Đặt lại bộ lọc',
    results: 'kết quả',
    principle:
      'Bản trích lục tuân thủ Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13) và FDA Food Code 2022. Sản phẩm đã mở bao bì áp dụng thời hạn ngắn hơn giữa NSX và Điều 7; tài liệu lưu hành nội bộ Khối SHE.',
    detailTitle: 'Chi tiết quy định',
    close: 'Đóng',
    groupLabel: 'Nhóm thực phẩm',
    displayLabel: 'Hiển thị',
    colName: 'Loại cụ thể',
    colAction: 'Hành động',
    codeLabel: 'Mã:',
    useToday: 'THEO GIỜ / TRONG NGÀY',
    originalNote: 'LƯU Ý BẢO QUẢN NGUYÊN VĂN (ĐIỀU 7)',
    emptyCellHint: 'Không áp dụng',
    clearSearch: 'Xóa tìm kiếm',
    focusLabel: 'tìm kiếm',
    clearLabel: 'xóa',
    qaTitle: 'CẢNH BÁO AN TOÀN / QA',
    excerptLabel: 'TRÍCH LỤC SHE-QĐ-FB13',
    noFreezeBadge: 'KHÔNG CẤP ĐÔNG',
    tableReadingTitle: 'Cách đọc bảng (Điều 7)',
  },
  EN: {
    title: 'FOOD STORAGE & SHELF-LIFE REGULATION — SHE DIVISION',
    subtitle: 'DECISION 107/2026/QĐ-SHE/SG · DOC CODE SHE-QĐ-FB13 (VER 00)',
    pageTitle: 'Food Storage & Shelf-Life Lookup - SHE (SHE-QĐ-FB13)',
    searchPlaceholder: 'Search:',
    all: 'All groups (13)',
    appendixLabel: 'Art. 7 · SHE-QĐ-FB13',
    tabTable: 'Storage Table (Art. 7)',
    tabNoFreeze: 'Do Not Freeze (Art. 8)',
    tabRules: 'Rules & SOPs (Art. 1–9)',
    filterGroup: 'Food Group',
    filterStorage: 'Storage Condition',
    hasRoom: 'Room 15–25°C',
    hasCool: 'Chilled 0–5°C',
    hasFreeze: 'Frozen ≤ −18°C',
    sort: 'Sort',
    sortId: 'By SHE code',
    sortName: 'Name A–Z',
    viewGrid: 'Grid',
    viewList: 'Table',
    colRoom: 'Room Temp (15–25°C)',
    colCool: 'Chilled Temp (0–5°C)',
    colFreeze: 'Frozen Temp (≤ −18°C)',
    colWeight: 'Weight',
    colCold: 'Chilled (0–5°C)',
    colFrozen: 'Frozen (≤ −18°C)',
    colDisplayCool: 'Cold Display',
    colDisplayHot: 'Hot Display',
    colEnglish: 'English name',
    sourceDoc: 'Decision 107/2026/QĐ-SHE/SG (Code: SHE-QĐ-FB13 · Version 00 · Effective: 12/11/2026)',
    noteLabel: 'Storage Notes',
    emptyNote: 'No additional notes',
    emptyCell: '—',
    detail: 'Details',
    copy: 'Copy excerpt',
    copied: 'Copied!',
    noResultTitle: 'No results found',
    noResultDesc: 'Try a shorter keyword, group name, or reset the active filters.',
    resetFilter: 'Reset filters',
    results: 'results',
    principle:
      'Excerpt complies strictly with Decision 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13) & FDA Food Code 2022. For opened packages, apply the shorter limit between manufacturer instructions and Article 7. Internal circulation only.',
    detailTitle: 'Regulation Details',
    close: 'Close',
    groupLabel: 'Food Group',
    displayLabel: 'View',
    colName: 'Specific Item',
    colAction: 'Actions',
    codeLabel: 'Code:',
    useToday: 'HOURLY / SAME DAY',
    originalNote: 'OFFICIAL STORAGE NOTE (ARTICLE 7)',
    emptyCellHint: 'Not allowed',
    clearSearch: 'Clear search',
    focusLabel: 'focus',
    clearLabel: 'clear',
    qaTitle: 'QA / SAFETY NOTICE',
    excerptLabel: 'EXCERPT SHE-QĐ-FB13',
    noFreezeBadge: 'DO NOT FREEZE',
    tableReadingTitle: 'How to read this table (Article 7)',
  },
  KO: {
    title: 'SHE 부문 식품 보관 및 소비기한 규정',
    subtitle: '결정 107/2026/QĐ-SHE/SG · 문서코드 SHE-QĐ-FB13 (버전 00)',
    pageTitle: 'SHE 식품 보관 및 소비기한 규정 조회 (SHE-QĐ-FB13)',
    searchPlaceholder: '검색:',
    all: '전체 그룹 (13)',
    appendixLabel: '제7조 · SHE-QĐ-FB13',
    tabTable: '보관 기준표 (제7조)',
    tabNoFreeze: '냉동 금지 (제8조)',
    tabRules: '규정 및 절차 (제1–9조)',
    filterGroup: '식품 그룹',
    filterStorage: '보관 조건',
    hasRoom: '실온 15–25°C',
    hasCool: '냉장 0–5°C',
    hasFreeze: '냉동 ≤ −18°C',
    sort: '정렬',
    sortId: 'SHE 코드순',
    sortName: '이름순',
    viewGrid: '카드형',
    viewList: '표/목록형',
    colRoom: '실온 (15–25°C)',
    colCool: '냉장 (0–5°C)',
    colFreeze: '냉동 (≤ −18°C)',
    colWeight: '중량',
    colCold: '냉장 (0–5°C)',
    colFrozen: '냉동 (≤ −18°C)',
    colDisplayCool: '냉장 진열',
    colDisplayHot: '온장 진열',
    colEnglish: '영문명',
    sourceDoc: '결정 107/2026/QĐ-SHE/SG (문서코드: SHE-QĐ-FB13 · 버전 00 · 시행일: 2026-11-12)',
    noteLabel: '보관 유의사항',
    emptyNote: '추가 비고 없음',
    emptyCell: '—',
    detail: '상세',
    copy: '발췌 복사',
    copied: '복사됨!',
    noResultTitle: '검색 결과 없음',
    noResultDesc: '더 짧은 검색어, 식품 그룹명 또는 필터 초기화를 시도하세요.',
    resetFilter: '필터 초기화',
    results: '건',
    principle:
      '본 발췌문은 결정 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13) 및 FDA Food Code 2022를 준수합니다. 개봉 제품은 제조사 기준과 제7조 중 더 짧은 기한을 적용합니다. 사내 전용 자료입니다.',
    detailTitle: '규정 상세',
    close: '닫기',
    groupLabel: '식품 그룹',
    displayLabel: '보기',
    colName: '세부 품목',
    colAction: '작업',
    codeLabel: '코드:',
    useToday: '시간 단위 / 당일 사용',
    originalNote: '원문 보관 유의사항 (제7조)',
    emptyCellHint: '보관 불가',
    clearSearch: '검색 지우기',
    focusLabel: '검색창',
    clearLabel: '지우기',
    qaTitle: 'QA / 안전 유의',
    excerptLabel: '발췌 SHE-QĐ-FB13',
    noFreezeBadge: '냉동 금지',
    tableReadingTitle: '표 읽는 방법 (제7조)',
  },
  HI: {
    title: 'SHE प्रभाग खाद्य भंडारण एवं शेल्फ-लाइफ़ नियम',
    subtitle: 'निर्णय 107/2026/QĐ-SHE/SG · दस्तावेज़ SHE-QĐ-FB13 (संस्करण 00)',
    pageTitle: 'SHE खाद्य भंडारण एवं शेल्फ-लाइफ़ प्रणाली (SHE-QĐ-FB13)',
    searchPlaceholder: 'खोजें:',
    all: 'सभी समूह (13)',
    appendixLabel: 'अनुच्छेद 7 · SHE-QĐ-FB13',
    tabTable: 'भंडारण तालिका (अनुच्छेद 7)',
    tabNoFreeze: 'फ़्रीज़ न करें (अनुच्छेद 8)',
    tabRules: 'नियम एवं प्रक्रिया (अनुच्छेद 1–9)',
    filterGroup: 'खाद्य समूह',
    filterStorage: 'भंडारण स्थिति',
    hasRoom: 'कमरा 15–25°C',
    hasCool: 'ठंडा 0–5°C',
    hasFreeze: 'फ़्रीज़ ≤ −18°C',
    sort: 'क्रम',
    sortId: 'SHE कोड से',
    sortName: 'नाम A–Z',
    viewGrid: 'ग्रिड',
    viewList: 'तालिका',
    colRoom: 'कमरे का तापमान (15–25°C)',
    colCool: 'ठंडा तापमान (0–5°C)',
    colFreeze: 'फ़्रीज़ तापमान (≤ −18°C)',
    colWeight: 'वज़न',
    colCold: 'शीत (0–5°C)',
    colFrozen: 'फ़्रोज़न (≤ −18°C)',
    colDisplayCool: 'कोल्ड डिस्प्ले',
    colDisplayHot: 'हॉट डिस्प्ले',
    colEnglish: 'अंग्रेज़ी नाम',
    sourceDoc: 'निर्णय 107/2026/QĐ-SHE/SG (कोड: SHE-QĐ-FB13 · संस्करण 00 · प्रभावी: 12/11/2026)',
    noteLabel: 'भंडारण निर्देश',
    emptyNote: 'कोई अतिरिक्त टिप्पणी नहीं',
    emptyCell: '—',
    detail: 'विवरण',
    copy: 'अंश कॉपी करें',
    copied: 'कॉपी हो गया!',
    noResultTitle: 'कोई परिणाम नहीं मिला',
    noResultDesc: 'छोटा शब्द आज़माएँ या सक्रिय फ़िल्टर रीसेट करें।',
    resetFilter: 'फ़िल्टर रीसेट करें',
    results: 'परिणाम',
    principle:
      'यह अंश निर्णय 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13) और FDA Food Code 2022 का पालन करता है। खुले पैकेट पर निर्माता और अनुच्छेद 7 में से कम अवधि लागू करें। केवल आंतरिक उपयोग हेतु।',
    detailTitle: 'नियम विवरण',
    close: 'बंद करें',
    groupLabel: 'खाद्य समूह',
    displayLabel: 'दृश्य',
    colName: 'विशिष्ट आइटम',
    colAction: 'कार्रवाई',
    codeLabel: 'कोड:',
    useToday: 'घंटे / उसी दिन उपयोग',
    originalNote: 'आधिकारिक भंडारण नोट (अनुच्छेद 7)',
    emptyCellHint: 'अनुमत नहीं',
    clearSearch: 'खोज साफ़ करें',
    focusLabel: 'खोज',
    clearLabel: 'साफ़',
    qaTitle: 'QA / सुरक्षा चेतावनी',
    excerptLabel: 'अंश SHE-QĐ-FB13',
    noFreezeBadge: 'फ़्रीज़ निषेध',
    tableReadingTitle: 'तालिका पढ़ने के नियम (अनुच्छेद 7)',
  },
};

export const GROUP_TRANSLATIONS: Record<string, [string, string, string]> = {
  'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)': [
    'Red Meat (Beef / Veal / Lamb / Pork)',
    '적색육 (소고기 / 송아지 / 양고기 / 돼지고기)',
    'लाल मांस (बीफ़ / वील / मेमना / पोर्क)',
  ],
  'Gia cầm': [
    'Poultry',
    '가금류 (닭 / 오리)',
    'पोल्ट्री (मुर्गी / बत्तख)',
  ],
  'Hải sản': [
    'Seafood',
    '해산물',
    'समुद्री भोजन (सीफ़ूड)',
  ],
  'Thịt chế biến sẵn (đã mở bao bì)': [
    'Processed / Ready-to-Eat Meats (Opened)',
    '가공육 (개봉 후)',
    'प्रसंस्कृत मांस (पैकेट खुलने के बाद)',
  ],
  'Sữa và sản phẩm từ sữa (đã mở bao bì)': [
    'Milk & Dairy Products (Opened)',
    '우유 및 유제품 (개봉 후)',
    'दूध एवं डेयरी उत्पाद (खुलने के बाद)',
  ],
  'Trứng': [
    'Eggs',
    '달걀류',
    'अंडे',
  ],
  'Rau củ quả tươi (chưa cắt, chưa bóc vỏ)': [
    'Fresh Produce (Uncut, Unpeeled)',
    '신선 채소 및 과일 (미절단 / 미박피)',
    'ताज़ी सब्ज़ियाँ और फल (बिना कटे/छीले)',
  ],
  'Rau củ quả đã sơ chế, đã cắt': [
    'Pre-processed & Cut Produce',
    '전처리 및 절단 채소·과일',
    'पूर्व-संसाधित व कटी सब्ज़ियाँ/फल',
  ],
  'Các loại sốt (đã mở bao bì hoặc đã chiết rót)': [
    'Sauces & Condiments (Opened / Decanted)',
    '소스류 (개봉 또는 소분 후)',
    'सॉस एवं मसाला द्रव (खुले / निकाले गए)',
  ],
  'Đồ uống (đã mở bao bì hoặc đã pha chế)': [
    'Beverages (Opened / Prepared)',
    '음료류 (개봉 또는 제조 후)',
    'पेय पदार्थ (खुले / तैयार किए गए)',
  ],
  'Thực phẩm làm bánh/ bột/ tinh bột': [
    'Bakery, Batter, Dough & Starches',
    '제과·제빵 / 반죽 / 전분류',
    'बेकरी, आटा, घोल व स्टार्च खाद्य पदार्थ',
  ],
  'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)': [
    'Dry Ingredients, Powders & Spices (Opened)',
    '건조 원재료·분말·건조 향신료 (개봉 후)',
    'सूखी सामग्री, पाउडर व सूखे मसाले (खुले)',
  ],
  'Thực phẩm đóng hộp, đóng lon (đã mở)': [
    'Canned / Tinned Foods (Opened)',
    '통조림 식품 (개봉 후)',
    'डिब्बाबंद / कैन खाद्य पदार्थ (खुले)',
  ],
};

export const ITEM_TRANSLATIONS: Record<string, [string, string, string]> = {
  'SHE-01': [
    'Whole cuts (raw / uncooked)',
    '원육 덩어리 (비가열 생육)',
    'पूरे टुकड़े (कच्चा / बिना पका)',
  ],
  'SHE-02': [
    'Ground / minced meat (raw)',
    '다진 고기 (비가열 생육)',
    'कीमा / पिसा मांस (कच्चा)',
  ],
  'SHE-03': [
    'Meat / bone broth stock (cooked)',
    '고기·뼈 육수 (조리됨)',
    'हड्डी / मांस का सूप स्टॉक (पका हुआ)',
  ],
  'SHE-04': [
    'Cooked minced or whole cuts (leftovers)',
    '조리된 다진·덩어리 육류 (남은 음식)',
    'पका हुआ कीमा या टुकड़े (बचा भोजन)',
  ],
  'SHE-05': [
    'Stuffed meats (chicken roll, stuffed tofu…) cooked',
    '속 채운 육류 (닭말이, 고기 채운 두부 등) 조리됨',
    'भरवां मांस (चिकन रोल, भरवां टोफू आदि) पका हुआ',
  ],
  'SHE-06': [
    'Chicken / duck (cooked)',
    '가열 조리된 닭·오리',
    'पकी हुई मुर्गी / बत्तख',
  ],
  'SHE-07': [
    'Whole chicken / duck (raw)',
    '통닭·통오리 (비가열)',
    'साबुत मुर्गी / बत्तख (कच्ची)',
  ],
  'SHE-08': [
    'Cut chicken / duck portions (raw)',
    '절단 닭·오리 (비가열)',
    'कटी हुई मुर्गी / बत्तख के हिस्से (कच्चे)',
  ],
  'SHE-09': [
    'Ground poultry (raw)',
    '다진 가금류 (비가열)',
    'पिसा हुआ पोल्ट्री मांस (कच्चा)',
  ],
  'SHE-10': [
    'Poultry offal: liver, gizzard, heart (raw)',
    '가금류 내장·모래집·심장 (비가열)',
    'पोल्ट्री अंतड़ियाँ: जिगर, पोटा, हृदय (कच्चा)',
  ],
  'SHE-11': [
    'Fish (all types)',
    '생선류 (전종)',
    'मछली (सभी प्रकार)',
  ],
  'SHE-12': [
    'Crustaceans (shrimp, crab, blue crab…)',
    '갑각류 (새우, 게, 꽃게 등)',
    'क्रस्टेशियन (झींगा, केकड़ा आदि)',
  ],
  'SHE-13': [
    'Mollusks / shellfish (squid, octopus, clams, scallops…)',
    '연체·패류 (오징어, 문어, 조개 등)',
    'मोलस्क / शेलफ़िश (स्क्विड, ऑक्टोपस, सीप आदि)',
  ],
  'SHE-14': [
    'Seafood (cooked)',
    '가열 조리된 해산물',
    'समुद्री भोजन (पका हुआ)',
  ],
  'SHE-15': [
    'Smoked meat / smoked fish (opened)',
    '훈제 육류·어류 (개봉 후)',
    'स्मोक्ड मीट / स्मोक्ड मछली (खुला)',
  ],
  'SHE-16': [
    'Sausages (opened)',
    '소시지 (개봉 후)',
    'सॉसेज (खुला)',
  ],
  'SHE-17': [
    'Vietnamese ham, chả, jambon, sliced bacon',
    '지오·짜·잠봉·슬라이스 베이컨',
    'वियतनामी हैम, जैम्बॉन, कटा बेकन',
  ],
  'SHE-18': [
    'Sausage & cold cuts cooked in kitchen (boiled, grilled, fried…)',
    '주방에서 가열 조리한 소시지·콜드컷 (삶기·굽기·튀기기)',
    'रसोई में पकाए गए सॉसेज व कोल्ड कट्स',
  ],
  'SHE-19': [
    'Hard cheese (cheddar, mozzarella…)',
    '경질 치즈 (체다, 모짜렐라 등)',
    'कठोर चीज़ (चेडर, मोज़ेरेला आदि)',
  ],
  'SHE-20': [
    'Soft / fresh cheese (ricotta, cream cheese…)',
    '연질·생치즈 (리코타, 크림치즈 등)',
    'मुलायम / ताज़ा चीज़ (रिकोटा, क्रीम चीज़ आदि)',
  ],
  'SHE-21': [
    'Fresh milk, cream milk, whipping cream',
    '생우유, 지방우유, 생크림',
    'ताज़ा दूध, फ़ैट मिल्क, फ्रेश क्रीम',
  ],
  'SHE-22': [
    'Butter',
    '버터',
    'मक्खन (बटर)',
  ],
  'SHE-23': [
    'Sweetened condensed milk',
    '가당 연유',
    'मीठा गाढ़ा दूध (कंडेंस्ड मिल्क)',
  ],
  'SHE-24': [
    'Raw eggs (in intact shell)',
    '비가열 달걀 (껍질째)',
    'कच्चे अंडे (साबुत छिलके सहित)',
  ],
  'SHE-25': [
    'Cooked eggs (boiled, fried, steamed…)',
    '조리된 달걀 (삶은 계란, 프라이, 찜 등)',
    'पके अंडे (उबले, तले, भाप में पके)',
  ],
  'SHE-26': [
    'Leafy greens (cabbage, lettuce…) – washed & vacuum-packed',
    '엽채류 (배추, 상추 등) – 세척·진공포장',
    'पत्तेदार सब्ज़ियाँ (पत्तागोभी, लेट्यूस) – साफ़ व वैक्यूम पैक',
  ],
  'SHE-27': [
    'Citrus fruits (orange, mandarin, pomelo…)',
    '감귤류 (오렌지, 귤, 자몽 등)',
    'खट्टे फल (संतरा, किन्नू, चकोतरा आदि)',
  ],
  'SHE-28': [
    'Other whole fresh fruits',
    '기타 생과일류',
    'अन्य ताज़े फल',
  ],
  'SHE-29': [
    'Hard vegetables (carrot, cauliflower, green beans…)',
    '경질 채소 (당근, 콜리플라워, 그린빈 등)',
    'कठोर सब्ज़ियाँ (गाजर, फूलगोभी, बीन्स आदि)',
  ],
  'SHE-30': [
    'Unpeeled roots, onions & garlic (potato, sweet potato, onion, garlic…)',
    '미박피 구근·양파·마늘 (감자, 고구마, 양파, 마늘 등)',
    'बिना छिली जड़ें, प्याज़ व लहसुन (आलू, शकरकंद, प्याज़ आदि)',
  ],
  'SHE-31': [
    'Roughly prepped vegetables (peeled & washed, uncut)',
    '1차 손질 채소 (박피·세척 완료, 미절단)',
    'मोटे तौर पर तैयार सब्ज़ियाँ (छिली व धुली, बिना कटी)',
  ],
  'SHE-32': [
    'Cut vegetables & fruits, ready to serve',
    '절단 채소 및 과일 (즉시 사용)',
    'कटी हुई सब्ज़ियाँ और फल (तुरंत उपयोग)',
  ],
  'SHE-33': [
    'Soy sauce or fish sauce',
    '간장 또는 피시소스(느억맘)',
    'सोया सॉस या फ़िश सॉस',
  ],
  'SHE-34': [
    'Chili sauce',
    '칠리소스',
    'चिली सॉस',
  ],
  'SHE-35': [
    'Tomato ketchup / sauce',
    '토마토 케첩 / 소스',
    'टमाटर केचप / सॉस',
  ],
  'SHE-36': [
    'Mustard',
    '머스타드',
    'मस्टर्ड सॉस',
  ],
  'SHE-37': [
    'House-made sauces containing eggs or dairy',
    '계란·유제품 기반 수제 소스',
    'अंडे या दूध से बने घर के सॉस',
  ],
  'SHE-38': [
    'Cooked house-made sauces / dips (no egg, no dairy)',
    '가열 조리 수제 소스·디핑소스 (계란·유제품 미함유)',
    'घर पर पकाए गए सॉस / डिप (बिना अंडे व दूध के)',
  ],
  'SHE-39': [
    'Fruit puree / concentrated fruit base',
    '과일 농축액 / 퓨레',
    'फलों का पल्प / कॉन्संट्रेट बेस',
  ],
  'SHE-40': [
    'Concentrated syrups (all types)',
    '농축 시럽류 (전종)',
    'गाढ़ा सिरप (सभी प्रकार)',
  ],
  'SHE-41': [
    'Concentrated sugar syrups (all types)',
    '농축 설탕 시럽류 (전종)',
    'गाढ़ा शुगर सिरप (सभी प्रकार)',
  ],
  'SHE-42': [
    'Freshly pressed house-made juice',
    '수제 생과일 주스',
    'ताज़ा घर का बना जूस',
  ],
  'SHE-43': [
    'Packaged / bottled fruit juices (opened)',
    '팩·병입 과일주스 (개봉 후)',
    'डिब्बा/बोतल बंद फलों का जूस (खुला)',
  ],
  'SHE-44': [
    'Packaged nut / plant-based milks (opened)',
    '팩입 견과류·식물성 우유 (개봉 후)',
    'पैकेट बंद नट / प्लांट मिल्क (खुला)',
  ],
  'SHE-45': [
    'Carbonated soft drinks, sparkling water, beer (opened bottle/can)',
    '탄산음료, 탄산수, 맥주 (개봉 병·캔)',
    'कार्बोनेटेड सॉफ्ट ड्रिंक, सोडा, बीयर (खुली बोतल/कैन)',
  ],
  'SHE-46': [
    'Brewed or cold-brew tea & coffee (no milk)',
    '사전 추출·콜드브루 차·커피 (우유 미첨가)',
    'पहले से बनी या कोल्ड-ब्रू चाय व कॉफ़ी (बिना दूध)',
  ],
  'SHE-47': [
    'Prepared flour mix / batter',
    '프리믹스 반죽용 밀가루',
    'तैयार आटा मिश्रण / बैटर',
  ],
  'SHE-48': [
    'Steamed buns (Bánh bao)',
    '찐빵 (반바오)',
    'स्टीम्ड बन (बान्ह बाओ)',
  ],
  'SHE-49': [
    'Baked bread / pastries (no cream, milk or egg filling)',
    '구운 빵류 (크림·우유·계란 소 없음)',
    'पकी हुई ब्रेड / बेकरी (बिना क्रीम/दूध/अंडे की भरावन)',
  ],
  'SHE-50': [
    'Cream cakes & pastries with cream / milk / egg / cheese filling',
    '크림·우유·계란·치즈 함유 케이크 및 페이스트리',
    'क्रीम, दूध, अंडा या चीज़ वाली केक / पेस्ट्री',
  ],
  'SHE-51': [
    'Unbaked frozen dough',
    '미소성 냉동 생지',
    'कच्चा फ्रोज़न आटा (अनबेक्ड डो)',
  ],
  'SHE-52': [
    'Cooked starches & legumes (noodles, vermicelli, beans…)',
    '조리된 전분·두류 (국수, 분, 당면, 콩 등)',
    'पका हुआ स्टार्च व दालें (नूडल्स, सेवई, बीन्स आदि)',
  ],
  'SHE-53': [
    'Cooked rice, sticky rice, tubers',
    '조리된 밥, 찹쌀밥, 감자·고구마류',
    'पका हुआ चावल, स्टिकी राइस व कंद',
  ],
  'SHE-54': [
    'Popped popcorn (roasted)',
    '튀긴 팝콘',
    'भुना हुआ पॉपकॉर्न',
  ],
  'SHE-55': [
    'Tea powder and dried tea leaves',
    '차 분말 및 건차 잎',
    'चाय पाउडर और सूखी चाय की पत्तियाँ',
  ],
  'SHE-56': [
    'Tea bags (opened pack)',
    '티백 (개봉 후)',
    'टी बैग्स (खुला पैकेट)',
  ],
  'SHE-57': [
    'Cocoa powder (opened pack)',
    '코코아 파우더 (개봉 후)',
    'कोको पाउडर (खुला पैकेट)',
  ],
  'SHE-58': [
    'Ground / roasted coffee powder (opened pack)',
    '커피 분말 (개봉 후)',
    'कॉफ़ी पाउडर (खुला पैकेट)',
  ],
  'SHE-59': [
    'Beverage powders (matcha, milk powder, non-dairy creamer…)',
    '음료 제조용 분말 (말차, 분유, 프림 등)',
    'पेय पाउडर (माचा, मिल्क पाउडर, क्रीमर आदि)',
  ],
  'SHE-60': [
    'Dried corn kernels (unpopped)',
    '건조 옥수수 알갱이 (미조리)',
    'सूखे मकई के दाने (बिना भुने)',
  ],
  'SHE-61': [
    'Dried spices & dried herbs (dried coriander…)',
    '건조 향신료 및 건조 허브 (건고수 등)',
    'सूखे मसाले एवं सूखी जड़ी-बूटियाँ',
  ],
  'SHE-62': [
    'Dry wheat flour, rice flour, starches, dry premixes',
    '건조 밀가루, 쌀가루, 전분, 건조 프리믹스',
    'सूखा गेहूँ/चावल का आटा, स्टार्च व ड्राई प्रीमिक्स',
  ],
  'SHE-63': [
    'Dry cereals, oats, granola',
    '건조 시리얼, 오트밀, 그래놀라',
    'सूखे अनाज, ओट्स, ग्रेनोला',
  ],
  'SHE-64': [
    'Rice, dried noodles / vermicelli',
    '쌀, 건면·건분·건당면',
    'चावल, सूखे नूडल्स / वर्मीसेली',
  ],
  'SHE-65': [
    'Nuts (almonds, walnuts, cashews…)',
    '견과류 (아몬드, 호두, 캐슈넛 등)',
    'सूखे मेवे / नट्स (बादाम, अखरोट, काजू आदि)',
  ],
  'SHE-66': [
    'Canned / tinned foods (meat, fish, beans, fruit, coconut milk…)',
    '통조림 식품 (육류, 생선, 콩, 과일, 코코넛 밀크 등)',
    'डिब्बाबंद खाद्य पदार्थ (मांस, मछली, फल, नारियल दूध आदि)',
  ],
};

// Mapping exact verbatim Vietnamese notes (grouped per PDF pages 10–13) -> EN / KO / HI
const NOTE_TRANSLATION_MAP: Record<string, [string, string, string]> = {
  'Để ở ngăn dưới cùng của tủ mát, có khay hứng nước, tách biệt với thực phẩm ăn liền. Cấp đông: chia khẩu phần nhỏ, bọc kín bằng màng bọc thực phẩm và/hoặc hút chân không, cho vào hộp kín hoặc túi zip chịu lạnh để tránh cháy lạnh (mất nước, đổi màu, đổi mùi vị); ghi nhãn ngày cấp đông.': [
    'Store on the bottom shelf of the chiller with a drip tray, separated from ready-to-eat food. Freezing: portion into small batches, wrap tightly with cling film and/or vacuum-seal in airtight freezer containers/zip bags to prevent freezer burn; label with freezing date.',
    '냉장고 최하단 선반에 물받이 트레이와 함께 보관하고 즉석섭취식품과 분리하세요. 냉동 시 소분 후 랩 밀봉/진공 포장하여 밀폐 용기나 냉동용 지퍼백에 넣고 냉동일을 라벨링하세요.',
    'चिलर की सबसे निचली शेल्फ पर ड्रिप ट्रे के साथ, रेडी-टू-ईट खाद्य पदार्थों से अलग रखें। फ़्रीज़िंग: छोटे हिस्सों में बाँटकर कसकर लपेटें या वैक्यूम पैक करें, फ़्रीज़र-सेफ़ डिब्बे/ज़िप बैग में रखें और फ़्रीज़िंग की तारीख़ का लेबल लगाएँ।',
  ],
  'Gia cầm sống dễ gây nhiễm chéo: để ở ngăn dưới cùng của tủ mát, đựng trong hộp kín có nắp; không rửa gia cầm sống trước khi lưu kho. Cấp đông thực hiện như thịt đỏ.': [
    'Raw poultry poses high cross-contamination risk: store on the bottom chiller shelf in sealed lidded containers; do NOT wash raw poultry before storage. Freeze using the same method as red meat.',
    '생가금류는 교차오염 위험이 높으므로 뚜껑 있는 밀폐 용기에 담아 냉장고 최하단에 보관하며, 입고 전 물로 씻지 마세요. 냉동은 적색육 기준을 따릅니다.',
    'कच्ची पोल्ट्री से क्रॉस-संदूषण का खतरा अधिक होता है: ढक्कन वाले एयरटाइट डिब्बे में चिलर की सबसे निचली शेल्फ पर रखें; भंडारण से पहले कच्ची पोल्ट्री न धोएँ। फ़्रीज़िंग लाल मांस के समान करें।',
  ],
  'Để ráo nước, đựng hộp kín hoặc xếp trên đá vụn có khay thoát nước; tách riêng với thực phẩm ăn liền. Cấp đông: bọc kín hoặc hút chân không, ghi nhãn ngày cấp đông.': [
    'Drain excess water, place in sealed containers or on crushed ice with a drainage tray; keep separate from ready-to-eat food. Freezing: wrap tightly or vacuum-seal and label with freezing date.',
    '물기를 빼고 밀폐 용기 또는 배수 트레이가 있는 간얼음 위에 보관하며 즉석섭취식품과 분리하세요. 냉동 시 밀봉 또는 진공 포장 후 냉동일을 표시하세요.',
    'पानी अच्छी तरह निथारकर एयरटाइट डिब्बे में या ड्रेन ट्रे वाली कुचली बर्फ पर रखें; रेडी-टू-ईट भोजन से अलग रखें। फ़्रीज़िंग: कसकर लपेटें या वैक्यूम पैक करें और तारीख़ लिखें।',
  ],
  'Bọc kín hoặc đựng hộp kín, ghi nhãn ngày mở bao. Sản phẩm còn nguyên bao bì áp dụng HSD của NSX.': [
    'Wrap tightly or store in sealed containers and label with opened date. Unopened packages follow the manufacturer’s expiry date.',
    '밀봉 또는 밀폐 용기에 보관하고 개봉일을 라벨링하세요. 미개봉 제품은 제조사 소비기한을 적용합니다.',
    'कसकर लपेटें या एयरटाइट डिब्बे में रखें और खोलने की तारीख़ लिखें। बिना खुले पैकेट पर निर्माता की समाप्ति तिथि लागू होती है।',
  ],
  'Đậy kín, ghi nhãn ngày mở bao; không rót ngược phần thừa vào hộp/chai gốc; không để ở cửa tủ mát. Sản phẩm còn nguyên bao bì áp dụng HSD của NSX.': [
    'Keep tightly sealed and label opened date; do NOT pour leftovers back into original carton/bottle; do not store on chiller door shelves. Unopened packages follow manufacturer HSD.',
    '밀폐하여 개봉일을 표시하고 남은 양을 원래 용기에 다시 붓지 마세요. 냉장고 문 쪽 선반 보관 금지. 미개봉 제품은 제조사 기한을 따릅니다.',
    'कसकर बंद रखें और खोलने की तारीख़ लिखें; बचा हुआ हिस्सा वापस मूल बोतल/डिब्बे में न डालें; फ्रिज के दरवाज़े पर न रखें। बिना खुले पैकेट पर निर्माता का नियम लागू है।',
  ],
  'Không rửa trứng trước khi lưu kho. Loại bỏ trứng nứt, vỡ vỏ; không để trứng lẫn hoặc đặt phía trên thực phẩm ăn liền.': [
    'Do NOT wash eggs before storage. Discard cracked or broken eggs; do not store eggs mixed with or above ready-to-eat foods.',
    '보관 전 달걀을 씻지 마세요. 깨지거나 금 간 달걀은 폐기하고, 즉석섭취식품과 섞거나 위쪽 선반에 두지 마세요.',
    'भंडारण से पहले अंडे न धोएँ। टूटे या फटे अंडे हटा दें; अंडों को रेडी-टू-ईट भोजन के साथ या ऊपर न रखें।',
  ],
  'Thời hạn tính từ ngày nhận hàng và không vượt quá hạn sử dụng/khuyến cáo của nhà cung cấp. Rau lá nguyên bó, chưa sơ chế sạch và chưa hút chân không: tối đa 3 ngày. Quả mềm, dễ dập (dâu, nho, quả mọng…): tối đa 3 ngày. Tách rau củ quả ăn tươi khỏi thực phẩm sống; loại bỏ ngay phần dập, úng, héo, chảy nhớt.': [
    'Counted from receiving date and must not exceed supplier expiry. Unwashed/non-vacuum leafy bunches: max 3 days. Soft berries/grapes: max 3 days. Keep fresh produce apart from raw meat/seafood; discard bruised, slimy, or wilted parts immediately.',
    '입고일부터 기산하며 공급사 권장 기한을 초과할 수 없습니다. 미세척·비진공 엽채류 묶음 최대 3일, 무르기 쉬운 과일(딸기·포도 등) 최대 3일. 생육류와 분리 보관하고 무른 부분은 즉시 폐기하세요.',
    'प्राप्ति तिथि से गणना की जाएगी और आपूर्तिकर्ता की अवधि से अधिक नहीं होनी चाहिए। बिना धुली पत्तेदार सब्ज़ियाँ अधिकतम 3 दिन; नरम फल (स्ट्रॉबेरी, अंगूर आदि) अधिकतम 3 दिन। कच्चे मांस से अलग रखें और सड़े-गले हिस्से तुरंत हटाएँ।',
  ],
  'Gọt, rửa bằng nước sạch, để ráo, đựng hộp kín hoặc túi hút chân không; tính hạn từ ngày giờ sơ chế xong.': [
    'Peel, wash with clean water, drain well, and store in sealed containers or vacuum bags; shelf life starts from completion time of prep.',
    '껍질 제거 후 깨끗한 물로 세척·물기 제거하여 밀폐 용기나 진공백에 담고 전처리 완료 일시부터 기산하세요.',
    'छीलकर साफ पानी से धोएँ, पानी सुखाकर एयरटाइट डिब्बे या वैक्यूम बैग में रखें; समय की गणना तैयारी पूरी होने से करें।',
  ],
  'Chai, lọ chiết rót ra khu phục vụ phải sạch, đậy nắp, ghi nhãn ngày chiết; không đổ sốt thừa ở bàn/quầy phục vụ ngược vào chai gốc. Sốt có yêu cầu bảo quản lạnh sau khi mở theo nhãn NSX phải để ở nhiệt độ lạnh.': [
    'Service decanting bottles must be clean, capped, and labeled with decanting date; never pour leftover table sauces back into original bottles. Sauces requiring refrigeration after opening per manufacturer label must be kept chilled.',
    '서빙용 소분 병은 청결·밀폐·소분일 라벨링 필수이며, 테이블 남은 소스를 원병에 되붓지 마세요. 개봉 후 냉장 요건 소스는 반드시 냉장 보관하세요.',
    'परोसने वाली बोतलें साफ, ढक्कन बंद व तारीख़ लेबल सहित होनी चाहिए; बचा सॉस वापस मूल बोतल में न डालें। यदि निर्माता के लेबल पर खुलने के बाद फ्रिज में रखना अनिवार्य हो तो ठंडे तापमान में ही रखें।',
  ],
  'Chai, hộp, lon đã mở: đậy kín, ghi nhãn ngày, giờ mở; không rót ngược phần thừa vào bao bì gốc. Nước đường tự nấu phải đựng chai/hũ đã tiệt trùng, đậy kín. Đồ uống pha chế tại quầy không có nhãn hoặc quá hạn phải loại bỏ.': [
    'Opened bottles/cartons/cans: seal tightly, label opened date & time; do not pour leftovers back. House-made sugar syrup must be kept in sterilized sealed jars. Unlabeled or expired counter drinks must be discarded.',
    '개봉한 병·팩·캔은 밀폐하고 개봉 일시를 표시하며 잔량을 원용기에 붓지 마세요. 수제 설탕 시럽은 살균된 밀폐 용기에 보관하세요. 라벨 누락·기한 경과 음료는 폐기합니다.',
    'खुली बोतल/डिब्बे कसकर बंद करें और खोलने की तारीख़ व समय लिखें; बचा पेय वापस न डालें। घर का बना शुगर सिरप विसंक्रमित सीलबंद जार में रखें। बिना लेबल या एक्सपायर्ड पेय तुरंत फेंक दें।',
  ],
  'Thực phẩm đã chín phải làm nguội đúng quy trình (Mục 6.6) rồi mới đưa vào tủ; đậy kín. Hâm nóng lại đạt tối thiểu 75°C tại tâm sản phẩm, chỉ hâm một lần.': [
    'Cooked items must follow Section 6.6 cooling procedure before refrigerated/frozen storage and be covered tightly. Reheat to ≥ 75°C core temperature; reheat ONCE only.',
    '가열 조리 식품은 제6.6조 냉각 절차를 거친 후 밀폐 보관하세요. 재가열 시 중심 온도 최소 75°C에 도달해야 하며 1회만 재가열합니다.',
    'पके हुए खाद्य पदार्थों को भंडारण से पहले अनुभाग 6.6 के अनुसार ठंडा करें और कसकर ढकें। दोबारा गरम करते समय केंद्र का तापमान कम से कम 75°C होना चाहिए; केवल एक बार गरम करें।',
  ],
  'Sau khi mở: chuyển sang hộp/túi kín, ghi nhãn ngày mở; để nơi khô ráo, thoáng mát, tránh ánh nắng. Không bảo quản tủ mát, tủ đông (nguy cơ ẩm, ngưng tụ nước, mốc), trừ các loại hạt. Bỏ ngay khi có dấu hiệu ẩm, mốc, mùi lạ hoặc côn trùng.': [
    'After opening: transfer to airtight container/bag, label opened date, store in a cool, dry area away from sunlight. Do NOT refrigerate or freeze (condensation/mold risk), except nuts. Discard immediately if damp, moldy, off-odor, or pest-infested.',
    '개봉 후 밀폐 용기/지퍼백에 옮겨 개봉일을 표시하고 서늘·건조·직사광선 피한 곳에 보관하세요. 견과류 외 냉장·냉동 보관 금지(습기·결로·곰팡이 위험). 변질 징후 시 즉시 폐기.',
    'खुलने के बाद एयरटाइट डिब्बे/बैग में रखें, तारीख़ लिखें और ठंडी, सूखी, धूप से दूर जगह पर रखें। मेवों को छोड़कर फ्रिज/फ़्रीज़र में न रखें (नमी व फफूंद का खतरा)। नमी, फफूंद या कीड़े दिखने पर तुरंत फेंक दें।',
  ],
  'Chuyển sang hộp kín có nắp, ghi nhãn ngày mở; không để nguyên trong lon.': [
    'Transfer contents to a sealed lidded container and label with opened date; NEVER leave food inside the original metal tin.',
    '뚜껑 있는 밀폐 용기로 옮겨 담고 개봉일을 라벨링하세요. 원래 캔 상태로 보관하지 마세요.',
    'ढक्कन वाले एयरटाइट डिब्बे में पलटें और खोलने की तारीख़ लिखें; मूल टिन कैन के अंदर कभी न छोड़ें।',
  ],
};

const DURATION_MAP: Record<string, [string, string, string]> = {
  'Không': ['No (Not allowed)', '보관 불가', 'नहीं (अनुमत नहीं)'],
  'Không cấp đông': ['Do not freeze', '냉동 금지', 'फ़्रीज़ न करें'],
  'Theo NSX': ['Per Manufacturer (NSX)', '제조사 기준(NSX)', 'निर्माता के अनुसार (NSX)'],
  'Trong ngày': ['Same day', '당일 사용', 'उसी दिन'],
  '8 giờ': ['8 hours', '8시간', '8 घंटे'],
  '4 giờ': ['4 hours', '4시간', '4 घंटे'],
  '14 ngày (nơi khô, thoáng, tối)': [
    '14 days (dry, cool, dark place)',
    '14일 (건조·서늘·어두운 곳)',
    '14 दिन (सूखी, हवादार, अंधेरी जगह)',
  ],
  '3 tháng (đã chần)': ['3 months (blanched)', '3개월 (데침 처리 시)', '3 महीने (ब्लांच किया हुआ)'],
  '1 tháng (trừ khoai tây)': ['1 month (except potatoes)', '1개월 (감자 제외)', '1 महीना (आलू को छोड़कर)'],
  '1 ngày (đựng kín)': ['1 day (sealed)', '1일 (밀폐 보관)', '1 दिन (एयरटाइट बंद)'],
  'Theo NSX, không quá HSD in trên vỏ/bao bì': [
    'Per NSX, not past shell/pack expiry',
    '제조사 기준 (포장·껍질 기한 이내)',
    'निर्माता अनुसार, छिलके/पैकेट पर छपी समाप्ति से अधिक नहीं',
  ],
  'Theo NSX, tối đa 30 ngày': [
    'Per NSX, max 30 days',
    '제조사 기준, 최대 30일',
    'निर्माता अनुसार, अधिकतम 30 दिन',
  ],
  'Theo NSX, tối đa 14 ngày': [
    'Per NSX, max 14 days',
    '제조사 기준, 최대 14일',
    'निर्माता अनुसार, अधिकतम 14 दिन',
  ],
};

export const SHE_NO_FREEZE_TRANSLATIONS: Record<
  string,
  { group: string; detail: string; reason: string }[]
> = {
  EN: [
    { group: 'Eggs in intact shell', detail: 'Raw unpeeled eggs', reason: 'Shell cracks/bursts from expansion when frozen; risk of bacterial contamination' },
    { group: 'Cooked eggs', detail: 'Boiled, fried, steamed eggs…', reason: 'Egg whites become tough, rubbery, and watery after thawing' },
    { group: 'Fresh leafy & salad vegetables', detail: 'Lettuce, cucumber, tomato, fresh herbs…', reason: 'Severe dehydration, mushiness, and discoloration upon thawing' },
    { group: 'Mayonnaise-dressed dishes', detail: 'Salads, slaws, mayo sandwiches…', reason: 'Mayonnaise separates/oils off, creating off-odors and weeping liquid' },
    { group: 'Raw potatoes', detail: 'Unblanched sliced/cut potatoes', reason: 'Turns dark/brown, becomes watery, and discolors after thawing' },
    { group: 'Cream-sauced / thick-sauced pasta', detail: 'Cream pasta, carbonara…', reason: 'Water and oil separate; noodles turn mushy' },
    { group: 'Soft cheeses', detail: 'Fresh cheese, ricotta, cream cheese…', reason: 'Water/fat separation and loss of smooth texture' },
    { group: 'Thick emulsion sauces (cream, mayo, hollandaise)', detail: 'Salad dressings, cream sauces…', reason: 'Oil & water separation; loses glossy smooth emulsion' },
    { group: 'Sponge cakes with cream', detail: 'Filled or frosted cream/butter cakes…', reason: 'Cream weeps/collapses and sponge turns crumbly/soggy' },
    { group: 'Carbonated or high-alcohol beverages', detail: 'Soda, beer, spirits', reason: 'Bottles/cans may burst from expansion; spirits fail to freeze fully & degrade flavor' },
    { group: 'Dry cereals', detail: 'Oats, granola, dry cereal powders…', reason: 'Dry goods gain no shelf-life from freezing and suffer moisture/mold via condensation' },
  ],
  KO: [
    { group: '껍질 있는 생달걀', detail: '껍질을 벗기지 않은 생계란', reason: '냉동 팽창으로 껍질이 갈라지거나 깨져 세균 오염 위험' },
    { group: '조리된 달걀', detail: '삶은 계란, 프라이, 계란찜 등', reason: '해동 후 흰자가 질기고 딱딱해지며 수분이 분리됨' },
    { group: '신선 엽채류·생식 채소', detail: '상추, 오이, 토마토, 생허브 등', reason: '해동 후 탈수·물러짐·변색 발생' },
    { group: '마요네즈 버무림 음식', detail: '샐러드, 샌드위치 등', reason: '소스가 유수 분리되어 이취와 물기 발생' },
    { group: '생감자', detail: '데치지 않고 썬 감자', reason: '해동 후 갈변, 물러짐, 변색 발생' },
    { group: '크림·진한 소스 파스타', detail: '크림 파스타, 까르보나라 등', reason: '물과 기름 분리 및 면발 뭉개짐' },
    { group: '연질 치즈류', detail: '생치즈, 리코타, 크림치즈 등', reason: '수분·지방 분리로 부드러운 질감 손실' },
    { group: '걸쭉한 소스류 (크림·마요·올랑데즈)', detail: '샐러드 소스, 크림 소스 등', reason: '유분·수분 분리 및 농도 저하' },
    { group: '크림 스펀지 케이크', detail: '생크림·버터크림 케이크 등', reason: '크림 물 분리·흐름 및 시트 부서짐' },
    { group: '탄산·고도주 음료', detail: '탄산음료, 맥주, 양주', reason: '팽창으로 병·캔 파열 위험; 고도주는 완전 냉동 불가 및 풍미 변질' },
    { group: '건조 시리얼류', detail: '오트밀, 그래놀라, 시리얼 분말 등', reason: '유통기한 연장 효과 없이 결로로 인한 습기·곰팡이 유발' },
  ],
  HI: [
    { group: 'साबुत छिलके वाले अंडे', detail: 'कच्चे बिना छीले अंडे', reason: 'जमने पर फैलाव से छिलका फटता है; बैक्टीरिया संक्रमण का खतरा' },
    { group: 'पके हुए अंडे', detail: 'उबले, तले, भाप में पके अंडे…', reason: 'डीफ़्रॉस्ट करने पर सफ़ेदी सख्त, रबड़ जैसी और पानी छोड़ने वाली हो जाती है' },
    { group: 'ताज़ी पत्तेदार व सलाद सब्ज़ियाँ', detail: 'लेट्यूस, खीरा, टमाटर, ताज़ा हर्ब्स…', reason: 'पिघलने के बाद पानी निकलना, गलना और रंग बदलना' },
    { group: 'मेयोनीज़ मिले व्यंजन', detail: 'सलाद, सैंडविच आदि…', reason: 'मेयोनीज़ से तेल अलग होकर अजीब गंध व पानी छोड़ती है' },
    { group: 'कच्चे आलू', detail: 'बिना उबाले कटे कच्चे आलू', reason: 'डीफ़्रॉस्ट पर काले पड़ना, पानी छोड़ना व रंग बदलना' },
    { group: 'क्रीम सॉस पास्ता', detail: 'क्रीम पास्ता, कार्बोनारा…', reason: 'तेल-पानी अलग होना और पास्ता गल जाना' },
    { group: 'मुलायम चीज़', detail: 'ताज़ा चीज़, रिकोटा, क्रीम चीज़…', reason: 'पानी व वसा अलग होकर चिकनाई खत्म होना' },
    { group: 'गाढ़े सॉस (क्रीम, मेयो, होलैंडेज़)', detail: 'सलाद ड्रेसिंग, क्रीम सॉस…', reason: 'तेल व पानी अलग होकर गाढ़ापन समाप्त होना' },
    { group: 'क्रीम वाले स्पंज केक', detail: 'क्रीम या बटर से सजे केक…', reason: 'क्रीम पिघलकर पानी छोड़ती है और केक भुरभुरा होता है' },
    { group: 'कार्बोनेटेड व अधिक अल्कोहल पेय', detail: 'सोडा, बीयर, तेज़ शराब', reason: 'फैलाव से बोतल/कैन फटने का खतरा; उच्च अल्कोहल जमता नहीं व स्वाद बिगड़ता है' },
    { group: 'सूखे अनाज / सीरीयल', detail: 'ओट्स, ग्रेनोला, सूखा अनाज पाउडर…', reason: 'फ़्रीज़िंग से आयु नहीं बढ़ती बल्कि संघनन से नमी व फफूंद लग जाती है' },
  ],
};

export const SHE_POLICY_TRANSLATIONS: Record<Lang, Record<string, { article: string; title: string; summary: string }>> = {
  VI: {},
  EN: {
    META: {
      article: 'Document Info',
      title: 'Decision 107/2026/QĐ-SHE/SG (Code SHE-QĐ-FB13 · Version 00)',
      summary:
        '• Decision: 107/2026/QĐ-SHE/SG dated 12/11/2026 (Signed by Deputy CEO of Entertainment & Hospitality Division Thái Ngọc Sơn).\n• Code: SHE-QĐ-FB13 | Version: 00 | Effective: 12/11/2026.\n• Owner: Division Technical & Operations Dept (proposed by Culinary Dept).\n• Scope: Self-operated SHE member units.\n• Confidentiality: Internal circulation only; do not lend, copy, or remove without manager approval.',
    },
    ART1: {
      article: 'Article 1',
      title: 'Objectives',
      summary:
        '• Standardize storage, preservation, and shelf-life management across SHE member units.\n• Ensure food is kept under safe, hygienic, temperature-compliant conditions.\n• Prevent use of expired food and reduce waste and food-safety risks.\n• Unify labeling, Day-1 counting, and shelf-life control after opening, prepping, cooking, or thawing.',
    },
    ART2: {
      article: 'Article 2',
      title: 'Subjects & Scope of Application',
      summary:
        '• Applies to all restaurants, kiosks, F&B outlets, kitchens, and storage zones (dry stores, walk-in chillers/freezers, upright coolers/freezers) of self-operated SHE member units.\n• Covers all raw materials, semi-finished, finished dishes, beverages, and dry goods after opening.',
    },
    ART3: {
      article: 'Article 3',
      title: 'Related Reference Documents',
      summary:
        '• Vietnam Food Safety Law No. 55/2010/QH12.\n• Government Decree No. 15/2018/NĐ-CP.\n• FDA Food Code 2022 (incl. Section 3-501.17 date-marking for RTE TCS food).\n• FDA – Food Product Dating & FDA Guidance on Labeling of Foods That Need Refrigeration.',
    },
    ART4: {
      article: 'Article 4',
      title: 'Definitions & Abbreviations (FIFO, FEFO, TCS, Day 1)',
      summary:
        '• SHE: Hospitality & Entertainment Division | F&B: Food & Beverage | QLCL: QA/QC | NSX: Manufacturer | HSD: Expiry.\n• FIFO: First In, First Out | FEFO: First Expired, First Out.\n• TCS: Time/Temperature Control for Safety foods (meat, seafood, dairy, eggs, rice, cut produce…).\n• Secondary shelf life (internal shelf life): Max usable time after opening, prepping, cooking, or thawing per Article 7.\n• Day 1: First day of secondary shelf-life calculation per Section 6.2.',
    },
    ART5: {
      article: 'Article 5',
      title: 'Responsibilities of Stakeholders',
      summary:
        '• 5.1 Kitchen / F&B: Check incoming & stored food; keep raw/cooked separated; enforce FIFO/FEFO; label per 6.3; log equipment temps per 6.1; discard expired items per 6.8.\n• 5.2 Warehouse: Verify receiving docs; store in right temp zones; track near-expiry reports; keep stores clean.\n• 5.3 QA/QC (QLCL): Conduct audits; validate internal shelf life for items not listed in Art. 7 (6.5).\n• 5.4 Unit Management (F&B Manager / Head Chef): Deploy regulation, assign daily temp/label checks, train staff.\n• 5.5 SHE Culinary Dept: Maintain/update policy and approve internal shelf life for unlisted foods after QA validation.',
    },
    SEC61: {
      article: 'Section 6.1',
      title: 'Storage Temperature Ranges & 4-Hour Cumulative Limit',
      summary:
        '• Room Temp (15–25°C): Dry, airy, shaded store away from direct sunlight.\n• Chilled Temp (0–5°C): Refrigerators and walk-in chillers.\n• Frozen Temp (≤ −18°C): Freezers and walk-in freezers.\n• Monitoring: Check and record chiller/freezer temps at least 2 times/day (start & end of shift). Report excursions immediately and transfer food to compliant units.\n• 4-Hour Rule: Chilled or frozen foods may stay outside target temp zones for max 04 cumulative hours during prep/cooking/service; exceedances MUST be discarded.',
    },
    SEC62: {
      article: 'Section 6.2',
      title: 'Secondary Shelf-Life Calculation (Day 1, Hours, Months, 7-Day TCS)',
      summary:
        '• Article 7 limits start from Day 1: receiving date (raw fresh foods without NSX date), opened date, prep/cook completion date, freezing date, or thawing completion date/time.\n• By Day: Day 1 counts as the first day (e.g., 2-day chilled ground meat received on the 10th expires at end of the 11th).\n• By Hour: Starts from exact opening/cooking time; label MUST state time.\n• By Month: 1 month = 30 days.\n• No stacking across columns; freeze only valid, good-quality food.\n• 7-Day RTE TCS Cap (FDA 3-501.17): Chilled ready-to-eat TCS food cannot exceed 07 days from Day 1 even if manufacturer states longer.',
    },
    SEC63: {
      article: 'Section 6.3',
      title: 'Secondary Food Labeling (4 Mandatory Fields)',
      summary:
        '• Every opened, prepped, cooked, or thawed item must be individually covered/packed and clearly labeled (no smudging or peeling).\n• 4 mandatory fields: (1) Product name; (2) Day 1 date (+ time if hourly); (3) Use-by date/time; (4) Staff responsible.\n• Items without labels, with illegible labels, or unknown storage history MUST be discarded.',
    },
    SEC64: {
      article: 'Section 6.4',
      title: 'Storage & Chiller Stacking Rules (Top-to-Bottom, 15 cm Clearance)',
      summary:
        '• Keep raw food strictly separated from cooked/RTE food.\n• Chiller vertical order (TOP to BOTTOM): (1) Ready-to-eat → (2) Seafood → (3) Whole meats → (4) Ground meats → (5) Poultry (bottom).\n• Floor clearance: Keep ≥ 15 cm off the floor; do not overpack blocking cold airflow.\n• Opened canned food: Transfer immediately to sealed lidded containers — NEVER keep in the tin.\n• Enforce FIFO/FEFO rotation.',
    },
    SEC65: {
      article: 'Section 6.5',
      title: 'Unopened, Opened & Unlisted Foods',
      summary:
        '• Unopened products: Apply manufacturer expiry date (HSD) and storage conditions.\n• Opened products: Apply the SHORTER duration between manufacturer label and Article 7.\n• Foods NOT listed in Article 7: Follow manufacturer label. If manufacturer gives no opened rule, unit proposes → SHE QA validates → SHE Culinary approves BEFORE use; NEVER default to 3 days chilled or 1 month frozen.',
    },
    SEC66: {
      article: 'Section 6.6',
      title: 'Cooked Foods: Two-Stage Cooling & Reheating SOP',
      summary:
        '• Mandatory Cooling (FDA 3-501.14) before chiller/freezer storage:\n  - Stage 1: Cool 57°C → 21°C within max 02 hours.\n  - Stage 2: Cool 21°C → ≤ 5°C within max 04 hours.\n  - Portion into shallow pans (≤ 5 cm deep) to speed cooling. Food failing cooling limits MUST be discarded.\n• Reheating: Must reach ≥ 75°C internal core temperature and heat at 82°C within 2 minutes; reheat ONCE only — discard leftovers.',
    },
    SEC67: {
      article: 'Section 6.7',
      title: 'Thawing Rules (3 Permitted Methods & 24-Hour Limit)',
      summary:
        '• Only 3 permitted thawing methods: (1) Inside chiller (0–5°C); (2) Under continuous running clean water ≤ 21°C; (3) Microwave when cooking immediately.\n• Strictly prohibited: Thawing at room temperature or soaking in standing water.\n• Post-thaw limit: Use within 24 hours, NEVER refreeze, and label thaw date/time. Thawed raw food cooked & cooled properly (6.6) is treated as cooked food.',
    },
    SEC68: {
      article: 'Section 6.8',
      title: 'Prohibited Practices & Spoiled/Expired Disposal',
      summary:
        '• Strictly prohibited: Relabeling, extending expiry dates, freezing, reprocessing, or mixing expired, spoiled, or untraceable food to prolong shelf life.\n• Disposal: Any food that is expired or shows spoilage (discoloration, off-odor, slime, mold, swollen/leaking packaging) must be discarded immediately and logged.',
    },
    ART7_READ: {
      article: 'Article 7 (Guide)',
      title: 'How to Read the Storage & Shelf-Life Table',
      summary:
        '• Applies after opening, prepping, cooking, or thawing (Day 1 per 6.2; unopened uses NSX HSD).\n• Duration value: Max storage limit in that column.\n• “No” (Không): Cannot be stored at that temp (max 04 cumulative hours prep/service per 6.1).\n• “Do not freeze”: Never freeze (see Article 8).\n• “Per NSX”: Follow manufacturer label; if none/disallowed, treat as “No” (“Do not freeze” in freeze column).\n• Columns are alternatives, not cumulative; thawed food follows Section 6.7.',
    },
    ART9: {
      article: 'Article 9',
      title: 'Implementation & Amendments',
      summary:
        '• Effective from 12/11/2026 until superseded; prior conflicting division guidelines are void.\n• SHE Culinary, SHE QA, Unit Leaders, and staff are responsible for compliance.\n• Amendments must be led by SHE Culinary, validated by SHE QA, and formally approved.',
    },
  },
  KO: {
    META: {
      article: '문서 정보',
      title: '결정 107/2026/QĐ-SHE/SG (문서코드 SHE-QĐ-FB13 · 버전 00)',
      summary:
        '• 결정번호: 107/2026/QĐ-SHE/SG (2026년 11월 12일 시행, 서명: 엔터테인먼트·호스피탈리티 부문 부총괄 타이 응옥 선).\n• 문서코드: SHE-QĐ-FB13 | 버전: 00 | 관리부서: 부문 기술운영부(요리부서 제안).\n• 적용범위: SHE 직영 자회사.\n• 보안: 사내 전용 자료로 관리자 승인 없이 외부 유출·복사·대여 금지.',
    },
    ART1: {
      article: '제1조',
      title: '목적',
      summary:
        '• 전 사업장의 식품 저장·보관·유통기한 관리 표준 통일.\n• 적절한 온도 및 위생적 식품 안전 확보.\n• 기한 경과 식품 사용 방지 및 폐기 손실 절감.\n• 개봉·전처리·조리·해동 후 라벨링 및 기한 산정 기준 통일.',
    },
    ART2: {
      article: '제2조',
      title: '적용 대상 및 범위',
      summary:
        '• SHE 직영 자회사의 모든 레스토랑, 키오스크, F&B 매장, 주방 및 보관 구역(건조창고·냉장·냉동실/고)에 적용.\n• 모든 원재료, 반제품, 완제품, 음료 및 개봉 후 건조식품 포함.',
    },
    ART3: {
      article: '제3조',
      title: '관련 규정',
      summary:
        '• 베트남 식품안전법 55/2010/QH12 및 시행령 15/2018/NĐ-CP.\n• FDA Food Code 2022 (제3-501.17항 즉석섭취 TCS 식품 날짜 표시 포함).\n• FDA 제품 날짜 표시 및 냉장 식품 라벨링 가이드.',
    },
    ART4: {
      article: '제4조',
      title: '용어 및 약어 (FIFO, FEFO, TCS, 1일차)',
      summary:
        '• FIFO(선입선출) / FEFO(선만료선출).\n• TCS: 시간·온도 관리 필수 안전식품(육류, 수산, 유제품, 계란, 밥, 절단 채소 등).\n• 2차 소비기한(사내 기한): 개봉·전처리·조리·해동 후 허용 최대 기한(제7조).\n• 1일차(Ngày 1): 2차 기한 기산 시작일(제6.2조).',
    },
    ART5: {
      article: '제5조',
      title: '부서별 책임',
      summary:
        '• 5.1 주방/F&B: 검수, 생·익 분리 보관, FIFO/FEFO, 라벨 부착(6.3), 온도 기록(6.1), 폐기 처리(6.8).\n• 5.2 창고: 입고 검수, 적정 구역 적재, 임박/만료 보고.\n• 5.3 품질관리(QLCL): 정기 감사 및 미등재 식품 기한 검증(6.5).\n• 5.4 현장 관리자/총주방장: 일일 점검 담당자 지정 및 직원 교육.\n• 5.5 부문 요리부서: 규정 개정 총괄 및 미등재 식품 최종 승인.',
    },
    SEC61: {
      article: '제6.1조',
      title: '보관 온도 범위 및 4시간 누적 제한',
      summary:
        '• 실온(15–25°C): 건조·통풍·직사광선 차단 창고 | 냉장(0–5°C) | 냉동(≤ −18°C).\n• 점검 빈도: 일 최소 2회(근무 시작·종료) 기록. 기준 이탈 시 즉시 보고 및 이동.\n• 4시간 규칙: 냉장·냉동 식품의 기준 온도 외 노출은 조리·서빙 포함 누적 최대 4시간까지만 허용(초과 시 폐기).',
    },
    SEC62: {
      article: '제6.2조',
      title: '2차 소비기한 계산 방식 (1일차, 시간, 월, 7일 제한)',
      summary:
        '• 1일차 기준: 생鮮 입고일 / 개봉일 / 전처리·조리 완료일 / 냉동일 / 해동 완료 일시.\n• 일 단위: 당일을 1일차로 산정(예: 10일 입고 2일 기한 → 11일 말까지).\n• 시간 단위: 개봉/조리 시점부터 산정(라벨에 시간 필수). 1개월 = 30일.\n• 컬럼 간 기한 합산 금지. 냉동은 기한 내 정상 품질만 가능.\n• 즉석섭취 TCS 냉장 최대 7일 상한(FDA 3-501.17).',
    },
    SEC63: {
      article: '제6.3조',
      title: '2차 식품 라벨링 (4대 필수 정보)',
      summary:
        '• 모든 개봉·전처리·조리·해동 식품은 개별 밀봉 후 선명하게 라벨 부착.\n• 4대 필수 항목: (1) 품목명 (2) 1일차 날짜(시간 단위 시 시간 포함) (3) 소비기한 일시 (4) 담당자.\n• 라벨 누락·판독 불가·이력 불명 식품은 즉시 폐기.',
    },
    SEC64: {
      article: '제6.4조',
      title: '보관 및 냉장고 적재 순서 (바닥 15cm 이격)',
      summary:
        '• 생식품과 조리·즉석섭취식품 철저 분리.\n• 냉장고 위→아래 적재 순서: (1) 즉석섭취 → (2) 해산물 → (3) 덩어리 고기 → (4) 다진 고기 → (5) 가금류(최하단).\n• 바닥 15cm 이상 이격, 냉기 순환 방해 과적 금지.\n• 개봉한 통조림은 반드시 뚜껑 있는 밀폐 용기로 이관(캔 보관 금지). FIFO/FEFO 준수.',
    },
    SEC65: {
      article: '제6.5조',
      title: '미개봉·개봉·미등재 식품 처리',
      summary:
        '• 미개봉: 제조사(NSX) 기한 및 보관 조건 적용.\n• 개봉: 제조사 지침과 제7조 중 더 짧은 기한 적용.\n• 제7조 미등재 품목: 제조사 지침 우선, 미기재 시 사업장 제안 → QLCL 검증 → 요리부서 승인 후 적용 (임의로 냉장 3일/냉동 1개월 기본 적용 금지).',
    },
    SEC66: {
      article: '제6.6조',
      title: '가열 조리 식품: 냉각 및 재가열 절차',
      summary:
        '• 냉각 2단계(FDA 3-501.14): ① 57°C→21°C 최대 2시간 ② 21°C→≤5°C 최대 4시간. 얕은 트레이(두께 ≤5cm) 소분 권장. 기준 미달 시 폐기.\n• 재가열: 중심온도 최소 75°C(82°C에서 2분 가열). 단 1회만 재가열 가능, 잔량 폐기.',
    },
    SEC67: {
      article: '제6.7조',
      title: '해동 규정 (허용 3가지 방법 및 24시간 제한)',
      summary:
        '• 허용 방법 3가지: ① 냉장실(0–5°C) ② 21°C 이하 흐르는 깨끗한 물 ③ 즉시 조리 시 전자레인지.\n• 금지: 실온 해동 및 고인 물 침지 금지.\n• 해동 후 24시간 이내 사용, 재냉동 절대 금지, 해동 일시 라벨링. 해동 후 완전 가열·적정 냉각 시 조리식품으로 관리.',
    },
    SEC68: {
      article: '제6.8조',
      title: '금지 행위 및 변질·만료 폐기',
      summary:
        '• 기한 만료·변질·이력 불명 식품의 라벨 변경, 기한 연장, 냉동, 재가공, 혼합 행위 엄금.\n• 만료 또는 변질 징후(변색, 이취, 점액, 곰팡이, 팽창·누수) 발견 시 즉시 폐기 및 기록.',
    },
    ART7_READ: {
      article: '제7조 (읽기 안내)',
      title: '보관 기준표 읽는 법',
      summary:
        '• 개봉·전처리·조리·해동 후 적용(미개봉은 제조사 HSD).\n• 기간 수치: 해당 온도 컬럼의 최대 보관 한도.\n• “보관 불가”(Không): 해당 온도 보관 금지(6.1조 작업 4시간 예외만 허용).\n• “냉동 금지”: 냉동 불가(제8조 참조).\n• “제조사 기준”: 포장 안내 따르며, 없으면 보관 불가·냉동 금지로 간주. 컬럼 간 합산 불가.',
    },
    ART9: {
      article: '제9조',
      title: '시행 및 개정 조항',
      summary:
        '• 2026년 11월 12일 시행되며 기존 상충 지침은 효력 상실.\n• 부문 요리부서, QLCL, 자회사 경영진 및 관련 직원이 시행 책임.\n• 개정은 요리부서 주관·QLCL 검증·권한자 승인을 거쳐 확정.',
    },
  },
  HI: {
    META: {
      article: 'दस्तावेज़ जानकारी',
      title: 'निर्णय 107/2026/QĐ-SHE/SG (कोड SHE-QĐ-FB13 · संस्करण 00)',
      summary:
        '• निर्णय: 107/2026/QĐ-SHE/SG दिनांक 12/11/2026 (हस्ताक्षर: थाई न्गोक सोन, उप-मुख्य कार्यकारी अधिकारी SHE)।\n• कोड: SHE-QĐ-FB13 | संस्करण: 00 | प्रभावी तिथि: 12/11/2026।\n• गोपनीयता: केवल आंतरिक उपयोग; प्रबंधक की अनुमति के बिना कॉपी या बाहर ले जाना वर्जित है।',
    },
    ART1: {
      article: 'अनुच्छेद 1',
      title: 'उद्देश्य',
      summary:
        '• सभी इकाइयों में खाद्य भंडारण व शेल्फ-लाइफ़ मानकों का एकीकरण।\n• सुरक्षित तापमान व स्वच्छता सुनिश्चित करना और एक्सपायर्ड भोजन से बचाव।\n• पैकेट खोलने, तैयारी, पकाने या डीफ़्रॉस्ट के बाद लेबलिंग नियम एक समान करना।',
    },
    ART2: {
      article: 'अनुच्छेद 2',
      title: 'लागू क्षेत्र व विषय',
      summary:
        '• स्व-संचालित SHE इकाइयों के सभी रेस्तरां, कियोस्क, F&B काउंटर, रसोई व ड्राई/कोल्ड/फ़्रोज़न स्टोरेज पर लागू।\n• सभी कच्ची सामग्री, अर्ध-तैयार, तैयार व्यंजन, पेय और खुले सूखे उत्पादों पर लागू।',
    },
    ART3: {
      article: 'अनुच्छेद 3',
      title: 'संबंधित संदर्भ दस्तावेज़',
      summary:
        '• वियतनाम खाद्य सुरक्षा कानून 55/2010/QH12 व डिक्री 15/2018/NĐ-CP।\n• FDA Food Code 2022 (अनुभाग 3-501.17 RTE TCS तिथि-अंकन सहित)।',
    },
    ART4: {
      article: 'अनुच्छेद 4',
      title: 'परिभाषाएँ एवं संक्षिप्त रूप (FIFO, FEFO, TCS, दिन 1)',
      summary:
        '• FIFO: पहले आया, पहले गया | FEFO: पहले समाप्त, पहले गया।\n• TCS: समय/तापमान नियंत्रण आवश्यक खाद्य पदार्थ (मांस, मछली, दूध, अंडा, चावल, कटी सब्ज़ियाँ)।\n• द्वितीयक शेल्फ-लाइफ़: खुलने/तैयार/पकाने/डीफ़्रॉस्ट के बाद अनुच्छेद 7 की अधिकतम सीमा। दिन 1: अनुभाग 6.2 से गिनती शुरू।',
    },
    ART5: {
      article: 'अनुच्छेद 5',
      title: 'संबंधित विभागों के दायित्व',
      summary:
        '• 5.1 रसोई/F&B: जाँच, कच्चा-पक्का पृथक्करण, FIFO/FEFO, लेबलिंग (6.3), तापमान लॉग (6.1), निस्तारण (6.8)।\n• 5.2 गोदाम: रसीद व भंडारण क्रम, नज़दीकी समाप्ति रिपोर्ट।\n• 5.3 गुणवत्ता नियंत्रण (QLCL): ऑडिट और असूचीबद्ध वस्तुओं का सत्यापन (6.5)।\n• 5.4/5.5 प्रबंधन व पाक कला विभाग: नीति क्रियान्वयन, प्रशिक्षण एवं अद्यतन।',
    },
    SEC61: {
      article: 'अनुभाग 6.1',
      title: 'भंडारण तापमान सीमा व 4 घंटे का संचयी नियम',
      summary:
        '• कमरा (15–25°C): सूखी हवादार जगह | ठंडा (0–5°C): चिलर | फ़्रीज़ (≤ −18°C): फ़्रीज़र।\n• निगरानी: दिन में कम से कम 2 बार (शिफ्ट शुरू व अंत) तापमान रिकॉर्ड करें।\n• 4-घंटे सीमा: तैयारी/परोसने के दौरान ठंडे/फ़्रोज़न खाद्य पदार्थ कुल मिलाकर अधिकतम 4 घंटे ही तापमान सीमा से बाहर रह सकते हैं; इससे अधिक होने पर फेंक दें।',
    },
    SEC62: {
      article: 'अनुभाग 6.2',
      title: 'द्वितीयक शेल्फ-लाइफ़ गणना (दिन 1, घंटे, माह, 7-दिन सीमा)',
      summary:
        '• दिन 1: प्राप्ति तिथि (ताज़ा कच्चा माल), खोलने की तिथि, तैयारी/पकाने या फ़्रीज़/डीफ़्रॉस्ट पूर्ण होने की तिथि/समय।\n• दिन से गणना: पहला दिन शामिल (उदा. 10 तारीख को 2-दिन सीमा वाला कीमा 11 तारीख की समाप्ति तक वैध)। 1 माह = 30 दिन।\n• कॉलम जोड़ना वर्जित। RTE TCS ठंडे भोजन की अधिकतम सीमा 7 दिन (FDA 3-501.17)।',
    },
    SEC63: {
      article: 'अनुभाग 6.3',
      title: 'खाद्य लेबलिंग नियम (4 अनिवार्य विवरण)',
      summary:
        '• हर खुला/तैयार/पका/डीफ़्रॉस्ट खाद्य पदार्थ अलग ढककर स्पष्ट लेबल के साथ रखें।\n• 4 अनिवार्य विवरण: (1) नाम (2) दिन 1 तिथि (घंटे वाली वस्तुओं में समय सहित) (3) समाप्ति तिथि/समय (4) जिम्मेदार कर्मचारी।\n• बिना लेबल या अस्पष्ट लेबल वाले खाद्य पदार्थ तुरंत नष्ट करें।',
    },
    SEC64: {
      article: 'अनुभाग 6.4',
      title: 'भंडारण व चिलर क्रम (ऊपर से नीचे, फर्श से 15 सेमी ऊपर)',
      summary:
        '• कच्चे और पके/रेडी-टू-ईट खाद्य पदार्थ अलग रखें।\n• चिलर क्रम (ऊपर→नीचे): (1) रेडी-टू-ईट → (2) सीफ़ूड → (3) साबुत मांस → (4) कीमा → (5) पोल्ट्री (सबसे नीचे)।\n• फर्श से कम से कम 15 सेमी ऊपर रखें। खुले टिन कैन को तुरंत एयरटाइट डिब्बे में पलटें। FIFO/FEFO अपनाएँ।',
    },
    SEC65: {
      article: 'अनुभाग 6.5',
      title: 'बिना खुले, खुले व असूचीबद्ध खाद्य पदार्थ',
      summary:
        '• बिना खुले: निर्माता (NSX) निर्देश लागू। खुले पैकेट: निर्माता और अनुच्छेद 7 में से जो कम हो वह लागू।\n• असूचीबद्ध खाद्य: निर्माता निर्देश मानें; निर्देश न होने पर QLCL सत्यापन व पाक कला विभाग की स्वीकृति अनिवार्य — अपने आप 3 दिन/1 माह लागू न करें।',
    },
    SEC66: {
      article: 'अनुभाग 6.6',
      title: 'पके भोजन को ठंडा करना और दोबारा गरम करना',
      summary:
        '• 2-चरणीय शीतलन (FDA 3-501.14): ① 57°C→21°C अधिकतम 2 घंटे ② 21°C→≤5°C अधिकतम 4 घंटे (≤5 सेमी उथली ट्रे में)। विफल होने पर फेंक दें।\n• दोबारा गरम करना: केंद्र ≥ 75°C (82°C पर 2 मिनट); केवल एक बार गरम करें।',
    },
    SEC67: {
      article: 'अनुभाग 6.7',
      title: 'डीफ़्रॉस्ट नियम (3 अनुमत तरीके व 24-घंटे सीमा)',
      summary:
        '• अनुमत तरीके: ① चिलर में (0–5°C) ② लगातार बहते ≤21°C साफ पानी में ③ तुरंत पकाने हेतु माइक्रोवेव।\n• कमरे के तापमान या ठहरे पानी में डीफ़्रॉस्ट निषिद्ध।\n• डीफ़्रॉस्ट के 24 घंटे में उपयोग करें; दोबारा फ़्रीज़ कभी न करें।',
    },
    SEC68: {
      article: 'अनुभाग 6.8',
      title: 'निषिद्ध कार्य एवं खराब भोजन का निस्तारण',
      summary:
        '• लेबल बदलना, समाप्ति बढ़ाना, एक्सपायर्ड/खराब भोजन को फ़्रीज़ या मिश्रित करना सख्त वर्जित।\n• समाप्ति या खराब लक्षण (रंग/गंध बदलाव, फफूंद, चिपचिपापन, फूला पैकेट) पर तुरंत नष्ट कर रिकॉर्ड करें।',
    },
    ART7_READ: {
      article: 'अनुच्छेद 7 (मार्गदर्शिका)',
      title: 'तालिका पढ़ने के नियम',
      summary:
        '• खुलने/तैयारी/पकाने/डीफ़्रॉस्ट के बाद लागू।\n• “नहीं” (Không): उस तापमान पर भंडारण वर्जित (अनुभाग 6.1 के 4-घंटे कार्य अपवाद सहित)।\n• “फ़्रीज़ न करें”: अनुच्छेद 8 के अनुसार फ़्रीज़ निषिद्ध।\n• “NSX अनुसार”: निर्माता लेबल मानें; निर्देश न हो तो निषिद्ध समझें। कॉलम जोड़े नहीं जाते।',
    },
    ART9: {
      article: 'अनुच्छेद 9',
      title: 'कार्यान्वयन एवं संशोधन',
      summary:
        '• 12/11/2026 से प्रभावी; पूर्व के विरोधी निर्देश निरस्त।\n• कोई भी संशोधन SHE पाक कला व QLCL विभाग की समीक्षा और स्वीकृति से होगा।',
    },
  },
};

export const translateGroup = (group: string, lang: Lang): string => {
  if (lang === 'VI') return group;
  return GROUP_TRANSLATIONS[group]?.[getLangIndex(lang)] ?? group;
};

export const translateItemName = (item: FoodItem, lang: Lang): string => {
  if (lang === 'VI') return item.name;
  const code = getItemCode(item);
  return ITEM_TRANSLATIONS[code]?.[getLangIndex(lang)] ?? item.enName ?? item.name;
};

export const translateDuration = (val: string, lang: Lang): string => {
  if (!val || isEmptyCell(val)) return UI_TRANSLATIONS[lang].emptyCell;
  const trimmed = val.trim();
  if (lang === 'VI') return trimmed;

  const exact = DURATION_MAP[trimmed];
  if (exact) return exact[getLangIndex(lang)];

  const idx = getLangIndex(lang);
  const simpleMatch = trimmed.match(/^(\d+)\s*(giờ|ngày|tuần|tháng|năm)$/i);
  if (simpleMatch) {
    const num = simpleMatch[1];
    const unit = simpleMatch[2].toLowerCase();
    const plural = Number(num) > 1;
    const unitMap: Record<string, [string, string, string]> = {
      giờ: [plural ? 'hours' : 'hour', '시간', 'घंटे'],
      ngày: [plural ? 'days' : 'day', '일', 'दिन'],
      tuần: [plural ? 'weeks' : 'week', '주', 'सप्ताह'],
      tháng: [plural ? 'months' : 'month', '개월', 'महीने'],
      năm: [plural ? 'years' : 'year', '년', 'साल'],
    };
    const u = unitMap[unit];
    if (u) {
      return lang === 'KO' ? `${num}${u[idx]}` : `${num} ${u[idx]}`;
    }
  }
  return trimmed;
};

export const translateItemNote = (item: FoodItem, lang: Lang): string => {
  const note = item.note?.trim() || '';
  if (!note || isEmptyCell(note)) return UI_TRANSLATIONS[lang].emptyNote;
  if (lang === 'VI') return note;
  const mapped = NOTE_TRANSLATION_MAP[note];
  if (mapped) return mapped[getLangIndex(lang)];
  return note;
};

export const translateNoFreezeItem = (
  nf: SheNoFreezeItem,
  index: number,
  lang: Lang
): SheNoFreezeItem => {
  if (lang === 'VI') return nf;
  const localized = SHE_NO_FREEZE_TRANSLATIONS[lang]?.[index];
  return localized || nf;
};

export const translatePolicySection = (
  sec: ShePolicySection,
  lang: Lang
): { article: string; title: string; summary: string } => {
  if (lang === 'VI') return { article: sec.article, title: sec.title, summary: sec.summary };
  const localized = SHE_POLICY_TRANSLATIONS[lang]?.[sec.id];
  return localized || { article: sec.article, title: sec.title, summary: sec.summary };
};

export const translateFlag = (item: FoodItem, _lang: Lang): string =>
  item.flag ? item.flag : '';
