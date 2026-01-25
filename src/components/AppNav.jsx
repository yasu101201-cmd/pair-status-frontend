// src/components/AppNav.jsx
import { Row, Button, Pill } from "../ui/ui";

const getToken = () => localStorage.getItem("token") || "";

export default function AppNav({
  page,
  goPair,
  goCondition,
  goSettings,
  goLogin,
}) {
  const tokenExists = !!getToken();

  return (
    <Row gap={8} style={{ alignItems: "center", justifyContent: "flex-end" }}>
      <Pill tone="muted">token: {tokenExists ? "あり" : "なし"}</Pill>

      {page !== "pair" && (
        <Button onClick={goPair} disabled={!tokenExists}>
          ペア
        </Button>
      )}

      {page !== "condition" && (
        <Button onClick={goCondition} disabled={!tokenExists}>
          コンディション
        </Button>
      )}

      {page !== "settings" && (
        <Button onClick={goSettings} disabled={!tokenExists}>
          その他
        </Button>
      )}

      {/* ログインは token ありの時だけ出す */}
      {tokenExists && (
        <Button
          variant="ghost"
          onClick={() => {
            localStorage.removeItem("token");
            goLogin?.();
          }}
          title="tokenを削除してログイン画面へ戻ります"
        >
          ログアウト
        </Button>
      )}
    </Row>
  );
}
