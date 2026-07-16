/** 앱 전체(화면·인쇄)에 적용되는 글꼴 선택 */

export interface FontOption {
  id: string;
  label: string;
  stack: string;
  /** Google Fonts 패밀리 쿼리 (시스템 글꼴이면 없음) */
  googleFamily?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'system',
    label: '시스템 기본 (고딕)',
    stack: "'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  },
  {
    id: 'noto-sans',
    label: '본고딕 Noto Sans KR (깔끔한 고딕)',
    stack: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
    googleFamily: 'Noto+Sans+KR:wght@400;600;700',
  },
  {
    id: 'nanum-gothic',
    label: '나눔고딕',
    stack: "'Nanum Gothic', 'Malgun Gothic', sans-serif",
    googleFamily: 'Nanum+Gothic:wght@400;700;800',
  },
  {
    id: 'nanum-myeongjo',
    label: '나눔명조 (교과서·시험지 느낌)',
    stack: "'Nanum Myeongjo', 'Batang', serif",
    googleFamily: 'Nanum+Myeongjo:wght@400;700;800',
  },
  {
    id: 'gowun-batang',
    label: '고운바탕 (부드러운 명조)',
    stack: "'Gowun Batang', 'Batang', serif",
    googleFamily: 'Gowun+Batang:wght@400;700',
  },
];

const FONT_LINK_ID = 'app-font-link';

/** 선택한 글꼴을 문서 전체에 적용 (웹폰트는 필요할 때만 로드) */
export function applyFont(id: string): void {
  const font = FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
  if (font.googleFamily) {
    const href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }
  document.documentElement.style.setProperty('--app-font', font.stack);
}
