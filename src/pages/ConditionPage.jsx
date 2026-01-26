// // src/pages/ConditionPage.jsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Page, Card, Row, Button, Pill, Toast } from "../ui/ui";
// import { apiFetchJson } from "../api/api";

// const getToken = () => localStorage.getItem("token") || "";

// // 表示用メタ（label/value/emoji + UI tone）
// const CONDITIONS = [
//   { label: "元気", value: "GENKI", emoji: "💪", tone: "softSuccess" },
//   { label: "普通", value: "FUTSU", emoji: "🙂", tone: "softInfo" },
//   { label: "悪い", value: "WARUI", emoji: "🤒", tone: "softDanger" },
//   { label: "疲れた", value: "TSUKARETA", emoji: "😮‍💨", tone: "softWarn" },
//   { label: "お腹すいた", value: "ONAKA", emoji: "🍚", tone: "softInfo" },
//   { label: "眠い", value: "NEMUI", emoji: "😴", tone: "softInfo" },
// ];

// function findConditionMeta(value) {
//   return CONDITIONS.find((c) => c.value === value) || null;
// }

// function formatDate(isoLike) {
//   if (!isoLike) return "";
//   try {
//     return new Date(isoLike).toLocaleString();
//   } catch {
//     return String(isoLike);
//   }
// }

// export default function ConditionPage({ goPair, goSettings, goLogin, right }) {
//   const [pairStatus, setPairStatus] = useState(null);
//   const [myLatest, setMyLatest] = useState(null);
//   const [partnerLatest, setPartnerLatest] = useState(null);

//   const [busy, setBusy] = useState(false);
//   const [lastUpdatedAt, setLastUpdatedAt] = useState("");
//   const [toast, setToast] = useState(null); // { tone, text }

//   const intervalRef = useRef(null);
//   const prevPartnerKeyRef = useRef("");
//   const didInitRef = useRef(false); // ✅ 初回だけ赤を抑制
//   const busyRef = useRef(false); // ✅ 自動更新のclosure対策

//   useEffect(() => {
//     busyRef.current = busy;
//   }, [busy]);

//   const tokenExists = useMemo(() => !!getToken(), [toast?.text]);
//   const state = pairStatus?.state || "UNKNOWN";
//   const canSend = state === "PAIRED";

//   const toastPush = (tone, text, ms = 2200) => {
//     setToast({ tone, text });
//     window.setTimeout(() => setToast(null), ms);
//   };

//   const stopPolling = () => {
//     if (intervalRef.current) {
//       window.clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
//   };

//   const normalizeUpdate = (u) => {
//     if (!u) return null;
//     return {
//       ...u,
//       // 本番(mainCondition) / 旧API(condition) どっちでも表示できるようにする
//       condition: u.mainCondition ?? u.condition,
//     };
//   };

//   // ✅ 401で飛ばす共通処理（apiFetchJsonが token を消す）
//   const onUnauthorized = () => {
//     toastPush(
//       "warn",
//       "⚠️ セッションが切れました。ログインし直してください",
//       2000,
//     );
//     goLogin?.();
//   };

//   // -----------------------
//   // API（全部 apiFetchJson）
//   // -----------------------
//   const fetchPairStatus = async () => {
//     const data = await apiFetchJson("/pairs/status", {}, { onUnauthorized });
//     if (!data) return null; // 401等
//     setPairStatus(data);
//     return data;
//   };

//   // ✅ 404 = まだ送ってない（正常） -> allowStatuses:[404] で null を返す
//   const fetchMyLatest = async () => {
//     const data = await apiFetchJson(
//       "/conditions/me/latest",
//       {},
//       { onUnauthorized, allowStatuses: [404] },
//     );
//     setMyLatest(normalizeUpdate(data));
//     return data;
//   };

//   // ✅ 404 = 相手がまだ送ってない（正常）
//   const fetchPartnerLatest = async ({ quiet = false } = {}) => {
//     const data = await apiFetchJson(
//       "/conditions/partner/latest",
//       {},
//       { onUnauthorized, allowStatuses: [404] },
//     );

//     const normalized = normalizeUpdate(data);
//     setPartnerLatest(normalized);

//     if (normalized) {
//       const newKey = `${normalized?.condition || ""}_${normalized?.createdAt || ""}`;
//       const prevKey = prevPartnerKeyRef.current;

//       if (!quiet && prevKey && newKey && newKey !== prevKey) {
//         toastPush("info", "🔔 相手のコンディションが更新されました");
//       }
//       if (newKey) prevPartnerKeyRef.current = newKey;
//     }

//     return data;
//   };

//   // ✅ 初回遷移直後は “赤トースト” を出さない
//   const refreshAll = async ({ quiet = false } = {}) => {
//     if (busy) return;

//     const isFirst = !didInitRef.current;

//     if (!getToken()) {
//       if (!isFirst && !quiet) {
//         toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
//       }
//       return;
//     }

//     if (!quiet) toastPush("info", "更新中...");
//     setBusy(true);

//     try {
//       const ps = await fetchPairStatus();
//       await fetchMyLatest();

//       if (ps?.state === "PAIRED") {
//         await fetchPartnerLatest({ quiet: true });
//       } else {
//         setPartnerLatest(null);
//       }

//       setLastUpdatedAt(new Date().toLocaleString());

//       if (!quiet) {
//         if (ps?.state === "PAIRED")
//           toastPush("success", "✅ 最新に更新しました");
//         else if (ps?.state === "WAITING")
//           toastPush("warn", "⏳ 相手の参加待ち（ペア成立で表示できます）");
//         else toastPush("muted", "ℹ️ まだペアがありません（ペア画面へ）");
//       }
//     } catch (e) {
//       // ✅ 初回だけは赤を出さない（遷移直後のチラつき防止）
//       if (!isFirst) {
//         toastPush("danger", `❌ 更新に失敗しました\n${String(e.message || e)}`);
//       }
//     } finally {
//       setBusy(false);
//       didInitRef.current = true;
//     }
//   };

//   const sendCondition = async (condition) => {
//     if (busy) return;

//     const isFirst = !didInitRef.current;

//     if (!getToken()) {
//       if (!isFirst)
//         toastPush("warn", "⚠️ tokenがありません（先にログインしてね）");
//       return;
//     }
//     if (!canSend) {
//       toastPush("warn", "⚠️ ペア成立（PAIRED）してから送信できます");
//       return;
//     }

//     setBusy(true);
//     toastPush("info", "送信中...");

//     try {
//       await apiFetchJson(
//         "/conditions",
//         {
//           method: "POST",
//           body: JSON.stringify({
//             mainCondition: condition,
//             subCondition: "NONE",
//             note: "",
//           }),
//         },
//         { onUnauthorized },
//       );

//       await fetchMyLatest();
//       setLastUpdatedAt(new Date().toLocaleString());
//       toastPush("success", "✅ 送信しました（自分の最新を更新）");
//     } catch (e) {
//       toastPush("danger", `❌ 送信に失敗しました\n${String(e.message || e)}`);
//     } finally {
//       setBusy(false);
//     }
//   };

//   // -----------------------
//   // 初回ロード（1回だけ）
//   // -----------------------
//   useEffect(() => {
//     if (didInitRef.current) return;
//     didInitRef.current = true;

//     refreshAll({ quiet: true });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // -----------------------
//   // 自動更新：PAIREDの時だけ相手を10秒ごと
//   // ✅ busyRef を参照して closure 問題を回避
//   // -----------------------
//   useEffect(() => {
//     stopPolling();

//     if (state === "PAIRED") {
//       intervalRef.current = window.setInterval(async () => {
//         if (busyRef.current) return;
//         try {
//           await fetchPartnerLatest({ quiet: false });
//         } catch (e) {
//           console.log("auto partner refresh failed:", e);
//         }
//       }, 10000);
//     }

//     return () => stopPolling();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [state]);

//   // -----------------------
//   // UI
//   // -----------------------
//   const pairTone =
//     state === "PAIRED"
//       ? "success"
//       : state === "WAITING"
//         ? "warn"
//         : state === "NONE"
//           ? "muted"
//           : "muted";

//   const pairText =
//     state === "PAIRED"
//       ? "ペア成立"
//       : state === "WAITING"
//         ? "待機中"
//         : state === "NONE"
//           ? "未ペア"
//           : "未取得";

//   const StatusBadge = ({ condition }) => {
//     const meta = findConditionMeta(condition);
//     if (!condition) return <Pill tone="muted">未取得</Pill>;
//     if (!meta) return <Pill tone="muted">{condition}</Pill>;

//     return (
//       <Pill tone="muted" style={{ gap: 8 }}>
//         <span style={{ fontSize: 16 }}>{meta.emoji}</span>
//         <span style={{ fontWeight: 900 }}>{meta.label}</span>
//       </Pill>
//     );
//   };

//   const grid2 = {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
//     gap: 14,
//     marginTop: 14,
//   };

//   return (
//     <Page title="コンディション" right={right}>
//       <div style={{ maxWidth: 920, margin: "0 auto" }}>
//         {toast && (
//           <Toast tone={toast.tone} onClose={() => setToast(null)}>
//             {toast.text}
//           </Toast>
//         )}

//         <Row style={{ justifyContent: "space-between", marginTop: 12 }}>
//           <div style={{ opacity: 0.75, fontSize: 13 }}>
//             最終更新: {lastUpdatedAt || "まだ"}
//           </div>

//           <Row gap={10}>
//             <Button onClick={() => refreshAll()} disabled={busy}>
//               {busy ? "処理中..." : "全部更新"}
//             </Button>
//           </Row>
//         </Row>

//         <Card
//           title="状態を送る"
//           subtitle={
//             canSend
//               ? "今の状態を送信できます（送信後、自分の最新だけ更新）"
//               : "ペア成立（PAIRED）すると送信できます"
//           }
//           right={
//             <Pill tone={canSend ? "success" : "muted"}>
//               {canSend ? "送信OK" : "送信NG"}
//             </Pill>
//           }
//         >
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
//               gap: 10,
//               marginTop: 6,
//             }}
//           >
//             {CONDITIONS.map((c) => (
//               <Button
//                 key={c.value}
//                 onClick={() => sendCondition(c.value)}
//                 disabled={busy || !canSend}
//                 tone={c.tone}
//                 size="lg"
//                 full
//                 title={!canSend ? "ペア成立後に送信できます" : ""}
//                 style={{ boxShadow: "none", justifyContent: "center" }}
//               >
//                 <span style={{ fontSize: 18 }}>{c.emoji}</span>
//                 <span>{c.label}</span>
//               </Button>
//             ))}
//           </div>

//           {!canSend && (
//             <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
//               先に「ペア」画面でペアを作成/参加してね。
//             </div>
//           )}
//         </Card>

//         <div style={grid2}>
//           <Card
//             title="自分の最新"
//             subtitle="あなたが最後に送信したコンディション"
//             right={
//               <Pill tone={myLatest ? "success" : "muted"}>
//                 {myLatest ? "取得済み" : "未取得"}
//               </Pill>
//             }
//           >
//             <Row gap={10} style={{ alignItems: "center" }}>
//               <StatusBadge
//                 condition={myLatest?.mainCondition ?? myLatest?.condition}
//               />
//               <span style={{ opacity: 0.7, fontSize: 13 }}>
//                 {formatDate(myLatest?.createdAt)}
//               </span>
//             </Row>
//           </Card>

//           <Card
//             title="相手の最新"
//             subtitle={
//               canSend
//                 ? "相手の最新コンディション（10秒ごとに自動更新）"
//                 : "ペア成立していない場合は表示されません"
//             }
//             right={
//               <Pill tone={canSend ? "info" : "muted"}>
//                 {canSend ? "自動更新: ON" : "自動更新: OFF"}
//               </Pill>
//             }
//           >
//             {canSend ? (
//               <>
//                 <Row gap={10} style={{ alignItems: "center" }}>
//                   <StatusBadge
//                     condition={
//                       partnerLatest?.mainCondition ?? partnerLatest?.condition
//                     }
//                   />
//                   <span style={{ opacity: 0.7, fontSize: 13 }}>
//                     {formatDate(partnerLatest?.createdAt)}
//                   </span>
//                 </Row>

//                 <Row style={{ marginTop: 12, justifyContent: "space-between" }}>
//                   <Button
//                     onClick={() => fetchPartnerLatest({ quiet: true })}
//                     disabled={busy}
//                   >
//                     相手だけ更新
//                   </Button>
//                   <Button onClick={() => refreshAll()} disabled={busy}>
//                     全部更新
//                   </Button>
//                 </Row>
//               </>
//             ) : (
//               <div style={{ opacity: 0.75 }}>
//                 ペア成立（PAIRED）すると相手の状態を表示します。
//               </div>
//             )}
//           </Card>
//         </div>

//         <Card
//           title="ペア状態"
//           subtitle="送信できない時はここを確認（pairs/status）"
//           right={
//             <Button onClick={() => refreshAll()} disabled={busy}>
//               更新
//             </Button>
//           }
//         >
//           <Row gap={10} style={{ alignItems: "center" }}>
//             <Pill tone={pairTone}>state: {state}</Pill>
//             <span style={{ opacity: 0.7, fontSize: 13 }}>
//               {state === "PAIRED"
//                 ? "✅ 送信できます"
//                 : state === "WAITING"
//                   ? "⏳ 相手の参加待ち"
//                   : state === "NONE"
//                     ? "ℹ️ まだペアなし"
//                     : ""}
//             </span>
//           </Row>
//         </Card>
//       </div>
//     </Page>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { Page, Card, Row, Button, Pill, Toast, Input } from "../ui/ui";
import { apiFetchJson } from "../api/api";

const getToken = () => localStorage.getItem("token") || "";

// ✅ メイン（5つ固定）
const MAIN = [
  { label: "いい感じ", value: "IIGAKANJI", emoji: "😊", tone: "softSuccess" },
  { label: "ふつう", value: "FUTSU", emoji: "😐", tone: "softInfo" },
  { label: "しんどい", value: "WARUI", emoji: "😫", tone: "softDanger" },
  { label: "体調悪い", value: "TAICYOUWARUI", emoji: "🤒", tone: "softWarn" },
  { label: "話したい", value: "HANASHITAI", emoji: "💭", tone: "softInfo" },
];

// ✅ サブ（通常時：常に3つ出す）
const SUB_NORMAL = [
  { label: "寂しい", value: "SABISHII", emoji: "🫶" },
  { label: "辛い", value: "TSURAI", emoji: "😣" },
  { label: "嬉しい", value: "URESHII", emoji: "🎉" },
];

// ✅ サブ（体調悪いの時だけ出す）
const SUB_HEALTH = [
  { label: "疲れた", value: "TSUKARETA", emoji: "😮‍💨" },
  { label: "眠い", value: "NEMUI", emoji: "😴" },
  { label: "お腹すいた", value: "ONAKA", emoji: "🍽️" },
];

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

export default function ConditionPage({ goPair, goSettings, goLogin, right }) {
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

  const subList = mainSelected === "TAICYOUWARUI" ? SUB_HEALTH : SUB_NORMAL;

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
      toastPush("success", "💌 送ったよ（相手に届くよ）");

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

  const subNormalMeta = metaBy(SUB_NORMAL, partnerSub);
  const subHealthMeta = metaBy(SUB_HEALTH, partnerSub);
  const partnerSubMeta = subNormalMeta || subHealthMeta;

  const mySubMeta = metaBy(SUB_NORMAL, mySub) || metaBy(SUB_HEALTH, mySub);

  const cardWrap = { maxWidth: 720, margin: "0 auto" };

  return (
    <Page title="コンディション" right={right}>
      <div style={cardWrap}>
        {toast && (
          <Toast tone={toast.tone} onClose={() => setToast(null)}>
            {toast.text}
          </Toast>
        )}

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
                <Button onClick={() => fetchPartnerLatest()} disabled={busy}>
                  相手だけ更新
                </Button>
                <Button onClick={() => refreshAll()} disabled={busy}>
                  全部更新
                </Button>
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

              {subList.map((s) => (
                <Button
                  key={s.value}
                  onClick={() => setSubSelected(s.value)}
                  disabled={busy || !canSend}
                  tone={subSelected === s.value ? "primary" : "muted"}
                >
                  {s.emoji} {s.label}
                </Button>
              ))}
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
              <Button onClick={() => fetchMyLatest()} disabled={busy}>
                自分だけ更新
              </Button>
              <Button onClick={() => refreshAll()} disabled={busy}>
                全部更新
              </Button>
            </Row>
          </div>
        </Card>

        {/* ペア状態 */}
        <Card
          title="ペア状態"
          subtitle="送信できない時はここ"
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
