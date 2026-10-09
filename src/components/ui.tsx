"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Info, Phone, TextSize } from "./icons";
import { Logo } from "./logo";
import { useSettings } from "./settings";

const NAV = [
  { href: "/find", label: "지원금 찾기" },
  { href: "/read", label: "안내문 읽기" },
  { href: "/benefits", label: "신청 방법" },
  { href: "/voice", label: "음성 안내" },
];

/**
 * 모든 화면 위쪽 머리글.
 * - 휴대폰: 왼쪽 큰 "이전" + 가운데 화면 이름 + 오른쪽 "글씨 크게"
 * - 넓은 화면: 로고 + 위 메뉴(지금 화면 표시) + "글씨 크게"
 * 첫 화면은 back 없이 로고만 쓴다.
 */
export function TopBar({
  onBack,
  backHref,
  title,
  back = true,
}: {
  onBack?: () => void;
  backHref?: string;
  title?: string;
  back?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = () => {
    if (onBack) return onBack();
    if (backHref) return router.push(backHref);
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-transparent bg-white/75 backdrop-blur-xl lg:border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:px-6 lg:gap-6 lg:px-8">
        {back && (
          <button
            type="button"
            onClick={goBack}
            className="flex min-h-14 shrink-0 items-center gap-0.5 rounded-2xl pl-2 pr-4 text-[1.05rem] font-bold hover:bg-surface active:bg-surface lg:hidden"
          >
            <ChevronLeft className="h-7 w-7" />
            이전
          </button>
        )}
        <div className={back ? "hidden lg:block" : ""}>
          <Logo />
        </div>
        <p className={`min-w-0 flex-1 truncate text-center text-base font-bold text-muted lg:hidden ${back ? "" : "invisible"}`}>
          {title}
        </p>
        <nav aria-label="주요 메뉴" className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center rounded-xl px-4 text-[0.95rem] font-bold transition-colors ${
                  active ? "bg-lime-soft text-lime-ink" : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <FontToggle />
      </div>
    </header>
  );
}

export function FontToggle() {
  const { largeFont, update } = useSettings();
  return (
    <button
      type="button"
      onClick={() => update({ largeFont: !largeFont })}
      aria-pressed={largeFont}
      aria-label={largeFont ? "글씨 보통으로" : "글씨 크게 보기"}
      className={`flex min-h-14 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl px-3 text-[0.95rem] font-bold transition-colors min-[380px]:px-3.5 ${
        largeFont ? "bg-lime text-lime-ink" : "bg-surface text-foreground"
      }`}
    >
      <TextSize className="h-6 w-7" />
      {/* 아주 좁은 휴대폰에서는 짧게 */}
      <span className="max-[379px]:hidden">{largeFont ? "보통 글씨" : "글씨 크게"}</span>
      <span className="min-[380px]:hidden">{largeFont ? "보통" : "크게"}</span>
    </button>
  );
}

const WIDTH = {
  narrow: "max-w-xl", // 질문·설정처럼 한 가지에 집중하는 화면
  medium: "max-w-4xl",
  wide: "max-w-6xl", // 목록·상세처럼 넓게 펼쳐 보는 화면
};

export function Page({
  children,
  className = "",
  width = "narrow",
}: {
  children: React.ReactNode;
  className?: string;
  width?: keyof typeof WIDTH;
}) {
  return (
    <main className={`mx-auto w-full flex-1 px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pt-10 ${WIDTH[width]} ${className}`}>
      {children}
    </main>
  );
}

/** 표현 원칙: 단정하지 않고, 확인할 곳을 항상 함께 보여 준다. */
export function Disclaimer({ checkedAt, sources }: { checkedAt?: string; sources?: { title: string; url: string }[] }) {
  return (
    <aside className="card-soft mt-10">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lime-deep">
          <Info className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[1.05rem] font-extrabold">해당될 수 있어요</p>
          <p className="mt-0.5 text-base text-muted">최종 결정은 주민센터에서 해요. 궁금하면 언제든 물어보세요.</p>
        </div>
      </div>
      <a href="tel:129" className="btn mt-4 bg-white font-extrabold text-foreground shadow-[0_0_0_1px_var(--line)]">
        <Phone className="h-5 w-5 text-lime-deep" />
        보건복지상담센터 129
      </a>
      {sources && sources.length > 0 && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          출처{" "}
          {sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4">
                {s.title}
              </a>
            </span>
          ))}
          {checkedAt && <> · 확인일 {checkedAt}</>}
        </p>
      )}
      {(!sources || sources.length === 0) && checkedAt && (
        <p className="mt-4 text-sm text-muted">공식 자료 확인일 {checkedAt}</p>
      )}
    </aside>
  );
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="title-lg mb-4 flex items-center gap-2">
      {icon}
      {children}
    </h2>
  );
}
