/**
 * 파일 저장 공통 헬퍼.
 * 모바일(특히 카카오톡·네이버 등 인앱 브라우저)은 blob: 다운로드를 시스템
 * 다운로드 관리자에 넘겨 "네트워크에 접속할 수 없습니다" 오류가 나는 경우가
 * 많아, 모바일에서는 공유 시트(Web Share API)로 저장을 우선 시도한다.
 */
export async function saveFile(blob: Blob, fileName: string): Promise<void> {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile && typeof navigator.canShare === 'function') {
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return; // 사용자가 공유 취소
        // 공유 불가 환경이면 일반 다운로드로 폴백
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 즉시 revoke하면 일부 모바일 브라우저에서 다운로드가 끊긴다
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
