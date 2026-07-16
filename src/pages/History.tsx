import { useMemo, useState } from 'react';
import ExamHeader from '../components/ExamHeader';
import ExcelMenu from '../components/ExcelMenu';
import ProblemCard from '../components/ProblemCard';
import SimilarPanel from '../components/SimilarPanel';
import { assignPoints, printExam } from '../lib/exam';
import { emailProblemSet } from '../lib/exportText';
import { deleteProblemSet, loadHistory, loadSettings, saveProblemSet } from '../lib/storage';
import type { Difficulty, Problem, ProblemSet, SchoolLevel } from '../types';
import { difficultyLabel, PROBLEM_TYPE_LABEL } from '../types';

export default function History() {
  const [history, setHistory] = useState<ProblemSet[]>(() => loadHistory());
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bankTitle, setBankTitle] = useState('');
  const [twoColumn, setTwoColumn] = useState(false);
  const academyName = loadSettings().academyName;

  // 세트를 넘나들며 선택된 문제들 (문제 은행)
  const pickedProblems = useMemo(() => {
    const picked: { problem: Problem; level: SchoolLevel; topic: string }[] = [];
    for (const s of history) {
      for (const p of s.problems) {
        if (selectedIds.has(p.id)) picked.push({ problem: p, level: s.level, topic: s.topic });
      }
    }
    return picked;
  }, [history, selectedIds]);

  function onDelete(id: string) {
    if (!window.confirm('이 문제 세트를 삭제할까요?')) return;
    setHistory(deleteProblemSet(id));
    if (openId === id) setOpenId(null);
  }

  function toggleOpen(id: string) {
    setOpenId(openId === id ? null : id);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** 선택한 문제들을 모아 새 시험지 구성 */
  function buildExamFromPicks() {
    if (pickedProblems.length === 0) return;
    // 새 시험지의 학년: 가장 많이 선택된 학년
    const levelCount = new Map<SchoolLevel, number>();
    for (const { level } of pickedProblems) {
      levelCount.set(level, (levelCount.get(level) ?? 0) + 1);
    }
    const level = [...levelCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const topics = [...new Set(pickedProblems.map((p) => p.topic))];
    const topic = topics.length > 2 ? `${topics.slice(0, 2).join(', ')} 외` : topics.join(', ');
    // 문제는 복제해 새 id 부여 (원본 세트와 독립적으로 편집 가능)
    const problems: Problem[] = pickedProblems.map(({ problem }) => ({
      ...problem,
      id: crypto.randomUUID(),
    }));
    assignPoints(problems);
    const diffCount = new Map<Difficulty, number>();
    for (const p of problems) {
      if (p.difficulty) diffCount.set(p.difficulty, (diffCount.get(p.difficulty) ?? 0) + 1);
    }
    const difficulty =
      [...diffCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '중';
    const newSet: ProblemSet = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      level,
      topic,
      difficulty,
      title: bankTitle.trim() || undefined,
      types: [...new Set(problems.map((p) => p.type))],
      problems,
    };
    saveProblemSet(newSet);
    setHistory(loadHistory());
    setSelectedIds(new Set());
    setBankTitle('');
    setOpenId(newSet.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onSimilarGenerated(newSet: ProblemSet) {
    setHistory(loadHistory());
    setOpenId(newSet.id);
    setSelectedIds(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onEmail(set: ProblemSet) {
    try {
      const mode = await emailProblemSet(set, showAnswers);
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
      <h1 className="page-title">생성 기록 · 문제 은행</h1>

      {pickedProblems.length > 0 && (
        <div className="card bank-bar no-print">
          <div className="bank-info">
            🗂 <strong>{pickedProblems.length}문제</strong> 선택됨 — 여러 세트에서 고른 문제로 새
            시험지를 만들 수 있습니다.
          </div>
          <div className="bank-controls">
            <input
              type="text"
              placeholder="시험명 (선택) 예: 중간 대비 종합"
              value={bankTitle}
              onChange={(e) => setBankTitle(e.target.value)}
            />
            <button className="btn-primary" onClick={buildExamFromPicks}>
              📑 선택 문제로 시험지 만들기
            </button>
            <button className="btn-secondary" onClick={() => setSelectedIds(new Set())}>
              선택 해제
            </button>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="card">
          <p className="muted">아직 생성한 문제 세트가 없습니다.</p>
        </div>
      ) : (
        history.map((s) => (
          <div className="card history-card" key={s.id}>
            <div className="history-head no-print">
              <div>
                <div className="recent-title">
                  {s.title ? `${s.title} — ` : ''}[{s.level}] {s.topic}{' '}
                  <span className="badge">난이도 {difficultyLabel(s)}</span>
                </div>
                <div className="recent-meta">
                  {s.problems.length}문제 · {s.types.map((t) => PROBLEM_TYPE_LABEL[t]).join('/')} ·{' '}
                  {new Date(s.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <div className="results-actions">
                <button className="btn-secondary" onClick={() => toggleOpen(s.id)}>
                  {openId === s.id ? '접기' : '펼치기'}
                </button>
                <button className="btn-danger" onClick={() => onDelete(s.id)}>
                  삭제
                </button>
              </div>
            </div>
            {openId === s.id && (
              <div className="history-body">
                <div className="results-actions no-print" style={{ marginBottom: 12 }}>
                  <button className="btn-secondary" onClick={() => setShowAnswers((v) => !v)}>
                    {showAnswers ? '정답 숨기기' : '정답/풀이 보기'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => printExam('questions', twoColumn)}
                  >
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
                  <button className="btn-secondary" onClick={() => onEmail(s)}>
                    📧 이메일
                  </button>
                  <ExcelMenu set={s} />
                </div>
                {emailNotice && (
                  <div className="notice no-print" style={{ marginBottom: 12 }}>
                    {emailNotice}
                  </div>
                )}
                <p className="select-hint no-print">
                  💡 체크박스로 문제를 선택하면 유사 문제를 만들거나(아래 패널), 다른 세트의
                  문제와 모아 새 시험지를 구성할 수 있습니다(상단 문제 은행).
                </p>
                <SimilarPanel
                  sourceSet={s}
                  selected={s.problems.filter((p) => selectedIds.has(p.id))}
                  onGenerated={onSimilarGenerated}
                />
                <ExamHeader set={s} academyName={academyName} />
                <div className={twoColumn ? 'problem-list two-col' : 'problem-list'}>
                  {s.problems.map((p, i) => (
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
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
