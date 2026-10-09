import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Iroum 이로움 · 어르신 복지 도우미",
    short_name: "Iroum",
    description: "받을 수 있는 혜택을 놓치지 않도록, 쉬운 말과 큰 글씨로 안내해 드려요.",
    lang: "ko",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["lifestyle", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // 홈 화면 아이콘을 길게 누르면 나오는 바로가기
    shortcuts: [
      {
        name: "받을 수 있는 지원금 찾기",
        short_name: "지원금 찾기",
        url: "/find",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "안내문 쉽게 읽기",
        short_name: "안내문 읽기",
        url: "/read",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
