import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Sai tên đăng nhập hoặc mật khẩu");
    } else {
      router.push("/");
    }
  }

  function quickFill(u) {
    setUsername(u);
    setPassword("123456");
    setError("");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.lockIcon}>🔐</div>
        <h1 style={styles.title}>Đăng Nhập</h1>
        <p style={styles.subtitle}>NextAuth Token Refresh Exercise</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="advisor hoặc student"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123456"
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>

        <div style={styles.quickFill}>
          <p style={styles.quickLabel}>Điền nhanh tài khoản demo:</p>
          <div style={styles.quickBtns}>
            <button onClick={() => quickFill("advisor")} style={styles.btnSecondary}>
              advisor (ROLE_ADVISOR)
            </button>
            <button onClick={() => quickFill("student")} style={styles.btnSecondary}>
              student (ROLE_STUDENT)
            </button>
          </div>
        </div>

        <div style={styles.credentials}>
          <p style={styles.credTitle}>Thông tin đăng nhập:</p>
          <p>• Username: <code>student</code> | Password: <code>123456</code> | Role: <code>ROLE_STUDENT</code></p>
          <p>• Username: <code>advisor</code> | Password: <code>123456</code> | Role: <code>ROLE_ADVISOR</code></p>
        </div>
      </div>
    </div>
  );
}

// Nếu đã đăng nhập thì redirect về trang chủ
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  lockIcon: { fontSize: "48px", marginBottom: "16px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#333", marginBottom: "8px" },
  subtitle: { color: "#999", fontSize: "14px", marginBottom: "32px" },
  form: { textAlign: "left" },
  inputGroup: { marginBottom: "20px" },
  label: { display: "block", fontSize: "14px", fontWeight: "600", color: "#555", marginBottom: "8px" },
  input: {
    width: "100%", padding: "12px 16px", border: "1px solid #ddd",
    borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box",
  },
  error: {
    background: "#ffe8e8", color: "#d32f2f", padding: "12px 16px",
    borderRadius: "8px", fontSize: "14px", marginBottom: "16px",
  },
  btnPrimary: {
    width: "100%", padding: "14px", background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white", border: "none", borderRadius: "8px", fontSize: "16px",
    fontWeight: "600", cursor: "pointer", marginBottom: "24px",
  },
  quickFill: { borderTop: "1px solid #eee", paddingTop: "24px", marginBottom: "24px" },
  quickLabel: { fontSize: "13px", color: "#666", marginBottom: "12px" },
  quickBtns: { display: "flex", gap: "8px" },
  btnSecondary: {
    flex: 1, padding: "10px", background: "#f5f5f5", color: "#333",
    border: "1px solid #ddd", borderRadius: "8px", fontSize: "12px", cursor: "pointer",
  },
  credentials: {
    background: "#f9f9f9", padding: "16px", borderRadius: "8px",
    textAlign: "left", fontSize: "12px", color: "#555", lineHeight: "1.8",
  },
  credTitle: { fontWeight: "700", color: "#667eea", marginBottom: "8px" },
};
