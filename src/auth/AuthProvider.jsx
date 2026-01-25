import { createContext, useContext, useMemo, useState } from "react";
import { getToken } from "../api/client";
import { loginApi, logoutApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  const value = useMemo(() => {
    return {
      token,
      isAuthed: !!token,
      async login(email, password) {
        const t = await loginApi(email, password);
        setTokenState(t);
      },
      logout() {
        logoutApi();
        setTokenState("");
      },
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
