import { apiFetch } from "./apiClient";

export const getPairStatus = () => apiFetch("/pairs/status");

export const createPair = () => apiFetch("/pairs/create", { method: "POST" });

export const joinPair = (joinCode) =>
  apiFetch("/pairs/join", {
    method: "POST",
    json: { joinCode },
  });
