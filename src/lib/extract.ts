"use client";

// 사진 글자 인식과 PDF 읽기는 모두 브라우저 안에서 처리한다(AI 호출·비용 0회).

type Progress = (ratio: number, label: string) => void;

type ImageInput = File | HTMLCanvasElement;

async function ocr(images: ImageInput[], onProgress: Progress): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  let page = 0;
  const worker = await createWorker("kor", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress((page + m.progress) / images.length, "글자를 읽고 있어요");
      } else if (m.status.includes("loading")) {
        onProgress(0, "글자 읽기 준비 중이에요");
      }
    },
  });
  try {
    const texts: string[] = [];
    for (; page < images.length; page++) {
      const { data } = await worker.recognize(images[page]);
      texts.push(data.text);
    }
    return tidyOcr(texts.join("\n\n"));
  } finally {
    await worker.terminate();
  }
}

/** 한국어 OCR은 글자 사이에 빈칸이 끼는 경우가 많아 조금 다듬는다. */
function tidyOcr(text: string): string {
  return text
    .replace(/([가-힣]) (?=[가-힣](?:[ \n]|$))/g, "$1") // "기 초 연 금" 같은 한 글자씩 띄어진 경우
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
