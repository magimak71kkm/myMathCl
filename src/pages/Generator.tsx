import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ExcelMenu from '../components/ExcelMenu';
import ProblemCard from '../components/ProblemCard';
import SimilarPanel from '../components/SimilarPanel';
import { CURRICULUM, LEVELS } from '../data/curriculum';
import { emailProblemSet } from '../lib/exportText';
import { generateProblems } from '../lib/providers';
import { loadSettings, saveProblemSet } from '../lib/storage';
import type { Difficulty, ProblemSet, ProblemType, SchoolLevel } from '../types';
import { PROBLEM_TYPE_LABEL } from '../types';

const ALL_TYPES: ProblemType[] = ['multiple_choice', 'short_answer', 'essay', 'true_false'];
const DIFFICULTIES: Difficulty[] = ['하', '중', '상'];

export default function Generator() {
  const [level, setLevel] = useState<SchoolLevel>('중1');
  const [topic, setTopic] = useState<string>(CURRICULUM['중1'][0]);
  const [customTopic, setCustomTopic] = useState('');
  const [types, setTypes] = useState<ProblemType[]>(['multiple_choice']);
  const [difficulty, setDifficulty] = useState<Difficulty>('중');
  const [count, setCount] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSet, setCurrentSet] = useState<ProblemSet | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [generatedMeta, setGeneratedMeta] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const topics = useMemo(() => CURRICULUM[level], [level]);
  const isCustom = topic === '__custom__';
  const hasApiKey = loadSettings().provider === 'gemini' ? !!loadSettings().geminiApiKey : true;

  function changeLevel(l: SchoolLevel) {
    setLevel(l);
    setTopic(CURRICULUM[l][0]);
  }

  function toggleType(t: ProblemType) {
    setTypes((prev) => {
      if (prev.includes(t)) {
        return prev.length === 1 ? prev : prev.filter((x) => x !== t);
      }
      return [...prev, t];
    });
  }

  async function onGenerate() {
    const finalTopic = isCustom ? customTopic.trim() : topic;
    if (!finalTopic) {
      setError('주제를 입력하세요.');
      return;
    }
    setLoading(true);
    setError('');
    setShowAnswers(false);
    setEmailNotice('');
    try {
      const settings = loadSettings();
      const req = { level, topic: finalTopic, types, difficulty, count };
      const result = await generateProblems(req, settings);
      const set: ProblemSet = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        level,
        topic: finalTopic,
        difficulty,
        types,
        problems: result,
      };
      setCurrentSet(set);
      setGeneratedMeta(`${level} · ${finalTopic} · 난이도 ${difficulty}`);
      setSelectedIds(new Set());
      saveProblemSet(set);
    } catch (e) {
      setError(e instanceof Error ? e.message : '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSimilarGenerated(newSet: ProblemSet) {
    setCurrentSet(newSet);
    setGeneratedMeta(`${newSet.level} · ${newSet.topic} · 난이도 ${newSet.difficulty}`);
    setSelectedIds(new Set());
    setShowAnswers(false);
    setEmailNotice('');
  }

  async function onEmail() {
    if (!currentSet) return;
    try {
      const mode = await emailProblemSet(currentSet, showAnswers);
      setEmailNotice(
        mode === 'clipboard'
          ? '내용이 길어 클립보드에 복사했습니다. 열린 메일 본문에 붙여넣기(Ctrl+V) 하세요.'
          : '메일 앱이 열렸습니다. 받는 사람을 입력하고 보내세요.',
      );
    } catch {
      setEmailNotice('메일 앱을 열지 못했습니다. 인쇄/PDF 저장 후 첨부하는 방법을 이용해 보세요.');
    }
  }

  return (
    <div>
      <h1 className="page-title">문제 생성</h1>

      {!hasApiKey && (
        <div className="notice warn no-print">
          API 키가 설정되지 않았습니다. <Link to="/settings">설정</Link>에서 Gemini API 키를 먼저
          등록하세요. (<Link to="/guide">가이드</Link> 참고)
        </div>
      )}

      <div className="card form-card no-print">
        <div className="form-row">
          <label className="form-label">학년</label>
          <div className="segmented">
            {LEVELS.map((l) => (
              <button
                key={l}
                className={l === level ? 'seg-btn active' : 'seg-btn'}
                onClick={() => changeLevel(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">단원 / 주제</label>
          <div className="topic-row">
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="__custom__">직접 입력…</option>
            </select>
            {isCustom && (
              <input
                type="text"
                placeholder="예: 이차함수의 최댓값과 최솟값"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">문제 유형 (복수 선택)</label>
          <div className="segmented">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                className={types.includes(t) ? 'seg-btn active' : 'seg-btn'}
                onClick={() => toggleType(t)}
              >
                {PROBLEM_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">난이도</label>
          <div className="segmented">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={d === difficulty ? 'seg-btn active' : 'seg-btn'}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">
            문제 개수: <strong>{count}개</strong>
          </label>
          <input
            className="count-slider"
            type="range"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>

        <button className="btn-primary btn-generate" onClick={onGenerate} disabled={loading}>
          {loading ? '문제 생성 중… (10~30초 소요)' : '✨ 문제 생성하기'}
        </button>
        {error && <div className="notice error">{error}</div>}
      </div>

      {currentSet && (
        <div className="results">
          <div className="results-head no-print">
            <h2>
              생성 결과 <span className="muted">({generatedMeta})</span>
            </h2>
            <div className="results-actions">
              <button className="btn-secondary" onClick={() => setShowAnswers((v) => !v)}>
                {showAnswers ? '정답 숨기기' : '정답/풀이 보기'}
              </button>
              <button className="btn-secondary" onClick={() => window.print()}>
                🖨 인쇄 / PDF 저장
              </button>
              <button className="btn-secondary" onClick={onEmail}>
                📧 이메일로 보내기
              </button>
              <ExcelMenu set={currentSet} />
            </div>
          </div>
          {emailNotice && <div className="notice no-print">{emailNotice}</div>}
          <p className="select-hint no-print">
            💡 문제 왼쪽 체크박스를 선택하면 그 문제들을 무작위로 변형한 유사 문제를 만들 수
            있습니다.
          </p>
          <SimilarPanel
            sourceSet={currentSet}
            selected={currentSet.problems.filter((p) => selectedIds.has(p.id))}
            onGenerated={onSimilarGenerated}
          />
          <div className="print-title print-only">
            수학 문제지 — {generatedMeta}
          </div>
          {currentSet.problems.map((p, i) => (
            <ProblemCard
              key={p.id}
              problem={p}
              index={i}
              showAnswer={showAnswers}
              selectable
              selected={selectedIds.has(p.id)}
              onToggleSelect={() => toggleSelect(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
