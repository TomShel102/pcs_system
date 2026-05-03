# pcs_system
# pcs_system — Parking management system

Backend Express (Node.js, ESM) kết nối PostgreSQL. Entry point: `server.js`.

## Yêu cầu

- **Node.js** (khuyến nghị LTS, hỗ trợ `import` / `"type": "module"`)
- **PostgreSQL** đang chạy và database đã tạo (theo `DB_NAME` trong `.env`)

## Cài đặt

```bash
npm install
cp .env.example .env
```

Chỉnh `.env` cho đúng máy bạn (đặc biệt `DB_*`). Các biến **bắt buộc** để server khởi động: `DB_USER`, `DB_HOST`, `DB_PORT`, `DB_NAME` (và thường cần `DB_PASSWORD` nếu Postgres yêu cầu).

### Chuẩn bị database (tùy chọn nhưng nên chạy lần đầu)

```bash
npm run db:setup
```

Tương đương `npm run db:migrate` rồi `npm run db:seed`.

## Các cách chạy server

### 1. Chạy production / bình thường (`node`)

```bash
npm start
```

Gọi `node server.js` — không tự restart khi đổi code.

### 2. Chạy khi dev (tự reload khi sửa file)

```bash
npm run dev
```

Dùng **nodemon** để watch và restart `server.js`.

### 3. Chạy trực tiếp bằng Node (không qua npm script)

```bash
node server.js
```

Cùng hành vi với `npm start`.

---

Sau khi chạy, log sẽ in địa chỉ mặc định:

- **URL:** `http://localhost:<PORT>`
- **PORT:** lấy từ biến môi trường `PORT`; nếu không set thì **3000** (xem `src/utils/env.js`).

Dừng server: `Ctrl+C` (shutdown có đóng pool PostgreSQL).

## Biến môi trường (tham chiếu)

File mẫu: `.env.example`.

| Biến | Mô tả |
|------|--------|
| `PORT` | Cổng HTTP (mặc định `3000`) |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` | Kết nối Postgres |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | Giới hạn request |
| `LOG_FORMAT` | Format log Morgan (vd. `combined`) |
| `CORS_ORIGIN` | Origin CORS, có thể nhiều giá trị cách nhau bởi dấu phẩy |
| `AUTH_SECRET`, `AUTH_TOKEN_TTL_MS`, `AUTH_COMPAT_MODE`, `AUTH_ENFORCED` | Cấu hình auth (xem `getAppConfig` trong `src/utils/env.js`) |

## Script npm khác

| Lệnh | Mục đích |
|------|----------|
| `npm test` | Chạy test Node built-in |
| `npm run test:smoke` | Smoke test API |
| `npm run db:migrate` / `db:seed` / `db:setup` | Migration / seed / cả hai |
| `npm run db:audit` | Kiểm tra dữ liệu |
