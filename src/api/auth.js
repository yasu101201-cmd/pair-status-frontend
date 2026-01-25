import { apiFetch, setToken, clearToken } from "./client";

export async function loginApi(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    json: { email, password },
  });
  if (!data?.accessToken) throw new Error("accessToken not found");
  setToken(data.accessToken);
  return data.accessToken;
}

export function logoutApi() {
  clearToken();
}
