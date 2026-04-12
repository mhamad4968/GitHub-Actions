/**
 * ニュース 1 件の「概要」（1〜2 文の全体像）と「要約」（事象・脆弱性関連・修正・対策・見解の 4 見出し）を Gemini で整形する。
 * analyze.ts と同モデルで揃え、出力は JSON のみで受け取ってパースする。
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

import { generateContentWith429Retries } from "./gemini-rate-limit.js";
import { normalizeInsightParagraphBody, truncateForLlm } from "./text.js";

/** Google AI Studio / Generative Language API のモデル ID（429・404 時は .env / GEMINI_MODEL で別名へ。例: gemini-2.5-flash-preview） */
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

/** LLM 入力に渡す RSS＋記事抜粋の上限（記事本文取得時は長めに） */
const EXCERPT_FOR_LLM_MAX = 9_000;

/** 体裁検証に失敗したときの最大再試行回数（プロンプトに検証メッセージを付けてやり直す） */
const FORMAT_MAX_ATTEMPTS = 5;

/** 全文 Gemini 失敗時に「見解」だけを埋める API 呼び出しの再試行回数 */
const INSIGHT_MAX_ATTEMPTS = 3;

const INSIGHT_EXCERPT_MAX = 2000;

const DIGEST_HEADINGS = [
  "事象:",
  "脆弱性関連:",
  "修正・対策:",
  "見解:",
] as const;

/** モデルがプロンプト内の「禁止例」を丸写ししやすいため、検証で弾く（部分一致） */
const BANNED_DIGEST_SNIPPETS = [
  "RSS 抜粋に CVE・攻撃種別等の技術的明記が乏しい",
  "抜粋に修正版・パッチ・手順の明記がない場合があります",
  "RSS 由来の自動登録",
  "一次情報での裏取りを推奨",
  /** モデルが旧テンプレを言い換えた場合の抜け道を塞ぐ */
  "元記事・ベンダ情報で確認",
  "元記事の対応案を参照",
  "資料化・社内検討",
  "技術的明記が乏しい場合があります",
] as const;

/**
 * 全角英数・不可視文字・ホモグリフ差で禁止定型の文字列一致が外れるのを防ぐ（検知のみ用）
 */
export function normalizeTextForBoilerplateScan(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t\u00A0\u3000]+/g, " ")
    .trim();
}

/** 文字列一致で拾い損ねるテンプレを正規表現でも弾く（normalize 後の文字列に対して検査） */
const BANNED_DIGEST_REGEXES: readonly RegExp[] = [
  /RSS\s*抜粋に[\s\S]{0,200}?CVE[\s\S]{0,120}?乏し/i,
  /RSS\s*由来[\s\S]{0,48}?自動登録/i,
  /一次情報[\s\S]{0,40}?裏取り[\s\S]{0,24}?推奨/i,
  /抜粋に[\s\S]{0,80}?修正版[\s\S]{0,80}?手順[\s\S]{0,80}?ない場合/i,
  /資料化[\s\S]{0,24}?社内検討[\s\S]{0,40}?裏取り/i,
];

export function digestContainsBannedBoilerplate(digest: string): string | null {
  const d = normalizeTextForBoilerplateScan(digest.replace(/\r\n/g, "\n"));
  for (const s of BANNED_DIGEST_SNIPPETS) {
    const ns = normalizeTextForBoilerplateScan(s);
    if (d.includes(ns)) return s;
  }
  for (let i = 0; i < BANNED_DIGEST_REGEXES.length; i++) {
    if (BANNED_DIGEST_REGEXES[i].test(d)) return `[template-regex:${i}]`;
  }
  return null;
}

export type NewsFormatInput = {
  title: string;
  articleUrl: string;
  publishedDate: string;
  /** プレーン化済み RSS 抜粋（要約欄のたたき台） */
  rssExcerptPlain: string;
  /** rss: Security NEXT 等。nvd: NIST NVD の CVE 登録抜粋（プロンプトと体裁指示を切替） */
  materialSource?: "rss" | "nvd";
};

export type NewsFormatOutput = {
  overview: string;
  digest: string;
};

function parseFormatJson(raw: string): NewsFormatOutput {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  const o = JSON.parse(t) as { overview?: unknown; digest?: unknown };
  const overview = typeof o.overview === "string" ? o.overview.trim() : "";
  const digest = typeof o.digest === "string" ? o.digest.trim() : "";
  if (!overview || !digest) {
    throw new Error("Gemini の JSON に overview または digest が空です");
  }
  return { overview, digest };
}

function digestSectionBody(digest: string, heading: string, nextHeading: string | null): string {
  const i = digest.indexOf(heading);
  if (i < 0) return "";
  const from = i + heading.length;
  const end = nextHeading ? digest.indexOf(nextHeading, from) : digest.length;
  const to = end < 0 ? digest.length : end;
  return digest.slice(from, to).trim();
}

/**
 * 概要・要約が仕様どおりか検証（失敗時はメッセージを投げて再生成の材料にする）
 */
export function validateNewsFormat(out: NewsFormatOutput): void {
  const overview = out.overview.replace(/\r\n/g, "\n").trim();
  const digest = out.digest.replace(/\r\n/g, "\n").trim();

  if (digest.includes("Security NEXT")) {
    throw new Error("digest に Security NEXT を含めないでください（概要専用）");
  }

  const oLines = overview.split("\n").map((l) => l.trimEnd().trim());
  const nonEmpty = oLines.filter((l) => l.length > 0);
  if (nonEmpty.length < 2) {
    throw new Error("overview は本文 1 行以上＋最終行 Security NEXT が必要です");
  }
  if (nonEmpty[nonEmpty.length - 1] !== "Security NEXT") {
    throw new Error('overview の最終行は "Security NEXT" 単独の 1 行にしてください');
  }
  const body = nonEmpty.slice(0, -1).join(" ").trim();
  if (body.length < 15) {
    throw new Error("overview 本文が短すぎます（材料として 1〜2 文で何が起きたかを書いてください）");
  }
  if (body.length > 520) {
    throw new Error("overview 本文が長すぎます（1〜2 文・全体像のみ。詳細は digest へ）");
  }

  let lastPos = -1;
  for (const label of DIGEST_HEADINGS) {
    const p = digest.indexOf(label);
    if (p === -1) {
      throw new Error(`digest に必須見出し ${label} がありません`);
    }
    if (p <= lastPos) {
      throw new Error(`digest の見出し順が不正です（${label}）`);
    }
    lastPos = p;
  }

  for (let i = 0; i < DIGEST_HEADINGS.length; i++) {
    const label = DIGEST_HEADINGS[i];
    const start = digest.indexOf(label) + label.length;
    const next =
      i + 1 < DIGEST_HEADINGS.length ? digest.indexOf(DIGEST_HEADINGS[i + 1], start) : digest.length;
    const section = digest.slice(start, next).trim();
    if (section.length < 12) {
      throw new Error(
        `${label} の直後が空に近いです。固有名詞を含む 1 文以上で、不足分は「記事本文で要確認」と短く補う`,
      );
    }
  }

  const banned = digestContainsBannedBoilerplate(digest);
  if (banned) {
    throw new Error(
      `digest に禁止の免責テンプレが含まれます。脆弱性関連は製品・CVE・攻撃条件など具体語、修正・対策は利用中止・パッチ等の事実、見解は優先度目安のみ（該当: ${banned.slice(0, 28)}…）`,
    );
  }

  const normOverviewBody = body.replace(/\s+/g, " ");
  const normDigest = digest.replace(/\s+/g, " ");
  if (normOverviewBody.length > 0 && normDigest.startsWith(normOverviewBody.slice(0, Math.min(40, normOverviewBody.length)))) {
    throw new Error("digest の先頭が overview 本文と同じ始まりになっています。要約は別の言い回しで書いてください");
  }

  const jisho = digestSectionBody(digest, "事象:", "脆弱性関連:").replace(/\s+/g, "");
  const zeikan = digestSectionBody(digest, "脆弱性関連:", "修正・対策:").replace(/\s+/g, "");
  const minHead = Math.min(80, jisho.length, zeikan.length);
  if (minHead >= 40 && jisho.slice(0, minHead) === zeikan.slice(0, minHead)) {
    throw new Error(
      "事象 と 脆弱性関連 の冒頭が重複しています。事象はニュースの出来事・状況のみ。脆弱性関連は CVE・製品コンポーネント・攻撃種別・認証の問題など技術用語で別の文にしてください",
    );
  }

  const taishoBody = digestSectionBody(digest, "修正・対策:", "見解:").trim();
  const jishoPlain = digestSectionBody(digest, "事象:", "脆弱性関連:").trim();
  if (taishoBody.length >= 22 && jishoPlain.includes(taishoBody)) {
    throw new Error(
      "修正・対策 が事象欄の繰り返しです。IBM 等の公式アドバイザリ・修正版の入手先・適用対象版・設定確認など、行動に落ちる別の文にしてください",
    );
  }
}

/**
 * タイトル・URL・公開日・RSS 抜粋から、kintone の概要・要約用テキストを生成する。
 */
export async function formatNewsForKintone(
  apiKey: string,
  input: NewsFormatInput,
): Promise<NewsFormatOutput> {
  const src = input.materialSource === "nvd" ? "nvd" : "rss";
  const excerpt = truncateForLlm(input.rssExcerptPlain, EXCERPT_FOR_LLM_MAX);
  const genAI = new GoogleGenerativeAI(apiKey);
  const nvdExtra =
    src === "nvd"
      ? [
          "",
          "【NVD】入力は NIST NVD の CVE 登録情報の抜粋です（ニュース記事ではありません）。",
          "事象: 「データベースにどのような事案が CVE として登録されたか」を日本語で 1〜2 文。英語説明がある場合は**要点の日本語要約**を書いてよい（英語全文のコピペは避ける）。",
          "脆弱性関連: **CVE 番号・CVSS・攻撃条件・技術的影響（機密性・完全性・可用性）**に集中。事象と**同じ英文・同じ段落を繰り返さない**。",
          "修正・対策: 抜粋にパッチ番号が無いのが普通。**NVD の References・ベンダ・一次情報で確認する**旨を明示。",
          "見解: **「RSS 由来」と書かない**。優先度の目安と社内確認観点のみ（NVD 自動取り込みであることは必要なら一文でよいがメタ説明に偏らない）。",
        ].join("\n")
      : "";
  const rssExtra =
    src === "rss"
      ? [
          "",
          "【Security NEXT 記事】入力には RSS 抜粋に加え、取得できていれば「記事ページから自動取得した本文抜粋」ブロックがある。**そちらを優先**し、CVE・版数・利用中止・パッチ等を書ける範囲で具体化する。",
          "**禁止:** 「情報が乏しいので元記事を読め」だけを長文で繰り返す**免責3段構成**。プロンプトに過去テンプレの**全文引用は出さない**（モデルが誤ってコピーしやすいため、ここでは例文を列挙しない）。",
          "**必須:** タイトル・入力に出る**固有名詞**（製品名・マルウェア名・ツール名・組織名）を **脆弱性関連・修正・対策・見解の各セクションに最低1つずつ**織り込む（無理な断定はしない）。",
          "**脆弱性関連:** CVE が無ければ、(1) **製品・ツールの欠陥系**: 影響対象・悪用経路を入力の語で。(2) **企業公表のサイバーインシデント系**: 公表されている侵害の様相・影響（業務・データ・第三者）、攻撃手口が不明なら「手口は公表段階では不明」と書ける。事象欄の言い換えだけは禁止。",
          "**修正・対策:** パッチ系なら版数・入手元。インシデント系なら調査・復旧・開示・当局対応など**入力にあれば具体的に**。**事象欄の文末をそのまま貼り付けない**（必ずアドバイザリ URL 言及・適用順・対象製品版のいずれかを足す）。無い場合は一文で「記事および公表元の公式発表で対応・影響範囲を確認」。",
          "**見解:** 管理者向けの優先度目安・社内確認観点のみ（メタ説明や「自動登録」への言及は禁止）。",
        ].join("\n")
      : "";
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: [
      "あなたは情報セキュリティ系メディア「Security NEXT」品格の編集者です。",
      src === "nvd"
        ? "入力は NIST NVD の CVE 登録抜粋です。本文全体はなく、抜粋に無い事実は断定しない。"
        : "入力は RSS と（あれば）記事本文の抜粋。無い事実は断定せず、不足は短い確認文にとどめ、**長い免責だけの段落は禁止**。",
      "出力は有効な JSON オブジェクト 1 つだけ。前後に説明文やマークダウンを付けない。",
      'キーは厳密に "overview" と "digest" の 2 つ。',
      "",
      "【overview】日本語。**概要**＝資料のネタ探し用に「何が起きたか」が一目で分かる**全体像**のみ。",
      "原則 **1 文または 2 文**（読点は少なめ）。数値・CVE 番号・製品バージョン・手順的な対策の列挙は digest に回す。",
      "**overview の本文と digest の本文は重複禁止**（同じ文・同じ言い回しのコピペ不可）。digest は別の構成で掘り下げる。",
      "最終行を**独立した 1 行**とし、`Security NEXT` のみ（他の出典表記は付けない）。",
      "",
      "【digest】日本語。**要約**＝概要より詳しく、抜粋に基づき材料として後読み・調査に使える粒度。",
      "**Security NEXT** という文字列は digest に入れない。",
      "次の 4 見出しを**この順・この表記**で各行の先頭に付ける（コロンは半角）:",
      "事象:",
      "脆弱性関連:",
      "修正・対策:",
      "見解:",
      "各見出しのコロン**直後**は空にしない。**最低 1 文・おおよそ 15 文字以上**。抜粋に無い事項は「記事・公式で要確認」「抜粋に明示なし」と明示する。",
      "**事象: と 脆弱性関連: は同じ文・同じ言い回しを繰り返さない**（コピペ禁止）。事象は「何が公表・観測されたか」のストリート。脆弱性関連は **技術側**（CVE 番号・攻撃ベクトル・弱点の性質・影響しうる資産）に絞る。",
      "事象: メーカー公表や報道ベースの**出来事**（製品名は出てよいが、技術説明の細部は脆弱性関連へ回す）。",
      "脆弱性関連: **技術名・CVE・認証・権限・コード実行**、または**インシデントなら侵害の性質・影響・未確定事項**。事象の言い換え繰り返し禁止。CVE が無くても**入力の固有名詞と事案種別**で1文以上。",
      "修正・対策: 利用中止・パッチ・バージョン・回避策が入力にあれば具体的に。**事象: のコピペ禁止**。無い場合は一文で「記事内の案内に従い対応を確認」。",
      "見解: 管理者向けに優先度の目安・すぐ確認すべき点を 1〜2 文（断定しすぎない" +
        (src === "nvd" ? "。「RSS 由来」という表現は使わない" : "") +
        "）。",
      nvdExtra,
      rssExtra,
    ].join("\n"),
    generationConfig: {
      temperature: 0.22,
      maxOutputTokens: 2800,
    },
  });

  const userBase = [
    "次の記事情報を、指示どおり JSON で返してください。",
    "digest の各セクションは**固有名詞を含む具体文**とし、情報不足を理由にした長い免責テンプレのみの回答は不可。",
    "",
    "タイトル: " + input.title,
    "URL: " + input.articleUrl,
    "公開日（JST 日付）: " + input.publishedDate,
    "",
    (src === "nvd" ? "NVD 登録抜粋（CVE）:" : "RSS 抜粋:"),
    excerpt,
  ].join("\n");

  let lastErr = "（初回）";
  for (let attempt = 0; attempt < FORMAT_MAX_ATTEMPTS; attempt++) {
    const fix =
      attempt === 0
        ? ""
        : `\n\n[前回不備: ${lastErr}。overview 最終行のみ Security NEXT。digest は4見出し・事象と脆弱性関連は別内容・**長い免責定型は禁止**・タイトル/入力の固有名詞を各セクションに。JSON のみ再出力。]`;
    const result = await generateContentWith429Retries(model, userBase + fix);
    const text = result.response.text().trim();
    if (!text) {
      lastErr = "Gemini から空の応答";
      continue;
    }
    let parsed: NewsFormatOutput;
    try {
      parsed = parseFormatJson(text);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      continue;
    }
    try {
      validateNewsFormat(parsed);
      return parsed;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Gemini 体裁が ${FORMAT_MAX_ATTEMPTS} 回とも検証に失敗しました: ${lastErr}`);
}

function parseInsightJson(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  const o = JSON.parse(t) as { insight?: unknown };
  const insight = typeof o.insight === "string" ? o.insight.trim() : "";
  if (insight.length < 15) {
    throw new Error("insight が短すぎます");
  }
  if (/Security NEXT/i.test(insight)) {
    throw new Error("insight に Security NEXT を含めないでください");
  }
  if (digestContainsBannedBoilerplate(insight)) {
    throw new Error("insight に禁止の免責テンプレが含まれます");
  }
  return normalizeInsightParagraphBody(insight);
}

/**
 * 要約の「見解:」欄のみ Gemini で生成する（全文整形が 429 等で失敗したとき用。トークンを抑える）
 */
export async function formatDigestInsightOnly(apiKey: string, input: NewsFormatInput): Promise<string> {
  const src = input.materialSource === "nvd" ? "nvd" : "rss";
  const excerpt = truncateForLlm(input.rssExcerptPlain, INSIGHT_EXCERPT_MAX);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: [
      "あなたは組織の情報セキュリティ担当向けのアドバイザです。",
      src === "nvd"
        ? "入力は NIST NVD の CVE 登録抜粋のみ。抜粋に無い事実は断定せず、優先度や確認観点は「目安」「要確認」と留める。"
        : "入力は RSS 抜粋および取得できていれば記事本文抜粋。無い事実は断定せず、優先度や確認観点は「目安」「要確認」と留める。",
      "出力は有効な JSON オブジェクト 1 つだけ。キーは厳密に \"insight\" のみ。",
      "insight の値: 日本語で 1〜3 文。対応優先度の目安、社内で確認すべき論点（資産・利用範囲・パッチ方針など）、リスクの捉え方。",
      "「RSS 由来です」「自動登録です」「一次情報での裏取りを推奨」などのメタ・定型免責は書かない。中身の提案に集中。",
      "Security NEXT という文字列は insight に含めない。",
    ].join("\n"),
    generationConfig: {
      temperature: 0.28,
      maxOutputTokens: 640,
    },
  });

  const userBase = [
    "次の記事について、キー insight だけを JSON で返してください。",
    "",
    "タイトル: " + input.title,
    "URL: " + input.articleUrl,
    "公開日: " + input.publishedDate,
    "",
    (src === "nvd" ? "NVD 登録抜粋:" : "RSS 抜粋:"),
    excerpt,
  ].join("\n");

  let lastErr = "（初回）";
  for (let attempt = 0; attempt < INSIGHT_MAX_ATTEMPTS; attempt++) {
    const fix =
      attempt === 0
        ? ""
        : `\n\n[前回不備: ${lastErr}。insight のみ・1〜3文・日本語・JSONのみ再出力。]`;
    const result = await generateContentWith429Retries(model, userBase + fix);
    const text = result.response.text().trim();
    if (!text) {
      lastErr = "空応答";
      continue;
    }
    try {
      return parseInsightJson(text);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Gemini 見解のみが ${INSIGHT_MAX_ATTEMPTS} 回とも失敗: ${lastErr}`);
}
