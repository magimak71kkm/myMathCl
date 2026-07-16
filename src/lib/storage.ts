import type { AppSettings, ProblemSet } from '../types';

const SETTINGS_KEY = 'mathgen.settings.v1';
const HISTORY_KEY = 'mathgen.history.v1';

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-flash-latest',
  compatBaseUrl: 'https://openrouter.ai/api/v1',
  compatApiKey: '',
  compatModel: '',
  academyName: '',
  fontFamily: 'system',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const settings: AppSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    // 2026년 이후 신규 계정에서 gemini-2.5 계열이 차단되어 최신 별칭으로 이관
    if (settings.geminiModel === 'gemini-2.5-flash' || settings.geminiModel === 'gemini-2.0-flash') {
      settings.geminiModel = 'gemini-flash-latest';
    }
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadHistory(): ProblemSet[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProblemSet(set: ProblemSet): void {
  const history = loadHistory();
  history.unshift(set);
  // 저장 용량 보호: 최근 200세트까지만 보관
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
}

/** 문제 편집·교체 후 세트를 제자리에서 갱신 (기록에 없으면 새로 추가) */
export function updateProblemSet(set: ProblemSet): void {
  const history = loadHistory();
  const idx = history.findIndex((s) => s.id === set.id);
  if (idx === -1) history.unshift(set);
  else history[idx] = set;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
}

/** 백업 복원용: 기존 기록과 병합 (같은 id는 건너뜀), 최신순 정렬 */
export function mergeHistory(incoming: ProblemSet[]): { added: number; total: number } {
  const existing = loadHistory();
  const existingIds = new Set(existing.map((s) => s.id));
  const added = incoming.filter((s) => !existingIds.has(s.id));
  const merged = [...existing, ...added]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 200);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
  return { added: added.length, total: merged.length };
}

export function deleteProblemSet(id: string): ProblemSet[] {
  const next = loadHistory().filter((s) => s.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
