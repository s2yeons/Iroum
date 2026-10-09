import Link from "next/link";
import { ArrowRight, Building, IllChecklist, IllCoins, IllDocument, Lock, Shield } from "@/components/icons";
import { InstallCard } from "@/components/pwa";
import { TopBar } from "@/components/ui";
import { HomeVoice, VoiceTile } from "./home-voice";

const TRUST = [
  { icon: <Shield className="h-6 w-6" />, title: "공식 자료로만 안내해요", sub: "복지로·정부 자료와 확인한 날짜를 함께 보여 드려요." },
  { icon: <Lock className="h-6 w-6" />, title: "내 정보는 이 기기에만", sub: "나이·가족 정보는 서버로 보내지 않아요." },
  { icon: <Building className="h-6 w-6" />, title: "최종 결정은 주민센터에서", sub: "모르는 건 129에 물어보면 돼요." },
];

export default function Home() {
  return (
    <>
      <TopBar back={false} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-14">
        {/* 첫 화면: 휴대폰은 위아래, 넓은 화면은 좌우 두 칸 */}
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14">
          <section className="rise">
            <p className="text-[1.05rem] font-bold text-lime-deep">어르신 복지 도우미</p>
            <h1 className="title-xl mt-1 lg:text-[2.4rem] lg:leading-[1.25]">
              받을 수 있는 혜택,
              <br />
              놓치지 않게 도와드릴게요
            </h1>
            <p className="mt-3 hidden max-w-md text-[1.1rem] text-muted sm:block">
              어려운 안내문은 쉬운 말로, 준비할 서류는 체크리스트로. 큰 글씨와 음성으로 천천히 알려 드려요.
            </p>
            <div className="mt-5">
              <HomeVoice />
            </div>
          </section>

          {/* 대표 기능: 지원금 찾기 */}
          <Link
            href="/find"
            className="rise group relative block overflow-hidden rounded-[1.75rem] bg-lime p-6 text-lime-ink transition-transform active:scale-[0.99] sm:p-8 lg:p-10"
            style={{ animationDelay: "60ms" }}
          >
            <Decor />
            <span className="relative inline-flex rounded-full bg-white/70 px-3 py-0.5 text-sm font-extrabold">
              질문 5개면 끝나요
            </span>
            <span className="relative mt-3 block text-[1.4rem] font-extrabold leading-snug min-[400px]:pr-28 sm:text-[1.6rem] lg:text-[1.8rem]">
              받을 수 있는
              <br />
              지원금 찾기
            </span>
            <span className="relative mt-1 block text-base font-medium min-[400px]:pr-28">나에게 맞는 혜택을 알려 드려요</span>
            <span className="relative mt-5 inline-flex min-h-14 items-center gap-2 rounded-full bg-lime-ink py-3 pl-6 pr-5 text-[1.05rem] font-extrabold text-white transition-transform group-hover:translate-x-0.5 lg:mt-8">
              시작하기 <ArrowRight className="h-5 w-5" />
            </span>
            <IllCoins className="absolute right-4 top-14 hidden h-28 w-28 drop-shadow-[0_8px_16px_rgba(27,42,6,0.18)] min-[400px]:block sm:right-8 sm:top-12 sm:h-36 sm:w-36 lg:bottom-10 lg:right-10 lg:top-auto lg:h-44 lg:w-44" />
          </Link>
        </div>

        {/* 다른 기능: 휴대폰 2칸 + 1칸, 넓은 화면 3칸 */}
        <div className="rise mt-3 grid grid-cols-2 gap-3 lg:mt-6 lg:grid-cols-3 lg:gap-5" style={{ animationDelay: "120ms" }}>
          <Tile href="/read" icon={<IllDocument className="h-14 w-14" />} title="안내문 쉽게 읽기" sub="어려운 문서를 쉬운 말로" />
          <Tile href="/benefits" icon={<IllChecklist className="h-14 w-14" />} title="신청 방법 알아보기" sub="준비물과 순서 확인" />
          <div className="col-span-2 lg:col-span-1">
            <VoiceTile />
          </div>
        </div>

        <section className="mt-12 lg:mt-20" aria-labelledby="trust">
          <h2 id="trust" className="title-lg lg:text-center lg:text-[1.5rem]">
            믿고 쓸 수 있게 만들었어요
          </h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-3 sm:gap-4 lg:mt-8 lg:gap-5">
            {TRUST.map((t) => (
              <li key={t.title} className="flex items-start gap-4 sm:flex-col sm:rounded-3xl sm:bg-surface sm:p-5 lg:p-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-soft text-lime-deep sm:bg-white">
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

        <div className="mx-auto max-w-2xl">
          <InstallCard />
        </div>
      </main>
    </>
  );
}

function Tile({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex h-full min-h-44 flex-col justify-between rounded-3xl bg-surface p-5 transition-[background-color,transform] hover:bg-surface-strong active:scale-[0.98] lg:min-h-52 lg:p-7"
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
    <svg className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-white/35 lg:h-96 lg:w-96" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="46" fill="currentColor" />
    </svg>
  );
}
