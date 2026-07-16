import { useState } from 'react';
import { generateSimilarProblems } from '../lib/providers';
import { loadSettings, saveProblemSet } from '../lib/storage';
import type { Problem, ProblemSet } from '../types';

interface Props {
  /** 원본 세트 (학년/단원/난이도 정보 사용) */
  sourceSet: ProblemSet;
  /** 체크된 문제들 */
  selected: Problem[];
  /** 생성 완료 시 새 세트 전달 */
  onGenerated: (set: ProblemSet) => void;
}

/** 선택한 문제들을 무작위 변형한 유사 문제를 만드는 패널 */
export default function SimilarPanel({ sourceSet, selected, onGenerated }: Props) {
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (selected.length === 0) return null;

  async function onGenerate() {
    setLoading(true);
    setError('');
    try {
      const problems = await generateSimilarProblems(
        {
          level: sourceSet.level,
          topic: sourceSet.topic,
          difficulty: sourceSet.difficulty,
          count,
          seeds: selected,
        },
        loadSettings(),
      );
      const newSet: ProblemSet = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        level: sourceSet.level,
        topic: `${sourceSet.topic} (유사)`,
        difficulty: sourceSet.difficulty,
        types: [...new Set(problems.map((p) => p.type))],
        problems,
      };
      saveProblemSet(newSet);
      onGenerated(newSet);
    } catch (e) {
      setError(e instanceof Error ? e.message : '유사 문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="similar-panel no-print">
      <div className="similar-info">
        ✅ <strong>{selected.length}개</strong> 문제 선택됨 — 숫자·식·소재를 무작위로 바꾼 유사
        문제를 만듭니다.
      </div>
      <div className="similar-controls">
        <label className="similar-count-label">
          생성 개수: <strong>{count}개</strong>
        </label>
        <input
          className="count-slider similar-slider"
          type="range"
          min={1}
          max={10}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
        <button className="btn-primary" onClick={onGenerate} disabled={loading}>
          {loading ? '유사 문제 생성 중…' : '🔀 유사 문제 만들기'}
        </button>
      </div>
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
