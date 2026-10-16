"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { load, save } from "@/lib/storage";

export type SpeechRate = "slow" | "normal";

type Settings = {
  largeFont: boolean;
  voiceGuide: boolean; // 켜면 질문·결과 화면을 자동으로 읽어 준다
  rate: SpeechRate;
  voiceInput: boolean; // 켜면 질문을 읽으면서 마이크로 대답을 듣는다
  micId: string; // 고른 마이크 (빈 값이면 컴퓨터 기본 마이크)
};

type Ctx = Settings & {
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
};

const DEFAULTS: Settings = { largeFont: false, voiceGuide: false, rate: "slow", voiceInput: false, micId: "" };
const KEY = "swb:settings";

const SettingsContext = createContext<Ctx>({ ...DEFAULTS, ready: false, update: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 설정은 브라우저에서만 읽을 수 있다
    setSettings({ ...DEFAULTS, ...load<Partial<Settings>>(KEY, {}) });
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.font = settings.largeFont ? "large" : "normal";
  }, [settings.largeFont]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(KEY, next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, ready, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
