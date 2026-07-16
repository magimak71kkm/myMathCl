import { useState } from 'react';
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
  /** 편집 도구 표시 여부 (수정·교체·이동·삭제) */
  editable?: boolean;
  onEdit?: (updated: Problem) => void;
  onReplace?: () => void;
  replacing?: boolean;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/** 편집 폼: 문제/보기/정답/풀이/배점을 직접 수정 */
function EditForm({
  problem,
  onSave,
  onCancel,
}: {
  problem: Problem;
  onSave: (updated: Problem) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState(problem.question);
  const [choicesText, setChoicesText] = useState((problem.choices ?? []).join('\n'));
  const [answer, setAnswer] = useState(problem.answer);
  const [explanation, setExplanation] = useState(problem.explanation);
  const [points, setPoints] = useState(problem.points ?? 0);

  function save() {
    const choices = choicesText
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);
    onSave({
      ...problem,
      question: question.trim() || problem.question,
      choices: choices.length > 0 ? choices : undefined,
      answer: answer.trim() || problem.answer,
      explanation: explanation.trim(),
      points: points > 0 ? points : undefined,
    });
  }

  return (
    <div className="edit-form no-print">
      <label className="form-label">문제</label>
      <textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} />
      {problem.choices && problem.choices.length > 0 && (
        <>
          <label className="form-label">보기 (한 줄에 하나씩)</label>
          <textarea
            rows={5}
            value={choicesText}
            onChange={(e) => setChoicesText(e.target.value)}
          />
        </>
      )}
      <label className="form-label">정답</label>
      <textarea rows={1} value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <label className="form-label">풀이</label>
      <textarea rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      <label className="form-label">배점</label>
      <input
        className="points-input"
        type="number"
        min={0}
        max={100}
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
      />
      <div className="results-actions" style={{ marginTop: 10 }}>
        <button className="btn-primary" onClick={save}>
          저장
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  );
}

export default function ProblemCard({
  problem,
  index,
  showAnswer,
  selectable,
  selected,
  onToggleSelect,
  editable,
  onEdit,
  onReplace,
  replacing,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={selected ? 'problem-card selected' : 'problem-card'}>
      <div className="problem-head">
        {selectable && (
          <label className="select-check no-print" title="유사 문제 생성·시험지 구성에 사용할 문제 선택">
            <input type="checkbox" checked={!!selected} onChange={onToggleSelect} />
          </label>
        )}
        <span className="problem-no">문제 {index + 1}</span>
        <span className={`badge badge-${problem.type}`}>{PROBLEM_TYPE_LABEL[problem.type]}</span>
        {problem.difficulty && <span className="badge no-print">난이도 {problem.difficulty}</span>}
        {problem.points != null && problem.points > 0 && (
          <span className="points-badge">[{problem.points}점]</span>
        )}
        {editable && !editing && (
          <span className="problem-tools no-print">
            <button className="tool-btn" title="문제 직접 수정" onClick={() => setEditing(true)}>
              ✏️
            </button>
            <button
              className="tool-btn"
              title="AI로 새 문제 교체"
              onClick={onReplace}
              disabled={replacing}
            >
              {replacing ? '⏳' : '🔄'}
            </button>
            <button className="tool-btn" title="위로 이동" onClick={onMoveUp}>
              ↑
            </button>
            <button className="tool-btn" title="아래로 이동" onClick={onMoveDown}>
              ↓
            </button>
            <button className="tool-btn tool-danger" title="문제 삭제" onClick={onDelete}>
              🗑
            </button>
          </span>
        )}
      </div>
      {editing ? (
        <EditForm
          problem={problem}
          onSave={(updated) => {
            setEditing(false);
            onEdit?.(updated);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
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
          <div className={showAnswer ? 'answer-box' : 'answer-box screen-hidden'}>
            <div className="answer-line">
              <strong>정답:</strong> <MathText text={problem.answer} />
            </div>
            {problem.explanation && (
              <div className="explanation">
                <strong>풀이:</strong> <MathText text={problem.explanation} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
