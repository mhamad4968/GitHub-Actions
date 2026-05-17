/**
 * 候補記事を Gemini で厳選（要約3行・カテゴリ・重要度）
 */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ObjectSchema } from "@google/generative-ai";

import type { IctConfig } from "./config.js";
import { ICT_CATEGORIES, type IctCategory } from "./field-codes.js";
import { normalizeOverview } from "./overview-format.js";
import type { RssArticle } from "./rss.js";
import {
  applyDomesticScoreBoost,
  filterPicksBySourceRegion,
} from "./source-region.js";

const SYSTEM_PROMPT =
  "あなたは最新のIT技術トレンド、モダンな開発手法、インフラ、SaaS（Box等）、IT資格・DX人材育成、および最新のセキュリティ製品動向に精通した、企業情報システム部門（情シス）のテックリードです。運用ノイズ（アラート・注意喚起の過多）を避け、真に重要なインフラ対策情報だけを厳選します。パッチ・CVE は下記の重要度ルールを絶対条件とし、境界が曖昧な記事は選ばないでください。";

/** 情シス向けパッチ・CVE 採用基準（CEO 合意・厳格運用） */
const PATCH_AND_CVE_POLICY = `
【パッチ・CVE の重要度ルール（絶対条件・違反する記事は選ばない）】
目的: アラート情報の過多による運用ノイズを抑え、真に重要なインフラ対策情報だけを残す。

■ 採用してよいもの
1. Microsoft Patch Tuesday 等の **月次パッチまとめ**（全体概要・複数製品の一覧）→ **同じ月のまとめは最大1本まで**
2. **個別の CVE / 個別パッチ記事** → 次の **すべてを満たす場合のみ** 採用可:
   - MSRC（または原典）で深刻度が **Critical** と明示されている、または
   - **野外悪用（Exploitation detected / 攻撃報告あり）** が確認されている、または
   - **CVSS ベーススコアが 9.0 以上**
   ※上記3条件のいずれか1つを満たせば可。満たさない個別CVE記事は **必ず除外**。

■ 必ず除外するもの（1件も選ばない）
- 深刻度が **Important のみ** の個別パッチ・個別 CVE（Critical でない限り不可）
- **情報提供・告知のみ** で緊急対応不要なパッチ単体
- JPCERT/IPA 型の **注意喚起・攻撃手法・インシデント速報・アラート告知**
- 製品名だけの脆弱性列挙で、上記 Critical/野外悪用/CVSS9+ の根拠が読み取れない記事
- 「パッチがリリースされた」程度で、自社インフラへの緊急度が説明されていない低重要度の個別項目

■ 判定が曖昧なとき
- 個別 CVE / 個別パッチで Critical・野外悪用・CVSS9+ のいずれも確認できない → **除外**
- 月次まとめと個別 CVE が重なる → **月次まとめ1本に集約**し、個別は上記を満たすものだけ残す（枠を圧迫しない）

■ 採用してよいセキュリティ系（パッチ以外）
- セキュリティ **製品のリリース**、**技術動向**、情シス運用に役立つ **製品ニュース**（脆弱性アラートではないもの）
`;

/** 情報源の地域（v2.1・CEO 指示） */
export const SOURCE_REGION_POLICY = `
【情報源の地域（国内優先・DXカテゴリは国内のみ）】
- **全体**: 同等の重要度では **日本向け・国内メディア・国内公式**（.jp / .go.jp、Qiita/Zenn/ITmedia/日経 xTECH/IPA 等）を優先する。海外メディア単体の一般 IT ニュースは下げる
- **カテゴリ「DX人材・IT資格・組織」**: **国内のみ採用可**。日本の IT 資格・リスキリング・DX 人材・組織・働き方・政府/業界団体の国内発表に限る。海外資格制度のみ・海外組織論のみの記事は **選ばない**
- **Microsoft / MSRC / NVD 等の海外 URL**: パッチ・CVE・セキュリティ製品として **他カテゴリ**（例: セキュリティ製品・技術、インフラ・通信・端末）で採用し、**DX人材・IT資格・組織には付けない**
`;

const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
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

function formatRegisteredTitles(titles: string[]): string {
  if (titles.length === 0) {
    return "（登録済みタイトルはありません）";
  }
  return titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
}

/**
 * 候補から残り枠ぶんを Gemini で厳選（重要度スコア付き）
 */
export async function curateWithGemini(
  cfg: IctConfig,
  candidates: RssArticle[],
  slots: number,
  registeredTitles: string[],
): Promise<CuratedPick[]> {
  if (slots <= 0 || candidates.length === 0) return [];

  const listText = candidates
    .slice(0, 60)
    .map(
      (c, i) =>
        `[${i + 1}] url=${c.url}\ntitle=${c.title}\nsnippet=${c.snippet.slice(0, 300)}`,
    )
    .join("\n\n");

  const titlesBlock = formatRegisteredTitles(registeredTitles.slice(0, 150));

  const userPrompt = `${SYSTEM_PROMPT}

以下は複数メディアの RSS を横断して集めた候補記事です。
登録済みタイトル一覧（過去12ヶ月・最新${Math.min(registeredTitles.length, 150)}件）と内容やテーマが酷似している記事（同じ製品発表の別メディア、同じ技術紹介など）は重複とみなし、厳選対象から除外してください。

【登録済みタイトル一覧】
${titlesBlock}

【厳選タスク】
残り枠 **${slots} 件**（候補が少ない場合はその数だけ）だけ、情シスが実務や社内人材育成で知っておくべき、重要度・実用性の高い IT 技術・トレンド情報を選んでください。

${PATCH_AND_CVE_POLICY}

${SOURCE_REGION_POLICY}

【選定の優先（importanceScore が高い順のイメージ）】
- インフラ・PC・SaaS・開発トレンド・DX 人材など、情シス実務に直結する話題
- **国内ソースを同等以上に優先**（海外と迷ったら国内を上げる）
- 開発トレンドのみで運用影響が薄い記事は下げる

【出力要件】
- 重複テーマは避ける（同じ CVE / 同じ Patch Tuesday は1件に集約）
- overview は **必ず次の3行**（改行区切り・行頭ラベル付き）。英語記事も日本語で:
  【事象】何が起きたか（1文）
  【影響】自社のインフラ・PC・セキュリティ運用への影響（1文）
  【推奨】情シスが今日取るべきアクション（1文で具体に）
- category は次のいずれか1つのみ: ${ICT_CATEGORIES.join(" / ")}
- importanceScore は 1〜100
- url は候補リストの url を**そのまま**使う（捏造禁止）。タイトル・概要の製品名と url のドメインが明らかに矛盾する候補は選ばない

候補:
${listText}`;

  const genAI = new GoogleGenerativeAI(cfg.geminiApiKey);
  const models = geminiModelCandidates(cfg.geminiModel);
  let lastErr: unknown;

  for (const modelName of models) {
    try {
      console.log(
        `[Gemini厳選] 開始 model=${modelName} 候補=${candidates.length} 枠=${slots} 登録済みタイトル=${registeredTitles.length}件`,
      );
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
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
          console.warn(`[Gemini厳選] 無効なカテゴリのためスキップ: ${cat} url=${url}`);
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

      const boosted = applyDomesticScoreBoost(picks);
      const filtered = filterPicksBySourceRegion(boosted);
      filtered.sort((a, b) => b.importanceScore - a.importanceScore);
      const finalPicks = filtered.slice(0, slots);
      if (finalPicks.length < picks.length) {
        console.log(
          `[Gemini厳選] 地域フィルタ後: ${picks.length} → ${filtered.length} 件（登録 ${finalPicks.length} 件）`,
        );
      }
      return finalPicks;
    } catch (e) {
      lastErr = e;
      if (isGeminiModelNotFoundError(e)) {
        console.warn(`[Gemini厳選] モデル ${modelName} は利用不可。次候補へ。`);
        continue;
      }
      throw e;
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`Gemini 厳選に失敗しました（全モデル試行済）: ${msg}`);
}
