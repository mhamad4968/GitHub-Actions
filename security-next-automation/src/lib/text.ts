/**
 * RSS や LLM 用に HTML をざっくり除去する（完全なサニタイズではない）
 */
export function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * kintone のクエリ用文字列エスケープ（公式ドキュメントに沿った \" と \\）
 */
export function escapeKintoneQueryString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * LLM に渡す分量を抑えるため、1 記事あたりのテキストを短く切る
 */
export function truncateForLlm(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

/**
 * 概要欄用に、同じ抜粋から「要約欄より短いリード」を作る（両欄が同一文字列にならないようにする）
 */
export function shortLeadForOverview(fullPlain: string, maxLen: number): string {
  const t = fullPlain.trim();
  if (!t) {
    return "";
  }
  const periodOrNl = t.search(/[。．]|\n/);
  if (periodOrNl >= 0) {
    const head = t.slice(0, periodOrNl + (t[periodOrNl] === "\n" ? 0 : 1)).trim();
    if (head.length >= 8 && head.length < t.length) {
      return truncateForLlm(head, maxLen);
    }
  }
  const cap = Math.min(120, maxLen);
  if (t.length > cap) {
    return truncateForLlm(t, cap);
  }
  const tight = Math.min(72, Math.floor(t.length / 2) || 40);
  if (t.length > tight + 2) {
    return `${t.slice(0, tight)}…`;
  }
  return t;
}

/**
 * Gemini 未使用時・API 失敗時でも、kintone の summary / digest を「材料向け」に分離する。
 * digest は README どおり 4 見出し（事象・脆弱性関連・修正・対策・見解）。overview は短いリード＋末尾行 Security NEXT。
 */
export function buildRssMaterialSummaryDigest(
  excerptPlain: string,
  title: string,
  overviewMaxChars: number,
): { overview: string; digest: string } {
  const ex = excerptPlain.trim();
  const t = (title || "").trim() || "(無題)";

  /**
   * Gemini 失敗時などフォールバックでも、一覧の「概要」と「要約」が同じ抜粋に見えないよう分離する。
   * - 概要: 1 行目にタイトル、2 行目に短いリード（全体像のみ）
   * - 要約の「事象:」: 抜粋を多めに載せ、4 見出しと合わせて構造差を必ず出す
   */
  const titleLine = truncateForLlm(t, Math.min(160, Math.max(40, Math.floor(overviewMaxChars * 0.5))));
  const bodyBudget = Math.max(48, overviewMaxChars - titleLine.length - 1);
  const lead = shortLeadForOverview(ex || t, bodyBudget).trim();
  const overviewSecondLine =
    lead.length >= 12
      ? truncateForLlm(lead, bodyBudget)
      : truncateForLlm(ex || t, Math.min(bodyBudget, 280));
  const overviewBody = `${titleLine}\n${overviewSecondLine}`;
  const overview = `${overviewBody}\nSecurity NEXT`;

  const 事象本文 =
    ex.length > 0
      ? truncateForLlm(ex, 900)
      : `（RSS 抜粋が空です。タイトル: ${truncateForLlm(t, 200)}）`;

  /**
   * 「事象」に載せた抜粋と同じ段落を「脆弱性関連」にコピーしない。
   * 技術寄りの文だけ拾い、先頭〜200字程度と同一始まりなら捨てる。
   */
  const techSentenceRe =
    /脆弱|CVE|インジェクション|認証|バイパス|ゼロデイ|悪用|権限|RCE|XSS|SQL|バッファ|オーバーフロー|リモート|コード実行|攻撃|スクリプト|ホール|欠陥/i;

  let 脆弱性関連 =
    "RSS 抜粋に CVE・攻撃種別等の技術的明記が乏しい場合があります。製品名・版数・深刻度は元記事・ベンダ情報で確認してください。";
  const cveRe = /CVE-\d{4}-\d+/gi;
  const cveMatch = cveRe.exec(ex);
  if (cveMatch) {
    const i = cveMatch.index;
    脆弱性関連 = truncateForLlm(ex.slice(Math.max(0, i - 24), i + cveMatch[0].length + 200).trim(), 500);
  } else if (techSentenceRe.test(ex)) {
    const chunks = ex
      .split(/[。．]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 4);
    const jishoHead = 事象本文.replace(/\s+/g, "").slice(0, 120);
    const hits: string[] = [];
    for (const c of chunks) {
      if (!techSentenceRe.test(c)) continue;
      const cn = c.replace(/\s+/g, "");
      if (
        jishoHead.length >= 24 &&
        (jishoHead.startsWith(cn.slice(0, Math.min(48, cn.length))) ||
          cn.startsWith(jishoHead.slice(0, Math.min(48, jishoHead.length))))
      ) {
        continue;
      }
      hits.push(`${c}。`);
    }
    if (hits.length > 0) {
      脆弱性関連 = truncateForLlm(hits.join(" "), 520);
    }
  }

  let 修正対策 =
    "抜粋に修正版・パッチ・手順の明記がない場合があります。元記事の対応案を参照してください。";
  const fixSnip = ex.match(
    /[^。\n]{0,80}(パッチ|アップデート|更新プログラム|修正版|ワークアラウンド|設定変更|対策)[^。\n]{0,240}/,
  );
  if (fixSnip) {
    修正対策 = truncateForLlm(fixSnip[0].trim(), 500);
  }

  const 見解 =
    "RSS 由来の自動登録です。資料化・社内検討の前に一次情報での裏取りを推奨します。";

  const digest = [
    `事象: ${事象本文}`,
    `脆弱性関連: ${脆弱性関連}`,
    `修正・対策: ${修正対策}`,
    `見解: ${見解}`,
  ].join("\n");

  return { overview, digest };
}

/**
 * digest 末尾の「見解:」直後の本文だけを差し替える（Gemini 見解のみ注入など）
 */
export function replaceDigestInsightParagraph(digest: string, newInsightBody: string): string {
  const label = "見解:";
  const idx = digest.indexOf(label);
  const body = newInsightBody.trim();
  if (!body) return digest;
  if (idx === -1) {
    return `${digest.trim()}\n${label} ${body}`;
  }
  return `${digest.slice(0, idx + label.length)} ${body}`;
}

/**
 * プレーンテキストをリッチエディタ用の簡易 HTML に変換する（REST API の RICH_TEXT は HTML 文字列で渡せる）
 */
export function plainTextToRichTextHtml(text: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const blocks = text
    .trim()
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (blocks.length === 0) return "<p></p>";
  return blocks.map((p) => `<p>${esc(p).replace(/\n/g, "<br />")}</p>`).join("");
}
