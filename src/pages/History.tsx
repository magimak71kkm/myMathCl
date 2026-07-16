import { useState } from 'react';
import ExcelMenu from '../components/ExcelMenu';
import ProblemCard from '../components/ProblemCard';
import SimilarPanel from '../components/SimilarPanel';
import { emailProblemSet } from '../lib/exportText';
import { deleteProblemSet, loadHistory } from '../lib/storage';
import type { ProblemSet } from '../types';
import { PROBLEM_TYPE_LABEL } from '../types';

export default function History() {
  const [history, setHistory] = useState<ProblemSet[]>(() => loadHistory());
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function onDelete(id: string) {
    if (!window.confirm('이 문제 세트를 삭제할까요?')) return;
    setHistory(deleteProblemSet(id));
    if (openId === id) setOpenId(null);
  }

  function toggleOpen(id: string) {
    setOpenId(openId === id ? null : id);
    setSelectedIds(new Set());
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
      <h1 className="page-title">생성 기록</h1>
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
                  [{s.level}] {s.topic} <span className="badge">난이도 {s.difficulty}</span>
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
                  <button className="btn-secondary" onClick={() => window.print()}>
                    🖨 인쇄 / PDF 저장
                  </button>
                  <button className="btn-secondary" onClick={() => onEmail(s)}>
                    📧 이메일로 보내기
                  </button>
                  <ExcelMenu set={s} />
                </div>
                {emailNotice && (
                  <div className="notice no-print" style={{ marginBottom: 12 }}>
                    {emailNotice}
                  </div>
                )}
                <p className="select-hint no-print">
                  💡 문제 왼쪽 체크박스를 선택하면 그 문제들을 무작위로 변형한 유사 문제를 만들 수
                  있습니다.
                </p>
                <SimilarPanel
                  sourceSet={s}
                  selected={s.problems.filter((p) => selectedIds.has(p.id))}
                  onGenerated={onSimilarGenerated}
                />
                <div className="print-title print-only">
                  수학 문제지 — {s.level} · {s.topic} · 난이도 {s.difficulty}
                </div>
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
            )}
          </div>
        ))
      )}
    </div>
  );
}
