# Hệ Thống Tra Cứu Nhiệt Độ Bảo Quản & Thời Hạn Sử Dụng Thực Phẩm - BNC

Ứng dụng web **Offline-First (PWA)** phục vụ tra cứu nhiệt độ bảo quản và thời hạn sử dụng thực phẩm cho **Ban Ẩm Thực - Sun World Ba Na Hills**.

## Tính năng chính
- **145 mặt hàng chuẩn (PL1, PL2, PL3)**: Giữ nguyên thông số, ghi chú và cảnh báo QA từ tài liệu gốc.
- **Đa ngôn ngữ (VI / EN / KO / HI)**: Chuyển đổi đồng bộ toàn bộ giao diện, danh mục, lịch sử, quản trị và trợ lý AI.
- **Offline-First PWA + IndexedDB**: Hoạt động mượt mà 100% không cần mạng, tự động lưu lịch sử xem nhiều, từ khóa tìm kiếm và hỏi đáp AI cục bộ trên thiết bị.
- **Quản trị Admin & Phân quyền (RBAC)**: Bảo vệ bằng SHA-256, hỗ trợ CRUD mặt hàng, cấu hình giao diện/banner, Import/Export (`.json`, `.csv`, `.xlsx`) và phân quyền theo nhóm hàng.
- **Đồng bộ Cloud (Supabase)**: Hỗ trợ đồng bộ danh mục giữa nhiều thiết bị qua Supabase REST API.
- **Trợ lý AI & Tìm kiếm thông minh (RAG)**: Trả lời hoàn toàn dựa trên dữ liệu hệ thống (nhớ 10 lượt hội thoại), tự động chuyển sang tìm kiếm cục bộ khi Offline.

## Triển khai trên Vercel (GitHub Auto-Deploy)

1. Đẩy mã nguồn lên repository GitHub và kết nối repository đó trong **Vercel Dashboard** (**Add New Project**).
2. Vercel tự động nhận diện cấu hình từ `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Serverless Functions**: `api/ai-chat.ts`, `api/ai-search.ts`
3. Thêm biến môi trường trong **Project Settings → Environment Variables** trên Vercel:
   - `GEMINI_API_KEY`: API Key Gemini dùng cho `/api/ai-chat` và `/api/ai-search` (chỉ chạy ở server).
   - *(Tùy chọn đồng bộ Supabase mặc định)*:
     - `VITE_CLOUD_SYNC_PROVIDER` = `supabase`
     - `VITE_SUPABASE_URL` = URL dự án Supabase
     - `VITE_SUPABASE_ANON_KEY` = Supabase Anon Key
     - `VITE_SUPABASE_TABLE` = Tên bảng (ví dụ `foods`)

### SQL tạo bảng nhanh trên Supabase
```sql
create table if not exists foods (
  code text primary key,
  updated_at timestamptz default now(),
  payload jsonb not null
);
```

## Chạy phát triển cục bộ
```bash
npm install
npm run dev
```
Mặc định chạy tại `http://localhost:3000`.
