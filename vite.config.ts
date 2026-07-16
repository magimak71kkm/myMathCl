import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — Electron(file://) 및 하위 경로 배포에서도 동작하도록 상대 경로 사용
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // 한국 시간 기준 빌드 날짜 (사이드바 "업데이트" 표기용)
    __BUILD_DATE__: JSON.stringify(
      new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()),
    ),
  },
});
