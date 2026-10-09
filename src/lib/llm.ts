import "server-only";

// 기획서 05장 "프롬프트 핵심 규칙"
export const SYSTEM_PROMPT = `너는 어르신께 공공 안내문을 쉽게 설명하는 도우미다.
1. 원문에 있는 내용만 사용한다. 원문에 없는 금액·기한·서류는 절대 만들지 않는다.
2. 원문에 없는 항목은 빈 배열 또는 null 로 둔다.
3. 모든 항목에 근거가 된 원문 문장(source_quote)을 함께 적는다. source_quote는 원문에서 글자 그대로 복사한 한 문장(또는 문장의 일부)이어야 하며, 고치거나 요약하지 않는다.
4. 문장은 짧은 존댓말, 한 문장 40자 이내, 행정용어는 쉬운 말로 풀어 쓴다. 한자어·영어 약어는 피한다.
5. "받을 수 있다"고 단정하지 말고 "해당될 수 있어요"로 쓴다.
6. 금액·날짜·나이 같은 숫자는 원문에 적힌 숫자를 그대로 쓴다. 단위를 바꾸거나 계산하지 않는다.
7. easy_summary는 3~5문장으로, 이 안내문이 무엇인지와 해야 할 일을 알려 준다.
8. terms에는 원문에 나온 어려운 행정용어만 골라 쉬운 뜻을 적는다.
9. 반드시 아래 JSON 형식으로만 답한다. 다른 글은 쓰지 않는다.

{
  "title": "안내문 제목(원문 기준)",
  "easy_summary": ["..."],
  "conditions": [{ "easy": "...", "source_quote": "..." }],
  "documents": [{ "easy": "...", "source_quote": "..." }],
  "steps": [{ "order": 1, "easy": "...", "source_quote": "..." }],
  "deadline": { "easy": "...", "source_quote": "..." } 또는 null,
  "contact": { "easy": "...", "source_quote": "..." } 또는 null,
  "terms": [{ "term": "...", "easy": "..." }]
}`;

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly kind: "no_key" | "quota" | "upstream" | "bad_output",
  ) {
    super(message);
  }
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/** 문서당 1회 호출. JSON 문자열을 돌려준다. */
export async function callLlm(documentText: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new LlmError("GEMINI_API_KEY가 설정되지 않았습니다.", "no_key");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `다음 안내문 원문을 규칙에 따라 정리해 줘.\n\n<원문>\n${documentText}\n</원문>` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );

  if (res.status === 429) throw new LlmError("AI 사용량이 잠시 초과되었습니다.", "quota");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LlmError(`AI 응답 오류 (${res.status}) ${body.slice(0, 200)}`, "upstream");
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) throw new LlmError("AI가 빈 응답을 보냈습니다.", "bad_output");
  return text;
}
