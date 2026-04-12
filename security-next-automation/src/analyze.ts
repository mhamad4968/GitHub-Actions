/**
 * 631 番ニュースアプリから「今週分」（JST 月〜金・作成日時ベース）のタイトル・概要を取得し、
 * Gemini（GEMINI_MODEL 省略時は gemini-2.5-flash 等へ順次フォールバック）でセキュリティトレンドと対策を約 1000 字にまとめ、
 * 632 番レポートアプリの weekly_trend（画面: 今週の傾向と対策・リッチテキスト）へ 1 件追加する。
 * 429 時は collect 体裁と同様に待機再試行する（gemini-rate-limit.ts）。
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

import { loadConfig, requireGeminiApiKey, resolveApiTokenForAnalyze } from "./lib/config.js";
import { geminiModelCandidates, isGeminiModelNotFoundError } from "./lib/format-news-gemini.js";
import { generateContentWith429Retries } from "./lib/gemini-rate-limit.js";
import { CREATED_TIME_CODE, NEWS_FIELDS, REPORT_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { notifyFailure, notifyRunSummary } from "./lib/notify.js";
import { plainTextToRichTextHtml, stripHtmlToPlain, truncateForLlm } from "./lib/text.js";
import { getRunningWeekRangeJst } from "./lib/week-jst.js";

const MAX_ARTICLES = 45;
const SUMMARY_CHARS_PER_ARTICLE = 320;
/**
 * 週次: 作成日時がその週（月〜金・JST）に入るニュースを全部取得
 */
async function fetchWeekNewsRecords(
  client: ReturnType<typeof createKintoneClient>,
  app: string,
  start: string,
  end: string,
): Promise<Array<Record<string, { value?: unknown }>>> {
  const query = `${CREATED_TIME_CODE} >= "${start}" and ${CREATED_TIME_CODE} <= "${end}"`;
  const fields = [
    NEWS_FIELDS.title,
    NEWS_FIELDS.articleUrl,
    NEWS_FIELDS.summary,
    NEWS_FIELDS.publishedDate,
    NEWS_FIELDS.digest,
  ];
  const out = await client.record.getAllRecordsWithCursor({
    app,
    query,
    fields,
  });
  console.log("[analyze] 週内レコードをカーソル取得で読み込み完了、件数:", out.length);
  return out;
}

function buildCondensedContext(
  records: Array<Record<string, { value?: unknown }>>,
): string {
  let list = records;
  if (list.length > MAX_ARTICLES) {
    console.warn(
      "[analyze] 記事が多いため先頭",
      MAX_ARTICLES,
      "件に絞って LLM 入力を抑制（総数",
      list.length,
      "）",
    );
    list = list.slice(0, MAX_ARTICLES);
  }
  const lines = list.map((r, idx) => {
    const title = String(r[NEWS_FIELDS.title]?.value ?? "");
    const summary = truncateForLlm(
      stripHtmlToPlain(String(r[NEWS_FIELDS.summary]?.value ?? "")),
      SUMMARY_CHARS_PER_ARTICLE,
    );
    const url = String(r[NEWS_FIELDS.articleUrl]?.value ?? "");
    const digestRaw = stripHtmlToPlain(String(r[NEWS_FIELDS.digest]?.value ?? "")).trim();
    const digest =
      digestRaw.length > 0
        ? `\n   要約: ${truncateForLlm(digestRaw, SUMMARY_CHARS_PER_ARTICLE)}`
        : "";
    return `${idx + 1}. ${title}\n   URL: ${url}\n   概要: ${summary}${digest}`;
  });
  return lines.join("\n\n");
}

/**
 * Gemini で今週の傾向と対策を日本語 1000 字前後で生成（429 時は自動再試行）
 */
async function summarizeTrendGemini(apiKey: string, condensed: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt =
    "以下が今週登録されたニュース要約のみです（トークン節約のため短縮済み）。\n\n" + condensed;
  let last404 = "";
  for (const modelId of geminiModelCandidates()) {
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: [
        "あなたは情報セキュリティニュースの編集長です。",
        "入力は Security NEXT 相当のニュース一覧の要約のみです。本文全文はありません。",
        "日本語で、次を必ず含めてください: (1) 今週の傾向（脅威・製品・制度など観点で箇条書き中心）(2) 組織が取るべき対策（優先度が高い順）。",
        "全体でおおよそ900〜1100文字。前置きや謝罪、Markdown見出し記号は不要。",
        "記載内容は入力の範囲に限定し、足りない情報は推測で断定しない。",
      ].join(""),
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 2048,
      },
    });
    try {
      const result = await generateContentWith429Retries(model, prompt, { logTag: "[analyze] Gemini" });
      const text = result.response.text().trim();
      if (!text) throw new Error("Gemini から空の応答が返りました");
      return text;
    } catch (e) {
      if (isGeminiModelNotFoundError(e)) {
        last404 = e instanceof Error ? e.message : String(e);
        console.warn(`[analyze] model=${modelId} が利用不可（404 等）。次候補へ`);
        continue;
      }
      throw e;
    }
  }
  throw new Error(`[analyze] Gemini 全候補が利用不可（404 等）。GEMINI_MODEL または API キーを確認。 ${last404}`);
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  if (!cfg.reportAppId) {
    throw new Error("analyze には KINTONE_REPORT_APP_ID が必要です（632 等）。");
  }
  const geminiKey = requireGeminiApiKey();
  const kintone = createKintoneClient(cfg, resolveApiTokenForAnalyze());
  const week = getRunningWeekRangeJst(new Date());
  console.log("[analyze] 対象週（月曜日）:", week.targetWeekMonday);
  console.log("[analyze] 作成日時範囲 JST:", week.startInclusive, "〜", week.endInclusive);

  const summaryUrl = process.env.NOTIFY_SUMMARY_WEBHOOK_URL;

  const records = await fetchWeekNewsRecords(kintone, cfg.newsAppId, week.startInclusive, week.endInclusive);
  console.log("[analyze] 週内レコード件数:", records.length);

  if (records.length === 0) {
    console.log("[analyze] 対象なしのためレポートを作らず終了");
    await notifyRunSummary(summaryUrl, {
      workflow: "analyze",
      candidateCount: 0,
      addedCount: 0,
      extraLines: [
        `• 対象週（月曜）: ${week.targetWeekMonday}`,
        "• 補足: 週内ニュース 0 件のため週次レコード未作成",
      ],
    });
    return;
  }

  const condensed = buildCondensedContext(records);
  console.log("[analyze] Gemini モデル試行順:", geminiModelCandidates().join(" → "));
  const reportText = await summarizeTrendGemini(geminiKey, condensed);
  console.log("[analyze] LLM 出力文字数:", reportText.length);

  const rich = plainTextToRichTextHtml(reportText);
  await kintone.record.addRecord({
    app: cfg.reportAppId,
    record: {
      [REPORT_FIELDS.targetWeek]: { value: week.targetWeekMonday },
      [REPORT_FIELDS.weeklyTrend]: { value: rich },
    },
  });
  console.log("[analyze] レポートアプリ（632）へ weekly_trend を登録完了");

  await notifyRunSummary(summaryUrl, {
    workflow: "analyze",
    candidateCount: records.length,
    addedCount: 1,
    extraLines: [
      `• 対象週（月曜）: ${week.targetWeekMonday}`,
      `• レポートアプリ ID: ${cfg.reportAppId}`,
      `• 要約文字数: ${reportText.length}`,
    ],
  });
}

main().catch(async (err) => {
  console.error("[analyze] 失敗:", err);
  try {
    const cfg = loadConfig();
    await notifyFailure(cfg.notifyWebhookUrl, {
      workflow: "analyze",
      message: String(err instanceof Error ? err.message : err),
      detail: err instanceof Error ? err.stack : undefined,
    });
  } catch (e) {
    console.error("[analyze] 通知処理エラー:", e);
  }
  process.exitCode = 1;
});
