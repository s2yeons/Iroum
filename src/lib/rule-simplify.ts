import glossary from "@/data/glossary.json";
import type { QuotedItem, SimplifyOutput } from "./simplify-schema";

/*
 * AI 없는 모드: 안내문에서 문장을 "그대로" 골라 항목별로 나눈다.
 * - 새 내용을 만들지 않으므로 지어낸 금액·서류·기한이 생길 수 없다.
 * - 바꾸는 것은 문장 끝 말투("합니다" → "해요")뿐이다.
 * - 브라우저에서 돌아가므로 AI 호출·비용·서버 전송이 없다.
 */

type Section = "conditions" | "documents" | "steps" | "deadline" | "contact";

// 머리말(섹션 제목)로 쓰이는 낱말. 위에서부터 먼저 맞는 것을 쓴다.
const SECTION_RULES: [Section, RegExp][] = [
  ["deadline", /신청\s*기간|신청\s*기한|접수\s*기간|제출\s*기한|기한|마감/],
  ["documents", /구비\s*서류|제출\s*서류|필요\s*서류|준비\s*서류|준비물|지참/],
  ["contact", /문의|연락처|상담\s*전화/],
  ["steps", /신청\s*방법|신청\s*절차|접수\s*방법|신청\s*장소|신청처|이용\s*방법/],
  ["conditions", /지원\s*대상|신청\s*대상|지급\s*대상|선정\s*기준|자격|대상자|요건/],
];

const PHONE = /\d{2,4}-\d{3,4}-\d{4}|국번\s*없이\s*\d{3,4}|\b1\d{2,3}(?:-\d{4})?\b/;
const DATE = /\d{4}\s*[.년]\s*\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|\d{1,2}\.\s*\d{1,2}\.\s*\(/;

// 머리말 없이 나온 문장은 낱말로 분류한다.
function classifyLine(line: string): Section | null {
  if (PHONE.test(line) && /문의|전화|상담|콜센터|고객센터/.test(line)) return "contact";
  if (DATE.test(line) && /까지|기한|마감|기간/.test(line)) return "deadline";
  if (/신분증|사본|동의서|증명서|등본|신청서|통장|진단서|계약서/.test(line)) return "documents";
  if (/방문|접수|온라인|누리집|홈페이지|신청하/.test(line)) return "steps";
  if (/이상|이하|대상|해당|거주|수급|제외|소득|재산/.test(line)) return "conditions";
  return null;
}

// 줄 앞 기호·번호 떼기 (연도 같은 숫자는 건드리지 않는다)
const LEADING = /^(?:[\s\-–—·•※○●◎■□◆◇▶▷►☞✔︎*]+|\(?\d{1,2}[.)]\s+|[①-⑳]\s*|[가-하][.)]\s+)+/;

function clean(line: string): string {
  return line.replace(LEADING, "").replace(/\s+/g, " ").trim();
}

// 말투만 쉽게 바꾸는 표 (뜻과 숫자는 그대로)
const ENDINGS: [RegExp, string][] = [
  [/하시기\s*바랍니다\.?$/, "하세요."],
  [/하여\s*주시기\s*바랍니다\.?$/, "해 주세요."],
  [/해\s*주시기\s*바랍니다\.?$/, "해 주세요."],
  [/바랍니다\.?$/, "주세요."],
  [/됩니다\.?$/, "돼요."],
  [/있습니다\.?$/, "있어요."],
  [/없습니다\.?$/, "없어요."],
  [/합니다\.?$/, "해요."],
  [/입니다\.?$/, "이에요."],
  [/\s*가능\.?$/, "할 수 있어요."],
  [/신청$/, "신청해요."],
];

// 문장 가운데 딱딱한 표현
const MIDDLE: [RegExp, string][] = [
  [/하여\s/g, "해서 "],
  [/하시어\s/g, "하셔서 "],
];

function soften(input: string): string {
  let s = input;
  for (const [re, to] of MIDDLE) s = s.replace(re, to);
  for (const [re, to] of ENDINGS) {
    if (re.test(s)) return s.replace(re, to);
  }
  return s;
}

function item(raw: string): QuotedItem {
  return { easy: soften(raw), source_quote: raw };
}

const LIMITS: Record<Exclude<Section, "deadline" | "contact">, number> = {
  conditions: 6,
  documents: 8,
  steps: 6,
};

export function ruleSimplify(source: string): SimplifyOutput {
  const lines = source
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const title = clean(lines[0] ?? "안내문").slice(0, 60) || "안내문";

  const out: Record<Exclude<Section, "deadline" | "contact">, QuotedItem[]> = {
    conditions: [],
    documents: [],
    steps: [],
  };
  let deadline: QuotedItem | null = null;
  let contact: QuotedItem | null = null;
  let current: Section | null = null;

  const add = (section: Section, raw: string) => {
    if (!raw || raw.length < 2) return;
    if (section === "deadline") {
      deadline ??= item(raw);
      return;
    }
    if (section === "contact") {
      contact ??= item(raw);
      return;
    }
    const list = out[section];
    if (list.length < LIMITS[section] && !list.some((x) => x.source_quote === raw)) list.push(item(raw));
  };

  for (const rawLine of lines.slice(1)) {
    const line = clean(rawLine);
    if (!line) continue;

    // "구비서류: 신분증, 통장 사본" 처럼 머리말과 내용이 한 줄에 있는 경우
    const colon = line.match(/^([^:：]{1,20})[:：]\s*(.*)$/);
    const head = colon ? colon[1] : line;
    const headSection = SECTION_RULES.find(([, re]) => re.test(head))?.[0] ?? null;
    const isHeaderOnly = !colon && headSection !== null && line.length <= 20;

    if (isHeaderOnly) {
      current = headSection;
      continue;
    }
    if (colon && headSection) {
      current = headSection;
      const body = colon[2].trim();
      if (!body) continue;
      if (headSection === "documents") {
        body.split(/\s*[,，/、]\s*/).forEach((piece) => add("documents", piece));
      } else {
        add(headSection, line);
      }
      continue;
    }

    // 머리말 아래 줄은 그 머리말에 넣고, 아니면 낱말로 분류한다.
    const section = current ?? classifyLine(line);
    if (section) add(section, line);
  }

  const easy_summary = [
    `「${title}」에 대한 안내문이에요.`,
    out.conditions.length ? "누가 해당되는지 아래에 정리했어요." : "",
    out.documents.length ? "챙길 서류가 적혀 있어요. 체크하면서 준비하세요." : "",
    deadline ? "기한이 있어요. 아래 '기한'을 꼭 확인하세요." : "",
    contact ? "모르는 건 아래 문의처에 물어보세요." : "",
  ].filter(Boolean);

  const compact = source.replace(/\s+/g, "");
  const terms = glossary.filter((g) => compact.includes(g.term.replace(/\s+/g, "")));

  return {
    title,
    easy_summary,
    conditions: out.conditions,
    documents: out.documents,
    steps: out.steps.map((s, i) => ({ ...s, order: i + 1 })),
    deadline,
    contact,
    terms,
  };
}
