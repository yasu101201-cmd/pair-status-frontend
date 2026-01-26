// src/pages/PairPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Page, Card, Row, Button, Input, Pill } from "../ui/ui";
import { apiFetchJson } from "../api/api";

const getToken = () => localStorage.getItem("token") || "";

function useTokenExists(dep) {
  return useMemo(() => !!getToken(), [dep]);
}

export default function PairPage({
  goCondition,
  goSettings,
  goLogin,
  right,
  bottom,
}) {
  const [pairStatus, setPairStatus] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [createdJoinCode, setCreatedJoinCode] = useState("");

  // ✅ msg を「状態由来」と「操作結果」で分離（上書き事故を防ぐ）
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const intervalRef = useRef(null);
  const tokenExists = useTokenExists(info + error);

  const state = pairStatus?.state || "UNKNOWN";
  const isPaired = state === "PAIRED";
  const isWaiting = state === "WAITING";
  const joinCode = pairStatus?.joinCode || createdJoinCode || "";

  // -----------------------
  // 文言（状態から自動で決める）
  // -----------------------
  const stateMessage = useMemo(() => {
    if (state === "PAIRED")
      return "🎉 ペアが成立しました！「コンディションへ」で状態を送れます。";
    if (state === "WAITING")
      return "⏳ 待機中です。相手が joinCode で参加すると自動で「ペア成立」になります（自動更新中）。";
    if (state === "NONE")
      return "まだペアがありません。①でコードを作るか、②で相手のコードで参加してください。";
    return "状態を取得してください（「状態を更新」）。";
  }, [state]);

  // バッジ
  const badge = useMemo(() => {
    if (state === "PAIRED") return { text: "ペア成立", tone: "success" };
    if (state === "WAITING") return { text: "待機中", tone: "warn" };
    if (state === "NONE") return { text: "未ペア", tone: "muted" };
    return { text: "未取得", tone: "muted" };
  }, [state]);

  // ✅ 401で飛ばす共通処理（apiFetchJsonが token を消す）
  const onUnauthorized = () => {
    toastPush(
      "warn",
      "⚠️ セッションが切れました。ログインし直してください",
      2000,
    );
    goLogin?.();
  };

  // -----------------------
  // API（全部 apiFetchJson）
  // -----------------------
  const refreshStatus = async ({ quiet = false } = {}) => {
    if (!quiet) {
      setError("");
      setInfo("状態を確認中...");
    }

    try {
      const data = await apiFetchJson("/pairs/status", {}, { onUnauthorized });

      // ✅ 401などで data=null の場合：ここで終了（goLoginは呼ばれてる）
      if (!data) return null;

      setPairStatus(data);
      setCreatedJoinCode(data.joinCode || "");

      if (!quiet) {
        setError("");
        setInfo("✅ 状態を更新しました");
      }
      return data;
    } catch (e) {
      if (!quiet) {
        setInfo("");
        setError(`❌ status取得に失敗\n${String(e.message || e)}`);
      }
      return null;
    }
  };

  const createPair = async () => {
    if (busy) return;

    if (!getToken()) {
      setInfo("");
      setError("⚠️ tokenがありません（先にログインしてね）");
      goLogin?.();
      return;
    }

    setBusy(true);
    setError("");
    setInfo("ペアを作成中...");

    try {
      const data = await apiFetchJson(
        "/pairs/create",
        { method: "POST" },
        { onUnauthorized },
      );

      setCreatedJoinCode(data?.joinCode || "");
      setError("");
      setInfo("✅ joinCode を発行しました。相手に送って参加を待ってね。");

      await refreshStatus({ quiet: true });
    } catch (e) {
      setInfo("");
      setError(`❌ 作成に失敗\n${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  const joinPair = async () => {
    if (busy) return;

    if (!getToken()) {
      setInfo("");
      setError("⚠️ tokenがありません（先にログインしてね）");
      goLogin?.();
      return;
    }

    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setInfo("");
      setError("joinCodeを入力してね");
      return;
    }

    setBusy(true);
    setError("");
    setInfo("参加処理中...");

    try {
      await apiFetchJson(
        "/pairs/join",
        {
          method: "POST",
          body: JSON.stringify({ joinCode: code }),
        },
        { onUnauthorized },
      );

      setError("");
      setInfo("✅ 参加しました。ペア成立を確認中です...");

      await refreshStatus({ quiet: true });
    } catch (e) {
      setInfo("");
      setError(`❌ 参加に失敗\n${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  const copyJoinCode = async () => {
    if (!joinCode) {
      setInfo("");
      setError("コピーするjoinCodeがありません");
      return;
    }

    try {
      await navigator.clipboard.writeText(joinCode);
      setError("");
      setInfo("✅ joinCode をコピーしました！");
    } catch {
      setInfo("");
      setError("コピーに失敗しました（長押しで選択してコピーしてね）");
    }
  };

  // -----------------------
  // 初回ロード（token無ければログインへ）
  // -----------------------
  useEffect(() => {
    if (!getToken()) {
      goLogin?.();
      return;
    }
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------
  // ✅ ポーリング：WAITING の間は status を取り続ける
  // -----------------------
  useEffect(() => {
    // 既存ポーリング停止
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state === "WAITING") {
      intervalRef.current = window.setInterval(async () => {
        const data = await refreshStatus({ quiet: true });

        if (data?.state === "PAIRED") {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;

          setJoinCodeInput("");
          setError("");
          setInfo("🎉 ペアが成立しました！");
        }
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // -----------------------
  // UI
  // -----------------------
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    boxSizing: "border-box",
  };

  const codeBoxStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 14px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(2,6,23,0.04)",
  };

  const codeTextStyle = {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 3,
    lineHeight: 1.1,
  };

  // 画面に出すメッセージ（優先度：error > info > stateMessage）
  const bannerText =
    error || (state === "PAIRED" ? stateMessage : info || stateMessage);

  return (
    <Page title="ペア" right={right} bottom={bottom}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 14,
          }}
        >
          {/* 作成 */}
          <Card
            title="① コードを作って相手に送る"
            subtitle="「ペアを作る」で joinCode を発行 → 相手に送ってね。相手が入力するとペア成立。"
            right={<Pill tone={badge.tone}>{badge.text}</Pill>}
          >
            <Button
              variant="primary"
              onClick={createPair}
              disabled={busy}
              style={{
                width: "100%",
                marginTop: 5,
                marginBottom: 20,
                padding: "14px 16px",
                fontSize: 15,
              }}
            >
              ペアを作る
            </Button>

            <div style={codeBoxStyle}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.65 }}>
                  あなたの joinCode
                </div>
                <div style={codeTextStyle}>{joinCode || "---- ----"}</div>
              </div>

              <Button onClick={copyJoinCode} disabled={!joinCode}>
                コピー
              </Button>
            </div>

            {isWaiting && (
              <div style={{ marginTop: 10, opacity: 0.8 }}>
                ⏳ 待機中（自動更新中）
              </div>
            )}

            {isPaired && (
              <div style={{ marginTop: 10, opacity: 0.8 }}>
                ✅ ペア成立済み！「コンディションへ」で状態送信できます。
              </div>
            )}
          </Card>

          {/* 参加 */}
          <Card
            title="② 相手のコードで参加する"
            subtitle="相手から受け取った joinCode を入力して参加。英字は自動で大文字になります。"
          >
            <div style={{ maxWidth: 520 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  opacity: 0.75,
                  marginBottom: 8,
                }}
              >
                joinCode
              </div>

              <Input
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="例: ABCD1234"
                style={inputStyle}
                autoCapitalize="characters"
              />

              <Button
                variant="primary"
                onClick={joinPair}
                disabled={busy}
                style={{
                  width: "100%",
                  marginTop: 14,
                  marginBottom: 5,
                  padding: "14px 16px",
                  fontSize: 15,
                }}
              >
                参加する
              </Button>

              <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
                うまくいかない時は「状態を更新」で最新状態を確認してね。
              </div>
            </div>

            <Row style={{ marginTop: 14, justifyContent: "space-between" }}>
              <Button onClick={() => refreshStatus()} disabled={busy}>
                状態を更新
              </Button>

              <Button
                onClick={goCondition}
                variant="primary"
                disabled={!isPaired}
                title={!isPaired ? "ペア成立後に進めます" : ""}
              >
                コンディションへ
              </Button>
            </Row>
          </Card>
        </div>

        {/* メッセージ */}
        {bannerText && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.08)",
              background: error
                ? "rgba(239,68,68,0.10)"
                : "rgba(15,23,42,0.04)",
              color: error ? "#b91c1c" : "#0f172a",
              whiteSpace: "pre-wrap",
              fontWeight: 700,
            }}
          >
            {bannerText}
          </div>
        )}

        {/* 開発用 */}
        <Card
          title="開発用（JSON）"
          subtitle="動作確認用。普段は閉じてOK。"
          right={
            <Button onClick={() => setShowJson((v) => !v)}>
              {showJson ? "閉じる" : "JSONを見る"}
            </Button>
          }
        >
          {showJson && (
            <pre
              style={{
                marginTop: 0,
                padding: 12,
                borderRadius: 12,
                background: "#0b1020",
                color: "#d1fae5",
                overflowX: "auto",
                fontSize: 12,
              }}
            >
              {pairStatus ? JSON.stringify(pairStatus, null, 2) : "未取得"}
            </pre>
          )}
        </Card>
      </div>
    </Page>
  );
}
