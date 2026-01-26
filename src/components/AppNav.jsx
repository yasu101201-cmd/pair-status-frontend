// src/components/AppNav.jsx
import { Row, Button } from "../ui/ui";

const getToken = () => localStorage.getItem("token") || "";

export default function AppNav({
  page,
  goPair,
  goCondition,
  goSettings,
  goLogin,
  variant = "header", // "header" | "bottom"
}) {
  const tokenExists = !!getToken();
  const isBottom = variant === "bottom";

  // ✅ bottom用：3等分レイアウト
  const bottomBtnStyle = isBottom
    ? {
        flex: 1,
        height: 48,
        fontSize: 14,
      }
    : {};

  return (
    <Row
      gap={8}
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        flexWrap: "nowrap", // ✅ 折り返さない
      }}
    >
      <Button
        onClick={goPair}
        disabled={!tokenExists}
        tone={page === "pair" ? "info" : "neutral"}
        style={bottomBtnStyle}
      >
        ペア
      </Button>

      <Button
        onClick={goCondition}
        disabled={!tokenExists}
        tone={page === "condition" ? "info" : "neutral"}
        style={bottomBtnStyle}
      >
        コンディション
      </Button>

      <Button
        onClick={goSettings}
        disabled={!tokenExists}
        tone={page === "settings" ? "info" : "neutral"}
        style={bottomBtnStyle}
      >
        その他
      </Button>

      {/* header のみログアウト */}
      {!isBottom && tokenExists && (
        <Button
          variant="ghost"
          onClick={() => {
            localStorage.removeItem("token");
            goLogin?.();
          }}
        >
          ログアウト
        </Button>
      )}
    </Row>
  );
}
