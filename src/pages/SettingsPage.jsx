// src/pages/SettingsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Page, Card, Row, Button, Pill, Toast } from "../ui/ui";
import { apiFetchJson } from "../api/api";

const getToken = () => localStorage.getItem("token") || "";

export default function SettingsPage({
  goPair,
  goCondition,
  goLogin,
  right,
  bottom,
}) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { tone, text }
  const [pairStatus, setPairStatus] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const didInitRef = useRef(false); // ✅ 初回だけ赤を抑制したい時用（保険）

  const tokenExists = useMemo(() => !!getToken(), [toast?.text]);
  const state = pairStatus?.state || "UNKNOWN";

  const toastPush = (tone, text, ms = 2200) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), ms);
  };

  const onUnauthorized = () => {
    // ✅ tokenが死んだらログインへ
    setPairStatus(null);
    setConfirmLeave(false);
    goLogin?.();
  };

  // -----------------------
  // API（全部 apiFetchJson）
  // -----------------------
  const fetchPairStatus = async () => {
    const data = await apiFetchJson("/pairs/status", {}, { onUnauthorized });
    setPairStatus(data);
    return data;
  };

  const refresh = async ({ quiet = false } = {}) => {
    if (busy) return;

    const isFirst = !didInitRef.current;

    if (!getToken()) {
      setPairStatus(null);
      if (!quiet && !isFirst) {
        toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
      }
      goLogin?.();
      didInitRef.current = true;
      return;
    }

    setBusy(true);
    if (!quiet) toastPush("info", "更新中...");

    try {
      const ps = await fetchPairStatus();

      if (!quiet) {
        if (ps?.state === "PAIRED")
          toastPush("success", "✅ ペア状態を更新しました");
        else if (ps?.state === "WAITING")
          toastPush("warn", "⏳ 待機中（相手の参加待ち）");
        else if (ps?.state === "NONE")
          toastPush("muted", "ℹ️ 未ペア（ペア画面で作成/参加）");
        else toastPush("muted", "ℹ️ 状態を取得しました");
      }
    } catch (e) {
      // 401は apiFetchJson が onUnauthorized を呼ぶ想定
      if (!quiet && !isFirst) {
        toastPush("danger", `❌ 更新失敗\n${String(e.message || e)}`);
      }
    } finally {
      setBusy(false);
      didInitRef.current = true;
    }
  };

  // ---- ペア脱退 ----
  const leavePair = async () => {
    if (busy) return;

    if (!getToken()) {
      toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
      goLogin?.();
      return;
    }

    // 2段階確認
    if (!confirmLeave) {
      setConfirmLeave(true);
      toastPush(
        "warn",
        "確認：もう一度「ペアを脱退する」を押すと実行します",
        2600,
      );
      return;
    }

    setBusy(true);
    toastPush("info", "脱退処理中...");

    try {
      // bodyなしでも apiFetchJson は動く想定（res.text()→空でもOKな実装にしておく）
      await apiFetchJson(
        "/pairs/leave",
        { method: "POST" },
        { onUnauthorized },
      );

      setConfirmLeave(false);
      toastPush("success", "✅ ペアを脱退しました（状態を更新）");

      // 状態更新（quiet）
      await refresh({ quiet: true });

      // UX: 脱退したらPairへ
      goPair?.();
    } catch (e) {
      toastPush("danger", `❌ 脱退に失敗\n${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  const cancelConfirm = () => {
    setConfirmLeave(false);
    toastPush("muted", "キャンセルしました");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setConfirmLeave(false);
    setPairStatus(null);
    toastPush("success", "✅ ログアウトしました");
    goLogin?.();
  };

  // -----------------------
  // 初回ロード（1回だけ）
  // -----------------------
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    refresh({ quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pairTone =
    state === "PAIRED"
      ? "success"
      : state === "WAITING"
        ? "warn"
        : state === "NONE"
          ? "muted"
          : "muted";

  const pairText =
    state === "PAIRED"
      ? "ペア成立"
      : state === "WAITING"
        ? "待機中"
        : state === "NONE"
          ? "未ペア"
          : "未取得";

  return (
    <Page title="その他" right={right} bottom={bottom}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {toast && (
          <Toast tone={toast.tone} onClose={() => setToast(null)}>
            {toast.text}
          </Toast>
        )}
        {/* <Row style={{ justifyContent: "space-between", marginTop: 12 }}>
          <Button onClick={() => refresh()} disabled={busy}>
            {busy ? "処理中..." : "更新"}
          </Button>
        </Row> */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 10,
            marginTop: 10,
          }}
        >
          <Button onClick={() => refreshAll()} disabled={busy}>
            {busy ? "更新中..." : "更新"}
          </Button>
        </div>

        <Card
          title="現在の状態"
          subtitle={
            import.meta.env.DEV ? "pairs/status を表示します" : "現在のペア状態"
          }
          right={<Pill tone={pairTone}>{pairText}</Pill>}
        >
          {/* ✅ 開発環境だけ JSON を表示 */}
          {import.meta.env.DEV && (
            <details>
              <summary style={{ cursor: "pointer", opacity: 0.85 }}>
                JSONを見る（開発用）
              </summary>
              <pre
                style={{
                  marginTop: 10,
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
            </details>
          )}
        </Card>
        {/* 危険操作 */}
        <Card
          title="ペア脱退"
          subtitle="あなたと相手、両方がペアから抜けて、ペア情報が削除されます。"
          right={
            <Pill tone={confirmLeave ? "danger" : "warn"}>
              {confirmLeave ? "確認中" : "注意"}
            </Pill>
          }
        >
          <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.6 }}>
            - どちらかが脱退すると <b>相手も自動でペア解除</b> されます
            <br />- 解除後はコンディション送信ができなくなります
          </div>

          <Row gap={10} style={{ marginTop: 14 }}>
            <Button
              tone="danger"
              size="lg"
              onClick={leavePair}
              disabled={busy || !tokenExists}
              full
              style={{ boxShadow: "none" }}
              title={!tokenExists ? "先にログインしてください" : ""}
            >
              {confirmLeave ? "本当にペアを脱退する（実行）" : "ペアを脱退する"}
            </Button>

            {confirmLeave && (
              <Button
                variant="ghost"
                onClick={cancelConfirm}
                disabled={busy}
                style={{ padding: "14px 16px" }}
              >
                キャンセル
              </Button>
            )}
          </Row>
        </Card>
        {/* ログアウト */}
        <Card
          title="ログアウト"
          subtitle="ログイン画面へ遷移します"
          right={<Pill tone="muted">セッション</Pill>}
        >
          <Row gap={10}>
            <Button
              variant="ghost"
              tone="muted"
              size="lg"
              onClick={logout}
              disabled={busy}
            >
              ログアウト
            </Button>
          </Row>
        </Card>
      </div>
    </Page>
  );
}
