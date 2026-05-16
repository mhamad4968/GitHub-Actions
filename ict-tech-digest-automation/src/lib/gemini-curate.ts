/**
 * 候補記事を Gemini で厳選（要約3行・カテゴリ・重要度）
 */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ObjectSchema } from "@google/generative-ai";

import type { IctConfig } from "./config.js";
import { ICT_CATEGORIES, type IctCategory } from "./field-codes.js";
import { normalizeOverview } from "./overview-format.js";
import type { RssArticle } from "./rss.js";

const SYSTEM_PROMPT =
  "あなたは企業情報システム部門（情シス）のテックリードです。複数メディアの RSS を横断し、「今日、自社のインフラ・PC 管理で最も重要なニュース」だけを選び、業務で即使える形に要約します。";

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

以下は **20以上の RSS フィードを横断**して集めた候補記事です。
**「今日、自社のインフラ・PC 管理において最も重要なニュース」** を重要度で比較し、**ちょうど ${slots} 件**（候補が少ない場合はその数だけ）だけ選んでください。

選定基準（importanceScore が高い順のイメージ）:
- Windows / Office の月例パッチ・緊急 CVE（MSRC Update Guide 等）→ パッチ適用判断に直結
- 社内 PC・サーバー・ネットワーク機器（ルーター/UTM/VPN）への実害リスク
- 大規模障害・ゼロデイ・野外悪用・ベンダー必須対応
- 開発トレンドのみで運用影響が薄い記事は下げる

要件:
- 重複テーマは避ける（同じ CVE / 同じ Patch Tuesday は1件に集約）
- overview は **必ず次の3行**（改行区切り・行頭ラベル付き）。英語記事も日本語で:
  【事象】何が起きたか（1文・CVE/製品名/バージョンは原文表記可）
  【影響】自社のインフラ・PC・セキュリティ運用への影響（1文）
  【推奨】情シスが今日取るべきアクション（パッチ判断・確認・周知など1文で具体に）
- category は次のいずれか1つ（記事内容に最も近いもの）: ${ICT_CATEGORIES.join(" / ")}
  - 目安: パッチ/CVE → Microsoft・Windows または セキュリティ・脆弱性 / Box・Teams・Workspace → SaaS・文書管理 / 試験・AWS資格・リスキリング → 資格・リスキリング / 内製化・DX人材・組織改革 → DX人材・組織 / 情シス部長・法改正対応 → 情シス・IT部門 / IPA調査・DX指標 → IPA・政策調査 / SIer・買収 → ITベンダー・DX
- importanceScore は 1〜100（上記基準で「今日の業務優先度」）
- url は候補リストの url を**そのまま**使う（捏造禁止）。タイトル・概要の製品名と url のドメインが明らかに矛盾する候補は選ばない（例: PostgreSQL / NGINX の記事に msrc.microsoft.com の CVE 個別 URL は不適切）

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
          overview: normalizeOverview(String(row.overview ?? "")),
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
