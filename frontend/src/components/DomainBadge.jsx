const DOMAIN_STYLES = {
  HR: "bg-domain-hrbg text-domain-hrtext",
  FINANCE: "bg-domain-financebg text-domain-financetext",
  IT: "bg-domain-itbg text-domain-ittext",
  LEGAL: "bg-domain-legalbg text-domain-legaltext",
  RESTRICTED: "bg-domain-restrictedbg text-domain-restrictedtext",
};

export default function DomainBadge({ domain, size = "sm" }) {
  const key = (domain || "").toUpperCase();
  const style = DOMAIN_STYLES[key] || "bg-status-infobg text-status-infotext";
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-pill font-mono font-bold uppercase tracking-wide ${style} ${sizeClass}`}
    >
      {key}
    </span>
  );
}