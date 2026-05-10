const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Erro desconhecido");
    throw new Error(err);
  }
  return res.json();
}

export const api = {
  // Fichas
  listSheets: () => request("/sheets"),
  getSheet: (id) => request(`/sheets/${id}`),
  createSheet: (data) => request("/sheets", { method: "POST", body: data }),
  updateSheet: (id, data) => request(`/sheets/${id}`, { method: "PUT", body: data }),
  deleteSheet: (id) => request(`/sheets/${id}`, { method: "DELETE" }),

  // Proxy de busca por sistema
  search: (system, type, query) =>
    request(`/proxy/${system}?type=${encodeURIComponent(type)}&search=${encodeURIComponent(query)}`),

  searchByClass: (system, type, className, level) =>
    request(`/proxy/${system}?type=${encodeURIComponent(type)}&class=${encodeURIComponent(className)}&level=${level ?? 20}`),

  fetchDetail: (system, type, index) =>
    request(`/proxy/${system}?type=${encodeURIComponent(type)}&index=${encodeURIComponent(index)}`),

  searchClassSpells: (classSlug, query, maxLevel) =>
    request(`/proxy/dnd5e?type=classspells&class=${encodeURIComponent(classSlug)}&search=${encodeURIComponent(query || "")}&maxlevel=${maxLevel || 9}`),
};
