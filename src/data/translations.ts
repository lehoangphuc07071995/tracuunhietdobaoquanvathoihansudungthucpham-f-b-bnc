import type { FoodItem, Lang, UiTranslation } from '../types';
import { getItemCode, isEmptyCell } from './foodData';

export const LANGS: Lang[] = ['VI', 'EN', 'KO', 'HI'];

export const getLangIndex = (lang: Lang): 0 | 1 | 2 =>
  lang === 'EN' ? 0 : lang === 'KO' ? 1 : 2;

export const UI_TRANSLATIONS: Record<Lang, UiTranslation> = {
  "VI": {
    "title": "HỆ THỐNG TRA CỨU NHIỆT ĐỘ BẢO QUẢN & THỜI HẠN SỬ DỤNG THỰC PHẨM",
    "subtitle": "BAN ẨM THỰC - SUN WORLD BA NA HILLS",
    "pageTitle": "HỆ THỐNG TRA CỨU NHIỆT ĐỘ BẢO QUẢN & THỜI HẠN SỬ DỤNG THỰC PHẨM - BNC",
    "searchPlaceholder": "Tìm:",
    "all": "Tất cả",
    "appendix1": "Phụ lục 1",
    "appendix2": "Phụ lục 2",
    "appendix3": "Phụ lục 3",
    "filterGroup": "Nhóm",
    "filterStorage": "Bảo quản",
    "hasRoom": "Có Nhiệt độ phòng",
    "hasCool": "Có 1-4°C",
    "hasFreeze": "Có ≤ -18°C",
    "sort": "Sắp xếp",
    "sortId": "Theo số thứ tự",
    "sortName": "Tên A-Z",
    "viewGrid": "Lưới",
    "viewList": "Danh sách",
    "colRoom": "Nhiệt độ phòng",
    "colCool": "1-4°C",
    "colFreeze": "≤ -18°C",
    "colCold": "Kho lạnh (0-4°C)",
    "colFrozen": "Kho đông (≤-18°C)",
    "colDisplayCool": "Tủ trưng bày lạnh (1-4°C)",
    "colDisplayHot": "Tủ trưng bày nóng (30-40°C, trong ngày)",
    "colWeight": "Trọng lượng",
    "colEnglish": "Tên tiếng Anh",
    "sourcePL3": "Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)",
    "noteLabel": "Ghi chú",
    "emptyNote": "— (để trống trong file gốc)",
    "emptyCell": "—",
    "detail": "Chi tiết",
    "copy": "Copy trích lục",
    "copied": "Đã copy!",
    "noResultTitle": "Không tìm thấy",
    "noResultDesc": "Hãy thử từ khóa ngắn hơn hoặc đổi bộ lọc.",
    "resetFilter": "Đặt lại bộ lọc",
    "results": "kết quả",
    "principle": "Bản trích lục không thay thế văn bản gốc. Khi có mâu thuẫn, ưu tiên văn bản gốc đã ban hành và khuyến cáo NSX trên bao bì.",
    "detailTitle": "Chi tiết món",
    "close": "Đóng",
    "groupLabel": "Nhóm",
    "displayLabel": "Hiển thị",
    "colName": "Tên",
    "colAction": "Hành động",
    "codeLabel": "Mã:",
    "useToday": "DÙNG TRONG NGÀY",
    "originalNote": "GHI CHÚ NGUYÊN VĂN",
    "emptyCellHint": "để trống trong file gốc",
    "clearSearch": "Xóa tìm kiếm",
    "focusLabel": "tìm kiếm",
    "clearLabel": "xóa",
    "qaTitle": "CẦN XÁC NHẬN QA",
    "excerptLabel": "TRÍCH LỤC"
  },
  "EN": {
    "title": "FOOD STORAGE TEMPERATURE & SHELF LIFE LOOKUP SYSTEM",
    "subtitle": "F&B DEPARTMENT - SUN WORLD BA NA HILLS",
    "pageTitle": "FOOD STORAGE TEMPERATURE & SHELF LIFE LOOKUP SYSTEM - BNC",
    "searchPlaceholder": "Search:",
    "all": "All",
    "appendix1": "Appendix 1",
    "appendix2": "Appendix 2",
    "appendix3": "Appendix 3",
    "filterGroup": "Group",
    "filterStorage": "Storage",
    "hasRoom": "Has Room Temp",
    "hasCool": "Has 1-4°C",
    "hasFreeze": "Has ≤ -18°C",
    "sort": "Sort",
    "sortId": "By number",
    "sortName": "Name A-Z",
    "viewGrid": "Grid",
    "viewList": "List",
    "colRoom": "Room Temp",
    "colCool": "1-4°C",
    "colFreeze": "≤ -18°C",
    "colCold": "Cold storage (0-4°C)",
    "colFrozen": "Frozen (≤-18°C)",
    "colDisplayCool": "Display fridge (1-4°C)",
    "colDisplayHot": "Display warmer (30-40°C, within day)",
    "colWeight": "Weight",
    "colEnglish": "English name",
    "sourcePL3": "Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)",
    "noteLabel": "Note",
    "emptyNote": "— (blank in source file)",
    "emptyCell": "—",
    "detail": "Details",
    "copy": "Copy excerpt",
    "copied": "Copied!",
    "noResultTitle": "No results",
    "noResultDesc": "Try a shorter keyword or change the filter.",
    "resetFilter": "Reset filters",
    "results": "results",
    "principle": "This excerpt does not replace the original document. In case of conflict, the issued original document and the manufacturer’s instructions on the packaging shall prevail.",
    "detailTitle": "Item details",
    "close": "Close",
    "groupLabel": "Group",
    "displayLabel": "View",
    "colName": "Name",
    "colAction": "Actions",
    "codeLabel": "Code:",
    "useToday": "USE TODAY",
    "originalNote": "ORIGINAL NOTE",
    "emptyCellHint": "blank in source file",
    "clearSearch": "Clear search",
    "focusLabel": "focus",
    "clearLabel": "clear",
    "qaTitle": "QA CONFIRMATION NEEDED",
    "excerptLabel": "EXCERPT"
  },
  "KO": {
    "title": "식품 보관 온도 및 유통기한 조회 시스템",
    "subtitle": "식음료부 - 선 월드 바나 힐스",
    "pageTitle": "식품 보관 온도 및 유통기한 조회 시스템 - BNC",
    "searchPlaceholder": "검색:",
    "all": "전체",
    "appendix1": "부록 1",
    "appendix2": "부록 2",
    "appendix3": "부록 3",
    "filterGroup": "그룹",
    "filterStorage": "보관",
    "hasRoom": "상온 있음",
    "hasCool": "1-4°C 있음",
    "hasFreeze": "≤ -18°C 있음",
    "sort": "정렬",
    "sortId": "번호순",
    "sortName": "이름 A-Z",
    "viewGrid": "그리드",
    "viewList": "목록",
    "colRoom": "상온",
    "colCool": "1-4°C",
    "colFreeze": "≤ -18°C",
    "colCold": "냉장 보관 (0-4°C)",
    "colFrozen": "냉동 (≤-18°C)",
    "colDisplayCool": "전시 냉장 (1-4°C)",
    "colDisplayHot": "전시 온장 (30-40°C, 당일)",
    "colWeight": "중량",
    "colEnglish": "영문명",
    "sourcePL3": "Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)",
    "noteLabel": "비고",
    "emptyNote": "— (원문에 없음)",
    "emptyCell": "—",
    "detail": "상세",
    "copy": "발췌 복사",
    "copied": "복사됨!",
    "noResultTitle": "결과 없음",
    "noResultDesc": "더 짧은 키워드로 시도하거나 필터를 변경하세요.",
    "resetFilter": "필터 초기화",
    "results": "개 결과",
    "principle": "본 발췌문은 원본 문서를 대체하지 않습니다. 상충 시 발행된 원본 문서와 포장에 기재된 제조사 권장사항이 우선합니다.",
    "detailTitle": "항목 상세",
    "close": "닫기",
    "groupLabel": "그룹",
    "displayLabel": "보기",
    "colName": "이름",
    "colAction": "작업",
    "codeLabel": "코드:",
    "useToday": "당일 사용",
    "originalNote": "원문 비고",
    "emptyCellHint": "원문에 없음",
    "clearSearch": "검색 지우기",
    "focusLabel": "포커스",
    "clearLabel": "지우기",
    "qaTitle": "QA 확인 필요",
    "excerptLabel": "발췌"
  },
  "HI": {
    "title": "खाद्य भंडारण तापमान और शेल्फ लाइफ खोज प्रणाली",
    "subtitle": "खाद्य एवं पेय विभाग - सन वर्ल्ड बा ना हिल्स",
    "pageTitle": "खाद्य भंडारण तापमान और शेल्फ लाइफ खोज प्रणाली - BNC",
    "searchPlaceholder": "खोजें:",
    "all": "सभी",
    "appendix1": "परिशिष्ट 1",
    "appendix2": "परिशिष्ट 2",
    "appendix3": "परिशिष्ट 3",
    "filterGroup": "समूह",
    "filterStorage": "भंडारण",
    "hasRoom": "कमरे के तापमान वाला",
    "hasCool": "1-4°C वाला",
    "hasFreeze": "≤ -18°C वाला",
    "sort": "क्रमबद्ध करें",
    "sortId": "संख्या के अनुसार",
    "sortName": "नाम A-Z",
    "viewGrid": "ग्रिड",
    "viewList": "सूची",
    "colRoom": "कमरे का तापमान",
    "colCool": "1-4°C",
    "colFreeze": "≤ -18°C",
    "colCold": "शीत भंडारण (0-4°C)",
    "colFrozen": "फ्रोज़न (≤-18°C)",
    "colDisplayCool": "प्रदर्शन फ्रिज (1-4°C)",
    "colDisplayHot": "प्रदर्शन वार्मर (30-40°C, उसी दिन)",
    "colWeight": "वज़न",
    "colEnglish": "अंग्रेज़ी नाम",
    "sourcePL3": "Phụ lục 3 – Bảng quy cách bảo quản bánh (đính kèm 03/BNC-MK.09)",
    "noteLabel": "टिप्पणी",
    "emptyNote": "— (मूल फ़ाइल में खाली)",
    "emptyCell": "—",
    "detail": "विवरण",
    "copy": "अंश कॉपी करें",
    "copied": "कॉपी हो गया!",
    "noResultTitle": "कोई परिणाम नहीं",
    "noResultDesc": "छोटा कीवर्ड आज़माएँ या फ़िल्टर बदलें।",
    "resetFilter": "फ़िल्टर रीसेट करें",
    "results": "परिणाम",
    "principle": "यह अंश मूल दस्तावेज़ का स्थान नहीं लेता है। विरोध की स्थिति में, जारी मूल दस्तावेज़ और पैकेजिंग पर निर्माता के निर्देशों को प्राथमिकता दी जाएगी।",
    "detailTitle": "आइटम विवरण",
    "close": "बंद करें",
    "groupLabel": "समूह",
    "displayLabel": "दृश्य",
    "colName": "नाम",
    "colAction": "कार्रवाई",
    "codeLabel": "कोड:",
    "useToday": "आज ही उपयोग करें",
    "originalNote": "मूल टिप्पणी",
    "emptyCellHint": "मूल फ़ाइल में खाली",
    "clearSearch": "खोज साफ़ करें",
    "focusLabel": "फ़ोकस",
    "clearLabel": "साफ़ करें",
    "qaTitle": "QA पुष्टि आवश्यक",
    "excerptLabel": "अंश"
  }
};

export const QA_FLAG_TRANSLATIONS: Record<string, [string, string, string]> = {
  "PL1-65": [
    "CONFLICT IN SOURCE FILE - QA CONFIRMATION NEEDED: Room column says Room temperature, not a number of days. Kept verbatim, do not correct it yourself.",
    "원본 파일의 모순 - QA 확인 필요: 상온 칸에 일수가 아니라 상온이라고 적혀 있습니다. 원문 그대로 두었고 임의로 수정하지 마세요.",
    "मूल फ़ाइल में विरोध - QA पुष्टि आवश्यक: कमरा कॉलम में दिनों की संख्या नहीं, कमरे का तापमान लिखा है। मूल रूप में रखा गया है, खुद ठीक न करें।"
  ],
  "PL1-66": [
    "CONFLICT IN SOURCE FILE - QA CONFIRMATION NEEDED: Room column says 15 days but the note says store in the cooler. Kept verbatim.",
    "원본 파일의 모순 - QA 확인 필요: 상온 칸에 15일이라고 적혀 있지만 비고에는 쿨러에 보관하라고 되어 있습니다. 원문 그대로 두었습니다.",
    "मूल फ़ाइल में विरोध - QA पुष्टि आवश्यक: कमरा कॉलम में 15 दिन लिखा है लेकिन टिप्पणी में कूलर में रखने को कहा गया है। मूल रूप में रखा गया है।"
  ],
  "PL1-67": [
    "CONFLICT IN SOURCE FILE - QA CONFIRMATION NEEDED: Room column says 7 days but the note says store in the cooler. Kept verbatim.",
    "원본 파일의 모순 - QA 확인 필요: 상온 칸에 7일이라고 적혀 있지만 비고에는 쿨러에 보관하라고 되어 있습니다. 원문 그대로 두었습니다.",
    "मूल फ़ाइल में विरोध - QA पुष्टि आवश्यक: कमरा कॉलम में 7 दिन लिखा है लेकिन टिप्पणी में कूलर में रखने को कहा गया है। मूल रूप में रखा गया है।"
  ]
};

export const DURATION_PHRASES: Record<string, [string, string, string]> = {
  "Sử dụng trong ngày": [
    "Use within the day",
    "당일 사용",
    "उसी दिन उपयोग करें"
  ],
  "Nhiệt độ phòng": [
    "Room temperature",
    "상온",
    "कमरे का तापमान"
  ],
  "1 ngày": [
    "1 day",
    "1일",
    "1 दिन"
  ],
  "2 ngày": [
    "2 days",
    "2일",
    "2 दिन"
  ],
  "3 ngày": [
    "3 days",
    "3일",
    "3 दिन"
  ],
  "5 ngày": [
    "5 days",
    "5일",
    "5 दिन"
  ],
  "6 ngày": [
    "6 days",
    "6일",
    "6 दिन"
  ],
  "7 ngày": [
    "7 days",
    "7일",
    "7 दिन"
  ],
  "10 ngày": [
    "10 days",
    "10일",
    "10 दिन"
  ],
  "15 ngày": [
    "15 days",
    "15일",
    "15 दिन"
  ],
  "20 ngày": [
    "20 days",
    "20일",
    "20 दिन"
  ],
  "30 ngày": [
    "30 days",
    "30일",
    "30 दिन"
  ],
  "60 ngày": [
    "60 days",
    "60일",
    "60 दिन"
  ],
  "90 ngày": [
    "90 days",
    "90일",
    "90 दिन"
  ],
  "3-5 ngày": [
    "3-5 days",
    "3-5일",
    "3-5 दिन"
  ],
  "3 - 5 ngày": [
    "3 - 5 days",
    "3 - 5일",
    "3 - 5 दिन"
  ],
  "1 - 2 ngày": [
    "1 - 2 days",
    "1 - 2일",
    "1 - 2 दिन"
  ],
  "05 ngày": [
    "5 days",
    "5일",
    "5 दिन"
  ],
  "07 ngày": [
    "7 days",
    "7일",
    "7 दिन"
  ],
  "1 tháng": [
    "1 month",
    "1개월",
    "1 महीना"
  ],
  "2 tháng": [
    "2 months",
    "2개월",
    "2 महीने"
  ],
  "3 tháng": [
    "3 months",
    "3개월",
    "3 महीने"
  ],
  "6 tháng": [
    "6 months",
    "6개월",
    "6 महीने"
  ],
  "06 tháng": [
    "6 months",
    "6개월",
    "6 महीने"
  ],
  "12 tháng": [
    "12 months",
    "12개월",
    "12 महीने"
  ],
  "1/2 hạn sử dụng còn lại": [
    "1/2 of remaining shelf life",
    "남은 유통기한의 1/2",
    "शेष शेल्फ लाइफ का 1/2"
  ],
  "1/2 hạn sử dụng còn lại của sản phẩm": [
    "1/2 of remaining shelf life of the product",
    "제품 남은 유통기한의 1/2",
    "उत्पाद की शेष शेल्फ लाइफ का 1/2"
  ],
  "1/2 hạn sử dụng còn lại của sản phẩm và tối đa là 30 ngày.": [
    "1/2 of remaining shelf life of the product, max 30 days.",
    "제품 남은 유통기한의 1/2, 최대 30일.",
    "उत्पाद की शेष शेल्फ लाइफ का 1/2, अधिकतम 30 दिन।"
  ],
  "1/4 hạn sử dụng còn lại và tối đa là 30 ngày.": [
    "1/4 of remaining shelf life, max 30 days.",
    "남은 유통기한의 1/4, 최대 30일.",
    "शेष शेल्फ लाइफ का 1/4, अधिकतम 30 दिन।"
  ],
  "1/2 HSD NSX": [
    "1/2 of manufacturer's shelf life",
    "제조사 유통기한의 1/2",
    "निर्माता शेल्फ लाइफ का 1/2"
  ],
  "1/4 HSD NSX": [
    "1/4 of manufacturer's shelf life",
    "제조사 유통기한의 1/4",
    "निर्माता शेल्फ लाइफ का 1/4"
  ],
  "1/2 HSD NSX, tối đa 30 ngày": [
    "1/2 of manufacturer's shelf life, max 30 days",
    "제조사 유통기한의 1/2, 최대 30일",
    "निर्माता शेल्फ लाइफ का 1/2, अधिकतम 30 दिन"
  ],
  "1/4 HSD NSX, tối đa 30 ngày": [
    "1/4 of manufacturer's shelf life, max 30 days",
    "제조사 유통기한의 1/4, 최대 30일",
    "निर्माता शेल्फ लाइफ का 1/4, अधिकतम 30 दिन"
  ],
  "Không có HSD": [
    "No expiry date",
    "유통기한 없음",
    "कोई समाप्ति तिथि नहीं"
  ],
  "Theo NSX": [
    "Per manufacturer",
    "제조사 기준",
    "निर्माता के अनुसार"
  ],
  "1 Viên": [
    "1 scoop",
    "1 스쿱",
    "1 स्कूप"
  ],
  "- San chiết nhỏ qua chai/lọ bảo quản không quá 30 ngày. - Phần còn lại trong bao gốc, phải buộc kín miệng túi, bảo quản trong kho, bảo quản nơi khô ráo thoáng mát": [
    "- Decant a small amount into bottles / jars, store for no more than 30 days. - Keep the rest in the original bag, tie the bag mouth tightly, store in the warehouse, in a cool, dry, well-ventilated place",
    "- 소량을 병 / 용기에 옮겨 담아 30일을 초과하지 않게 보관하세요. - 나머지는 원래 봉지에 두고 봉지 입구를 단단히 묶어 창고의 서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요",
    "- थोड़ी मात्रा बोतलों / जार में निकालकर 30 दिन से अधिक न रखें। - बाकी मूल थैले में रखें, थैले का मुँह कसकर बाँधें, गोदाम में ठंडी, सूखी, हवादार जगह पर रखें"
  ]
};

const DURATION_PHRASES_LOWER: Record<string, [string, string, string]> = Object.fromEntries(
  Object.entries(DURATION_PHRASES).map(([k, v]) => [k.toLowerCase(), v])
);

export function translateDuration(value: string, lang: Lang): string {
  if (lang === 'VI') return value;
  const trimmed = value.trim();
  if (trimmed === '—' || trimmed === '') return '—';
  const direct =
    DURATION_PHRASES[trimmed] || DURATION_PHRASES_LOWER[trimmed.toLowerCase()];
  if (direct) return direct[getLangIndex(lang)];

  const idx = getLangIndex(lang);
  const fmtDay = (h: number) =>
    lang === 'EN' ? (h === 1 ? '1 day' : `${h} days`) : lang === 'KO' ? `${h}일` : `${h} दिन`;
  const fmtMonth = (h: number) =>
    lang === 'EN'
      ? h === 1
        ? '1 month'
        : `${h} months`
      : lang === 'KO'
        ? `${h}개월`
        : h === 1
          ? '1 महीना'
          : `${h} महीने`;
  const fmtHour = (h: number) =>
    lang === 'EN'
      ? h === 1
        ? '1 hour'
        : `${h} hours`
      : lang === 'KO'
        ? `${h}시간`
        : h === 1
          ? '1 घंटा'
          : `${h} घंटे`;
  const fmtWeek = (h: number) =>
    lang === 'EN'
      ? h === 1
        ? '1 week'
        : `${h} weeks`
      : lang === 'KO'
        ? `${h}주`
        : h === 1
          ? '1 सप्ताह'
          : `${h} सप्ताह`;
  const fmtYear = (h: number) =>
    lang === 'EN'
      ? h === 1
        ? '1 year'
        : `${h} years`
      : lang === 'KO'
        ? `${h}년`
        : h === 1
          ? '1 वर्ष'
          : `${h} वर्ष`;
  const fmtMinute = (h: number) =>
    lang === 'EN'
      ? h === 1
        ? '1 minute'
        : `${h} minutes`
      : lang === 'KO'
        ? `${h}분`
        : h === 1
          ? '1 मिनट'
          : `${h} मिनट`;

  let out = trimmed;
  out = out.replace(/Sử dụng trong ngày/gi, DURATION_PHRASES['Sử dụng trong ngày'][idx]);
  out = out.replace(/Nhiệt độ phòng/gi, DURATION_PHRASES['Nhiệt độ phòng'][idx]);
  out = out.replace(
    /1\/2 hạn sử dụng còn lại của sản phẩm/gi,
    DURATION_PHRASES['1/2 hạn sử dụng còn lại của sản phẩm'][idx]
  );
  out = out.replace(
    /1\/2 hạn sử dụng còn lại/gi,
    DURATION_PHRASES['1/2 hạn sử dụng còn lại'][idx]
  );
  out = out.replace(
    /1\/4 hạn sử dụng còn lại/gi,
    lang === 'EN'
      ? '1/4 of remaining shelf life'
      : lang === 'KO'
        ? '남은 유통기한의 1/4'
        : 'शेष शेल्फ लाइफ का 1/4'
  );
  out = out.replace(/1\/2 HSD NSX/gi, DURATION_PHRASES['1/2 HSD NSX'][idx]);
  out = out.replace(/1\/4 HSD NSX/gi, DURATION_PHRASES['1/4 HSD NSX'][idx]);
  out = out.replace(/Không có HSD/gi, DURATION_PHRASES['Không có HSD'][idx]);
  out = out.replace(/Theo NSX/gi, DURATION_PHRASES['Theo NSX'][idx]);
  out = out.replace(
    /San chiết nhỏ qua chai\/lọ bảo quản không quá/gi,
    lang === 'EN'
      ? 'Decant a small amount into bottles / jars, store for no more than'
      : lang === 'KO'
        ? '소량을 병 / 용기에 옮겨 담아 초과하지 않게 보관'
        : 'थोड़ी मात्रा बोतलों / जार में निकालकर से अधिक न रखें'
  );
  out = out.replace(
    /Phần còn lại trong bao gốc, phải buộc kín miệng túi, bảo quản trong kho, bảo quản nơi khô ráo thoáng mát/gi,
    lang === 'EN'
      ? 'Keep the rest in the original bag, tie the bag mouth tightly, store in the warehouse, in a cool, dry, well-ventilated place'
      : lang === 'KO'
        ? '나머지는 원래 봉지에 두고 봉지 입구를 단단히 묶어 창고의 서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요'
        : 'बाकी मूल थैले में रखें, थैले का मुँह कसकर बाँधें, गोदाम में ठंडी, सूखी, हवादार जगह पर रखें'
  );
  out = out.replace(
    /Bảo quản nơi khô ráo thoáng mát/gi,
    lang === 'EN'
      ? 'Store in a cool, dry, well-ventilated place'
      : lang === 'KO'
        ? '서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요'
        : 'ठंडी, सूखी, हवादार जगह पर रखें'
  );
  out = out.replace(
    /Bảo quản trong tủ mát/gi,
    lang === 'EN'
      ? 'Store in the cooler'
      : lang === 'KO'
        ? '쿨러에 보관하세요'
        : 'कूलर में रखें'
  );
  out = out.replace(
    /Bảo quản trong tủ lạnh/gi,
    lang === 'EN'
      ? 'Store in the fridge'
      : lang === 'KO'
        ? '냉장고에 보관하세요'
        : 'फ्रिज में रखें'
  );
  out = out.replace(
    /Bảo quản lạnh/gi,
    lang === 'EN'
      ? 'Store refrigerated'
      : lang === 'KO'
        ? '냉장 보관'
        : 'फ्रिज में रखें'
  );
  out = out.replace(
    /HSD/gi,
    lang === 'EN' ? 'expiry date' : lang === 'KO' ? '유통기한' : 'समाप्ति तिथि'
  );
  out = out.replace(
    /NSX/gi,
    lang === 'EN' ? 'manufacturer' : lang === 'KO' ? '제조사' : 'निर्माता'
  );
  out = out.replace(
    /và tối đa là/gi,
    lang === 'EN' ? ', max ' : lang === 'KO' ? ', 최대 ' : ' , अधिकतम '
  );
  out = out.replace(
    /tối đa/gi,
    lang === 'EN' ? 'max' : lang === 'KO' ? '최대' : 'अधिकतम'
  );
  out = out.replace(/(\d+)\s*-\s*(\d+)\s*ngày/gi, (_m, w, c) =>
    lang === 'EN'
      ? `${Number(w)} - ${Number(c)} days`
      : lang === 'KO'
        ? `${Number(w)} - ${Number(c)}일`
        : `${Number(w)} - ${Number(c)} दिन`
  );
  out = out.replace(/(\d+)\s*ngày/gi, (_m, w) => fmtDay(Number(w)));
  out = out.replace(/(\d+)\s*tháng/gi, (_m, w) => fmtMonth(Number(w)));
  out = out.replace(/(\d+)\s*giờ/gi, (_m, w) => fmtHour(Number(w)));
  out = out.replace(/(\d+)\s*tuần/gi, (_m, w) => fmtWeek(Number(w)));
  out = out.replace(/(\d+)\s*năm/gi, (_m, w) => fmtYear(Number(w)));
  out = out.replace(/(\d+)\s*phút/gi, (_m, w) => fmtMinute(Number(w)));
  return out;
}

export const GROUP_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  "I. Các loại bánh, chè, bơ sữa, trái cây nước trái cây": {
    "VI": "I. Các loại bánh, chè, bơ sữa, trái cây nước trái cây",
    "EN": "I. Assorted cakes, che, butter, milk, fruit & fruit juice",
    "KO": "I. 각종 케이크, 체, 버터, 우유, 과일 및 과일 주스",
    "HI": "I. विभिन्न केक, चे, मक्खन, दूध, फल और फलों का रस"
  },
  "II. Các loại sốt (Tự chế biến)": {
    "VI": "II. Các loại sốt (Tự chế biến)",
    "EN": "II. Assorted sauces (Homemade)",
    "KO": "II. 각종 소스 (자가제조)",
    "HI": "II. विभिन्न सॉस (घर पर बने)"
  },
  "III. Thịt gia súc tươi và các nguyên liệu từ thịt": {
    "VI": "III. Thịt gia súc tươi và các nguyên liệu từ thịt",
    "EN": "III. Fresh livestock meat and meat-derived ingredients",
    "KO": "III. 신선한 가축 고기 및 육류 원료",
    "HI": "III. ताज़ा पशु मांस और मांस से बने कच्चे माल"
  },
  "IV. Thịt gia súc đã chế biến": {
    "VI": "IV. Thịt gia súc đã chế biến",
    "EN": "IV. Processed Livestock Meat",
    "KO": "IV. 가공된 가축 고기",
    "HI": "IV. प्रसंस्कृत पशु मांस"
  },
  "V. Thịt gia cầm tươi": {
    "VI": "V. Thịt gia cầm tươi",
    "EN": "V. Fresh Poultry",
    "KO": "V. 신선한 가금류",
    "HI": "V. ताज़ा मुर्गी"
  },
  "VI. Thủy sản tươi": {
    "VI": "VI. Thủy sản tươi",
    "EN": "VI. Fresh Seafood",
    "KO": "VI. 신선한 수산물",
    "HI": "VI. ताज़ा समुद्री भोजन"
  },
  "VII. Các sản phẩm chế biến từ thủy sản": {
    "VI": "VII. Các sản phẩm chế biến từ thủy sản",
    "EN": "VII. Assorted processed seafood products",
    "KO": "VII. 각종 가공 수산물",
    "HI": "VII. विभिन्न प्रसंस्कृत समुद्री भोजन उत्पाद"
  },
  "VIII. Các món khác": {
    "VI": "VIII. Các món khác",
    "EN": "VIII. Other Items",
    "KO": "VIII. 기타",
    "HI": "VIII. अन्य आइटम"
  },
  "I. Các loại thức uống pha sẵn và nguyên vật liệu": {
    "VI": "I. Các loại thức uống pha sẵn và nguyên vật liệu",
    "EN": "I. Assorted ready-made drinks & ingredients",
    "KO": "I. 각종 즉석 음료 및 재료",
    "HI": "I. विभिन्न तैयार पेय और सामग्री"
  },
  "II. Nguyên vật liệu khô": {
    "VI": "II. Nguyên vật liệu khô",
    "EN": "II. Dry Ingredients",
    "KO": "II. 건조 재료",
    "HI": "II. सूखी सामग्री"
  },
  "PL3 - BREAD / BÁNH MỲ": {
    "VI": "PL3 - BREAD / BÁNH MỲ",
    "EN": "PL3 - BREAD",
    "KO": "PL3 - 브레드",
    "HI": "PL3 - ब्रेड"
  },
  "PL3 - THE VIENNOISERIE / BÁNH CÁN": {
    "VI": "PL3 - THE VIENNOISERIE / BÁNH CÁN",
    "EN": "PL3 - VIENNOISERIE",
    "KO": "PL3 - 비에누아즈리",
    "HI": "PL3 - विएनोइसरी"
  },
  "PL3 - BISCUITS / BÁNH QUY": {
    "VI": "PL3 - BISCUITS / BÁNH QUY",
    "EN": "PL3 - BISCUITS",
    "KO": "PL3 - 비스킷",
    "HI": "PL3 - बिस्कुट"
  },
  "PL3 - THE PASTRIES / BÁNH NGỌT": {
    "VI": "PL3 - THE PASTRIES / BÁNH NGỌT",
    "EN": "PL3 - PASTRIES",
    "KO": "PL3 - 페이스트리",
    "HI": "PL3 - पेस्ट्री"
  },
  "PL3 - ICE CREAM / KEM VIÊN": {
    "VI": "PL3 - ICE CREAM / KEM VIÊN",
    "EN": "PL3 - ICE CREAM",
    "KO": "PL3 - 아이스크림",
    "HI": "PL3 - आइसक्रीम"
  },
  "PL3 - SAVORY / BÁNH MẶN": {
    "VI": "PL3 - SAVORY / BÁNH MẶN",
    "EN": "PL3 - SAVORY",
    "KO": "PL3 - 세이보리",
    "HI": "PL3 - नमकीन"
  }
};

export const translateGroup = (group: string, lang: Lang): string =>
  GROUP_TRANSLATIONS[group]?.[lang] || group;

export const ITEM_NAME_TRANSLATIONS: Record<string, [string, string, string]> = {
  "PL1-01": [
    "Baked breakfast pastries",
    "구운 아침 페이스트리",
    "बेक्ड नाश्ता पेस्ट्री"
  ],
  "PL1-02": [
    "Assorted pastries",
    "각종 페이스트리",
    "विभिन्न पेस्ट्री"
  ],
  "PL1-03": [
    "Assorted breads",
    "각종 빵",
    "विभिन्न ब्रेड"
  ],
  "PL1-04": [
    "Chocolate decor",
    "초콜릿 데코",
    "चॉकलेट सजावट"
  ],
  "PL1-05": [
    "Garlic butter bread",
    "마늘 버터 빵",
    "लहसुन मक्खन ब्रेड"
  ],
  "PL1-06": [
    "Pizza bases",
    "피자 도우",
    "पिज्जा बेस"
  ],
  "PL1-07": [
    "Macarons",
    "마카롱",
    "मैकरॉन"
  ],
  "PL1-08": [
    "Baked biscuits",
    "구운 비스킷",
    "बेक्ड बिस्कुट"
  ],
  "PL1-09": [
    "Cooked che",
    "조리된 체",
    "पका हुआ चे"
  ],
  "PL1-10": [
    "Prepped ingredients for che",
    "체 조리용 손질 재료",
    "चे पकाने के लिए तैयार सामग्री"
  ],
  "PL1-11": [
    "Crouton bread",
    "크루통 빵",
    "क्राउटन ब्रेड"
  ],
  "PL1-12": [
    "Cooked sugar syrup, cooled",
    "조리 후 식힌 설탕 시럽",
    "पकाया और ठंडा किया चीनी सिरप"
  ],
  "PL1-13": [
    "Opened / cut butter; opened / cut cheese",
    "개봉 / 절단한 버터; 개봉 / 절단한 치즈",
    "खुला / कटा मक्खन; खुला / कटा पनीर"
  ],
  "PL1-14": [
    "Opened flour",
    "개봉한 밀가루",
    "खुला आटा"
  ],
  "PL1-15": [
    "Opened fresh milk",
    "개봉한 우유",
    "खुला ताजा दूध"
  ],
  "PL1-16": [
    "Waffle pancake batter",
    "와플 팬케이크 반죽",
    "वफ़ल पैनकेक बैटर"
  ],
  "PL1-17": [
    "Rice noodles, vermicelli, hoi cake, chung cake, it cake, gai cake",
    "쌀국수, 분, 호이 케이크, 쯩 케이크, 잇 케이크, 가이 케이크",
    "चावल नूडल्स, सेवई, होई केक, चुंग केक, इत केक, गाई केक"
  ],
  "PL1-18": [
    "Croissant, puff pastry dough",
    "크루아상, 퍼프 페이스트리 도우",
    "क्रोइसैन, पफ पेस्ट्री आटा"
  ],
  "PL1-19": [
    "Opened canned fruit",
    "개봉한 통조림 과일",
    "खुले डिब्बाबंद फल"
  ],
  "PL1-20": [
    "Creme brulee, caramel custard",
    "크렘 브륄레, 카라멜 커스터드",
    "क्रेम ब्रूले, कैरमल कस्टर्ड"
  ],
  "PL1-21": [
    "Opened topping, whipping cream",
    "개봉한 토핑, 휘핑크림",
    "खुली टॉपिंग, व्हिपिंग क्रीम"
  ],
  "PL1-22": [
    "Pesto sauce",
    "페스토 소스",
    "पेस्टो सॉस"
  ],
  "PL1-23": [
    "Caesar",
    "시저",
    "सीज़र"
  ],
  "PL1-24": [
    "Balsamic dressing",
    "발사믹 드레싱",
    "बाल्समिक ड्रेसिंग"
  ],
  "PL1-25": [
    "Italian dressing",
    "이탈리안 드레싱",
    "इटालियन ड्रेसिंग"
  ],
  "PL1-26": [
    "Mustard sauce",
    "머스타드 소스",
    "सरसों सॉस"
  ],
  "PL1-27": [
    "Bean stew sauce",
    "콩 스튜 소스",
    "बीन स्टू सॉस"
  ],
  "PL1-28": [
    "Thousand sauce",
    "사우전드 소스",
    "थाउज़ेंड सॉस"
  ],
  "PL1-29": [
    "Seafood tomato sauce",
    "해산물 토마토 소스",
    "समुद्री भोजन टमाटर सॉस"
  ],
  "PL1-30": [
    "Tomato sauce",
    "토마토 소스",
    "टमाटर सॉस"
  ],
  "PL1-31": [
    "BBQ sauce",
    "BBQ 소스",
    "BBQ सॉस"
  ],
  "PL1-32": [
    "Minced beef sauce",
    "다진 소고기 소스",
    "कीमा बीफ़ सॉस"
  ],
  "PL1-33": [
    "Mixed fish sauce",
    "혼합 피시 소스",
    "मिली हुई फिश सॉस"
  ],
  "PL1-34": [
    "Fresh beef, veal, pork",
    "신선한 소고기, 송아지, 돼지고기",
    "ताजा बीफ़, बछड़ा, सूअर का मांस"
  ],
  "PL1-35": [
    "Assorted marrow bones",
    "각종 골수 뼈",
    "विभिन्न मज्जा हड्डियाँ"
  ],
  "PL1-36": [
    "Opened canned meat",
    "개봉한 통조림 고기",
    "खुला डिब्बाबंद मांस"
  ],
  "PL1-37": [
    "Cooked meat dishes",
    "조리된 고기 요리",
    "पके हुए मांस व्यंजन"
  ],
  "PL1-38": [
    "Assorted stocks",
    "각종 육수",
    "विभिन्न शोरबा"
  ],
  "PL1-39": [
    "Whole chicken, duck, cut into pieces",
    "통닭, 오리, 절단",
    "साबुत मुर्गी, बत्तख, टुकड़ों में कटा"
  ],
  "PL1-40": [
    "Stewed, braised dishes",
    "찜, 조림 요리",
    "स्टू, ब्रेज़्ड व्यंजन"
  ],
  "PL1-41": [
    "Smoked meats, chicken, duck breast",
    "훈제 고기, 닭, 오리 가슴살",
    "स्मोक्ड मांस, मुर्गी, बत्तख ब्रेस्ट"
  ],
  "PL1-42": [
    "Seasoned fresh seafood",
    "양념한 신선한 해산물",
    "मसालेदार ताजा समुद्री भोजन"
  ],
  "PL1-43": [
    "Fresh seafood",
    "신선한 해산물",
    "ताजा समुद्री भोजन"
  ],
  "PL1-44": [
    "Opened canned fish",
    "개봉한 통조림 생선",
    "खुली डिब्बाबंद मछली"
  ],
  "PL1-45": [
    "Cooked bivalve molluscs (clams, mussels...)",
    "조리된 이매패류(조개, 홍합...)",
    "पके हुए द्विकपाटी मोलस्क (क्लैम, मसल...)"
  ],
  "PL1-46": [
    "Steamed, boiled, cooked crab, shrimp, fish",
    "찜, 삶음, 조리한 게, 새우, 생선",
    "भाप, उबला, पका केकड़ा, झींगा, मछली"
  ],
  "PL1-47": [
    "Smoked seafood (salmon, mackerel, eel...) sliced (vacuum pack opened)",
    "훈제 해산물(연어, 고등어, 장어...) 슬라이스(진공포장 개봉)",
    "स्मोक्ड समुद्री भोजन (सैल्मन, मैकेरल, ईल...) कटा हुआ (वैक्यूम पैक खुला)"
  ],
  "PL1-48": [
    "Wet rice flour",
    "습식 쌀가루",
    "गीला चावल का आटा"
  ],
  "PL1-49": [
    "Roasted nuts (peanuts, cashews, almonds, sesame...)",
    "볶은 견과류(땅콩, 캐슈, 아몬드, 참깨...)",
    "भुने मेवे (मूंगफली, काजू, बादाम, तिल...)"
  ],
  "PL1-50": [
    "Tofu blocks from supplier",
    "공급업체 두부",
    "आपूर्तिकर्ता से टोफू ब्लॉक"
  ],
  "PL1-51": [
    "House-made tofu",
    "자가제조 두부",
    "घर पर बना टोफू"
  ],
  "PL1-52": [
    "Dried goods (mung beans, noodles, vermicelli...) after opening",
    "개봉 후 건조 식품(녹두, 면, 당면...)",
    "खोलने के बाद सूखी वस्तुएँ (मूंग, नूडल्स, सेवई...)"
  ],
  "PL1-53": [
    "Shelled eggs",
    "껍질 깐 달걀",
    "छिले अंडे"
  ],
  "PL1-54": [
    "Boiled eggs",
    "삶은 달걀",
    "उबले अंडे"
  ],
  "PL1-55": [
    "Food colouring after opening",
    "개봉 후 식용 색소",
    "खोलने के बाद खाद्य रंग"
  ],
  "PL1-56": [
    "Syrup after opening",
    "개봉 후 시럽",
    "खोलने के बाद सिरप"
  ],
  "PL1-57": [
    "Sliced salmon, tuna sashimi... awaiting service",
    "제공 대기 중인 연어, 참치 사시미 슬라이스",
    "परोसने की प्रतीक्षा में कटा सैल्मन, टूना सशिमी"
  ],
  "PL1-58": [
    "Sliced cold cuts",
    "슬라이스한 콜드컷",
    "कटी हुई कोल्ड कट"
  ],
  "PL1-59": [
    "Cold cuts after opening",
    "개봉 후 콜드컷",
    "खोलने के बाद कोल्ड कट"
  ],
  "PL1-60": [
    "Prepped vegetables",
    "손질한 채소",
    "तैयार सब्जियाँ"
  ],
  "PL1-61": [
    "Cooked vegetables",
    "조리된 채소",
    "पकी सब्जियाँ"
  ],
  "PL1-62": [
    "Mayonnaise and other sauces after opening",
    "개봉 후 마요네즈 및 기타 소스",
    "खोलने के बाद मेयोनेज़ और अन्य सॉस"
  ],
  "PL1-63": [
    "Sliced soft cheese, hard cheese, sliced butter",
    "슬라이스한 소프트 치즈, 하드 치즈, 버터",
    "कटी नरम पनीर, सख्त पनीर, मक्खन"
  ],
  "PL1-64": [
    "Jam and peanut butter after opening",
    "개봉 후 잼 및 땅콩버터",
    "खोलने के बाद जैम और मूंगफली मक्खन"
  ],
  "PL1-65": [
    "Opened alcoholic drinks",
    "개봉한 주류",
    "खुले मादक पेय"
  ],
  "PL1-66": [
    "Opened ketchup, chilli sauce",
    "개봉한 케첩, 칠리 소스",
    "खुला केचप, चिली सॉस"
  ],
  "PL1-67": [
    "Opened mustard",
    "개봉한 머스타드",
    "खुली सरसों"
  ],
  "PL1-68": [
    "Pickled vegetables (mustard greens, eggplant, shallots)",
    "절임 채소(갓, 가지, 샬롯)",
    "अचार वाली सब्जियाँ (सरसों साग, बैंगन, शैलोट)"
  ],
  "PL1-69": [
    "Opened cooking seasonings (salt, sugar, MSG, seasoning powder...)",
    "개봉 후 조리 양념(소금, 설탕, MSG, 조미료...)",
    "खोलने के बाद पकाने के मसाले (नमक, चीनी, MSG, मसाला पाउडर...)"
  ],
  "PL2-01": [
    "Ready-made drinks (milk tea, black tea, winter melon tea, nut milk, drip coffee, homemade jelly, pearls...)",
    "즉석 음료(밀크티, 홍차, 동과차, 견과 우유, 드립 커피, 자가제조 젤리, 펄...)",
    "तैयार पेय (मिल्क टी, ब्लैक टी, विंटर मेलन टी, नट मिल्क, ड्रिप कॉफ़ी, घर का जेली, मोती...)"
  ],
  "PL2-02": [
    "Freshly squeezed fruit juices",
    "갓 짠 과일 주스",
    "ताज़ा निचोड़ा फलों का रस"
  ],
  "PL2-03": [
    "Fresh fruit",
    "신선한 과일",
    "ताजा फल"
  ],
  "PL2-04": [
    "Cut / prepped fruit",
    "절단 / 손질한 과일",
    "कटा / तैयार फल"
  ],
  "PL2-05": [
    "Frozen, canned ingredients (coconut cream, cherry, chickpeas, lemon juice, orange juice...)",
    "냉동, 통조림 재료(코코넛 크림, 체리, 병아리콩, 레몬즙, 오렌지즙...)",
    "जमे, डिब्बाबंद सामग्री (नारियल क्रीम, चेरी, चना, नींबू रस, संतरा रस...)"
  ],
  "PL2-06": [
    "Bottled syrup, concentrated fruit juice (Morin, Sunquick...)",
    "병입 시럽, 농축 과일 주스(Morin, Sunquick...)",
    "बोतलबंद सिरप, सांद्र फलों का रस (Morin, Sunquick...)"
  ],
  "PL2-07": [
    "Homemade syrup",
    "자가제조 시럽",
    "घर का बना सिरप"
  ],
  "PL2-08": [
    "Condensed milk",
    "연유",
    "गाढ़ा दूध"
  ],
  "PL2-09": [
    "Fresh milk, full-cream milk, fresh cream...",
    "우유, 전지 우유, 생크림...",
    "ताजा दूध, फुल-क्रीम दूध, ताजा क्रीम..."
  ],
  "PL2-10": [
    "Sun Kraftbeer (Kegs)",
    "선 크래프트비어(케그)",
    "सन क्राफ्टबीयर (केग्स)"
  ],
  "PL2-11": [
    "Sun Kraftbeer (Cans)",
    "선 크래프트비어(캔)",
    "सन क्राफ्टबीयर (कैन)"
  ],
  "PL2-12": [
    "Spirits",
    "증류주",
    "स्पिरिट"
  ],
  "PL2-13": [
    "Liqueur",
    "리큐어",
    "लिकर"
  ],
  "PL2-14": [
    "Red wine",
    "레드 와인",
    "रेड वाइन"
  ],
  "PL2-15": [
    "White wine",
    "화이트 와인",
    "व्हाइट वाइन"
  ],
  "PL2-16": [
    "Tea and dried herbs (black tea, green tea, oolong, tea bags, herbal tea, matcha...)",
    "차 및 건조 허브(홍차, 녹차, 우롱, 티백, 허브차, 말차...)",
    "चाय और सूखी जड़ी-बूटियाँ (ब्लैक टी, ग्रीन टी, ऊलोंग, टी बैग, हर्बल टी, माचा...)"
  ],
  "PL2-17": [
    "Coffee, cocoa, chocolate (coffee beans, coffee powder, cocoa powder, chocolate powder...)",
    "커피, 코코아, 초콜릿(원두, 커피 가루, 코코아 가루, 초콜릿 가루...)",
    "कॉफ़ी, कोको, चॉकलेट (कॉफ़ी बीन्स, कॉफ़ी पाउडर, कोको पाउडर, चॉकलेट पाउडर...)"
  ],
  "PL2-18": [
    "Dry topping ingredients, milk powder, creamer, sweeteners, whipping cream powder, jelly powder, gelatin, agar, sugar, flour...",
    "건조 토핑 재료, 분유, 크리머, 감미료, 휘핑크림 가루, 젤리 가루, 젤라틴, 한천, 설탕, 밀가루...",
    "सूखी टॉपिंग सामग्री, दूध पाउडर, क्रीमर, मिठास, व्हिपिंग क्रीम पाउडर, जेली पाउडर, जिलेटिन, अगर, चीनी, आटा..."
  ],
  "PL2-19": [
    "Dried fruit, cereals and dried nuts (dried orange, lemon, apple, strawberry, almonds, walnuts, oats, roasted brown rice...)",
    "건조 과일, 곡물 및 건조 견과류(건조 오렌지, 레몬, 사과, 딸기, 아몬드, 호두, 오트, 볶은 현미...)",
    "सूखे फल, अनाज और सूखे मेवे (सूखा संतरा, नींबू, सेब, स्ट्रॉबेरी, बादाम, अखरोट, ओट्स, भुना ब्राउन राइस...)"
  ],
  "PL3-01": [
    "Malesherbes Baguette",
    "말제르브 바게트",
    "मालज़ेर्ब बैगेट"
  ],
  "PL3-02": [
    "Whole wheat bread",
    "통밀 빵",
    "साबुत गेहूं ब्रेड"
  ],
  "PL3-03": [
    "Cereals breads",
    "곡물 빵",
    "अनाज ब्रेड"
  ],
  "PL3-04": [
    "Fig Bread",
    "무화과 빵",
    "अंजीर ब्रेड"
  ],
  "PL3-05": [
    "Ciabatta",
    "치아바타",
    "चियाबाटा"
  ],
  "PL3-06": [
    "Cheese bread",
    "치즈 빵",
    "चीज़ ब्रेड"
  ],
  "PL3-48": [
    "White Sandwich 1200gr",
    "화이트 샌드위치 1200g",
    "सफेद सैंडविच 1200g"
  ],
  "PL3-49": [
    "Brown Sandwich 1200gr",
    "브라운 샌드위치 1200g",
    "भूरी सैंडविच 1200g"
  ],
  "PL3-50": [
    "Whole Wheat Sandwich 1200gr",
    "통밀 샌드위치 1200g",
    "साबुत गेहूं सैंडविच 1200g"
  ],
  "PL3-07": [
    "Raisins Danish",
    "건포도 데니시",
    "किशमिश डेनिश"
  ],
  "PL3-08": [
    "Plie Chocolate",
    "초콜릿 플리에",
    "चॉकलेट प्ली"
  ],
  "PL3-09": [
    "Vienoise chocolate",
    "초콜릿 비에누아즈",
    "चॉकलेट विएनोइस"
  ],
  "PL3-10": [
    "Croissant",
    "크로아상",
    "क्रोइसैन"
  ],
  "PL3-11": [
    "Pain au chocolate",
    "팡 오 쇼콜라",
    "पैन ओ चॉकलेट"
  ],
  "PL3-12": [
    "Apple Turnover",
    "애플 턴오버",
    "ऐप्पल टर्नओवर"
  ],
  "PL3-13": [
    "Almond croissant",
    "아몬드 크로아상",
    "बादाम क्रोइसैन"
  ],
  "PL3-14": [
    "Panin au chocolate almond",
    "아몬드 초콜릿 크로아상",
    "बादाम चॉकलेट क्रोइसैन"
  ],
  "PL3-15": [
    "Dark chocolate & pecan cookie",
    "다크 초콜릿 피칸 쿠키",
    "डार्क चॉकलेट पेकान कुकी"
  ],
  "PL3-16": [
    "White chocolate & macadamia cookie",
    "화이트 초콜릿 마카다미아 쿠키",
    "व्हाइट चॉकलेट मैकाडामिया कुकी"
  ],
  "PL3-17": [
    "Financiers",
    "피낭시에",
    "फिनांसिए"
  ],
  "PL3-18": [
    "Basque cake",
    "바스크 케이크",
    "बास्क केक"
  ],
  "PL3-19": [
    "Brownie",
    "브라우니",
    "ब्राउनी"
  ],
  "PL3-20": [
    "Cannele",
    "카늘레",
    "कैनेले"
  ],
  "PL3-21": [
    "Macaron",
    "마카롱",
    "मैकरॉन"
  ],
  "PL3-22": [
    "Coffee éclair",
    "커피 에클레어",
    "कॉफ़ी एक्लेयर"
  ],
  "PL3-23": [
    "Chocolate éclair",
    "초콜릿 에클레어",
    "चॉकलेट एक्लेयर"
  ],
  "PL3-24": [
    "Paris Ba Na Hills",
    "파리-바나힐스 파리브레스트",
    "पेरिस-बाना हिल्स पेरिस-ब्रेस्ट"
  ],
  "PL3-25": [
    "Lemon tart",
    "레몬 타르트",
    "नींबू टार्ट"
  ],
  "PL3-26": [
    "Crème Brule",
    "크렘 브륄레",
    "क्रेम ब्रूले"
  ],
  "PL3-27": [
    "Plan",
    "플랑",
    "फ्लान"
  ],
  "PL3-28": [
    "Choux Praliné Pistache",
    "피스타치오 프랄리네 슈",
    "पिस्ता प्रालिने शू"
  ],
  "PL3-29": [
    "Chocolate Entremets",
    "초콜릿 앙트르메",
    "चॉकलेट एंट्रेमेट"
  ],
  "PL3-30": [
    "Tart Almond Peach",
    "복숭아 아몬드 타르트",
    "आड़ू बादाम टार्ट"
  ],
  "PL3-31": [
    "Tatin",
    "타탱",
    "टैटिन"
  ],
  "PL3-32": [
    "Raspberry éclair",
    "라즈베리 에클레어",
    "रास्पबेरी एक्लेयर"
  ],
  "PL3-33": [
    "Saint honore",
    "생토노레",
    "सेंट ऑनोरे"
  ],
  "PL3-34": [
    "Mille feuille",
    "밀푀유",
    "मिल-फ़्यूइ"
  ],
  "PL3-35": [
    "Icream Vanilla 60gr",
    "바닐라 아이스크림 60g",
    "वैनिला आइसक्रीम 60g"
  ],
  "PL3-36": [
    "Icream Coconut 60gr",
    "코코넛 아이스크림 60g",
    "नारियल आइसक्रीम 60g"
  ],
  "PL3-37": [
    "Icream Pistachio 60gr",
    "피스타치오 아이스크림 60g",
    "पिस्ता आइसक्रीम 60g"
  ],
  "PL3-38": [
    "Icream Mango 60gr",
    "망고 아이스크림 60g",
    "आम आइसक्रीम 60g"
  ],
  "PL3-39": [
    "Icream Strawberry 60gr",
    "딸기 아이스크림 60g",
    "स्ट्रॉबेरी आइसक्रीम 60g"
  ],
  "PL3-40": [
    "Icream Chocolate 60gr",
    "초콜릿 아이스크림 60g",
    "चॉकलेट आइसक्रीम 60g"
  ],
  "PL3-41": [
    "Icream Blueberry 60gr",
    "블루베리 아이스크림 60g",
    "ब्लूबेरी आइसक्रीम 60g"
  ],
  "PL3-42": [
    "Icream Pineapple 60gr",
    "파인애플 아이스크림 60g",
    "अनानास आइसक्रीम 60g"
  ],
  "PL3-43": [
    "Icream Apricots 60gr",
    "살구 아이스크림 60g",
    "खुबानी आइसक्रीम 60g"
  ],
  "PL3-44": [
    "Icream Blackcurrants 60gr",
    "블랙커런트 아이스크림 60g",
    "काली करौंदा आइसक्रीम 60g"
  ],
  "PL3-45": [
    "Icream Vanilla Red Bean 60gr",
    "바닐라 팥 아이스크림 60g",
    "वैनिला लाल बीन आइसक्रीम 60g"
  ],
  "PL3-46": [
    "Icream Matcha 60gr",
    "말차 아이스크림 60g",
    "माचा आइसक्रीम 60g"
  ],
  "PL3-47": [
    "Icream Black Sesame 60gr",
    "흑임자 아이스크림 60g",
    "काला तिल आइसक्रीम 60g"
  ],
  "PL3-51": [
    "Ham Cheese Croissant 120gr",
    "햄 치즈 크로아상 120g",
    "हैम चीज़ क्रोइसैन 120g"
  ],
  "PL3-52": [
    "Bacon Cheese Egg Croissant 150gr",
    "베이컨 치즈 에그 크로아상 150g",
    "बेकन चीज़ अंडा क्रोइसैन 150g"
  ],
  "PL3-53": [
    "Ham Cheese Sandwich 150gr",
    "햄 치즈 샌드위치 150g",
    "हैम चीज़ सैंडविच 150g"
  ],
  "PL3-54": [
    "Club Mini Sandwich 80gr",
    "클럽 미니 샌드위치 80g",
    "क्लब मिनी सैंडविच 80g"
  ],
  "PL3-55": [
    "Club Sandwich 160gr",
    "클럽 샌드위치 160g",
    "क्लब सैंडविच 160g"
  ],
  "PL3-56": [
    "Caprese Sourdough Toast 160gr",
    "카프레제 사워도우 토스트 160g",
    "कैप्रेज़े सॉरडो टोस्ट 160g"
  ],
  "PL3-57": [
    "Smoked Salmon Bagel 150gr",
    "훈제 연어 베이글 150g",
    "स्मोक्ड सैल्मन बैगेल 150g"
  ]
};

export const ITEM_NOTE_TRANSLATIONS: Record<string, [string, string, string]> = {
  "PL1-01": [
    "Store in fridge (1-4°C) for 3-5 days --> make bread butter pudding",
    "냉장고(1-4°C)에 3-5일 보관 --> 브레드 버터 푸딩으로 만들기",
    "फ्रिज (1-4°C) में 3-5 दिन रखें --> ब्रेड बटर पुडिंग बनाएँ"
  ],
  "PL1-02": [
    "Do not reuse after serving on buffet",
    "뷔페에 진열한 후 재사용 금지",
    "बुफे पर परोसने के बाद पुनः उपयोग न करें"
  ],
  "PL1-11": [
    "- Keep in a sealed container",
    "- 밀폐 용기에 보관",
    "- सीलबंद डिब्बे में रखें"
  ],
  "PL1-13": [
    "- Follow the manufacturer recommendation if stated on the packaging.",
    "- 포장에 기재된 경우 제조사 권장사항을 따르세요.",
    "- पैकेजिंग पर लिखा हो तो निर्माता की सिफारिश का पालन करें।"
  ],
  "PL1-14": [
    "- Follow the manufacturer recommendation (if any).",
    "- 제조사 권장사항(있는 경우)을 따르세요.",
    "- निर्माता की सिफारिश (यदि कोई हो) का पालन करें।"
  ],
  "PL1-15": [
    "- When storing, wrap or close the lid tightly so moisture does not enter the product.",
    "- 보관 시 수분이 제품에 들어가지 않도록 포장하거나 뚜껑을 단단히 닫으세요.",
    "- भंडारण करते समय नमी उत्पाद में न जाए, इसलिए लपेटें या ढक्कन कसकर बंद करें।"
  ],
  "PL1-21": [
    "- Follow the manufacturer instructions on the packaging first.",
    "- 먼저 포장에 기재된 제조사 지침을 따르세요.",
    "- पहले पैकेजिंग पर निर्माता के निर्देशों का पालन करें।"
  ],
  "PL1-36": [
    "- Follow the manufacturer recommendation if stated on the packaging. Note: Transfer to other containers for storage; do not keep in the metal can.",
    "- 포장에 기재된 경우 제조사 권장사항을 따르세요. 참고: 보관 시 다른 용기에 옮기세요. 금속 캔에 그대로 두지 마세요.",
    "- पैकेजिंग पर लिखा हो तो निर्माता की सिफारिश का पालन करें। ध्यान दें: भंडारण के लिए अन्य बर्तनों में निकालें; धातु के डिब्बे में ही न रखें।"
  ],
  "PL1-37": [
    "- Cool down before placing in the freezer.",
    "- 냉동실에 넣기 전에 식히세요.",
    "- फ्रीजर में रखने से पहले ठंडा करें।"
  ],
  "PL1-38": [
    "- Cool down before cold storage. Divide into small portions for storage to ensure temperature.",
    "- 냉장 보관 전에 식히세요. 온도를 확보하기 위해 소량씩 나누어 보관하세요.",
    "- ठंडे भंडारण से पहले ठंडा करें। तापमान सुनिश्चित करने के लिए छोटे भागों में बाँटकर रखें।"
  ],
  "PL1-44": [
    "Or follow the manufacturer instructions / Store refrigerated",
    "또는 제조사 지침을 따르세요 / 냉장 보관",
    "या निर्माता के निर्देशों का पालन करें / फ्रिज में रखें"
  ],
  "PL1-46": [
    "For grilled items, use within the day only.",
    "구운 제품은 당일에만 사용하세요.",
    "ग्रिल किए आइटम केवल उसी दिन उपयोग करें।"
  ],
  "PL1-47": [
    "Follow the manufacturer instructions. If there is no recommendation, the limit to follow is 2 days / Store refrigerated",
    "제조사 지침을 따르세요. 권장사항이 없으면 2일을 따릅니다 / 냉장 보관",
    "निर्माता के निर्देशों का पालन करें। कोई सिफारिश न हो तो सीमा 2 दिन है / फ्रिज में रखें"
  ],
  "PL1-48": [
    "Change the water daily so the rice does not turn sour",
    "쌀이 시지 않도록 매일 물을 교체하세요",
    "चावल खट्टा न हो, इसके लिए रोज़ पानी बदलें"
  ],
  "PL1-50": [
    "Soak in clean water and change the water daily. Store in the fridge",
    "깨끗한 물에 담그고 매일 물을 교체하세요. 냉장고에 보관하세요",
    "साफ पानी में भिगोएँ और रोज़ पानी बदलें। फ्रिज में रखें"
  ],
  "PL1-52": [
    "Store in a cool, dry, well-ventilated place",
    "서늘하고 건조하며 통풍이 잘 되는 곳에 보관하세요",
    "ठंडी, सूखी, हवादार जगह पर रखें"
  ],
  "PL1-56": [
    "Follow the expiry date on the product packaging first",
    "제품 포장에 기재된 유통기한을 먼저 따르세요",
    "पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें"
  ],
  "PL1-57": [
    "Store refrigerated (do not reuse items set up at the buffet counter for sashimi)",
    "냉장 보관(뷔페 카운터에 진열한 사시미는 재사용하지 마세요)",
    "फ्रिज में रखें (बुफे काउंटर पर रखे सशिमी को पुनः उपयोग न करें)"
  ],
  "PL1-65": [
    "1/2 of the time stated on the packaging",
    "포장에 기재된 시간의 1/2",
    "पैकेजिंग पर लिखे समय का 1/2"
  ],
  "PL1-66": [
    "Store in the cooler. Follow the expiry date on the product packaging first",
    "쿨러에 보관하세요. 제품 포장에 기재된 유통기한을 먼저 따르세요",
    "कूलर में रखें। पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें"
  ],
  "PL1-67": [
    "Store in the cooler. Follow the expiry date on the product packaging first",
    "쿨러에 보관하세요. 제품 포장에 기재된 유통기한을 먼저 따르세요",
    "कूलर में रखें। पहले उत्पाद पैकेजिंग पर लिखी समाप्ति तिथि का पालन करें"
  ],
  "PL1-68": [
    "Store in a sealed container",
    "밀폐 용기에 보관하세요",
    "सीलबंद डिब्बे में रखें"
  ],
  "PL1-69": [
    "- Shelf life and storage conditions after opening follow the manufacturer recommendation first",
    "- 개봉 후 유통기한과 보관 조건은 제조사 권장사항을 먼저 따릅니다",
    "- खोलने के बाद शेल्फ लाइफ और भंडारण शर्तों के लिए पहले निर्माता की सिफारिश का पालन करें"
  ],
  "PL2-01": [
    "Record the preparation time, date and expiry date fully on the storage container and checklist.",
    "조리 시간, 날짜, 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "तैयारी का समय, तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-02": [
    "Leftover after the shift (small quantity) should go into a storage container and into the fridge. Record the preparation date and expiry date fully on the storage container and checklist.",
    "교대 후 남은 것(소량)은 보관 용기에 담아 냉장고에 넣으세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "शिफ्ट के बाद बचा हुआ (कम मात्रा) भंडारण बर्तन में डालकर फ्रिज में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-03": [
    "Do not leave bruised; check daily. Record information fully in the checklist. Do not freeze fruit after thawing",
    "멍들게 두지 말고 매일 확인하세요. 체크리스트에 정보를 빠짐없이 기록하세요. 해동 후 과일을 냉동하지 마세요",
    "चोटिल न छोड़ें; रोज़ जाँचें। जानकारी चेकलिस्ट में पूरी लिखें। पिघलने के बाद फल को फिर से न जमाएँ"
  ],
  "PL2-04": [
    "Frozen fruit is for smoothies",
    "냉동 과일은 스무디용입니다",
    "जमे फल स्मूदी के लिए हैं"
  ],
  "PL2-05": [
    "After opening, keep in the original box in the cooler. Record the opening date and expiry date fully on the storage container and checklist.",
    "개봉 후 원래 상자 그대로 쿨러에 보관하세요. 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "खोलने के बाद मूल डिब्बे में ही कूलर में रखें। खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-06": [
    "Store the original bottle at room temperature. Record the opening date and expiry date fully on the storage container and checklist.",
    "원래 병 그대로 상온에 보관하세요. 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "मूल बोतल को कमरे के तापमान पर रखें। खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-07": [
    "Sugar is cooked into syrup for storage. Put it in a storage container. Store in the cooler. Record the preparation date and expiry date fully on the storage container and checklist. For outlets that use condensed milk frequently during the day, it can be decanted into a small bottle, kept at room temperature during the day, and at the end of the day wash the bottle and discard the remainder",
    "설탕을 시럽으로 끓여 보관합니다. 보관 용기에 담으세요. 쿨러에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요. 연유를 당일에 자주 사용하는 매장은 작은 병에 옮겨 당일 상온에 보관할 수 있으며, 당일 종료 시 병을 씻고 남은 것을 버리세요",
    "चीनी को सिरप बनाकर पकाकर रखें। भंडारण बर्तन में डालें। कूलर में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें। दिन में गाढ़ा दूध अक्सर उपयोग करने वाले आउटलेट इसे छोटी बोतल में निकालकर दिन में कमरे के तापमान पर रख सकते हैं, और दिन के अंत में बोतल धोकर बचा हुआ फेंक दें"
  ],
  "PL2-08": [
    "Record the preparation date and expiry date fully on the storage container and checklist.",
    "조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-09": [
    "Follow the manufacturer expiry date first. If the manufacturer does not recommend, follow the internal rule. After opening, keep in the original box in the cooler. Record the preparation date and expiry date fully on the storage container and checklist.",
    "제조사 유통기한을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 후 원래 상자 그대로 쿨러에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "पहले निर्माता की समाप्ति तिथि का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने के बाद मूल डिब्बे में ही कूलर में रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-10": [
    "Fresh beer after opening the keg. Store in the cooler and record the keg opening date and expiry date fully on the storage container and checklist.",
    "케그 개봉 후 생맥주입니다. 쿨러에 보관하고 케그 개봉 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "केग खोलने के बाद ताज़ा बीयर। कूलर में रखें और केग खोलने की तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-11": [
    "Note in the file was cut off at the end of page 18, not fully read - check against the original",
    "파일의 비고가 18페이지 끝에 잘려 있어 끝까지 읽지 못함 - 원본과 대조하세요",
    "फ़ाइल में टिप्पणी पृष्ठ 18 के अंत में कट गई थी, पूरी नहीं पढ़ी गई - मूल से मिलाएँ"
  ],
  "PL2-12": [
    "Spirits have no expiry date. After opening, keep in the bottle at room temperature. Record the opening date fully on the label on the bottle and checklist.",
    "증류주는 유통기한이 없습니다. 개봉 후 병 그대로 상온에 보관하세요. 개봉 날짜를 병 라벨과 체크리스트에 빠짐없이 기록하세요.",
    "स्पिरिट की कोई समाप्ति तिथि नहीं है। खोलने के बाद बोतल में ही कमरे के तापमान पर रखें। खोलने की तिथि बोतल के लेबल और चेकलिस्ट पर पूरी लिखें।"
  ],
  "PL2-13": [
    "Liqueur after opening. Keep in the bottle at room temperature. Record the preparation date and expiry date fully on the storage container and checklist.",
    "개봉 후 리큐어입니다. 병 그대로 상온에 보관하세요. 조리 날짜와 유통기한을 보관 용기와 체크리스트에 빠짐없이 기록하세요.",
    "खोलने के बाद लिकर। बोतल में ही कमरे के तापमान पर रखें। तैयारी तिथि और समाप्ति तिथि भंडारण बर्तन और चेकलिस्ट पर पूरी तरह लिखें।"
  ],
  "PL2-14": [
    "Red wine after opening must be vacuum-sealed. Keep in the bottle in the storage cabinet. Record the opening date and expiry date fully on the label on the bottle and checklist.",
    "개봉 후 레드 와인은 진공 밀봉해야 합니다. 병 그대로 보관 캐비닛에 보관하세요. 개봉 날짜와 유통기한을 병 라벨과 체크리스트에 빠짐없이 기록하세요.",
    "खोलने के बाद रेड वाइन को वैक्यूम-सील करना होगा। बोतल में ही भंडारण कैबिनेट में रखें। खोलने की तिथि और समाप्ति तिथि बोतल के लेबल और चेकलिस्ट पर पूरी लिखें।"
  ],
  "PL2-15": [
    "White wine after opening must be vacuum-sealed. Keep in the bottle in the fridge. Record the opening date and expiry date fully on the sub-label and checklist.",
    "개봉 후 화이트 와인은 진공 밀봉해야 합니다. 병 그대로 냉장고에 보관하세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.",
    "खोलने के बाद व्हाइट वाइन को वैक्यूम-सील करना होगा। बोतल में ही फ्रिज में रखें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।"
  ],
  "PL2-16": [
    "Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.",
    "제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.",
    "पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।"
  ],
  "PL2-17": [
    "Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.",
    "제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.",
    "पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।"
  ],
  "PL2-18": [
    "Follow the after-opening instructions on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Record the opening date and expiry date fully on the sub-label and checklist.",
    "제조사 라벨의 개봉 후 지침을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.",
    "पहले निर्माता लेबल पर खोलने के बाद के निर्देशों का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।"
  ],
  "PL2-19": [
    "Follow the expiry date on the manufacturer label first. If the manufacturer does not recommend, follow the internal rule. Store in sealed jars / bags. Record the opening date and expiry date fully on the sub-label and checklist.",
    "제조사 라벨의 유통기한을 먼저 따르세요. 제조사가 권장하지 않으면 내부 규정을 따르세요. 밀폐된 병 / 봉투에 보관하세요. 개봉 날짜와 유통기한을 보조 라벨과 체크리스트에 빠짐없이 기록하세요.",
    "पहले निर्माता लेबल पर समाप्ति तिथि का पालन करें। निर्माता सिफारिश न करे तो आंतरिक नियम का पालन करें। सीलबंद जार / बैग में रखें। खोलने की तिथि और समाप्ति तिथि सब-लेबल और चेकलिस्ट पर पूरी लिखें।"
  ]
};

export const translateItemName = (item: FoodItem, lang: Lang): string =>
  lang === 'VI'
    ? item.name
    : ITEM_NAME_TRANSLATIONS[getItemCode(item)]?.[getLangIndex(lang)] ||
      translateDuration(item.name, lang);

export const translateItemNote = (item: FoodItem, lang: Lang): string => {
  if (lang === 'VI') return item.note;
  if (isEmptyCell(item.note)) return item.note;
  return (
    ITEM_NOTE_TRANSLATIONS[getItemCode(item)]?.[getLangIndex(lang)] ||
    translateDuration(item.note, lang)
  );
};

export const translateFlag = (item: FoodItem, lang: Lang): string => {
  if (lang === 'VI') return item.flag || '';
  if (!item.flag) return '';
  return (
    QA_FLAG_TRANSLATIONS[getItemCode(item)]?.[getLangIndex(lang)] ||
    translateDuration(item.flag, lang)
  );
};
