import { z } from "zod";

// 기획서 05장 출력 형식(JSON 스키마)
const quoted = z.object({
  easy: z.string(),
  source_quote: z.string(),
});

export const SimplifySchema = z.object({
  title: z.string(),
  easy_summary: z.array(z.string()),
  conditions: z.array(quoted),
  documents: z.array(quoted),
  steps: z.array(quoted.extend({ order: z.number() })),
  deadline: quoted.nullable(),
  contact: quoted.nullable(),
  terms: z.array(z.object({ term: z.string(), easy: z.string() })),
});

export type SimplifyOutput = z.infer<typeof SimplifySchema>;

export type QuotedItem = { easy: string; source_quote: string };

/** 근거 대조를 거친 뒤 화면으로 보내는 결과 */
export type SimplifyResult = SimplifyOutput & {
  /** 근거 문장이 원문에 없어서 화면에서 뺀 항목 수 */
  removed: { section: string; easy: string }[];
  linkedProgramIds: string[];
  cached: boolean;
  /** ai: AI가 쉬운 말로 정리 / rule: AI 없이 원문 문장을 골라 정리 */
  mode: "ai" | "rule";
};

/** 화면에서 쓰는 응답 형식 */
export type SimplifyResponse =
  | { ok: true; result: SimplifyResult }
  | { ok: false; error: string; fallback: true };
