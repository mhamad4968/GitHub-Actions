/**
 * AI・LLM テーマの記事を掲示板の収集対象から除外（CEO 2026-05-19）
 */

/** 685 に残る旧カテゴリ値（新規採用しない） */
export const DEPRECATED_AI_LLM_CATEGORY = "AI・LLM";

/** タイトル・概要・snippet から AI/LLM テーマか判定 */
const AI_LLM_TOPIC_PATTERNS: RegExp[] = [
  /生成\s*[ＡAＩI]/i,
  /大規模言語モデル/,
  /\bLLM\b/i,
  /ChatGPT|GPT-?[345o]|OpenAI/i,
  /Claude|Anthropic/i,
  /GitHub\s+Copilot|Microsoft\s+Copilot|Copilot\s+(?:for|in)/i,
  /機械学習|ディープラーニング|深層学習/,
  /人工知能/,
  /(?:^|[^a-zA-Z])AI(?:技術|サービス|活用|導入|モデル|ツール|規制|スタートアップ)/,
  /(?:^|[^a-zA-Z])AI(?:[^a-zA-Z]|$)/,
  /Google\s+Gemini|Gemini\s+(?:2\.|Pro|Ultra|API|モデル|Flash)/i,
  /\bRAG\b.*(?:実装|入門|活用)/i,
  /プロンプトエンジニア/,
  /AI\s*エージェント/,
  /基盤モデル|ファウンデーションモデル/,
];

export function isAiLlmTopicText(...parts: Array<string | undefined | null>): boolean {
  const text = parts
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .join("\n");
  if (!text) return false;
  return AI_LLM_TOPIC_PATTERNS.some((re) => re.test(text));
}

export function filterOutAiLlmArticles<T extends { title: string; snippet?: string }>(
  articles: T[],
): T[] {
  const kept: T[] = [];
  for (const a of articles) {
    if (isAiLlmTopicText(a.title, a.snippet)) {
      console.log(`[ICT収集] AI・LLMテーマのため候補除外: ${a.title.slice(0, 80)}`);
      continue;
    }
    kept.push(a);
  }
  return kept;
}

export function filterOutAiLlmPicks<
  T extends { title: string; overview?: string; category?: string },
>(picks: T[]): T[] {
  const kept: T[] = [];
  for (const p of picks) {
    if (p.category === DEPRECATED_AI_LLM_CATEGORY) {
      console.log(`[Gemini厳選] AI・LLMカテゴリのためスキップ: ${p.title.slice(0, 80)}`);
      continue;
    }
    if (isAiLlmTopicText(p.title, p.overview)) {
      console.log(`[Gemini厳選] AI・LLMテーマのためスキップ: ${p.title.slice(0, 80)}`);
      continue;
    }
    kept.push(p);
  }
  return kept;
}
