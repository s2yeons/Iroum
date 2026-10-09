import type { QuotedItem, SimplifyOutput } from "./simplify-schema";

/**
 * 비교용 정규화: 공백·줄바꿈·문장부호·따옴표 차이로 근거가 탈락하지 않도록
 * 글자와 숫자만 남긴다. (OCR 결과도 공백이 들쭉날쭉하기 때문)
 */
export function normalize(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

/** 근거 문장이 원문에 실제로 있는지 확인 */
export function quoteInSource(quote: string, normalizedSource: string): boolean {
  const q = normalize(quote);
  // 너무 짧은 근거(예: "1", "12")는 아무 데나 걸리므로 근거로 인정하지 않는다.
  // "신분증"처럼 짧은 낱말은 괜찮지만, 숫자만 있는 짧은 근거는 뺀다.
  if (q.length < 2 || (/^\d+$/.test(q) && q.length < 4)) return false;
  return normalizedSource.includes(q);
}

/**
 * 숫자 지킴이: 쉬운 설명 문장에 나온 숫자(금액·날짜·나이)가 원문에도 있어야 한다.
 * "30만 원"→"300000" 처럼 바뀌는 경우는 원문 숫자를 그대로 쓰라고 프롬프트에서 요구한다.
 */
export function numbersInSource(text: string, normalizedSource: string): boolean {
  const nums = text.replace(/(\d),(\d)/g, "$1$2").match(/\d+/g) ?? [];
  const srcDigits = normalizedSource.replace(/(\d),(\d)/g, "$1$2");
  return nums.every((n) => srcDigits.includes(n));
}

type Removed = { section: string; easy: string };

/**
 * ① 근거 대조: source_quote가 원문에 없으면 그 항목은 화면에서 뺀다.
 * 용어(terms)는 근거 문장이 없으므로, 용어 자체가 원문에 있어야 남긴다.
 */
export function verifyAgainstSource(
  out: SimplifyOutput,
  source: string,
): { verified: SimplifyOutput; removed: Removed[] } {
  const src = normalize(source);
  const removed: Removed[] = [];

  const grounded = (it: QuotedItem) =>
    quoteInSource(it.source_quote, src) && numbersInSource(it.easy, src);

  const keep = <T extends QuotedItem>(section: string, items: T[]): T[] =>
    items.filter((it) => {
      const ok = grounded(it);
      if (!ok) removed.push({ section, easy: it.easy });
      return ok;
    });

  const keepOne = (section: string, it: QuotedItem | null): QuotedItem | null => {
    if (!it) return null;
    if (grounded(it)) return it;
    removed.push({ section, easy: it.easy });
    return null;
  };

  // 요약 문장은 근거 문장이 없으므로, 숫자만이라도 원문과 맞는지 확인한다.
  const easy_summary = out.easy_summary.filter((s) => {
    const ok = numbersInSource(s, src);
    if (!ok) removed.push({ section: "요약", easy: s });
    return ok;
  });

  const verified: SimplifyOutput = {
    title: out.title,
    easy_summary,
    conditions: keep("조건", out.conditions),
    documents: keep("준비물", out.documents),
    steps: keep("신청 순서", out.steps).sort((a, b) => a.order - b.order),
    deadline: keepOne("기한", out.deadline),
    contact: keepOne("문의처", out.contact),
    terms: out.terms.filter((t) => src.includes(normalize(t.term))),
  };

  return { verified, removed };
}
