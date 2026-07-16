import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * AI가 $...$ 구분자를 빠뜨리고 LaTeX를 그대로 출력한 경우 보정.
 * 이미 $...$로 감싸인 구간은 건드리지 않고, 그 밖에서 백슬래시 명령이
 * 포함된 비한글 구간을 찾아 $...$로 감싼다. (예: "\sin 35^\circ" → "$\sin 35^\circ$")
 */
function autoWrapLatex(text: string): string {
  if (!/\\[a-zA-Z]/.test(text)) return text;
  return text
    .split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/)
    .map((part, i) => {
      if (i % 2 === 1 || !/\\[a-zA-Z]/.test(part)) return part;
      return part.replace(/[^$가-힣\n]*\\[a-zA-Z][^$가-힣\n]*/g, (run) => {
        const core = run.replace(/^[\s.,?!:;]+/, '').replace(/[\s.,?!:;]+$/, '');
        if (!core) return run;
        return run.replace(core, `$${core}$`);
      });
    })
    .join('');
}

/** $...$ 및 $$...$$ 구간을 KaTeX로 렌더링하고 나머지는 일반 텍스트로 표시 */
export default function MathText({ text: rawText }: { text: string }) {
  const text = autoWrapLatex(rawText);
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
