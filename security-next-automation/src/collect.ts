/**
 * キーワード選別のみルールベース（敷居の低い選別は生成 AI 不使用）。
 * フィードから kintone ニュースアプリ（631 等）へ未登録分を登録する。
 * - ポジティブ: タイトル・抜粋にインシデント関連語／ネガティブ語で除外
 * - 最大 3 件・同一 URL 1 件
 * **GEMINI_API_KEY あり**: Gemini で体裁付け（概要＝何が起きたか 1〜2 文＋末尾 `Security NEXT`。要約＝事象・脆弱性関連・修正・対策・見解の 4 見出し）。
 * **キーなし**または **COLLECT_SKIP_GEMINI_FORMAT=1**: `buildRssMaterialSummaryDigest` で4見出し＋概要。選別は常に全文抜粋ベース。
 */
import Parser from "rss-parser";

import { loadConfig } from "./lib/config.js";
import { formatNewsForKintone } from "./lib/format-news-gemini.js";
import { NEWS_FIELDS } from "./lib/field-codes.js";
import { createKintoneClient } from "./lib/kintone-client.js";
import { notifyFailure, notifyRunSummary } from "./lib/notify.js";
import {
  buildRssMaterialSummaryDigest,
  escapeKintoneQueryString,
  stripHtmlToPlain,
  truncateForLlm,
} from "./lib/text.js";

/** 1 回の実行で取り込む候補の上限（負荷調整用。0 または未設定なら切り詰めない） */
const maxNewEnv = process.env.COLLECT_MAX_NEW_PER_RUN?.trim();
const MAX_NEW_PER_RUN = maxNewEnv && /^\d+$/.test(maxNewEnv) ? Math.max(0, parseInt(maxNewEnv, 10)) : 0;

/** 1 回の収集で kintone に追加する最大件数（キーワード選別後） */
const TOP_N = 3;

/** 概要（summary）の最大文字数（Gemini 未使用時のフォールバック用） */
const COLLECT_OVERVIEW_MAX_CHARS = 320;

/** `GEMINI_API_KEY` があれば Gemini 整形を使う。1 にすると常に RSS トリムのみ */
function shouldUseGeminiFormat(): boolean {
  if (process.env.COLLECT_SKIP_GEMINI_FORMAT?.trim() === "1") {
    return false;
  }
  const k = process.env.GEMINI_API_KEY?.trim();
  return Boolean(k);
}

/** ポジティブ（インシデント判定）: タイトルまたは概要にいずれかが含まれるものを残す（部分一致） */
const INCIDENT_KEYWORDS = [
  "漏洩",
  "不正アクセス",
  "流出",
  "被害",
  "ランサム",
  "ウイルス",
  "乗っ取り",
  "紛失",
  "誤送信",
  /** 誤廃棄・書類廃棄ミスなど（Security NEXT の自治体・組織向け見出し） */
  "誤廃棄",
  "インシデント",
  "緊急",
  /** 「悪用を確認」「悪用が発生」等（「悪用確認」1 語だと「を」が挟まって漏れる） */
  "悪用",
  "悪用確認",
  "ゼロデイ",
  /** Security NEXT 見出しに多いが旧一覧に無かった語 */
  "攻撃",
  "ddos",
  "侵害",
  "システム障害",
  "情報流出",
  /** 製品CVE・注意喚起の大半に含まれる（旧一覧欠落で 0 件化の主因だった） */
  "脆弱性",
  /** description に「悪用されている」等と出る英字表記 */
  "cve",
  /** 統計・事件どちらもフィードに多い */
  "フィッシング",
  /** タイトルに「脆弱性」が無いセキュリティ更新記事の救済（長い句で誤爆しにくい） */
  "セキュリティアップデート",
] as const;

/**
 * ネガティブ（パッチ・提供系の「周知だけ」寄り）: いずれかが含まれる記事は除外。
 * Security NEXT は「脆弱性＋アップデート公開」を同一見出しに載せるため、アップデート／修正／リリース単独語は除外に含めない（本文の「修正したアップデート」で全滅する）。
 * 除外は「ベリンダー・アドバイザリ色が強い」語に絞る。
 */
const EXCLUSION_KEYWORDS = [
  "パッチ",
  "更新プログラム",
  "脆弱性対策",
  "アドバイザリ",
] as const;

/** 記事フィード取得の待ち時間の上限（ミリ秒） */
const rssParser = new Parser({
  timeout: 30_000,
  // 記事サーバーへの付帯情報（識別用）。英字のみにするとエンコード差異を避けられるが、方針どおり日本語表記とする
  headers: { "User-Agent": "kintone-security-collector" },
});

type RssItem = {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
};

/** RSS 1 件を kintone 用に正規化した中間データ */
type NormalizedNewsRow = {
  title: string;
  link: string;
  publishedDate: string;
  /** 要約欄のたたき台（キーワード選別もこの全文に対して行う） */
  digestFullText: string;
  sortTimeMs: number;
};

function resolveArticleUrl(item: RssItem): string | null {
  const raw = item.link?.trim() || "";
  if (raw.length > 0) return raw;
  const g = item.guid?.trim() || "";
  if (/^https?:\/\//i.test(g)) return g;
  return null;
}

function rssItemSortTimeMs(item: RssItem): number {
  const s = item.isoDate || item.pubDate;
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function toKintonePublishedDate(item: RssItem): string {
  const ms = rssItemSortTimeMs(item);
  if (!(ms > 0)) {
    const url = item.link?.trim() || item.guid?.trim() || "(url なし)";
    console.warn(
      "[ニュース収集] RSS に有効な公開日時（isoDate/pubDate）がありません。published_date には JST の当日を入れます:",
      url,
    );
  }
  const d = ms > 0 ? new Date(ms) : new Date();
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** RSS からプレーン抜粋を取り、kintone 要約欄向けに上限まで入れる */
function pickSummary(item: RssItem): string {
  const raw = item.contentSnippet || item.summary || item.content || "";
  const plain = stripHtmlToPlain(raw);
  return truncateForLlm(plain, 4000);
}

/** キーワードはすべて日本語（カタカナ含む）で定義。比較では小文字へそろえて部分一致する */
function haystackContainsAny(haystack: string, needles: readonly string[]): boolean {
  const lowerHay = haystack.toLowerCase();
  return needles.some((word) => lowerHay.includes(word.toLowerCase()));
}

/** ネガティブ語が無く、ポジティブ（インシデント）語が 1 つ以上ある */
/** 概要と要約が実質同一か（空白差のみ無視） */
function sameSummaryAndDigest(a: string, b: string): boolean {
  const x = a.trim().replace(/\s+/g, " ");
  const y = b.trim().replace(/\s+/g, " ");
  return x.length > 0 && x === y;
}

/**
 * kintone 要約欄の材料用フォーマット（事象・脆弱性関連・修正・対策・見解）が付いているか。
 * 付いていないと画面で概要と同じ長文に見える誤解が起きやすい。
 */
function digestHasMaterialHeadings(digest: string): boolean {
  const d = digest.trim();
  return (
    /事象:\s*\S/m.test(d) &&
    /脆弱性関連:\s*\S/m.test(d) &&
    /修正・対策:\s*\S/m.test(d) &&
    /見解:\s*\S/m.test(d)
  );
}

function rowMatchesKeywordRules(row: NormalizedNewsRow): boolean {
  const blob = `${row.title}\n${row.digestFullText}`;
  if (haystackContainsAny(blob, EXCLUSION_KEYWORDS)) {
    return false;
  }
  return haystackContainsAny(blob, INCIDENT_KEYWORDS);
}

/** 登録 0 件時のログ用（Actions で原因切り分けしやすくする） */
function countKeywordRejectionReasons(rows: NormalizedNewsRow[]): {
  excludedOnly: number;
  noIncidentOnly: number;
} {
  let excludedOnly = 0;
  let noIncidentOnly = 0;
  for (const row of rows) {
    const blob = `${row.title}\n${row.digestFullText}`;
    const neg = haystackContainsAny(blob, EXCLUSION_KEYWORDS);
    const pos = haystackContainsAny(blob, INCIDENT_KEYWORDS);
    if (neg) {
      excludedOnly++;
    } else if (!pos) {
      noIncidentOnly++;
    }
  }
  return { excludedOnly, noIncidentOnly };
}

/**
 * 候補は既に公開日時の新しい順。同一の記事リンクは先頭（最新）の 1 件だけ残す。
 */
function dedupeCandidatesNewestFirstUniqueUrl(candidates: NormalizedNewsRow[]): NormalizedNewsRow[] {
  const seen = new Set<string>();
  const out: NormalizedNewsRow[] = [];
  for (const c of candidates) {
    if (seen.has(c.link)) continue;
    seen.add(c.link);
    out.push(c);
  }
  return out;
}

/**
 * キーワードで絞ったうえで記事リンクの重複を除き、新しい順に最大 n 件。
 */
function pickKeywordMatchesNewestUpToN(candidates: NormalizedNewsRow[], n: number): NormalizedNewsRow[] {
  const matched = candidates.filter(rowMatchesKeywordRules);
  return dedupeCandidatesNewestFirstUniqueUrl(matched).slice(0, n);
}

async function loadExistingUrls(
  client: ReturnType<typeof createKintoneClient>,
  appId: string,
  urls: string[],
): Promise<Set<string>> {
  const existing = new Set<string>();
  const chunkSize = 30;
  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    const cond = chunk.map((u) => `"${escapeKintoneQueryString(u)}"`).join(", ");
    const query = `${NEWS_FIELDS.articleUrl} in (${cond})`;
    const rows = await client.record.getAllRecordsWithCursor({
      app: appId,
      query,
      fields: [NEWS_FIELDS.articleUrl],
    });
    for (const r of rows) {
      const v = r[NEWS_FIELDS.articleUrl]?.value;
      if (typeof v === "string" && v.length > 0) existing.add(v);
    }
  }
  return existing;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const client = createKintoneClient(cfg, cfg.kintoneApiTokenForCollect);

  console.log("[ニュース収集] 接続先ドメイン:", cfg.kintoneDomain);
  console.log("[ニュース収集] ニュースを保存するアプリの識別番号:", cfg.newsAppId);
  console.log("[ニュース収集] 記事フィードの取得先:", cfg.rssUrl);
  console.log(
    "[ニュース収集] 選別方式: 高度キーワード（ポジティブ＝インシデント語／ネガティブ＝予防・パッチ語。選別そのものはルールのみ）。概要・要約の体裁は GEMINI_API_KEY があれば登録時に Gemini、なければ RSS 材料整形。1 回あたりの登録上限:",
    TOP_N,
    "件",
  );
  if (MAX_NEW_PER_RUN > 0) {
    console.log("[ニュース収集] 候補を先頭から切り詰める件数の上限（環境変数）:", MAX_NEW_PER_RUN);
  }

  const feed = await rssParser.parseURL(cfg.rssUrl);
  const items = (feed.items || []) as RssItem[];

  const normalized = items
    .map((it) => {
      const link = resolveArticleUrl(it);
      const title = it.title?.trim() || "(無題)";
      if (!link) return null;
      const digestFullText = pickSummary(it);
      return {
        title,
        link,
        publishedDate: toKintonePublishedDate(it),
        digestFullText,
        sortTimeMs: rssItemSortTimeMs(it),
      };
    })
    .filter((x): x is NormalizedNewsRow => x !== null);

  normalized.sort((a, b) => b.sortTimeMs - a.sortTimeMs);

  const urls = [...new Set(normalized.map((n) => n.link))];
  console.log("[ニュース収集] フィード由来の記事行数:", normalized.length, "重複を除いたリンク数:", urls.length);

  const existingUrls = await loadExistingUrls(client, cfg.newsAppId, urls);
  let candidates = normalized.filter((n) => !existingUrls.has(n.link));
  const skippedDup = normalized.length - candidates.length;
  console.log(
    "[ニュース収集] まだ kintone に無い新規候補:",
    candidates.length,
    "件／既に登録済みで除外:",
    skippedDup,
    "件",
  );

  if (MAX_NEW_PER_RUN > 0 && candidates.length > MAX_NEW_PER_RUN) {
    console.log("[ニュース収集] 環境変数の上限で候補を切り詰め:", candidates.length, "件 →", MAX_NEW_PER_RUN, "件");
    candidates = candidates.slice(0, MAX_NEW_PER_RUN);
  }

  const summaryUrl = process.env.NOTIFY_SUMMARY_WEBHOOK_URL;

  if (candidates.length === 0) {
    console.log("[ニュース収集] 追加なし。終了。");
    await notifyRunSummary(summaryUrl, {
      workflow: "ニュース収集",
      candidateCount: 0,
      addedCount: 0,
      extraLines: ["• 補足: まだ kintone に未登録の新規候補がありません"],
    });
    return;
  }

  const candidateCountForSummary = candidates.length;
  // 同一 URL が複数行あっても 1 件と数える
  const keywordMatchedCount = dedupeCandidatesNewestFirstUniqueUrl(candidates.filter(rowMatchesKeywordRules)).length;
  console.log(
    "[ニュース収集] キーワード条件に合致する新着候補:",
    keywordMatchedCount,
    "/",
    candidateCountForSummary,
  );

  let toAdd = pickKeywordMatchesNewestUpToN(candidates, TOP_N);
  if (MAX_NEW_PER_RUN > 0 && toAdd.length > MAX_NEW_PER_RUN) {
    toAdd = toAdd.slice(0, MAX_NEW_PER_RUN);
  }

  console.log("[ニュース収集] 登録予定:", toAdd.length, "件（キーワード選別・日付新しい順・最大", TOP_N, "件）");
  if (toAdd.length === 0) {
    const rej = countKeywordRejectionReasons(candidates);
    console.log(
      "[ニュース収集] 登録対象なし。新規候補の内訳（件数ベース・重複 URL 含む）→ 除外語ヒット:",
      rej.excludedOnly,
      "／事件性キーワード不足:",
      rej.noIncidentOnly,
      "（`collect.ts` の INCIDENT_KEYWORDS / EXCLUSION_KEYWORDS を参照）",
    );
    await notifyRunSummary(summaryUrl, {
      workflow: "ニュース収集",
      candidateCount: candidateCountForSummary,
      addedCount: 0,
      extraLines: [
        `• 補足: 新着候補はあったがキーワードで 0 件。除外語: ${rej.excludedOnly} 件／事件語不足: ${rej.noIncidentOnly} 件（ログ参照）`,
      ],
    });
    return;
  }

  const useGemini = shouldUseGeminiFormat();
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  if (useGemini && geminiKey) {
    console.log("[ニュース収集] GEMINI_API_KEY あり → Gemini で概要・要約を整形します（model は GEMINI_MODEL / format-news-gemini 参照）。");
  } else {
    console.log(
      "[ニュース収集] Gemini オフ（GEMINI_API_KEY 未設定または COLLECT_SKIP_GEMINI_FORMAT=1）→ RSS 抜粋から 4 見出しの材料整形のみ。Actions では Environment kintone-collect に GEMINI_API_KEY があるか確認。",
    );
  }

  const records: Array<Record<string, { value: string }>> = [];
  /** 通知用: 実際に Gemini 通過で書けた件数 */
  let geminiFormattedCount = 0;

  for (const row of toAdd) {
    let overview: string;
    let digest: string;
    let usedGeminiForThis = false;
    if (useGemini && geminiKey) {
      try {
        const fmt = await formatNewsForKintone(geminiKey, {
          title: row.title,
          articleUrl: row.link,
          publishedDate: row.publishedDate,
          rssExcerptPlain: row.digestFullText,
        });
        overview = fmt.overview;
        digest = fmt.digest;
        usedGeminiForThis = true;
      } catch (eGem) {
        console.warn(
          "[ニュース収集] Gemini 体裁整形に失敗したため、RSS 抜粋から 4 見出しのフォールバックで登録:",
          row.link,
          eGem,
        );
        const fb = buildRssMaterialSummaryDigest(
          row.digestFullText,
          row.title,
          COLLECT_OVERVIEW_MAX_CHARS,
        );
        overview = fb.overview;
        digest = fb.digest;
      }
    } else {
      const fb = buildRssMaterialSummaryDigest(
        row.digestFullText,
        row.title,
        COLLECT_OVERVIEW_MAX_CHARS,
      );
      overview = fb.overview;
      digest = fb.digest;
    }

    /** 要約が 4 見出しでない／概要と同文のとき、材料整形で要約だけ必ず差別化する */
    if (!digestHasMaterialHeadings(digest) || sameSummaryAndDigest(overview, digest)) {
      console.warn(
        "[ニュース収集] 要約が体裁不足または概要と重複のため、buildRssMaterialSummaryDigest で要約を再生成:",
        row.link,
      );
      const fbOnly = buildRssMaterialSummaryDigest(
        row.digestFullText,
        row.title,
        COLLECT_OVERVIEW_MAX_CHARS,
      );
      digest = fbOnly.digest;
      if (sameSummaryAndDigest(overview, digest)) {
        overview = fbOnly.overview;
      }
      usedGeminiForThis = false;
    }

    if (sameSummaryAndDigest(overview, digest)) {
      console.warn(
        "[ニュース収集] 概要と要約が同一検知のため、要約の「事象」から概要を再生成:",
        row.link,
      );
      const m = /^事象:\s*(.+)$/m.exec(digest);
      const stub = ((m ? m[1] : digest) || "").trim();
      overview = `${truncateForLlm(stub, COLLECT_OVERVIEW_MAX_CHARS)}\nSecurity NEXT`;
    }

    if (usedGeminiForThis) {
      geminiFormattedCount++;
    }
    const prevDigest = digest.slice(0, 72).replace(/\s+/g, " ");
    console.log(
      "[ニュース収集] 登録直前:",
      row.link,
      "| gemini=",
      usedGeminiForThis ? "Y" : "N",
      "| 概要(先頭40字)=",
      overview.replace(/\s+/g, " ").slice(0, 40),
      "| 要約(先頭72字)=",
      prevDigest,
    );

    records.push({
      [NEWS_FIELDS.title]: { value: row.title },
      [NEWS_FIELDS.articleUrl]: { value: row.link },
      [NEWS_FIELDS.publishedDate]: { value: row.publishedDate },
      [NEWS_FIELDS.summary]: { value: overview },
      [NEWS_FIELDS.digest]: { value: digest },
    });
  }

  const addRes = await client.record.addRecords({ app: cfg.newsAppId, records });
  const ids = addRes.ids || [];
  console.log(
    "[ニュース収集] 登録完了。今回追加した件数:",
    ids.length,
    "／先頭レコードの識別番号:",
    ids[0] ?? "—",
  );

  await notifyRunSummary(summaryUrl, {
    workflow: "ニュース収集",
    candidateCount: candidateCountForSummary,
    addedCount: ids.length,
    extraLines: [
      `• キーワードに合致した候補（件数）: ${keywordMatchedCount}`,
      `• 保存先アプリの識別番号: ${cfg.newsAppId}`,
      `• 概要・要約: Gemini で整形した件数 ${geminiFormattedCount}/${ids.length}（0 なら GEMINI_API_KEY 未設定・失敗・または再フォールバック。ログの「登録直前」参照）`,
      ...(ids[0] ? [`• 今回の先頭レコード識別番号: ${ids[0]}`] : []),
    ],
  });
}

main().catch(async (err) => {
  console.error("[ニュース収集] 失敗:", err);
  try {
    const cfg = loadConfig();
    await notifyFailure(cfg.notifyWebhookUrl, {
      workflow: "ニュース収集",
      message: String(err instanceof Error ? err.message : err),
      detail: err instanceof Error ? err.stack : undefined,
    });
  } catch (e) {
    console.error("[ニュース収集] 通知処理エラー:", e);
  }
  process.exitCode = 1;
});
