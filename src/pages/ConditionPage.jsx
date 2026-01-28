import { useEffect, useRef, useState } from "react";
import { Page, Card, Row, Button, Pill, Toast, Input } from "../ui/ui";
import { apiFetchJson } from "../api/api";

const getToken = () => localStorage.getItem("token") || "";

// ✅ メイン（5つ固定）※backend enum名と一致
const MAIN = [
  { label: "いい感じ", value: "IIGAKANJI", emoji: "😊", tone: "softSuccess" },
  { label: "ふつう", value: "FUTSU", emoji: "😐", tone: "softInfo" },
  { label: "しんどい", value: "WARUI", emoji: "😫", tone: "softDanger" },
  { label: "体調悪い", value: "TAICYOUWARUI", emoji: "🤒", tone: "softWarn" },
  { label: "話したい", value: "HANASHITAI", emoji: "💭", tone: "softInfo" },
];

// サブ定義（英語enum名＝backendと完全一致）
const SUB_BY_MAIN = {
  IIGAKANJI: [
    { label: "寂しい", value: "LONELY", emoji: "🫶" },
    { label: "辛い", value: "PAINFUL", emoji: "😣" },
    { label: "嬉しい", value: "HAPPY", emoji: "🎉" },
    { label: "お腹すいた", value: "HUNGRY", emoji: "🍽️" },
  ],
  FUTSU: [
    { label: "寂しい", value: "LONELY", emoji: "🫶" },
    { label: "辛い", value: "PAINFUL", emoji: "😣" },
    { label: "嬉しい", value: "HAPPY", emoji: "🎉" },
    { label: "お腹すいた", value: "HUNGRY", emoji: "🍽️" },
  ],
  HANASHITAI: [
    { label: "寂しい", value: "LONELY", emoji: "🫶" },
    { label: "辛い", value: "PAINFUL", emoji: "😣" },
    { label: "嬉しい", value: "HAPPY", emoji: "🎉" },
    { label: "お腹すいた", value: "HUNGRY", emoji: "🍽️" },
  ],
  WARUI: [
    { label: "疲れた", value: "TIRED", emoji: "😮‍💨" },
    { label: "眠い", value: "SLEEPY", emoji: "😴" },
    { label: "寂しい", value: "LONELY", emoji: "🫶" },
    { label: "辛い", value: "PAINFUL", emoji: "😣" }, // ←「しんどいに辛い追加」OK
  ],
  TAICYOUWARUI: [
    { label: "風邪気味", value: "COLD", emoji: "🤧" },
    { label: "熱", value: "FEVER", emoji: "🌡️" },
    { label: "頭痛", value: "HEADACHE", emoji: "🤕" },
    { label: "だるい", value: "SLUGGISH", emoji: "🥱" },
  ],
};

// 表示用：value -> {label, emoji} を引ける辞書
const SUB_META = Object.fromEntries(
  Object.values(SUB_BY_MAIN)
    .flat()
    .map((s) => [s.value, s]),
);

const SUB_SELECTED_STYLE = {
  border: "2px solid rgba(59,130,246,0.9)",
  background: "rgba(59,130,246,0.12)",
  boxShadow: "0 0 0 3px rgba(59,130,246,0.18)",
};

const SUB_UNSELECTED_STYLE = {
  border: "1px solid rgba(148,163,184,0.35)",
  background: "transparent",
  boxShadow: "none",
};

function metaBy(list, value) {
  return list.find((x) => x.value === value) || null;
}

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 10) return "たった今";
  if (diffSec < 60) return `${diffSec}秒前`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}日前`;
}

export default function ConditionPage({
  goPair,
  goSettings,
  goLogin,
  bottom,
  right,
}) {
  const [pairStatus, setPairStatus] = useState(null);

  const [myLatest, setMyLatest] = useState(null);
  const [partnerLatest, setPartnerLatest] = useState(null);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // 送信UI state
  const [mainSelected, setMainSelected] = useState("");
  const [subSelected, setSubSelected] = useState("NONE");
  const [note, setNote] = useState("");

  const didInitRef = useRef(false);
  const intervalRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const toastPush = (tone, text, ms = 2200) => {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), ms);
  };

  const onUnauthorized = () => {
    toastPush(
      "warn",
      "⚠️ セッションが切れました。ログインし直してください",
      2000,
    );
    goLogin?.();
  };

  const normalizeUpdate = (u) => {
    if (!u) return null;
    return {
      ...u,
      mainCondition: u.mainCondition ?? u.condition,
    };
  };

  const state = pairStatus?.state || "UNKNOWN";
  const canSend = state === "PAIRED";

  const stopPolling = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // -------- API --------
  const fetchPairStatus = async () => {
    const data = await apiFetchJson("/pairs/status", {}, { onUnauthorized });
    if (!data) return null;
    setPairStatus(data);
    return data;
  };

  const fetchMyLatest = async () => {
    const data = await apiFetchJson(
      "/conditions/me/latest",
      {},
      { onUnauthorized, allowStatuses: [404] },
    );
    setMyLatest(normalizeUpdate(data));
    return data;
  };

  const fetchPartnerLatest = async () => {
    const data = await apiFetchJson(
      "/conditions/partner/latest",
      {},
      { onUnauthorized, allowStatuses: [404] },
    );
    setPartnerLatest(normalizeUpdate(data));
    return data;
  };

  const refreshAll = async ({ quiet = false } = {}) => {
    if (busy) return;

    if (!getToken()) {
      if (!quiet)
        toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
      return;
    }

    setBusy(true);
    try {
      const ps = await fetchPairStatus();
      await fetchMyLatest();
      if (ps?.state === "PAIRED") {
        await fetchPartnerLatest();
      } else {
        setPartnerLatest(null);
      }
      if (!quiet) toastPush("success", "✅ 更新しました");
    } catch (e) {
      if (!quiet) toastPush("danger", `❌ 更新失敗\n${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  const subList = mainSelected ? SUB_BY_MAIN[mainSelected] || [] : [];

  const send = async () => {
    if (busy) return;

    if (!getToken()) {
      toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
      return;
    }
    if (!canSend) {
      toastPush("warn", "⚠️ ペア成立（PAIRED）してから送信できます");
      return;
    }
    if (!mainSelected) {
      toastPush("warn", "⚠️ まずメイン状態を選んでね");
      return;
    }

    setBusy(true);
    toastPush("info", "送信中...");

    try {
      await apiFetchJson(
        "/conditions",
        {
          method: "POST",
          body: JSON.stringify({
            mainCondition: mainSelected,
            subCondition: subSelected === "NONE" ? "NONE" : subSelected,
            note: note?.trim() ? note.trim() : "",
          }),
        },
        { onUnauthorized },
      );

      // 送信後の気持ちよさ：自分カード即更新
      await fetchMyLatest();
      toastPush("success", " 送りました！（相手に届くよ）");

      // 入力リセット（迷いにくい）
      setSubSelected("NONE");
      setNote("");
      // メインは残してもOKだが、迷いを減らすなら残す
      // setMainSelected("");
    } catch (e) {
      toastPush("danger", `❌ 送信失敗\n${String(e.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  // -------- 初回 --------
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    refreshAll({ quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- 自動更新：PAIRED の時だけ相手を10秒ごと --------
  useEffect(() => {
    stopPolling();
    if (state === "PAIRED") {
      intervalRef.current = window.setInterval(async () => {
        if (busyRef.current) return;
        try {
          await fetchPartnerLatest();
        } catch {}
      }, 10000);
    }
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // -------- 表示用 --------
  const pairTone =
    state === "PAIRED" ? "success" : state === "WAITING" ? "warn" : "muted";

  const partnerMain = partnerLatest?.mainCondition;
  const partnerSub = partnerLatest?.subCondition;
  const partnerNote = partnerLatest?.note;

  const myMain = myLatest?.mainCondition;
  const mySub = myLatest?.subCondition;
  const myNote = myLatest?.note;

  const partnerMainMeta = metaBy(MAIN, partnerMain);
  const myMainMeta = metaBy(MAIN, myMain);

  const partnerSubMeta =
    partnerSub && partnerSub !== "NONE" ? SUB_META[partnerSub] : null;

  const mySubMeta = mySub && mySub !== "NONE" ? SUB_META[mySub] : null;

  const cardWrap = { maxWidth: 720, margin: "0 auto" };

  return (
    <Page title="コンディション" right={right} bottom={bottom}>
      <div style={cardWrap}>
        {toast && (
          <Toast tone={toast.tone} onClose={() => setToast(null)}>
            {toast.text}
          </Toast>
        )}

        {/* 全部更新：右上にポツン（動かない） */}
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

        {/* ✅ 相手を最上部（主役） */}
        <Card
          title="相手の今"
          subtitle={
            canSend ? "10秒ごとに自動更新" : "ペア成立で見れるようになります"
          }
          right={<Pill tone={canSend ? "info" : "muted"}>自動更新</Pill>}
        >
          {canSend ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 34 }}>
                  {partnerMainMeta?.emoji || "—"}
                </div>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {partnerMainMeta?.label || "未取得"}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {timeAgo(partnerLatest?.createdAt)}
                  </div>
                </div>
              </div>

              {/* サブ表示 */}
              <Row gap={10}>
                {partnerSubMeta ? (
                  <Pill tone="muted">
                    {partnerSubMeta.emoji} {partnerSubMeta.label}
                  </Pill>
                ) : (
                  <Pill tone="muted">サブなし</Pill>
                )}
              </Row>

              {/* note（任意） */}
              {partnerNote ? (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background: "rgba(148,163,184,0.12)",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {partnerNote}
                </div>
              ) : null}

              <Row style={{ justifyContent: "space-between" }}>
                {/* <Button onClick={() => fetchPartnerLatest()} disabled={busy}>
                  相手だけ更新
                </Button> */}
              </Row>
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>
              先に「ペア」画面でペアを作成/参加してね。
            </div>
          )}
        </Card>

        {/* ✅ 送信（メイン→サブ→メモ→送信） */}
        <Card
          title="今の状態を送る"
          subtitle={
            canSend
              ? "メインを選んで、必要なら気持ち/体調を添える"
              : "ペア成立で送信できます"
          }
          right={
            <Pill tone={canSend ? "success" : "muted"}>
              {canSend ? "送信OK" : "送信NG"}
            </Pill>
          }
        >
          {/* メイン */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 900 }}>
              ① メイン（必須）
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {MAIN.map((m) => (
                <Button
                  key={m.value}
                  onClick={() => {
                    setMainSelected(m.value);
                    setSubSelected("NONE");
                  }}
                  disabled={busy || !canSend}
                  tone={mainSelected === m.value ? "primary" : m.tone}
                  size="lg"
                  full
                  style={{ justifyContent: "center" }}
                >
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <span>{m.label}</span>
                </Button>
              ))}
            </div>

            {/* サブ */}
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 900 }}>
              ② 添える（任意・1つまで）
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                {mainSelected === "TAICYOUWARUI" ? "※体調用" : "※気持ち"}
              </span>
            </div>

            <Row gap={10} style={{ flexWrap: "wrap" }}>
              <Button
                onClick={() => setSubSelected("NONE")}
                disabled={busy || !canSend}
                tone={subSelected === "NONE" ? "primary" : "muted"}
              >
                なし
              </Button>

              {subList.map((s) => {
                const isSelected = subSelected === s.value;

                return (
                  <Button
                    key={s.value}
                    onClick={() => setSubSelected(s.value)}
                    disabled={busy || !canSend}
                    tone={"muted"} // toneに頼らず見た目はstyleで統一
                    style={{
                      ...(isSelected
                        ? SUB_SELECTED_STYLE
                        : SUB_UNSELECTED_STYLE),
                    }}
                  >
                    {s.emoji} {s.label}
                  </Button>
                );
              })}
            </Row>

            {/* メモ */}
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 900 }}>
              ③ メモ（任意）
            </div>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例）今日は少し話したい / しんどいから早寝する"
              style={{ width: "100%", padding: "12px 14px", fontSize: 15 }}
              disabled={busy || !canSend}
            />

            <Row style={{ justifyContent: "center", marginTop: 6 }}>
              <Button
                variant="primary"
                onClick={send}
                disabled={busy || !canSend}
              >
                {busy ? "送信中..." : "送信する"}
              </Button>
            </Row>
          </div>
        </Card>

        {/* 自分の最新（下に置く） */}
        <Card
          title="自分の最新"
          subtitle="あなたが最後に送信した状態"
          right={
            <Pill tone={myLatest ? "success" : "muted"}>
              {myLatest ? "取得済み" : "未取得"}
            </Pill>
          }
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 26 }}>{myMainMeta?.emoji || "—"}</div>
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>
                  {myMainMeta?.label || "未取得"}
                </div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {timeAgo(myLatest?.createdAt)}
                </div>
              </div>
            </div>

            <Row gap={10}>
              {mySubMeta ? (
                <Pill tone="muted">
                  {mySubMeta.emoji} {mySubMeta.label}
                </Pill>
              ) : (
                <Pill tone="muted">サブなし</Pill>
              )}
            </Row>

            {myNote ? (
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: "rgba(148,163,184,0.12)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {myNote}
              </div>
            ) : null}

            <Row style={{ justifyContent: "space-between" }}>
              {/* <Button onClick={() => fetchMyLatest()} disabled={busy}>
                自分だけ更新
              </Button> */}
            </Row>
          </div>
        </Card>

        {/* ペア状態 */}
        <Card title="ペア状態" subtitle="送信できない時はここ">
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
