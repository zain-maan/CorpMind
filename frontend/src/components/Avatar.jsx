const PALETTE = [
  "bg-domain-hrbg text-domain-hrtext",
  "bg-domain-financebg text-domain-financetext",
  "bg-domain-itbg text-domain-ittext",
  "bg-domain-legalbg text-domain-legaltext",
];

function hashString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 34 }) {
  const cls = PALETTE[hashString(name) % PALETTE.length];
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center font-heading font-semibold ${cls}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
