export interface SheFoodRuleItem {
  code: string;
  group: string;
  name: string;
  room: string;
  cool: string;
  freeze: string;
  note: string;
  keywords?: string[];
}

export interface SheNoFreezeItem {
  group: string;
  detail: string;
  reason: string;
  keywords?: string[];
}

export interface ShePolicySection {
  id: string;
  article: string;
  title: string;
  keywords: string[];
  summary: string;
}

export const SHE_DOC_METADATA = {
  decisionNo: '107/2026/QĐ-SHE/SG',
  docCode: 'SHE-QĐ-FB13',
  version: '00',
  effectiveDate: '12/11/2026',
  title: 'Quy định bảo quản và hạn sử dụng thực phẩm tại Khối SHE',
  signer: 'Thái Ngọc Sơn (Phó Tổng Giám đốc Khối Giải trí – Nghỉ dưỡng)',
  owner: 'Ban Kỹ thuật và Vận hành Khối (đề nghị của Phòng Ẩm thực)',
  scope:
    'Áp dụng cho toàn bộ nhà hàng, kiosk, quầy F&B, bếp và khu vực lưu trữ thực phẩm (kho khô, kho lạnh, kho đông, tủ mát, tủ đông) thuộc các Đơn vị thành viên (tự vận hành) của Khối Giải trí – Nghỉ dưỡng (SHE); bao gồm nguyên liệu, bán thành phẩm, thành phẩm, đồ uống và thực phẩm khô đóng gói sau khi mở bao bì.',
  confidentiality:
    'Tài liệu lưu hành nội bộ, nếu không được sự cho phép của người quản lý thì không được phép cho mượn, copy hay mang ra ngoài.',
};

export const SHE_GROUPS: string[] = [
  'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)',
  'Gia cầm',
  'Hải sản',
  'Thịt chế biến sẵn (đã mở bao bì)',
  'Sữa và sản phẩm từ sữa (đã mở bao bì)',
  'Trứng',
  'Rau củ quả tươi (chưa cắt, chưa bóc vỏ)',
  'Rau củ quả đã sơ chế, đã cắt',
  'Các loại sốt (đã mở bao bì hoặc đã chiết rót)',
  'Đồ uống (đã mở bao bì hoặc đã pha chế)',
  'Thực phẩm làm bánh/ bột/ tinh bột',
  'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
  'Thực phẩm đóng hộp, đóng lon (đã mở)',
];

export const SHE_POLICY_SECTIONS: ShePolicySection[] = [
  {
    id: 'META',
    article: 'Thông tin ban hành',
    title: 'Quyết định 107/2026/QĐ-SHE/SG (Mã hiệu SHE-QĐ-FB13 · Phiên bản 00)',
    keywords: [
      'thong tin chung', 'so quyet dinh', 'phien ban', 'hieu luc', 'ngay ky',
      'thai ngoc son', 'bao mat tai lieu', 'don vi chu so huu', 'ai ky', 'ban hanh',
      'effective date', 'decision number', 'confidentiality',
    ],
    summary: [
      '• Số Quyết định: 107/2026/QĐ-SHE/SG ngày 12/11/2026 (Phó Tổng Giám đốc Khối Giải trí – Nghỉ dưỡng Thái Ngọc Sơn ký).',
      '• Mã hiệu văn bản: SHE-QĐ-FB13 | Phiên bản: 00 | Ngày hiệu lực: 12/11/2026.',
      '• Đơn vị chủ sở hữu: Ban Kỹ thuật và Vận hành Khối (xét đề nghị của Phòng Ẩm thực).',
      '• Phạm vi áp dụng: Đơn vị thành viên (tự vận hành).',
      '• Bảo mật: Tài liệu lưu hành nội bộ, nếu không được sự cho phép của người quản lý thì không được phép cho mượn, copy hay mang ra ngoài.',
    ].join('\n'),
  },
  {
    id: 'ART1',
    article: 'Điều 1',
    title: 'Mục tiêu',
    keywords: ['dieu 1', 'muc tieu', 'tieu chuan luu tru', 'ngan ngua qua han', 'article 1', 'objective', 'purpose'],
    summary: [
      '• Quy định thống nhất tiêu chuẩn lưu trữ, bảo quản và quản lý hạn sử dụng thực phẩm tại các Đơn vị thành viên thuộc Khối.',
      '• Bảo đảm thực phẩm được bảo quản đúng điều kiện nhiệt độ, an toàn và hợp vệ sinh.',
      '• Ngăn ngừa việc sử dụng thực phẩm quá hạn; giảm thất thoát, lãng phí và rủi ro về an toàn thực phẩm.',
      '• Thống nhất cách ghi nhãn, cách tính và kiểm soát hạn sử dụng đối với thực phẩm đã mở bao bì, đã sơ chế, đã chế biến hoặc đã rã đông.',
    ].join('\n'),
  },
  {
    id: 'ART2',
    article: 'Điều 2',
    title: 'Đối tượng, phạm vi áp dụng',
    keywords: ['dieu 2', 'doi tuong', 'pham vi ap dung', 'nha hang', 'kiosk', 'kho kho', 'tu mat', 'article 2', 'scope'],
    summary: [
      '• Áp dụng cho toàn bộ nhà hàng, kiosk, quầy F&B, bếp và khu vực lưu trữ thực phẩm (kho khô, kho lạnh, kho đông, tủ mát, tủ đông) thuộc các Đơn vị thành viên (tự vận hành) của Khối Giải trí – Nghỉ dưỡng.',
      '• Áp dụng đối với tất cả nguyên liệu, bán thành phẩm và thành phẩm có yêu cầu bảo quản và quản lý hạn sử dụng, bao gồm đồ uống và thực phẩm khô đóng gói sau khi mở bao bì.',
    ].join('\n'),
  },
  {
    id: 'ART3',
    article: 'Điều 3',
    title: 'Tài liệu liên quan',
    keywords: ['dieu 3', 'tai lieu lien quan', 'luat an toan thuc pham', '55/2010', 'nghi dinh 15', 'fda food code 2022', '3-501.17', 'article 3'],
    summary: [
      '• Luật An toàn thực phẩm số 55/2010/QH12.',
      '• Nghị định số 15/2018/NĐ-CP hướng dẫn thi hành một số điều của Luật An toàn thực phẩm.',
      '• FDA Food Code 2022: Bộ Quy tắc Thực phẩm của Cục Quản lý Thực phẩm và Dược phẩm Hoa Kỳ năm 2022 (trong đó có Mục 3-501.17 về ghi ngày đối với thực phẩm ăn liền cần kiểm soát thời gian/nhiệt độ).',
      '• FDA – Food Product Dating: Hướng dẫn của Cục Quản lý Thực phẩm và Dược phẩm Hoa Kỳ về ghi ngày trên sản phẩm thực phẩm.',
      '• FDA – Guidance on Labeling of Foods That Need Refrigeration: Hướng dẫn về ghi nhãn đối với thực phẩm cần bảo quản lạnh.',
    ].join('\n'),
  },
  {
    id: 'ART4',
    article: 'Điều 4',
    title: 'Thuật ngữ và các từ viết tắt (FIFO, FEFO, TCS, Ngày 1, Hạn thứ cấp)',
    keywords: [
      'thuat ngu', 'viet tat', 'fifo', 'fefo', 'tcs', 'qlcl', 'nsx', 'hsd', 'fda',
      'han su dung thu cap', 'han noi bo', 'ngay 1', 'chua xu ly nhiet',
      'da xu ly nhiet', 'thuc pham song', 'giai thich thuat ngu', 'dieu 4',
      'acronym', 'abbreviation', 'definition', 'secondary shelf life',
    ],
    summary: [
      '• SHE: Khối Giải trí – Nghỉ dưỡng | F&B: Food and Beverage – Ẩm thực | QLCL: Quản lý chất lượng | NSX: Nhà sản xuất | HSD: Hạn sử dụng.',
      '• FIFO (First In, First Out): Nhập trước, xuất trước.',
      '• FEFO (First Expired, First Out): Hết hạn trước, xuất trước.',
      '• TCS (Time/Temperature Control for Safety): Thực phẩm cần kiểm soát thời gian và nhiệt độ để bảo đảm an toàn (thịt, cá, sữa, trứng, cơm, rau củ đã cắt…).',
      '• FDA: Cục Quản lý Thực phẩm và Dược phẩm Hoa Kỳ.',
      '• Thực phẩm chưa xử lý nhiệt (sống): Thực phẩm chưa qua nấu chín hoặc gia nhiệt.',
      '• Thực phẩm đã xử lý nhiệt: Thực phẩm đã được nấu chín, hấp, nướng, chiên… tại bếp.',
      '• Hạn sử dụng thứ cấp (hạn nội bộ): Thời hạn tối đa được phép sử dụng sau khi mở bao bì, sơ chế, chế biến hoặc rã đông, do Khối quy định tại Điều 7.',
      '• Ngày 1: Ngày bắt đầu tính hạn sử dụng thứ cấp (xác định theo Mục 6.2).',
    ].join('\n'),
  },
  {
    id: 'ART5',
    article: 'Điều 5',
    title: 'Trách nhiệm các bên liên quan (Bếp/F&B, Kho, QLCL, Lãnh đạo, Phòng Ẩm thực)',
    keywords: [
      'trach nhiem', 'bo phan bep', 'bo phan kho', 'phong qlcl', 'lanh dao don vi',
      'bep truong', 'quan ly fb', 'phong am thuc', 'dieu 5', 'ai chiu trach nhiem',
      'ai phe duyet', 'ai tham dinh', 'responsibility', 'kitchen', 'qa', 'culinary',
    ],
    summary: [
      '• 5.1 Bộ phận Bếp/F&B: Kiểm tra tình trạng thực phẩm khi nhận & sử dụng; bảo quản đúng nhiệt độ/vị trí/tách sống–chín; áp dụng FIFO/FEFO; ghi nhãn đầy đủ theo Mục 6.3; kiểm tra/ghi nhận nhiệt độ tủ theo Mục 6.1; báo ngay khi hư hỏng/bất thường/cận hạn và loại bỏ hàng hết hạn theo Mục 6.8.',
      '• 5.2 Bộ phận Kho: Tiếp nhận, kiểm tra, đối chiếu chứng từ & điều kiện khi nhập kho; sắp xếp đúng khu vực/điều kiện; theo dõi tồn kho, lập báo cáo cận hạn/hết hạn; bảo đảm kho sạch, nhiệt độ ổn định.',
      '• 5.3 Phòng/Bộ phận QLCL: Kiểm tra định kỳ, đánh giá tuân thủ của bếp, kho, F&B; thẩm định HSD nội bộ cho thực phẩm chưa liệt kê tại Điều 7 (Mục 6.5); hỗ trợ đào tạo & đề xuất cải tiến.',
      '• 5.4 Lãnh đạo Đơn vị thành viên (Quản lý F&B / Bếp trưởng): Tổ chức triển khai tại đơn vị, phân công người kiểm tra nhiệt độ, nhãn, HSD hằng ngày; đào tạo nhân viên.',
      '• 5.5 Phòng Ẩm thực Khối SHE: Chủ trì xây dựng, hướng dẫn, cập nhật Quy định; phê duyệt HSD nội bộ cho thực phẩm chưa liệt kê sau khi có thẩm định của Phòng QLCL Khối.',
    ].join('\n'),
  },
  {
    id: 'SEC61',
    article: 'Mục 6.1',
    title: 'Khung nhiệt độ bảo quản & Quy tắc tối đa 04 giờ ngoài khung nhiệt độ',
    keywords: [
      '6 1', 'khung nhiet do', 'nhiet do phong', 'nhiet do lanh', 'nhiet do dong',
      '15 25', '0 5', 'tu mat', 'kho lanh', 'kho kho', 'tu dong', 'kho dong',
      'kiem tra nhiet do', '2 lan', '02 lan', 'vuot nguong', '4 gio', '04 gio',
      'cong don', 'de ngoai', 'nhiet do chuan', '4 hour', '4 hours', 'temperature range',
      'cumulative', 'temperature log',
    ],
    summary: [
      '• Nhiệt độ phòng (15–25°C): Kho khô, nơi thoáng mát, khô ráo, tránh ánh nắng trực tiếp.',
      '• Nhiệt độ lạnh (0–5°C): Tủ mát, kho lạnh.',
      '• Nhiệt độ đông (≤ −18°C): Tủ đông, kho đông.',
      '• Kiểm tra & ghi nhận: Nhiệt độ tủ mát, kho lạnh và tủ đông phải kiểm tra, ghi nhận ít nhất 02 lần/ngày (đầu ca và cuối ca). Khi vượt ngưỡng phải báo ngay quản lý, chuyển sang thiết bị đạt yêu cầu và đánh giá lại trước khi tiếp tục sử dụng.',
      '• Giới hạn 04 giờ cộng dồn: Thực phẩm cần bảo quản lạnh hoặc đông chỉ được để ngoài khung nhiệt độ quy định tối đa 04 giờ (tính cộng dồn) trong quá trình sơ chế, chế biến hoặc phục vụ; quá thời gian này phải loại bỏ.',
    ].join('\n'),
  },
  {
    id: 'SEC62',
    article: 'Mục 6.2',
    title: 'Cách tính thời hạn sử dụng thứ cấp (Ngày 1, Theo giờ, Theo tháng, Quy tắc 7 ngày TCS)',
    keywords: [
      '6 2', 'cach tinh', 'tinh han', 'ngay 1', 'theo ngay', 'theo gio', 'theo thang',
      '30 ngay', 'khong cong don', '7 ngay', '07 ngay', 'tcs', '3 501 17', 'an lien',
      'ngay nhan hang', 'ngay mo bao', 'ngay so che', 'ngay cap dong', 'ngay ra dong',
      'cong don thoi han', '7 day', '7 days', 'day 1', 'ready to eat', 'tcs food',
    ],
    summary: [
      '• Thời hạn tại Điều 7 là thời hạn nội bộ tối đa (áp dụng ghi nhãn thực phẩm thứ cấp), tính từ Ngày 1:',
      '  - Ngày nhận hàng: thực phẩm tươi sống không có bao bì hoặc không có HSD của NSX (thịt, hải sản, rau củ quả tươi…).',
      '  - Ngày mở bao bì: sản phẩm đóng gói đã mở.',
      '  - Ngày sơ chế/chế biến xong: thực phẩm tự sơ chế, tự chế biến tại bếp.',
      '  - Ngày cấp đông: thực phẩm bảo quản đông.',
      '  - Ngày, giờ rã đông xong: thực phẩm đã rã đông (Mục 6.7).',
      '• Tính theo ngày: Ngày 1 là ngày đầu tiên; được sử dụng đến hết ngày cuối cùng (VD: thịt xay sống hạn lạnh 02 ngày nhận ngày 10 → dùng hết ngày 11).',
      '• Tính theo giờ: Tính từ thời điểm mở bao bì hoặc chế biến xong; nhãn phải ghi cả giờ.',
      '• Tính theo tháng: 01 tháng được tính bằng 30 ngày.',
      '• Không cộng dồn: Các cột nhiệt độ là phương án bảo quản thay thế nhau, không cộng dồn thời hạn giữa các khung nhiệt độ. Chỉ được cấp đông thực phẩm còn trong hạn và còn chất lượng tốt.',
      '• Quy tắc 07 ngày (FDA Food Code, Mục 3-501.17): Thực phẩm ăn liền thuộc nhóm TCS bảo quản lạnh không được lưu quá 07 ngày kể từ Ngày 1, kể cả khi NSX cho phép thời hạn dài hơn.',
    ].join('\n'),
  },
  {
    id: 'SEC63',
    article: 'Mục 6.3',
    title: 'Ghi nhãn thực phẩm thứ cấp (4 thông tin bắt buộc)',
    keywords: [
      '6 3', 'ghi nhan', 'dan nhan', 'tem nhan', 'nhan thuc pham', 'thieu nhan',
      'khong co nhan', 'nhan mo', 'bong troc', 'dung truoc', '4 thong tin', 'noi dung nhan',
      'label', 'labeling', 'labelling', 'missing label', 'use by',
    ],
    summary: [
      '• Tất cả thực phẩm lưu trữ thứ cấp (đã mở bao, sơ chế, chế biến, rã đông) phải được đóng gói hoặc che đậy riêng từng loại và dán nhãn rõ ràng, không bị mờ hoặc bong tróc.',
      '• Nhãn tối thiểu gồm 4 nội dung:',
      '  (1) Tên sản phẩm;',
      '  (2) Ngày 1 (ngày nhận, mở bao, chế biến, cấp đông hoặc rã đông), kèm GIỜ nếu thời hạn tính theo giờ;',
      '  (3) Hạn sử dụng (“dùng trước ngày/giờ…”);',
      '  (4) Người thực hiện.',
      '• Xử lý: Thực phẩm không có nhãn, nhãn không đọc được hoặc không xác định được lịch sử bảo quản phải được loại bỏ.',
    ].join('\n'),
  },
  {
    id: 'SEC64',
    article: 'Mục 6.4',
    title: 'Nguyên tắc bảo quản & Thứ tự xếp tủ mát (Sống – Chín, Cách sàn 15 cm)',
    keywords: [
      '6 4', 'nguyen tac bao quan', 'sap xep', 'tu mat', 'thu tu xep', 'tren xuong duoi',
      'tach biet', 'nhiem cheo', 'song chin', 'cach san', '15 cm', '15cm',
      'do hop da mo', 'hop kin', 'fifo', 'fefo', 'luu thong khi lanh',
      'stacking', 'shelf order', 'raw', 'cross contamination', 'floor clearance', 'canned food',
    ],
    summary: [
      '• Tách biệt thực phẩm sống và thực phẩm chín/ăn liền để tránh nhiễm chéo.',
      '• Thứ tự xếp trong tủ mát từ TRÊN xuống DƯỚI:',
      '  1. Thực phẩm ăn liền (trên cùng)',
      '  2. Hải sản',
      '  3. Thịt nguyên miếng',
      '  4. Thịt xay',
      '  5. Gia cầm (dưới cùng)',
      '• Khoảng cách sàn & thông khí: Không để thực phẩm trực tiếp trên sàn (cách sàn tối thiểu 15 cm); không xếp quá đầy làm cản trở lưu thông khí lạnh.',
      '• Đồ hộp / đóng lon đã mở: Phải chuyển sang hộp kín có nắp, không để nguyên trong lon.',
      '• Xuất kho: Áp dụng nguyên tắc FIFO/FEFO (hàng nhập trước hoặc hàng có hạn ngắn hơn dùng trước).',
    ].join('\n'),
  },
  {
    id: 'SEC65',
    article: 'Mục 6.5',
    title: 'Thực phẩm còn nguyên bao bì, đã mở bao bì và thực phẩm chưa được liệt kê',
    keywords: [
      '6 5', 'nguyen bao bi', 'con nguyen bao', 'da mo bao bi', 'chua duoc liet ke',
      'chua liet ke', 'ngoai bang', 'khong co trong bang', 'mac dinh 3 ngay', '03 ngay',
      'ngan hon', 'uu tien nsx', 'tham dinh', 'phe duyet', 'unlisted', 'unopened', 'opened packaging',
    ],
    summary: [
      '• Sản phẩm còn nguyên bao bì: Áp dụng hạn sử dụng và điều kiện bảo quản do NSX công bố.',
      '• Sản phẩm đã mở bao bì: Áp dụng thời hạn NGẮN HƠN giữa hướng dẫn của NSX và thời hạn nội bộ tại Điều 7. Trường hợp hướng dẫn NSX ngắn hơn quy định nội bộ, phải áp dụng hướng dẫn của NSX.',
      '• Thực phẩm chưa được liệt kê tại Điều 7: Áp dụng hạn sử dụng và hướng dẫn của NSX. Nếu NSX không quy định thời hạn sau khi mở bao bì, Đơn vị thành viên đề xuất, Phòng QLCL Khối thẩm định và Phòng Ẩm thực Khối phê duyệt thời hạn nội bộ trước khi áp dụng; KHÔNG mặc định áp dụng 03 ngày (lạnh) hoặc 01 tháng (đông).',
    ].join('\n'),
  },
  {
    id: 'SEC66',
    article: 'Mục 6.6',
    title: 'Thực phẩm đã xử lý nhiệt: Quy trình làm nguội & Hâm nóng lại',
    keywords: [
      '6 6', 'xu ly nhiet', 'lam nguoi', 'ham nong', '57', '21 do', '5 cm', 'khay nong',
      '75 do', '82 do', '2 phut', 'mot lan', '1 lan', '3 501 14', 'thuc an chin',
      'do an thua', 'tam san pham', 'cooling', 'cool', 'reheat', 'reheating', 'hot food', 'cooked',
    ],
    summary: [
      '• Quy trình làm nguội (FDA Food Code, Mục 3-501.14) — bắt buộc trước khi đưa vào bảo quản:',
      '  - Giai đoạn 1: Hạ từ 57°C xuống 21°C trong tối đa 02 giờ.',
      '  - Giai đoạn 2: Hạ từ 21°C xuống ≤ 5°C trong tối đa 04 giờ tiếp theo.',
      '  - Nên chia nhỏ thực phẩm vào khay nông (dày không quá 5 cm) để làm nguội nhanh. Thực phẩm không đạt yêu cầu làm nguội phải loại bỏ.',
      '• Hâm nóng lại:',
      '  - Phải đạt tối thiểu 75°C tại tâm sản phẩm và hâm nóng trong vòng 2 phút ở nhiệt độ 82°C.',
      '  - Chỉ hâm nóng MỘT LẦN; phần còn thừa sau hâm nóng phải loại bỏ.',
    ].join('\n'),
  },
  {
    id: 'SEC67',
    article: 'Mục 6.7',
    title: 'Rã đông thực phẩm (3 cách cho phép & hạn 24 giờ)',
    keywords: [
      '6 7', 'ra dong', 'cap dong lai', 'tai cap dong', '24 gio', '24h', 'voi nuoc',
      'lo vi song', 'ngan mat', '21 do', 'nuoc dong', 'khong cap dong lai',
      'thaw', 'thawing', 'defrost', 'defrosting', 'refreeze', 'microwave',
    ],
    summary: [
      '• Chỉ rã đông bằng 1 trong 3 cách:',
      '  1. Trong ngăn mát (0–5°C);',
      '  2. Dưới vòi nước sạch chảy liên tục (nước không quá 21°C);',
      '  3. Bằng lò vi sóng khi chế biến ngay.',
      '• Nghiêm cấm: Không rã đông ở nhiệt độ phòng hoặc ngâm trong nước đọng.',
      '• Sau khi rã đông xong: Phải sử dụng trong vòng 24 giờ và KHÔNG được cấp đông lại; nhãn phải ghi ngày, giờ rã đông.',
      '• Nấu chín sau rã đông: Thực phẩm sống đã rã đông nếu được nấu chín và làm nguội đúng quy trình (Mục 6.6) thì được bảo quản như thực phẩm đã xử lý nhiệt.',
    ].join('\n'),
  },
  {
    id: 'SEC68',
    article: 'Mục 6.8',
    title: 'Các trường hợp nghiêm cấm & xử lý thực phẩm hư hỏng / hết hạn',
    keywords: [
      '6 8', 'nghiem cam', 'cam', 'gia han', 'thay doi nhan', 'sua nhan', 'phoi tron',
      'che bien lai', 'het han', 'hu hong', 'doi mau', 'mui la', 'moc', 'nhot',
      'phong', 'ro ri', 'loai bo', 'huy bo', 'prohibited', 'expired', 'spoiled', 'discard', 'relabel',
    ],
    summary: [
      '• Nghiêm cấm: Không được thay đổi nhãn, gia hạn thời hạn sử dụng, cấp đông, chế biến lại hoặc phối trộn nhằm kéo dài thời hạn đối với thực phẩm đã hết hạn, có dấu hiệu hư hỏng hoặc không xác định được lịch sử bảo quản.',
      '• Xử lý: Thực phẩm hết hạn hoặc có dấu hiệu hư hỏng (đổi màu, có mùi lạ, nhớt, mốc, bao bì phồng, rò rỉ) phải được loại bỏ ngay và ghi nhận theo quy định của đơn vị.',
    ].join('\n'),
  },
  {
    id: 'ART7_READ',
    article: 'Điều 7 (Cách đọc bảng)',
    title: 'Cách đọc bảng quy định bảo quản & hạn sử dụng (Điều 7)',
    keywords: [
      'cach doc bang', 'dieu 7', 'theo nsx', 'khong cap dong la gi', 'chu khong',
      'thay the nhau', 'hieu nhu the nao', 'how to read table', 'article 7',
    ],
    summary: [
      '• Phạm vi bảng: Áp dụng cho thực phẩm sau khi mở bao bì, sơ chế, chế biến hoặc rã đông (tính từ Ngày 1 theo Mục 6.2; còn nguyên bao áp dụng HSD của NSX).',
      '• Số ngày/giờ/tháng: Thời hạn tối đa khi bảo quản ở khung nhiệt độ của cột đó.',
      '• Không: Không được bảo quản ở khung nhiệt độ này (ngoại trừ thời gian thao tác, phục vụ tối đa 04 giờ theo Mục 6.1).',
      '• Không cấp đông: Không được cấp đông (xem thêm Điều 8).',
      '• Theo NSX: Áp dụng hướng dẫn trên bao bì của NSX. Nếu NSX không cho phép hoặc không có hướng dẫn thì hiểu là Không (đối với cột nhiệt độ đông là Không cấp đông).',
      '• Các cột nhiệt độ là các phương án thay thế nhau, không cộng dồn thời hạn. Mọi thực phẩm sau rã đông áp dụng Mục 6.7.',
    ].join('\n'),
  },
  {
    id: 'ART9',
    article: 'Điều 9',
    title: 'Điều khoản thi hành & sửa đổi quy định',
    keywords: [
      'dieu 9', 'dieu khoan thi hanh', 'sua doi quy dinh', 'thay the van ban cu',
      'van ban truoc day', 'het hieu luc', 'article 9', 'amendment',
    ],
    summary: [
      '• Có hiệu lực kể từ ngày ký ban hành (12/11/2026) và cho đến khi có văn bản khác thay thế. Các hướng dẫn trước đây của Khối về bảo quản và hạn sử dụng thực phẩm trái với Quy định này hết hiệu lực kể từ ngày Quy định này có hiệu lực.',
      '• Phòng Ẩm thực Khối SHE, Phòng QLCL Khối, Lãnh đạo các Đơn vị thành viên SHE và các đơn vị, cá nhân có liên quan chịu trách nhiệm thi hành Quy định này.',
      '• Việc sửa đổi, bổ sung Quy định này (kể cả bổ sung nhóm thực phẩm, thời hạn sử dụng nội bộ) do Phòng Ẩm thực Khối chủ trì, Phòng QLCL Khối thẩm định và trình cấp có thẩm quyền phê duyệt.',
    ].join('\n'),
  },
];

const NOTE_RED_MEAT =
  'Để ở ngăn dưới cùng của tủ mát, có khay hứng nước, tách biệt với thực phẩm ăn liền. Cấp đông: chia khẩu phần nhỏ, bọc kín bằng màng bọc thực phẩm và/hoặc hút chân không, cho vào hộp kín hoặc túi zip chịu lạnh để tránh cháy lạnh (mất nước, đổi màu, đổi mùi vị); ghi nhãn ngày cấp đông.';
const NOTE_POULTRY =
  'Gia cầm sống dễ gây nhiễm chéo: để ở ngăn dưới cùng của tủ mát, đựng trong hộp kín có nắp; không rửa gia cầm sống trước khi lưu kho. Cấp đông thực hiện như thịt đỏ.';
const NOTE_SEAFOOD =
  'Để ráo nước, đựng hộp kín hoặc xếp trên đá vụn có khay thoát nước; tách riêng với thực phẩm ăn liền. Cấp đông: bọc kín hoặc hút chân không, ghi nhãn ngày cấp đông.';
const NOTE_DELI =
  'Bọc kín hoặc đựng hộp kín, ghi nhãn ngày mở bao. Sản phẩm còn nguyên bao bì áp dụng HSD của NSX.';
const NOTE_DAIRY =
  'Đậy kín, ghi nhãn ngày mở bao; không rót ngược phần thừa vào hộp/chai gốc; không để ở cửa tủ mát. Sản phẩm còn nguyên bao bì áp dụng HSD của NSX.';
const NOTE_EGG =
  'Không rửa trứng trước khi lưu kho. Loại bỏ trứng nứt, vỡ vỏ; không để trứng lẫn hoặc đặt phía trên thực phẩm ăn liền.';
const NOTE_FRESH_PRODUCE =
  'Thời hạn tính từ ngày nhận hàng và không vượt quá hạn sử dụng/khuyến cáo của nhà cung cấp. Rau lá nguyên bó, chưa sơ chế sạch và chưa hút chân không: tối đa 3 ngày. Quả mềm, dễ dập (dâu, nho, quả mọng…): tối đa 3 ngày. Tách rau củ quả ăn tươi khỏi thực phẩm sống; loại bỏ ngay phần dập, úng, héo, chảy nhớt.';
const NOTE_CUT_PRODUCE =
  'Gọt, rửa bằng nước sạch, để ráo, đựng hộp kín hoặc túi hút chân không; tính hạn từ ngày giờ sơ chế xong.';
const NOTE_SAUCE =
  'Chai, lọ chiết rót ra khu phục vụ phải sạch, đậy nắp, ghi nhãn ngày chiết; không đổ sốt thừa ở bàn/quầy phục vụ ngược vào chai gốc. Sốt có yêu cầu bảo quản lạnh sau khi mở theo nhãn NSX phải để ở nhiệt độ lạnh.';
const NOTE_BEVERAGE =
  'Chai, hộp, lon đã mở: đậy kín, ghi nhãn ngày, giờ mở; không rót ngược phần thừa vào bao bì gốc. Nước đường tự nấu phải đựng chai/hũ đã tiệt trùng, đậy kín. Đồ uống pha chế tại quầy không có nhãn hoặc quá hạn phải loại bỏ.';
const NOTE_BAKERY =
  'Thực phẩm đã chín phải làm nguội đúng quy trình (Mục 6.6) rồi mới đưa vào tủ; đậy kín. Hâm nóng lại đạt tối thiểu 75°C tại tâm sản phẩm, chỉ hâm một lần.';
const NOTE_DRY =
  'Sau khi mở: chuyển sang hộp/túi kín, ghi nhãn ngày mở; để nơi khô ráo, thoáng mát, tránh ánh nắng. Không bảo quản tủ mát, tủ đông (nguy cơ ẩm, ngưng tụ nước, mốc), trừ các loại hạt. Bỏ ngay khi có dấu hiệu ẩm, mốc, mùi lạ hoặc côn trùng.';
const NOTE_CANNED =
  'Chuyển sang hộp kín có nắp, ghi nhãn ngày mở; không để nguyên trong lon.';

export const SHE_FOOD_ITEMS: SheFoodRuleItem[] = [
  // 1. Thịt đỏ (Bò/ Bê/ Cừu/ Heo)
  {
    code: 'SHE-01',
    group: 'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)',
    name: 'Nguyên tảng (chưa xử lý nhiệt)',
    room: 'Không',
    cool: '3 ngày',
    freeze: '3 tháng',
    note: NOTE_RED_MEAT,
    keywords: ['thit do', 'thit bo', 'thit be', 'thit cuu', 'thit heo', 'thit lon', 'nguyen tang', 'thit song'],
  },
  {
    code: 'SHE-02',
    group: 'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)',
    name: 'Thịt xay (chưa xử lý nhiệt)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '1 tháng',
    note: NOTE_RED_MEAT,
    keywords: ['thit do', 'thit xay', 'bo xay', 'heo xay', 'thit bam'],
  },
  {
    code: 'SHE-03',
    group: 'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)',
    name: 'Nước súp xương/thịt (đã nấu)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '1 tháng',
    note: NOTE_RED_MEAT,
    keywords: ['nuoc sup', 'nuoc dung', 'nuoc ham xuong', 'sup xuong', 'sup thit'],
  },
  {
    code: 'SHE-04',
    group: 'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)',
    name: 'Thịt xay/tảng đã xử lý nhiệt (đồ ăn thừa)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '3 tháng',
    note: NOTE_RED_MEAT,
    keywords: ['thit do', 'thit chin', 'thit da nau', 'do an thua', 'thit da xu ly nhiet'],
  },
  {
    code: 'SHE-05',
    group: 'Thịt đỏ (Bò/ Bê/ Cừu/ Heo)',
    name: 'Thịt nhồi các loại (gà cuộn nhồi thịt, đậu hũ nhồi…) đã xử lý nhiệt',
    room: 'Không',
    cool: '1 ngày',
    freeze: '1 tháng',
    note: NOTE_RED_MEAT,
    keywords: ['thit nhoi', 'ga cuon nhoi thit', 'dau hu nhoi'],
  },

  // 2. Gia cầm
  {
    code: 'SHE-06',
    group: 'Gia cầm',
    name: 'Gà, vịt đã xử lý nhiệt',
    room: 'Không',
    cool: '2 ngày',
    freeze: '1 tháng',
    note: NOTE_POULTRY,
    keywords: ['ga chin', 'vit chin', 'ga da nau', 'vit da nau', 'gia cam chin', 'thit ga'],
  },
  {
    code: 'SHE-07',
    group: 'Gia cầm',
    name: 'Gà, vịt nguyên con (chưa xử lý nhiệt)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '6 tháng',
    note: NOTE_POULTRY,
    keywords: ['ga nguyen con', 'vit nguyen con', 'ga song', 'vit song', 'gia cam', 'thit ga'],
  },
  {
    code: 'SHE-08',
    group: 'Gia cầm',
    name: 'Gà, vịt cắt khúc (chưa xử lý nhiệt)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '1 tháng',
    note: NOTE_POULTRY,
    keywords: ['ga cat khuc', 'vit cat khuc', 'uc ga', 'dui ga', 'canh ga', 'thit ga'],
  },
  {
    code: 'SHE-09',
    group: 'Gia cầm',
    name: 'Gia cầm xay (chưa xử lý nhiệt)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '1 tháng',
    note: NOTE_POULTRY,
    keywords: ['ga xay', 'vit xay', 'gia cam xay'],
  },
  {
    code: 'SHE-10',
    group: 'Gia cầm',
    name: 'Lòng, mề, tim gia cầm (chưa xử lý nhiệt)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '1 tháng',
    note: NOTE_POULTRY,
    keywords: ['long ga', 'me ga', 'tim ga', 'noi tang gia cam'],
  },

  // 3. Hải sản
  {
    code: 'SHE-11',
    group: 'Hải sản',
    name: 'Cá các loại',
    room: 'Không',
    cool: '2 ngày',
    freeze: '2 tháng',
    note: NOTE_SEAFOOD,
    keywords: ['ca', 'ca tuoi', 'ca hoi', 'ca ngu', 'hai san'],
  },
  {
    code: 'SHE-12',
    group: 'Hải sản',
    name: 'Động vật giáp xác (tôm, cua, ghẹ…)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '2 tháng',
    note: NOTE_SEAFOOD,
    keywords: ['tom', 'cua', 'ghe', 'giap xac', 'hai san'],
  },
  {
    code: 'SHE-13',
    group: 'Hải sản',
    name: 'Động vật thân mềm (mực, bạch tuộc, nghêu, sò…)',
    room: 'Không',
    cool: '1 ngày',
    freeze: '2 tháng',
    note: NOTE_SEAFOOD,
    keywords: ['muc', 'bach tuoc', 'ngheu', 'so', 'vem', 'ngao', 'hau', 'than mem'],
  },
  {
    code: 'SHE-14',
    group: 'Hải sản',
    name: 'Hải sản đã xử lý nhiệt',
    room: 'Không',
    cool: '2 ngày',
    freeze: '2 tháng',
    note: NOTE_SEAFOOD,
    keywords: ['hai san chin', 'tom luoc', 'ca nau chin', 'hai san hap'],
  },

  // 4. Thịt chế biến sẵn (đã mở bao bì)
  {
    code: 'SHE-15',
    group: 'Thịt chế biến sẵn (đã mở bao bì)',
    name: 'Thịt, cá xông khói (đã mở bao)',
    room: 'Không',
    cool: '7 ngày',
    freeze: '1 tháng',
    note: NOTE_DELI,
    keywords: ['thit xong khoi', 'ca xong khoi', 'ca hoi xong khoi', 'bacon'],
  },
  {
    code: 'SHE-16',
    group: 'Thịt chế biến sẵn (đã mở bao bì)',
    name: 'Xúc xích (đã mở bao)',
    room: 'Không',
    cool: '3 ngày',
    freeze: '1 tháng',
    note: NOTE_DELI,
    keywords: ['xuc xich', 'sausage'],
  },
  {
    code: 'SHE-17',
    group: 'Thịt chế biến sẵn (đã mở bao bì)',
    name: 'Giò, chả, jambon, thịt xông khói (cắt lát)',
    room: 'Không',
    cool: '2 ngày',
    freeze: '1 tháng',
    note: NOTE_DELI,
    keywords: ['gio', 'cha', 'jambon', 'ham', 'thit nguoi', 'do nguoi', 'cat lat', 'bacon'],
  },
  {
    code: 'SHE-18',
    group: 'Thịt chế biến sẵn (đã mở bao bì)',
    name: 'Xúc xích, thịt nguội đã xử lý nhiệt tại bếp (nấu, nướng, chiên…)',
    room: 'Không',
    cool: '1 ngày',
    freeze: '1 tháng',
    note: NOTE_DELI,
    keywords: ['xuc xich nuong', 'xuc xich chien', 'thit nguoi da nau'],
  },

  // 5. Sữa và sản phẩm từ sữa (đã mở bao bì)
  {
    code: 'SHE-19',
    group: 'Sữa và sản phẩm từ sữa (đã mở bao bì)',
    name: 'Phô mai cứng (cheddar, mozzarella…)',
    room: 'Không',
    cool: '7 ngày',
    freeze: 'Theo NSX',
    note: NOTE_DAIRY,
    keywords: ['phomai cung', 'cheddar', 'mozzarella', 'parmesan', 'phomai'],
  },
  {
    code: 'SHE-20',
    group: 'Sữa và sản phẩm từ sữa (đã mở bao bì)',
    name: 'Phô mai mềm/tươi (ricotta, cream cheese…)',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_DAIRY,
    keywords: ['phomai mem', 'phomai tuoi', 'ricotta', 'cream cheese', 'mascarpone', 'phomai'],
  },
  {
    code: 'SHE-21',
    group: 'Sữa và sản phẩm từ sữa (đã mở bao bì)',
    name: 'Sữa tươi, sữa béo, kem tươi',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Theo NSX',
    note: NOTE_DAIRY,
    keywords: ['sua tuoi', 'sua beo', 'kem tuoi', 'whipping cream', 'heavy cream'],
  },
  {
    code: 'SHE-22',
    group: 'Sữa và sản phẩm từ sữa (đã mở bao bì)',
    name: 'Bơ',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Theo NSX',
    note: NOTE_DAIRY,
    keywords: ['bo', 'butter'],
  },
  {
    code: 'SHE-23',
    group: 'Sữa và sản phẩm từ sữa (đã mở bao bì)',
    name: 'Sữa đặc có đường',
    room: '8 giờ',
    cool: '7 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_DAIRY,
    keywords: ['sua dac', 'sua dac co duong', 'condensed milk'],
  },

  // 6. Trứng
  {
    code: 'SHE-24',
    group: 'Trứng',
    name: 'Chưa xử lý nhiệt (còn nguyên vỏ)',
    room: 'Không',
    cool: 'Theo NSX, không quá HSD in trên vỏ/bao bì',
    freeze: 'Không cấp đông',
    note: NOTE_EGG,
    keywords: ['trung', 'trung song', 'trung nguyen vo', 'trung ga', 'egg'],
  },
  {
    code: 'SHE-25',
    group: 'Trứng',
    name: 'Đã xử lý nhiệt (luộc, chiên, hấp…)',
    room: 'Không',
    cool: '1 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_EGG,
    keywords: ['trung', 'trung luoc', 'trung chien', 'trung hap', 'trung chin', 'egg'],
  },

  // 7. Rau củ quả tươi (chưa cắt, chưa bóc vỏ)
  {
    code: 'SHE-26',
    group: 'Rau củ quả tươi (chưa cắt, chưa bóc vỏ)',
    name: 'Rau lá (cải, xà lách…) – sơ chế sạch, hút chân không',
    room: 'Không',
    cool: '5 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_FRESH_PRODUCE,
    keywords: ['rau la', 'rau cai', 'xa lach', 'rau tuoi', 'rau'],
  },
  {
    code: 'SHE-27',
    group: 'Rau củ quả tươi (chưa cắt, chưa bóc vỏ)',
    name: 'Quả có múi (cam, quýt, bưởi…)',
    room: '3 ngày',
    cool: '14 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_FRESH_PRODUCE,
    keywords: ['cam', 'quyt', 'buoi', 'chanh', 'qua co mui', 'trai cay'],
  },
  {
    code: 'SHE-28',
    group: 'Rau củ quả tươi (chưa cắt, chưa bóc vỏ)',
    name: 'Các loại quả khác',
    room: '2 ngày',
    cool: '5 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_FRESH_PRODUCE,
    keywords: ['trai cay tuoi', 'hoa qua tuoi', 'dau tay', 'nho', 'qua mong', 'tao', 'dua', 'trai cay'],
  },
  {
    code: 'SHE-29',
    group: 'Rau củ quả tươi (chưa cắt, chưa bóc vỏ)',
    name: 'Rau củ cứng (cà rốt, súp lơ, đậu que…)',
    room: '1 ngày',
    cool: '5 ngày',
    freeze: '3 tháng (đã chần)',
    note: NOTE_FRESH_PRODUCE,
    keywords: ['rau cu cung', 'ca rot', 'sup lo', 'dau que', 'bong cai'],
  },
  {
    code: 'SHE-30',
    group: 'Rau củ quả tươi (chưa cắt, chưa bóc vỏ)',
    name: 'Củ, hành, tỏi chưa gọt (khoai tây, khoai lang, hành tây, tỏi…)',
    room: '14 ngày (nơi khô, thoáng, tối)',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_FRESH_PRODUCE,
    keywords: ['khoai tay', 'khoai lang', 'hanh tay', 'toi', 'cu hanh toi'],
  },

  // 8. Rau củ quả đã sơ chế, đã cắt
  {
    code: 'SHE-31',
    group: 'Rau củ quả đã sơ chế, đã cắt',
    name: 'Rau củ sơ chế thô (đã gọt, rửa, chưa cắt)',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_CUT_PRODUCE,
    keywords: ['rau cu so che tho', 'rau cu da got', 'cu da got'],
  },
  {
    code: 'SHE-32',
    group: 'Rau củ quả đã sơ chế, đã cắt',
    name: 'Rau & trái cây đã cắt, sử dụng ngay',
    room: 'Không',
    cool: '1 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_CUT_PRODUCE,
    keywords: ['rau da cat', 'trai cay da cat', 'hoa qua cat san', 'salad', 'dua'],
  },

  // 9. Các loại sốt (đã mở bao bì hoặc đã chiết rót)
  {
    code: 'SHE-33',
    group: 'Các loại sốt (đã mở bao bì hoặc đã chiết rót)',
    name: 'Nước tương hoặc nước mắm',
    room: '7 ngày',
    cool: 'Theo NSX, tối đa 30 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_SAUCE,
    keywords: ['nuoc tuong', 'xi dau', 'nuoc mam', 'soy sauce', 'fish sauce'],
  },
  {
    code: 'SHE-34',
    group: 'Các loại sốt (đã mở bao bì hoặc đã chiết rót)',
    name: 'Tương ớt',
    room: '7 ngày',
    cool: 'Theo NSX, tối đa 30 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_SAUCE,
    keywords: ['tuong ot', 'chili sauce'],
  },
  {
    code: 'SHE-35',
    group: 'Các loại sốt (đã mở bao bì hoặc đã chiết rót)',
    name: 'Tương cà chua',
    room: '7 ngày',
    cool: 'Theo NSX, tối đa 30 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_SAUCE,
    keywords: ['tuong ca', 'ketchup', 'tomato sauce'],
  },
  {
    code: 'SHE-36',
    group: 'Các loại sốt (đã mở bao bì hoặc đã chiết rót)',
    name: 'Mù tạt',
    room: '3 ngày',
    cool: 'Theo NSX, tối đa 14 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_SAUCE,
    keywords: ['mu tat', 'mustard'],
  },
  {
    code: 'SHE-37',
    group: 'Các loại sốt (đã mở bao bì hoặc đã chiết rót)',
    name: 'Sốt tự làm từ trứng/sữa',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_SAUCE,
    keywords: ['sot trung sua', 'mayonnaise', 'hollandaise', 'sot kem', 'sot tu lam', 'caesar'],
  },
  {
    code: 'SHE-38',
    group: 'Các loại sốt (đã mở bao bì hoặc đã chiết rót)',
    name: 'Sốt, nước chấm tự nấu (không trứng, không sữa)',
    room: 'Không',
    cool: '3 ngày',
    freeze: '1 tháng',
    note: NOTE_SAUCE,
    keywords: ['sot tu nau', 'nuoc cham', 'sot bbq', 'sot ca chua'],
  },

  // 10. Đồ uống (đã mở bao bì hoặc đã pha chế)
  {
    code: 'SHE-39',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Cốt hoa quả',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Theo NSX',
    note: NOTE_BEVERAGE,
    keywords: ['cot hoa qua', 'cot trai cay', 'puree', 'nuoc cot chanh', 'nuoc cot cam'],
  },
  {
    code: 'SHE-40',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Sirô cô đặc các loại',
    room: '1 tháng',
    cool: '3 tháng',
    freeze: 'Không cấp đông',
    note: NOTE_BEVERAGE,
    keywords: ['siro', 'syrup', 'siro co dac'],
  },
  {
    code: 'SHE-41',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Nước đường cô đặc các loại',
    room: '1 tháng',
    cool: '3 tháng',
    freeze: 'Không cấp đông',
    note: NOTE_BEVERAGE,
    keywords: ['nuoc duong', 'nuoc duong co dac', 'sugar syrup'],
  },
  {
    code: 'SHE-42',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Nước ép tự làm',
    room: 'Không',
    cool: '1 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_BEVERAGE,
    keywords: ['nuoc ep tu lam', 'nuoc ep tuoi', 'nuoc trai cay ep', 'fresh juice'],
  },
  {
    code: 'SHE-43',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Nước ép/nước trái cây đóng hộp, đóng chai (đã mở)',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_BEVERAGE,
    keywords: ['nuoc ep dong hop', 'nuoc trai cay dong chai', 'canned juice', 'bottled juice'],
  },
  {
    code: 'SHE-44',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Sữa hạt, sữa thực vật đóng hộp (đã mở)',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_BEVERAGE,
    keywords: ['sua hat', 'sua thuc vat', 'sua hanh nhan', 'sua dau nanh', 'oat milk', 'soy milk'],
  },
  {
    code: 'SHE-45',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Nước ngọt có gas, nước khoáng có gas, bia (chai/lon đã mở)',
    room: '8 giờ',
    cool: 'Trong ngày',
    freeze: 'Không cấp đông',
    note: NOTE_BEVERAGE,
    keywords: ['nuoc ngot co gas', 'nuoc khoang co gas', 'bia', 'beer', 'soda', 'cola', 'soft drink'],
  },
  {
    code: 'SHE-46',
    group: 'Đồ uống (đã mở bao bì hoặc đã pha chế)',
    name: 'Trà, cà phê pha sẵn hoặc ủ lạnh (không sữa)',
    room: '4 giờ',
    cool: '2 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_BEVERAGE,
    keywords: ['tra pha san', 'ca phe pha san', 'ca phe phin', 'cold brew', 'tra u lanh'],
  },

  // 11. Thực phẩm làm bánh/ bột/ tinh bột
  {
    code: 'SHE-47',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Bột mì trộn sẵn',
    room: 'Không',
    cool: '3 ngày',
    freeze: '1 tháng',
    note: NOTE_BAKERY,
    keywords: ['bot mi tron san', 'bot banh'],
  },
  {
    code: 'SHE-48',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Bánh bao',
    room: 'Không',
    cool: '3 ngày',
    freeze: '1 tháng',
    note: NOTE_BAKERY,
    keywords: ['banh bao', 'dimsum', 'steamed bun'],
  },
  {
    code: 'SHE-49',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Bánh nướng chín (không kem, không nhân kem/sữa/trứng)',
    room: '1 ngày',
    cool: '3 ngày',
    freeze: '1 tháng',
    note: NOTE_BAKERY,
    keywords: ['banh nuong chin', 'banh mi', 'croissant', 'banh khong kem', 'bread', 'baguette'],
  },
  {
    code: 'SHE-50',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Bánh có kem, nhân kem/sữa/trứng/phô mai',
    room: 'Không',
    cool: '2 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_BAKERY,
    keywords: ['banh kem', 'banh co kem', 'banh ngot', 'banh bong lan kem', 'tiramisu', 'cheesecake', 'su kem', 'cake'],
  },
  {
    code: 'SHE-51',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Bánh chưa nướng (bột đông lạnh)',
    room: 'Không',
    cool: '3 ngày',
    freeze: '1 tháng',
    note: NOTE_BAKERY,
    keywords: ['banh chua nuong', 'bot dong lanh', 'bat croissant', 'puff pastry', 'dough'],
  },
  {
    code: 'SHE-52',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Các loại tinh bột, đậu đã xử lý nhiệt (mì, bún, miến, đậu…)',
    room: 'Không',
    cool: '3 ngày',
    freeze: '1 tháng',
    note: NOTE_BAKERY,
    keywords: ['mi da nau', 'mi y', 'pasta', 'bun', 'mien', 'dau da nau', 'tinh bot'],
  },
  {
    code: 'SHE-53',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Cơm, xôi, khoai đã xử lý nhiệt',
    room: 'Không',
    cool: '3 ngày',
    freeze: '1 tháng (trừ khoai tây)',
    note: NOTE_BAKERY,
    keywords: ['com', 'xoi', 'khoai chin', 'com chin', 'rice'],
  },
  {
    code: 'SHE-54',
    group: 'Thực phẩm làm bánh/ bột/ tinh bột',
    name: 'Bắp rang bơ (đã rang)',
    room: '1 ngày (đựng kín)',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_BAKERY,
    keywords: ['bap rang bo', 'popcorn', 'ngo rang'],
  },

  // 12. Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)
  {
    code: 'SHE-55',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Bột trà và lá trà khô',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['bot tra', 'la tra kho', 'tra o long', 'tra den', 'tra xanh', 'tea'],
  },
  {
    code: 'SHE-56',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Trà túi (đã mở gói)',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['tra tui loc', 'tra tui', 'tea bag'],
  },
  {
    code: 'SHE-57',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Bột ca cao (đã mở gói)',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['bot ca cao', 'cacao', 'cocoa', 'socola'],
  },
  {
    code: 'SHE-58',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Bột cà phê (đã mở gói)',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['bot ca phe', 'ca phe bot', 'coffee'],
  },
  {
    code: 'SHE-59',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Bột pha đồ uống (matcha, bột sữa, bột kem béo…)',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['matcha', 'bot sua', 'bot kem beo', 'bot pha do uong', 'frappe powder'],
  },
  {
    code: 'SHE-60',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Ngô hạt khô (chưa rang)',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['ngo hat kho', 'bap hat kho', 'hat bap', 'corn kernel'],
  },
  {
    code: 'SHE-61',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Gia vị khô, thảo mộc khô (rau mùi khô…)',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['gia vi kho', 'thao moc kho', 'rau mui kho', 'oregano', 'rosemary', 'thyme', 'spice'],
  },
  {
    code: 'SHE-62',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Bột mì, bột gạo, tinh bột, bột trộn sẵn dạng khô',
    room: '3 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['bot mi kho', 'bot gao', 'tinh bot kho', 'bot tron san dang kho', 'flour'],
  },
  {
    code: 'SHE-63',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Ngũ cốc khô, yến mạch, granola',
    room: '1 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['ngu coc kho', 'yen mach', 'granola', 'oats', 'cereal'],
  },
  {
    code: 'SHE-64',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Gạo, mì/bún/miến khô',
    room: '3 tháng',
    cool: 'Không',
    freeze: 'Không cấp đông',
    note: NOTE_DRY,
    keywords: ['gao', 'mi kho', 'bun kho', 'mien kho', 'noodle', 'rice'],
  },
  {
    code: 'SHE-65',
    group: 'Nguyên liệu khô, bột khô, gia vị khô (đã mở bao bì)',
    name: 'Các loại hạt (hạnh nhân, óc chó, hạt điều…)',
    room: '1 tháng',
    cool: '3 tháng',
    freeze: '6 tháng',
    note: NOTE_DRY,
    keywords: ['hat', 'hanh nhan', 'oc cho', 'hat dieu', 'mac ca', 'nuts', 'almond'],
  },

  // 13. Thực phẩm đóng hộp, đóng lon (đã mở)
  {
    code: 'SHE-66',
    group: 'Thực phẩm đóng hộp, đóng lon (đã mở)',
    name: 'Đồ hộp (thịt, cá, đậu, trái cây, nước cốt dừa…)',
    room: 'Không',
    cool: '3 ngày',
    freeze: 'Không cấp đông',
    note: NOTE_CANNED,
    keywords: ['do hop', 'dong lon', 'cot dua', 'ca hop', 'thit hop', 'trai cay hop', 'canned food'],
  },
];

export const SHE_NO_FREEZE_ITEMS: SheNoFreezeItem[] = [
  {
    group: 'Trứng còn nguyên vỏ',
    detail: 'Trứng sống chưa bóc vỏ',
    reason: 'Vỏ nứt, vỡ do giãn nở khi đông; nguy cơ nhiễm khuẩn',
    keywords: ['trung song', 'nguyen vo', 'trung ga', 'egg'],
  },
  {
    group: 'Trứng đã nấu chín',
    detail: 'Trứng luộc, trứng chiên, trứng hấp…',
    reason: 'Lòng trắng cứng, dai, chảy nước sau khi rã đông',
    keywords: ['trung luoc', 'trung chien', 'trung hap', 'trung chin', 'cooked egg'],
  },
  {
    group: 'Rau lá, rau củ quả ăn tươi',
    detail: 'Xà lách, dưa leo, cà chua, rau thơm tươi…',
    reason: 'Mất nước, nhũn nát, đổi màu sau khi rã đông',
    keywords: ['rau la', 'xa lach', 'dua leo', 'ca chua', 'rau thom', 'fresh vegetables'],
  },
  {
    group: 'Các món trộn sốt mayonnaise',
    detail: 'Salad trộn, gỏi trộn sốt, sandwich sốt…',
    reason: 'Sốt tách dầu, món ăn có mùi lạ, chảy nước',
    keywords: ['salad tron', 'goi tron', 'sandwich sot', 'mayonnaise'],
  },
  {
    group: 'Khoai tây sống',
    detail: 'Khoai thái lát/thỏi chưa chần',
    reason: 'Bị thâm, chảy nước, đổi màu sau khi rã đông',
    keywords: ['khoai tay song', 'khoai tay', 'raw potato'],
  },
  {
    group: 'Mì Ý đã trộn sốt kem/sốt sánh',
    detail: 'Mì Ý sốt kem, sốt carbonara…',
    reason: 'Tách nước, tách dầu, mì nhũn nát',
    keywords: ['mi y', 'pasta', 'carbonara', 'sot kem'],
  },
  {
    group: 'Các loại phô mai mềm',
    detail: 'Phô mai tươi, ricotta, cream cheese…',
    reason: 'Tách nước, tách béo, mất độ mịn',
    keywords: ['phomai mem', 'phomai tuoi', 'ricotta', 'cream cheese', 'soft cheese'],
  },
  {
    group: 'Nước sốt đặc (kem, mayonnaise, hollandaise)',
    detail: 'Sốt salad, sốt kem…',
    reason: 'Tách dầu, tách nước, không còn sánh mịn',
    keywords: ['nuoc sot dac', 'mayonnaise', 'hollandaise', 'sot salad', 'cream sauce'],
  },
  {
    group: 'Bánh bông lan có kem',
    detail: 'Bánh bông lan nhân hoặc phủ kem (bơ, kem tươi…)',
    reason: 'Kem tách nước, chảy rữa, bánh bở',
    keywords: ['banh bong lan', 'banh co kem', 'banh phu kem', 'cream cake'],
  },
  {
    group: 'Đồ uống có gas hoặc chứa cồn cao',
    detail: 'Nước ngọt có gas, bia, rượu mạnh',
    reason: 'Chai, lon có thể nổ do giãn nở; đồ uống cồn cao không đông đặc hoàn toàn và biến đổi hương vị',
    keywords: ['nuoc ngot co gas', 'bia', 'ruou manh', 'do uong co con', 'soda', 'beer'],
  },
  {
    group: 'Ngũ cốc khô',
    detail: 'Yến mạch, granola, bột ngũ cốc…',
    reason: 'Là thực phẩm khô, cấp đông không kéo dài được hạn sử dụng mà còn gây ẩm, mốc do ngưng tụ nước',
    keywords: ['ngu coc kho', 'yen mach', 'granola', 'cereal', 'oats'],
  },
];

export function serializeSheRegulationForAiPrompt(): string {
  const header = `QUY ĐỊNH CHÍNH THỨC KHỐI SHE (${SHE_DOC_METADATA.decisionNo} | Mã hiệu: ${SHE_DOC_METADATA.docCode} | Phiên bản ${SHE_DOC_METADATA.version} | Hiệu lực: ${SHE_DOC_METADATA.effectiveDate} | Ký ban hành: ${SHE_DOC_METADATA.signer})`;
  const policies = SHE_POLICY_SECTIONS.map(
    (s) => `[${s.article} - ${s.title}]\n${s.summary}`
  ).join('\n\n');
  const tableItems = SHE_FOOD_ITEMS.map(
    (it) =>
      `${it.code} | ${it.group} | ${it.name} | Nhiệt độ phòng (15-25°C): ${it.room} | Nhiệt độ lạnh (0-5°C): ${it.cool} | Nhiệt độ đông (≤ -18°C): ${it.freeze} | Lưu ý: ${it.note}`
  ).join('\n');
  const noFreeze = SHE_NO_FREEZE_ITEMS.map(
    (nf) => `- ${nf.group} (${nf.detail}): ${nf.reason}`
  ).join('\n');

  return `${header}\n\n--- QUY ĐỊNH CHUNG & VẬN HÀNH (ĐIỀU 1 - ĐIỀU 9) ---\n${policies}\n\n--- BẢNG ĐIỀU 7 (66 MỤC THỰC PHẨM KHỐI SHE) ---\n${tableItems}\n\n--- ĐIỀU 8: 11 NHÓM THỰC PHẨM KHÔNG CẤP ĐÔNG ---\n${noFreeze}`;
}
