import { useEffect, useRef, useState } from "react";
import { Plus, Send, Trash2, Copy, Check, PanelLeftClose, PanelLeft, Bot } from "lucide-react";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import OrchestratorTrace from "../components/OrchestratorTrace";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import TypingText from "../components/TypingText";
import DraftActionCard from "../components/DraftActionCard";
import MessageContent from "../components/MessageContent";
import Avatar from "../components/Avatar";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function BotAvatar() {
  return (
    <div className="shrink-0 rounded-full bg-brand/15 text-brand flex items-center justify-center w-[34px] h-[34px]">
      <Bot size={17} />
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  "What's our leave policy for new employees?",
  "How do I submit an expense reimbursement?",
  "Who do I contact for a VPN issue?",
  "What does our NDA say about client data?",
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable — silently ignore
        }
      }}
      className="text-text-faint hover:text-text-primary transition-colors"
      title="Copy message"
    >
      {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
    </button>
  );
}

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [active, setActive] = useState(null);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [animatingId, setAnimatingId] = useState(null); // message id currently "typing"
  const [streamingText, setStreamingText] = useState(null); // live text of the reply currently streaming in
  const bottomRef = useRef(null);
  const { toast, showToast } = useToast();
  const { user } = useAuth();
  // Tracks the activeId whose data we already have fresh in `active` —
  // either because we just fetched it, or because we just set it ourselves
  // (new chat / first message of a new chat, where `conv`/`updated` from
  // the API call is already the freshest copy). The [activeId] effect below
  // only re-fetches when activeId points somewhere this ref hasn't caught
  // up to yet. Using an idempotent "already synced up to this id" marker
  // instead of a one-shot "skip the next run" flag matters because
  // StrictMode double-invokes effects in dev — a one-shot flag gets
  // consumed on the first invocation and then the second invocation slips
  // through and re-fetches (still-empty) data, wiping out the optimistic
  // message. Marking the id itself is safe to "consume" any number of times.
  const syncedIdRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setAnimatingId(null); // switching conversations shouldn't replay animation
    if (syncedIdRef.current === activeId) return; // already have fresh data for this id
    syncedIdRef.current = activeId;
    loadConversation(activeId);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages?.length, sending]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }

  async function loadConversations() {
    const list = await api.listConversations();
    setConversations(list);
    if (list.length && !activeId) setActiveId(list[0].id);
  }

  async function loadConversation(id) {
    const conv = await api.getConversation(id);
    setActive(conv);
  }

  async function handleNewConversation() {
    const conv = await api.createConversation();
    setConversations((c) => [conv, ...c]);
    syncedIdRef.current = conv.id;
    setActiveId(conv.id);
    setActive(conv);
    setHistoryOpen(false);
  }

  async function handleDelete(id) {
    await api.deleteConversation(id);
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setActive(null);
    }
  }

  async function confirmDeleteConversation() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await handleDelete(pendingDelete.id);
      setPendingDelete(null);
      showToast("Conversation deleted");
    } finally {
      setDeleting(false);
    }
  }

  async function ask(q) {
    if (!q.trim()) return;
    let convId = activeId;
    if (!convId) {
      const conv = await api.createConversation();
      setConversations((c) => [conv, ...c]);
      convId = conv.id;
      syncedIdRef.current = convId;
      setActiveId(convId);
      setActive(conv);
    }

    // Optimistic echo: show the user's own message immediately instead of
    // waiting for the backend round-trip (which now takes a few seconds
    // because the reply streams in token-by-token).
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: q,
      routed_domains: null,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setActive((prev) =>
      prev ? { ...prev, messages: [...(prev.messages || []), tempUserMessage] } : prev
    );

    setSending(true);
    setQuestion("");
    setStreamingText("");
    try {
      await api.askInConversationStream(convId, q, {
        onToken: (text) => {
          setStreamingText((prev) => (prev ?? "") + text);
        },
        onDone: (updated) => {
          // Replaces the optimistic temp message + streaming bubble with
          // the real, persisted conversation (real ids, sources, etc.)
          setActive(updated);
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: updated.title } : c))
          );
          const last = updated.messages[updated.messages.length - 1];
          if (last?.routed_domains?.length) {
            showToast(`Routed to ${last.routed_domains.join(", ")}`);
          }
        },
        onError: (err) => {
          showToast(err.message || "Something went wrong");
        },
      });
    } finally {
      setSending(false);
      setStreamingText(null);
    }
  }

  function handleAsk(e) {
    e.preventDefault();
    ask(question);
  }

  const ConversationList = (
    <>
      <div className="p-3 border-b border-border">
        <button
          onClick={handleNewConversation}
          className="btn-shine w-full flex items-center justify-center gap-2 text-sm font-semibold text-ink bg-brand-gradient hover:shadow-glow-lg rounded-pill py-2.5 transition-all"
        >
          <Plus size={15} /> New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin">
        {conversations.length === 0 && (
          <p className="text-[13px] text-text-muted px-4 py-6">No conversations yet — start one.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveId(c.id);
              setHistoryOpen(false);
            }}
            className={`w-full text-left px-4 py-3 border-b border-border group ${
              activeId === c.id ? "active-surface" : "hover-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13.5px] text-text-primary truncate">{c.title || "New chat"}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete(c);
                }}
                className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-status-dangertext transition-opacity shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <Layout>
      <PageHeader
        title="Chat"
        subtitle="Ask about HR, Finance, IT or Legal policy"
        actions={
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="text-text-muted hover:text-text-primary p-1.5 hover:bg-app rounded-md transition-colors"
            title="Conversation history"
          >
            {historyOpen ? <PanelLeftClose size={17} /> : <PanelLeft size={17} />}
          </button>
        }
      />
      <Toast message={toast.message} visible={toast.visible} />

      <div className="flex flex-1 min-h-0 relative">
        {/* conversation list — lives behind the history button, on every screen size */}
        {historyOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade-in" onClick={() => setHistoryOpen(false)} />
            <div className="relative w-72 bg-card flex flex-col animate-slide-in-left border-r border-border">
              {ConversationList}
            </div>
          </div>
        )}

        {/* thread */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto scroll-thin px-4 md:px-6 py-6 space-y-5">
            {(!active || active.messages?.length === 0) && (
              <div>
                <p className="text-text-muted text-[13.5px] mb-3">
                  Ask about HR, Finance, IT or Legal policy — CorpMind routes it to the right specialist.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      className="text-[12.5px] bg-brand/5 text-text-primary border border-border rounded-pill px-4 py-2 hover:bg-brand/10 hover:border-brand/30 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active?.messages?.map((m) => {
              const isAnimating = m.id === animatingId;
              const pendingAction =
                m.role === "assistant" && m.sources?.length === 1 && m.sources[0]?.kind === "pending_action"
                  ? m.sources[0]
                  : null;

              return (
                <div
                  key={m.id}
                  className={`animate-fade-up flex gap-2.5 items-start ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && <BotAvatar />}

                  <div className={`max-w-[85%] md:max-w-xl group ${m.role === "user" ? "text-right" : ""}`}>
                    {m.role === "assistant" && !pendingAction && m.routed_domains?.length > 0 && (
                      <p className="text-[11px] text-text-faint font-mono mb-1">
                        answered by {m.routed_domains.join(" + ")} agent{m.routed_domains.length > 1 ? "s" : ""}
                      </p>
                    )}

                    {pendingAction ? (
                      <div className="text-left">
                        <div className="inline-block bg-card border border-border rounded-card rounded-bl-sm px-4 py-2.5 text-[13.5px] text-text-primary leading-relaxed mb-2">
                          {isAnimating ? (
                            <TypingText text={m.content} onTick={scrollToBottom} onDone={() => setAnimatingId(null)} />
                          ) : (
                            <MessageContent text={m.content} />
                          )}
                        </div>
                        {!isAnimating && (
                          <DraftActionCard
                            actionType={pendingAction.action_type}
                            initialDraft={pendingAction.draft_content}
                            conversationId={active.id}
                            onSend={(payload) =>
                              api.createAction(payload).then((created) => {
                                showToast("Sent to HR for review");
                                return created;
                              })
                            }
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`inline-block text-left px-4 py-2.5 text-[13.5px] leading-relaxed ${
                            m.role === "user"
                              ? "bg-brand-gradient text-ink shadow-sm rounded-card rounded-br-sm whitespace-pre-wrap"
                              : "bg-card text-text-primary border border-border shadow-card rounded-card rounded-bl-sm"
                          }`}
                        >
                          {isAnimating ? (
                            <TypingText text={m.content} onTick={scrollToBottom} onDone={() => setAnimatingId(null)} />
                          ) : m.role === "assistant" ? (
                            <MessageContent text={m.content} />
                          ) : (
                            m.content
                          )}
                        </div>
                        {m.role === "assistant" && !isAnimating && (
                          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={m.content} />
                          </div>
                        )}
                        {m.role === "assistant" && !isAnimating && m.sources?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-dashed border-border text-left">
                            {m.sources.map((s, i) => (
                              <p key={i} className="text-[11px] font-mono text-text-faint">
                                {s.title || s.document_id}
                                {s.chunk_index != null ? ` §${s.chunk_index}` : ""}
                              </p>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {m.role === "user" && <Avatar name={user?.full_name} size={34} />}
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-2.5 items-start justify-start animate-fade-up">
                <BotAvatar />
                {streamingText ? (
                  <div className="max-w-[85%] md:max-w-xl">
                    <div className="inline-block text-left px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap bg-card text-text-primary border border-border rounded-card rounded-bl-sm">
                      {streamingText}
                      <span className="inline-block w-1.5 h-3.5 bg-text-faint/70 ml-0.5 align-middle animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <OrchestratorTrace
                    steps={[
                      { kind: "route", label: "Classifying question into a domain" },
                      { kind: "search", label: "Searching indexed documents" },
                      { kind: "generate", label: "Drafting grounded answer" },
                    ]}
                  />
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleAsk} className="border-t border-border bg-card p-3 md:p-4 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about a policy…"
              className="flex-1 rounded-pill border border-border field-surface px-4 py-2.5 text-[13.5px] text-text-primary placeholder:text-text-faint focus:border-brand transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !question.trim()}
              className="btn-shine bg-brand-gradient hover:shadow-glow-lg text-ink rounded-pill px-5 flex items-center gap-1.5 text-sm font-semibold transition-all disabled:opacity-50"
            >
              <Send size={15} /> <span className="hidden sm:inline">{sending ? "Sending…" : "Send"}</span>
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDeleteConversation}
        loading={deleting}
        title="Delete this conversation?"
        description={pendingDelete ? `"${pendingDelete.title || "New chat"}" and its messages will be permanently removed.` : ""}
      />
    </Layout>
  );
}