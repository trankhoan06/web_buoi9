import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ============================================================
// GIẢ LẬP BACKEND: danh sách user và hàm gọi refresh token
// ============================================================
const FAKE_USERS = {
  advisor: { id: "1", name: "Advisor", username: "advisor", password: "123456", role: "ROLE_ADVISOR" },
  student: { id: "2", name: "Student", username: "student", password: "123456", role: "ROLE_STUDENT" },
};

/**
 * Giả lập gọi API backend để refresh access token.
 * Trong thực tế, đây là fetch() đến endpoint /api/auth/refresh của backend.
 */
async function refreshAccessToken(token) {
  try {
    console.log("[NextAuth] Token hết hạn, đang refresh...");

    // Giả lập backend trả về token mới
    const newAccessToken = "access_token_" + Date.now();
    const newRefreshToken = token.refreshToken; // Giữ nguyên hoặc backend trả refresh token mới

    console.log("[NextAuth] Refresh thành công! Token mới:", newAccessToken.slice(0, 20) + "...");

    return {
      ...token,
      accessToken: newAccessToken,
      // accessToken hết hạn sau 60 giây (60 * 1000 ms)
      accessTokenExpires: Date.now() + 60 * 1000,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error("[NextAuth] Refresh thất bại:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// ============================================================
// NEXTAUTH CONFIG
// ============================================================
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = FAKE_USERS[credentials?.username];

        if (!user || user.password !== credentials?.password) {
          throw new Error("Sai tên đăng nhập hoặc mật khẩu");
        }

        // Giả lập backend trả về 2 token sau khi xác thực thành công
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          accessToken: "access_token_" + Date.now(),
          refreshToken: "refresh_token_" + Date.now(),
        };
      },
    }),
  ],

  callbacks: {
    /**
     * jwt() callback: chạy mỗi khi tạo hoặc cập nhật JWT.
     * Đây là nơi lưu token và kiểm tra/refresh khi hết hạn.
     */
    async jwt({ token, user }) {
      // Lần đầu đăng nhập: user có giá trị → lưu token vào JWT
      if (user) {
        console.log("[NextAuth] jwt() - Lần đầu đăng nhập, lưu token...");
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          // accessToken hết hạn sau 60 giây
          accessTokenExpires: Date.now() + 60 * 1000,
          role: user.role,
          username: user.username,
        };
      }

      // Token còn hạn → trả về nguyên
      if (Date.now() < token.accessTokenExpires) {
        console.log("[NextAuth] jwt() - Token còn hạn, trả về nguyên.");
        return token;
      }

      // Token hết hạn → gọi refreshAccessToken()
      console.log("[NextAuth] jwt() - Token hết hạn! Đang gọi refreshAccessToken()...");
      return refreshAccessToken(token);
    },

    /**
     * session() callback: expose thông tin cần thiết ra client.
     * Chỉ expose những gì cần thiết, không expose refreshToken.
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.role = token.role;
      session.username = token.username;
      session.error = token.error; // Để client biết nếu refresh thất bại
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    // Session tồn tại 1 ngày (refreshToken lifetime)
    maxAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET || "nextauth-secret-key-for-exercise",
};

export default NextAuth(authOptions);
