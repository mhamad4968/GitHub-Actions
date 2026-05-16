/**
 * 候補記事を Gemini で厳選（要約3行・カテゴリ・重要度）
 */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ObjectSchema } from "@google/generative-ai";

import type { IctConfig } from "./config.js";
import { ICT_CATEGORIES, type IctCategory } from "./field-codes.js";
import type { RssArticle } from "./rss.js";

const SYSTEM_PROMPT =
  "あなたは企業情報システム部門（情シス）のテックリードです。Microsoft/Windows/M365、PC・端末、セキュリティパッチ・脆弱性、通信機器・ネットワーク製品の動向に強いです。";

const GEMINI_MODEL_FALLBACKS = [
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-pro-latest",
] as const;

const CURATE_RESPONSE_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    picks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          url: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          overview: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          importanceScore: { type: SchemaType.NUMBER },
        },
        required: ["url", "title", "overview", "category"],
      },
    },
  },
  required: ["picks"],
};

export type CuratedPick = {
  url: string;
  title: string;
  overview: string;
  category: IctCategory;
  importanceScore: number;
};

function geminiModelCandidates(primary?: string): string[] {
  if (!primary) return [...GEMINI_MODEL_FALLBACKS];
  return [...new Set([primary, ...GEMINI_MODEL_FALLBACKS])];
}

function isGeminiModelNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/is not supported for generateContent|not found for API version/i.test(msg)) {
    return true;
  }
  if (err !== null && typeof err === "object" && "status" in err && (err as { status?: number }).status === 404) {
    return /generativelanguage|models\//i.test(msg);
  }
  return false;
}

function isValidCategory(c: string): c is IctCategory {
  return (ICT_CATEGORIES as readonly string[]).includes(c);
}

function parseCurateJson(raw: string): { picks?: Array<Record<string, unknown>> } {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return JSON.parse(t) as { picks?: Array<Record<string, unknown>> };
}

/**
 * 候補から残り枠ぶんを Gemini で厳選（重要度スコア付き）
 */
export async function curateWithGemini(
  cfg: IctConfig,
  candidates: RssArticle[],
  slots: number,
): Promise<CuratedPick[]> {
  if (slots <= 0 || candidates.length === 0) return [];

  const listText = candidates
    .slice(0, 60)
    .map(
      (c, i) =>
        `[${i + 1}] url=${c.url}\ntitle=${c.title}\nsnippet=${c.snippet.slice(0, 300)}`,
    )
    .join("\n\n");

  const userPrompt = `${SYSTEM_PROMPT}

以下は IT 技術 RSS の候補記事です。情シスが知っておくべき、重要度・実用性の高いものを **ちょうど ${slots} 件**（候補が少ない場合はその数だけ）選んでください。

優先テーマ（スコアを上げる）:
- Microsoft / Windows / M365 / Azure の更新・脆弱性・ベストプラクティス
- PC・端末・ハードウェア、業務利用に関わる製品情報
- セキュリティ対策、パッチ、CVE、通信機器・ネットワーク機器の注意喚起

要件:
- 重複テーマは避ける
- overview は **日本語で3行**（改行区切り）。英語記事でも日本語で要約。CVE番号・製品名・バージョンは原文表記を残す
- category は次のいずれか1つ: ${ICT_CATEGORIES.join(" / ")}
- importanceScore は 1〜100 の整数

候補:
${listText}`;

  const genAI = new GoogleGenerativeAI(cfg.geminiApiKey);
  const models = geminiModelCandidates(cfg.geminiModel);
  let lastErr: unknown;

  for (const modelName of models) {
    try {
      console.log(`[Gemini] 厳選開始 model=${modelName} 候補=${candidates.length} 枠=${slots}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: CURATE_RESPONSE_SCHEMA,
        },
      });
      const result = await model.generateContent(userPrompt);
      const raw = result.response.text()?.trim();
      if (!raw) {
        throw new Error("Gemini から空の応答が返りました。");
      }

      const parsed = parseCurateJson(raw);
      const candidateByUrl = new Map(candidates.map((c) => [c.url, c]));
      const picks: CuratedPick[] = [];

      for (const row of parsed.picks ?? []) {
        const url = String(row.url ?? "").trim();
        if (!url || !candidateByUrl.has(url)) continue;
        const cat = String(row.category ?? "").trim();
        if (!isValidCategory(cat)) {
          console.warn(`[Gemini] 無効なカテゴリをスキップ: ${cat} url=${url}`);
          continue;
        }
        const src = candidateByUrl.get(url)!;
        picks.push({
          url,
          title: String(row.title || src.title).trim(),
          overview: String(row.overview ?? "").trim(),
          category: cat,
          importanceScore: Number(row.importanceScore) || 50,
        });
      }

      picks.sort((a, b) => b.importanceScore - a.importanceScore);
      return picks.slice(0, slots);
    } catch (e) {
      lastErr = e;
      if (isGeminiModelNotFoundError(e)) {
        console.warn(`[Gemini] モデル ${modelName} は利用不可。次候補へ。`);
        continue;
      }
      throw e;
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`Gemini 厳選に失敗しました（全モデル試行済）: ${msg}`);
}
