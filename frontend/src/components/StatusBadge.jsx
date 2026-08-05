const STATUS_STYLES = {
  success: "bg-status-successbg text-status-successtext",
  warning: "bg-status-warnbg text-status-warntext",
  danger: "bg-status-dangerbg text-status-dangertext",
  info: "bg-status-infobg text-status-infotext",
};

export default function StatusBadge({ tone = "info", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 ${STATUS_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}