import type { Problem, ProblemSet } from '../types';
import { PROBLEM_TYPE_LABEL } from '../types';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

/** 이메일/엑셀 등 일반 텍스트에서는 LaTeX 구분자($)만 제거 */
export function stripMathDelimiters(text: string): string {
  return text.replace(/\$\$([\s\S]+?)\$\$/g, '$1').replace(/\$([^$\n]+?)\$/g, '$1');
}

function problemToText(p: Problem, index: number, includeAnswers: boolean): string {
  const lines: string[] = [];
  lines.push(`문제 ${index + 1}. (${PROBLEM_TYPE_LABEL[p.type]})`);
  lines.push(stripMathDelimiters(p.question));
  if (p.choices && p.choices.length > 0) {
    p.choices.forEach((c, i) => {
      lines.push(`${CIRCLED[i] ?? `${i + 1}.`} ${stripMathDelimiters(c)}`);
    });
  }
  if (includeAnswers) {
    lines.push(`정답: ${stripMathDelimiters(p.answer)}`);
    if (p.explanation) lines.push(`풀이: ${stripMathDelimiters(p.explanation)}`);
  }
  return lines.join('\n');
}

export function problemSetSubject(set: ProblemSet): string {
  return `[MathGen] ${set.level} ${set.topic} 수학 문제 ${set.problems.length}개`;
}

export function problemSetToText(set: ProblemSet, includeAnswers: boolean): string {
  const header = [
    `${set.level} · ${set.topic} · 난이도 ${set.difficulty} · ${set.problems.length}문제`,
    `생성일: ${new Date(set.createdAt).toLocaleString('ko-KR')}`,
    includeAnswers ? '(정답/풀이 포함)' : '(문제만 · 정답 미포함)',
    '',
  ].join('\n');
  const body = set.problems.map((p, i) => problemToText(p, i, includeAnswers)).join('\n\n');
  return `${header}\n${body}\n\n— MathGen AI 수학 문제 생성기`;
}

/** mailto URL 길이 한도(약 2000자) 초과 시 클립보드 복사로 대체.
 *  반환값: 'mailto' | 'clipboard' — 호출부에서 사용자 안내에 사용 */
export async function emailProblemSet(
  set: ProblemSet,
  includeAnswers: boolean,
): Promise<'mailto' | 'clipboard'> {
  const subject = problemSetSubject(set);
  const text = problemSetToText(set, includeAnswers);
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  if (url.length <= 1900) {
    window.location.href = url;
    return 'mailto';
  }

  await navigator.clipboard.writeText(text);
  const fallbackBody = '문제 내용이 길어 클립보드에 복사해 두었습니다. 이 자리에 붙여넣기(Ctrl+V) 하세요.';
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fallbackBody)}`;
  return 'clipboard';
}
