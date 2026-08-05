import { CheckCircle2 } from "lucide-react";

export default function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-up">
      <div className="flex items-center gap-2 bg-ink text-white text-sm rounded-full pl-3 pr-4 py-2.5 shadow-float font-medium border border-white/10">
        <CheckCircle2 size={15} className="text-brand-glow shrink-0" />
        {message}
      </div>
    </div>
  );
}
