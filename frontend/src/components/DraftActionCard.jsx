import { useState } from "react";
import ActionTypeBadge from "./ActionTypeBadge";

export default function DraftActionCard({ actionType, initialDraft, conversationId, onSend }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [sentAction, setSentAction] = useState(null); // holds the created ActionRequest once sent

  async function handleSend() {
    setSending(true);
    try {
      const created = await onSend({ action_type: actionType, draft_content: draft, conversation_id: conversationId });
      setSentAction(created);
      setEditing(false);
    } finally {
      setSending(false);
    }
  }

  if (sentAction) {
    return (
      <div className="border border-border rounded-cardlg bg-card shadow-card overflow-hidden max-w-md">
        <div className="flex border-l-4 border-brand">
          <div className="p-4 w-full">
            <div className="flex items-center gap-2 mb-2">
              <ActionTypeBadge type={sentAction.action_type} />
              <span className="text-[12.5px] text-text-muted">Sent to HR for review</span>
            </div>
            <p className="text-[13px] text-text-muted whitespace-pre-wrap">{sentAction.draft_content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-cardlg bg-card shadow-card overflow-hidden max-w-md">
      <div className="flex border-l-4 border-domain-finance">
        <div className="p-4 w-full">
          <div className="flex items-center gap-2 mb-3">
            <ActionTypeBadge type={actionType} />
            <span className="text-[12.5px] text-text-muted">Draft — not sent yet</span>
          </div>

          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border field-surface text-text-primary placeholder:text-text-faint px-3 py-2 text-[13px] focus:border-brand resize-none mb-3"
            />
          ) : (
            <p className="text-[13px] text-text-primary whitespace-pre-wrap mb-3">{draft}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              className="btn-shine text-[12.5px] font-semibold text-ink bg-brand-gradient hover:shadow-glow-lg rounded-lg px-3.5 py-1.5 transition-all disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send to HR for review"}
            </button>
            <button
              onClick={() => setEditing((e) => !e)}
              className="text-[12.5px] font-medium text-text-muted border border-border rounded-lg px-3.5 py-1.5 hover-surface transition-colors"
            >
              {editing ? "Done editing" : "Edit draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}