"use client";

import { useEffect, useState } from "react";
import { load, save } from "@/lib/storage";
import { Check } from "./icons";

type Item = { id: string; text: string };

/** 체크박스 진행 상태는 이 기기(브라우저)에만 저장한다. */
export function Checklist({ storageKey, items, source }: { storageKey: string; items: Item[]; source?: string }) {
  const key = `swb:check:${storageKey}`;
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 진행 상태는 브라우저에서만 읽을 수 있다
    setDone(load<string[]>(key, []));
  }, [key]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      save(key, next);
      return next;
    });
  };

  const count = items.filter((i) => done.includes(i.id)).length;
  const all = count === items.length && items.length > 0;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-strong" aria-hidden="true">
          <div
            className="h-full rounded-full bg-lime-deep transition-[width] duration-500 ease-out"
            style={{ width: `${items.length ? (count / items.length) * 100 : 0}%` }}
          />
        </div>
        <p className="shrink-0 text-base font-extrabold text-lime-deep" aria-live="polite">
          {all ? "다 챙겼어요!" : `${items.length}개 중 ${count}개`}
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const checked = done.includes(item.id);
          return (
            <li key={item.id}>
              <label
                className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl px-4 py-3 text-[1.05rem] transition-colors ${
                  checked ? "bg-lime-soft" : "bg-surface hover:bg-surface-strong"
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="peer sr-only" />
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime-deep ${
                    checked ? "scale-100 bg-lime-deep text-white" : "bg-white text-transparent shadow-[inset_0_0_0_2px_var(--surface-strong)]"
                  }`}
                >
                  <Check className="h-5 w-5" />
                </span>
                <span className={checked ? "font-bold text-lime-ink" : "font-medium"}>{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {source && <p className="mt-3 text-sm text-muted">각 항목 출처: {source}</p>}
    </div>
  );
}
