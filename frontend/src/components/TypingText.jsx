import { useEffect, useRef, useState } from "react";

const CHARS_PER_TICK = 3;
const TICK_MS = 12;

export default function TypingText({ text, onTick, onDone }) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setShown(text);
      doneRef.current = true;
      onDone?.();
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i += CHARS_PER_TICK;
      if (i >= text.length) {
        setShown(text);
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      } else {
        setShown(text.slice(0, i));
        onTick?.();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <span className="whitespace-pre-wrap">{shown}</span>;
}