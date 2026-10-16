"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Speaker } from "./icons";
import { useSettings } from "./settings";

/** "30~50대"를 "30 물결표 50대"로 읽지 않게 "30에서 50대"로 바꾼다. */
export function toSpoken(text: string) {
  return text.replace(/\s*~\s*/g, "에서 ");
}

/** 다 읽었으면 "ok", 브라우저가 소리를 막았으면(화면을 아직 안 누름) "blocked" */
export type SayResult = "ok" | "blocked";

/** 브라우저 내장 음성(Web Speech API). 비용 없음. */
export function useSpeech() {
  const { rate } = useSettings();
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 기능 확인
      setSupported(false);
      return;
    }
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = voices.find((v) => v.lang === "ko-KR") ?? voices.find((v) => v.lang.startsWith("ko")) ?? null;
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, []);

  // 크롬은 참조가 없는 발화를 지워 onend 를 놓치기도 해서 붙잡아 둔다.
  const currentRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    currentRef.current = null; // 잠깐 쉬었다 읽으려던 말도 취소
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: (result: SayResult) => void) => {
      if (!("speechSynthesis" in window)) {
        onEnd?.("ok");
        return;
      }
      const synth = window.speechSynthesis;
      const busy = synth.speaking || synth.pending;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(toSpoken(text));
      u.lang = "ko-KR";
      if (voiceRef.current) u.voice = voiceRef.current;
      // 어르신이 듣기 편하게 기본보다 느리게 읽는다.
      u.rate = rate === "slow" ? 0.7 : 0.85;
      const done = (result: SayResult) => {
        if (currentRef.current === u) {
          currentRef.current = null;
          setSpeaking(false);
        }
        onEnd?.(result);
      };
      u.onend = () => done("ok");
      u.onerror = (e) => done(e.error === "not-allowed" ? "blocked" : "ok");
      currentRef.current = u;
      setSpeaking(true);
      // 크롬은 끊자마자 새로 읽으면 그 말을 빠뜨리기도 해서 잠깐 쉬었다 읽는다.
      if (busy) setTimeout(() => currentRef.current === u && synth.speak(u), 120);
      else synth.speak(u);
    },
    [rate],
  );

  /** 다 읽을 때까지 기다린다. onend 가 오지 않는 브라우저를 위해 시간 제한을 둔다. */
  const say = useCallback(
    (text: string) =>
      new Promise<SayResult>((resolve) => {
        let finished = false;
        const finish = (result: SayResult = "ok") => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          resolve(result);
        };
        const timer = setTimeout(() => finish(), 3000 + text.length * (rate === "slow" ? 380 : 310));
        speak(text, finish);
      }),
    [speak, rate],
  );

  return { speak, say, stop, speaking, supported };
}

/** "읽어 주세요" 버튼 */
export function SpeakButton({
  text,
  label = "읽어 주세요",
  block = false,
}: {
  text: string;
  label?: string;
  block?: boolean;
}) {
  const { speak, stop, speaking, supported } = useSpeech();
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(text))}
      aria-pressed={speaking}
      className={`no-print inline-flex min-h-14 items-center gap-3 rounded-full py-2 pl-2 pr-6 text-[1.05rem] font-bold transition-colors ${
        block ? "w-full justify-center" : ""
      } ${speaking ? "bg-lime-ink text-white" : "bg-surface text-foreground hover:bg-surface-strong"}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-lime-ink">
        {speaking ? <SoundBars /> : <Speaker className="h-6 w-6" />}
      </span>
      {speaking ? "그만 읽기" : label}
    </button>
  );
}

function SoundBars() {
  return (
    <span className="flex h-5 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-lime-ink motion-safe:animate-[bars_0.9s_ease-in-out_infinite]"
          style={{ height: "100%", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

/** 음성 안내가 켜져 있으면 화면이 바뀔 때 자동으로 읽어 준다. */
export function AutoSpeak({ text }: { text: string }) {
  const { voiceGuide, ready } = useSettings();
  const { speak, stop } = useSpeech();
  useEffect(() => {
    if (!ready || !voiceGuide) return;
    // 음성 목록이 늦게 준비되는 브라우저가 있어 조금 기다린다.
    const t = setTimeout(() => speak(text), 300);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, [text, voiceGuide, ready, speak, stop]);
  return null;
}
