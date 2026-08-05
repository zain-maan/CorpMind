import { useEffect, useMemo, useState } from "react";
import { UserPlus, Users as UsersIcon } from "lucide-react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import SearchInput from "../components/SearchInput";
import FilterTabs from "../components/FilterTabs";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

// Display stays uppercase (matches rest of UI), but we lowercase before sending to the API.
const ROLE_OPTIONS = {
  SUPER_ADMIN: ["BRANCH_ADMIN"],
  BRANCH_ADMIN: ["HR", "EMPLOYEE"],
  HR: ["EMPLOYEE"],
};

const ROLE_TONE = {
  SUPER_ADMIN: "danger",
  BRANCH_ADMIN: "warning",
  HR: "success",
  EMPLOYEE: "info",
};

export default function Users() {
  const { user, getBranchName } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "", branch_id: "" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { toast, showToast } = useToast();

  const creatableRoles = ROLE_OPTIONS[user?.role] || [];

  useEffect(() => {
    load();
    if (user?.role === "SUPER_ADMIN") {
      api.listBranches().then(setBranches).catch(() => {});
    }
  }, [user]);

  async function load() {
    setLoadingList(true);
    try {
      const list = await api.listUsers();
      setUsers(list);
    } finally {
      setLoadingList(false);
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const payload = {
        ...form,
        role: form.role.toLowerCase(), // backend expects lowercase enum values
      };
      // don't send an empty branch_id string for HR/BRANCH_ADMIN creators (auto-forced server-side)
      if (!payload.branch_id) delete payload.branch_id;

      await api.createUser(payload);
      setForm({ full_name: "", email: "", password: "", role: "", branch_id: "" });
      setAddOpen(false);
      showToast("User created");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const filterOptions = useMemo(() => {
    const roles = ["SUPER_ADMIN", "BRANCH_ADMIN", "HR", "EMPLOYEE"];
    const counts = { all: users.length };
    roles.forEach((r) => (counts[r] = users.filter((u) => u.role === r).length));
    return [
      { value: "all", label: "All", count: counts.all },
      ...roles.filter((r) => counts[r] > 0).map((r) => ({ value: r, label: r.replace("_", " "), count: counts[r] })),
    ];
  }, [users]);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <Layout>
      <PageHeader
        title="Users"
        subtitle="Create and manage accounts within your scope."
        actions={
          creatableRoles.length > 0 && (
            <Button icon={UserPlus} variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              Add user
            </Button>
          )
        }
      />
      <Toast message={toast.message} visible={toast.visible} />

      <div className="flex-1 overflow-y-auto scroll-thin p-5 md:p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" className="sm:max-w-xs" />
          <FilterTabs options={filterOptions} value={roleFilter} onChange={setRoleFilter} />
        </div>

        <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
          {loadingList ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title={users.length === 0 ? "No users yet" : "No users match your filters"}
              description={
                users.length === 0
                  ? "Accounts you create will show up here."
                  : "Try a different search term or role filter."
              }
              action={
                users.length === 0 &&
                creatableRoles.length > 0 && (
                  <Button icon={UserPlus} variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                    Add user
                  </Button>
                )
              }
            />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-5 py-3">User</th>
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-5 py-3">Role</th>
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-5 py-3">Branch</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className={`hover-surface transition-colors ${i !== filtered.length - 1 ? "border-b border-border" : ""}`}>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={u.full_name} />
                        <div className="min-w-0">
                          <p className="text-[13.5px] text-text-primary truncate">{u.full_name}</p>
                          <p className="text-[11px] text-text-faint font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <StatusBadge tone={ROLE_TONE[u.role] || "info"}>{u.role}</StatusBadge>
                    </td>
                    <td className="px-5 py-3 align-middle text-[13px] text-text-muted">
                      {getBranchName(u.branch_id) || (
                        <span className="text-text-faint font-mono text-[11px]">
                          {u.branch_id ? `${u.branch_id.slice(0, 8)}…` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add user" subtitle="Create an account within your scope.">
        <form onSubmit={handleCreate}>
          {error && (
            <p className="text-[13px] bg-status-dangerbg text-status-dangertext rounded-lg px-3 py-2 mb-4">{error}</p>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Full name</label>
              <input
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
                className="w-full rounded-lg border border-border field-surface px-3 py-2 text-[13.5px] focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Email</label>
              <input
                type="email"
                placeholder="jane@company.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="w-full rounded-lg border border-border field-surface px-3 py-2 text-[13.5px] focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Temporary password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                className="w-full rounded-lg border border-border field-surface px-3 py-2 text-[13.5px] focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                required
                className="w-full rounded-lg border border-border field-surface px-3 py-2 text-[13.5px] focus:border-brand transition-colors"
              >
                <option value="">Role…</option>
                {creatableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {user?.role === "SUPER_ADMIN" && (
              <div>
                <label className="block text-[13px] font-medium mb-1.5">Branch</label>
                <select
                  value={form.branch_id}
                  onChange={(e) => update("branch_id", e.target.value)}
                  required
                  className="w-full rounded-lg border border-border field-surface px-3 py-2 text-[13.5px] focus:border-brand transition-colors"
                >
                  <option value="">Branch…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" icon={UserPlus} className="flex-1" loading={creating}>
              {creating ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
