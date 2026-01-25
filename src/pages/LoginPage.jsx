import { useMemo, useState } from "react";
import { Page, Card, Row, Button, Input, Pill } from "../ui/ui";
import { apiFetchJson } from "../api/api";

const getToken = () => localStorage.getItem("token") || "";

export default function LoginPage({ onSuccess, right }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password");
  const [msg, setMsg] = useState("");
  const tokenExists = useMemo(() => !!getToken(), [msg]);

  const login = async () => {
    setMsg("ログイン中...");

    const res = await apiFetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const text = await res.text();
      setMsg(`ログイン失敗: ${res.status}\n${text}`);
      return;
    }

    const data = await res.json();
    localStorage.setItem("token", data.accessToken);
    setMsg("ログイン成功！token保存しました");
    onSuccess?.();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setMsg("ログアウトしました");
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
  };

  return (
    <Page title="ログイン" right={right}>
      <Card
        title="アカウントでログイン"
        subtitle="メールとパスワードでログインします。成功すると token が localStorage に保存されます。"
      >
        {/* ★ 真ん中に寄せる箱 */}
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          {/* ★ 縦並びで視線が散らない */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 8,
                  opacity: 0.75,
                }}
              >
                メール
              </div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 8,
                  opacity: 0.75,
                }}
              >
                パスワード
              </div>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                type="password"
                style={inputStyle}
              />
            </div>
          </div>

          {/* ★ ボタンも中央にまとまる */}
          <Row gap={12} style={{ marginTop: 18, justifyContent: "center" }}>
            <Button variant="primary" onClick={login}>
              ログイン
            </Button>
            <Button onClick={logout}>ログアウト</Button>
          </Row>

          {msg && (
            <div
              style={{
                marginTop: 14,
                color: "#334155",
                whiteSpace: "pre-wrap",
                textAlign: "center",
              }}
            >
              {msg}
            </div>
          )}
        </div>
      </Card>
    </Page>
  );
}
