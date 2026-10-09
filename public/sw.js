/*
 * Iroum 서비스 워커 — 인터넷이 끊겨도 제도 안내·체크리스트를 볼 수 있게 한다.
 *
 * - 화면(HTML·RSC): 네트워크 먼저, 실패하면 저장해 둔 화면
 * - /_next/static, 아이콘, 글꼴: 저장본 먼저 (파일 이름에 버전이 있어 바뀌지 않음)
 * - /api/*: 절대 저장하지 않는다 (안내문 원문이 남지 않게)
 *
 * 내용을 바꾸면 VERSION을 올려 예전 저장본을 지운다.
 */
const VERSION = "iroum-v3";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

// 처음 설치할 때 미리 저장해 둘 화면
const PRECACHE = [
  "/",
  "/find",
  "/read",
  "/voice",
  "/benefits",
  "/benefits/basic-pension",
  "/benefits/senior-care",
  "/benefits/energy-voucher",
  "/benefits/long-term-care",
  "/benefits/senior-jobs",
  "/benefits/livelihood-benefit",
  "/benefits/medical-aid",
  "/benefits/housing-benefit",
  "/benefits/emergency-welfare",
  "/benefits/telecom-discount",
  "/benefits/dementia-screening",
  "/benefits/flu-vaccine",
  "/icon.svg",
  "/icons/icon-192.png",
];

// 글꼴(Pretendard)만 외부에서 저장한다. 글자 인식 모델 등 큰 파일은 제외.
const FONT_HOST = "cdn.jsdelivr.net";
const FONT_PATH = "/gh/orioncactus/pretendard";

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

/**
 * 화면 HTML과 함께, 그 화면이 쓰는 스크립트·스타일(/_next/static/...)도 저장한다.
 * HTML만 저장하면 인터넷 없이 열었을 때 모양은 나와도 버튼이 동작하지 않는다.
 */
async function precache() {
  const pages = await caches.open(PAGES);
  const assets = await caches.open(ASSETS);
  const assetUrls = new Set();

  await Promise.allSettled(
    PRECACHE.map(async (url) => {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) return;
      await pages.put(url, response.clone());
      if (!(response.headers.get("content-type") || "").includes("text/html")) return;
      const html = await response.text();
      for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assetUrls.add(match[0]);
    }),
  );

  // 한 파일이 실패해도 나머지는 담는다.
  await Promise.allSettled([...assetUrls].map((url) => assets.add(url)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) return; // 저장 안 함
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
      event.respondWith(cacheFirst(request));
      return;
    }
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.hostname === FONT_HOST && url.pathname.startsWith(FONT_PATH)) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    // 저장 안 된 화면이면 첫 화면이라도 보여 준다.
    if (request.mode === "navigate") {
      const home = await caches.match("/");
      if (home) return home;
    }
    throw error;
  }
}
