import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  FileSearch,
  Workflow,
  ClipboardCheck,
  Building2,
} from "lucide-react";

const DOMAINS = [
  { label: "HR", cls: "text-domain-hrtext border-domain-hr/30 bg-domain-hrbg" },
  { label: "FINANCE", cls: "text-domain-financetext border-domain-finance/30 bg-domain-financebg" },
  { label: "IT", cls: "text-domain-ittext border-domain-it/30 bg-domain-itbg" },
  { label: "LEGAL", cls: "text-domain-legaltext border-domain-legal/30 bg-domain-legalbg" },
];

const STEPS = [
  {
    n: "01",
    title: "Someone asks a question",
    body: "In plain language — no forms, no picking a department first.",
  },
  {
    n: "02",
    title: "CorpMind routes it",
    body: "The orchestrator reads the question and hands it to the specialist agent(s) it actually belongs to.",
  },
  {
    n: "03",
    title: "The specialist searches only its own documents",
    body: "HR can't see Legal's contracts, IT can't see Finance's ledgers — enforced structurally, not just by prompt.",
  },
  {
    n: "04",
    title: "The answer comes back with sources",
    body: "Every reply cites the document and section it came from, so it can be checked, not just trusted.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Access control that's structural",
    body: "Branch and role boundaries are enforced at the retrieval layer itself — an employee's question physically cannot reach a document outside their branch.",
  },
  {
    icon: FileSearch,
    title: "Grounded, not guessed",
    body: "Answers are built from your indexed policy documents, with citations back to the exact source and section.",
  },
  {
    icon: Workflow,
    title: "One inbox, four specialists",
    body: "HR, Finance, IT and Legal each get their own agent trained only on their own documents — routed automatically per question.",
  },
  {
    icon: ClipboardCheck,
    title: "Requests, not just answers",
    body: "Leave and expense questions can turn straight into a drafted request, reviewed and edited before it's sent to HR.",
  },
];

function DomainPill({ label, cls, delay }) {
  return (
    <span
      className={`text-[11px] font-mono font-bold uppercase tracking-wide px-2.5 py-1 rounded-pill border animate-fade-up ${cls}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {label}
    </span>
  );
}

function RoutingVisual() {
  return (
    <div className="relative rounded-cardlg border border-border bg-card shadow-float hover-lift p-6 md:p-7 max-w-sm w-full">
      <p className="text-[11px] font-mono uppercase tracking-wide text-text-faint mb-3">incoming question</p>
      <div className="bg-brand/5 border border-border rounded-card rounded-bl-sm px-4 py-2.5 text-[13.5px] text-text-primary mb-5">
        "What's our leave policy for new employees?"
      </div>

      <div className="flex items-center gap-2 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-border to-brand/40" />
        <span className="text-[10.5px] font-mono text-text-faint whitespace-nowrap">routed to</span>
        <div className="h-px flex-1 bg-gradient-to-l from-border to-brand/40" />
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-5">
        {DOMAINS.map((d, i) => (
          <DomainPill key={d.label} {...d} delay={150 + i * 90} />
        ))}
      </div>

      <div
        className="bg-domain-hrbg border border-domain-hr/25 rounded-card rounded-bl-sm px-4 py-2.5 text-[12.5px] text-text-primary leading-relaxed animate-fade-up"
        style={{ animationDelay: "560ms" }}
      >
        <span className="text-domain-hrtext font-mono text-[10.5px] uppercase font-bold block mb-1">
          answered by HR agent
        </span>
        New employees accrue 1.5 days of leave per month, available after a 90-day probation period…
        <p className="mt-1.5 text-[10.5px] font-mono text-text-faint">Employee_Handbook.pdf §4.2</p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-app text-text-primary overflow-x-hidden">
      {/* nav */}
      <header className="border-b border-border sticky top-0 z-20 bg-app/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <h1 className="font-brand font-semibold text-[20px] tracking-tight text-gradient">CorpMind</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="link-underline text-[13.5px] font-medium text-text-muted hover:text-text-primary px-3 py-2 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="btn-shine text-[13.5px] font-semibold text-ink bg-brand-gradient hover:shadow-glow-lg rounded-pill px-4 py-2 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative max-w-6xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-20 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
        <div className="blob absolute top-10 -left-20 w-72 h-72 rounded-full bg-brand/20 pointer-events-none -z-10" />
        <div className="blob blob-delay absolute bottom-0 right-0 w-72 h-72 rounded-full bg-blue-500/10 pointer-events-none -z-10" />
        <div className="animate-fade-up">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-brand-dark mb-4">
            one question → the right specialist
          </p>
          <h2 className="font-display font-black text-[38px] sm:text-[46px] md:text-[52px] leading-[1.05] tracking-tight mb-5">
            Ask once. <span className="text-gradient">CorpMind</span> finds the specialist who actually knows.
          </h2>
          <p className="text-text-muted text-[15px] md:text-[16px] leading-relaxed mb-8 max-w-md">
            One chat for HR, Finance, IT and Legal questions. Every answer is grounded in your
            company's own documents, cited, and kept inside the boundaries your org chart already draws.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="btn-shine inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink bg-brand-gradient hover:shadow-glow-lg rounded-pill px-5 py-3 transition-all"
            >
              Set up your company <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-text-primary border border-border hover:border-brand/40 hover:bg-brand/5 rounded-pill px-5 py-3 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="flex justify-center md:justify-end animate-fade-up" style={{ animationDelay: "120ms" }}>
          <RoutingVisual />
        </div>
      </section>

      {/* how it works */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-brand-dark mb-2">how it works</p>
          <h3 className="font-heading font-semibold text-[24px] md:text-[28px] mb-10 max-w-lg">
            From question to a cited, on-policy answer — in one round trip.
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="hover-lift rounded-cardlg p-4 -m-4">
                <p className="font-display font-black text-[28px] text-brand/15 mb-2 leading-none">{s.n}</p>
                <h4 className="font-heading font-semibold text-[15px] mb-1.5">{s.title}</h4>
                <p className="text-text-muted text-[13.5px] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-t border-border bg-app-glow">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-brand-dark mb-2">built for the org chart you already have</p>
          <h3 className="font-heading font-semibold text-[24px] md:text-[28px] mb-10 max-w-lg">
            Not one big chatbot with everything in it — four specialists with real boundaries.
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="hover-lift border border-border bg-card rounded-cardlg p-6 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-brand-gradient text-ink flex items-center justify-center mb-4 shadow-sm">
                  <Icon size={18} />
                </div>
                <h4 className="font-heading font-semibold text-[15px] mb-1.5">{title}</h4>
                <p className="text-text-muted text-[13.5px] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="border-t border-border relative overflow-hidden">
        <div className="blob absolute top-0 left-1/2 -translate-x-1/2 w-96 h-72 rounded-full bg-brand/10 pointer-events-none -z-10" />
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4 animate-pop-in">
            <Building2 size={22} className="text-brand-dark" />
          </div>
          <h3 className="font-heading font-semibold text-[22px] md:text-[26px] mb-3">
            Set up your company's workspace in a few minutes.
          </h3>
          <p className="text-text-muted text-[14px] mb-8 max-w-md mx-auto">
            Add your branches, upload your policy documents, invite HR — CorpMind takes it from there.
          </p>
          <Link
            to="/signup"
            className="btn-shine inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink bg-brand-gradient hover:shadow-glow-lg rounded-pill px-6 py-3 transition-all"
          >
            Get started free <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-text-faint text-[12px]">© {new Date().getFullYear()} CorpMind</p>
          <p className="text-text-faint text-[12px] font-mono">routed by domain, grounded by document</p>
        </div>
      </footer>
    </div>
  );
}
