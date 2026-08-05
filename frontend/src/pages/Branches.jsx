import { useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { api } from "../api/client";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoadingList(true);
    try {
      setBranches(await api.listBranches());
    } finally {
      setLoadingList(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.createBranch({ name });
      setName("");
      setAddOpen(false);
      showToast("Branch created");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Branches"
        subtitle="Each branch's documents and chats stay isolated from other branches."
        actions={
          <Button icon={Plus} variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            Add branch
          </Button>
        }
      />
      <Toast message={toast.message} visible={toast.visible} />

      <div className="flex-1 overflow-y-auto scroll-thin p-5 md:p-6">
        {loadingList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-card" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-card border border-border rounded-card shadow-card">
            <EmptyState
              icon={Building2}
              title="No branches yet"
              description="Create your company's first branch to start onboarding admins, HR and employees."
              action={
                <Button icon={Plus} variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                  Add branch
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="hover-lift bg-card border border-border rounded-cardlg shadow-card px-5 py-4 flex items-center gap-3.5 hover:border-brand/30 transition-colors duration-150"
              >
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-brand-dark" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-[14px] text-text-primary truncate">{b.name}</p>
                  <p className="text-[11px] text-text-faint font-mono uppercase mt-0.5">Branch</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add branch" subtitle="Documents and chats stay isolated per branch.">
        <form onSubmit={handleCreate}>
          {error && (
            <p className="text-[13px] bg-status-dangerbg text-status-dangertext rounded-lg px-3 py-2 mb-4">{error}</p>
          )}
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Branch name</label>
          <input
            placeholder="e.g. Lahore HQ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-border field-surface text-text-primary placeholder:text-text-faint px-3 py-2 text-[13.5px] mb-5 focus:border-brand transition-colors"
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" icon={Plus} className="flex-1" loading={creating}>
              {creating ? "Creating…" : "Create branch"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
