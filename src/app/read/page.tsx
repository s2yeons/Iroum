"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Checklist } from "@/components/checklist";
import { GlossaryText } from "@/components/glossary-text";
import { ShareBar } from "@/components/share-bar";
import { AutoSpeak, SpeakButton } from "@/components/speech";
import {
  Alert,
  Check,
  ChevronRight,
  IllCamera,
  IllFile,
  IllPaste,
  IllSearch,
  Info,
  Lock,
  Phone,
  ProgramIcon,
  Refresh,
} from "@/components/icons";
import { Disclaimer, Page, SectionTitle, TopBar } from "@/components/ui";
import { SAMPLE_NOTICE } from "@/data/sample-notice";
import { hashText, ocrImage, pdfToText } from "@/lib/extract";
import type { SimplifyResponse, SimplifyResult } from "@/lib/simplify-schema";
import { ruleSimplify } from "@/lib/rule-simplify";
import { load, save } from "@/lib/storage";
import { verifyAgainstSource } from "@/lib/verify";
import { CHECKED_AT, findProgramsInText, getProgram } from "@/lib/welfare";

type Stage =
  | { kind: "choose" }
  | { kind: "extracting"; ratio: number; label: string }
  | { kind: "edit"; from: "photo" | "pdf" | "paste" }
  | { kind: "simplifying" }
  | { kind: "result"; result: SimplifyResult; hash: string; aiPending?: boolean }
  | { kind: "fallback"; error: string };

/** AI 없는 모드: 원문 문장을 그대로 골라 정리한다. 찾은 것이 없으면 null. */
function ruleResult(source: string): SimplifyResult | null {
  const { verified, removed } = verifyAgainstSource(ruleSimplify(source), source);
  const found =
    verified.conditions.length + verified.documents.length + verified.steps.length > 0 ||
    verified.deadline !== null ||
    verified.contact !== null;
  if (!found) return null;
  const linkedProgramIds = findProgramsInText(`${verified.title}\n${source}`)
    .slice(0, 2)
    .map((p) => p.id);
  return { ...verified, removed, linkedProgramIds, cached: false, mode: "rule" };
}

const RESULT_CACHE_KEY = "swb:simplify-cache";
const CACHE_MAX = 20;

export default function ReadPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "choose" });
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const onProgress = (ratio: number, label: string) => setStage({ kind: "extracting", ratio, label });

  const handleFile = async (file: File | undefined, from: "photo" | "pdf") => {
    if (!file) return;
    setInputError(null);
    onProgress(0, "준비 중이에요");
    try {
      const extracted = from === "pdf" ? await pdfToText(file, onProgress) : await ocrImage(file, onProgress);
      if (extracted.replace(/\s/g, "").length < 10) {
        setInputError("글자를 거의 찾지 못했어요. 밝은 곳에서 안내문이 화면에 꽉 차게 다시 찍어 주세요.");
        setStage({ kind: "choose" });
        return;
      }
      setText(extracted);
      setStage({ kind: "edit", from });
    } catch (e) {
      console.error(e);
      setInputError("파일을 읽지 못했어요. 다른 사진이나 글 붙여넣기로 해 주세요.");
      setStage({ kind: "choose" });
    }
  };

  // 화면을 떠났다가 늦게 도착한 AI 결과가 다른 안내문 화면을 덮지 않게 요청마다 번호를 붙인다.
  const requestId = useRef(0);

  /**
   * 1) AI 없는 모드 결과를 바로 보여 주고
   * 2) 뒤에서 AI를 기다렸다가 도착하면 AI 결과로 바꾼다.
   * 무료 AI는 1분 가까이 걸릴 수 있어서, 어르신이 빈 화면을 오래 보지 않게 한다.
   */
  const simplify = async () => {
    const source = text.trim();
    if (source.length < 20) {
      setInputError("글이 너무 짧아요. 안내문 내용을 더 넣어 주세요.");
      return;
    }
    setInputError(null);
    const id = ++requestId.current;
    setStage({ kind: "simplifying" });

    // 같은 문서는 다시 AI를 부르지 않는다(기기 안 캐시 → 서버 캐시 순서).
    const hash = await hashText(source);
    const local = load<Record<string, SimplifyResult>>(RESULT_CACHE_KEY, {});
    if (local[hash]) {
      setStage({ kind: "result", result: { ...local[hash], cached: true }, hash });
      return;
    }

    const rule = ruleResult(source);
    if (rule) setStage({ kind: "result", result: rule, hash, aiPending: true });

    let error = "인터넷 연결을 확인해 주세요.";
    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source }),
      });
      const data = (await res.json()) as SimplifyResponse;
      if (id !== requestId.current) return; // 그사이 다른 안내문으로 넘어감
      if (data.ok) {
        const keys = Object.keys(local);
        if (keys.length >= CACHE_MAX) delete local[keys[0]];
        save(RESULT_CACHE_KEY, { ...local, [hash]: data.result });
        setStage({ kind: "result", result: data.result, hash });
        return;
      }
      error = data.error;
    } catch {
      if (id !== requestId.current) return;
    }

    // AI를 쓸 수 없으면(키 없음·붐빔·연결 끊김) AI 없는 모드 결과를 그대로 둔다.
    if (rule) setStage({ kind: "result", result: rule, hash });
    else setStage({ kind: "fallback", error });
  };

  const reset = () => {
    requestId.current++;
    setText("");
    setInputError(null);
    setStage({ kind: "choose" });
  };

  const backFromStage = () => {
    requestId.current++;
    if (stage.kind === "edit" || stage.kind === "fallback" || stage.kind === "result") {
      setStage(stage.kind === "edit" ? { kind: "choose" } : { kind: "edit", from: "paste" });
    } else if (stage.kind === "choose") {
      if (history.length > 1) history.back();
      else router.push("/");
    }
  };

  const titles: Record<Stage["kind"], string> = {
    choose: "안내문 읽기",
    extracting: "글자 읽는 중",
    edit: "글 확인",
    simplifying: "바꾸는 중",
    result: "쉬운 설명",
    fallback: "낱말 뜻",
  };

  return (
    <>
      <TopBar onBack={backFromStage} title={titles[stage.kind]} />
      <Page width={stage.kind === "result" ? "wide" : stage.kind === "choose" || stage.kind === "edit" ? "medium" : "narrow"}>
        {stage.kind === "choose" && (
          <div className="rise">
            <AutoSpeak text="안내문 쉽게 읽기. 사진 찍기, PDF 올리기, 글 붙여넣기 중에서 골라 주세요." />
            <p className="text-[1.05rem] font-bold text-lime-deep">안내문 쉽게 읽기</p>
            <h1 className="title-xl mt-1">
              어려운 안내문,
              <br />
              쉬운 말로 바꿔 드려요
            </h1>
            <p className="mt-2 text-[1.05rem] text-muted">집에 온 안내문을 어떻게 넣을지 골라 주세요.</p>

            {inputError && <ErrorBox>{inputError}</ErrorBox>}

            <div className="mt-7 grid gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-4">
              <BigChoice
                icon={<IllCamera className="h-12 w-12" />}
                title="사진 찍어 올리기"
                sub="안내문을 사진으로 찍어요"
                primary
                onClick={() => photoRef.current?.click()}
              />
              <BigChoice
                icon={<IllFile className="h-12 w-12" />}
                title="PDF 파일 올리기"
                sub="받은 파일을 그대로 올려요"
                onClick={() => pdfRef.current?.click()}
              />
              <BigChoice
                icon={<IllPaste className="h-12 w-12" />}
                title="글 붙여넣기"
                sub="문자나 누리집 글을 복사해 넣어요"
                onClick={() => setStage({ kind: "edit", from: "paste" })}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setText(SAMPLE_NOTICE);
                setStage({ kind: "edit", from: "paste" });
              }}
              className="btn btn-ghost mt-3"
            >
              연습용 예시 안내문으로 해 보기
            </button>

            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0], "photo");
                e.target.value = "";
              }}
            />
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0], "pdf");
                e.target.value = "";
              }}
            />
            <p className="mt-8 flex items-start gap-3 rounded-2xl bg-surface p-4 text-base text-muted">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-lime-deep" />
              사진과 PDF의 글자는 이 기기 안에서 읽어요. 쉬운 말로 바꿀 때만 글이 서버를 거치고, 저장하지 않아요.
            </p>
          </div>
        )}

        {stage.kind === "extracting" && (
          <Waiting title={stage.label} ratio={stage.ratio} note="처음에는 글자 읽기 준비에 조금 걸려요." />
        )}

        {stage.kind === "edit" && (
          <div className="rise flex min-h-[calc(100dvh-6rem)] flex-col">
            <h1 className="title-xl">
              {stage.from === "paste" ? "안내문 글을 넣어 주세요" : "읽은 글자를 확인해 주세요"}
            </h1>
            <p className="mt-2 text-[1.05rem] text-muted">
              {stage.from === "paste" ? "입력 칸을 길게 눌러 붙여넣기를 하세요." : "틀린 글자가 있으면 눌러서 고칠 수 있어요."}
            </p>
            {inputError && <ErrorBox>{inputError}</ErrorBox>}
            <label htmlFor="doc" className="sr-only">
              안내문 내용
            </label>
            <div className="mt-5 rounded-3xl bg-surface p-1.5 transition-shadow focus-within:shadow-[0_0_0_3px_var(--lime-deep)]">
              <textarea
                id="doc"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={11}
                maxLength={15000}
                placeholder="여기에 안내문 글을 넣어 주세요"
                className="block w-full resize-none rounded-[1.25rem] bg-white p-4 text-[1.05rem] leading-relaxed outline-none placeholder:text-subtle"
              />
              <div className="flex items-center justify-between px-3 py-2 text-sm text-muted">
                <span>{text.length.toLocaleString()} / 15,000자</span>
                {text && (
                  <button type="button" onClick={() => setText("")} className="min-h-10 rounded-lg px-2 font-bold">
                    모두 지우기
                  </button>
                )}
              </div>
            </div>
            <div className="bottom-cta mt-auto">
              <button type="button" onClick={simplify} disabled={text.trim().length === 0} className="btn btn-primary">
                쉬운 말로 바꾸기
              </button>
            </div>
          </div>
        )}

        {stage.kind === "simplifying" && (
          <Waiting title="쉬운 말로 바꾸고 있어요" note="원문에 있는 내용만 골라 정리하는 중이에요. 30초쯤 걸릴 수 있어요." />
        )}

        {stage.kind === "result" && (
          <ResultView
            result={stage.result}
            hash={stage.hash}
            source={text}
            onReset={reset}
            aiPending={stage.aiPending === true}
          />
        )}

        {stage.kind === "fallback" && <FallbackView error={stage.error} source={text} onRetry={simplify} />}
      </Page>
    </>
  );
}

function ResultView({
  result: r,
  hash,
  source,
  onReset,
  aiPending,
}: {
  result: SimplifyResult;
  hash: string;
  source: string;
  onReset: () => void;
  aiPending: boolean;
}) {
  const linked = r.linkedProgramIds.map(getProgram).filter((p) => p !== undefined);

  const speech = [
    r.title,
    ...r.easy_summary,
    r.documents.length ? "챙길 것. " + r.documents.map((d) => d.easy).join(", ") : "",
    r.deadline ? "기한. " + r.deadline.easy : "",
    "최종 결정은 주민센터에서 해요.",
  ].join(" ");

  const shareText = [
    `[Iroum 이로움] ${r.title}`,
    ...r.easy_summary,
    "",
    ...(r.documents.length ? ["챙길 것", ...r.documents.map((d) => `☐ ${d.easy}`), ""] : []),
    ...(r.deadline ? [`기한: ${r.deadline.easy}`] : []),
    ...(r.contact ? [`문의: ${r.contact.easy}`] : []),
    "※ 해당될 수 있어요. 최종 결정은 주민센터에서 해요.",
  ].join("\n");

  return (
    <>
      {!aiPending && <AutoSpeak text={speech} />}
      {/* 휴대폰은 한 줄(order 순서), 넓은 화면은 왼쪽 설명 + 오른쪽 기한·챙길 것 */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-12">
        <div className="contents lg:block">
          <div className="order-1">
            <section className="rise">
              <span className="chip">
                <Check className="h-4 w-4" />
                {r.mode === "rule" ? "원문 문장을 그대로 골라 정리했어요" : "원문에 있는 내용만 정리했어요"}
              </span>
              <h1 className="title-xl mt-3 lg:text-[2.2rem]">{r.title}</h1>
              <div className="mt-5">
                <SpeakButton text={speech} />
              </div>
            </section>
          </div>
          <div className="order-2">
            {r.mode === "rule" && aiPending && (
              <p role="status" className="mt-6 flex items-center gap-3 rounded-2xl bg-lime-soft p-4 text-base font-bold text-lime-ink">
                <span
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 rounded-full border-[3px] border-lime-strong border-t-lime-deep motion-safe:animate-spin"
                />
                AI가 더 쉬운 말로 다듬고 있어요. 1분쯤 걸릴 수 있어요. 그동안 아래 내용을 먼저 보세요.
              </p>
            )}
            {r.mode === "rule" && !aiPending && (
              <p className="mt-6 flex gap-3 rounded-2xl bg-surface p-4 text-base text-muted">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-lime-deep" />
                지금은 AI를 쓸 수 없어서, 안내문의 문장을 그대로 골라 항목별로 나눴어요. 색칠된 낱말을 누르면 쉬운 뜻이 나와요.
              </p>
            )}
          </div>
          <div className="order-3">
            <section className="rise mt-7 rounded-[1.75rem] bg-lime-soft p-6" style={{ animationDelay: "60ms" }}>
              <SectionTitle>쉽게 말하면</SectionTitle>
              {r.easy_summary.length ? (
                <ul className="space-y-3 text-[1.05rem]">
                  {r.easy_summary.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-lime-ink">
                        <Check className="h-4 w-4" />
                      </span>
                      <span>
                        <GlossaryText text={s} extra={r.terms} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <NotInDoc />
              )}
            </section>
          </div>
          <div className="order-5">
            <Section title="누가 해당되나요">
              {r.conditions.length ? <QuotedList items={r.conditions} terms={r.terms} /> : <NotInDoc />}
            </Section>
          </div>
          <div className="order-7">
            <Section title="신청 순서">
              {r.steps.length ? (
                <ol className="relative space-y-5">
                  {r.steps.map((s, i) => (
                    <li key={i} className="relative flex gap-4">
                      {i < r.steps.length - 1 && (
                        <span aria-hidden="true" className="absolute left-[1.15rem] top-10 h-[calc(100%-1rem)] w-0.5 bg-surface-strong" />
                      )}
                      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-[1.05rem] font-extrabold text-lime-ink">
                        {i + 1}
                      </span>
                      <span className="pt-1.5 text-[1.05rem] font-medium">
                        <GlossaryText text={s.easy} extra={r.terms} />
                        <Quote text={s.source_quote} />
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <NotInDoc />
              )}
            </Section>
          </div>
          <div className="order-8">
            {r.removed.length > 0 && (
              <div role="note" className="mt-8 flex gap-3 rounded-3xl bg-warn-bg p-5 text-warn-ink">
                <Alert className="h-7 w-7 shrink-0" />
                <div>
                  <p className="text-[1.05rem] font-extrabold">원문을 확인하세요</p>
                  <p className="mt-1 text-base">
                    원문에서 근거를 찾지 못한 설명 {r.removed.length}개는 틀릴 수 있어서 빼 두었어요. 안내문을 직접 보거나
                    주민센터에 물어보세요.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="order-9">
            {linked.map((p) => (
              <section key={p.id} className="card mt-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-soft">
                    <ProgramIcon id={p.id} className="h-9 w-9" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-lime-deep">공식 자료에서 찾았어요</p>
                    <h2 className="text-[1.15rem] font-extrabold">{p.name} 공식 기준</h2>
                  </div>
                </div>
                <p className="mt-3 text-base text-muted">안내문과 다른 점이 있으면 공식 기준을 확인하세요. (확인일 {CHECKED_AT})</p>
                <ul className="mt-3 space-y-1.5 text-[1.05rem]">
                  {p.official.eligibility.map((e) => (
                    <li key={e} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-subtle" />
                      <span>
                        <GlossaryText text={e} />
                      </span>
                    </li>
                  ))}
                </ul>
                <a href={`/benefits/${p.id}`} className="btn btn-secondary mt-5">
                  준비물·신청 방법 자세히 보기 <ChevronRight className="h-5 w-5" />
                </a>
              </section>
            ))}
          </div>
          <div className="order-10">
            <details className="no-print group mt-8 rounded-3xl bg-surface">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 text-[1.05rem] font-bold">
                원문 전체 보기
                <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
              </summary>
              <p className="whitespace-pre-wrap px-5 pb-5 text-base leading-relaxed">
                <GlossaryText text={source} extra={r.terms} />
              </p>
            </details>
          </div>
          <div className="order-13">
            <Disclaimer checkedAt={linked.length ? CHECKED_AT : undefined} sources={linked.flatMap((p) => p.sources)} />
            {r.cached && <p className="mt-3 text-center text-sm text-muted">전에 읽은 안내문이라 저장된 설명을 보여 드려요.</p>}
          </div>
        </div>
        <aside className="contents lg:block" aria-label="기한과 챙길 것">
          <div className="order-4">
            {(r.deadline || r.contact) && (
              <dl className="mt-3 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:mt-0">
                <div className="card-soft p-4">
                  <dt className="text-sm font-bold text-muted">기한</dt>
                  <dd className="mt-1 text-base font-extrabold leading-snug">{r.deadline?.easy ?? "안내문에 없어요"}</dd>
                </div>
                <div className="card-soft p-4">
                  <dt className="text-sm font-bold text-muted">물어볼 곳</dt>
                  <dd className="mt-1 text-base font-extrabold leading-snug">
                    {r.contact ? <TelLinks text={r.contact.easy} /> : "안내문에 없어요"}
                  </dd>
                </div>
              </dl>
            )}
          </div>
          <div className="order-6">
            <Section title="챙길 것" className="lg:card lg:mt-6">
              {r.documents.length ? (
                <>
                  <Checklist
                    storageKey={`doc-${hash.slice(0, 16)}`}
                    items={r.documents.map((d, i) => ({ id: String(i), text: d.easy }))}
                    source="안내문 원문 (아래 '원문 근거 보기')"
                  />
                  <QuoteDetails items={r.documents} />
                </>
              ) : (
                <NotInDoc />
              )}
            </Section>
          </div>
          <div className="order-11">
            <ShareBar title={r.title} text={shareText} />

            <button type="button" onClick={onReset} className="btn btn-ghost no-print mt-3">
              <Refresh className="h-5 w-5" /> 다른 안내문 읽기
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

/** 실패 시: 원문과 용어 사전으로 대체 표시 */
function FallbackView({ error, source, onRetry }: { error: string; source: string; onRetry: () => void }) {
  return (
    <div className="rise">
      <AutoSpeak text={`${error} 대신 원문에 있는 어려운 낱말 뜻을 보여 드려요.`} />
      <div className="flex gap-3 rounded-3xl bg-warn-bg p-5 text-warn-ink" role="alert">
        <Alert className="h-7 w-7 shrink-0" />
        <div>
          <p className="text-[1.05rem] font-extrabold">{error}</p>
          <p className="mt-1 text-base">대신 원문의 어려운 낱말 뜻을 알려 드릴게요.</p>
        </div>
      </div>
      <h1 className="title-xl mt-8">원문과 낱말 뜻</h1>
      <p className="mt-2 text-[1.05rem] text-muted">색칠된 낱말을 누르면 쉬운 뜻이 나와요.</p>
      <div className="card mt-5">
        <p className="whitespace-pre-wrap text-[1.05rem] leading-relaxed">
          <GlossaryText text={source} />
        </p>
      </div>
      <div className="bottom-cta mt-6">
        <button type="button" onClick={onRetry} className="btn btn-primary">
          <Refresh className="h-5 w-5" /> 다시 해 보기
        </button>
      </div>
      <Disclaimer />
    </div>
  );
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`mt-10 ${className}`}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}

function QuotedList({ items, terms }: { items: { easy: string; source_quote: string }[]; terms: SimplifyResult["terms"] }) {
  return (
    <ul className="space-y-2">
      {items.map((c, i) => (
        <li key={i} className="rounded-2xl bg-surface px-4 py-3.5 text-[1.05rem] font-medium">
          <GlossaryText text={c.easy} extra={terms} />
          <Quote text={c.source_quote} />
        </li>
      ))}
    </ul>
  );
}

function QuoteDetails({ items }: { items: { easy: string; source_quote: string }[] }) {
  return (
    <details className="no-print group mt-3">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-1 text-base font-bold text-lime-deep">
        원문 근거 보기 <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
      </summary>
      <ul className="mt-2 space-y-3">
        {items.map((d, i) => (
          <li key={i} className="text-base">
            <b>{d.easy}</b>
            <Quote text={d.source_quote} />
          </li>
        ))}
      </ul>
    </details>
  );
}

/** 모든 항목에 근거가 된 원문 문장을 함께 보여 준다. */
function Quote({ text }: { text: string }) {
  return (
    <span className="mt-2 block border-l-[3px] border-lime-strong pl-3 text-[0.85rem] leading-relaxed text-muted">
      <span className="font-bold">원문</span> “{text}”
    </span>
  );
}

function TelLinks({ text }: { text: string }) {
  const parts = text.split(/(\d{2,4}-\d{3,4}-\d{4}|\b1\d{2,3}(?:-\d{4})?\b)/);
  return (
    <>
      {parts.map((p, i) =>
        /\d/.test(p) && i % 2 === 1 ? (
          <a key={i} href={`tel:${p}`} className="inline-flex items-center gap-1 text-lime-deep underline underline-offset-4">
            <Phone className="h-4 w-4" />
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function NotInDoc() {
  return <p className="rounded-2xl bg-surface px-4 py-3.5 text-[1.05rem] text-muted">안내문에 나와 있지 않아요.</p>;
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-5 flex gap-3 rounded-2xl bg-warn-bg p-4 text-[1.05rem] font-bold text-warn-ink">
      <Alert className="h-6 w-6 shrink-0" />
      {children}
    </p>
  );
}

function BigChoice({
  icon,
  title,
  sub,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-24 w-full items-center gap-4 rounded-3xl p-4 pr-3 text-left transition-[background-color,transform] active:scale-[0.99] lg:h-full lg:min-h-56 lg:flex-col lg:items-start lg:justify-between lg:p-7 ${
        primary ? "bg-lime text-lime-ink hover:bg-lime-strong" : "bg-surface hover:bg-surface-strong"
      }`}
    >
      <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${primary ? "bg-white/70" : "bg-white"}`}>
        {icon}
      </span>
      <span className="flex-1 lg:flex-none">
        <span className="block text-[1.15rem] font-extrabold">{title}</span>
        <span className={`mt-0.5 block text-base ${primary ? "" : "text-muted"}`}>{sub}</span>
      </span>
      <ChevronRight className="h-6 w-6 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 lg:hidden" />
    </button>
  );
}

function Waiting({ title, ratio, note }: { title: string; ratio?: number; note?: string }) {
  const pct = ratio !== undefined ? Math.round(ratio * 100) : undefined;
  return (
    <div className="rise flex min-h-[60dvh] flex-col items-center justify-center text-center" role="status" aria-live="polite">
      <div className="relative h-32 w-32">
        <span className="absolute inset-0 rounded-full bg-lime-soft motion-safe:animate-ping" style={{ animationDuration: "1.8s" }} />
        <span className="absolute inset-3 rounded-full bg-lime-soft" />
        <span className="absolute inset-0 flex items-center justify-center">
          <IllSearch className="h-16 w-16 motion-safe:animate-[float_1.6s_ease-in-out_infinite]" />
        </span>
      </div>
      <p className="title-lg mt-8">{title}</p>
      {pct !== undefined && pct > 0 && (
        <div className="mt-4 w-48">
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-strong">
            <div className="h-full rounded-full bg-lime-deep transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-base font-bold text-lime-deep">{pct}%</p>
        </div>
      )}
      {note && <p className="mt-2 text-[1.05rem] text-muted">{note}</p>}
    </div>
  );
}
