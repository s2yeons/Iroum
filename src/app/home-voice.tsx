"use client";

import Link from "next/link";
import { IllVoice } from "@/components/icons";
import { useSettings } from "@/components/settings";
import { AutoSpeak, SpeakButton } from "@/components/speech";

const INTRO =
  "받을 수 있는 혜택, 놓치지 않게 도와드릴게요. 지원금 찾기, 안내문 쉽게 읽기, 신청 방법 알아보기, 음성으로 안내받기 중에서 골라 주세요.";

export function HomeVoice() {
  return (
    <>
      <AutoSpeak text={INTRO} />
      <SpeakButton text={INTRO} label="화면 읽어 주세요" />
    </>
  );
}

export function VoiceTile() {
  const { voiceGuide } = useSettings();
  return (
    <Link
      href="/voice"
      className="flex min-h-24 items-center gap-4 rounded-[1.5rem] bg-surface px-5 py-4 transition-[background-color,transform] hover:bg-surface-strong active:scale-[0.99]"
    >
      <IllVoice className="h-14 w-14 shrink-0" />
      <span className="flex-1">
        <span className="block text-[1.1rem] font-extrabold">음성으로 안내받기</span>
        <span className="mt-0.5 block text-[0.85rem] font-medium text-muted">설명을 듣고 따라 해요</span>
      </span>
      <span
        className={`rounded-full px-3 py-1 text-sm font-extrabold ${
          voiceGuide ? "bg-lime text-lime-ink" : "bg-white text-muted shadow-[0_0_0_1px_var(--line)]"
        }`}
      >
        {voiceGuide ? "켜짐" : "꺼짐"}
      </span>
    </Link>
  );
}
