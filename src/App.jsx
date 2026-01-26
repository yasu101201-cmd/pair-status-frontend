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
