// PWA 아이콘 PNG 만들기: npx tsx scripts/gen-icons.tsx
// 결과는 public/icons/ 에 저장해 커밋한다 (매니페스트가 고정 주소를 쓰기 때문).
import { writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

const INK = "#1b2a06";
const LIME = "#b8f34a";

// maskable: 안드로이드가 아이콘을 원·물방울 모양으로 잘라도 마크가 잘리지 않게 안쪽 80%에만 그린다.
function mark(size: number, maskable: boolean) {
  const inner = Math.round(size * (maskable ? 0.58 : 0.74));
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: LIME }}>
      <svg width={inner} height={inner} viewBox="4 2 28 28">
        <circle cx="12.5" cy="10" r="3" fill={INK} />
        <path d="M12.5 16.5V26.5L27.5 11.5" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-512.png", size: 512, maskable: true },
];

async function main() {
  for (const t of targets) {
    const res = new ImageResponse(mark(t.size, t.maskable), { width: t.size, height: t.size });
    await writeFile(`public/icons/${t.file}`, Buffer.from(await res.arrayBuffer()));
    console.log("wrote", t.file);
  }
}

main();
