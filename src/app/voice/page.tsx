"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, IllVoice, Mic, Speaker } from "@/components/icons";
import { LISTEN_ERROR_TEXT, useListen, useMicrophones } from "@/components/listen";
import { useSettings } from "@/components/settings";
import { useSpeech } from "@/components/speech";
import { Page, TopBar } from "@/components/ui";

export default function VoicePage() {
  const { voiceGuide, voiceInput, rate, update } = useSettings();
  const { speak, supported } = useSpeech();
  const { supported: listenSupported } = useListen();

  const toggleInput = () => {
    const next = !voiceInput;
    // 말로 대답하려면 질문을 들어야 하므로 음성 안내도 함께 켠다.
    update(next ? { voiceInput: true, voiceGuide: true } : { voiceInput: false });
    speak(
      next
        ? "말로 대답하기를 켰어요. 질문과 선택지를 읽어 드린 뒤, 말씀하시면 골라서 다음으로 넘어가요."
        : "말로 대답하기를 껐어요.",
    );
  };

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

        <button
          type="button"
          role="switch"
          aria-checked={voiceInput}
          onClick={toggleInput}
          disabled={!listenSupported}
          className="card mt-3 flex w-full items-center gap-4 text-left disabled:opacity-50"
        >
          <span className="flex-1">
            <span className="block text-[1.15rem] font-extrabold">말로 대답하기</span>
            <span className="mt-0.5 block text-base text-muted">
              선택지를 듣고 마이크에 말하면 알아서 골라 넘어가요.
            </span>
            <span className={`mt-0.5 block text-base font-bold ${voiceInput ? "text-lime-deep" : "text-muted"}`}>
              {voiceInput ? "켜져 있어요" : "꺼져 있어요"}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`relative h-11 w-[4.5rem] shrink-0 rounded-full transition-colors ${voiceInput ? "bg-lime-deep" : "bg-surface-strong"}`}
          >
            <span
              className={`absolute top-1 h-9 w-9 rounded-full bg-white shadow-md transition-[left] duration-200 ${
                voiceInput ? "left-[calc(100%-2.5rem)]" : "left-1"
              }`}
            />
          </span>
        </button>
        {!listenSupported && (
          <p className="mt-2 text-base font-bold text-warn-ink">
            이 브라우저는 말을 알아듣는 기능이 없어요. 크롬이나 엣지에서 열어 주세요.
          </p>
        )}

        {voiceInput && listenSupported && <MicSetup />}

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

/** USB 마이크 고르기 + 시험해 보기 */
function MicSetup() {
  const { micId, update } = useSettings();
  const { mics, allowed, requestAccess } = useMicrophones();
  const { listen, listening, heard } = useListen();
  const [result, setResult] = useState<string | null>(null);

  const test = async () => {
    setResult(null);
    const r = await listen();
    if (r.ok) setResult(`“${r.alternatives[0]}” 이렇게 들었어요.`);
    else if (r.reason === "silence") setResult("소리가 들리지 않았어요. 마이크를 입 가까이 대고 다시 해 보세요.");
    else if (r.reason !== "aborted") setResult(LISTEN_ERROR_TEXT[r.reason]);
  };

  return (
    <section className="card-soft mt-3">
      <h2 className="text-[1.1rem] font-extrabold">마이크</h2>
      {!allowed ? (
        <>
          <p className="mt-1 text-base text-muted">USB 마이크를 꽂고 아래 버튼을 눌러 마이크 사용을 허락해 주세요.</p>
          <button type="button" onClick={requestAccess} className="btn btn-ghost mt-3">
            <Mic className="h-6 w-6" />
            마이크 찾기
          </button>
        </>
      ) : (
        <>
          <label htmlFor="mic" className="mt-1 block text-base text-muted">
            쓸 마이크를 골라 주세요.
          </label>
          <select
            id="mic"
            value={mics.some((m) => m.deviceId === micId) ? micId : ""}
            onChange={(e) => update({ micId: e.target.value })}
            className="mt-2 min-h-14 w-full rounded-2xl bg-white px-4 text-[1.05rem] font-bold shadow-[0_0_0_1px_var(--line)]"
          >
            <option value="">컴퓨터 기본 마이크</option>
            {mics
              .filter((m) => m.deviceId !== "default" && m.deviceId !== "communications")
              .map((m, i) => (
                <option key={m.deviceId} value={m.deviceId}>
                  {m.label || `마이크 ${i + 1}`}
                </option>
              ))}
          </select>
        </>
      )}

      <button type="button" onClick={test} disabled={listening} className="btn btn-primary mt-3">
        <Mic className="h-6 w-6" />
        {listening ? "듣고 있어요. 아무 말이나 해 보세요" : "마이크 시험하기"}
      </button>
      {(listening ? heard : result) && (
        <p aria-live="polite" className="mt-3 text-[1.05rem] font-bold">
          {listening ? heard : result}
        </p>
      )}
      <p className="mt-3 text-sm text-muted">
        고른 마이크가 안 되면 컴퓨터 설정의 ‘소리 → 입력’에서 USB 마이크를 기본으로 정해 주세요. 크롬은 알아듣기 위해
        목소리를 구글 서버로 보내요.
      </p>
    </section>
  );
}
