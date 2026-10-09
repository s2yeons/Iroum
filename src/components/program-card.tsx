import Link from "next/link";
import type { Program } from "@/lib/welfare";
import { ArrowRight, ChevronRight, ProgramIcon } from "./icons";

/**
 * 제도 카드
 * - 보통 휴대폰(380~639px, 한 줄 목록): 아이콘 | 글 | 꺾쇠 가로 배치
 * - 아주 좁은 휴대폰과 태블릿 이상(여러 칸): 아이콘 위, 글 아래 세로 배치
 *   → 긴 제도 이름이 중간에 끊기지 않게 글자에 폭을 다 준다
 */
export function ProgramCard({ p, muted = false, delay }: { p: Program; muted?: boolean; delay?: number }) {
  return (
    <li className={delay !== undefined ? "rise" : undefined} style={delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}>
      <Link
        href={`/benefits/${p.id}`}
        className={`group flex h-full flex-col items-start gap-3 rounded-3xl p-5 transition-[background-color,transform] active:scale-[0.99] min-[380px]:max-sm:flex-row min-[380px]:max-sm:items-center min-[380px]:max-sm:gap-3.5 min-[380px]:max-sm:p-4 min-[380px]:max-sm:pr-3 sm:gap-4 sm:p-6 ${
          muted ? "bg-white shadow-[0_0_0_1px_var(--line)] hover:bg-surface" : "bg-surface hover:bg-surface-strong"
        }`}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_0_0_1px_var(--line)] sm:h-16 sm:w-16">
          <ProgramIcon id={p.id} className="h-10 w-10 sm:h-11 sm:w-11" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="chip">{p.category}</span>
          <span className="mt-1 block text-[1.1rem] font-extrabold leading-snug">{p.name}</span>
          <span className="mt-0.5 block text-base leading-snug text-muted">{p.short}</span>
        </span>
        <ChevronRight className="hidden h-6 w-6 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 min-[380px]:max-sm:block" />
        <span className="inline-flex items-center gap-1 text-base font-bold text-lime-deep min-[380px]:max-sm:hidden">
          자세히 보기 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}
