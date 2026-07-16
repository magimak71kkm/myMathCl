import type { Problem } from '../types';

/** 총점을 문항 수에 맞춰 정수 배점으로 배분 (앞 문항부터 나머지 1점씩) */
export function assignPoints(problems: Problem[], total = 100): void {
  const n = problems.length;
  if (n === 0) return;
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  problems.forEach((p, i) => {
    p.points = base + (i < remainder ? 1 : 0);
  });
}

export type PrintMode = 'questions' | 'answers';

/**
 * 문제지/해설지 인쇄. body에 모드 클래스를 붙여 인쇄 CSS가 분기하게 한다.
 * - questions: 정답·풀이 숨김 (문제지)
 * - answers: 정답·풀이 강제 표시 (해설지)
 * - twoColumn: 실제 시험지처럼 2단 배치
 */
export function printExam(mode: PrintMode, twoColumn: boolean): void {
  const classes = [mode === 'answers' ? 'print-answers' : 'print-questions'];
  if (twoColumn) classes.push('print-two-col');
  document.body.classList.add(...classes);
  const cleanup = () => document.body.classList.remove(...classes);
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  // afterprint 미지원 브라우저 대비 (인쇄 렌더링은 print() 호출 시점에 끝난다)
  setTimeout(cleanup, 2000);
}
