import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allow }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-app">
        <Loader2 size={20} className="animate-spin text-brand" />
        <p className="text-text-muted font-mono text-[12.5px] tracking-wide">Loading CorpMind…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/chat" replace />;
  }

  return children;
}
