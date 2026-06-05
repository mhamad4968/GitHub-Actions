/**
 * 631 番ニュースアプリから「今週分」（JST 月〜金・作成日時ベース）のタイトル・概要を取得し、
 * Gemini（GEMINI_MODEL 省略時は format-news-gemini の GEMINI_MODEL_FALLBACKS）で
 * セキュリティトレンドと対策を資料向けの構成（【】見出し・箇条書き）でまとめ、
 * 632 番レポートアプリへ投入する。
 * - target_week をキーに既存レコードがあれば更新（PUT）、なければ追加（POST）。
 * - 参照エビデンス・1 行サマリー・GitHub run_id を内部／表示用フィールドに保存。
 */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ObjectSchema } from "@google/generative-ai";
import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

import { loadConfig, requireGeminiApiKey, resolveApiTokenForAnalyze } from "./lib/config.js";
import { geminiModelCandidates, isGeminiBillingDeniedError, isGeminiModelNotFoundError } from "./lib/format-news-gemini.js";
import { generateContentWith429Retries } from "./lib/gemini-rate-limit.js";
import { CREATED_TIME_CODE, NEWS_FIELDS, REPORT_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { notifyFailure, notifyRunSummary } from "./lib/notify.js";
import { plainTextToRichTextHtml, stripHtmlToPlain, truncateForLlm } from "./lib/text.js";
import { getRunningWeekRangeJst } from "./lib/week-jst.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Asia/Tokyo";
const MAX_ARTICLES = 45;
const SUMMARY_CHARS_PER_ARTICLE = 320;
const SUMMARY_ONE_LINE_MAX = 200;

/** Gemini の structured JSON 出力用（weekly_article 内の生の " で JSON が壊れるのを防ぐ） */
const WEEKLY_REPORT_RESPONSE_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    weekly_article: { type: SchemaType.STRING },
    summary_one_line: { type: SchemaType.STRING },
  },
  required: ["weekly_article", "summary_one_line"],
};

type WeeklyGeminiOut = {
  weekly_article: string;
  summary_one_line: string;
};

function nowJstForKintoneDatetime(): string {
  return dayjs().tz(TZ).format("YYYY-MM-DDTHH:mm:ssZ");
}

function recordNumericId(r: Record<string, { value?: unknown }>): number | null {
  const raw = (r as { $id?: { value?: unknown } }).$id?.value;
  if (raw === undefined || raw === null) return null;
  const n = Number(String(raw));
  return Number.isFinite(n) ? n : null;
}

/**
 * 既存週レコードの扱い: `update`（既定）= upsert、`skip` = 既存があれば何もしない
 */
function resolveExistingWeekBehavior(): "update" | "skip" {
  const v = process.env.ANALYZE_EXISTING_WEEK_RECORD?.trim().toLowerCase();
  if (v === "skip") return "skip";
  return "update";
}

function githubRunIdForEvidence(): string {
  const id = process.env.GITHUB_RUN_ID?.trim();
  return id || "local";
}

function buildGeminiBillingFallback(
  targetWeekMonday: string,
  weekRecordCount: number,
  usedCount: number,
): WeeklyGeminiOut {
  const weekly_article = [
    "【週の全体像】",
    `Gemini API が利用できないため（403 課金/dunning）、自動要約を生成できませんでした。対象週（月曜）${targetWeekMonday}、週内ニュース ${weekRecordCount} 件（LLM 入力 ${usedCount} 件）。Google Cloud 請求・GEMINI_API_KEY 確認後、workflow_dispatch で analyze を再実行してください。`,
    "",
    "【推奨アクション（優先度付き）】",
    "・【高】Google Cloud Console で請求先アカウント・Generative Language API を確認",
    "・【高】GitHub Environment kintone-collect の GEMINI_API_KEY を更新",
    "・【中】復旧後に security-next-kintone を手動再実行（job=analyze）",
  ].join("\n");
  const summary_one_line = `Gemini不可(403)。週${targetWeekMonday}・${weekRecordCount}件。要再実行。`.slice(
    0,
    SUMMARY_ONE_LINE_MAX,
  );
  return { weekly_article, summary_one_line };
}

function parseWeeklyReportJson(raw: string): WeeklyGeminiOut {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  const o = JSON.parse(t) as { weekly_article?: unknown; summary_one_line?: unknown };
  const weekly_article = typeof o.weekly_article === "string" ? o.weekly_article.trim() : "";
  let summary_one_line =
    typeof o.summary_one_line === "string" ? o.summary_one_line.trim().replace(/\s+/g, " ") : "";
  if (!weekly_article) {
    throw new Error("JSON に weekly_article がありません");
  }
  if (!summary_one_line) {
    summary_one_line = truncateForLlm(weekly_article.replace(/\s+/g, " "), 120).trim();
  }
  if (summary_one_line.length > SUMMARY_ONE_LINE_MAX) {
    summary_one_line = summary_one_line.slice(0, SUMMARY_ONE_LINE_MAX);
  }
  return { weekly_article, summary_one_line };
}

/**
 * 週次: 作成日時がその週（月〜金・JST）に入るニュースを全部取得
 */
async function fetchWeekNewsRecords(
  client: KintoneRestAPIClient,
  app: string,
  start: string,
  end: string,
): Promise<Array<Record<string, { value?: unknown }>>> {
  const query = `${CREATED_TIME_CODE} >= "${start}" and ${CREATED_TIME_CODE} <= "${end}"`;
  const fields = [
    "$id",
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

function buildCondensedContextAndUsed(
  records: Array<Record<string, { value?: unknown }>>,
): { condensed: string; usedRecords: Array<Record<string, { value?: unknown }>> } {
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
  return { condensed: lines.join("\n\n"), usedRecords: list };
}

function evidenceMinMaxIds(used: Array<Record<string, { value?: unknown }>>): {
  min: number | null;
  max: number | null;
} {
  const ids = used.map(recordNumericId).filter((n): n is number => n !== null);
  if (ids.length === 0) return { min: null, max: null };
  return { min: Math.min(...ids), max: Math.max(...ids) };
}

function buildReportRecordValues(params: {
  targetWeekMonday: string;
  reportText: string;
  summaryOneLine: string;
  usedCount: number;
  minId: number | null;
  maxId: number | null;
  runAtJst: string;
  githubRunId: string;
}): Record<string, { value: string }> {
  const rich = plainTextToRichTextHtml(params.reportText);
  const rec: Record<string, { value: string }> = {
    [REPORT_FIELDS.targetWeek]: { value: params.targetWeekMonday },
    [REPORT_FIELDS.weeklyTrend]: { value: rich },
    [REPORT_FIELDS.summaryOneLine]: { value: params.summaryOneLine },
    [REPORT_FIELDS.internalRefNewsCount]: { value: String(params.usedCount) },
    [REPORT_FIELDS.internalAnalysisRunAt]: { value: params.runAtJst },
    [REPORT_FIELDS.internalGithubRunId]: { value: params.githubRunId.slice(0, 120) },
  };
  if (params.minId !== null) {
    rec[REPORT_FIELDS.internalRefRecordIdMin] = { value: String(params.minId) };
  }
  if (params.maxId !== null) {
    rec[REPORT_FIELDS.internalRefRecordIdMax] = { value: String(params.maxId) };
  }
  return rec;
}

async function findExistingWeeklyRecord(
  client: KintoneRestAPIClient,
  appId: string,
  targetWeekMonday: string,
): Promise<{ id: string } | null> {
  const res = await client.record.getRecords({
    app: appId,
    query: `${REPORT_FIELDS.targetWeek} = "${targetWeekMonday}"`,
    fields: ["$id", REPORT_FIELDS.targetWeek],
  });
  const rec = res.records[0];
  if (!rec) return null;
  const id = String((rec as { $id?: { value?: unknown } }).$id?.value ?? "");
  if (!id) return null;
  return { id };
}

/**
 * JSON が途中で切れた等の失敗時、同じモデルで schema 付きの修復を 1 回だけ試す。
 */
async function repairWeeklyReportJsonGemini(
  apiKey: string,
  modelId: string,
  malformed: string,
): Promise<WeeklyGeminiOut> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: [
      "入力は壊れた・途中までの JSON テキスト、または不正な JSON です。",
      "内容を解釈し、有効な JSON オブジェクト 1 つだけを返す。",
      'キーは厳密に "weekly_article" と "summary_one_line"。',
      "weekly_article は日本語プレーン（【】見出しと・箇条書きの構成は維持）。推測で補完せず、読み取れる範囲で復元し不明部分は省略。",
      "summary_one_line は weekly_article の要約を 1 行・80〜160 文字程度。",
    ].join("\n"),
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: WEEKLY_REPORT_RESPONSE_SCHEMA,
    },
  });
  const body = malformed.length > 12000 ? malformed.slice(0, 12000) : malformed;
  const r = await generateContentWith429Retries(
    model,
    "次のテキストを有効な JSON（weekly_article / summary_one_line のみ）に直してください:\n\n" + body,
    { logTag: "[analyze] Gemini JSON repair" },
  );
  const out = r.response.text().trim();
  if (!out) throw new Error("Gemini 修復パスから空の応答");
  return parseWeeklyReportJson(out);
}

/**
 * Gemini: 本文（プレーン）と 1 行サマリーを JSON で返させる
 */
async function summarizeWeeklyReportGemini(apiKey: string, condensed: string): Promise<WeeklyGeminiOut> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt =
    "以下が今週登録されたニュース要約のみです（トークン節約のため短縮済み）。\n\n" + condensed;
  let last404 = "";
  for (const modelId of geminiModelCandidates()) {
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: [
        "あなたは情報セキュリティニュースの編集長です。読者は社内で報告書・提案資料を作る担当者です。",
        "入力は Security NEXT 相当のニュース一覧の要約のみです。本文全文はありません。",
        "出力は有効な JSON オブジェクト 1 つのみ。前後に説明・マークダウン・コードフェンスを付けない。",
        'キーは厳密に "weekly_article" と "summary_one_line" の 2 つ。',
        "weekly_article: 日本語プレーンテキスト。Markdown の # や ** は使わない。見出しは全角【】のみ。",
        "weekly_article の本文に ASCII の二重引用符（半角の引用符）を含めない。強調・引用は全角かぎ括弧「」を使う（JSON 破損防止）。",
        "weekly_article の構成と順序（必ずこの順。セクションの間は空行 1 行で区切る。箇条書きの行頭は「・」で統一）:",
        "1) 1 行目に「【週の全体像】」のみ。その次の行から経営・部会向けに貼れる段落を 2〜5 文（句点で区切る。改行は文の区切り程度）。",
        "2) 空行のあと「【今週の注目トピック】」。次行から「・」で 3〜7 行。各 1 文で製品名・CVE・組織名など入力に出る固有名を可能な範囲で含める。",
        "3) 空行のあと「【推奨アクション（優先度付き）】」。次行から「・【高】」「・【中】」「・【低】」をそれぞれ 1〜3 行ずつ。各行は「誰が／何を／いつまでに」のいずれかを短く含める。",
        "4) 入力に不確かな話題がある場合のみ、空行のあと「【フォロー注意（未確定）】」を最大 2 行。断定せず「報道では〜」程度にとどめる。不要ならこの節は省略。",
        "weekly_article はおおよそ 1000〜1400 文字（長すぎると API 応答が途中で切れ JSON が壊れる）。冗長な前置きや同義反復を避ける。",
        "summary_one_line: weekly_article と同じ内容を 1 行に圧縮した日本語。改行なし。80〜160 文字。一覧・表紙・通知の一行向け。",
        "記載は入力の範囲に限定し、足りない情報は推測で断定しない。",
      ].join("\n"),
      generationConfig: {
        temperature: 0.28,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: WEEKLY_REPORT_RESPONSE_SCHEMA,
      },
    });
    try {
      const result = await generateContentWith429Retries(model, prompt, { logTag: "[analyze] Gemini" });
      const text = result.response.text().trim();
      if (!text) throw new Error("Gemini から空の応答が返りました");
      try {
        return parseWeeklyReportJson(text);
      } catch (e1) {
        console.warn("[analyze] JSON パース失敗、1 回だけ全文を再依頼します:", e1);
        const fixPrompt =
          prompt +
          "\n\n[前回は JSON 形式ではなかったか、キー名が違いました。weekly_article（【】見出しと・箇条書きの本文）と summary_one_line（1行）のみの JSON を再出力してください。]";
        const result2 = await generateContentWith429Retries(model, fixPrompt, {
          logTag: "[analyze] Gemini JSON retry",
        });
        const text2 = result2.response.text().trim();
        try {
          return parseWeeklyReportJson(text2);
        } catch (e2) {
          console.warn("[analyze] 再依頼でも JSON 失敗、修復パスへ:", e2);
          return await repairWeeklyReportJsonGemini(apiKey, modelId, text2.length > 200 ? text2 : text);
        }
      }
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
  const existingMode = resolveExistingWeekBehavior();
  console.log("[analyze] 対象週（月曜日）:", week.targetWeekMonday);
  console.log("[analyze] 作成日時範囲 JST:", week.startInclusive, "〜", week.endInclusive);
  console.log("[analyze] 既存レコード時の挙動:", existingMode);

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

  const { condensed, usedRecords } = buildCondensedContextAndUsed(records);
  const { min: minId, max: maxId } = evidenceMinMaxIds(usedRecords);
  const usedCount = usedRecords.length;
  const runAtJst = nowJstForKintoneDatetime();
  const ghRun = githubRunIdForEvidence();

  const existing = await findExistingWeeklyRecord(kintone, cfg.reportAppId, week.targetWeekMonday);
  if (existing && existingMode === "skip") {
    console.log("[analyze] 同一 target_week のレコードが既に存在するためスキップ（ANALYZE_EXISTING_WEEK_RECORD=skip）:", existing.id);
    await notifyRunSummary(summaryUrl, {
      workflow: "analyze",
      candidateCount: records.length,
      addedCount: 0,
      extraLines: [
        `• 対象週（月曜）: ${week.targetWeekMonday}`,
        `• 既存レコード $id=${existing.id} のためスキップ`,
        `• 参照 631 件数（週内総数）: ${records.length}`,
      ],
    });
    return;
  }

  console.log("[analyze] Gemini モデル試行順:", geminiModelCandidates().join(" → "));
  let geminiOut: WeeklyGeminiOut;
  let geminiBillingFallback = false;
  try {
    geminiOut = await summarizeWeeklyReportGemini(geminiKey, condensed);
  } catch (e) {
    if (isGeminiBillingDeniedError(e)) {
      geminiBillingFallback = true;
      console.warn("[analyze] Gemini 403/billing — フォールバック要約で kintone へ保存（R4）");
      geminiOut = buildGeminiBillingFallback(week.targetWeekMonday, records.length, usedCount);
    } else {
      throw e;
    }
  }
  console.log("[analyze] LLM 本文文字数:", geminiOut.weekly_article.length);
  console.log("[analyze] 1行サマリー:", geminiOut.summary_one_line);

  const recordValues = buildReportRecordValues({
    targetWeekMonday: week.targetWeekMonday,
    reportText: geminiOut.weekly_article,
    summaryOneLine: geminiOut.summary_one_line,
    usedCount,
    minId,
    maxId,
    runAtJst,
    githubRunId: ghRun,
  });

  let writeMode: "insert" | "update" = "insert";
  if (existing) {
    await kintone.record.updateRecord({
      app: cfg.reportAppId,
      id: existing.id,
      record: recordValues,
    });
    writeMode = "update";
    console.log("[analyze] レポートアプリ（632）既存レコードを更新完了 $id=", existing.id);
  } else {
    await kintone.record.addRecord({
      app: cfg.reportAppId,
      record: recordValues,
    });
    console.log("[analyze] レポートアプリ（632）へ週次レコードを新規追加完了");
  }

  await notifyRunSummary(summaryUrl, {
    workflow: "analyze",
    candidateCount: records.length,
    addedCount: 1,
    extraLines: [
      `• 対象週（月曜）: ${week.targetWeekMonday}`,
      `• レポートアプリ ID: ${cfg.reportAppId}`,
      `• 書き込み: ${writeMode === "update" ? "更新（同一 target_week）" : "新規追加"}`,
      `• LLM 入力に使った 631 件数: ${usedCount}（週内総数 ${records.length}）`,
      `• 631 $id 範囲: ${minId ?? "—"} 〜 ${maxId ?? "—"}`,
      `• 実行日時(JST系): ${runAtJst}`,
      `• github_run_id: ${ghRun}`,
      `• 要約文字数: ${geminiOut.weekly_article.length}`,
      ...(geminiBillingFallback
        ? ["• ⚠ Gemini 403 フォールバック要約（課金/API 要確認・再実行推奨）"]
        : []),
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
