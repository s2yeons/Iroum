"use client";

import { useState } from "react";
import { Printer, Share } from "./icons";

/** 결과 공유·인쇄: 큰 글씨로 인쇄하거나 가족에게 문자로 보내기 */
export function ShareBar({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // 사용자가 취소한 경우 등: 아래 복사로 넘어가지 않고 그냥 끝낸다.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
    }
  };

  return (
    <div className="no-print mt-6 grid grid-cols-2 gap-3">
      <button type="button" onClick={() => window.print()} className="btn btn-secondary min-h-16 flex-col gap-1 py-3">
        <Printer className="h-6 w-6 text-lime-deep" />
        크게 인쇄하기
      </button>
      <button type="button" onClick={share} className="btn btn-secondary min-h-16 flex-col gap-1 py-3">
        <Share className="h-6 w-6 text-lime-deep" />
        {copied ? "복사했어요" : "가족에게 보내기"}
      </button>
    </div>
  );
}
