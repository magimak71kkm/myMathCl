# MathGen — AI 수학 문제 생성기

중학교 1학년부터 고등학교 3학년까지, AI로 수학 문제를 생성하는 웹/데스크탑 앱입니다.

## 주요 기능

- **문제 유형**: 객관식(5지선다) · 단답형 · 서술형 · OX형 (복수 선택 시 혼합 출제)
- **학년 선택**: 중1~고3, 한국 교육과정 기준 단원 목록 내장 + 주제 직접 입력
- **난이도**: 하 / 중 / 상
- **생성 개수**: 한 번에 1~10개
- **수식 렌더링**: KaTeX 기반 LaTeX 수식 표시
- **대시보드**: 생성 통계, 학년별 차트, 최근 기록
- **생성 기록**: 자동 저장(localStorage), 다시 보기 / 삭제
- **인쇄 / PDF**: 정답 숨김 상태로 인쇄하면 학생용 문제지 완성
- **사용자 가이드**: 앱 내 메뉴 포함

## 빠른 시작 (웹)

```bash
npm install
npm run dev        # http://localhost:5173
```

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 Gemini API 키 발급 (카드 불필요)
2. 앱의 **설정** 메뉴에서 키 입력 → 저장 → 연결 테스트
3. **문제 생성** 메뉴에서 학년/단원/유형/개수 선택 후 생성

## AI 제공자 옵션

기본은 **Google Gemini 무료 API**이며, 설정에서 OpenAI 호환 API로 전환할 수 있습니다.

| 제공자 | 비용 | 설정 방법 |
|---|---|---|
| **Gemini** (기본) | 무료 등급 | 설정 → Gemini API 키 입력 |
| **Groq** | 무료 등급, 초고속 | Base URL `https://api.groq.com/openai/v1` + 키 + 모델명 |
| **OpenRouter** | 일부 모델 무료 | Base URL `https://openrouter.ai/api/v1` + 키 + 모델명(`:free` 접미사 모델) |
| **Ollama** (로컬) | 완전 무료, 오프라인 | Base URL `http://localhost:11434/v1`, 키 없음, 모델명 예: `qwen2.5:14b` |
| **Claude / OpenAI** | 유료, 최고 품질 | 프록시 또는 호환 게이트웨이 경유 |

> 참고: 수학 정확도는 대체로 유료 최상위 모델(Claude, GPT, Gemini Pro) > Gemini Flash > 오픈소스 순입니다.
> 상용 서비스로 확장한다면 API 키를 브라우저가 아닌 백엔드 서버에 두는 구조로 전환하세요.

## 배포

### 1) 웹 배포 (가장 간단)

```bash
npm run build      # dist/ 생성
```

`dist/` 폴더를 Vercel, Netlify, GitHub Pages, Cloudflare Pages 등에 올리면 끝납니다.
서버가 필요 없는 정적 사이트입니다.

### 2) 데스크탑 앱 (Windows/Mac) — Electron

```bash
npm install -D electron electron-builder   # 최초 1회
npm run build
npm run electron:dev     # 개발용 실행
npm run electron:build   # 설치 파일 생성 → release/ 폴더 (Windows: NSIS 설치본)
```

더 가벼운 실행 파일을 원하면 [Tauri](https://tauri.app)(Rust 기반, ~10MB)로 같은 `dist/`를 감쌀 수 있습니다.

### 3) 모바일 앱 (Android/iOS) — Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init MathGen kr.mathgen.app --web-dir dist
npm run build && npx cap add android && npx cap sync
npx cap open android   # Android Studio에서 빌드 → APK/AAB
```

## 기술 스택

- React 18 + TypeScript + Vite
- react-router-dom (HashRouter — Electron file:// 호환)
- KaTeX (수식 렌더링)
- localStorage (설정·기록 저장, 서버 불필요)
- Electron (데스크탑 패키징, 선택 사항)

## 프로젝트 구조

```
src/
├── App.tsx               # 레이아웃 + 라우팅 (사이드바 메뉴)
├── pages/
│   ├── Dashboard.tsx     # 대시보드 (통계/차트/최근 기록)
│   ├── Generator.tsx     # 문제 생성 폼 + 결과
│   ├── History.tsx       # 생성 기록
│   ├── Guide.tsx         # 사용자 가이드
│   └── Settings.tsx      # AI 제공자/API 키 설정
├── components/
│   ├── ProblemCard.tsx   # 문제 카드 (보기/정답/풀이)
│   └── MathText.tsx      # $...$ LaTeX → KaTeX 렌더링
├── lib/
│   ├── providers.ts      # Gemini + OpenAI 호환 API 호출
│   ├── prompt.ts         # 출제 프롬프트 + JSON 파싱
│   └── storage.ts        # localStorage 저장소
└── data/curriculum.ts    # 학년별 교육과정 단원
```
