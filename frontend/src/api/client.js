const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("corpmind_token");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = data?.detail || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

// Streaming variant of askInConversation. Reads the backend's SSE response
// as it arrives and calls onToken(text) for every text delta, onDone(conversation)
// once the full conversation (same shape the non-streaming endpoint returns)
// is ready, and onError(err) if anything goes wrong.
async function askInConversationStream(conversationId, question, { onToken, onDone, onError } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ question }),
    });
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!res.ok || !res.body) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data?.detail || detail;
    } catch {
      // no body
    }
    onError?.(new Error(typeof detail === "string" ? detail : JSON.stringify(detail)));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line
      let frameEnd;
      while ((frameEnd = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        if (!frame.trim()) continue;

        let eventName = "message";
        let dataStr = "";
        for (const line of frame.split("\n")) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
        }
        if (!dataStr) continue;

        let payload;
        try {
          payload = JSON.parse(dataStr);
        } catch {
          continue;
        }

        if (eventName === "token") {
          onToken?.(payload.text);
        } else if (eventName === "done") {
          onDone?.(payload);
        } else if (eventName === "error") {
          onError?.(new Error(payload.detail || "Stream error"));
        }
      }
    }
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

export const api = {
  // auth
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),

  // branches
  listBranches: () => request("/branches"),
  createBranch: (payload) => request("/branches", { method: "POST", body: payload }),

  // users
  listUsers: () => request("/users"),
  createUser: (payload) => request("/users", { method: "POST", body: payload }),

  // documents
  listDocuments: () => request("/documents"),
  deleteDocument: (id) => request(`/documents/${id}`, { method: "DELETE" }),
  uploadDocument: (formData) => request("/documents", { method: "POST", body: formData, isForm: true }),

  // chat
  listConversations: () => request("/chat/conversations"),
  createConversation: (title) => request("/chat/conversations", { method: "POST", body: { title } }),
  getConversation: (id) => request(`/chat/conversations/${id}`),
  askInConversation: (id, question) =>
    request(`/chat/conversations/${id}/messages`, { method: "POST", body: { question } }),
  askInConversationStream,
  deleteConversation: (id) => request(`/chat/conversations/${id}`, { method: "DELETE" }),
  // actions
  createAction: (payload) => request("/actions", { method: "POST", body: payload }),
  listActions: () => request("/actions"),
  updateAction: (id, payload) => request(`/actions/${id}`, { method: "PATCH", body: payload }),
};

export { getToken };