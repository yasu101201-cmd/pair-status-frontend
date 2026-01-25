// // src/App.jsx
// import { useEffect, useState } from "react";
// import LoginPage from "./pages/LoginPage";
// import PairPage from "./pages/PairPage";
// import ConditionPage from "./pages/ConditionPage";
// import SettingsPage from "./pages/SettingsPage";
// import AppNav from "./components/AppNav";
// import { initSession } from "./api/api";

// export default function App() {
//   const [page, setPage] = useState("login");
//   const [booting, setBooting] = useState(true);

//   // const handleUnauthorized = () => {
//   //   localStorage.removeItem("token");
//   //   setPage("login");
//   // };
//   const handleUnauthorized = () => {
//     console.log("### handleUnauthorized fired ###");
//     localStorage.removeItem("token");
//     setPage("login");
//   };

//   // ✅ 起動時に1回だけ：token確認 → 必要ならrefresh → ページ決定
//   useEffect(() => {
//     (async () => {
//       const ok = await initSession({ onUnauthorized: handleUnauthorized });
//       setPage(ok ? "pair" : "login");
//       setBooting(false);
//     })();
//   }, []);

//   // ✅ 右上ナビ（全ページ共通）
//   const right = (
//     <AppNav
//       page={page}
//       goPair={() => setPage("pair")}
//       goCondition={() => setPage("condition")}
//       goSettings={() => setPage("settings")}
//       goLogin={handleUnauthorized}
//     />
//   );

//   // ✅ チラつき防止：判定中は何も出さない（またはローディング）
//   if (booting) {
//     return null; // ここを "読み込み中..." にしてもOK
//   }

//   return (
//     <>
//       {page === "login" && (
//         <LoginPage
//           onSuccess={() => setPage("pair")}
//           // login画面に右上ナビを出したくないなら right は渡さない
//         />
//       )}

//       {page === "pair" && (
//         <PairPage
//           goCondition={() => setPage("condition")}
//           goSettings={() => setPage("settings")}
//           goLogin={handleUnauthorized}
//           right={right}
//         />
//       )}

//       {page === "condition" && (
//         <ConditionPage
//           goPair={() => setPage("pair")}
//           goSettings={() => setPage("settings")}
//           goLogin={handleUnauthorized}
//           right={right}
//         />
//       )}

//       {page === "settings" && (
//         <SettingsPage
//           goPair={() => setPage("pair")}
//           goCondition={() => setPage("condition")}
//           goLogin={handleUnauthorized}
//           right={right}
//         />
//       )}
//     </>
//   );
// }
// src/App.jsx
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import PairPage from "./pages/PairPage";
import ConditionPage from "./pages/ConditionPage";
import SettingsPage from "./pages/SettingsPage";
import AppNav from "./components/AppNav";
import AuthGuard from "./components/AuthGuard"; // ★追加

export default function App() {
  const [page, setPage] = useState("login");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    setPage("login");
  };

  const right = (
    <AppNav
      page={page}
      goPair={() => setPage("pair")}
      goCondition={() => setPage("condition")}
      goSettings={() => setPage("settings")}
      goLogin={handleUnauthorized}
    />
  );

  return (
    <>
      {page === "login" && <LoginPage onSuccess={() => setPage("pair")} />}

      {page === "pair" && (
        <AuthGuard goLogin={handleUnauthorized}>
          <PairPage
            goCondition={() => setPage("condition")}
            goSettings={() => setPage("settings")}
            goLogin={handleUnauthorized} // 401時の保険として残してOK
            right={right}
          />
        </AuthGuard>
      )}

      {page === "condition" && (
        <AuthGuard goLogin={handleUnauthorized}>
          <ConditionPage
            goPair={() => setPage("pair")}
            goSettings={() => setPage("settings")}
            goLogin={handleUnauthorized}
            right={right}
          />
        </AuthGuard>
      )}

      {page === "settings" && (
        <AuthGuard goLogin={handleUnauthorized}>
          <SettingsPage
            goPair={() => setPage("pair")}
            goCondition={() => setPage("condition")}
            goLogin={handleUnauthorized}
            right={right}
          />
        </AuthGuard>
      )}
    </>
  );
}
