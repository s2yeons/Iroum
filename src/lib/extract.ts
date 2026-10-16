"use client";

// 사진 글자 인식과 PDF 읽기는 모두 브라우저 안에서 처리한다(AI 호출·비용 0회).

type Progress = (ratio: number, label: string) => void;

type ImageInput = File | HTMLCanvasElement;

type Psm = "3" | "6";

export type OcrOptions = {
  /** 그림자·흐림을 정리하고 크기를 맞춘 뒤 읽는다 */
  prepare?: boolean;
  /**
   * 테서랙트 쪽 나누기 방식. 3(자동)은 사진에 강하지만 깨끗한 문서에서 줄을 빠뜨리기도 하고,
   * 6(한 덩어리)은 문서에 강하지만 그림자를 글자로 읽기도 한다. 둘 다 주면 둘 다 읽고 나은 쪽을 고른다.
   */
  psm?: Psm[];
  /** 영어·숫자가 섞인 글을 위해 영어도 함께 읽는다 */
  lang?: "kor" | "kor+eng";
  /** 조금 기울어진 사진을 바로 세운다 */
  rotateAuto?: boolean;
  /** 측정용: 각 방식의 결과를 알려 준다 */
  onPass?: (p: Pass) => void;
};

export type Pass = { psm: Psm; text: string; confidence: number; score: number };

export const DEFAULT_OCR: OcrOptions = { prepare: true, psm: ["6", "3"], lang: "kor", rotateAuto: true };

/** 이만큼 확신하면 다른 방식으로 다시 읽지 않는다 (맞게 읽으면 90 안팎, 틀리면 85 아래로 나왔다) */
const SURE = 88;

/** 믿을 만한 글자가 많을수록 높다. 줄을 빠뜨리면 글자 수가, 얼룩을 글자로 읽으면 확신도가 떨어진다. */
function scorePass(text: string, confidence: number) {
  const chars = (text.match(/[가-힣0-9]/g) ?? []).length;
  return (confidence / 100) ** 2 * chars;
}

export async function ocr(images: ImageInput[], onProgress: Progress, opts: OcrOptions = DEFAULT_OCR): Promise<string> {
  const o = { ...DEFAULT_OCR, ...opts };
  const psms = o.psm ?? ["6"];
  const { createWorker } = await import("tesseract.js");
  let step = 0;
  const steps = images.length * psms.length;
  const worker = await createWorker(o.lang ?? "kor", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress((step + m.progress) / steps, "글자를 읽고 있어요");
      } else if (m.status.includes("loading")) {
        onProgress(0, "글자 읽기 준비 중이에요");
      }
    },
  });
  try {
    const texts: string[] = [];
    for (const image of images) {
      const input = o.prepare ? await prepareImage(image) : image;
      let best: Pass | null = null;
      for (const psm of psms) {
        await worker.setParameters({ tessedit_pageseg_mode: psm as never, preserve_interword_spaces: "1" });
        const { data } = await worker.recognize(input, { rotateAuto: o.rotateAuto });
        const pass = { psm, text: data.text, confidence: data.confidence, score: scorePass(data.text, data.confidence) };
        o.onPass?.(pass);
        if (!best || pass.score > best.score) best = pass;
        step++;
        if (pass.confidence >= SURE) break;
      }
      step = texts.length * psms.length + psms.length; // 건너뛴 만큼 진행 막대를 채운다
      texts.push(best?.text ?? "");
    }
    return tidyOcr(texts.join("\n\n"));
  } finally {
    await worker.terminate();
  }
}

// ---- 사진 다듬기 ----
// 휴대폰 사진은 그림자가 지고, 종이가 회색이고, 너무 크거나 작다.
// 글자 인식이 가장 잘 되는 모양(흰 바탕·검은 글자·알맞은 크기)으로 바꾼다.

const MAX_SIDE = 2600; // 이보다 크면 줄인다 (느려지기만 하고 정확해지지 않는다)
const MIN_SIDE = 1600; // 이보다 작으면 키운다 (작은 글자는 못 읽는다)

async function toCanvas(input: ImageInput): Promise<HTMLCanvasElement> {
  let src: CanvasImageSource;
  let w: number;
  let h: number;
  if (input instanceof HTMLCanvasElement) {
    src = input;
    w = input.width;
    h = input.height;
  } else {
    // 휴대폰 사진의 회전 정보(EXIF)를 반영해 바로 세운다.
    const bmp = await createImageBitmap(input, { imageOrientation: "from-image" });
    src = bmp;
    w = bmp.width;
    h = bmp.height;
  }
  const long = Math.max(w, h);
  const scale = long > MAX_SIDE ? MAX_SIDE / long : long < MIN_SIDE ? MIN_SIDE / long : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  if ("close" in src) src.close();
  return canvas;
}

export async function prepareImage(input: ImageInput): Promise<HTMLCanvasElement> {
  const canvas = await toCanvas(input);
  const { width: w, height: h } = canvas;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;

  // 1) 흑백
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];

  // 2) 그림자 지우기: 종이 바탕 밝기(넓게 흐린 값)로 나눠 바탕을 고르게 하얗게 만든다.
  //    바탕을 구할 때 글자가 섞이지 않게, 작은 칸마다 가장 밝은 값을 먼저 고른다.
  const cell = Math.max(8, Math.round(Math.max(w, h) / 120));
  const cw = Math.ceil(w / cell);
  const ch = Math.ceil(h / cell);
  const bright = new Float32Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      // 칸 안의 밝은 쪽 값(95%)을 바탕으로 본다. 최댓값은 반사광에 흔들려서 쓰지 않는다.
      const vals: number[] = [];
      for (let y = cy * cell; y < Math.min(h, (cy + 1) * cell); y += 2)
        for (let x = cx * cell; x < Math.min(w, (cx + 1) * cell); x += 2) vals.push(gray[y * w + x]);
      vals.sort((a, b) => a - b);
      bright[cy * cw + cx] = vals[Math.floor(vals.length * 0.95)] ?? 255;
    }
  }
  const bg = boxBlur(boxBlur(bright, cw, ch, 2), cw, ch, 2);

  // 3) 바탕으로 나누고, 대비를 넓힌다.
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(ch - 1, Math.max(0, (y + 0.5) / cell - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(ch - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(cw - 1, Math.max(0, (x + 0.5) / cell - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(cw - 1, x0 + 1);
      const tx = fx - x0;
      const b =
        (bg[y0 * cw + x0] * (1 - tx) + bg[y0 * cw + x1] * tx) * (1 - ty) +
        (bg[y1 * cw + x0] * (1 - tx) + bg[y1 * cw + x1] * tx) * ty;
      out[y * w + x] = Math.min(1, gray[y * w + x] / Math.max(b, 1));
    }
  }
  // 가장 어두운 1% 를 검정으로 맞춘다 (흐린 글자를 진하게)
  const sample: number[] = [];
  for (let i = 0; i < out.length; i += 7) sample.push(out[i]);
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.01)] ?? 0;
  const hi = 0.92; // 바탕에 남은 얼룩은 흰색으로
  for (let i = 0; i < w * h; i++) {
    const v = Math.round(Math.min(255, Math.max(0, ((out[i] - lo) / (hi - lo)) * 255)));
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
    px[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < w) {
          s += src[y * w + xx];
          n++;
        }
      }
      tmp[y * w + x] = s / n;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < h) {
          s += tmp[yy * w + x];
          n++;
        }
      }
      dst[y * w + x] = s / n;
    }
  return dst;
}

/** 한국어 OCR이 자주 틀리는 것을 다듬는다. */
export function tidyOcr(text: string): string {
  return (
    text
      // "기 초 연 금"처럼 한 글자씩 띄어진 것(세 글자 이상)만 붙인다
      .replace(/(?<![^\s])[가-힣](?: [가-힣]){2,}(?![^\s])/g, (m) => m.replace(/ /g, ""))
      // 줄 앞 글머리 기호(■ ○ ㅇ ▶ 등)를 "를", "0", "O", "ㅁ"처럼 읽은 것을 "•"로 바꾼다
      .replace(/^[ \t]*(?:[■□●○◎◆◇▶▷►※ㅇㅁ0Oo°를릅]|\|)[ \t]+(?=[가-힣(])/gm, "• ")
      // "읍·면·동"의 가운뎃점을 "-"나 "."로 읽은 것
      .replace(/(^|[^가-힣])([가-힣])[-.]([가-힣])[-.]([가-힣])(?=[^가-힣]|$)/gm, "$1$2·$3·$4")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export function ocrImage(file: File, onProgress: Progress) {
  return ocr([file], onProgress);
}

const MAX_PDF_PAGES = 5;

export async function pdfToText(file: File, onProgress: Progress): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  onProgress(0, "PDF를 열고 있어요");
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);

  // 1) 글자가 들어 있는 PDF는 바로 읽는다.
  const texts: string[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    texts.push(
      content.items
        .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : "") : ""))
        .join(""),
    );
    onProgress(i / pages, "PDF를 읽고 있어요");
  }
  const text = texts.join("\n\n").trim();
  if (text.replace(/\s/g, "").length > 30) return text;

  // 2) 스캔한 PDF(그림)라면 각 쪽을 그림으로 바꿔 글자 인식을 한다.
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, viewport }).promise;
    canvases.push(canvas);
  }
  return ocr(canvases, onProgress);
}

/** 같은 문서인지 확인하는 해시(기기 안 캐시용). 서버와 같은 방식으로 정규화한다. */
export async function hashText(text: string): Promise<string> {
  const norm = text.normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
