"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { IllVoice, Mic, ProgramIcon, Refresh } from "@/components/icons";
import { LISTEN_ERROR_TEXT, useListen, type ListenError } from "@/components/listen";
import { ProgramCard } from "@/components/program-card";
import { useSettings } from "@/components/settings";
import { AutoSpeak, SpeakButton, toSpoken, useSpeech } from "@/components/speech";
import { Disclaimer, Page, TopBar } from "@/components/ui";
import { load, save } from "@/lib/storage";
import { extractAll, isEcho, matchSpoken, saysDontKnow } from "@/lib/voice-match";
import { CHECKED_AT, matchPrograms, type AgeBand, type Answers, type Household, type IncomeBand, type Support } from "@/lib/welfare";

/*
 * 지원금 찾기 — 대화 한 번으로 묻는다.
 * 결과에 실제로 쓰이는 것은 나이·형편·받는 지원 세 가지뿐이라 이것만 묻는다.
 * "일흔두 살이고 형편이 어려워요. 기초연금 받아요."처럼 한 번에 말하면 한 번에 끝나고,
 * 빠진 것이 있을 때만 그것만 다시 묻는다. (AI 없이 낱말 규칙으로 알아듣는다)
 */

type Field = "age" | "income" | "supports";
const FIELDS: Field[] = ["age", "income", "supports"];

type Option = { value: string; label: string };

const CHOICES: Record<Field, { title: string; options: Option[] }> = {
  age: {
    title: "나이",
    options: [
      { value: "60_64", label: "60~64세" },
      { value: "65_74", label: "65~74세" },
      { value: "75_plus", label: "75세 이상" },
      { value: "30_59", label: "30~50대" },
      { value: "under30", label: "10~20대" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
  income: {
    title: "생활 형편",
    options: [
      { value: "basic", label: "기초생활수급을 받아요" },
      { value: "low", label: "넉넉하지 않아요" },
      { value: "mid", label: "보통이거나 여유 있어요" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
  supports: {
    title: "받고 있는 지원",
    options: [
      { value: "basic_pension", label: "기초연금" },
      { value: "livelihood", label: "생계·의료·주거급여" },
      { value: "ltc", label: "장기요양등급" },
      { value: "none", label: "없어요" },
    ],
  },
};

const ASK: Record<Field, string> = {
  age: "연세가 어떻게 되세요?",
  income: "생활 형편은 어떠세요?",
  supports: "지금 받고 계신 지원이 있나요? 기초연금이나 장기요양 같은 거요.",
};

const GREETING =
  "안녕하세요. 받을 수 있는 혜택을 찾아 드릴게요. 연세와 생활 형편, 지금 받고 계신 지원을 한 번에 편하게 말씀해 주세요.";
const EXAMPLE = "“일흔두 살이고 형편이 어려워요. 기초연금 받아요.”";

const AGE_LABEL: Record<string, string> = {
  under30: "10~20대",
  "30_59": "30~50대",
  "60_64": "60~64세",
  "65_74": "65~74세",
  "75_plus": "75세 이상",
};
const INCOME_SAY: Record<string, string> = {
  basic: "기초생활수급을 받고",
  low: "형편이 넉넉하지 않고",
  mid: "형편은 보통 이상이고",
  unknown: "형편은 잘 모르시고",
};
const SUPPORT_LABEL: Record<string, string> = { basic_pension: "기초연금", livelihood: "생계·의료·주거급여", ltc: "장기요양등급" };
const HOUSEHOLD_LABEL: Record<string, string> = { alone: "혼자 사심", couple: "배우자와 사심", family: "가족과 사심" };

const missing = (a: Answers): Field[] => FIELDS.filter((f) => a[f] === undefined);

/** 알아들은 것을 되짚어 말한다: "65~74세, 형편이 넉넉하지 않고, 기초연금을 받고 계시는군요." */
function recap(p: Partial<Answers>): string {
  const parts: string[] = [];
  if (p.age) parts.push(p.age === "unknown" ? "나이는 잘 모르시고" : `${AGE_LABEL[p.age]}이시고`);
  if (p.income) parts.push(INCOME_SAY[p.income]);
  if (p.supports) parts.push(p.supports.length === 0 ? "받는 지원은 없으시고" : `${p.supports.map((s) => SUPPORT_LABEL[s]).join(", ")}을 받고 계시고`);
  if (parts.length === 0) return "";
  return parts.join(", ").replace(/(이시고|받고|않고|이상이고|모르시고|없으시고|계시고)$/, (m) =>
    ({ 이시고: "이시군요", 받고: "받고 계시군요", 않고: "않으시군요", 이상이고: "이상이시군요", 모르시고: "모르시는군요", 없으시고: "없으시군요", 계시고: "계시는군요" })[m] ?? m,
  ) + ".";
}

/** 말한 문장 → 새로 알게 된 답 */
function understand(alternatives: string[], current: Answers): Partial<Answers> {
  for (const alt of alternatives) {
    const ex = extractAll(alt);
    const patch: Partial<Answers> = {};
    if (ex.age) patch.age = ex.age as AgeBand;
    if (ex.income) patch.income = ex.income as IncomeBand;
    if (ex.supports) patch.supports = ex.supports as Support[];
    if (ex.household) patch.household = ex.household as Household;
    if (ex.region) patch.region = ex.region;
    if (patch.age || patch.income || patch.supports) return patch;
  }
  // 한 가지만 남았으면 그 질문의 대답으로 본다 ("없어요", "보통이요", "일흔둘")
  const miss = missing(current);
  if (miss.length === 1) {
    const f = miss[0];
    const m = matchSpoken(f, alternatives, CHOICES[f].options);
    if (m.kind === "answer") return toPatch(f, m.values);
  }
  if (alternatives.some(saysDontKnow)) {
    const patch: Partial<Answers> = {};
    for (const f of miss) Object.assign(patch, toPatch(f, [f === "supports" ? "none" : "unknown"]));
    return patch;
  }
  return {};
}

function toPatch(f: Field, values: string[]): Partial<Answers> {
  if (f === "supports") return { supports: values.includes("none") ? [] : (values as Support[]) };
  return { [f]: values[0] } as Partial<Answers>;
}

type Msg = { id: number; from: "bot" | "me"; text: string; ask?: Field[]; done?: boolean };

const ANSWERS_KEY = "swb:answers";
const DONE_KEY = "swb:find-done";

export default function FindPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);

  // 답은 이 기기에만 저장한다 (서버로 보내지 않음)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 저장된 답은 브라우저에서만 읽을 수 있다 */
    const saved = load<Answers>(ANSWERS_KEY, {});
    setAnswers(saved);
    setDone(load<boolean>(DONE_KEY, false) && missing(saved).length === 0);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const finish = (a: Answers) => {
    save(ANSWERS_KEY, a);
    save(DONE_KEY, true);
    setAnswers(a);
    setDone(true);
    window.scrollTo({ top: 0 });
  };

  const restart = () => {
    save(ANSWERS_KEY, {});
    save(DONE_KEY, false);
    setAnswers({});
    setEditing(false);
    setDone(false);
  };

  if (!ready) return <TopBar backHref="/" />;

  if (done) {
    return (
      <>
        <TopBar
          onBack={() => {
            save(DONE_KEY, false);
            setEditing(true);
            setDone(false);
          }}
          title="찾은 혜택"
        />
        <Results answers={answers} onRestart={restart} />
      </>
    );
  }

  return (
    <>
      <TopBar backHref="/" title="지원금 찾기" />
      <Chat key={editing ? "edit" : "new"} initial={answers} editing={editing} onFinish={finish} onRestart={restart} />
    </>
  );
}

function firstMessage(initial: Answers, editing: boolean): Msg {
  if (editing) {
    return {
      id: 1,
      from: "bot",
      text: `${recap(initial)} 고치실 내용을 말씀해 주세요. 예를 들어 “형편은 보통이에요”처럼요.`,
      ask: FIELDS,
    };
  }
  const miss = missing(initial);
  if (miss.length < FIELDS.length) {
    return { id: 1, from: "bot", text: `이어서 할게요. ${miss.map((f) => ASK[f]).join(" ")}`, ask: miss };
  }
  return { id: 1, from: "bot", text: GREETING, ask: FIELDS };
}

function Chat({
  initial,
  editing,
  onFinish,
  onRestart,
}: {
  initial: Answers;
  editing: boolean;
  onFinish: (a: Answers) => void;
  onRestart: () => void;
}) {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [msgs, setMsgs] = useState<Msg[]>(() => [firstMessage(initial, editing)]);
  const [draft, setDraft] = useState("");
  const idRef = useRef(1);

  const lastBot = [...msgs].reverse().find((m) => m.from === "bot")!;
  const answered = msgs.length > 1;

  // 새 말이 오면 맨 아래로 (아래에 붙은 입력칸에 가리지 않게 페이지 끝까지)
  useEffect(() => {
    if (msgs.length > 1) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  /** 사용자의 말(또는 누른 버튼)을 받아 다음 말을 정한다 */
  const respond = (shown: string, patch: Partial<Answers>) => {
    const next: Answers = { ...answers, ...patch };
    // 고치는 중에는 이미 답한 것도 다시 말하면 바꾼다
    setAnswers(next);
    save(ANSWERS_KEY, next);

    const understood = Object.keys(patch).some((k) => FIELDS.includes(k as Field));
    const miss = missing(next);
    let text: string;
    let ask: Field[] | undefined = miss;
    let finished = false;
    if (!understood) {
      text = `잘 못 알아들었어요. ${(miss.length ? miss : FIELDS).map((f) => ASK[f]).join(" ")} 아래에서 눌러 고르셔도 돼요.`;
      if (!miss.length) ask = FIELDS;
    } else if (miss.length) {
      text = `${recap(patch)} ${miss.length === 1 ? "하나만" : "몇 가지만"} 더 여쭤볼게요. ${miss.map((f) => ASK[f]).join(" ")}`;
    } else {
      text = `${recap(patch)} 이제 혜택을 찾아 드릴게요.`;
      ask = undefined;
      finished = true;
    }
    setMsgs((prev) => [
      ...prev,
      { id: ++idRef.current, from: "me", text: shown },
      { id: ++idRef.current, from: "bot", text, ask, done: finished },
    ]);
  };

  const sendText = (alternatives: string[]) => {
    const shown = alternatives[0]?.trim();
    if (!shown) return;
    respond(shown, understand(alternatives, answers));
  };

  const choose = (f: Field, o: Option) => respond(o.label, toPatch(f, [o.value]));

  // 다 알아들었으면 마무리 말을 들려준 뒤(소리를 안 쓰면 잠깐 뒤) 결과로 간다
  const goResults = useEffectEvent(() => onFinish(answers));
  const voice = useVoiceTurn(lastBot, sendText);
  useEffect(() => {
    if (!lastBot.done || voice.active) return;
    const t = setTimeout(() => goResults(), 1800);
    return () => clearTimeout(t);
  }, [lastBot, voice.active]);
  useEffect(() => {
    if (lastBot.done && voice.active && voice.status === "finished") goResults();
  }, [lastBot, voice.active, voice.status]);

  return (
    <Page>
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
        {!voice.active && <AutoSpeak text={lastBot.text} />}

        <ol className="flex-1 space-y-4" aria-live="polite">
          {msgs.map((m) =>
            m.from === "bot" ? (
              <li key={m.id} className="rise flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-soft">
                  <IllVoice className="h-9 w-9" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="rounded-3xl rounded-tl-md bg-surface px-5 py-4 text-[1.1rem] font-bold leading-relaxed">{m.text}</p>
                  {m.id === 1 && !editing && !answered && (
                    <p className="mt-2 px-1 text-base text-muted">예) {EXAMPLE}</p>
                  )}
                </div>
              </li>
            ) : (
              <li key={m.id} className="rise flex justify-end">
                <p className="max-w-[85%] rounded-3xl rounded-tr-md bg-lime px-5 py-3 text-[1.1rem] font-bold text-lime-ink">{m.text}</p>
              </li>
            ),
          )}
        </ol>

        {/* 말 대신 눌러서 고르기: 아직 모르는 것만 */}
        {lastBot.ask && (
          <div className="mt-5 space-y-4">
            {lastBot.ask.map((f) => (
              <section key={f}>
                <h2 className="px-1 text-base font-bold text-muted">{CHOICES[f].title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHOICES[f].options.map((o) => {
                    const sel = f === "supports"
                      ? o.value === "none" ? answers.supports?.length === 0 : (answers.supports ?? []).includes(o.value as Support)
                      : answers[f] === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => choose(f, o)}
                        aria-pressed={sel}
                        className={`min-h-12 rounded-full px-4 text-[1.05rem] font-bold transition-colors ${
                          sel ? "bg-lime-soft text-lime-ink shadow-[inset_0_0_0_2px_var(--lime-deep)]" : "bg-white shadow-[inset_0_0_0_1.5px_var(--line)] hover:bg-surface"
                        }`}
                      >
                        {f === "supports" && o.value !== "none" && (
                          <ProgramIcon
                            id={{ basic_pension: "basic-pension", livelihood: "livelihood-benefit", ltc: "long-term-care" }[o.value]!}
                            className="-ml-1 mr-1.5 inline h-6 w-6 align-[-5px]"
                          />
                        )}
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        {lastBot.done && (
          <button type="button" onClick={() => onFinish(answers)} className="btn btn-primary mt-6">
            찾은 혜택 보기
          </button>
        )}

        {/* 말하기 · 글쓰기 */}
        {!lastBot.done && (
          <div className="bottom-cta mt-6 space-y-3">
            {voice.supported && <VoiceButton voice={voice} />}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendText([draft]);
                setDraft("");
              }}
              className="flex gap-2"
            >
              <label htmlFor="say" className="sr-only">
                글로 대답하기
              </label>
              <input
                id="say"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="여기에 글로 써도 돼요"
                autoComplete="off"
                className="min-h-14 min-w-0 flex-1 rounded-2xl bg-surface px-4 text-[1.05rem] font-bold outline-none placeholder:font-medium placeholder:text-subtle focus:shadow-[inset_0_0_0_2px_var(--lime-deep)]"
              />
              <button type="submit" disabled={!draft.trim()} className="min-h-14 shrink-0 rounded-2xl bg-lime-ink px-5 text-[1.05rem] font-extrabold text-white disabled:bg-surface-strong disabled:text-subtle">
                보내기
              </button>
            </form>
            {answered && (
              <button type="button" onClick={onRestart} className="mx-auto flex items-center gap-1.5 text-base font-bold text-muted">
                <Refresh className="h-4 w-4" />
                처음부터 다시
              </button>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

// ---- 말로 대답하기 ----

type VoiceStatus = "idle" | "speaking" | "listening" | "paused" | "finished";

/**
 * 앱의 말을 읽어 주면서 바로 듣는다. 읽는 중에 대답해도 읽기를 멈추고 알아듣는다.
 * "말로 대답하기"를 켜 두었거나 마이크 버튼을 누르면 켜진다.
 */
function useVoiceTurn(bot: Msg, onHeard: (alternatives: string[]) => void) {
  const { voiceInput, ready } = useSettings();
  const { say, stop } = useSpeech();
  const { listen, cancel, listening, heard, supported } = useListen();
  const [manual, setManual] = useState(false); // 마이크 버튼으로 켬
  const [round, setRound] = useState(0);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<ListenError | null>(null);
  const [blocked, setBlocked] = useState(false);
  const active = ready && supported && (voiceInput || manual);
  const heardEvent = useEffectEvent((alts: string[]) => onHeard(alts));

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    // 읽는 소리가 마이크로 다시 들어온 것(에코)은 거른다. 인식 글자는 늦게 오므로 다 읽은 뒤 2초까지 거른다.
    const ECHO_TAIL_MS = 2000;
    let echoText: string | null = null;
    let echoUntil = 0;
    let readGen = 0;
    const read = (text: string) => {
      const g = ++readGen;
      echoText = `${text} ${toSpoken(text)}`;
      echoUntil = 0;
      setStatus("speaking");
      return say(text).then((result) => {
        if (g !== readGen || cancelled) return;
        echoUntil = Date.now() + ECHO_TAIL_MS;
        setBlocked(result === "blocked");
        setStatus("listening");
      });
    };
    const echoFilter = () => (echoText && (echoUntil === 0 || Date.now() < echoUntil) ? echoText : null);
    const options = bot.ask?.flatMap((f) => CHOICES[f].options) ?? [];

    (async () => {
      setError(null);
      if (bot.done) {
        // 마무리 말은 끝까지 들려준 뒤 결과로 간다
        await read(bot.text);
        if (!cancelled) setStatus("finished");
        return;
      }
      read(bot.text);
      let misses = 0;
      while (!cancelled) {
        const r = await listen();
        if (cancelled) return;
        if (!r.ok) {
          if (r.reason === "aborted") return;
          if (r.reason !== "silence") {
            readGen++;
            stop();
            setError(r.reason);
            setStatus("paused");
            return;
          }
          if (echoFilter()) continue; // 읽는 중에 조용한 것은 세지 않는다
          if (++misses >= 3) break;
          read("말씀이 들리지 않았어요. 다시 말씀해 주세요.");
          continue;
        }
        const echo = echoFilter();
        const alternatives = echo ? r.alternatives.filter((a) => !isEcho(a, echo, options)) : r.alternatives;
        if (alternatives.length === 0) continue; // 스피커 소리만 들렸다
        readGen++;
        stop();
        heardEvent(alternatives); // 새 말이 나오면 이 차례는 끝난다
        return;
      }
      if (!cancelled) {
        readGen++;
        setStatus("paused");
        await say("마이크 버튼을 누르고 말씀하시거나, 아래에서 골라 주세요.");
      }
    })();

    return () => {
      cancelled = true;
      cancel();
      stop();
    };
  }, [active, bot, round, say, stop, listen, cancel]);

  const press = () => {
    if (!active) setManual(true);
    else setRound((n) => n + 1);
  };

  return { active, supported, status, listening, heard, error, blocked, press };
}

function VoiceButton({ voice }: { voice: ReturnType<typeof useVoiceTurn> }) {
  const { active, status, listening, heard, error, blocked, press } = voice;
  const label = !active
    ? "눌러서 말로 대답하기"
    : blocked
      ? "눌러 주시면 읽어 드릴게요"
      : status === "speaking"
        ? "읽는 중에도 바로 말씀하셔도 돼요"
        : listening
          ? "듣고 있어요. 말씀해 주세요"
          : "눌러서 다시 말하기";
  const hot = active && listening && status !== "speaking";
  return (
    <div className="no-print">
      <button
        type="button"
        onClick={press}
        className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl text-[1.1rem] font-extrabold transition-colors ${
          hot ? "bg-lime-ink text-white" : "bg-lime text-lime-ink hover:bg-lime-strong"
        }`}
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lime-ink">
          {hot && <span className="absolute inset-0 rounded-full bg-lime motion-safe:animate-ping" aria-hidden="true" />}
          <Mic className="relative h-6 w-6" />
        </span>
        {label}
      </button>
      {active && heard && (
        <p className="mt-2 text-center text-base text-muted">
          들은 말: <span className="font-bold text-foreground">“{heard}”</span>
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-2xl bg-warn-bg p-4 text-[1.05rem] font-bold text-warn-ink">
          {LISTEN_ERROR_TEXT[error]}
        </p>
      )}
    </div>
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
    <Page width="wide">
      <AutoSpeak text={speech} />
      <section className="rise relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-lime-soft to-white p-6 shadow-[0_0_0_1px_var(--line)] sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-8 lg:p-10">
        <div>
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
        </div>
        <div className="mt-5 lg:mt-0">
          <SpeakButton text={speech} label="결과 읽어 주세요" />
        </div>
      </section>

      {matched.length === 0 ? (
        <p className="card-soft mt-6 text-[1.05rem]">
          골라 주신 답으로는 찾은 혜택이 없어요. 그래도 주민센터나 129에 물어보면 다른 지원을 찾을 수 있어요.
        </p>
      ) : (
        <div className="mt-8 space-y-10 lg:mt-12 lg:space-y-14">
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
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
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
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
            {alreadyHas.map((p) => (
              <ProgramCard key={p.id} p={p} muted />
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={onRestart} className="btn btn-ghost mx-auto mt-8 sm:w-auto sm:px-8">
        <Refresh className="h-5 w-5" />
        처음부터 다시 답하기
      </button>

      <Disclaimer checkedAt={CHECKED_AT} />
    </Page>
  );
}
