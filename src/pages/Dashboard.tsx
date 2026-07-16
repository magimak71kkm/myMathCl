import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LEVELS } from '../data/curriculum';
import { loadHistory } from '../lib/storage';
import type { SchoolLevel } from '../types';
import { PROBLEM_TYPE_LABEL } from '../types';

export default function Dashboard() {
  const history = useMemo(() => loadHistory(), []);

  const totalProblems = history.reduce((sum, s) => sum + s.problems.length, 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = history
    .filter((s) => s.createdAt >= weekAgo)
    .reduce((sum, s) => sum + s.problems.length, 0);

  const byLevel: Record<SchoolLevel, number> = {
    중1: 0, 중2: 0, 중3: 0, 고1: 0, 고2: 0, 고3: 0,
  };
  for (const s of history) byLevel[s.level] += s.problems.length;
  const maxLevel = Math.max(1, ...Object.values(byLevel));
  const topLevel =
    totalProblems === 0
      ? '-'
      : LEVELS.reduce((a, b) => (byLevel[a] >= byLevel[b] ? a : b));

  return (
    <div>
      <h1 className="page-title">대시보드</h1>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-value">{totalProblems.toLocaleString()}</div>
          <div className="stat-label">총 생성 문제</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{history.length.toLocaleString()}</div>
          <div className="stat-label">문제 세트</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{recentCount.toLocaleString()}</div>
          <div className="stat-label">최근 7일 생성</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{topLevel}</div>
          <div className="stat-label">최다 이용 학년</div>
        </div>
      </div>

      <div className="dash-columns">
        <div className="card">
          <h2 className="card-title">학년별 생성 문제 수</h2>
          {totalProblems === 0 ? (
            <p className="muted">
              아직 생성한 문제가 없습니다. <Link to="/generate">문제 생성</Link>에서 시작해 보세요.
            </p>
          ) : (
            <div className="bar-chart">
              {LEVELS.map((l) => (
                <div className="bar-row" key={l}>
                  <span className="bar-label">{l}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(byLevel[l] / maxLevel) * 100}%` }}
                    />
                  </div>
                  <span className="bar-value">{byLevel[l]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">최근 생성 세트</h2>
          {history.length === 0 ? (
            <p className="muted">기록이 없습니다.</p>
          ) : (
            <ul className="recent-list">
              {history.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link to="/history" className="recent-item">
                    <span className="recent-title">
                      [{s.level}] {s.topic}
                    </span>
                    <span className="recent-meta">
                      {s.problems.length}문제 · {s.types.map((t) => PROBLEM_TYPE_LABEL[t]).join('/')} ·{' '}
                      {new Date(s.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card quick-start">
        <h2 className="card-title">빠른 시작</h2>
        <div className="quick-links">
          <Link className="btn-primary" to="/generate">✨ 새 문제 생성</Link>
          <Link className="btn-secondary" to="/history">📚 생성 기록 보기</Link>
          <Link className="btn-secondary" to="/guide">📖 사용자 가이드</Link>
          <Link className="btn-secondary" to="/settings">⚙️ API 설정</Link>
        </div>
      </div>
    </div>
  );
}
