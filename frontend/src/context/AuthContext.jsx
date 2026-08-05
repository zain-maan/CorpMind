import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken } from "../api/client";

const AuthContext = createContext(null);

function normalizeUser(me) {
  if (!me) return null;
  return { ...me, role: (me.role || "").toUpperCase() };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBranches() {
    try {
      const list = await api.listBranches();
      setBranches(list);
    } catch {
      // not everyone is allowed to list branches (e.g. non-super-admin) —
      // fail silently, branch names just won't resolve for them
      setBranches([]);
    }
  }

  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        setUser(normalizeUser(me));
        await loadBranches();
      } catch {
        localStorage.removeItem("corpmind_token");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(email, password) {
    const res = await api.login({ email, password });
    localStorage.setItem("corpmind_token", res.access_token);
    const me = await api.me();
    setUser(normalizeUser(me));
    await loadBranches();
  }

  function logout() {
    localStorage.removeItem("corpmind_token");
    setUser(null);
    setBranches([]);
  }

  function getBranchName(branchId) {
    if (!branchId) return null;
    const match = branches.find((b) => b.id === branchId);
    return match?.name || null;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, branches, getBranchName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}