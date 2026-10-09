import type { Metadata } from "next";
import { ProgramCard } from "@/components/program-card";
import { Disclaimer, Page, TopBar } from "@/components/ui";
import { CHECKED_AT, programs } from "@/lib/welfare";

export const metadata: Metadata = { title: "신청 방법 알아보기" };

export default function BenefitsPage() {
  const sorted = [...programs].sort((a, b) => a.priority - b.priority);
  return (
    <>
      <TopBar backHref="/" title="신청 방법" />
      <Page width="wide">
        <section className="rise">
          <p className="text-[1.05rem] font-bold text-lime-deep">어르신 복지 {sorted.length}가지</p>
          <h1 className="title-xl mt-1 lg:text-[2.2rem]">
            어떤 혜택이 <br className="sm:hidden" />
            궁금하세요?
          </h1>
          <p className="mt-2 text-[1.05rem] text-muted">누르면 준비물과 신청 순서를 알려 드려요.</p>
        </section>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:gap-4 xl:grid-cols-3">
          {sorted.map((p, i) => (
            <ProgramCard key={p.id} p={p} delay={60 + i * 30} />
          ))}
        </ul>
        <Disclaimer checkedAt={CHECKED_AT} />
      </Page>
    </>
  );
}
