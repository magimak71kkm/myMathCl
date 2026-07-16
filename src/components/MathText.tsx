import katex from 'katex';
import 'katex/dist/katex.min.css';

/** $...$ 및 $$...$$ 구간을 KaTeX로 렌더링하고 나머지는 일반 텍스트로 표시 */
export default function MathText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  // $$...$$ 우선, 그다음 $...$
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const latex = match[1] ?? match[2];
    const displayMode = match[1] !== undefined;
    let html = '';
    try {
      html = katex.renderToString(latex, { displayMode, throwOnError: false });
      parts.push(<span key={key++} dangerouslySetInnerHTML={{ __html: html }} />);
    } catch {
      parts.push(<span key={key++}>{match[0]}</span>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <span className="math-text">{parts}</span>;
}
