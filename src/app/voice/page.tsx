"use client";

import Link from "next/link";
import { ArrowRight, IllVoice, Speaker } from "@/components/icons";
import { useSettings } from "@/components/settings";
import { useSpeech } from "@/components/speech";
import { Page, TopBar } from "@/components/ui";

export default function VoicePage() {
  const { voiceGuide, rate, update } = useSettings();
  const { speak, supported } = useSpeech();

  const toggle = () => {
    const next = !voiceGuide;
    update({ voiceGuide: next });
    speak(next ? "음성 안내를 켰어요. 이제 화면을 읽어 드릴게요." : "음성 안내를 껐어요.");
  };

  return (
    <>
      <TopBar backHref="/" title="음성 안내" />
      <Page>
        <section className="rise flex flex-col items-center pt-4 text-center">
          <div className="relative">
            <span
              className={`absolute inset-0 rounded-full bg-lime ${voiceGuide ? "motion-safe:animate-ping" : "hidden"}`}
              style={{ animationDuration: "2s" }}
              aria-hidden="true"
            />
            <IllVoice className="relative h-28 w-28" />
          </div>
          <h1 className="title-xl mt-6">듣기만 하면 돼요</h1>
          <p className="mt-2 text-[1.05rem] text-muted">
            음성 안내를 켜면 화면이 바뀔 때마다
            <br />
            질문과 결과를 소리 내어 읽어 드려요.
          </p>
        </section>

        {!supported && (
          <p role="alert" className="mt-6 rounded-2xl bg-warn-bg p-4 text-[1.05rem] font-bold text-warn-ink">
            이 브라우저는 소리 내어 읽기를 지원하지 않아요. 크롬이나 사파리에서 열어 주세요.
          </p>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={voiceGuide}
          onClick={toggle}
          className="card mt-8 flex w-full items-center gap-4 text-left"
        >
          <span className="flex-1">
            <span className="block text-[1.15rem] font-extrabold">음성 안내</span>
            <span className={`mt-0.5 block text-base font-bold ${voiceGuide ? "text-lime-deep" : "text-muted"}`}>
              {voiceGuide ? "켜져 있어요" : "꺼져 있어요"}
            </span>
          </span>
          {/* 큰 토글 스위치 */}
          <span
            aria-hidden="true"
            className={`relative h-11 w-[4.5rem] shrink-0 rounded-full transition-colors ${voiceGuide ? "bg-lime-deep" : "bg-surface-strong"}`}
          >
            <span
              className={`absolute top-1 h-9 w-9 rounded-full bg-white shadow-md transition-[left] duration-200 ${
                voiceGuide ? "left-[calc(100%-2.5rem)]" : "left-1"
              }`}
            />
          </span>
        </button>

        <section className="mt-8">
          <h2 className="title-lg">읽는 빠르기</h2>
          <div role="radiogroup" aria-label="읽는 빠르기" className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1.5">
            {(
              [
                ["slow", "천천히"],
                ["normal", "보통"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rate === value}
                onClick={() => update({ rate: value })}
                className={`min-h-14 rounded-xl text-[1.05rem] font-bold transition-all ${
                  rate === value ? "bg-white text-foreground shadow-[0_2px_8px_rgba(25,31,40,0.1)]" : "text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => speak("안녕하세요. 이로움입니다. 이 빠르기로 읽어 드릴게요.")}
            className="btn btn-ghost mt-2"
          >
            <Speaker className="h-6 w-6" />이 빠르기로 들어 보기
          </button>
        </section>

        <div className="bottom-cta mt-8">
          <Link href="/find" className="btn btn-primary">
            음성으로 지원금 찾기 <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </Page>
    </>
  );
}
