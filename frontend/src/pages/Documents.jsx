import { useEffect, useMemo, useState } from "react";
import { Upload, Trash2, FileText, FileUp } from "lucide-react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import DomainBadge from "../components/DomainBadge";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import SearchInput from "../components/SearchInput";
import FilterTabs from "../components/FilterTabs";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const DOMAINS = ["hr", "finance", "it", "legal"];

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("hr");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const { toast, showToast } = useToast();

  const canUpload = ["SUPER_ADMIN", "BRANCH_ADMIN", "HR"].includes(user?.role);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoadingList(true);
    try {
      const list = await api.listDocuments();
      setDocs(list);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("domain", domain);
      await api.uploadDocument(formData);
      setTitle("");
      setFile(null);
      setUploadOpen(false);
      showToast("Document uploaded");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteDocument(pendingDelete.id);
      setPendingDelete(null);
      showToast("Document deleted");
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const filterOptions = useMemo(() => {
    const counts = { all: docs.length };
    DOMAINS.forEach((d) => (counts[d] = docs.filter((doc) => (doc.domain || "").toLowerCase() === d).length));
    return [
      { value: "all", label: "All", count: counts.all },
      ...DOMAINS.map((d) => ({ value: d, label: d.toUpperCase(), count: counts[d] })),
    ];
  }, [docs]);

  const filtered = docs.filter((d) => {
    const matchesDomain = domainFilter === "all" || (d.domain || "").toLowerCase() === domainFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.title?.toLowerCase().includes(q) ||
      d.original_filename?.toLowerCase().includes(q);
    return matchesDomain && matchesSearch;
  });

  return (
    <Layout>
      <PageHeader
        title="Documents"
        subtitle="Policy documents indexed per domain — only a domain's own documents ground that specialist agent's answers."
        actions={
          canUpload && (
            <Button icon={FileUp} variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
              Upload document
            </Button>
          )
        }
      />
      <Toast message={toast.message} visible={toast.visible} />

      <div className="flex-1 overflow-y-auto scroll-thin p-5 md:p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search documents…" className="sm:max-w-xs" />
          <FilterTabs options={filterOptions} value={domainFilter} onChange={setDomainFilter} />
        </div>

        <div className="bg-card border border-border rounded-card shadow-card overflow-hidden">
          {loadingList ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={docs.length === 0 ? "No documents yet" : "No documents match your filters"}
              description={
                docs.length === 0
                  ? canUpload
                    ? "Upload your first policy document to start grounding answers for its domain."
                    : "Documents uploaded by HR or admins will appear here."
                  : "Try a different search term or domain filter."
              }
              action={
                docs.length === 0 &&
                canUpload && (
                  <Button icon={Upload} variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
                    Upload document
                  </Button>
                )
              }
            />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-5 py-3">Domain</th>
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-5 py-3">Document</th>
                  <th className="text-[11px] uppercase tracking-wide text-text-faint font-semibold px-5 py-3">Status</th>
                  {canUpload && <th className="px-5 py-3 w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr
                    key={d.id}
                    className={`group hover-surface transition-colors ${i !== filtered.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <td className="px-5 py-3.5 align-top">
                      <DomainBadge domain={d.domain} />
                    </td>
                    <td className="px-5 py-3.5 align-top min-w-0">
                      <p className="text-[13.5px] text-text-primary truncate">{d.title}</p>
                      <p className="text-[11px] text-text-faint font-mono truncate mt-0.5">{d.original_filename}</p>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <StatusBadge tone={d.is_active ? "success" : "info"}>
                        {d.is_active ? "Active" : "Deleted"}
                      </StatusBadge>
                    </td>
                    {canUpload && (
                      <td className="px-5 py-3.5 align-top text-right">
                        {d.is_active && (
                          <button
                            onClick={() => setPendingDelete(d)}
                            className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-status-dangertext transition-opacity"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload document"
        subtitle="It will be indexed and used to ground answers for the selected domain."
      >
        <form onSubmit={handleUpload}>
          {error && (
            <p className="text-[13px] bg-status-dangerbg text-status-dangertext rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          <label className="block text-[13px] font-medium mb-1.5">Title (optional)</label>
          <input
            type="text"
            placeholder="e.g. Leave Policy 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border field-surface px-3 py-2 text-[13.5px] mb-4 focus:border-brand transition-colors"
          />

          <label className="block text-[13px] font-medium mb-1.5">Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border border-border field-surface px-3 py-2 text-[13.5px] mb-4 focus:border-brand transition-colors"
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d.toUpperCase()}
              </option>
            ))}
          </select>

          <label className="block text-[13px] font-medium mb-1.5">File</label>
          <div className="border border-dashed border-border rounded-lg px-3 py-4 mb-5 text-center hover:border-brand/50 transition-colors">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-[13px] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-surface file:text-brand-darker file:text-[12.5px] file:font-medium"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" icon={Upload} className="flex-1" disabled={!file} loading={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this document?"
        description={pendingDelete ? `"${pendingDelete.title}" will no longer ground answers for its domain.` : ""}
      />
    </Layout>
  );
}
