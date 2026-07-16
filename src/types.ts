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
}

export interface ProblemSet {
  id: string;
  createdAt: number;
  level: SchoolLevel;
  topic: string;
  difficulty: Difficulty;
  types: ProblemType[];
  problems: Problem[];
}

export type ProviderId = 'gemini' | 'openai_compat';

export interface AppSettings {
  provider: ProviderId;
  geminiApiKey: string;
  geminiModel: string;
  compatBaseUrl: string;
  compatApiKey: string;
  compatModel: string;
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
