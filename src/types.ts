export type SchoolLevel = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';

export type ProblemType = 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';

export type Difficulty = '하' | '중' | '상';

export const PROBLEM_TYPE_LABEL: Record<ProblemType, string> = {
  multiple_choice: '객관식',
  short_answer: '단답형',
  essay: '서술형',
  true_false: 'OX형',
};

export interface Problem {
  id: string;
  type: ProblemType;
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
  /** 도형·그래프가 필요한 문제의 SVG 코드 (AI 생성, 렌더링 전 정화됨) */
  figure?: string;
  /** 혼합 출제 시 이 문제의 난이도 */
  difficulty?: Difficulty;
  /** 배점 (100점 만점 기준 자동 배분, 수정 가능) */
  points?: number;
}

/** 난이도별 문항 수 (혼합 출제) */
export type DifficultyMix = Record<Difficulty, number>;

/** 세트의 난이도 표기: 혼합이면 "하3·중5·상2", 아니면 단일 난이도 */
export function difficultyLabel(set: {
  difficulty: Difficulty;
  difficultyMix?: DifficultyMix;
}): string {
  const m = set.difficultyMix;
  if (m) {
    const parts = (['하', '중', '상'] as Difficulty[])
      .filter((d) => m[d] > 0)
      .map((d) => `${d}${m[d]}`);
    if (parts.length > 1) return parts.join('·');
  }
  return set.difficulty;
}

export interface ProblemSet {
  id: string;
  createdAt: number;
  level: SchoolLevel;
  topic: string;
  difficulty: Difficulty;
  types: ProblemType[];
  problems: Problem[];
  /** 시험명 (시험지 헤더에 표시, 예: "7월 주간 테스트") */
  title?: string;
  /** 혼합 출제 시 난이도별 문항 수 */
  difficultyMix?: DifficultyMix;
}

export type ProviderId = 'gemini' | 'openai_compat';

export interface AppSettings {
  provider: ProviderId;
  geminiApiKey: string;
  geminiModel: string;
  compatBaseUrl: string;
  compatApiKey: string;
  compatModel: string;
  /** 시험지 헤더에 인쇄되는 학원명 */
  academyName: string;
}

export interface GenerateRequest {
  level: SchoolLevel;
  topic: string;
  types: ProblemType[];
  difficulty: Difficulty;
  count: number;
}

/** 선택한 원본 문제를 무작위로 변형해 유사 문제를 만드는 요청 */
export interface SimilarRequest {
  level: SchoolLevel;
  topic: string;
  difficulty: Difficulty;
  count: number;
  seeds: Problem[];
}
