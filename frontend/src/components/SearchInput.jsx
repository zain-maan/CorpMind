import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search…", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border field-surface text-text-primary pl-8 pr-3 py-2 text-[13px] placeholder:text-text-faint focus:border-brand transition-colors"
      />
    </div>
  );
}
