/**
 * 말로 한 대답을 선택지 값으로 바꾼다. (AI 없이 낱말 규칙으로만)
 * 예: "일흔둘이요" → 75세 미만 구간, "아들네랑 살아" → 가족과 삶
 */

export type SpokenResult =
  | { kind: "answer"; values: string[] }
  | { kind: "command"; command: "next" | "back" | "repeat" }
  | { kind: "none" };

type Option = { value: string; label: string };

const norm = (s: string) => s.replace(/[\s.,!?~·\-]/g, "");

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

// ---- 나이: 숫자 / 칠십이 / 일흔둘 ----

const SINO: Record<string, number> = { 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 륙: 6, 칠: 7, 팔: 8, 구: 9 };
const NATIVE_TENS: Record<string, number> = {
  스물: 20, 스무: 20, 서른: 30, 마흔: 40, 쉰: 50, 예순: 60, 일흔: 70, 여든: 80, 아흔: 90,
};
const NATIVE_ONES: [string, number][] = [
  ["하나", 1], ["한", 1], ["둘", 2], ["두", 2], ["셋", 3], ["세", 3], ["넷", 4], ["네", 4],
  ["다섯", 5], ["여섯", 6], ["일곱", 7], ["여덟", 8], ["아홉", 9],
];

export function parseAge(raw: string): number | null {
  const t = norm(raw);

  const digits = t.match(/(\d{1,3})/);
  if (digits) {
    const n = Number(digits[1]);
    if (n >= 10 && n <= 120) return n;
  }

  // 칠십이, 육십오세
  const sino = t.match(/([일이삼사오육륙칠팔구])?십([일이삼사오육륙칠팔구])?/);
  if (sino) {
    const tens = sino[1] ? SINO[sino[1]] : 1;
    const ones = sino[2] ? SINO[sino[2]] : 0;
    return tens * 10 + ones;
  }

  // 일흔둘, 예순다섯
  for (const [word, tens] of Object.entries(NATIVE_TENS)) {
    const i = t.indexOf(word);
    if (i < 0) continue;
    const rest = t.slice(i + word.length);
    const one = NATIVE_ONES.find(([w]) => rest.startsWith(w));
    return tens + (one ? one[1] : 0);
  }
  return null;
}

function ageBand(n: number): string {
  if (n < 30) return "under30";
  if (n < 60) return "30_59";
  if (n < 65) return "60_64";
  if (n < 75) return "65_74";
  return "75_plus";
}

// ---- 낱말 사전 (먼저 적힌 것을 먼저 본다) ----

const UNKNOWN = ["모르", "몰라", "글쎄"];

const HOUSEHOLD: [string, string[]][] = [
  ["family", ["자녀", "아들", "딸", "가족", "식구", "손주", "손자", "손녀", "며느리", "사위", "애들", "자식"]],
  ["couple", ["배우자", "남편", "아내", "부인", "부부", "영감", "할멈", "집사람", "마누라", "바깥양반", "둘이"]],
  ["alone", ["혼자", "홀로", "독거", "나만"]],
];

const INCOME: [string, string[]][] = [
  ["basic", ["수급", "기초생활"]],
  ["low", ["넉넉하지", "넉넉치", "어려", "힘들", "없어", "없지", "부족", "빠듯", "가난", "않"]],
  ["mid", ["보통", "여유", "괜찮", "넉넉", "살만", "먹고살"]],
];

const SUPPORTS: [string, string[]][] = [
  ["basic_pension", ["기초연금", "노령연금", "노인연금"]],
  ["livelihood", ["생계", "의료급여", "주거급여", "수급", "급여"]],
  ["ltc", ["장기요양", "요양등급", "요양"]],
];

const REGION_WORDS: Record<string, string[]> = {
  서울특별시: ["서울"],
  부산광역시: ["부산"],
  대구광역시: ["대구"],
  인천광역시: ["인천"],
  광주광역시: ["광주"],
  대전광역시: ["대전"],
  울산광역시: ["울산"],
  세종특별자치시: ["세종"],
  경기도: ["경기"],
  강원특별자치도: ["강원"],
  충청북도: ["충북", "충청북"],
  충청남도: ["충남", "충청남"],
  전북특별자치도: ["전북", "전라북"],
  전라남도: ["전남", "전라남"],
  경상북도: ["경북", "경상북"],
  경상남도: ["경남", "경상남"],
  제주특별자치도: ["제주"],
};

function pick(t: string, table: [string, string[]][]): string | null {
  return table.find(([, words]) => has(t, words))?.[0] ?? null;
}

function matchOne(key: string, t: string, options: Option[]): string[] | null {
  switch (key) {
    case "age": {
      const n = parseAge(t);
      if (n !== null) return [ageBand(n)];
      break;
    }
    case "household": {
      const v = pick(t, HOUSEHOLD);
      if (v) return [v];
      break;
    }
    case "income": {
      const v = pick(t, INCOME);
      if (v) return [v];
      break;
    }
    case "region": {
      const hit = Object.entries(REGION_WORDS).find(([, words]) => has(t, words));
      if (hit) return [hit[0]];
      break;
    }
    case "supports": {
      const found = SUPPORTS.filter(([, words]) => has(t, words)).map(([v]) => v);
      if (found.length > 0) return found;
      if (has(t, ["없", "아니", "안받", ...UNKNOWN])) return ["none"];
      break;
    }
  }

  // 선택지 글자를 그대로 말한 경우
  const exact = options.find((o) => o.value !== "unknown" && t.includes(norm(o.label)));
  if (exact) return [exact.value];

  if (has(t, UNKNOWN) && options.some((o) => o.value === "unknown")) return ["unknown"];
  return null;
}

function matchCommand(t: string): SpokenResult | null {
  if (has(t, ["다음", "넘어가", "건너"])) return { kind: "command", command: "next" };
  if (has(t, ["이전", "뒤로", "앞질문", "돌아가"])) return { kind: "command", command: "back" };
  if (has(t, ["다시", "한번더", "뭐라고", "못들었"])) return { kind: "command", command: "repeat" };
  return null;
}

/** 음성 인식 후보 여러 개 중 처음으로 알아들은 것을 고른다. */
export function matchSpoken(key: string, alternatives: string[], options: Option[]): SpokenResult {
  for (const alt of alternatives) {
    const values = matchOne(key, norm(alt), options);
    if (values) return { kind: "answer", values };
  }
  for (const alt of alternatives) {
    const c = matchCommand(norm(alt));
    if (c) return c;
  }
  return { kind: "none" };
}
