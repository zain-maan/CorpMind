import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "btn-shine bg-brand-gradient text-ink hover:shadow-glow-lg active:brightness-95 shadow-sm disabled:hover:shadow-none",
  secondary:
    "bg-card text-text-primary border border-border hover:border-brand/40 hover:bg-brand/5 active:bg-brand/10",
  ghost:
    "text-text-muted hover:text-text-primary hover:bg-black/[0.04]",
  danger:
    "bg-transparent text-status-dangertext border border-status-dangertext/25 hover:bg-status-dangerbg",
};

const SIZES = {
  sm: "text-[12.5px] px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-[13.5px] px-4 py-2.5 gap-2 rounded-lg",
};

export default function Button({
  as: As = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <As
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 13 : 15} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 13 : 15} />
      )}
      {children}
    </As>
  );
}
