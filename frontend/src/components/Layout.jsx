import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MessageSquare, FileText, Users, Building2, LogOut, Menu, X, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { to: "/chat", label: "Chat", icon: MessageSquare, allow: ["SUPER_ADMIN", "BRANCH_ADMIN", "HR", "EMPLOYEE"] },
      { to: "/actions", label: "Requests", icon: ClipboardList, allow: ["BRANCH_ADMIN", "HR", "EMPLOYEE"] },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/documents", label: "Documents", icon: FileText, allow: ["SUPER_ADMIN", "BRANCH_ADMIN", "HR"] },
      { to: "/users", label: "Users", icon: Users, allow: ["SUPER_ADMIN", "BRANCH_ADMIN", "HR"] },
      { to: "/branches", label: "Branches", icon: Building2, allow: ["SUPER_ADMIN"] },
    ],
  },
];

function SidebarContent({ user, onLogout, onNavigate }) {
  return (
    <>
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="font-brand font-semibold text-[22px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-glow to-brand-glow2 leading-tight">CorpMind</h1>
          {user?.company_name && (
            <p className="text-[11.5px] text-white/45 truncate mt-0.5">{user.company_name}</p>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto scroll-thin">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => item.allow.includes(user?.role));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-[11px] uppercase tracking-[0.1em] text-white/40 px-3 mb-2 font-semibold">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 px-3 py-2 text-sm border-l-2 transition-all duration-150 rounded-r-md ${
                        isActive
                          ? "border-brand-glow bg-white/[0.07] text-white shadow-[inset_0_0_20px_rgba(111,168,75,0.08)]"
                          : "border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white hover:translate-x-0.5"
                      }`
                    }
                  >
                    <Icon size={16} className="transition-transform duration-150 group-hover:scale-110" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 mb-2 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-glow to-brand-glow2 flex items-center justify-center text-[11px] font-heading font-semibold text-ink shrink-0">
            {(user?.full_name || "?").trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white/90 truncate leading-tight">{user?.full_name}</p>
            <p className="text-[10.5px] text-white/40 font-mono uppercase tracking-wide">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/55 hover:bg-white/[0.04] hover:text-white transition-colors rounded-md"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col md:grid md:grid-cols-[250px_1fr] bg-app">
      {/* desktop sidebar */}
      <aside className="hidden md:flex bg-ink text-white flex-col">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-ink text-white shrink-0">
        <div className="min-w-0">
          <h1 className="font-brand font-black text-lg tracking-tight text-brand-glow leading-tight">CorpMind</h1>
          {user?.company_name && (
            <p className="text-[10.5px] text-white/45 truncate">{user.company_name}</p>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[260px] bg-ink text-white flex flex-col animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-4 text-white/60 hover:text-white p-1"
            >
              <X size={18} />
            </button>
            <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}