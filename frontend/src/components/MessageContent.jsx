// Small, dependency-free renderer for the light markdown that LLM answers
// tend to contain: **bold**, *italic*, `code`, bullet / numbered lists,
// paragraphs and bare URLs. Good enough for chat bubbles without pulling in
// react-markdown.

const URL_RE = /(https?:\/\/[^\s)]+)/g;

function renderInline(text, keyPrefix) {
  // Split on **bold**, *italic* and `code` while keeping the delimiters,
  // then walk the pieces turning them into spans / links.
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return tokens.flatMap((token, i) => {
    const key = `${keyPrefix}-${i}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      return [
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      ];
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return [
        <code key={key} className="px-1 py-0.5 rounded bg-black/[0.06] text-[0.9em] font-mono">
          {token.slice(1, -1)}
        </code>,
      ];
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return [<em key={key}>{token.slice(1, -1)}</em>];
    }
    if (!token) return [];

    // Linkify any bare URLs inside plain-text chunks.
    const parts = token.split(URL_RE);
    return parts.map((part, j) =>
      URL_RE.test(part) ? (
        <a
          key={`${key}-${j}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:opacity-80 break-all"
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  });
}

function groupBlocks(lines) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: para.join("\n") });
  }
  return blocks;
}

export default function MessageContent({ text }) {
  if (!text) return null;
  const blocks = groupBlocks(String(text).split("\n"));

  return (
    <div className="space-y-2">
      {blocks.map((b, idx) => {
        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1">
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${idx}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1">
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${idx}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="whitespace-pre-wrap">
            {renderInline(b.text, `${idx}`)}
          </p>
        );
      })}
    </div>
  );
}
