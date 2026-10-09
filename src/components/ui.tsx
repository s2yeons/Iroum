"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Info, Phone, TextSize } from "./icons";
import { useSettings } from "./settings";

/** 모든 화면 위쪽: 왼쪽 "이전" + 가운데 제목 + 오른쪽 "글씨 크게"(상시 노출) */
export function TopBar({ onBack, backHref, title }: { onBack?: () => void; backHref?: string; title?: string }) {
  const router = useRouter();

  const back = () => {
    if (onBack) return onBack();
    if (backHref) return router.push(backHref);
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto grid max-w-xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={back}
          className="flex min-h-14 items-center gap-0.5 rounded-2xl pl-2 pr-4 text-[1.05rem] font-bold active:bg-surface"
        >
          <ChevronLeft className="h-7 w-7" />
          이전
        </button>
        <p className="truncate text-center text-base font-bold text-muted">{title}</p>
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
      className={`flex min-h-14 items-center gap-1.5 rounded-2xl px-3.5 text-[0.95rem] font-bold transition-colors ${
        largeFont ? "bg-lime text-lime-ink" : "bg-surface text-foreground"
      }`}
    >
      <TextSize className="h-6 w-7" />
      {largeFont ? "보통 글씨" : "글씨 크게"}
    </button>
  );
}

export function Page({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-xl flex-1 px-4 pb-10 pt-4 ${className}`}>{children}</main>;
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
