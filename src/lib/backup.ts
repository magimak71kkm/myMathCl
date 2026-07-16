import { LEVELS } from '../data/curriculum';
import type { Difficulty, Problem, ProblemSet, ProblemType, SchoolLevel } from '../types';
import { saveFile } from './download';
import { loadHistory, mergeHistory } from './storage';
import { sanitizeSvg } from './svg';

const VALID_TYPES: ProblemType[] = ['multiple_choice', 'short_answer', 'essay', 'true_false'];
const VALID_DIFFICULTIES: Difficulty[] = ['하', '중', '상'];

/** 생성 기록 전체를 JSON 파일로 다운로드. 반환값: 백업된 세트 수 */
export async function downloadBackup(): Promise<number> {
  const sets = loadHistory();
  if (sets.length === 0) return 0;
  const payload = {
    app: 'MathGen',
    version: 1,
    exportedAt: new Date().toISOString(),
    sets,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  await saveFile(blob, `MathGen_백업_${new Date().toISOString().slice(0, 10)}.json`);
  return sets.length;
}

function sanitizeProblem(raw: unknown): Problem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  const question = String(p.question ?? '').trim();
  const answer = String(p.answer ?? '').trim();
  if (!question || !answer) return null;
  const figure = typeof p.figure === 'string' ? sanitizeSvg(p.figure) : null;
  return {
    id: typeof p.id === 'string' && p.id ? p.id : crypto.randomUUID(),
    type: VALID_TYPES.includes(p.type as ProblemType) ? (p.type as ProblemType) : 'short_answer',
    question,
    choices: Array.isArray(p.choices) ? p.choices.map(String) : undefined,
    answer,
    explanation: String(p.explanation ?? '').trim(),
    figure: figure ?? undefined,
    difficulty: VALID_DIFFICULTIES.includes(p.difficulty as Difficulty)
      ? (p.difficulty as Difficulty)
      : undefined,
    points: typeof p.points === 'number' && p.points > 0 ? p.points : undefined,
  };
}

function sanitizeSet(raw: unknown): ProblemSet | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Record<string, unknown>;
  if (!Array.isArray(s.problems)) return null;
  const problems = s.problems
    .map(sanitizeProblem)
    .filter((p): p is Problem => p !== null);
  if (problems.length === 0) return null;
  const types = [...new Set(problems.map((p) => p.type))];
  return {
    id: typeof s.id === 'string' && s.id ? s.id : crypto.randomUUID(),
    createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now(),
    level: LEVELS.includes(s.level as SchoolLevel) ? (s.level as SchoolLevel) : '중1',
    topic: String(s.topic ?? '가져온 문제').trim() || '가져온 문제',
    difficulty: VALID_DIFFICULTIES.includes(s.difficulty as Difficulty)
      ? (s.difficulty as Difficulty)
      : '중',
    title: typeof s.title === 'string' && s.title.trim() ? s.title.trim() : undefined,
    types,
    problems,
  };
}

/** 백업 JSON 파일을 읽어 기존 기록과 병합 */
export async function importBackupFile(
  file: File,
): Promise<{ found: number; added: number; total: number }> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('JSON 파일을 읽을 수 없습니다. 올바른 백업 파일인지 확인하세요.');
  }
  const rawSets = Array.isArray(data)
    ? data
    : (data as Record<string, unknown>)?.sets;
  if (!Array.isArray(rawSets)) {
    throw new Error('백업 파일 형식이 아닙니다. (sets 배열이 없습니다)');
  }
  const valid = rawSets.map(sanitizeSet).filter((s): s is ProblemSet => s !== null);
  if (valid.length === 0) {
    throw new Error('가져올 수 있는 문제 세트가 없습니다.');
  }
  const { added, total } = mergeHistory(valid);
  return { found: valid.length, added, total };
}
