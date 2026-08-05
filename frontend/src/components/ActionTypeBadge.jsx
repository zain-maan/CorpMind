const TYPE_STYLES = {
  leave: "bg-domain-hrbg text-domain-hrtext",
  expense: "bg-domain-financebg text-domain-financetext",
};

export default function ActionTypeBadge({ type }) {
  const key = (type || "").toLowerCase();
  const style = TYPE_STYLES[key] || "bg-status-infobg text-status-infotext";

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-bold uppercase tracking-wide text-[11px] px-2 py-0.5 ${style}`}
    >
      {key || "unknown"}
    </span>
  );
}