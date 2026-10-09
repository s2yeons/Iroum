"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Speaker } from "./icons";
import { useSettings } from "./settings";

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

  const stop = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = rate === "slow" ? 0.8 : 1;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [rate],
  );

  return { speak, stop, speaking, supported };
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
