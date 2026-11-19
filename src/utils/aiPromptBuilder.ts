import { FOOD_ITEMS, getItemCode } from '../data/foodData';
import { serializeSheRegulationForAiPrompt } from '../data/sheRegulationData';
import type { Lang } from '../types';

export interface AiCatalogEntry {
  code?: string;
  g?: string;
  name?: string;
  enName?: string;
  room?: string;
  cool?: string;
  freeze?: string;
  standardTemp?: string;
  shelfLifeUnopened?: string;
  shelfLifeOpened?: string;
  packagingSpec?: string;
  note?: string;
  haccpNote?: string;
  customFields?: Record<string, string>;
}

const LANG_INSTRUCTION: Record<Lang, string> = {
  VI: 'Mặc định trả lời bằng Tiếng Việt tự nhiên, ngắn gọn, chuẩn chuyên môn bếp/SHE (trừ khi người dùng hỏi bằng ngôn ngữ khác thì trả lời theo ngôn ngữ của câu hỏi).',
  EN: 'Answer in English if the user asks in English, or match the language of the user query while preserving [SHE-xx] codes and exact regulation terms.',
  KO: 'Answer in Korean if the user asks in Korean, or match the language of the user query while preserving [SHE-xx] codes and exact regulation terms.',
  HI: 'Answer in Hindi if the user asks in Hindi, or match the language of the user query while preserving [SHE-xx] codes and exact regulation terms.',
};

export function serializeActiveCatalogForGemini(rawCatalog?: unknown): {
  catalogText: string;
  validCodes: Set<string>;
} {
  const entries: AiCatalogEntry[] =
    Array.isArray(rawCatalog) && rawCatalog.length > 0
      ? rawCatalog
          .filter((x): x is AiCatalogEntry => Boolean(x && typeof x === 'object'))
          .slice(0, 600)
      : FOOD_ITEMS.map((item) => ({
          code: getItemCode(item),
          g: item.g,
          name: item.name,
          enName: item.enName || '',
          room: item.room,
          cool: item.cool,
          freeze: item.freeze,
          note: item.note,
          haccpNote: item.flag || '',
        }));

  const validCodes = new Set<string>();
  const normalizedItems = entries.map((item) => {
    const code = String(item.code || '').trim().toUpperCase();
    if (code) validCodes.add(code);
    const obj: Record<string, unknown> = {
      code,
      group: item.g || '',
      name: item.name || '',
    };
    if (item.enName) obj.enName = item.enName;
    if (item.room && item.room !== '—') obj.room_15_25C = item.room;
    if (item.cool && item.cool !== '—') obj.cool_0_5C = item.cool;
    if (item.freeze && item.freeze !== '—') obj.freeze_le_minus18C = item.freeze;
    if (item.note && item.note !== '—') obj.note = item.note;
    if (item.haccpNote) obj.haccpOrQa = item.haccpNote;
    if (item.standardTemp) obj.standardTemp = item.standardTemp;
    if (item.shelfLifeUnopened) obj.shelfLifeUnopened = item.shelfLifeUnopened;
    if (item.shelfLifeOpened) obj.shelfLifeOpened = item.shelfLifeOpened;
    if (item.packagingSpec) obj.packagingSpec = item.packagingSpec;
    if (item.customFields && Object.keys(item.customFields).length > 0) {
      obj.customFields = item.customFields;
    }
    return JSON.stringify(obj);
  });

  return {
    catalogText: normalizedItems.join('\n'),
    validCodes,
  };
}

export function buildSheGeminiSystemInstruction(
  rawCatalog: unknown,
  lang: Lang = 'VI'
): {
  systemInstruction: string;
  validCodes: Set<string>;
} {
  const { catalogText, validCodes } = serializeActiveCatalogForGemini(rawCatalog);
  const shePolicyText = serializeSheRegulationForAiPrompt();

  const systemInstruction = `Bạn là Trợ lý Chuyên gia về An toàn Thực phẩm & Bảo quản Hàng hóa. Nhiệm vụ của bạn là giải đáp mọi thắc mắc của nhân viên dựa TRÊN DUY NHẤT bộ dữ liệu quy định được cung cấp dưới đây.
- Khả năng thấu hiểu linh hoạt: Hiểu từ viết tắt, tiếng lóng ngành bếp, lỗi gõ dấu, ngôn ngữ đời thường (VD: 'bò rã đông rồi để tủ mát được mấy hôm?', 'thịt heo mở bịch ra rồi sao?', 'cá hồi tươi để nhiệt độ nào?'). Tự động suy luận và ánh xạ câu hỏi của người dùng với đúng danh mục thực phẩm trong quy định.
- Tư duy phân tách tình huống: Nếu một loại thực phẩm có nhiều điều kiện bảo quản khác nhau trong quy định (VD: Chưa mở bao bì vs Đã mở bao bì; Bảo quản mát vs Bảo quản đông; Hàng tươi vs Hàng chín), hãy chủ động liệt kê rõ ràng TẤT CẢ các trường hợp đó để người dùng đối chiếu, tránh nhầm lẫn.
- Phong cách trả lời & Tối ưu độ dài: Trả lời ngắn gọn, súc tích, đi thẳng vào trọng tâm như đồng nghiệp hướng dẫn làm việc (ưu tiên 2–5 gạch đầu dòng cô đọng, chỉ tách thêm khi có nhiều trạng thái bảo quản khác nhau; không lặp lại câu hỏi hay viết lời mở đầu dài dòng). IN ĐẬM các thông số Nhiệt độ (°C) và Thời hạn sử dụng (HSD).
- Quy tắc an toàn (Chống bịa đặt): Nếu người dùng hỏi một mặt hàng hoàn toàn không có trong dữ liệu quy định, hãy trả lời thẳng thắn: 'Hiện tại mặt hàng này chưa có quy định cụ thể trong tài liệu chuẩn', sau đó gợi ý 1-2 nhóm thực phẩm tương đồng nhất có trong file để người dùng tham khảo.

NGUYÊN TẮC BẢO TOÀN PHÁP LÝ BẮT BUỘC (QUYẾT ĐỊNH 107/2026/QĐ-SHE/SG · MÃ HIỆU SHE-QĐ-FB13):
1. Tuyệt đối KHÔNG tự bịa, ước lượng hoặc suy đoán nhiệt độ hay số ngày/giờ không có trong dữ liệu bên dưới.
2. Giữ nguyên tính pháp lý của các giá trị "Không", "Không cấp đông", "Theo NSX", "—". Không được biến "Không" hay "Không cấp đông" thành số ngày bảo quản.
3. Ghi rõ mã chuẩn dạng [SHE-xx] (ví dụ [SHE-01], [SHE-24]) khi nhắc tới từng mục trong danh mục để nhân viên bấm xem thẻ chi tiết.
4. Phân biệt tuyệt đối dấu tiếng Việt: "bơ" (butter) ≠ "bò" (thịt bò), "dứa" (pineapple) ≠ "dừa" (coconut). Nếu người dùng gõ không dấu "bo" hoặc "dua" gây mơ hồ, không tự đoán một bên — hãy hỏi lại ngắn gọn ("Bạn đang hỏi **bơ** hay **thịt bò**?" / "**dứa** hay **dừa**?") và liệt kê tóm tắt cả hai nhóm để đối chiếu an toàn.
5. Hội thoại nối tiếp (Multi-turn): Luôn đọc lịch sử 2–3 lượt gần nhất để hiểu ngữ cảnh đại từ ("nó", "loại đó", "vậy còn cấp đông thì sao?") nhưng mọi thông số trả lời vẫn phải lấy trực tiếp từ dữ liệu quy định dưới đây.
6. Ngôn ngữ: ${LANG_INSTRUCTION[lang]}
7. Khi trả lời dựa trên dữ liệu có trong quy định, kết thúc bằng 1 dòng ngắn: *Căn cứ: Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13).*

=== DỮ LIỆU DANH MỤC THỰC PHẨM (JSONL; các cột nhiệt độ bỏ trống nghĩa là "—") ===
${catalogText}

=== TOÀN VĂN QUY ĐỊNH ĐIỀU 1–9 & DANH MỤC ĐIỀU 8 (KHÔNG CẤP ĐÔNG) ===
${shePolicyText}`;

  return { systemInstruction, validCodes };
}

export function extractMatchedCodesFromText(
  text: string,
  validCodes: Set<string>
): string[] {
  if (!text) return [];
  const matches = text.toUpperCase().match(/\b[A-Z]{2,6}-\d{1,4}\b/g) || [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const code of matches) {
    if (validCodes.has(code) && !seen.has(code)) {
      seen.add(code);
      result.push(code);
      if (result.length >= 15) break;
    }
  }
  return result;
}
