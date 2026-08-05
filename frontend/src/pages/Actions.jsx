import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ActionTypeBadge from "../components/ActionTypeBadge";
import ReviewModal from "../components/ReviewModal";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const TABS = ["All", "Pending", "Approved", "Rejected"];
const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" };

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Actions() {
  const { user } = useAuth();
  const canManage = ["HR", "BRANCH_ADMIN"].includes(user?.role);

  const [actions, setActions] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [tab, setTab] = useState("All");
  const [reviewTarget, setReviewTarget] = useState(null); // { action, decision }
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await api.listActions();
      setActions(list);

      if (canManage) {
        const users = await api.listUsers();
        const map = {};
        users.forEach((u) => (map[u.id] = u.full_name));
        setEmployeeMap(map);
      }
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (tab === "All") return actions;
    return actions.filter((a) => a.status === tab.toLowerCase());
  }, [actions, tab]);

  async function handleConfirmReview(actionId, decision, notes) {
    const updated = await api.updateAction(actionId, { status: decision, hr_notes: notes || undefined });
    setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)));
    showToast(decision === "approved" ? "Request approved" : "Request rejected");
  }

  return (
    <Layout>
      <PageHeader
        title={canManage ? "Action Requests" : "My Requests"}
        subtitle={
          canManage
            ? "Leave and expense drafts submitted by employees in your branch"
            : "Leave and expense requests you've submitted via chat"
        }
      />
      <Toast message={toast.message} visible={toast.visible} />

      <div className="p-6 flex-1 min-h-0 overflow-y-auto">
        {/* status tabs */}
        <div className="flex gap-1.5 mb-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[12.5px] font-medium px-3.5 py-1.5 rounded-pill border transition-colors ${
                tab === t
                  ? "btn-shine bg-brand-gradient text-ink border-brand shadow-sm"
                  : "bg-card text-text-muted border-border hover-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-[13.5px] text-text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-card p-8 text-center">
            <p className="text-[13.5px] text-text-muted">No {tab.toLowerCase() !== "all" ? tab.toLowerCase() : ""} requests to show.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {canManage && (
                    <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-4 py-3">
                      Employee
                    </th>
                  )}
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-4 py-3">Type</th>
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-4 py-3">Draft</th>
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-4 py-3">Status</th>
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-4 py-3">Submitted</th>
                  {canManage && (
                    <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-4 py-3">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx) => (
                  <tr key={a.id} className={idx !== filtered.length - 1 ? "border-b border-border" : ""}>
                    {canManage && (
                      <td className="px-4 py-3.5 text-[13.5px] text-text-primary whitespace-nowrap">
                        {employeeMap[a.employee_id] || (
                          <span className="text-text-faint font-mono text-[12px]">{a.employee_id.slice(0, 8)}…</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <ActionTypeBadge type={a.action_type} />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-muted max-w-sm">
                      <p className="line-clamp-2">{a.draft_content}</p>
                      {a.hr_notes && (
                        <p className="text-[11.5px] text-text-faint mt-1 italic">Note: {a.hr_notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge tone={STATUS_TONE[a.status] || "info"}>{a.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] font-mono text-text-faint whitespace-nowrap">
                      {formatDate(a.created_at)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {a.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setReviewTarget({ action: a, decision: "approved" })}
                              className="text-[12.5px] font-semibold text-brand hover:underline"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setReviewTarget({ action: a, decision: "rejected" })}
                              className="text-[12.5px] font-semibold text-domain-legal hover:underline"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-text-faint text-[12.5px]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReviewModal
        action={reviewTarget?.action}
        decision={reviewTarget?.decision}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleConfirmReview}
      />
    </Layout>
  );
}