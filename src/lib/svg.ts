/**
 * AI가 생성한 SVG를 렌더링하기 전에 위험 요소를 제거한다.
 * dangerouslySetInnerHTML로 삽입되므로 스크립트·이벤트 핸들러·외부 참조를 걷어낸다.
 * SVG 형식이 아니면 null을 반환해 그림 없이 문제만 표시한다.
 */
export function sanitizeSvg(input: string): string | null {
  const trimmed = input.trim();
  if (!/^<svg[\s>]/i.test(trimmed) || !/<\/svg>\s*$/i.test(trimmed)) return null;
  return trimmed
    .replace(/<script[\s\S]*?(?:<\/script>|$)/gi, '')
    .replace(/<foreignObject[\s\S]*?(?:<\/foreignObject>|$)/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\s(?:xlink:)?href\s*=\s*"(?!#)[^"]*"/gi, '')
    .replace(/\s(?:xlink:)?href\s*=\s*'(?!#)[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
