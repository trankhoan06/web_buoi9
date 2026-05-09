import { useSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [timeLeft, setTimeLeft] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [logs, setLogs] = useState(["// Sẵn sàng demo token refresh..."]);

  function addLog(msg, type = "info") {
    const ts = new Date().toLocaleTimeString("vi-VN");
    const prefix = { info: "//", ok: "✅", warn: "⚠️", err: "❌" }[type] || "//";
    setLogs((prev) => [...prev, `[${ts}] ${prefix} ${msg}`]);
  }

  // Đếm ngược thời gian còn lại của access token
  useEffect(() => {
    if (!session?.accessTokenExpires) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((session.accessTokenExpires - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 500);

    return () => clearInterval(interval);
  }, [session?.accessTokenExpires]);

  async function handleGetClasses() {
    setApiLoading(true);
    setApiError(null);
    addLog("Gọi API: GET /api/classes");

    try {
      const res = await fetch("/api/classes");
      const data = await res.json();

      if (!res.ok) {
        addLog(data.message || "Lỗi API", "err");
        setApiError(data.message);
      } else {
        addLog("API thành công! Nhận được danh sách lớp", "ok");
        addLog(`accessToken: ${data.accessToken}`, "info");
        addLog(`Token hết hạn lúc: ${data.expiresAt}`, "info");
        setApiResult(data);
      }
    } catch (err) {
      addLog("Lỗi kết nối: " + err.message, "err");
      setApiError("Lỗi kết nối");
    } finally {
      setApiLoading(false);
    }
  }

  // Tính % còn lại của token (max 60s)
  const tokenPct = timeLeft !== null ? Math.max(0, (timeLeft / 60) * 100) : 100;
  const barColor = tokenPct > 33 ? "#28a745" : tokenPct > 10 ? "#ffc107" : "#dc3545";

  // Loading state
  if (status === "loading") {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <p style={{ color: "#667eea", fontSize: "16px" }}>Đang tải session...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập (xử lý phía client nếu middleware chưa redirect)
  if (!session) {
    return (
      <div style={styles.page}>
        <div style={styles.deniedCard}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#333" }}>Chưa đăng nhập</h2>
          <p style={{ color: "#666", margin: "12px 0" }}>NextAuth redirect về /login</p>
          <a href="/login" style={styles.btnLink}>Về trang đăng nhập</a>
        </div>
      </div>
    );
  }

  // ROLE_STUDENT bị từ chối
  if (session.role !== "ROLE_ADVISOR") {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.deniedCard, background: "#ffe8e8" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h2 style={{ color: "#d32f2f" }}>Bị Từ Chối Truy Cập</h2>
          <p style={{ color: "#666", margin: "12px 0" }}>
            Bạn không có quyền truy cập trang này.
            Chỉ <strong>ROLE_ADVISOR</strong> mới được phép.
          </p>
          <div style={styles.roleBadge}>Role của bạn: {session.role}</div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={styles.btnDanger}>
            Đăng Xuất
          </button>
        </div>
      </div>
    );
  }

  // ROLE_ADVISOR → hiển thị Dashboard
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📊 Dashboard Cố Vấn</h1>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={styles.btnLogout}>
            Đăng Xuất
          </button>
        </div>

        {/* Thông tin session */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Thông Tin Session</h3>
          <div style={styles.infoGrid}>
            <InfoRow icon="👤" label="Người dùng" value={session.username} />
            <InfoRow icon="🔑" label="Role" value={<RoleBadge role={session.role} />} />
            <InfoRow
              icon="🎫"
              label="Access Token"
              value={
                <code style={{ fontSize: "11px" }}>
                  {session.accessToken?.slice(0, 24)}...
                </code>
              }
            />
            <InfoRow
              icon="⏱️"
              label="Hết hạn sau"
              value={
                <span style={{ color: barColor, fontWeight: "700" }}>
                  {timeLeft !== null ? `${timeLeft}s` : "..."}
                </span>
              }
            />
          </div>

          {/* Thanh tiến trình token */}
          <div style={styles.tokenBar}>
            <div style={{ ...styles.tokenFill, width: `${tokenPct}%`, background: barColor }} />
          </div>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
            {timeLeft === 0
              ? "⚠️ Token đã hết hạn — NextAuth sẽ tự động refresh khi bạn gọi API"
              : timeLeft !== null && timeLeft < 10
              ? "⚠️ Token sắp hết hạn!"
              : "✅ Access token còn hạn"}
          </p>
        </div>

        {/* Hướng dẫn demo */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🎬 Hướng Dẫn Demo Token Refresh</h3>
          <ol style={styles.guideList}>
            <li>Bấm <strong>"Lấy danh sách lớp"</strong> → Thành công (token còn hạn)</li>
            <li>Chờ đồng hồ đếm về <strong>0s</strong> (hoặc chờ ~60 giây)</li>
            <li>Bấm lại <strong>"Lấy danh sách lớp"</strong> → NextAuth tự động refresh token</li>
            <li>Xem <strong>Console log</strong> bên dưới để thấy quá trình refresh</li>
          </ol>
          <p style={{ fontSize: "12px", color: "#28a745", marginTop: "12px", fontWeight: "600" }}>
            💡 Người dùng hoàn toàn không biết việc refresh đang xảy ra dưới nền!
          </p>
        </div>

        {/* Buttons */}
        <div style={styles.btnRow}>
          <button onClick={handleGetClasses} style={styles.btnPrimary} disabled={apiLoading}>
            {apiLoading ? "⏳ Đang gọi API..." : "📋 Lấy danh sách lớp"}
          </button>
        </div>

        {/* Kết quả API */}
        {apiError && (
          <div style={styles.alertErr}>❌ {apiError}</div>
        )}
        {apiResult && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📚 Kết Quả API</h3>
            <pre style={styles.pre}>{JSON.stringify(apiResult, null, 2)}</pre>
          </div>
        )}

        {/* Console logs */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🖥️ Console Log — jwt() &amp; refreshAccessToken()</h3>
          <div style={styles.logBox}>
            {logs.map((log, i) => (
              <div key={i} style={{
                color: log.includes("❌") ? "#dc3545"
                  : log.includes("✅") ? "#28a745"
                  : log.includes("⚠️") ? "#ffc107"
                  : "#666",
                padding: "2px 0",
                fontSize: "12px",
                fontFamily: "monospace",
              }}>
                {log}
              </div>
            ))}
          </div>
          <button onClick={() => setLogs(["// Log cleared."])} style={{ ...styles.btnSecondary, marginTop: "8px", fontSize: "12px" }}>
            Xóa log
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
      <span style={{ fontSize: "20px", width: "28px" }}>{icon}</span>
      <span style={{ color: "#667eea", fontWeight: "600", fontSize: "13px", minWidth: "150px" }}>{label}</span>
      <span style={{ color: "#333", fontSize: "13px" }}>{value}</span>
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdvisor = role === "ROLE_ADVISOR";
  return (
    <span style={{
      background: isAdvisor ? "#e8f4fd" : "#fff3cd",
      color: isAdvisor ? "#1565c0" : "#856404",
      padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600",
    }}>
      {role}
    </span>
  );
}

// Bảo vệ trang phía server — kiểm tra session và role
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Chưa đăng nhập → redirect về /login
  if (!session) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  // Đã đăng nhập → truyền session xuống page (NextAuth cũng tự refresh token ở đây)
  return { props: {} };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: { maxWidth: "900px", margin: "0 auto" },
  loadingCard: {
    background: "white", borderRadius: "20px", padding: "60px",
    textAlign: "center", maxWidth: "400px", margin: "100px auto",
  },
  deniedCard: {
    background: "white", borderRadius: "20px", padding: "60px 40px",
    textAlign: "center", maxWidth: "480px", margin: "100px auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "24px",
  },
  headerTitle: { color: "white", fontSize: "28px", fontWeight: "700" },
  card: {
    background: "white", borderRadius: "16px", padding: "28px",
    marginBottom: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
  },
  cardTitle: { color: "#333", fontSize: "16px", fontWeight: "700", marginBottom: "16px" },
  infoGrid: { borderTop: "1px solid #f0f0f0" },
  tokenBar: { height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden", marginTop: "16px" },
  tokenFill: { height: "100%", borderRadius: "4px", transition: "width 0.5s, background 0.5s" },
  guideList: { paddingLeft: "20px", lineHeight: "2.2", color: "#333", fontSize: "14px" },
  btnRow: { display: "flex", gap: "12px", marginBottom: "20px" },
  btnPrimary: {
    padding: "14px 28px", background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white", border: "none", borderRadius: "10px", fontSize: "15px",
    fontWeight: "600", cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 20px", background: "#f5f5f5", color: "#333",
    border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer",
  },
  btnLogout: {
    padding: "10px 20px", background: "#dc3545", color: "white",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600",
  },
  btnDanger: {
    width: "100%", marginTop: "16px", padding: "12px",
    background: "#d32f2f", color: "white", border: "none",
    borderRadius: "8px", cursor: "pointer", fontWeight: "600",
  },
  btnLink: {
    display: "inline-block", marginTop: "16px", padding: "12px 24px",
    background: "#667eea", color: "white", borderRadius: "8px",
    textDecoration: "none", fontWeight: "600",
  },
  roleBadge: {
    display: "inline-block", background: "white", padding: "8px 16px",
    borderRadius: "6px", marginTop: "12px", fontWeight: "600", color: "#d32f2f",
  },
  alertErr: {
    background: "#ffe8e8", color: "#d32f2f", padding: "14px 20px",
    borderRadius: "10px", marginBottom: "20px", fontSize: "14px",
  },
  pre: {
    background: "#f5f5f5", padding: "16px", borderRadius: "8px",
    overflow: "auto", fontSize: "12px", lineHeight: "1.6",
  },
  logBox: {
    background: "#1e1e1e", padding: "16px", borderRadius: "8px",
    maxHeight: "200px", overflowY: "auto", minHeight: "80px",
  },
};
