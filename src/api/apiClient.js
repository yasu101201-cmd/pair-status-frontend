export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
