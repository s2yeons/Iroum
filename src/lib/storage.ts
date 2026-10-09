// 브라우저 저장소 접근은 사생활 보호 모드 등에서 실패할 수 있으므로 항상 감싼다.
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장이 안 되어도 화면은 계속 동작한다.
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}
