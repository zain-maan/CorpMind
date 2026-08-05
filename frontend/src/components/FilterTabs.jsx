export default function FilterTabs({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-app border border-border rounded-lg p-1 overflow-x-auto scroll-thin">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-all duration-150 ${
              active
                ? "bg-card text-text-primary shadow-sm border border-border"
                : "text-text-muted hover:text-text-primary hover:bg-black/[0.03]"
            }`}
          >
            {opt.label}
            {opt.count != null && (
              <span className={`ml-1.5 text-[11px] ${active ? "text-text-faint" : "text-text-faint/70"}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
