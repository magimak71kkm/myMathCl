import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ExamHeader from '../components/ExamHeader';
import ExcelMenu from '../components/ExcelMenu';
import ProblemCard from '../components/ProblemCard';
import SimilarPanel from '../components/SimilarPanel';
import { ALL_TOPICS, CURRICULUM, LEVELS } from '../data/curriculum';
import { assignPoints, printExam } from '../lib/exam';
import { emailProblemSet } from '../lib/exportText';
import { generateProblems, regenerateProblem } from '../lib/providers';
import { loadSettings, saveProblemSet, saveSettings, updateProblemSet } from '../lib/storage';
import type { Difficulty, DifficultyMix, Problem, ProblemSet, ProblemType, SchoolLevel } from '../types';
import { difficultyLabel, PROBLEM_TYPE_LABEL } from '../types';

const ALL_TYPES: ProblemType[] = ['multiple_choice', 'short_answer', 'essay', 'true_false'];
const DIFFICULTIES: Difficulty[] = ['하', '중', '상'];
const MAX_PER_DIFFICULTY = 15;
const MAX_TOTAL = 30;

export default function Generator() {
  const [level, setLevel] = useState<SchoolLevel>('중1');
  const [topic, setTopic] = useState<string>(CURRICULUM['중1'][0]);
  const [customTopic, setCustomTopic] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestIndex, setSuggestIndex] = useState(-1);
  const [types, setTypes] = useState<ProblemType[]>(['multiple_choice']);
  const [mix, setMix] = useState<DifficultyMix>({ 하: 0, 중: 5, 상: 0 });
  const [examTitle, setExamTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [currentSet, setCurrentSet] = useState<ProblemSet | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [twoColumn, setTwoColumn] = useState(false);

  const topics = useMemo(() => CURRICULUM[level], [level]);
  const isCustom = topic === '__custom__';
  const totalCount = mix.하 + mix.중 + mix.상;

  // 직접 입력 자동완성: 현재 학년 단원을 우선 노출하고 나머지 학년 단원을 뒤에 배치
  const suggestions = useMemo(() => {
    const q = customTopic.trim();
    if (!q) return [];
    const levelMatches = CURRICULUM[level].filter((t) => t.includes(q));
    const otherMatches = ALL_TOPICS.filter((t) => t.includes(q) && !levelMatches.includes(t));
    return [...levelMatches, ...otherMatches].filter((t) => t !== q).slice(0, 8);
  }, [customTopic, level]);

  function pickSuggestion(value: string) {
    setCustomTopic(value);
    setSuggestOpen(false);
    setSuggestIndex(-1);
  }

  function onCustomKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && suggestIndex >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[suggestIndex]);
    } else if (e.key === 'Escape') {
      setSuggestOpen(false);
      setSuggestIndex(-1);
    }
  }

  // 생성 화면에 고정된 API 키 입력칸: 입력 즉시 저장돼 설정 페이지와 동기화된다
  const [appSettings, setAppSettings] = useState(() => loadSettings());
  const isGemini = appSettings.provider === 'gemini';
  const apiKey = isGemini ? appSettings.geminiApiKey : appSettings.compatApiKey;
  const hasApiKey = isGemini ? !!appSettings.geminiApiKey : true;

  function updateApiKey(value: string) {
    const next = {
      ...loadSettings(),
      [isGemini ? 'geminiApiKey' : 'compatApiKey']: value.trim(),
    };
    saveSettings(next);
    setAppSettings(next);
  }

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

  function changeMix(d: Difficulty, value: number) {
    const v = Math.max(0, Math.min(MAX_PER_DIFFICULTY, Math.floor(value) || 0));
    setMix((m) => ({ ...m, [d]: v }));
  }

  async function onGenerate() {
    const finalTopic = isCustom ? customTopic.trim() : topic;
    if (!finalTopic) {
      setError('주제를 입력하세요.');
      return;
    }
    if (totalCount === 0) {
      setError('난이도별 문항 수를 1개 이상 지정하세요.');
      return;
    }
    if (totalCount > MAX_TOTAL) {
      setError(`총 문항 수는 ${MAX_TOTAL}개 이하로 지정하세요.`);
      return;
    }
    setLoading(true);
    setError('');
    setShowAnswers(false);
    setEmailNotice('');
    try {
      const settings = loadSettings();
      const active = DIFFICULTIES.filter((d) => mix[d] > 0);
      const problems: Problem[] = [];
      for (const [i, d] of active.entries()) {
        setProgress(
          active.length > 1
            ? `난이도 '${d}' ${mix[d]}문항 생성 중… (${i + 1}/${active.length})`
            : `문제 생성 중… (10~30초 소요)`,
        );
        const part = await generateProblems(
          { level, topic: finalTopic, types, difficulty: d, count: mix[d] },
          settings,
        );
        for (const p of part) p.difficulty = d;
        problems.push(...part);
      }
      assignPoints(problems);
      // 대표 난이도: 문항 수가 가장 많은 난이도
      const dominant = active.reduce((a, b) => (mix[a] >= mix[b] ? a : b));
      const set: ProblemSet = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        level,
        topic: finalTopic,
        difficulty: dominant,
        difficultyMix: { ...mix },
        title: examTitle.trim() || undefined,
        types,
        problems,
      };
      setCurrentSet(set);
      setSelectedIds(new Set());
      saveProblemSet(set);
    } catch (e) {
      setError(e instanceof Error ? e.message : '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  /** 세트 변경을 화면과 저장소에 동시 반영 */
  function mutateSet(updater: (problems: Problem[]) => Problem[]) {
    setCurrentSet((prev) => {
      if (!prev) return prev;
      const next = { ...prev, problems: updater([...prev.problems]) };
      updateProblemSet(next);
      return next;
    });
  }

  function onEditProblem(updated: Problem) {
    mutateSet((list) => list.map((p) => (p.id === updated.id ? updated : p)));
  }

  function onDeleteProblem(id: string) {
    if (!window.confirm('이 문제를 삭제할까요?')) return;
    mutateSet((list) => list.filter((p) => p.id !== id));
  }

  function onMoveProblem(id: string, dir: -1 | 1) {
    mutateSet((list) => {
      const idx = list.findIndex((p) => p.id === id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= list.length) return list;
      [list[idx], list[target]] = [list[target], list[idx]];
      return list;
    });
  }

  async function onReplaceProblem(problem: Problem) {
    if (!currentSet || replacingId) return;
    setReplacingId(problem.id);
    setError('');
    try {
      const fresh = await regenerateProblem(
        {
          level: currentSet.level,
          topic: currentSet.topic,
          difficulty: problem.difficulty ?? currentSet.difficulty,
          type: problem.type,
          existingQuestions: currentSet.problems.map((p) => p.question),
        },
        loadSettings(),
      );
      fresh.points = problem.points;
      mutateSet((list) => list.map((p) => (p.id === problem.id ? fresh : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : '문제 교체 중 오류가 발생했습니다.');
    } finally {
      setReplacingId(null);
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

  const generatedMeta = currentSet
    ? `${currentSet.level} · ${currentSet.topic} · 난이도 ${difficultyLabel(currentSet)}`
    : '';

  return (
    <div>
      <h1 className="page-title">문제 생성</h1>

      {!hasApiKey && (
        <div className="notice warn no-print">
          API 키가 설정되지 않았습니다. 아래 입력칸에 Gemini API 키를 입력하세요. (
          <Link to="/guide">가이드</Link> 참고)
        </div>
      )}

      <div className="card form-card no-print">
        <div className="form-row">
          <label className="form-label">
            API 키 ({isGemini ? 'Gemini' : 'OpenAI 호환'})
            {hasApiKey && <span className="key-ok"> ✓ 등록됨</span>}
          </label>
          <input
            type="password"
            placeholder={isGemini ? 'AIza...' : 'API 키 입력'}
            value={apiKey}
            onChange={(e) => updateApiKey(e.target.value)}
            autoComplete="off"
          />
          <p className="field-hint">
            입력 즉시 이 기기 브라우저에 저장됩니다. 모델·제공자 변경은{' '}
            <Link to="/settings">설정</Link>에서 할 수 있습니다.
          </p>
        </div>

        <div className="form-row">
          <label className="form-label">시험명 (선택)</label>
          <input
            type="text"
            placeholder="예: 7월 2주차 주간 테스트 — 시험지 머리글에 인쇄됩니다"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
          />
        </div>

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
              <div className="autocomplete">
                <input
                  type="text"
                  placeholder="예: 이차함수의 최댓값과 최솟값"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    setSuggestOpen(true);
                    setSuggestIndex(-1);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => setSuggestOpen(false)}
                  onKeyDown={onCustomKeyDown}
                />
                {suggestOpen && suggestions.length > 0 && (
                  <ul className="suggest-list">
                    {suggestions.map((s, i) => (
                      <li
                        key={s}
                        className={i === suggestIndex ? 'suggest-item active' : 'suggest-item'}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickSuggestion(s);
                        }}
                        onMouseEnter={() => setSuggestIndex(i)}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
          <label className="form-label">
            난이도별 문항 수 — 총 <strong>{totalCount}문항</strong>
            {totalCount > MAX_TOTAL && <span className="mix-over"> (최대 {MAX_TOTAL})</span>}
          </label>
          <div className="mix-row">
            {DIFFICULTIES.map((d) => (
              <label key={d} className="mix-item">
                <span className={`mix-label mix-${d}`}>{d}</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_PER_DIFFICULTY}
                  value={mix[d]}
                  onChange={(e) => changeMix(d, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
          <p className="field-hint">
            예: 하 3 · 중 5 · 상 2 로 지정하면 난이도가 섞인 10문항 시험지가 만들어집니다.
          </p>
        </div>

        <button
          className="btn-primary btn-generate"
          onClick={onGenerate}
          disabled={loading || totalCount === 0 || totalCount > MAX_TOTAL}
        >
          {loading ? progress || '문제 생성 중…' : `✨ ${totalCount}문항 생성하기`}
        </button>
        {error && <div className="notice error">{error}</div>}
      </div>

      {currentSet && (
        <div className="results">
          <div className="results-head no-print">
            <h2>
              {currentSet.title || '생성 결과'} <span className="muted">({generatedMeta})</span>
            </h2>
            <div className="results-actions">
              <button className="btn-secondary" onClick={() => setShowAnswers((v) => !v)}>
                {showAnswers ? '정답 숨기기' : '정답/풀이 보기'}
              </button>
              <button className="btn-secondary" onClick={() => printExam('questions', twoColumn)}>
                🖨 문제지 인쇄
              </button>
              <button className="btn-secondary" onClick={() => printExam('answers', twoColumn)}>
                📝 해설지 인쇄
              </button>
              <label className="two-col-toggle">
                <input
                  type="checkbox"
                  checked={twoColumn}
                  onChange={(e) => setTwoColumn(e.target.checked)}
                />
                2단 인쇄
              </label>
              <button className="btn-secondary" onClick={onEmail}>
                📧 이메일
              </button>
              <ExcelMenu set={currentSet} />
            </div>
          </div>
          {emailNotice && <div className="notice no-print">{emailNotice}</div>}
          <p className="select-hint no-print">
            💡 각 문제의 ✏️수정 · 🔄교체 · ↑↓순서 · 🗑삭제 도구로 시험지를 다듬을 수 있습니다.
            체크박스를 선택하면 유사 문제도 만들 수 있습니다.
          </p>
          <SimilarPanel
            sourceSet={currentSet}
            selected={currentSet.problems.filter((p) => selectedIds.has(p.id))}
            onGenerated={onSimilarGenerated}
          />
          <ExamHeader set={currentSet} academyName={appSettings.academyName} />
          <div className={twoColumn ? 'problem-list two-col' : 'problem-list'}>
            {currentSet.problems.map((p, i) => (
              <ProblemCard
                key={p.id}
                problem={p}
                index={i}
                showAnswer={showAnswers}
                selectable
                selected={selectedIds.has(p.id)}
                onToggleSelect={() => toggleSelect(p.id)}
                editable
                onEdit={onEditProblem}
                onReplace={() => onReplaceProblem(p)}
                replacing={replacingId === p.id}
                onDelete={() => onDeleteProblem(p.id)}
                onMoveUp={() => onMoveProblem(p.id, -1)}
                onMoveDown={() => onMoveProblem(p.id, 1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
