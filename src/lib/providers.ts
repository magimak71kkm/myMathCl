import type {
  AppSettings,
  GenerateRequest,
  Problem,
  ProblemType,
  SimilarRequest,
} from '../types';
import { buildPrompt, buildSimilarPrompt, parseProblemsJson } from './prompt';

const VALID_TYPES: ProblemType[] = ['multiple_choice', 'short_answer', 'essay', 'true_false'];

function normalizeProblems(
  raw: unknown[],
  fallbackType: ProblemType,
  count: number,
): Problem[] {
  const problems: Problem[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const p = item as Record<string, unknown>;
    const type = VALID_TYPES.includes(p.type as ProblemType)
      ? (p.type as ProblemType)
      : fallbackType;
    const question = String(p.question ?? '').trim();
    const answer = String(p.answer ?? '').trim();
    if (!question || !answer) continue;
    problems.push({
      id: crypto.randomUUID(),
      type,
      question,
      choices: Array.isArray(p.choices) ? p.choices.map(String) : undefined,
      answer,
      explanation: String(p.explanation ?? '').trim(),
    });
  }
  if (problems.length === 0) {
    throw new Error('생성된 문제가 없습니다. 다시 시도해 주세요.');
  }
  return problems.slice(0, count);
}

/** 일시적 오류(서버 과부하·속도 제한)는 지수 백오프로 자동 재시도 */
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.ok || attempt >= maxRetries || !RETRYABLE_STATUSES.includes(res.status)) {
      return res;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
  }
}

async function callGemini(prompt: string, settings: AppSettings): Promise<string> {
  if (!settings.geminiApiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정 메뉴에서 API 키를 입력하세요.');
  }
  const model = settings.geminiModel || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': settings.geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.9,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 400 || res.status === 403) {
      throw new Error('API 키가 올바르지 않습니다. 설정에서 키를 확인하세요.');
    }
    if (res.status === 429) {
      throw new Error('무료 사용량 한도를 초과했습니다. 잠시 후 다시 시도하세요.');
    }
    if (res.status === 503) {
      throw new Error('Gemini 서버가 혼잡합니다. 자동 재시도에도 실패했으니 잠시 후 다시 시도하세요.');
    }
    throw new Error(`Gemini API 오류 (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini 응답이 비어 있습니다. 다시 시도해 주세요.');
  return text;
}

/** OpenAI 호환 API (OpenRouter, Groq, Ollama 등) */
async function callOpenAICompat(prompt: string, settings: AppSettings): Promise<string> {
  if (!settings.compatBaseUrl || !settings.compatModel) {
    throw new Error('OpenAI 호환 API의 Base URL과 모델명을 설정에서 입력하세요.');
  }
  const url = `${settings.compatBaseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.compatApiKey) headers['Authorization'] = `Bearer ${settings.compatApiKey}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.compatModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API 오류 (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('AI 응답이 비어 있습니다. 다시 시도해 주세요.');
  return text;
}

async function callAI(prompt: string, settings: AppSettings): Promise<unknown[]> {
  const text =
    settings.provider === 'gemini'
      ? await callGemini(prompt, settings)
      : await callOpenAICompat(prompt, settings);
  return parseProblemsJson(text);
}

export async function generateProblems(
  req: GenerateRequest,
  settings: AppSettings,
): Promise<Problem[]> {
  const raw = await callAI(buildPrompt(req), settings);
  return normalizeProblems(raw, req.types[0], req.count);
}

/** 선택한 원본 문제들을 무작위 변형한 유사 문제 생성 */
export async function generateSimilarProblems(
  req: SimilarRequest,
  settings: AppSettings,
): Promise<Problem[]> {
  const raw = await callAI(buildSimilarPrompt(req), settings);
  return normalizeProblems(raw, req.seeds[0].type, req.count);
}
