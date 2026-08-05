import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-ink text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="blob absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand/30 pointer-events-none" />
        <div className="blob blob-delay absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-blue-500/10 pointer-events-none" />
        <h1 className="font-brand font-semibold text-2xl text-brand-glow">CorpMind</h1>
        <div>
          <p className="text-white/40 text-[11px] font-sans uppercase tracking-wide mb-3">routed by domain</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              ["HR", "border-domain-hr/40"],
              ["FINANCE", "border-domain-finance/40"],
              ["IT", "border-domain-it/40"],
              ["LEGAL", "border-domain-legal/40"],
            ].map(([d, cls]) => (
              <span
                key={d}
                className={`text-[11px] font-mono font-bold uppercase tracking-wide px-2.5 py-1 rounded-pill border text-white/80 bg-white/[0.05] ${cls}`}
              >
                {d}
              </span>
            ))}
          </div>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            One question, one place. Each specialist agent answers strictly from its own domain's documents.
          </p>
        </div>
        <p className="text-white/25 text-xs font-sans">© your company</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-8 bg-app">
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-cardlg shadow-card p-8">
          <h2 className="font-heading font-semibold text-[19px] text-text-primary mb-1">Sign in</h2>
          <p className="text-text-muted text-[13.5px] mb-7">Use your company email and password.</p>

          {error && (
            <div className="mb-4 text-[13px] bg-status-dangerbg text-status-dangertext rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Email</label>
          <div className="relative mb-4">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border field-surface text-text-primary placeholder:text-text-faint pl-8 pr-3 py-2 text-[13.5px] focus:border-brand transition-colors"
              placeholder="you@company.com"
            />
          </div>

          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Password</label>
          <div className="relative mb-6">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border field-surface text-text-primary placeholder:text-text-faint pl-8 pr-3 py-2 text-[13.5px] focus:border-brand transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-[13px] text-text-muted mt-6">
            Setting up a new company?{" "}
            <Link to="/signup" className="text-brand font-medium hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
