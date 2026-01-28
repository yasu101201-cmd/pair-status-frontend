// src/components/AppNav.jsx
import { Row } from "../ui/ui";

const getToken = () => localStorage.getItem("token") || "";

function Tab({ active, disabled, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        height: 56,
        border: "none",
        background: active ? "rgba(15,23,42,0.06)" : "transparent",
        borderRadius: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        fontWeight: 900,
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1 }}>{icon}</div>
      <div
        style={{
          fontSize: 12,
          opacity: active ? 1 : 0.65,
        }}
      >
        {label}
      </div>
    </button>
  );
}

export default function AppNav({
  page,
  goPair,
  goCondition,
  goSettings,
  goLogin,
  goChat,
  variant = "bottom", // bottom を基本に
}) {
  const tokenExists = !!getToken();
  const isBottom = variant === "bottom";

  // header表示は今はいったん捨てて、bottomに寄せるのがLINEっぽい
  // （どうしてもヘッダーに残すなら、別コンポーネントに分けるのが綺麗）
  if (!isBottom) return null;

  return (
    <Row
      gap={8}
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "nowrap",
      }}
    >
      <Tab
        active={page === "pair"}
        disabled={!tokenExists}
        onClick={goPair}
        icon="👥"
        label="ペア"
      />
      <Tab
        active={page === "condition"}
        disabled={!tokenExists}
        onClick={goCondition}
        icon="🩺"
        label="コンディション"
      />
      <Tab
        active={page === "chat"}
        disabled={!tokenExists}
        onClick={goChat}
        icon="💬"
        label="日々の記録"
      />
      <Tab
        active={page === "settings"}
        disabled={!tokenExists}
        onClick={goSettings}
        icon="⚙️"
        label="その他"
      />
    </Row>
  );
}
