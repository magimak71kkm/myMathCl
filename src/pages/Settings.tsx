import { useRef, useState } from 'react';
import { downloadBackup, importBackupFile } from '../lib/backup';
import { applyFont, FONT_OPTIONS } from '../lib/fonts';
import { generateProblems } from '../lib/providers';
import { loadHistory, loadSettings, saveSettings } from '../lib/storage';
import type { AppSettings } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [backupNotice, setBackupNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  /** 글꼴은 즉시 적용·저장 (미리보기를 겸함) */
  function changeFont(id: string) {
    const next = { ...settings, fontFamily: id };
    setSettings(next);
    saveSettings(next);
    applyFont(id);
  }

  function onSave() {
    saveSettings(settings);
    setSaved(true);
  }

  async function onTest() {
    saveSettings(settings);
    setSaved(true);
    setTesting(true);
    setTestResult('');
    try {
      await generateProblems(
        { level: '중1', topic: '정수와 유리수', types: ['short_answer'], difficulty: '하', count: 1 },
        settings,
      );
      setTestResult('✅ 연결 성공! 문제 생성이 정상 동작합니다.');
    } catch (e) {
      setTestResult(`❌ 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    } finally {
      setTesting(false);
    }
  }

  async function onBackup() {
    const count = await downloadBackup();
    setBackupNotice(
      count === 0
        ? '백업할 생성 기록이 없습니다.'
        : `✅ 문제 세트 ${count}개를 JSON 파일로 저장했습니다.`,
    );
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    try {
      const { found, added, total } = await importBackupFile(file);
      setBackupNotice(
        `✅ 파일에서 ${found}개 세트를 찾아 ${added}개를 새로 가져왔습니다. (중복 ${found - added}개 제외 · 현재 총 ${total}개)`,
      );
    } catch (err) {
      setBackupNotice(`❌ ${err instanceof Error ? err.message : '가져오기에 실패했습니다.'}`);
    }
  }

  return (
    <div>
      <h1 className="page-title">설정</h1>

      <div className="card form-card">
        <div className="form-row">
          <label className="form-label">AI 제공자</label>
          <div className="segmented">
            <button
              className={settings.provider === 'gemini' ? 'seg-btn active' : 'seg-btn'}
              onClick={() => update('provider', 'gemini')}
            >
              Google Gemini (무료 추천)
            </button>
            <button
              className={settings.provider === 'openai_compat' ? 'seg-btn active' : 'seg-btn'}
              onClick={() => update('provider', 'openai_compat')}
            >
              OpenAI 호환 API
            </button>
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">학원명 (시험지 머리글에 인쇄)</label>
          <input
            type="text"
            placeholder="예: OO수학학원"
            value={settings.academyName}
            onChange={(e) => update('academyName', e.target.value)}
          />
        </div>

        <div className="form-row">
          <label className="form-label">글꼴 (화면·인쇄 공통)</label>
          <select value={settings.fontFamily} onChange={(e) => changeFont(e.target.value)}>
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <p className="field-hint">
            선택 즉시 적용됩니다. 시험지 인쇄에도 같은 글꼴이 사용됩니다. — 미리보기: 이차함수
            y=ax²+bx+c 의 그래프 1234
          </p>
        </div>

        {settings.provider === 'gemini' ? (
          <>
            <div className="form-row">
              <label className="form-label">Gemini API 키</label>
              <input
                type="password"
                placeholder="AIza..."
                value={settings.geminiApiKey}
                onChange={(e) => update('geminiApiKey', e.target.value)}
              />
              <p className="field-hint">
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                  Google AI Studio
                </a>
                에서 무료로 발급받을 수 있습니다. 키는 이 기기의 브라우저에만 저장됩니다.
              </p>
            </div>
            <div className="form-row">
              <label className="form-label">모델</label>
              <select
                value={settings.geminiModel}
                onChange={(e) => update('geminiModel', e.target.value)}
              >
                <option value="gemini-flash-latest">gemini-flash-latest (권장 · 항상 최신)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (경량 · 과부하 적음)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (빠름)</option>
                <option value="gemini-pro-latest">gemini-pro-latest (고품질 · 느림)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (구 계정 전용)</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              <label className="form-label">Base URL</label>
              <input
                type="text"
                placeholder="https://openrouter.ai/api/v1"
                value={settings.compatBaseUrl}
                onChange={(e) => update('compatBaseUrl', e.target.value)}
              />
              <p className="field-hint">
                OpenRouter: https://openrouter.ai/api/v1 · Groq: https://api.groq.com/openai/v1 ·
                로컬 Ollama: http://localhost:11434/v1
              </p>
            </div>
            <div className="form-row">
              <label className="form-label">API 키 (Ollama는 비워두세요)</label>
              <input
                type="password"
                value={settings.compatApiKey}
                onChange={(e) => update('compatApiKey', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label className="form-label">모델명</label>
              <input
                type="text"
                placeholder="예: llama-3.3-70b-versatile, qwen2.5:14b"
                value={settings.compatModel}
                onChange={(e) => update('compatModel', e.target.value)}
              />
            </div>
          </>
        )}

        <div className="results-actions">
          <button className="btn-primary" onClick={onSave}>
            저장
          </button>
          <button className="btn-secondary" onClick={onTest} disabled={testing}>
            {testing ? '테스트 중…' : '연결 테스트'}
          </button>
          {saved && <span className="save-ok">저장됨 ✓</span>}
        </div>
        {testResult && <div className="notice">{testResult}</div>}
      </div>

      <div className="card">
        <h2 className="card-title">데이터 백업 / 복원</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          생성 기록(현재 {loadHistory().length}개 세트)을 JSON 파일로 내려받아 보관하거나, 다른
          기기·브라우저에서 만든 백업 파일을 가져올 수 있습니다. 가져오기는 기존 기록에{' '}
          <strong>병합</strong>되며 중복 세트는 자동으로 건너뜁니다. (API 키는 백업에 포함되지
          않습니다)
        </p>
        <div className="results-actions">
          <button className="btn-secondary" onClick={onBackup}>
            📦 기록 백업 (JSON 다운로드)
          </button>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            📂 백업 가져오기
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={onImportFile}
          />
        </div>
        {backupNotice && <div className="notice">{backupNotice}</div>}
      </div>

      <div className="card">
        <h2 className="card-title">개인정보 안내</h2>
        <p className="muted">
          API 키와 생성 기록은 모두 이 기기의 브라우저(localStorage)에만 저장되며 외부 서버로
          전송되지 않습니다. 문제 생성 요청 시에만 선택한 AI 제공자에 직접 전달됩니다.
        </p>
      </div>
    </div>
  );
}
