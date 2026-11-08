"use client";

import { useEffect, useState } from "react";

/** Effet machine à écrire, comme sur le site vitrine. */
export function TypedWord({ words }: { words: string[] }) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let len = words[0].length;
    let deleting = true;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (deleting) {
        len--;
        if (len === 0) {
          deleting = false;
          i = (i + 1) % words.length;
        }
      } else {
        len++;
      }
      setText(words[i].slice(0, len) || "​");
      let delay = deleting ? 55 : 95;
      if (!deleting && len === words[i].length) {
        deleting = true;
        delay = 1800;
      }
      t = setTimeout(tick, delay);
    };
    t = setTimeout(tick, 2200);
    return () => clearTimeout(t);
  }, [words]);
  return <span className="typed-cursor italic text-accent-ink">{text}</span>;
}
