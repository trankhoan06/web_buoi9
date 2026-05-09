# NextAuth Token Refresh Exercise

Ứng dụng web Next.js mô phỏng cách NextAuth xử lý **tự động refresh access token** trong production, hỗ trợ 2 role người dùng với quyền truy cập khác nhau.

---

## 🚀 Cài đặt & Chạy

```bash
npm install
npm run dev
```

Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Tài khoản demo

| Username | Password | Role |
|----------|----------|------|
| `advisor` | `123456` | `ROLE_ADVISOR` |
| `student` | `123456` | `ROLE_STUDENT` |

---

## 📁 Cấu trúc Project

```
nextauth-exercise/
└── pages/
    ├── _app.js                    # SessionProvider
    ├── login.js                   # Trang đăng nhập
    ├── index.js                   # Dashboard (protected)
    └── api/
        ├── auth/
        │   └── [...nextauth].js   # NextAuth config + callbacks
        └── classes.js             # API route giả lập backend
├── package.json
└── next.config.js
```

---

## 🎯 Các tính năng chính

### Bước 1: Đăng nhập & Lưu token
- `CredentialsProvider` xác thực username/password
- Backend giả lập trả về `accessToken` (hết hạn sau **60 giây**) và `refreshToken` (hết hạn sau 1 ngày)
- `jwt()` callback lưu cả hai token + `accessTokenExpires` + `role` vào JWT

### Bước 2: Phân quyền truy cập
- Trang Dashboard (`/`) chỉ cho `ROLE_ADVISOR` truy cập
- `ROLE_STUDENT` → hiển thị lỗi "Bị Từ Chối Truy Cập"
- Chưa đăng nhập → tự động redirect về `/login` (qua `getServerSideProps`)

### Bước 3: Demo Token Refresh (kịch tính nhất)
1. Đăng nhập với `advisor / 123456`
2. Bấm **"Lấy danh sách lớp"** → Thành công
3. Chờ **60 giây** (xem đồng hồ đếm ngược trên Dashboard)
4. Bấm lại **"Lấy danh sách lớp"** → NextAuth tự động:
   - Phát hiện `Date.now() > accessTokenExpires`
   - Gọi `refreshAccessToken()` với `refreshToken`
   - Nhận `accessToken` mới từ backend (giả lập)
   - Cập nhật session với token mới
   - API call thành công
5. Người dùng **hoàn toàn không biết** refresh đang xảy ra!

---

## 🔑 Luồng JWT Callback

```javascript
async function jwt({ token, user }) {
  // Lần đầu đăng nhập → lưu token
  if (user) {
    return { ...token, accessToken, refreshToken, accessTokenExpires, role }
  }
  // Token còn hạn → trả về nguyên
  if (Date.now() < token.accessTokenExpires) return token
  // Token hết hạn → gọi refresh
  return refreshAccessToken(token)
}
```
