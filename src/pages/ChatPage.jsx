// src/pages/ChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Page, Card, Pill, Button, Row } from "../ui/ui";
import { apiFetchJson } from "../api/api";

// ---- 表示用マップ（ConditionPageと同じ意味） ----
const MAIN_META = {
  IIGAKANJI: { label: "いい感じ", emoji: "😊" },
  FUTSU: { label: "ふつう", emoji: "😐" },
  WARUI: { label: "しんどい", emoji: "😫" },
  TAICYOUWARUI: { label: "体調悪い", emoji: "🤒" },
  HANASHITAI: { label: "話したい", emoji: "💭" },
};

const SUB_META = {
  LONELY: { label: "寂しい", emoji: "🫶" },
  PAINFUL: { label: "辛い", emoji: "😣" },
  HAPPY: { label: "嬉しい", emoji: "🎉" },
  HUNGRY: { label: "お腹すいた", emoji: "🍽️" },
  TIRED: { label: "疲れた", emoji: "😮‍💨" },
  SLEEPY: { label: "眠い", emoji: "😴" },
  COLD: { label: "風邪気味", emoji: "🤧" },
  FEVER: { label: "熱", emoji: "🌡️" },
  HEADACHE: { label: "頭痛", emoji: "🤕" },
  SLUGGISH: { label: "だるい", emoji: "🥱" },
};

// ✅ APIがまだ無い(404)でも見た目確認できるように仮データ
const MOCK = [
  {
    id: "m1",
    userId: "partner",
    mainCondition: "FUTSU",
    subCondition: "LONELY",
    note: "今日はちょいさみしいかも",
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "m2",
    userId: "me",
    mainCondition: "HANASHITAI",
    subCondition: "HUNGRY",
    note: "仕事終わったら電話できる？",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "m3",
    userId: "partner",
    mainCondition: "TAICYOUWARUI",
    subCondition: "HEADACHE",
    note: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "m4",
    userId: "me",
    mainCondition: "WARUI",
    subCondition: "TIRED",
    note: "今日は早寝する…",
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

// tokenのsub(UUID)を取り出す（ライブラリなし簡易版）
function getMyUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return json.sub || null;
  } catch {
    return null;
  }
}

function hhmm(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function Bubble({ isMe, mainEmoji, mainLabel, subEmoji, subLabel, note, at }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "72%",
          background: isMe ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.18)",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 16,
          padding: "10px 12px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            opacity: 0.65,
            fontWeight: 900,
            marginBottom: 6,
            textAlign: isMe ? "right" : "left",
          }}
        >
          {isMe ? "あなた" : "相手"}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 18 }}>{mainEmoji}</div>
          <div style={{ fontWeight: 900 }}>{mainLabel}</div>

          {subLabel ? (
            <Pill tone="muted">
              {subEmoji} {subLabel}
            </Pill>
          ) : (
            <Pill tone="muted">サブなし</Pill>
          )}
        </div>

        {note ? (
          <div style={{ marginTop: 8, lineHeight: 1.5, fontSize: 14 }}>
            {note}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            opacity: 0.6,
            textAlign: isMe ? "right" : "left",
          }}
        >
          {at}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage({ right, bottom, goLogin }) {
  const [talk, setTalk] = useState([]);
  const [busy, setBusy] = useState(false);
  const [apiMissing, setApiMissing] = useState(false);
  const [errorText, setErrorText] = useState("");

  // ✅ 追加：ペア成立してない時の表示制御（落ちないようにデフォはfalse）
  const [notPaired, setNotPaired] = useState(false);

  const listRef = useRef(null);
  const bottomRef = useRef(null);

  const myId = useMemo(() => getMyUserIdFromToken(), []);
  const onUnauthorized = () => goLogin?.();

  const fetchTalk = async () => {
    if (busy) return;
    setBusy(true);
    setApiMissing(false);
    setErrorText("");

    try {
      // ✅ まずペア状態チェック（あなたのAPIに合わせて）
      // ここが違うなら /pairs/status のレスポンスだけ教えて。すぐ合わせる。
      const status = await apiFetchJson(
        "/pairs/status",
        {},
        { onUnauthorized, allowStatuses: [404] },
      );
      if (!status || status.state !== "PAIRED") {
        setNotPaired(true);
        setTalk([]);
        return;
      }
      setNotPaired(false);

      const data = await apiFetchJson(
        "/conditions/talk",
        {},
        { onUnauthorized, allowStatuses: [404] },
      );

      if (!data) {
        setApiMissing(true);
        setTalk(MOCK);
        return;
      }

      setTalk(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorText(String(e?.message || e));
      setTalk(MOCK);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchTalk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 表示は「古い → 新しい」(最新が一番下)
  const view = useMemo(() => {
    const arr = Array.isArray(talk) ? [...talk] : [];

    // APIが「新しい順」で返す想定 → 画面は古→新にしたいのでreverse
    arr.reverse();

    return arr.map((m) => {
      const main = MAIN_META[m.mainCondition] || {
        label: m.mainCondition || "—",
        emoji: "—",
      };
      const sub = m.subCondition
        ? SUB_META[m.subCondition] || { label: m.subCondition, emoji: "—" }
        : null;
      const isMe = m.userId === "me" || (!!myId && m.userId === myId);

      return {
        id: m.id,
        isMe,
        mainLabel: main.label,
        mainEmoji: main.emoji,
        subLabel: sub?.label || "",
        subEmoji: sub?.emoji || "",
        note: m.note || "",
        at: hhmm(m.createdAt),
      };
    });
  }, [talk, myId]);

  // ✅ 画面に入った時/更新時に「最新（＝一番下）」へ
  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "auto" });
  }, [view.length, busy]);

  return (
    <Page title="日々の記憶" bottom={bottom} showAppHeader={false}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Card
          title="履歴"
          subtitle="状態の履歴をトーク風に見れます（送信はコンディション画面）"
          right={
            <Row gap={8}>
              <Button onClick={fetchTalk} disabled={busy}>
                {busy ? "更新中..." : "更新"}
              </Button>
            </Row>
          }
        >
          {errorText ? (
            <div style={{ marginBottom: 10, color: "#b91c1c", fontSize: 13 }}>
              {errorText}
            </div>
          ) : null}

          {notPaired ? (
            <div style={{ opacity: 0.75, fontSize: 14 }}>
              まだペアが成立していないので履歴は見れません（ペア画面で作成/参加してね）
            </div>
          ) : view.length === 0 ? (
            <div style={{ opacity: 0.75, fontSize: 14 }}>
              まだ履歴がありません（コンディションを送るとここに溜まります）
            </div>
          ) : (
            <div
              ref={listRef}
              style={{
                // height: "70vh", // ✅ 画面内に収める
                maxHeight: "calc(100dvh - 100px)",
                overflowY: "auto", // ✅ 中だけスクロール
                display: "flex",
                flexDirection: "column",
                gap: 10,
                paddingRight: 6, // スクロールバーで潰れないように
              }}
            >
              {view.map((m) => (
                <Bubble key={m.id} {...m} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {apiMissing ? (
            <div style={{ marginTop: 10, opacity: 0.6, fontSize: 12 }}>
              ※ /conditions/talk が未実装(404)だったので仮データで表示中
            </div>
          ) : null}
        </Card>
      </div>
    </Page>
  );
}
