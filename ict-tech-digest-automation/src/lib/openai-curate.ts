import OpenAI from "openai";

import type { IctConfig } from "./config.js";
import { ICT_CATEGORIES, type IctCategory } from "./field-codes.js";
import type { RssArticle } from "./rss.js";

const SYSTEM_PROMPT =
  "あなたは最新のIT技術トレンドやモダンな開発手法、インフラ技術に精通した、企業情報システム部門（情シス）のテックリードです。";

export type CuratedPick = {
  url: string;
  title: string;
  overview: string;
  category: IctCategory;
  importanceScore: number;
};

type LlmRow = {
  url: string;
  title: string;
  overview: string;
  category: string;
  importanceScore?: number;
};

function isValidCategory(c: string): c is IctCategory {
  return (ICT_CATEGORIES as readonly string[]).includes(c);
}

/**
 * 候補から残り枠ぶんを OpenAI で厳選（重要度スコア付き）
 */
export async function curateWithOpenAi(
  cfg: IctConfig,
  candidates: RssArticle[],
  slots: number,
): Promise<CuratedPick[]> {
  if (slots <= 0 || candidates.length === 0) return [];

  const client = new OpenAI({ apiKey: cfg.openaiApiKey });
  const listText = candidates
    .slice(0, 40)
    .map(
      (c, i) =>
        `[${i + 1}] url=${c.url}\ntitle=${c.title}\nsnippet=${c.snippet.slice(0, 300)}`,
    )
    .join("\n\n");

  const userPrompt = `以下は IT 技術 RSS の候補記事です。情シスが知っておくべき、重要度・実用性の高いものを **ちょうど ${slots} 件**（候補が少ない場合はその数だけ）選んでください。

要件:
- 重複テーマは避ける
- overview は **日本語で3行**（改行区切り）。技術的に具体的に
- category は次のいずれか1つ: ${ICT_CATEGORIES.join(" / ")}
- importanceScore は 1〜100 の整数

**JSON のみ** 返答。形式:
{"picks":[{"url":"...","title":"...","overview":"行1\\n行2\\n行3","category":"...","importanceScore":85}]}

候補:
${listText}`;

  console.log(`[OpenAI] 厳選開始 model=${cfg.openaiModel} 候補=${candidates.length} 枠=${slots}`);

  const completion = await client.chat.completions.create({
    model: cfg.openaiModel,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI から空の応答が返りました。");
  }

  let parsed: { picks?: LlmRow[] };
  try {
    parsed = JSON.parse(raw) as { picks?: LlmRow[] };
  } catch {
    throw new Error(`OpenAI 応答の JSON 解析に失敗しました: ${raw.slice(0, 200)}`);
  }

  const picks: CuratedPick[] = [];
  const candidateByUrl = new Map(candidates.map((c) => [c.url, c]));

  for (const row of parsed.picks ?? []) {
    const url = row.url?.trim();
    if (!url || !candidateByUrl.has(url)) continue;
    const cat = row.category?.trim() ?? "";
    if (!isValidCategory(cat)) {
      console.warn(`[OpenAI] 無効なカテゴリをスキップ: ${cat} url=${url}`);
      continue;
    }
    const src = candidateByUrl.get(url)!;
    picks.push({
      url,
      title: (row.title || src.title).trim(),
      overview: (row.overview || "").trim(),
      category: cat,
      importanceScore: Number(row.importanceScore) || 50,
    });
  }

  picks.sort((a, b) => b.importanceScore - a.importanceScore);
  return picks.slice(0, slots);
}
