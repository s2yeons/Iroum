import data from "@/data/welfare.json";

export type IncomeBand = "basic" | "low" | "mid" | "unknown";
export type Household = "alone" | "couple" | "family" | "unknown";
export type AgeBand = "under30" | "30_59" | "60_64" | "65_74" | "75_plus" | "unknown";
export type Support = "basic_pension" | "livelihood" | "ltc";

export type Program = {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  short: string;
  priority: number;
  filters: {
    min_age: number;
    household: string[];
    income_band: string[];
    also_if_has?: string[];
    exclude_if_has?: string[];
  };
  official: {
    eligibility: string[];
    amount: string;
    documents: string[];
    where: string[];
    how: string[];
    deadline: string;
    contacts: { name: string; tel: string }[];
  };
  easy: {
    summary: string[];
    checklist: { id: string; text: string }[];
  };
  sources: { title: string; url: string }[];
};

export type Answers = {
  age?: AgeBand;
  region?: string;
  household?: Household;
  income?: IncomeBand;
  supports?: Support[];
};

export const CHECKED_AT: string = data.checked_at;
export const programs: Program[] = data.programs as Program[];

export function getProgram(id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}

// 나이 구간의 "가장 많은 나이"로 비교해, 조건에 걸칠 수 있으면 넓게 보여 준다.
const AGE_UPPER: Record<AgeBand, number> = {
  under30: 29,
  "30_59": 59,
  "60_64": 64,
  "65_74": 74,
  "75_plus": 200,
  unknown: 200,
};

export type MatchResult = {
  matched: Program[];
  alreadyHas: Program[];
};

/**
 * 규칙 기반 필터 (AI 호출 없음).
 * 정확한 판정이 아니라 "해당될 수 있는 후보"를 넓게 고른다.
 */
export function matchPrograms(a: Answers): MatchResult {
  const age = a.age ?? "unknown";
  const income = a.income ?? "unknown";
  const household = a.household ?? "unknown";
  const supports = a.supports ?? [];

  const matched: Program[] = [];
  const alreadyHas: Program[] = [];

  for (const p of programs) {
    const f = p.filters;
    if (AGE_UPPER[age] < f.min_age) continue;
    if (
      !f.household.includes("any") &&
      household !== "unknown" &&
      !f.household.includes(household)
    )
      continue;

    if (f.exclude_if_has?.some((s) => supports.includes(s as Support))) {
      // 이미 받는 제도 자체인 경우만 "이미 받고 계신 것"으로 따로 보여 준다.
      if (
        (p.id === "basic-pension" && supports.includes("basic_pension")) ||
        (p.id === "long-term-care" && supports.includes("ltc")) ||
        (p.id === "livelihood-benefit" && supports.includes("livelihood"))
      ) {
        alreadyHas.push(p);
      }
      continue;
    }

    const incomeOk = f.income_band.includes(income);
    const supportOk = f.also_if_has?.some((s) => supports.includes(s as Support)) ?? false;
    if (!incomeOk && !supportOk) continue;

    matched.push(p);
  }

  matched.sort((x, y) => x.priority - y.priority);
  return { matched, alreadyHas };
}

/** 안내문 원문/제목에서 제도명을 찾아 공식 자료와 연결 */
export function findProgramsInText(text: string): Program[] {
  const compact = text.replace(/\s+/g, "");
  return programs.filter((p) =>
    p.aliases.some((alias) => compact.includes(alias.replace(/\s+/g, ""))),
  );
}
