# Hệ Thống Tra Cứu Nội Bộ — Bảo Quản & Hạn Sử Dụng Thực Phẩm (Ban Ẩm Thực - Sun World Ba Na Hills)

Ứng dụng web **Offline-First (PWA)** phục vụ tra cứu quy định nhiệt độ bảo quản và thời hạn sử dụng thực phẩm tuân thủ **Quyết định 107/2026/QĐ-SHE/SG (SHE-QĐ-FB13 · Phiên bản 00)** dành cho **Ban Ẩm Thực - Sun World Ba Na Hills**.

## Tính năng chính
- **66 nhóm/chủng loại thực phẩm chuẩn mực (SHE-01 → SHE-66)**: Giữ nguyên 100% thông số nhiệt độ, thời hạn chưa mở/đã mở bao bì, quy cách đóng gói và ghi chú pháp lý từ Quyết định 107/2026/QĐ-SHE/SG.
- **11 nhóm Điều 8 (Không cấp đông) & Toàn văn Điều 1–9**: Tích hợp tra cứu quy định ghi nhãn 4 nội dung, thứ tự xếp tủ mát 5 tầng, làm nguội 2 giai đoạn, rã đông 24 giờ và giới hạn 4 giờ / 7 ngày.
- **Đa ngôn ngữ (VI / EN / KO / HI)**: Chuyển đổi đồng bộ giao diện, danh mục, lịch sử, quản trị và trợ lý AI.
- **Tìm kiếm thông minh & Trợ lý AI**: Nhận diện tiếng Việt có/không dấu, phân biệt cặp dễ nhầm (`bơ` ≠ `bò`, `dứa` ≠ `dừa`), hiểu từ đồng nghĩa F&B và tự động fallback tìm kiếm cục bộ khi Offline.
- **Offline-First PWA + IndexedDB**: Hoạt động mượt mà khi mất mạng, cài đặt được lên màn hình chính (iOS/Android/Desktop).
- **Quản trị Super Admin & Đồng bộ Realtime (Supabase)**: Bảo vệ bằng SHA-256, thêm/sửa/xóa/di chuyển hàng cột, khóa/mở app bằng PIN, phân quyền user, Import/Export (`.json`, `.csv`, `.xlsx`) và đồng bộ tức thời qua Supabase Realtime.

## Triển khai trên Vercel (GitHub Auto-Deploy)

1. Đẩy mã nguồn lên GitHub và kết nối repository trong **Vercel Dashboard** (**Add New Project**).
2. Vercel tự động nhận cấu hình từ `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Serverless Functions**: `api/ai-chat.ts`, `api/ai-search.ts`
3. Thêm biến môi trường trong **Project Settings → Environment Variables** trên Vercel:
   - `GEMINI_API_KEY`: API Key Gemini dùng cho `/api/ai-chat` và `/api/ai-search` (chỉ chạy phía server).
   - *(Tùy chọn đồng bộ Supabase Realtime cho mọi thiết bị)*:
     - `VITE_CLOUD_SYNC_PROVIDER` = `supabase`
     - `VITE_SUPABASE_URL` = URL dự án Supabase
     - `VITE_SUPABASE_ANON_KEY` = Supabase Anon Key
     - `VITE_SUPABASE_TABLE` = `foods`

### SQL khởi tạo bảng & bật Realtime trên Supabase
```sql
create table if not exists foods (
  code text primary key,
  updated_at timestamptz default now(),
  payload jsonb not null
);

alter publication supabase_realtime add table foods;
```

## Chạy phát triển cục bộ
```bash
npm install
npm run dev
```
Mặc định chạy tại `http://localhost:3000`.
