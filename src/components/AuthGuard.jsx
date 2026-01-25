// src/components/AuthGuard.jsx
import { useEffect, useState } from "react";

const TOKEN_KEY = "token";

const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// JWTの exp(秒) を読む（署名検証はしない）
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json = atob(padded);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isExpired(token) {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (!exp) return false; // exp無しは「期限なし扱い」でOK（MVP）
  const nowSec = Math.floor(Date.now() / 1000);
  return exp <= nowSec;
}

/**
 * AuthGuard
 * - token無し/期限切れなら goLogin() して何も描画しない
 * - OKなら children を描画
 */
export default function AuthGuard({ goLogin, children }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      goLogin?.();
      return;
    }
    if (isExpired(t)) {
      clearToken();
      goLogin?.();
      return;
    }
    setOk(true);
  }, [goLogin]);

  if (!ok) return null;
  return children;
}
