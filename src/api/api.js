// src/api/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const TOKEN_KEY = "token";

// どれくらい前に更新するか（60秒）
const REFRESH_LEEWAY_SEC = 60;
// // どれくらい前に更新するか（テスト中は 2秒 とか）
// const REFRESH_LEEWAY_SEC = 2;

const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * JWTのpayloadを読む（署名検証はしない）
 * exp(秒) を取り出す用途だけ
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];

    // base64url -> base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // padding
    const padded = base64 + "===".slice((base64.length + 3) % 4);

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token, leewaySec = REFRESH_LEEWAY_SEC) {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (!exp) return false; // exp無いなら「更新不要扱い」（MVP想定）
  const nowSec = Math.floor(Date.now() / 1000);
  return exp - nowSec <= leewaySec;
}

// refresh の多重実行防止（同時に来ても1回だけ）
let refreshPromise = null;

/**
 * token を必要に応じて refresh する（静かに）
 * - 期限が近ければ refresh
 * - refresh失敗なら token削除 & onUnauthorized
 */
async function ensureFreshToken({ onUnauthorized } = {}) {
  const token = getToken();
  if (!token) return ""; // 未ログイン

  // 期限が近くなければ何もしない
  if (!isTokenExpiringSoon(token)) return token;

  // すでにrefresh中ならそれを待つ
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();

      if (!res.ok) {
        // refresh失敗 = セッション切れ相当
        clearToken();
        onUnauthorized?.();
        throw new Error(`REFRESH_FAILED: ${res.status}\n${text}`);
      }

      const data = text ? safeJsonParse(text) : null;
      const newToken = data?.accessToken;

      if (!newToken) {
        clearToken();
        onUnauthorized?.();
        throw new Error("REFRESH_FAILED: no accessToken in response");
      }

      setToken(newToken);
      return newToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * apiFetchJson
 * - token自動付与
 * - 期限が近ければ事前に refresh（silent）
 * - 401なら「refresh→1回だけリトライ」
 * - allowStatuses のステータスは null を返す
 */
export async function apiFetchJson(
  path,
  options = {},
  { onUnauthorized, allowStatuses = [] } = {},
) {
  // 1) 事前にtoken更新（期限が近い時だけ）
  let token = "";
  try {
    token = await ensureFreshToken({ onUnauthorized });
  } catch (e) {
    // refresh失敗時は onUnauthorized 済み想定
    throw e;
  }

  // 2) 本リクエスト（最大1回リトライ）
  return requestOnce(path, options, {
    onUnauthorized,
    allowStatuses,
    token,
    retryOn401: true,
  });
}

async function requestOnce(
  path,
  options,
  { onUnauthorized, allowStatuses = [], token, retryOn401 },
) {
  const headers = new Headers(options.headers || {});

  // bodyありで Content-Type 無ければ JSON扱い
  if (options.body && !headers.get("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // token があれば Authorization を付与
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // allowStatuses（例:404）はエラーにしないで null 返し
  if (allowStatuses.includes(res.status)) {
    return null;
  }

  // ✅ 401/403 は「認証切れ」扱い
  if (res.status === 401 || res.status === 403) {
    console.log(`### apiFetchJson got ${res.status} on`, path);

    // 401 の時だけ：refreshして 1回だけリトライ（retryOn401=true の時）
    if (res.status === 401 && retryOn401) {
      try {
        const newToken = await ensureFreshToken({ onUnauthorized });
        return requestOnce(path, options, {
          onUnauthorized,
          allowStatuses,
          token: newToken,
          retryOn401: false, // ✅ 2回目はリトライしない
        });
      } catch (e) {
        // refresh失敗：下の共通処理に落とす
      }
    }

    // ✅ 共通：token削除→ログインへ
    clearToken();
    onUnauthorized?.();
    throw new Error("UNAUTHORIZED");
  }

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`${path}: ${res.status}\n${text}`);
  }

  if (!text) return null;

  const json = safeJsonParse(text);
  return json ?? text;
}
/**
 * アプリ起動時に1回だけ呼ぶ用
 * - tokenが無ければ false
 * - tokenがあれば ensureFreshToken を1回だけ実行して true/false
 */
export async function initSession({ onUnauthorized } = {}) {
  const t = getToken();
  if (!t) return false;

  try {
    await ensureFreshToken({ onUnauthorized });
    return true;
  } catch (e) {
    // refresh失敗なら ensureFreshToken が clearToken + onUnauthorized 済み想定
    return false;
  }
}
