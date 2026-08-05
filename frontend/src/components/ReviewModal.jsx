import { useState } from "react";
import { X } from "lucide-react";

export default function ReviewModal({ action, decision, onClose, onConfirm }) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!action) return null;

  const isApprove = decision === "approved";

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm(action.id, decision, notes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-inkdeep/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-cardlg shadow-float border border-border w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-semibold text-[17px] text-text-primary">
            {isApprove ? "Approve request" : "Reject request"}
          </h3>
          <button onClick={onClose} className="text-text-faint hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="bg-brand/5 border border-border rounded-lg px-3 py-2.5 mb-4 text-[13px] text-text-muted whitespace-pre-wrap max-h-32 overflow-y-auto scroll-thin">
          {action.draft_content}
        </div>

        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Note {isApprove ? "(optional)" : "— explain why"}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={isApprove ? "Add a note for the employee…" : "Reason for rejection…"}
          className="w-full rounded-lg border border-border field-surface text-text-primary placeholder:text-text-faint px-3 py-2 text-[13.5px] focus:border-brand mb-5 resize-none"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-border text-text-muted hover-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              isApprove ? "btn-shine bg-brand-gradient text-ink hover:shadow-glow-lg" : "bg-domain-legal text-white hover:opacity-90"
            }`}
          >
            {submitting ? "Saving…" : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}