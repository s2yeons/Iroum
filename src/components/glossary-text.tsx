"use client";

import { useId, useState } from "react";
import glossary from "@/data/glossary.json";

// 긴 용어부터 찾아야 "소득인정액"이 "소득"보다 먼저 잡힌다.
const TERMS = [...glossary].sort((a, b) => b.term.length - a.term.length);
const PATTERN = new RegExp(
  `(${TERMS.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);
const MEANING = new Map(glossary.map((g) => [g.term, g.easy]));

/**
 * 행정용어 사전: 글 속 어려운 낱말에 밑줄을 긋고, 누르면 뜻을 보여 준다.
 * extra로 AI가 찾아 준 용어 뜻을 더할 수 있다.
 */
export function GlossaryText({ text, extra }: { text: string; extra?: { term: string; easy: string }[] }) {
  const meanings = extra?.length ? new Map([...MEANING, ...extra.map((e) => [e.term, e.easy] as const)]) : MEANING;
  const pattern = extra?.length
    ? new RegExp(
        `(${[...meanings.keys()]
          .sort((a, b) => b.length - a.length)
          .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")})`,
        "g",
      )
    : PATTERN;

  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        meanings.has(part) ? <Term key={i} term={part} meaning={meanings.get(part)!} /> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

function Term({ term, meaning }: { term: string; meaning: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="inline cursor-pointer rounded-[0.3rem] bg-lime-soft px-px font-bold underline decoration-lime-deep decoration-dotted decoration-2 underline-offset-[5px] hover:bg-lime"
      >
        {term}
      </button>
      {open && (
        <span id={id} role="note" className="rise my-2 block rounded-2xl bg-lime-ink px-4 py-3 text-base font-medium text-white">
          <b className="text-lime">{term}</b> {meaning}
        </span>
      )}
    </>
  );
}
