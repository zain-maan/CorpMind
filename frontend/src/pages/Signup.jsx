import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, Mail, Lock } from "lucide-react";
import Button from "../components/Button";
import { api } from "../api/client";

const FIELDS = [
  { key: "company_name", label: "Company name", type: "text", icon: Building2, placeholder: "Acme Inc." },
  { key: "full_name", label: "Your full name", type: "text", icon: User, placeholder: "Jane Doe" },
  { key: "email", label: "Email", type: "email", icon: Mail, placeholder: "you@company.com" },
  { key: "password", label: "Password", type: "password", icon: Lock, placeholder: "••••••••" },
];

export default function Signup() {
  const [form, setForm] = useState({ company_name: "", full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.signup({
        company_name: form.company_name,
        admin_full_name: form.full_name,
        admin_email: form.email,
        admin_password: form.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-ink text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="blob absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand/30 pointer-events-none" />
        <div className="blob blob-delay absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-blue-500/10 pointer-events-none" />
        <h1 className="font-brand font-semibold text-2xl text-brand-glow">CorpMind</h1>
        <div>
          <p className="text-white/40 text-[11px] font-sans uppercase tracking-wide mb-3">get set up</p>
          <p className="text-white/85 text-xl leading-snug max-w-sm font-heading font-semibold mb-3">
            Bring your company's policies into one place, routed by domain.
          </p>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            This creates your company workspace and its first super-admin account — you can invite
            branch admins, HR and employees afterward.
          </p>
        </div>
        <p className="text-white/25 text-xs font-sans">© your company</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-8 bg-app">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-card border border-border rounded-cardlg shadow-card p-8"
        >
          <h2 className="font-heading font-semibold text-[19px] text-text-primary mb-1">Create your company</h2>
          <p className="text-text-muted text-[13.5px] mb-7">
            This creates your company and its first super-admin account.
          </p>

          {error && (
            <div className="mb-4 text-[13px] bg-status-dangerbg text-status-dangertext rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {FIELDS.map(({ key, label, type, icon: Icon, placeholder }) => (
            <div key={key} className="mb-4">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-border field-surface text-text-primary placeholder:text-text-faint pl-8 pr-3 py-2 text-[13.5px] focus:border-brand transition-colors"
                />
              </div>
            </div>
          ))}

          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full mt-2">
            {loading ? "Creating…" : "Create company"}
          </Button>

          <p className="text-[13px] text-text-muted mt-6">
            Already set up?{" "}
            <Link to="/login" className="text-brand font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
