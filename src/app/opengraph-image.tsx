import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// 링크를 카카오톡·문자로 보냈을 때 보이는 미리보기 그림
export const alt = "Iroum 이로움 — 받을 수 있는 혜택, 놓치지 않게 도와드릴게요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const extraBold = await readFile(join(process.cwd(), "assets/fonts/Pretendard-ExtraBold.otf"));
const medium = await readFile(join(process.cwd(), "assets/fonts/Pretendard-Medium.otf"));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(900px 420px at 100% 0%, #e3fbb4 0%, #ffffff 70%)",
          fontFamily: "Pretendard",
          color: "#191f28",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="84" height="84" viewBox="0 0 36 36">
            <rect width="36" height="36" rx="10.5" fill="#b8f34a" />
            <circle cx="12.5" cy="10" r="3" fill="#1b2a06" />
            <path
              d="M12.5 16.5V26.5L27.5 11.5"
              fill="none"
              stroke="#1b2a06"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1.5 }}>Iroum</span>
            <span style={{ fontSize: 26, fontWeight: 500, color: "#4e5968" }}>이로움 · 어르신 복지 도우미</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.2 }}>
            받을 수 있는 혜택,
          </span>
          <span style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.2 }}>
            놓치지 않게 도와드릴게요
          </span>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["지원금 찾기", "안내문 쉽게 읽기", "음성 안내"].map((t, i) => (
            <span
              key={t}
              style={{
                display: "flex",
                padding: "12px 26px",
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 800,
                background: i === 0 ? "#b8f34a" : "#f4f6f1",
                color: i === 0 ? "#1b2a06" : "#4e5968",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: extraBold, weight: 800, style: "normal" },
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
