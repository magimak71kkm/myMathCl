import type { ProblemSet } from '../types';
import { difficultyLabel } from '../types';

/** 인쇄 시에만 표시되는 시험지 머리글 (학원명·시험명·기입란) */
export default function ExamHeader({
  set,
  academyName,
}: {
  set: ProblemSet;
  academyName: string;
}) {
  const totalPoints = set.problems.reduce((sum, p) => sum + (p.points ?? 0), 0);
  return (
    <div className="exam-header print-only">
      <div className="exam-academy">{academyName || 'MathGen'}</div>
      <div className="exam-title">{set.title || `${set.topic} 평가`}</div>
      <div className="exam-meta">
        {set.level} · {set.topic} · 난이도 {difficultyLabel(set)} · {set.problems.length}문항
        {totalPoints > 0 && ` · ${totalPoints}점 만점`}
      </div>
      <div className="exam-fields">
        <span>반: ____________</span>
        <span>이름: ____________</span>
        <span>날짜: ____________</span>
        <span>점수: ________</span>
      </div>
    </div>
  );
}
