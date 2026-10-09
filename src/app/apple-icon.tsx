import { ImageResponse } from "next/og";

// 홈 화면에 추가했을 때 보이는 아이콘 (iOS가 모서리를 알아서 둥글게 깎는다)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b8f34a",
        }}
      >
        <svg width="132" height="132" viewBox="4 2 28 28">
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
      </div>
    ),
    size,
  );
}
