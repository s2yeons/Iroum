import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Checklist } from "@/components/checklist";
import { GlossaryText } from "@/components/glossary-text";
import { ShareBar } from "@/components/share-bar";
import { AutoSpeak, SpeakButton } from "@/components/speech";
import { Check, Phone, ProgramIcon } from "@/components/icons";
import { Disclaimer, Page, SectionTitle, TopBar } from "@/components/ui";
import { CHECKED_AT, getProgram, programs } from "@/lib/welfare";

export function generateStaticParams() {
  return programs.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/benefits/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = getProgram(id);
  return { title: p ? p.name : "혜택 안내" };
}

export default function BenefitPage({ params }: PageProps<"/benefits/[id]">) {
  return (
    <Suspense fallback={<TopBar />}>
      <BenefitContent params={params} />
    </Suspense>
  );
}

async function BenefitContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProgram(id);
  if (!p) notFound();

  const o = p.official;
  const speech = [
    `${p.name}.`,
    ...p.easy.summary,
    "준비할 것.",
    ...p.easy.checklist.map((c) => c.text),
    "최종 결정은 주민센터에서 해요.",
  ].join(" ");

  const shareText = [
    `[Iroum 이로움] ${p.name}`,
    ...p.easy.summary,
    "",
    "준비할 것",
    ...p.easy.checklist.map((c) => `☐ ${c.text}`),
    "",
    `신청: ${o.where[0]}`,
    `문의: ${o.contacts.map((c) => `${c.name} ${c.tel}`).join(", ")}`,
    "※ 해당될 수 있어요. 최종 결정은 주민센터에서 해요.",
  ].join("\n");

  return (
    <>
      <TopBar title={p.category} />
      <AutoSpeak text={speech} />
      <Page width="wide">
        {/*
          휴대폰: 한 줄로 order 순서대로 (설명 → 체크리스트 → 공식 기준 → 전화)
          넓은 화면: 왼쪽 설명·공식 기준, 오른쪽 기한·체크리스트·전화
          (두 묶음은 휴대폰에서 display: contents 로 풀려 order가 적용된다)
        */}
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-12">
          <div className="contents lg:block">
            <section className="rise order-1">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-lime-soft lg:h-24 lg:w-24">
                <ProgramIcon id={p.id} className="h-14 w-14 lg:h-16 lg:w-16" />
              </div>
              <span className="chip mt-5">{p.category}</span>
              <h1 className="title-xl mt-2 lg:text-[2.2rem]">{p.name}</h1>
              <p className="mt-2 text-[1.05rem] text-muted lg:text-[1.15rem]">{p.short}</p>
              <div className="mt-5">
                <SpeakButton text={speech} />
              </div>
            </section>

            <section
              className="rise order-3 mt-8 rounded-[1.75rem] bg-lime-soft p-6 lg:p-8"
              style={{ animationDelay: "120ms" }}
            >
              <SectionTitle>쉽게 말하면</SectionTitle>
              <ul className="space-y-3 text-[1.05rem]">
                {p.easy.summary.map((s) => (
                  <li key={s} className="flex gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-lime-ink">
                      <Check className="h-4 w-4" />
                    </span>
                    <span>
                      <GlossaryText text={s} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card order-5 mt-10 lg:p-8">
              <SectionTitle>공식 기준</SectionTitle>
              <p className="-mt-2 mb-2 text-base text-muted">공식 자료의 기준이에요. 색칠된 낱말을 누르면 뜻이 나와요.</p>
              <OfficialList title="누가 해당되나요" items={o.eligibility} />
              <OfficialList title="얼마나, 무엇을 받나요" items={[o.amount]} />
              <OfficialList title="챙길 서류" items={o.documents} />
              <OfficialList title="신청하는 곳" items={o.where} />
              <OfficialList title="알아 두세요" items={o.how} />
            </section>

            <div className="order-8">
              <Disclaimer checkedAt={CHECKED_AT} sources={p.sources} />
            </div>
          </div>

          <aside className="contents lg:block" aria-label="준비하고 신청하기">
            <dl className="rise order-2 mt-6 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:mt-0" style={{ animationDelay: "60ms" }}>
              <div className="card-soft p-4">
                <dt className="text-sm font-bold text-muted">신청 기한</dt>
                <dd className="mt-1 text-base font-extrabold leading-snug">{o.deadline}</dd>
              </div>
              <div className="card-soft p-4">
                <dt className="text-sm font-bold text-muted">물어볼 곳</dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${o.contacts[0].tel}`}
                    className="text-base font-extrabold leading-snug text-lime-deep underline underline-offset-4"
                  >
                    {o.contacts[0].name} {o.contacts[0].tel}
                  </a>
                </dd>
              </div>
            </dl>

            <section className="order-4 mt-10 lg:card lg:mt-6">
              <SectionTitle>준비하고 신청하기</SectionTitle>
              <Checklist
                storageKey={p.id}
                items={p.easy.checklist}
                source={`${p.sources[0].title} (확인일 ${CHECKED_AT})`}
              />
            </section>

            <section className="order-6 mt-10 lg:mt-8">
              <SectionTitle>전화로 물어보기</SectionTitle>
              <ul className="space-y-2">
                {o.contacts.map((c) => (
                  <li key={c.tel}>
                    <a
                      href={`tel:${c.tel}`}
                      className="flex min-h-16 items-center gap-4 rounded-2xl bg-surface px-4 transition-colors hover:bg-surface-strong"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-lime-ink">
                        <Phone className="h-5 w-5" />
                      </span>
                      <span className="flex-1 text-[1.05rem] font-bold">{c.name}</span>
                      <span className="text-[1.05rem] font-extrabold tabular-nums text-lime-deep">{c.tel}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <div className="order-7">
              <ShareBar title={p.name} text={shareText} />
            </div>
          </aside>
        </div>
      </Page>
    </>
  );
}

function OfficialList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-t border-line py-4 first-of-type:border-t-0 last:pb-0">
      <h3 className="text-base font-extrabold text-lime-deep">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-[1.05rem]">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5">
            <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-subtle" />
            <span>
              <GlossaryText text={it} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
