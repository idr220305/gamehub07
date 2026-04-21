async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b),
  patch: (p, b) => request("PATCH", p, b),
  del: (p, b) => request("DELETE", p, b),

  createUser: (username, displayName) => api.post("/api/users", { username, displayName }),
  createGroup: (name, userId, selectedGames) =>
    api.post("/api/groups", { name, userId, selectedGames }),
  joinGroup: (inviteCode, userId) => api.post("/api/groups/join", { inviteCode, userId }),
  myGroups: (userId) => api.get(`/api/groups/mine/${userId}`),
  getGroup: (id) => api.get(`/api/groups/${id}`),
  updateGroupGames: (groupId, userId, selectedGames) =>
    api.patch(`/api/groups/${groupId}/games`, { userId, selectedGames }),
  updateGroupSettings: (groupId, userId, patch) =>
    api.patch(`/api/groups/${groupId}/settings`, { userId, ...patch }),
  leaveGroup: (groupId, userId) => api.post(`/api/groups/${groupId}/leave`, { userId }),
  deleteGroup: (groupId, userId) => api.del(`/api/groups/${groupId}`, { userId }),

  // Alliances
  listAlliances: (groupId) => api.get(`/api/alliances/${groupId}`),
  createAlliance: (groupId, userId, name, color) =>
    api.post(`/api/alliances/${groupId}`, { userId, name, color }),
  joinAlliance: (groupId, allianceId, userId) =>
    api.post(`/api/alliances/${groupId}/join/${allianceId}`, { userId }),
  leaveAlliance: (groupId, userId) =>
    api.post(`/api/alliances/${groupId}/leave`, { userId }),

  listGames: () => api.get("/api/games"),
  getDaily: (userId, groupId, date) => {
    const q = new URLSearchParams({ userId, groupId });
    if (date) q.set("date", date);
    return api.get(`/api/games/daily?${q}`);
  },
  feedback: (gameId, input, date) => api.post("/api/games/feedback", { gameId, input, date }),
  submit: (payload) => api.post("/api/games/submit", payload),

  // New
  stats: (userId, groupId) => {
    const q = groupId ? `?groupId=${groupId}` : "";
    return api.get(`/api/games/stats/${userId}${q}`);
  },
  progression: (userId, groupId) => {
    const q = groupId ? `?groupId=${groupId}` : "";
    return api.get(`/api/games/progression/${userId}${q}`);
  },
  activity: (groupId, limit) => {
    const q = limit ? `?limit=${limit}` : "";
    return api.get(`/api/games/activity/${groupId}${q}`);
  },

  leaderboard: (groupId, date) => {
    const q = date ? `?date=${date}` : "";
    return api.get(`/api/leaderboard/${groupId}${q}`);
  },
};
