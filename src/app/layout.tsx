import type { Metadata, Viewport } from "next";
import { OfflineBanner, ServiceWorkerRegister } from "@/components/pwa";
import { SettingsProvider } from "@/components/settings";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Iroum 이로움", template: "%s · Iroum" },
  description: "어르신이 받을 수 있는 혜택을 놓치지 않도록 돕는 복지 도우미. 쉬운 말과 큰 글씨, 음성으로 안내해요.",
  applicationName: "Iroum",
  // 아이폰에서 홈 화면에 추가했을 때 앱처럼 열리게 한다
  appleWebApp: { capable: true, title: "Iroum", statusBarStyle: "default" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-font="normal" className="h-full antialiased">
      <head>
        {/* 한국어 화면에 가장 널리 쓰이는 Pretendard (필요한 글자만 내려받는 dynamic subset) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="page-glow min-h-full">
        <div className="flex min-h-dvh w-full flex-col">
          <SettingsProvider>
            <OfflineBanner />
            {children}
            <SiteFooter />
          </SettingsProvider>
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
