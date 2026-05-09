import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

/**
 * API Route: GET /api/classes
 * Giả lập backend endpoint cần accessToken hợp lệ.
 * NextAuth đã tự refresh token trước khi request này chạy.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Lấy session (đã được NextAuth cập nhật token mới nếu cần)
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  if (session.role !== "ROLE_ADVISOR") {
    return res.status(403).json({ message: "Không đủ quyền truy cập" });
  }

  if (session.error === "RefreshAccessTokenError") {
    return res.status(401).json({ message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" });
  }

  // Giả lập dữ liệu danh sách lớp
  const classes = [
    { id: 1, name: "Lớp A1", students: 30, advisor: "advisor" },
    { id: 2, name: "Lớp A2", students: 28, advisor: "advisor" },
    { id: 3, name: "Lớp A3", students: 32, advisor: "advisor" },
  ];

  return res.status(200).json({
    classes,
    accessToken: session.accessToken?.slice(0, 20) + "...",
    expiresAt: new Date(session.accessTokenExpires).toLocaleTimeString("vi-VN"),
    timestamp: new Date().toLocaleTimeString("vi-VN"),
  });
}
