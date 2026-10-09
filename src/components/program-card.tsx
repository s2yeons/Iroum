import Link from "next/link";
import type { Program } from "@/lib/welfare";
import { ChevronRight, ProgramIcon } from "./icons";

export function ProgramCard({ p, muted = false, delay }: { p: Program; muted?: boolean; delay?: number }) {
  return (
    <li className={delay !== undefined ? "rise" : undefined} style={delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}>
      <Link
        href={`/benefits/${p.id}`}
        className={`group flex items-center gap-4 rounded-3xl p-4 pr-3 transition-[background-color,transform] active:scale-[0.99] ${
          muted ? "bg-white shadow-[0_0_0_1px_var(--line)] hover:bg-surface" : "bg-surface hover:bg-surface-strong"
        }`}
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_0_0_1px_var(--line)]">
          <ProgramIcon id={p.id} className="h-11 w-11" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="chip">{p.category}</span>
          <span className="mt-1 block text-[1.1rem] font-extrabold leading-snug">{p.name}</span>
          <span className="mt-0.5 block text-base leading-snug text-muted">{p.short}</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}
