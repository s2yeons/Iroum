"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BrandMark } from "./logo";
import { Info, Share } from "./icons";

/** 서비스 워커 등록 — 개발 중에는 화면이 옛것으로 보이지 않게 배포판에서만 켠다. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

/* ── 인터넷 연결 상태 ─────────────────────────── */

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/** 인터넷이 끊기면 화면 위에 알려 준다. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="no-print sticky top-0 z-40 flex items-center gap-2 bg-lime-ink px-4 py-3 text-base font-bold text-white">
      <Info className="h-5 w-5 shrink-0 text-lime" />
      인터넷이 끊겼어요. 저장해 둔 화면을 보여 드려요.
    </div>
  );
}

/* ── 홈 화면에 추가하기 ─────────────────────────── */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

/**
 * 첫 화면 아래 "홈 화면에 추가" 안내.
 * - 안드로이드(크롬 등): 버튼 한 번으로 설치
 * - 아이폰(사파리): 설치 버튼이 없어서 순서를 그림처럼 알려 준다
 * - 이미 앱으로 열었으면 보이지 않는다
 */
export function InstallCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 기기 종류는 브라우저에서만 알 수 있다
    if (isIos()) setMode("ios");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => setDone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  if (done) {
    return (
      <p className="card-soft mt-10 text-[1.05rem] font-bold text-lime-deep">
        홈 화면에 Iroum을 추가했어요. 이제 아이콘을 눌러 바로 열 수 있어요.
      </p>
    );
  }

  return (
    <section className="card mt-10" aria-labelledby="install-title">
      <div className="flex items-center gap-4">
        <BrandMark className="h-14 w-14 shrink-0" />
        <div>
          <h2 id="install-title" className="text-[1.1rem] font-extrabold">
            홈 화면에 추가하기
          </h2>
          <p className="mt-0.5 text-base text-muted">앱처럼 아이콘을 눌러 바로 열 수 있어요. 인터넷이 없어도 안내를 볼 수 있어요.</p>
        </div>
      </div>

      {mode === "android" && deferred && (
        <button
          type="button"
          className="btn btn-primary mt-5"
          onClick={async () => {
            await deferred.prompt();
            const { outcome } = await deferred.userChoice;
            if (outcome === "accepted") setDone(true);
            setDeferred(null);
          }}
        >
          홈 화면에 추가
        </button>
      )}

      {mode === "ios" && (
        <ol className="mt-5 space-y-3 text-[1.05rem]">
          <li className="flex items-center gap-3">
            <Step n={1} />
            <span>
              화면 아래 <Share className="mx-0.5 inline h-6 w-6 align-[-5px] text-lime-deep" /> <b>공유</b> 버튼을 눌러요
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={2} />
            <span>
              <b>홈 화면에 추가</b>를 골라요
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={3} />
            <span>
              오른쪽 위 <b>추가</b>를 눌러요
            </span>
          </li>
        </ol>
      )}
    </section>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime font-extrabold text-lime-ink">
      {n}
    </span>
  );
}
