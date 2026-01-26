// src/App.jsx
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import PairPage from "./pages/PairPage";
import ConditionPage from "./pages/ConditionPage";
import SettingsPage from "./pages/SettingsPage";
import AppNav from "./components/AppNav";
import AuthGuard from "./components/AuthGuard";

export default function App() {
  const [page, setPage] = useState("login");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    setPage("login");
  };

  const bottom = (
    <AppNav
      page={page}
      goPair={() => setPage("pair")}
      goCondition={() => setPage("condition")}
      goSettings={() => setPage("settings")}
      goLogin={handleUnauthorized}
      variant="bottom"
    />
  );

  // （任意）PCで右上も残したいならこれも使える
  const right = (
    <AppNav
      page={page}
      goPair={() => setPage("pair")}
      goCondition={() => setPage("condition")}
      goSettings={() => setPage("settings")}
      goLogin={handleUnauthorized}
      variant="header"
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
            goLogin={handleUnauthorized}
            bottom={bottom}
            right={right} // いらなければ消してOK
          />
        </AuthGuard>
      )}

      {page === "condition" && (
        <AuthGuard goLogin={handleUnauthorized}>
          <ConditionPage
            goPair={() => setPage("pair")}
            goSettings={() => setPage("settings")}
            goLogin={handleUnauthorized}
            bottom={bottom}
            right={right} // いらなければ消してOK
          />
        </AuthGuard>
      )}

      {page === "settings" && (
        <AuthGuard goLogin={handleUnauthorized}>
          <SettingsPage
            goPair={() => setPage("pair")}
            goCondition={() => setPage("condition")}
            goLogin={handleUnauthorized}
            bottom={bottom}
            right={right} // いらなければ消してOK
          />
        </AuthGuard>
      )}
    </>
  );
}
