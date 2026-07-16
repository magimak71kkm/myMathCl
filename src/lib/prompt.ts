import type { Difficulty, GenerateRequest, SimilarRequest } from '../types';
import { PROBLEM_TYPE_LABEL } from '../types';

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  하: '기본 개념 확인 수준. 하나의 개념을 1~2단계 계산으로 적용하는 문제.',
  중: '학교 시험 평균 수준. 풀이에 2~3단계가 필요하고, 공식에 숫자만 대입하면 바로 풀리는 문제는 내지 마세요.',
  상: '학교 시험 최고난도(변별력 문항)~모의고사 준킬러 수준. 두 개 이상의 개념을 결합하고, 조건을 해석·변형하거나 역으로 추론하는 3단계 이상의 풀이가 필요해야 합니다. 교과서에 그대로 나오는 정형화된 유형은 금지합니다.',
};

const DIFFICULTY_RULE =
  '난이도 기준을 엄격하게 지키세요. 출제자가 만드는 문제는 의도보다 쉬워지는 경향이 있으므로, 지정된 난이도의 상한선에 맞춰 출제하세요. 요청 난이도보다 쉬운 문제는 조건 결합·단계 추가로 반드시 끌어올리세요.';

export function buildPrompt(req: GenerateRequest): string {
  const typeNames = req.types.map((t) => PROBLEM_TYPE_LABEL[t]).join(', ');
  return `당신은 한국 수학 교육과정 전문 출제위원입니다. 아래 조건에 맞는 수학 문제를 출제하세요.

[출제 조건]
- 학년: ${req.level} (한국 교육과정 기준)
- 단원/주제: ${req.topic}
- 난이도: ${req.difficulty} — ${DIFFICULTY_GUIDE[req.difficulty]}
- 문제 수: ${req.count}개
- 문제 유형: ${typeNames} (여러 유형이면 골고루 섞어서 출제)

[난이도 지침]
${DIFFICULTY_RULE}

[출제 규칙]
1. 반드시 해당 학년 교육과정 범위 내에서만 출제하세요.
2. 수식은 LaTeX로 작성하고 $...$ 로 감싸세요. 예: $x^2 + 2x + 1 = 0$. JSON 문자열 안이므로 LaTeX 백슬래시는 반드시 두 번 써서 이스케이프하세요. 예: "$\\\\frac{1}{2}x$"
3. 객관식(multiple_choice)은 보기 5개를 만들고, answer에는 정답 보기의 내용을 그대로 쓰세요.
4. OX형(true_false)은 choices를 ["O", "X"]로 하고 answer는 "O" 또는 "X"로 쓰세요.
5. 단답형(short_answer)과 서술형(essay)은 choices를 생략하세요.
6. 모든 문제에 상세한 풀이 과정(explanation)을 포함하세요.
7. 계산이 실제로 맞는지 반드시 검산한 후 출제하세요.

[출력 형식]
아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트나 마크다운 코드블록 없이 순수 JSON만 출력하세요.
[
  {
    "type": "multiple_choice" | "short_answer" | "essay" | "true_false",
    "question": "문제 내용",
    "choices": ["보기1", "보기2", "보기3", "보기4", "보기5"],
    "answer": "정답",
    "explanation": "상세 풀이"
  }
]`;
}

const JSON_FORMAT_RULE = `[출력 형식]
아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트나 마크다운 코드블록 없이 순수 JSON만 출력하세요.
[
  {
    "type": "multiple_choice" | "short_answer" | "essay" | "true_false",
    "question": "문제 내용",
    "choices": ["보기1", "보기2", "보기3", "보기4", "보기5"],
    "answer": "정답",
    "explanation": "상세 풀이"
  }
]`;

export function buildSimilarPrompt(req: SimilarRequest): string {
  const seedList = req.seeds
    .map((p, i) => {
      const lines = [`${i + 1}. [유형: ${p.type} (${PROBLEM_TYPE_LABEL[p.type]})]`];
      lines.push(`   문제: ${p.question}`);
      if (p.choices && p.choices.length > 0) lines.push(`   보기: ${p.choices.join(' / ')}`);
      lines.push(`   정답: ${p.answer}`);
      return lines.join('\n');
    })
    .join('\n');

  return `당신은 한국 수학 교육과정 전문 출제위원입니다. 아래 [원본 문제]를 바탕으로 같은 개념을 평가하는 "유사 변형 문제"를 정확히 ${req.count}개 출제하세요.

[조건]
- 학년: ${req.level} / 단원: ${req.topic}
- 난이도: ${req.difficulty} — ${DIFFICULTY_GUIDE[req.difficulty]}
- ${DIFFICULTY_RULE}
- 원본 문제의 개념과 풀이 방법은 유지하되, 숫자·계수·식·소재를 무작위로 바꾸어 새로운 문제를 만드세요.
- 원본 문제가 여러 개이면 ${req.count}개를 원본들에 무작위로 배분해 변형하세요. (반드시 균등할 필요 없음)
- 각 변형 문제의 type은 그 원본 문제의 type과 같게 하세요.
- 변형 문제의 정답이 원본 정답과 같아지지 않도록 값을 고르고, 계산이 맞는지 반드시 검산하세요.
- 수식은 LaTeX로 작성하고 $...$ 로 감싸세요. JSON 문자열 안이므로 LaTeX 백슬래시는 반드시 두 번 써서 이스케이프하세요. 예: "$\\\\frac{1}{2}x$"
- 객관식은 보기 5개, OX형은 choices를 ["O","X"]로, 단답형/서술형은 choices 생략.
- 모든 문제에 상세 풀이(explanation)를 포함하세요.
- 변형 무작위 시드: ${Math.floor(Math.random() * 1_000_000)}

[원본 문제]
${seedList}

${JSON_FORMAT_RULE}`;
}

/** 첫 '['부터 문자열 내부를 무시하며 괄호 짝이 맞는 지점까지 잘라 배열 텍스트만 추출 */
function extractBalancedArray(text: string): string | null {
  const start = text.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * AI가 LaTeX 백슬래시를 이스케이프하지 않고 출력한 경우 복구.
 * 유효한 JSON 이스케이프는 유지하고, 그 외(\sqrt, \pi 등)는 \\ 리터럴로 바꾼다.
 * \n·\t 등도 바로 뒤에 영문자가 이어지면 LaTeX 명령(\neq, \theta 등)으로 간주한다.
 */
function repairInvalidEscapes(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = s[i + 1] ?? '';
    if (next === '"' || next === '\\' || next === '/') {
      out += ch + next;
      i++;
      continue;
    }
    if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6))) {
      out += s.slice(i, i + 6);
      i += 5;
      continue;
    }
    if ('bfnrt'.includes(next) && !/[a-zA-Z]/.test(s[i + 2] ?? '')) {
      out += ch + next;
      i++;
      continue;
    }
    out += '\\\\';
  }
  return out;
}

/** AI 응답 텍스트에서 JSON 배열을 추출해 파싱 */
export function parseProblemsJson(text: string): unknown[] {
  let cleaned = text.trim();
  // 코드블록 제거
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const arrayText = extractBalancedArray(cleaned);
  if (!arrayText) {
    throw new Error('AI 응답에서 JSON 배열을 찾을 수 없습니다.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(repairInvalidEscapes(arrayText));
  } catch {
    throw new Error('AI 응답의 JSON 형식이 올바르지 않습니다. 다시 생성해 주세요.');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('AI 응답이 배열 형식이 아닙니다.');
  }
  return parsed;
}
