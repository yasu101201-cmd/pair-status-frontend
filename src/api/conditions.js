import { apiFetch } from "./client";

export async function postCondition(condition) {
  return apiFetch("/conditions", {
    method: "POST",
    json: { condition },
  });
}

export async function getMyLatest() {
  // もし 아직無いなら、まず backendに GET /conditions/me/latest を足すのが最優先おすすめ
  return apiFetch("/conditions/me/latest", { method: "GET" });
}

export async function getPartnerLatest() {
  return apiFetch("/conditions/partner/latest", { method: "GET" });
}
