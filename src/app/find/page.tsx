"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  IllBadge,
  IllCalendar,
  IllHome,
  IllPin,
  IllWallet,
  OptFamily,
  OptLow,
  OptMid,
  OptOne,
  OptTwo,
  OptUnknown,
  ProgramIcon,
  Refresh,
} from "@/components/icons";
import { ProgramCard } from "@/components/program-card";
import { AutoSpeak, SpeakButton } from "@/components/speech";
import { Disclaimer, Page, TopBar } from "@/components/ui";
import { load, save } from "@/lib/storage";
import { CHECKED_AT, matchPrograms, type Answers, type Support } from "@/lib/welfare";

const REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시",
  "울산광역시", "세종특별자치시", "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

type Option = { value: string; label: string; icon?: React.ReactNode };
type Question = {
  key: "age" | "household" | "income" | "region" | "supports";
  title: string;
  hint?: string;
  options: Option[];
  icon: React.ReactNode;
  grid?: boolean;
  multi?: boolean;
};

const QUESTIONS: Question[] = [
  {
    key: "age",
    title: "나이가 어떻게 되세요?",
    icon: <IllCalendar className="h-14 w-14" />,
    options: [
      { value: "under30", label: "10~20대" },
      { value: "30_59", label: "30~50대" },
      { value: "60_64", label: "60~64세" },
      { value: "65_74", label: "65세 ~ 74세" },
      { value: "75_plus", label: "75세 이상" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
  {
    key: "region",
    title: "어디에 사세요?",
    icon: <IllPin className="h-14 w-14" />,
    hint: "주민등록증에 적힌 곳을 골라 주세요.",
    grid: true,
    options: [...REGIONS.map((r) => ({ value: r, label: r })), { value: "unknown", label: "잘 모르겠어요" }],
  },
  {
    key: "household",
    title: "누구와 함께 사시나요?",
    icon: <IllHome className="h-14 w-14" />,
    options: [
      { value: "alone", label: "혼자 살아요", icon: <OptOne /> },
      { value: "couple", label: "배우자와 둘이 살아요", icon: <OptTwo /> },
      { value: "family", label: "자녀 등 가족과 살아요", icon: <OptFamily /> },
      { value: "unknown", label: "잘 모르겠어요", icon: <OptUnknown /> },
    ],
  },
  {
    key: "income",
    title: "생활 형편은 어떠세요?",
    hint: "정확하지 않아도 괜찮아요.",
    icon: <IllWallet className="h-14 w-14" />,
    options: [
      { value: "basic", label: "기초생활수급을 받고 있어요", icon: <ProgramIcon id="livelihood-benefit" className="h-10 w-10" /> },
      { value: "low", label: "형편이 넉넉하지 않아요", icon: <OptLow /> },
      { value: "mid", label: "보통이거나 여유가 있어요", icon: <OptMid /> },
      { value: "unknown", label: "잘 모르겠어요", icon: <OptUnknown /> },
    ],
  },
  {
    key: "supports",
    title: "지금 받고 있는 지원이 있나요?",
    hint: "여러 개 골라도 돼요.",
    icon: <IllBadge className="h-14 w-14" />,
    multi: true,
    options: [
      { value: "basic_pension", label: "기초연금", icon: <ProgramIcon id="basic-pension" className="h-10 w-10" /> },
      { value: "livelihood", label: "생계·의료·주거급여", icon: <ProgramIcon id="livelihood-benefit" className="h-10 w-10" /> },
      { value: "ltc", label: "장기요양등급", icon: <ProgramIcon id="long-term-care" className="h-10 w-10" /> },
      { value: "none", label: "없어요 · 잘 모르겠어요", icon: <OptUnknown /> },
    ],
  },
];

const ANSWERS_KEY = "swb:answers";
const STEP_KEY = "swb:find-step";
const RESULT_STEP = QUESTIONS.length;

export default function FindPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [ready, setReady] = useState(false);

  // 이어 하기: 답과 진행 단계는 이 기기에만 저장 (서버로 보내지 않음)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 저장된 답은 브라우저에서만 읽을 수 있다 */
    setAnswers(load<Answers>(ANSWERS_KEY, {}));
    setStep(load<number>(STEP_KEY, 0));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const go = (next: number) => {
    setStep(next);
    save(STEP_KEY, next);
    window.scrollTo({ top: 0 });
  };

  const setAnswer = (patch: Partial<Answers>) => {
    setAnswers((prev) => {
      const next = { ...prev, ...patch };
      save(ANSWERS_KEY, next);
      return next;
    });
  };

  const restart = () => {
    setAnswers({});
    save(ANSWERS_KEY, {});
    go(0);
  };

  if (!ready) return <TopBar backHref="/" />;

  if (step >= RESULT_STEP) {
    return (
      <>
        <TopBar onBack={() => go(RESULT_STEP - 1)} title="찾은 혜택" />
        <Results answers={answers} onRestart={restart} />
      </>
    );
  }

  const q = QUESTIONS[step];
  return (
    <>
      <TopBar onBack={step === 0 ? undefined : () => go(step - 1)} backHref="/" title="지원금 찾기" />
      <Page>
        <QuestionScreen
          key={q.key}
          q={q}
          step={step}
          answers={answers}
          onAnswer={setAnswer}
          onNext={() => go(step + 1)}
        />
      </Page>
    </>
  );
}

function QuestionScreen({
  q,
  step,
  answers,
  onAnswer,
  onNext,
}: {
  q: Question;
  step: number;
  answers: Answers;
  onAnswer: (p: Partial<Answers>) => void;
  onNext: () => void;
}) {
  const total = QUESTIONS.length;
  const multi = q.multi === true;
  const current = multi
    ? (answers.supports ?? [])
    : (answers[q.key as Exclude<Question["key"], "supports">] as string | undefined);
  const isSelected = (v: string) =>
    multi ? (current as string[]).includes(v) || (v === "none" && answers.supports?.length === 0) : current === v;
  const answered = multi ? answers.supports !== undefined : current !== undefined;

  const select = (v: string) => {
    if (!multi) {
      onAnswer({ [q.key]: v } as Partial<Answers>);
      return;
    }
    if (v === "none") {
      onAnswer({ supports: [] });
      return;
    }
    const prev = answers.supports ?? [];
    const next = prev.includes(v as Support) ? prev.filter((s) => s !== v) : [...prev, v as Support];
    onAnswer({ supports: next });
  };

  const speech = `${q.title} ${q.hint ?? ""} ${q.grid ? "" : q.options.map((o) => o.label).join(", ")}`;

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <AutoSpeak text={speech} />

      {/* 단계 표시: 5칸 막대 */}
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label="질문 진행">
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-lime-deep" : "bg-surface-strong"}`}
          />
        ))}
      </div>

      <div className="rise">
        <div className="mt-6 flex items-center justify-between">
          <p className="text-base font-bold text-lime-deep">
            질문 {step + 1} <span className="text-subtle">/ {total}</span>
          </p>
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="title-xl">{q.title}</h1>
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] bg-lime-soft">{q.icon}</span>
        </div>
        {q.hint && <p className="mt-2 text-[1.05rem] text-muted">{q.hint}</p>}
        <div className="mt-4">
          <SpeakButton text={speech} label="질문 읽어 주세요" />
        </div>

        <div
          role={multi ? "group" : "radiogroup"}
          aria-label={q.title}
          className={`mt-6 ${q.grid ? "grid grid-cols-2 gap-2.5" : "space-y-3"}`}
        >
          {q.options.map((o) => {
            const sel = isSelected(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role={multi ? "checkbox" : "radio"}
                aria-checked={sel}
                onClick={() => select(o.value)}
                className={`option ${q.grid ? "min-h-14 justify-center px-3 text-center text-[0.95rem]" : ""} ${
                  o.value === "unknown" && q.grid ? "col-span-2" : ""
                }`}
              >
                {o.icon && (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white">{o.icon}</span>
                )}
                <span className="flex-1">{o.label}</span>
                {!q.grid && <Indicator selected={sel} square={multi} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bottom-cta mt-auto">
        <button type="button" onClick={onNext} disabled={!answered} className="btn btn-primary">
          {step + 1 === total ? "결과 보기" : "다음"}
        </button>
      </div>
    </div>
  );
}

function Indicator({ selected, square }: { selected: boolean; square: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${square ? "rounded-xl" : "rounded-full"} ${
        selected ? "bg-lime-deep text-white" : "bg-white text-transparent shadow-[inset_0_0_0_2px_var(--surface-strong)]"
      }`}
    >
      <Check className="h-5 w-5" />
    </span>
  );
}

// 결과를 성격별로 묶어 훑어보기 쉽게 한다.
const GROUPS = [
  {
    title: "돈으로 받는 혜택",
    sub: "매달 또는 필요할 때 받는 돈이에요.",
    ids: ["basic-pension", "livelihood-benefit", "senior-jobs", "emergency-welfare"],
  },
  {
    title: "생활비 줄이기",
    sub: "요금과 병원비, 집세 부담을 덜어 줘요.",
    ids: ["energy-voucher", "telecom-discount", "medical-aid", "housing-benefit"],
  },
  {
    title: "돌봄·건강",
    sub: "돌봄 서비스와 무료 검사·접종이에요.",
    ids: ["senior-care", "long-term-care", "dementia-screening", "flu-vaccine"],
  },
];

const AGE_LABEL: Record<string, string> = {
  under30: "10~20대",
  "30_59": "30~50대",
  "60_64": "60~64세",
  "65_74": "65~74세",
  "75_plus": "75세 이상",
};
const HOUSEHOLD_LABEL: Record<string, string> = { alone: "혼자 사심", couple: "배우자와 사심", family: "가족과 사심" };

function Results({ answers, onRestart }: { answers: Answers; onRestart: () => void }) {
  const { matched, alreadyHas } = useMemo(() => matchPrograms(answers), [answers]);

  const profile = [
    answers.age && AGE_LABEL[answers.age],
    answers.region && answers.region !== "unknown" && answers.region,
    answers.household && HOUSEHOLD_LABEL[answers.household],
  ].filter((x): x is string => Boolean(x));

  const speech =
    `해당될 수 있는 혜택이 ${matched.length}개 있어요. ` +
    matched.map((p) => `${p.name}. ${p.short}`).join(" ") +
    " 최종 결정은 주민센터에서 해요.";

  return (
    <Page>
      <AutoSpeak text={speech} />
      <section className="rise relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-lime-soft to-white p-6 shadow-[0_0_0_1px_var(--line)]">
        <p className="text-[1.05rem] font-bold text-lime-deep">해당될 수 있는 혜택</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-[3rem] font-extrabold leading-none tracking-tight">{matched.length}</span>
          <span className="text-[1.4rem] font-extrabold">개를 찾았어요</span>
        </p>
        <p className="mt-2 text-base text-muted">최종 결정은 주민센터에서 해요.</p>
        {profile.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="답하신 내용">
            {profile.map((t) => (
              <li key={t} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-muted shadow-[0_0_0_1px_var(--line)]">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5">
          <SpeakButton text={speech} label="결과 읽어 주세요" />
        </div>
      </section>

      {matched.length === 0 ? (
        <p className="card-soft mt-6 text-[1.05rem]">
          골라 주신 답으로는 찾은 혜택이 없어요. 그래도 주민센터나 129에 물어보면 다른 지원을 찾을 수 있어요.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {GROUPS.map((g) => {
            const items = matched.filter((p) => g.ids.includes(p.id));
            if (items.length === 0) return null;
            return (
              <section key={g.title}>
                <h2 className="flex items-center gap-2 text-[1.1rem] font-extrabold">
                  {g.title}
                  <span className="rounded-full bg-lime px-2.5 text-sm font-extrabold text-lime-ink">{items.length}</span>
                </h2>
                <p className="mt-0.5 text-base text-muted">{g.sub}</p>
                <ul className="mt-4 space-y-3">
                  {items.map((p, i) => (
                    <ProgramCard key={p.id} p={p} delay={80 + i * 50} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {alreadyHas.length > 0 && (
        <section className="mt-10">
          <h2 className="title-lg">이미 받고 계신 혜택</h2>
          <p className="mt-1 text-base text-muted">준비물과 문의처를 다시 볼 수 있어요.</p>
          <ul className="mt-4 space-y-3">
            {alreadyHas.map((p) => (
              <ProgramCard key={p.id} p={p} muted />
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={onRestart} className="btn btn-ghost mt-6">
        <Refresh className="h-5 w-5" />
        처음부터 다시 답하기
      </button>

      <Disclaimer checkedAt={CHECKED_AT} />
    </Page>
  );
}
