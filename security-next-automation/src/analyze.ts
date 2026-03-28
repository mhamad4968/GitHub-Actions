import OpenAI from "openai";

import { loadConfig, requireOpenAiKey, resolveApiTokenForAnalyze } from "./lib/config.js";
import { CREATED_TIME_CODE, NEWS_FIELDS, REPORT_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { notifyFailure } from "./lib/notify.js";
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

async function summarizeTrend(client: OpenAI, model: string, condensed: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.35,
    max_tokens: 1800,
    messages: [
      {
        role: "system",
        content: [
          "あなたは情報セキュリティニュースの編集長です。",
          "入力は Security NEXT 相当のニュース一覧の要約のみです。本文全文はありません。",
          "日本語で、次を必ず含めてください: (1) 今週の傾向（脅威・製品・制度など観点で箇条書き中心）(2) 組織が取るべき対策（優先度が高い順）。",
          "全体でおおよそ900〜1100文字。前置きや謝罪、Markdown見出し記号は不要。",
          "記載内容は入力の範囲に限定し、足りない情報は推測で断定しない。",
        ].join(""),
      },
      {
        role: "user",
        content: `以下が今週登録されたニュース要約のみです（トークン節約のため短縮済み）。\n\n${condensed}`,
      },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI から空の応答が返りました");
  return text;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  if (!cfg.reportAppId) {
    throw new Error("analyze には KINTONE_REPORT_APP_ID が必要です。");
  }
  const kintone = createKintoneClient(cfg, resolveApiTokenForAnalyze());
  const week = getRunningWeekRangeJst(new Date());
  console.log("[analyze] 対象週（月曜日）:", week.targetWeekMonday);
  console.log("[analyze] 作成日時範囲 JST:", week.startInclusive, "〜", week.endInclusive);

  const records = await fetchWeekNewsRecords(kintone, cfg.newsAppId, week.startInclusive, week.endInclusive);
  console.log("[analyze] 週内レコード件数:", records.length);

  if (records.length === 0) {
    console.log("[analyze] 対象なしのためレポートを作らず終了");
    return;
  }

  const condensed = buildCondensedContext(records);
  const openai = new OpenAI({ apiKey: requireOpenAiKey(cfg) });
  const reportText = await summarizeTrend(openai, cfg.openaiModel, condensed);
  console.log("[analyze] LLM 出力文字数:", reportText.length);

  const rich = plainTextToRichTextHtml(reportText);
  await kintone.record.addRecord({
    app: cfg.reportAppId,
    record: {
      [REPORT_FIELDS.targetWeek]: { value: week.targetWeekMonday },
      [REPORT_FIELDS.weeklyTrend]: { value: rich },
    },
  });
  console.log("[analyze] レポートアプリへ登録完了");
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
