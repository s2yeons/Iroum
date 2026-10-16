"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "./settings";

/*
 * 브라우저 내장 음성 인식(Web Speech API). 크롬·엣지·사파리에서 동작한다.
 * 크롬은 소리를 구글 음성 인식 서버로 보내 글자로 바꾼다.
 */

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; length: number; [i: number]: RecognitionAlternative };
type RecognitionEvent = { resultIndex: number; results: { length: number; [i: number]: RecognitionResult } };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: (track?: MediaStreamTrack) => void;
  abort: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type ListenError = "denied" | "no-mic" | "network" | "other";

export type ListenOutcome =
  | { ok: true; alternatives: string[] } // 알아들은 말 (후보 여러 개)
  | { ok: false; reason: "silence" | "aborted" | ListenError };

export function useListen() {
  const { micId } = useSettings();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState(""); // 말하는 중에 보이는 글자
  const recRef = useRef<Recognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const genRef = useRef(0); // 취소할 때마다 올린다 (마이크를 여는 중에 취소된 것을 알아채려고)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 기능 확인
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const cancel = useCallback(() => {
    genRef.current++;
    recRef.current?.abort();
  }, []);

  useEffect(() => cancel, [cancel]);

  /** 한 마디를 듣고 끝낸다. */
  const listen = useCallback(async (): Promise<ListenOutcome> => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return { ok: false, reason: "other" };
    recRef.current?.abort();
    const gen = ++genRef.current;

    // 마이크 소리를 직접 열어 넘긴다. 에코 제거를 켜서 화면이 읽어 주는 소리가 덜 들어가게 하고,
    // USB 마이크를 골랐으면 그 마이크를 쓴다. (이 기능이 없는 브라우저는 컴퓨터의 기본 마이크를 쓴다)
    let track: MediaStreamTrack | undefined;
    if (navigator.mediaDevices?.getUserMedia) {
      const audio: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
      try {
        const stream = await navigator.mediaDevices
          .getUserMedia({ audio: micId ? { ...audio, deviceId: { exact: micId } } : audio })
          // 고른 마이크가 빠졌으면 기본 마이크로 듣는다.
          .catch(() => (micId ? navigator.mediaDevices.getUserMedia({ audio }) : Promise.reject()));
        streamRef.current = stream;
        track = stream.getAudioTracks()[0];
      } catch {
        // 마이크를 열지 못하면 음성 인식이 직접 열게 둔다. (없으면 거기서 알려 준다)
      }
    }
    if (gen !== genRef.current) {
      releaseMic();
      return { ok: false, reason: "aborted" };
    }

    return new Promise<ListenOutcome>((resolve) => {
      const rec = new Ctor();
      recRef.current = rec;
      rec.lang = "ko-KR";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 5;

      let outcome: ListenOutcome = { ok: false, reason: "silence" };

      rec.onresult = (e) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        setHeard(text);
        const last = e.results[e.results.length - 1];
        if (last.isFinal) {
          const alternatives: string[] = [];
          for (let i = 0; i < last.length; i++) alternatives.push(last[i].transcript);
          // 앞부분과 이어 붙인 전체 문장도 후보로 넣는다.
          if (e.results.length > 1) alternatives.unshift(text);
          outcome = { ok: true, alternatives };
        }
      };
      rec.onerror = (e) => {
        const map: Record<string, ListenOutcome> = {
          "no-speech": { ok: false, reason: "silence" },
          aborted: { ok: false, reason: "aborted" },
          "not-allowed": { ok: false, reason: "denied" },
          "service-not-allowed": { ok: false, reason: "denied" },
          "audio-capture": { ok: false, reason: "no-mic" },
          network: { ok: false, reason: "network" },
        };
        outcome = map[e.error] ?? { ok: false, reason: "other" };
      };
      rec.onend = () => {
        if (recRef.current === rec) recRef.current = null;
        releaseMic();
        setListening(false);
        resolve(outcome);
      };

      setHeard("");
      setListening(true);
      try {
        if (track) rec.start(track);
        else rec.start();
      } catch {
        // 마이크 지정을 지원하지 않는 브라우저: 기본 마이크로 다시 시작
        try {
          releaseMic();
          rec.start();
        } catch {
          setListening(false);
          resolve({ ok: false, reason: "other" });
        }
      }
    });
  }, [micId]);

  return { listen, cancel, listening, heard, supported };
}

export const LISTEN_ERROR_TEXT: Record<ListenError, string> = {
  denied: "마이크를 쓸 수 없게 막혀 있어요. 주소창 옆 자물쇠를 눌러 마이크를 허용해 주세요.",
  "no-mic": "마이크를 찾지 못했어요. USB 마이크가 잘 꽂혀 있는지 봐 주세요.",
  network: "인터넷이 연결되지 않아 말을 알아듣지 못했어요.",
  other: "말을 알아듣지 못했어요. 화면을 눌러 골라 주세요.",
};

/** 컴퓨터에 연결된 마이크 목록. USB 마이크를 꽂거나 빼면 바로 바뀐다. */
export function useMicrophones() {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [allowed, setAllowed] = useState(false);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput");
    setMics(list);
    // 허락 전에는 이름이 비어 있다.
    setAllowed(list.some((d) => d.label !== ""));
  }, []);

  /** 마이크 사용 허락을 받고 이름까지 보이게 한다. */
  const requestAccess = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
    } catch {
      return false;
    }
    await refresh();
    return true;
  }, [refresh]);

  useEffect(() => {
    if (!navigator.mediaDevices) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 연결된 장치는 브라우저에서만 알 수 있다
    refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refresh);
  }, [refresh]);

  return { mics, allowed, requestAccess };
}
