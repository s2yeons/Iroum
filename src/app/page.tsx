import Link from "next/link";
import { ArrowRight, Building, IllChecklist, IllCoins, IllDocument, Lock, Shield } from "@/components/icons";
import { Logo } from "@/components/logo";
import { InstallCard } from "@/components/pwa";
import { FontToggle } from "@/components/ui";
import { HomeVoice, VoiceTile } from "./home-voice";

const TRUST = [
  { icon: <Shield className="h-6 w-6" />, title: "공식 자료로만 안내해요", sub: "복지로·정부 자료와 확인한 날짜를 함께 보여 드려요." },
  { icon: <Lock className="h-6 w-6" />, title: "내 정보는 이 기기에만", sub: "나이·가족 정보는 서버로 보내지 않아요." },
  { icon: <Building className="h-6 w-6" />, title: "최종 결정은 주민센터에서", sub: "모르는 건 129에 물어보면 돼요." },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2">
          <Logo />
          <FontToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-14 pt-6">
        <section className="rise">
          <p className="text-[1.05rem] font-bold text-lime-deep">어르신 복지 도우미</p>
          <h1 className="title-xl mt-1">
            받을 수 있는 혜택,
            <br />
            놓치지 않게 도와드릴게요
          </h1>
          <div className="mt-5">
            <HomeVoice />
          </div>
        </section>

        {/* 대표 기능: 지원금 찾기 */}
        <Link
          href="/find"
          className="rise group relative mt-7 block overflow-hidden rounded-[1.75rem] bg-lime p-6 text-lime-ink transition-transform active:scale-[0.99]"
          style={{ animationDelay: "60ms" }}
        >
          <Decor />
          <span className="relative inline-flex rounded-full bg-white/70 px-3 py-0.5 text-sm font-extrabold">
            질문 5개면 끝나요
          </span>
          <span className="relative mt-3 block pr-24 text-[1.4rem] font-extrabold leading-snug">
            받을 수 있는
            <br />
            지원금 찾기
          </span>
          <span className="relative mt-1 block pr-24 text-base font-medium">나에게 맞는 혜택을 알려 드려요</span>
          <span className="relative mt-5 inline-flex min-h-14 items-center gap-2 rounded-full bg-lime-ink py-3 pl-6 pr-5 text-[1.05rem] font-extrabold text-white transition-transform group-hover:translate-x-0.5">
            시작하기 <ArrowRight className="h-5 w-5" />
          </span>
          <IllCoins className="absolute right-4 top-14 h-28 w-28 drop-shadow-[0_8px_16px_rgba(27,42,6,0.18)]" />
        </Link>

        <div className="rise mt-3 grid grid-cols-2 gap-3" style={{ animationDelay: "120ms" }}>
          <Tile href="/read" icon={<IllDocument className="h-14 w-14" />} title="안내문 쉽게 읽기" sub="어려운 문서를 쉬운 말로" />
          <Tile href="/benefits" icon={<IllChecklist className="h-14 w-14" />} title="신청 방법 알아보기" sub="준비물과 순서 확인" />
        </div>
        <div className="rise mt-3" style={{ animationDelay: "180ms" }}>
          <VoiceTile />
        </div>

        <section className="mt-12" aria-labelledby="trust">
          <h2 id="trust" className="title-lg">
            믿고 쓸 수 있게 만들었어요
          </h2>
          <ul className="mt-4 space-y-5">
            {TRUST.map((t) => (
              <li key={t.title} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-soft text-lime-deep">
                  {t.icon}
                </span>
                <span>
                  <span className="block text-[1.05rem] font-extrabold">{t.title}</span>
                  <span className="mt-0.5 block text-base text-muted">{t.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <InstallCard />

        <a
          href="tel:129"
          className="mt-10 flex items-center justify-between rounded-3xl bg-surface px-6 py-5 transition-colors hover:bg-surface-strong"
        >
          <span>
            <span className="block text-base text-muted">혼자 하기 어려우면</span>
            <span className="block text-[1.15rem] font-extrabold">보건복지상담센터 129</span>
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-base font-extrabold text-lime-deep shadow-[0_0_0_1px_var(--line)]">
            전화하기
          </span>
        </a>
      </main>
    </>
  );
}

function Tile({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-44 flex-col justify-between rounded-[1.5rem] bg-surface p-5 transition-[background-color,transform] hover:bg-surface-strong active:scale-[0.98]"
    >
      {icon}
      <span className="mt-4 block">
        <span className="block text-[1.1rem] font-extrabold leading-snug">{title}</span>
        <span className="mt-1 block text-[0.85rem] font-medium text-muted">{sub}</span>
      </span>
    </Link>
  );
}

/** 대표 카드 배경 장식 — 은은한 동심원 */
function Decor() {
  return (
    <svg className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-white/35" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="46" fill="currentColor" />
    </svg>
  );
}
