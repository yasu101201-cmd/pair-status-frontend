// src/ui/ui.jsx
import React from "react";

const baseFont =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial';

export const theme = {
  bg: "#f4f6fb",
  text: "#0f172a",
  muted: "#64748b",
  cardBg: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  shadow: "0 18px 50px rgba(2,6,23,0.10)",
  shadowSoft: "0 10px 26px rgba(2,6,23,0.08)",
  radius: 18,
  pageMax: 980,
};

export function Spacer({ h = 12 }) {
  return <div style={{ height: h }} />;
}

export function Page({ title, right, bottom, children }) {
  const bottomH = bottom ? 74 : 0; // ✅ 高さ（好みでOK）

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        fontFamily: baseFont,
        color: theme.text,
        padding: "28px 18px",
        paddingBottom: "110px", // 👈 bottom tab 分
      }}
    >
      <div style={{ maxWidth: theme.pageMax, margin: "0 auto" }}>
        {/* App Header */}
        <div
          style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(15, 23, 42, 0.06)",
            borderRadius: 20,
            padding: "18px 18px",
            boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.5 }}>
                Pair Condition App
              </h1>
              <div style={{ marginTop: 6, color: theme.muted, fontSize: 13 }}>
                ペアを作って、相手の状態をサクッと共有。
              </div>
            </div>

            {/* right は残す（PC/開発用に便利） */}
            {right ? <div>{right}</div> : null}
          </div>
        </div>

        {/* spacer : ヘッダーと本文の距離 */}
        <div style={{ height: 26 }} />

        {/* Page title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
        </div>

        {/* Content */}
        <div>{children}</div>

        {/* bottom spacer（上のpaddingBottomで確保するので薄くてOK） */}
        <div style={{ height: 12 }} />
      </div>

      {/* ✅ 下固定ナビ */}
      {/* Page({ title, right, children, bottom }) */}
      {bottom ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 -8px 30px rgba(2,6,23,0.08)",
            zIndex: 50,
          }}
        >
          <div style={{ maxWidth: theme.pageMax, margin: "0 auto" }}>
            {bottom}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Card({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        background: theme.cardBg,
        border: theme.border,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 22,
        marginTop: 20,
        backdropFilter: "blur(10px)",
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            {title && <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>}
            {subtitle && (
              <div style={{ marginTop: 6, color: theme.muted, fontSize: 13 }}>
                {subtitle}
              </div>
            )}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}

export function Row({ gap = 12, style, children }) {
  return (
    <div
      style={{
        display: "flex",
        gap,
        flexWrap: "wrap",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Button
 * - variant: default | primary | success | ghost
 * - size: sm | md | lg
 * - full: true で幅100%
 * - tone: neutral | success | warn | danger | info | softSuccess | softWarn | softDanger | softInfo
 *
 * 例:
 * <Button variant="primary" size="lg" full>参加する</Button>
 * <Button tone="softInfo">相手の最新</Button>
 */
export function Button({
  variant = "default",
  size = "md",
  full = false,
  tone = "neutral",
  disabled,
  style,
  children,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  ...props
}) {
  const sizes = {
    sm: { padding: "9px 12px", fontSize: 13, borderRadius: 12 },
    md: { padding: "10px 14px", fontSize: 14, borderRadius: 12 },
    lg: { padding: "14px 16px", fontSize: 15, borderRadius: 14 },
  };
  const s = sizes[size] || sizes.md;

  const base = {
    width: full ? "100%" : undefined,
    padding: s.padding,
    fontSize: s.fontSize,
    borderRadius: s.borderRadius,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "white",
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: theme.shadowSoft,
    transition:
      "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  const variants = {
    default: { background: "white", color: theme.text },
    primary: {
      background: "#111827",
      color: "white",
      border: "1px solid rgba(17,24,39,0.9)",
    },
    success: {
      background: "#16a34a",
      color: "white",
      border: "1px solid rgba(22,163,74,0.9)",
    },
    ghost: {
      background: "transparent",
      color: theme.text,
      boxShadow: "none",
    },
  };

  // toneは「色味」を統一するための仕組み（Conditionボタンなどに使う）
  const tones = {
    neutral: {},
    success: {
      background: "#16a34a",
      color: "white",
      border: "1px solid rgba(22,163,74,0.9)",
    },
    warn: {
      background: "#f59e0b",
      color: "#111827",
      border: "1px solid rgba(245,158,11,0.9)",
    },
    danger: {
      background: "#ef4444",
      color: "white",
      border: "1px solid rgba(239,68,68,0.9)",
    },
    info: {
      background: "#4b7bec",
      color: "white",
      border: "1px solid rgba(75,123,236,0.9)",
    },

    // 淡色（Conditionのカードボタンに最適）
    softSuccess: {
      background: "#e7f7ee",
      color: "#0a7a3c",
      border: "2px solid rgba(50,168,82,0.40)",
      boxShadow: "none",
    },
    softWarn: {
      background: "#fff6e6",
      color: "#9a5d00",
      border: "2px solid rgba(243,156,18,0.40)",
      boxShadow: "none",
    },
    softDanger: {
      background: "#ffecec",
      color: "#c0392b",
      border: "2px solid rgba(231,76,60,0.40)",
      boxShadow: "none",
    },
    softInfo: {
      background: "#eef3ff",
      color: "#2a5bd7",
      border: "2px solid rgba(75,123,236,0.40)",
      boxShadow: "none",
    },
  };

  const dis = disabled
    ? { opacity: 0.55, cursor: "not-allowed", transform: "none" }
    : {};

  const v = variants[variant] || variants.default;
  const t = tones[tone] || tones.neutral;

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...base,
        ...v,
        ...t,
        ...dis,
        ...style,
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(1px)";
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0px)";
        onMouseUp?.(e);
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        // hoverで少しリッチに
        e.currentTarget.style.boxShadow = theme.shadow;
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0px)";
        // toneやvariantでboxShadowを上書きしてる場合もあるので、最後にbaseに戻す
        e.currentTarget.style.boxShadow =
          (t.boxShadow ?? v.boxShadow) || theme.shadowSoft;
        onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        fontSize: 15,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.15)",
        outline: "none",
        boxSizing: "border-box",
        background: "white",
        ...props.style,
      }}
    />
  );
}

/**
 * Pill
 * - tone: success | warn | danger | info | muted
 *
 * 例:
 * <Pill tone="success">ペア成立</Pill>
 * <Pill tone="muted">token: あり</Pill>
 */
export function Pill({ tone = "success", children, style }) {
  const tones = {
    success: {
      color: "#14532d",
      background: "rgba(34,197,94,0.18)",
      border: "1px solid rgba(34,197,94,0.25)",
    },
    warn: {
      color: "#9a5d00",
      background: "#fff6e6",
      border: "1px solid rgba(243,156,18,0.25)",
    },
    danger: {
      color: "#c0392b",
      background: "#ffecec",
      border: "1px solid rgba(231,76,60,0.25)",
    },
    info: {
      color: "#2a5bd7",
      background: "#eef3ff",
      border: "1px solid rgba(75,123,236,0.25)",
    },
    muted: {
      color: theme.text,
      background: "rgba(15,23,42,0.06)",
      border: "1px solid rgba(15,23,42,0.10)",
    },
  };

  const t = tones[tone] || tones.success;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
        ...t,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Toast（ページ上部に出す想定）
 * - tone: success | warn | danger | info | muted
 *
 * 例:
 * {toast && <Toast tone={toast.tone} onClose={() => setToast(null)}>{toast.text}</Toast>}
 */
export function Toast({ tone = "info", children, onClose }) {
  const tones = {
    success: { bg: "#e7f7ee", bd: "rgba(50,168,82,0.35)", tx: "#0a7a3c" },
    warn: { bg: "#fff6e6", bd: "rgba(243,156,18,0.35)", tx: "#9a5d00" },
    danger: { bg: "#ffecec", bd: "rgba(231,76,60,0.35)", tx: "#c0392b" },
    info: { bg: "#eef3ff", bd: "rgba(75,123,236,0.35)", tx: "#2a5bd7" },
    muted: {
      bg: "rgba(15,23,42,0.06)",
      bd: "rgba(15,23,42,0.10)",
      tx: theme.text,
    },
  };

  const t = tones[tone] || tones.info;

  return (
    <div
      style={{
        position: "sticky",
        top: 10,
        zIndex: 20,
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid ${t.bd}`,
        background: t.bg,
        color: t.tx,
        fontWeight: 900,
        boxShadow: theme.shadowSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        whiteSpace: "pre-wrap",
      }}
    >
      <div>{children}</div>
      {onClose ? (
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 900,
            color: t.tx,
            opacity: 0.75,
          }}
          aria-label="close"
          title="閉じる"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
