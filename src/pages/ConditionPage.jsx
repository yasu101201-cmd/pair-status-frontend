// src/pages/ConditionPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Page, Card, Row, Button, Pill, Toast } from "../ui/ui";
import { apiFetchJson } from "../api/api";

const getToken = () => localStorage.getItem("token") || "";

// 表示用メタ（label/value/emoji + UI tone）
const CONDITIONS = [
  { label: "元気", value: "GENKI", emoji: "💪", tone: "softSuccess" },
  { label: "普通", value: "FUTSU", emoji: "🙂", tone: "softInfo" },
  { label: "悪い", value: "WARUI", emoji: "🤒", tone: "softDanger" },
  { label: "疲れた", value: "TSUKARETA", emoji: "😮‍💨", tone: "softWarn" },
  { label: "お腹すいた", value: "ONAKA", emoji: "🍚", tone: "softInfo" },
  { label: "眠い", value: "NEMUI", emoji: "😴", tone: "softInfo" },
];

function findConditionMeta(value) {
  return CONDITIONS.find((c) => c.value === value) || null;
}

function formatDate(isoLike) {
  if (!isoLike) return "";
  try {
    return new Date(isoLike).toLocaleString();
  } catch {
    return String(isoLike);
  }
}

export default function ConditionPage({ goPair, goSettings, goLogin, right }) {
  const [pairStatus, setPairStatus] = useState(null);
  const [myLatest, setMyLatest] = useState(null);
  const [partnerLatest, setPartnerLatest] = useState(null);

  const [busy, setBusy] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [toast, setToast] = useState(null); // { tone, text }

  const intervalRef = useRef(null);
  const prevPartnerKeyRef = useRef("");
  const didInitRef = useRef(false); // ✅ 初回だけ赤を抑制
  const busyRef = useRef(false); // ✅ 自動更新のclosure対策

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const tokenExists = useMemo(() => !!getToken(), [toast?.text]);
  const state = pairStatus?.state || "UNKNOWN";
  const canSend = state === "PAIRED";

  const toastPush = (tone, text, ms = 2200) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), ms);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

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
  const fetchPairStatus = async () => {
    const data = await apiFetchJson("/pairs/status", {}, { onUnauthorized });
    if (!data) return null; // 401等
    setPairStatus(data);
    return data;
  };

  // ✅ 404 = まだ送ってない（正常） -> allowStatuses:[404] で null を返す
  const fetchMyLatest = async () => {
    const data = await apiFetchJson(
      "/conditions/me/latest",
      {},
      { onUnauthorized, allowStatuses: [404] },
    );
    setMyLatest(data); // data=null なら未取得表示になる
    return data;
  };

  // ✅ 404 = 相手がまだ送ってない（正常）
  const fetchPartnerLatest = async ({ quiet = false } = {}) => {
    const data = await apiFetchJson(
      "/conditions/partner/latest",
      {},
      { onUnauthorized, allowStatuses: [404] },
    );

    setPartnerLatest(data);

    // 相手更新検知（取れた時だけ）
    if (data) {
      const newKey = `${data?.condition || ""}_${data?.createdAt || ""}`;
      const prevKey = prevPartnerKeyRef.current;

      if (!quiet && prevKey && newKey && newKey !== prevKey) {
        toastPush("info", "🔔 相手のコンディションが更新されました");
      }
      if (newKey) prevPartnerKeyRef.current = newKey;
    }

    return data; // nullの場合も返す
  };

  // ✅ 初回遷移直後は “赤トースト” を出さない
  const refreshAll = async ({ quiet = false } = {}) => {
    if (busy) return;

    const isFirst = !didInitRef.current;

    if (!getToken()) {
      if (!isFirst && !quiet) {
        toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
      }
      return;
    }

    if (!quiet) toastPush("info", "更新中...");
    setBusy(true);

    try {
      const ps = await fetchPairStatus();
      await fetchMyLatest();

      if (ps?.state === "PAIRED") {
        await fetchPartnerLatest({ quiet: true });
      } else {
        setPartnerLatest(null);
      }

      setLastUpdatedAt(new Date().toLocaleString());

      if (!quiet) {
        if (ps?.state === "PAIRED")
          toastPush("success", "✅ 最新に更新しました");
        else if (ps?.state === "WAITING")
          toastPush("warn", "⏳ 相手の参加待ち（ペア成立で表示できます）");
        else toastPush("muted", "ℹ️ まだペアがありません（ペア画面へ）");
      }
    } catch (e) {
      // ✅ 初回だけは赤を出さない（遷移直後のチラつき防止）
      if (!isFirst) {
        toastPush("danger", `❌ 更新に失敗しました\n${String(e.message || e)}`);
      }
    } finally {
      setBusy(false);
      didInitRef.current = true;
    }
  };

  const sendCondition = async (condition) => {
    if (busy) return;

    const isFirst = !didInitRef.current;

    if (!getToken()) {
      if (!isFirst)
        toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
      return;
    }
    if (!canSend) {
      toastPush("warn", "⚠️ ペア成立（PAIRED）してから送信できます");
      return;
    }

    setBusy(true);
    toastPush("info", "送信中...");

    try {
      await apiFetchJson(
        "/conditions",
        {
          method: "POST",
          body: JSON.stringify({ condition }),
        },
        { onUnauthorized },
      );

      await fetchMyLatest();
      setLastUpdatedAt(new Date().toLocaleString());
      toastPush("success", "✅ 送信しました（自分の最新を更新）");
    } catch (e) {
      toastPush("danger", `❌ 送信に失敗しました\n${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  // -----------------------
  // 初回ロード（1回だけ）
  // -----------------------
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    refreshAll({ quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------
  // 自動更新：PAIREDの時だけ相手を10秒ごと
  // ✅ busyRef を参照して closure 問題を回避
  // -----------------------
  useEffect(() => {
    stopPolling();

    if (state === "PAIRED") {
      intervalRef.current = window.setInterval(async () => {
        if (busyRef.current) return;
        try {
          await fetchPartnerLatest({ quiet: false });
        } catch (e) {
          console.log("auto partner refresh failed:", e);
        }
      }, 10000);
    }

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // -----------------------
  // UI
  // -----------------------
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

  const StatusBadge = ({ condition }) => {
    const meta = findConditionMeta(condition);
    if (!condition) return <Pill tone="muted">未取得</Pill>;
    if (!meta) return <Pill tone="muted">{condition}</Pill>;

    return (
      <Pill tone="muted" style={{ gap: 8 }}>
        <span style={{ fontSize: 16 }}>{meta.emoji}</span>
        <span style={{ fontWeight: 900 }}>{meta.label}</span>
      </Pill>
    );
  };

  const grid2 = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 14,
    marginTop: 14,
  };

  return (
    <Page title="コンディション" right={right}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {toast && (
          <Toast tone={toast.tone} onClose={() => setToast(null)}>
            {toast.text}
          </Toast>
        )}

        <Row style={{ justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            最終更新: {lastUpdatedAt || "まだ"}
          </div>

          <Row gap={10}>
            <Button onClick={() => refreshAll()} disabled={busy}>
              {busy ? "処理中..." : "全部更新"}
            </Button>
          </Row>
        </Row>

        <Card
          title="状態を送る"
          subtitle={
            canSend
              ? "今の状態を送信できます（送信後、自分の最新だけ更新）"
              : "ペア成立（PAIRED）すると送信できます"
          }
          right={
            <Pill tone={canSend ? "success" : "muted"}>
              {canSend ? "送信OK" : "送信NG"}
            </Pill>
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 6,
            }}
          >
            {CONDITIONS.map((c) => (
              <Button
                key={c.value}
                onClick={() => sendCondition(c.value)}
                disabled={busy || !canSend}
                tone={c.tone}
                size="lg"
                full
                title={!canSend ? "ペア成立後に送信できます" : ""}
                style={{ boxShadow: "none", justifyContent: "center" }}
              >
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <span>{c.label}</span>
              </Button>
            ))}
          </div>

          {!canSend && (
            <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
              先に「ペア」画面でペアを作成/参加してね。
            </div>
          )}
        </Card>

        <div style={grid2}>
          <Card
            title="自分の最新"
            subtitle="あなたが最後に送信したコンディション"
            right={
              <Pill tone={myLatest ? "success" : "muted"}>
                {myLatest ? "取得済み" : "未取得"}
              </Pill>
            }
          >
            <Row gap={10} style={{ alignItems: "center" }}>
              <StatusBadge condition={myLatest?.condition} />
              <span style={{ opacity: 0.7, fontSize: 13 }}>
                {formatDate(myLatest?.createdAt)}
              </span>
            </Row>
          </Card>

          <Card
            title="相手の最新"
            subtitle={
              canSend
                ? "相手の最新コンディション（10秒ごとに自動更新）"
                : "ペア成立していない場合は表示されません"
            }
            right={
              <Pill tone={canSend ? "info" : "muted"}>
                {canSend ? "自動更新: ON" : "自動更新: OFF"}
              </Pill>
            }
          >
            {canSend ? (
              <>
                <Row gap={10} style={{ alignItems: "center" }}>
                  <StatusBadge condition={partnerLatest?.condition} />
                  <span style={{ opacity: 0.7, fontSize: 13 }}>
                    {formatDate(partnerLatest?.createdAt)}
                  </span>
                </Row>

                <Row style={{ marginTop: 12, justifyContent: "space-between" }}>
                  <Button
                    onClick={() => fetchPartnerLatest({ quiet: true })}
                    disabled={busy}
                  >
                    相手だけ更新
                  </Button>
                  <Button onClick={() => refreshAll()} disabled={busy}>
                    全部更新
                  </Button>
                </Row>
              </>
            ) : (
              <div style={{ opacity: 0.75 }}>
                ペア成立（PAIRED）すると相手の状態を表示します。
              </div>
            )}
          </Card>
        </div>

        <Card
          title="ペア状態"
          subtitle="送信できない時はここを確認（pairs/status）"
          right={
            <Button onClick={() => refreshAll()} disabled={busy}>
              更新
            </Button>
          }
        >
          <Row gap={10} style={{ alignItems: "center" }}>
            <Pill tone={pairTone}>state: {state}</Pill>
            <span style={{ opacity: 0.7, fontSize: 13 }}>
              {state === "PAIRED"
                ? "✅ 送信できます"
                : state === "WAITING"
                  ? "⏳ 相手の参加待ち"
                  : state === "NONE"
                    ? "ℹ️ まだペアなし"
                    : ""}
            </span>
          </Row>
        </Card>
      </div>
    </Page>
  );
}
