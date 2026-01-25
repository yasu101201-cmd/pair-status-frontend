import React from "react";

export const ui = {
  page: {
    padding: 20,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    maxWidth: 980,
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  title: { margin: 0, fontSize: 22 },
  topActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  mini: { color: "#64748b", fontSize: 12 },
  btn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.15)",
    width: 320,
    fontSize: 14,
  },
  msgBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    background: "rgba(15,23,42,0.06)",
    whiteSpace: "pre-wrap",
    border: "1px solid rgba(2,6,23,0.08)",
  },
  errBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    background: "#fff1f2",
    whiteSpace: "pre-wrap",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 700,
  },
  card: {
    background: "white",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    padding: 14,
    boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
    marginTop: 12,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
};

export function Page({ title, right, children }) {
  return (
    <div style={ui.page}>
      <div style={ui.headerRow}>
        <h2 style={ui.title}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Pill({ text, bg = "#64748b", color = "white" }) {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        color,
        background: bg,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

export function Card({ title, right, children }) {
  return (
    <div style={ui.card}>
      <div style={ui.cardHeader}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Row({ children }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;

  const bg =
    toast.type === "success"
      ? "#e7f7ee"
      : toast.type === "error"
        ? "#ffecec"
        : "#eef3ff";

  const color =
    toast.type === "success"
      ? "#0a7"
      : toast.type === "error"
        ? "#e74c3c"
        : "#2c3e50";

  return (
    <div
      style={{
        position: "sticky",
        top: 8,
        zIndex: 10,
        padding: "10px 12px",
        borderRadius: 12,
        marginBottom: 12,
        fontWeight: 900,
        border: "1px solid #ddd",
        background: bg,
        color,
      }}
    >
      {toast.text}
    </div>
  );
}
