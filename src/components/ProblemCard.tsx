import type { Problem } from '../types';
import { PROBLEM_TYPE_LABEL } from '../types';
import MathText from './MathText';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

interface Props {
  problem: Problem;
  index: number;
  showAnswer: boolean;
  /** 유사 문제 생성용 선택 체크박스 표시 여부 */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function ProblemCard({
  problem,
  index,
  showAnswer,
  selectable,
  selected,
  onToggleSelect,
}: Props) {
  return (
    <div className={selected ? 'problem-card selected' : 'problem-card'}>
      <div className="problem-head">
        {selectable && (
          <label className="select-check no-print" title="유사 문제 생성에 사용할 문제 선택">
            <input type="checkbox" checked={!!selected} onChange={onToggleSelect} />
          </label>
        )}
        <span className="problem-no">문제 {index + 1}</span>
        <span className={`badge badge-${problem.type}`}>{PROBLEM_TYPE_LABEL[problem.type]}</span>
      </div>
      <div className="problem-question">
        <MathText text={problem.question} />
      </div>
      {problem.figure && (
        <div
          className="problem-figure"
          // AI 생성 SVG — normalizeProblems에서 sanitizeSvg로 정화된 코드만 저장됨
          dangerouslySetInnerHTML={{ __html: problem.figure }}
        />
      )}
      {problem.choices && problem.choices.length > 0 && (
        <ol className="choices">
          {problem.choices.map((c, i) => (
            <li key={i}>
              <span className="choice-marker">{CIRCLED[i] ?? `${i + 1}.`}</span>{' '}
              <MathText text={c} />
            </li>
          ))}
        </ol>
      )}
      {showAnswer && (
        <div className="answer-box">
          <div className="answer-line">
            <strong>정답:</strong> <MathText text={problem.answer} />
          </div>
          {problem.explanation && (
            <div className="explanation">
              <strong>풀이:</strong> <MathText text={problem.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
