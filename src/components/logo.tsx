import Link from "next/link";

/**
 * Iroum(이로움) 마크: 소문자 i의 줄기가 그대로 체크 표시로 이어진다.
 * "나에게 이로운 것을, 확인까지" — 파비콘·앱 아이콘·공유 이미지에 같은 모양을 쓴다.
 */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="10.5" fill="var(--lime, #b8f34a)" />
      <circle cx="12.5" cy="10" r="3" fill="var(--lime-ink, #1b2a06)" />
      <path
        d="M12.5 16.5V26.5L27.5 11.5"
        fill="none"
        stroke="var(--lime-ink, #1b2a06)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex min-h-14 items-center gap-2.5 pr-2" aria-label="Iroum 처음 화면">
      <BrandMark />
      <span className="text-[1.25rem] font-extrabold tracking-[-0.03em]">Iroum</span>
    </Link>
  );
}
