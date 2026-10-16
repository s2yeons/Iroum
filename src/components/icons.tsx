// Iroum 아이콘 — 라임 면 + 진한 선의 듀오톤. 모두 장식용이므로 aria-hidden.

type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/* ── 작은 UI 아이콘 (24) ───────────────────────── */

export const ChevronLeft = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.5}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const ChevronRight = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.5}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const ArrowRight = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.5}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Check = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={3}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const Speaker = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z" fill="currentColor" stroke="none" />
    <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const Mic = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>
);

export const Stop = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
  </svg>
);

export const Phone = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
  </svg>
);

export const Info = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5v.5" />
  </svg>
);

export const Shield = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Lock = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const Building = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-4h4v4M9.5 11h.01M14.5 11h.01" />
  </svg>
);

export const Printer = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2" />
    <rect x="7" y="14" width="10" height="6" rx="1" />
  </svg>
);

export const Share = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);

export const Refresh = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />
  </svg>
);

export const Alert = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4.5M12 17.2v.3" />
  </svg>
);

export const TextSize = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <text x="1" y="19" fontSize="17" fontWeight="800" fill="currentColor" fontFamily="inherit">가</text>
    <text x="15" y="19" fontSize="10" fontWeight="800" fill="currentColor" fontFamily="inherit">가</text>
  </svg>
);

/* ── 일러스트 아이콘 (48) — 라임 면 + 진한 선 ─────────── */

const ill = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "var(--lime-ink)",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IllCoins = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <ellipse cx="20" cy="33" rx="12" ry="5" fill="#fff" />
    <path d="M8 33v-5c0 2.8 5.4 5 12 5s12-2.2 12-5v5c0 2.8-5.4 5-12 5S8 35.8 8 33Z" fill="#fff" />
    <ellipse cx="20" cy="23" rx="12" ry="5" fill="#fff" />
    <path d="M8 23v5c0 2.8 5.4 5 12 5s12-2.2 12-5v-5" />
    <circle cx="32" cy="15" r="9" fill="var(--lime)" />
    <path d="m28 11.5 2 7 2-5 2 5 2-7M27.5 15h9" strokeWidth="1.7" />
  </svg>
);

export const IllDocument = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <path d="M12 6h16l10 10v24a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="#fff" />
    <path d="M28 6v10h10" />
    <path d="M16 24h16M16 30h10" />
    <circle cx="34" cy="35" r="8" fill="var(--lime)" />
    <path d="m31 35 2.2 2.2 4-4.2" />
  </svg>
);

export const IllChecklist = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <rect x="9" y="7" width="30" height="36" rx="4" fill="#fff" />
    <rect x="17" y="4" width="14" height="7" rx="2.5" fill="var(--lime)" />
    <rect x="14" y="18" width="6" height="6" rx="1.5" fill="var(--lime)" />
    <path d="m15.5 21 1.3 1.3 2.2-2.6" strokeWidth="1.8" />
    <path d="M24 21h10M24 32h10" />
    <rect x="14" y="29" width="6" height="6" rx="1.5" />
  </svg>
);

export const IllVoice = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <circle cx="24" cy="24" r="17" fill="var(--lime)" />
    <path d="M13 21v6h5l7 6V15l-7 6h-5Z" fill="#fff" />
    <path d="M30 19.5a6 6 0 0 1 0 9M33.5 16a11 11 0 0 1 0 16" />
  </svg>
);

export const IllCamera = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <rect x="6" y="14" width="36" height="26" rx="5" fill="#fff" />
    <path d="M17 14l3-5h8l3 5" />
    <circle cx="24" cy="27" r="8" fill="var(--lime)" />
    <circle cx="24" cy="27" r="3.5" />
  </svg>
);

export const IllFile = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <path d="M12 6h16l10 10v24a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="#fff" />
    <path d="M28 6v10h10" />
    <rect x="8" y="24" width="22" height="11" rx="3" fill="var(--lime)" />
    <text x="19" y="32.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--lime-ink)" stroke="none" fontFamily="inherit">PDF</text>
  </svg>
);

export const IllPaste = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <rect x="9" y="8" width="24" height="30" rx="4" fill="#fff" />
    <path d="M15 17h12M15 23h12M15 29h7" />
    <rect x="21" y="20" width="20" height="22" rx="4" fill="var(--lime)" />
    <path d="M26 28h10M26 34h6" />
  </svg>
);

export const IllSearch = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <circle cx="21" cy="21" r="12" fill="var(--lime)" />
    <path d="m30 30 10 10" strokeWidth="4" />
    <path d="M15.5 21.5 19 25l7-7.5" />
  </svg>
);

/* ── 제도별 아이콘 ─────────────────────────── */

const ProgramGlyphs: Record<string, React.ReactNode> = {
  "basic-pension": (
    <>
      <rect x="8" y="14" width="32" height="22" rx="4" fill="#fff" />
      <circle cx="24" cy="25" r="5.5" fill="var(--lime)" />
      <path d="M8 20h4M36 30h4" />
    </>
  ),
  "senior-care": (
    <>
      <path d="M24 39s-13-7.6-13-17a7 7 0 0 1 13-3.6A7 7 0 0 1 37 22c0 9.4-13 17-13 17Z" fill="var(--lime)" />
      <path d="M17 25h4l2-4 3 7 2-3h3" strokeWidth="2" />
    </>
  ),
  "energy-voucher": (
    <>
      <path d="M24 7c2 6 10 10 10 19a10 10 0 0 1-20 0c0-4 2-6 4-8 0 3 1.5 5 3.5 5C21 18 22 12 24 7Z" fill="var(--lime)" />
      <path d="M24 38a4.5 4.5 0 0 1-4.5-4.5c0-3 2.5-4.5 4.5-7.5 2 3 4.5 4.5 4.5 7.5A4.5 4.5 0 0 1 24 38Z" fill="#fff" />
    </>
  ),
  "long-term-care": (
    <>
      <path d="M9 22 24 9l15 13" />
      <path d="M13 19v19h22V19" fill="#fff" />
      <rect x="18" y="23" width="12" height="12" rx="3" fill="var(--lime)" />
      <path d="M24 26v6M21 29h6" strokeWidth="2.6" />
    </>
  ),
  "senior-jobs": (
    <>
      <rect x="7" y="16" width="34" height="23" rx="4" fill="#fff" />
      <path d="M18 16v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
      <path d="M7 25h34" />
      <rect x="20" y="22" width="8" height="6" rx="1.5" fill="var(--lime)" />
    </>
  ),
  "livelihood-benefit": (
    <>
      <path d="M10 22h28l-3 15a3 3 0 0 1-3 2.5H16a3 3 0 0 1-3-2.5L10 22Z" fill="var(--lime)" />
      <path d="M16 22c0-5 3.6-9 8-9s8 4 8 9" />
      <path d="M8 22h32" />
    </>
  ),
  "medical-aid": (
    <>
      <rect x="9" y="9" width="30" height="30" rx="8" fill="var(--lime)" />
      <path d="M24 16v16M16 24h16" strokeWidth="3.4" />
    </>
  ),
  "housing-benefit": (
    <>
      <path d="M8 22 24 9l16 13" />
      <path d="M12 19v19h24V19" fill="var(--lime)" />
      <rect x="20" y="27" width="8" height="11" rx="1.5" fill="#fff" />
    </>
  ),
  "emergency-welfare": (
    <>
      <circle cx="24" cy="24" r="15" fill="var(--lime)" />
      <path d="M24 15v11" strokeWidth="3.4" />
      <path d="M24 32v.5" strokeWidth="3.6" />
    </>
  ),
  "telecom-discount": (
    <>
      <rect x="14" y="6" width="20" height="36" rx="5" fill="#fff" />
      <path d="M21 37h6" />
      <circle cx="31" cy="20" r="8" fill="var(--lime)" />
      <path d="m28 23 6-6M28.5 17.5h.01M33.5 22.5h.01" strokeWidth="2.6" />
    </>
  ),
  "dementia-screening": (
    <>
      <path d="M19 9a7 7 0 0 0-7 7 6 6 0 0 0-3 11 7 7 0 0 0 7 9h3V9Z" fill="var(--lime)" />
      <path d="M29 9a7 7 0 0 1 7 7 6 6 0 0 1 3 11 7 7 0 0 1-7 9h-3V9Z" fill="#fff" />
      <path d="M19 9h10v27H19" />
      <path d="M24 9v27" />
    </>
  ),
  "flu-vaccine": (
    <>
      <path d="m30 8 10 10M35 13l-4 4" />
      <path d="M31 17 15 33l-5 1 1-5 16-16 4 4Z" fill="var(--lime)" />
      <path d="m19 25 3 3M23 21l3 3M8 40l3-3" />
    </>
  ),
};

export function ProgramIcon({ id, className = "h-12 w-12" }: { id: string; className?: string }) {
  return (
    <svg {...ill} className={className}>
      {ProgramGlyphs[id] ?? <circle cx="24" cy="24" r="14" fill="var(--lime)" />}
    </svg>
  );
}

/* ── 질문 머리 그림 / 선택지 그림 ─────────────────── */

export const IllCalendar = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <rect x="7" y="10" width="34" height="30" rx="5" fill="#fff" />
    <path d="M7 19h34" />
    <rect x="7" y="10" width="34" height="9" rx="4" fill="var(--lime)" />
    <path d="M16 6v8M32 6v8" />
    <circle cx="17" cy="27" r="1.6" fill="var(--lime-ink)" />
    <circle cx="24" cy="27" r="1.6" fill="var(--lime-ink)" />
    <rect x="28.5" y="30" width="7" height="6" rx="1.5" fill="var(--lime)" />
  </svg>
);

export const IllPin = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <ellipse cx="24" cy="40" rx="11" ry="3.5" fill="var(--lime-soft)" />
    <path d="M24 40s-12-11-12-20a12 12 0 0 1 24 0c0 9-12 20-12 20Z" fill="var(--lime)" />
    <circle cx="24" cy="20" r="4.5" fill="#fff" />
  </svg>
);

export const IllHome = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <path d="M7 22 24 8l17 14" />
    <path d="M11 19v20h26V19" fill="#fff" />
    <circle cx="20" cy="26" r="3" fill="var(--lime)" />
    <circle cx="29" cy="27" r="2.5" fill="var(--lime)" />
    <path d="M15 39v-4a5 5 0 0 1 10 0v4M25.5 39v-3a3.5 3.5 0 0 1 7 0v3" fill="var(--lime)" />
  </svg>
);

export const IllWallet = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <path d="M10 16 30 8l3 8" fill="var(--lime)" />
    <rect x="7" y="16" width="34" height="24" rx="5" fill="#fff" />
    <rect x="28" y="23" width="13" height="10" rx="3" fill="var(--lime)" />
    <circle cx="33" cy="28" r="1.6" fill="var(--lime-ink)" />
  </svg>
);

export const IllBadge = ({ className = "h-12 w-12" }: P) => (
  <svg {...ill} className={className}>
    <rect x="9" y="7" width="30" height="36" rx="5" fill="#fff" />
    <circle cx="24" cy="21" r="7" fill="var(--lime)" />
    <path d="m21 21 2.2 2.2 4-4.2" strokeWidth="2" />
    <path d="M16 33h16M19 38h10" />
  </svg>
);

/* 선택지 그림 (40) */
const opt = { ...ill, strokeWidth: 2.2 };

export const OptOne = ({ className = "h-10 w-10" }: P) => (
  <svg {...opt} className={className}>
    <circle cx="24" cy="17" r="7" fill="var(--lime)" />
    <path d="M12 40c0-7 5.4-12 12-12s12 5 12 12" fill="#fff" />
  </svg>
);

export const OptTwo = ({ className = "h-10 w-10" }: P) => (
  <svg {...opt} className={className}>
    <circle cx="17" cy="17" r="6" fill="var(--lime)" />
    <circle cx="31" cy="17" r="6" fill="#fff" />
    <path d="M6 40c0-6.5 4.9-11 11-11s11 4.5 11 11" fill="var(--lime)" />
    <path d="M20 40c0-6.5 4.9-11 11-11s11 4.5 11 11" fill="#fff" />
  </svg>
);

export const OptFamily = ({ className = "h-10 w-10" }: P) => (
  <svg {...opt} className={className}>
    <circle cx="14" cy="15" r="5" fill="#fff" />
    <circle cx="34" cy="15" r="5" fill="#fff" />
    <circle cx="24" cy="24" r="4.5" fill="var(--lime)" />
    <path d="M5 38c0-6 4-10 9-10s9 4 9 10M25 38c0-6 4-10 9-10s9 4 9 10" fill="#fff" />
    <path d="M16 41c0-5 3.6-8 8-8s8 3 8 8" fill="var(--lime)" />
  </svg>
);

export const OptUnknown = ({ className = "h-10 w-10" }: P) => (
  <svg {...opt} className={className}>
    <circle cx="24" cy="24" r="16" fill="#fff" />
    <path d="M19 19.5a5 5 0 1 1 7 4.6c-1.3.6-2 1.6-2 3V28" strokeWidth="2.8" />
    <path d="M24 33.5v.5" strokeWidth="3.2" />
  </svg>
);

export const OptLow = ({ className = "h-10 w-10" }: P) => (
  <svg {...opt} className={className}>
    <ellipse cx="24" cy="33" rx="12" ry="5" fill="var(--lime)" />
    <path d="M12 33v-3c0 2.8 5.4 5 12 5s12-2.2 12-5v3" />
  </svg>
);

export const OptMid = ({ className = "h-10 w-10" }: P) => (
  <svg {...opt} className={className}>
    <ellipse cx="24" cy="35" rx="12" ry="5" fill="#fff" />
    <path d="M12 35v-5c0 2.8 5.4 5 12 5s12-2.2 12-5v5" />
    <ellipse cx="24" cy="25" rx="12" ry="5" fill="var(--lime)" />
    <path d="M12 25v-5c0 2.8 5.4 5 12 5s12-2.2 12-5v5" fill="var(--lime)" />
    <ellipse cx="24" cy="20" rx="12" ry="5" fill="#fff" />
  </svg>
);
