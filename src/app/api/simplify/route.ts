import { createHash } from "node:crypto";
import { callLlm, LlmError } from "@/lib/llm";
import { SimplifySchema, type SimplifyOutput, type SimplifyResponse, type SimplifyResult } from "@/lib/simplify-schema";
import { normalize, verifyAgainstSource } from "@/lib/verify";
import { findProgramsInText } from "@/lib/welfare";

const MAX_CHARS = 15_000;
const MIN_CHARS = 20;

// 같은 문서는 해시로 캐시한다. 원문은 저장하지 않고 해시와 결과만 보관한다.
const cache = new Map<string, Omit<SimplifyResult, "cached">>();
const CACHE_LIMIT = 500;

// 무료 제공량 보호용 간단한 요청 제한 (IP당 1분에 8회)
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

function fail(error: string, status: number) {
  return Response.json({ ok: false, error, fallback: true } satisfies SimplifyResponse, { status });
}

// "65 세", "1 개월"처럼 숫자와 단위 사이에 낀 빈칸을 붙인다 (일부 모델의 버릇).
const UNIT_GAP = /(\d)\s+(세|년|개월|월|일|원|만|천|시|분|가지|명|번|회|층)/g;
const tidy = (s: string) => s.replace(UNIT_GAP, "$1$2");

function tidyOutput(o: SimplifyOutput): SimplifyOutput {
  const q = <T extends { easy: string }>(x: T): T => ({ ...x, easy: tidy(x.easy) });
  return {
    ...o,
    title: tidy(o.title),
    easy_summary: o.easy_summary.map(tidy),
    conditions: o.conditions.map(q),
    documents: o.documents.map(q),
    steps: o.steps.map(q),
    deadline: o.deadline && q(o.deadline),
    contact: o.contact && q(o.contact),
  };
}

export async function POST(request: Request) {
  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return fail("요청 형식이 올바르지 않아요.", 400);
  }
  if (typeof text !== "string") return fail("안내문 글자가 없어요.", 400);

  const source = text.trim();
  if (source.length < MIN_CHARS) return fail("글이 너무 짧아요. 안내문 내용을 더 넣어 주세요.", 400);
  if (source.length > MAX_CHARS) return fail("글이 너무 길어요. 한 장씩 나눠서 넣어 주세요.", 413);

  const hash = createHash("sha256").update(normalize(source)).digest("hex");
  const hit = cache.get(hash);
  if (hit) {
    return Response.json({ ok: true, result: { ...hit, cached: true } } satisfies SimplifyResponse);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return fail("요청이 많아요. 1분 뒤에 다시 해 주세요.", 429);

  try {
    const raw = await callLlm(source);
    let parsed;
    try {
      parsed = SimplifySchema.parse(JSON.parse(raw));
    } catch {
      throw new LlmError("AI 응답을 읽지 못했어요.", "bad_output");
    }

    const { verified, removed } = verifyAgainstSource(tidyOutput(parsed), source);
    const linkedProgramIds = findProgramsInText(`${verified.title}\n${source}`)
      .slice(0, 2)
      .map((p) => p.id);

    const result = { ...verified, removed, linkedProgramIds, mode: "ai" as const };
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    cache.set(hash, result);

    return Response.json({ ok: true, result: { ...result, cached: false } } satisfies SimplifyResponse);
  } catch (e) {
    if (e instanceof LlmError) {
      console.error("[simplify]", e.kind, e.message);
      const msg =
        e.kind === "quota"
          ? "AI가 잠시 붐벼요. 대신 원문 문장으로 정리했어요."
          : "쉬운 설명을 만들지 못했어요.";
      return fail(msg, e.kind === "quota" ? 429 : 502);
    }
    console.error("[simplify] unexpected", e);
    return fail("쉬운 설명을 만들지 못했어요.", 500);
  }
}
