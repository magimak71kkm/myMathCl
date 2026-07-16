import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import Guide from './pages/Guide';
import History from './pages/History';
import Settings from './pages/Settings';

const NAV = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/generate', label: '문제 생성', icon: '✨' },
  { to: '/history', label: '생성 기록', icon: '📚' },
  { to: '/guide', label: '사용자 가이드', icon: '📖' },
  { to: '/settings', label: '설정', icon: '⚙️' },
];

export default function App() {
  return (
    <HashRouter>
      <div className="layout">
        <aside className="sidebar no-print">
          <div className="brand">
            <span className="brand-icon">∑</span>
            <div>
              <div className="brand-name">MathGen</div>
              <div className="brand-sub">AI 수학 문제 생성기</div>
            </div>
          </div>
          <nav>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">중학교 · 고등학교 전 학년 지원</div>
        </aside>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generate" element={<Generator />} />
            <Route path="/history" element={<History />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
