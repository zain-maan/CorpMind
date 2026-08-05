import { Loader2, Search, Route, Sparkles, CheckCircle2 } from "lucide-react";

const STEP_ICONS = { route: Route, search: Search, generate: Sparkles, done: CheckCircle2 };

export default function OrchestratorTrace({ steps }) {
  const lastIdx = steps.length - 1;
  return (
    <div className="bg-inkdeep rounded-card px-4 py-3.5 max-w-md mb-1.5 shadow-float border border-white/5">
      <div className="space-y-2.5">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[step.kind] || Sparkles;
          const isActive = i === lastIdx;
          return (
            <div
              key={i}
              className="trace-step flex items-center gap-2.5 text-[13px]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {isActive ? (
                <Loader2 size={14} className="text-brand-glow shrink-0 animate-spin" />
              ) : (
                <Icon size={14} className="text-brand-glow/70 shrink-0" />
              )}
              <span className={isActive ? "text-white/90" : "text-white/55"}>{step.label}</span>
              {step.meta && (
                <span className="text-white/35 font-mono text-[11px] ml-auto shrink-0">{step.meta}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
