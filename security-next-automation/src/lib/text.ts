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
 * 抜粋内の CVE 位置から前後を切り出す。直前が短い固定オフセットだと「Manager」→「nager」のように単語途中になるため、
 * 直前の句読点／改行まで遡る（無ければ十分長くバックオフセット）。
 */
export function excerptWindowAroundCve(ex: string, cveIndex: number, cveLen: number, maxOut: number): string {
  const backSpan = Math.min(cveIndex, 400);
  const hardStart = cveIndex - backSpan;
  const before = ex.slice(hardStart, cveIndex);
  let rel = before.lastIndexOf("。");
  if (rel < 0) rel = before.lastIndexOf("．");
  if (rel < 0) rel = before.lastIndexOf("\n");
  const start = rel >= 0 ? hardStart + rel + 1 : Math.max(0, cveIndex - 220);
  const end = Math.min(ex.length, cveIndex + cveLen + 300);
  return truncateForLlm(ex.slice(start, end).trimStart(), maxOut);
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
 * NVD の digestFullText（nvd-fetch が組み立てた行ブロック）から CVE・英語説明・CVSS 行を取り出す。
 * 取れなければ null（呼び出し側で RSS 向け整形に落とす）。
 */
export function tryParseNvdStructuredExcerpt(ex: string): {
  id: string;
  descEn: string;
  cvssLine: string;
} | null {
  const trimmed = ex.trim();
  const idMatch = /^CVE ID:\s*(CVE-\d{4}-\d+)/im.exec(trimmed);
  if (!idMatch) return null;
  const id = idMatch[1];
  const descBlock = /説明（英語）:\s*([\s\S]*?)(?=\nCVSS|\n出典:|$)/i.exec(trimmed);
  const descEn = (descBlock?.[1] || "").replace(/\s+/g, " ").trim();
  const cvssLineM = /^CVSS[^\n]+/m.exec(trimmed);
  const cvssLine = (cvssLineM?.[0] || "").trim();
  return { id, descEn, cvssLine };
}

/**
 * NVD 登録抜粋だけを材料に、事象・脆弱性関連の英語説明の二重記載を避ける。
 */
function buildNvdMaterialSummaryDigestFromParsed(
  parsed: { id: string; descEn: string; cvssLine: string },
  title: string,
  overviewMaxChars: number,
  overviewFooterLine: string,
): { overview: string; digest: string } {
  const t = (title || "").trim() || "(無題)";
  const titleLine = truncateForLlm(t, Math.min(160, Math.max(40, Math.floor(overviewMaxChars * 0.5))));
  const bodyBudget = Math.max(48, overviewMaxChars - titleLine.length - 1);
  const leadSource = parsed.descEn || t;
  const lead = shortLeadForOverview(leadSource, bodyBudget).trim();
  const overviewSecondLine =
    lead.length >= 12
      ? truncateForLlm(lead, bodyBudget)
      : truncateForLlm(leadSource, Math.min(bodyBudget, 280));
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const nt = norm(t);
  const ntl = norm(titleLine);
  const secondOk = overviewSecondLine.trim().length >= 12;
  const titleRepeats =
    secondOk &&
    (ntl === nt || (nt.startsWith(ntl) && ntl.length >= Math.min(24, Math.floor(nt.length * 0.85))));
  const overviewBody = titleRepeats ? overviewSecondLine.trim() : `${titleLine}\n${overviewSecondLine}`;
  const overview = `${overviewBody}\n${overviewFooterLine}`;

  const descPart = parsed.descEn
    ? truncateForLlm(parsed.descEn, 720)
    : "（英語説明の抽出に失敗したため、タイトルと NVD 詳細ページで確認してください。）";
  const 事象本文 =
    `NVD（米国 NIST の脆弱性データベース）に、${parsed.id} として脆弱性情報が登録されています。` +
    `\n登録されている説明（英語原文の要約として引用）: ${descPart}`;

  const 脆弱性行: string[] = [];
  if (parsed.cvssLine) {
    脆弱性行.push(parsed.cvssLine);
  }
  脆弱性行.push(
    `${parsed.id} の攻撃条件・機密性・完全性・可用性への影響は、上記の英語説明および CVSS ベクタ（掲載がある場合）に基づきます。ここでは事象欄と同じ英文を繰り返しません。`,
  );
  const 脆弱性関連 = 脆弱性行.join("\n");

  const 修正対策 =
    "NVD の登録抜粋だけでは修正版・パッチ番号が分からない場合があります。NVD ページの References、ベンダアドバイザリ、製品サポートを参照し、一次情報で版数と対応方針を確認してください。";

  const 見解 =
    "NVD からの自動取り込みです。社内資産に該当するか、優先度をどう置くかは、スキャン結果・構成台帳と突き合わせて判断してください。";

  const digest = [
    `事象: ${事象本文}`,
    `脆弱性関連: ${脆弱性関連}`,
    `修正・対策: ${修正対策}`,
    `見解: ${見解}`,
  ].join("\n\n");

  return { overview, digest };
}

/** タイトルから技術文脈のヒント文を生成（フォールバック要約の薄さを緩和） */
export function vulnerabilityHintFromTitle(title: string): string {
  const t = (title || "").trim();
  if (!t) return "";
  const hints: string[] = [];
  const cves = t.match(/CVE-\d{4}-\d+/gi);
  if (cves) hints.push(`掲題に ${[...new Set(cves)].join("、")}`);
  if (/ゼロデイ|ゼロデー|0\s*day/i.test(t)) hints.push("ゼロデイ（緊急度が高い可能性）");
  if (/ランサム|ransom/i.test(t)) hints.push("ランサムウェア関連");
  if (/フィッシング|詐欺メール/i.test(t)) hints.push("フィッシング／ソーシャル系");
  if (/不正アクセス|流出|漏えい|漏洩/i.test(t)) hints.push("インシデント・情報流出の文脈");
  if (/パッチ|アップデート|更新プログラム|緊急更新/i.test(t)) hints.push("修正・更新の公表あり");
  if (/Emotet|EmoCheck|マルウェア|ボットネット|トロイの木馬/i.test(t)) hints.push("マルウェア・不正コード関連");
  if (/IBM|Verify\s*Identity|Security\s*Verify\s*Access|アイ・ビー・エム/i.test(t)) {
    hints.push("IBM 製品（Identity／アクセス制御系）の脆弱性・セキュリティアップデート");
  }
  if (/Ivanti|EPMM|Endpoint\s*Manager\s*Mobile|CISA|KEV/i.test(t)) {
    hints.push("Ivanti／MDM・CISA 等の注意喚起・CVE 悪用の文脈");
  }
  if (/サイバー攻撃|サイバー.?インシデント|ネットワーク攻撃|ハッキング|侵害事件/i.test(t)) {
    hints.push("組織・事業者のサイバーインシデント報道");
  }
  if (/子会社|関連会社|合弁|現地法人|海外拠点/i.test(t)) hints.push("グループ会社・海外拠点が関係する事案");
  if (/JPCERT|IPA|注意喚起|CC[^A-Z]|コーディネーション/i.test(t)) hints.push("国内 CSIRT・注意喚起の文脈");
  if (/(ツール|ユーティリティ|チェック|診断).{0,40}脆弱|脆弱.{0,40}(ツール|ユーティリティ)/i.test(t)) {
    hints.push("セキュリティ系ツール／ユーティリティの脆弱性");
  }
  if (/脆弱性|悪用|CVE/i.test(t) && hints.length === 0) hints.push("脆弱性・脅威に関する報道");
  if (hints.length === 0) return "";
  return `タイトルから読み取れる論点: ${hints.join("／")}。詳細な技術条件・CVSS・版数は記事本文・アドバイザリで確認。`;
}

/**
 * Gemini 未使用時・API 失敗時でも、kintone の summary / digest を「材料向け」に分離する。
 * digest は README どおり 4 見出し（事象・脆弱性関連・修正・対策・見解）。overview は短いリード＋末尾の出典行（既定は Security NEXT）。
 * materialSource が nvd のときは NVD 用に事象・脆弱性関連を分離し、英語説明の重複と「RSS 由来」の誤記を避ける。
 */
export function buildRssMaterialSummaryDigest(
  excerptPlain: string,
  title: string,
  overviewMaxChars: number,
  overviewFooterLine: string = "Security NEXT",
  materialSource: "rss" | "nvd" = "rss",
): { overview: string; digest: string } {
  if (materialSource === "nvd") {
    const parsed = tryParseNvdStructuredExcerpt(excerptPlain);
    if (parsed) {
      return buildNvdMaterialSummaryDigestFromParsed(parsed, title, overviewMaxChars, overviewFooterLine);
    }
  }

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
  /**
   * kintone では別フィールドにタイトルがあるため、概要 1 行目がタイトルと同文だと冗長。
   * 先頭行がタイトル本体と同一／先頭一致で短いリードだけ残す。
   */
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const nt = norm(t);
  const ntl = norm(titleLine);
  const secondOk = overviewSecondLine.trim().length >= 12;
  const titleRepeats =
    secondOk &&
    (ntl === nt || (nt.startsWith(ntl) && ntl.length >= Math.min(24, Math.floor(nt.length * 0.85))));
  const overviewBody = titleRepeats ? overviewSecondLine.trim() : `${titleLine}\n${overviewSecondLine}`;
  const overview = `${overviewBody}\n${overviewFooterLine}`;

  const 事象本文 =
    ex.length > 0
      ? truncateForLlm(ex, 900)
      : `（RSS 抜粋が空です。タイトル: ${truncateForLlm(t, 200)}）`;

  /**
   * 「事象」に載せた抜粋と同じ段落を「脆弱性関連」にコピーしない。
   * 技術寄りの文だけ拾い、先頭〜200字程度と同一始まりなら捨てる。
   */
  const techSentenceRe =
    /脆弱|CVE|インジェクション|認証|バイパス|ゼロデイ|悪用|権限|RCE|XSS|SQL|バッファ|オーバーフロー|リモート|コード実行|攻撃|スクリプト|ホール|欠陥|サイバー攻撃|不正アクセス|情報漏えい|情報漏洩|ランサム|マルウェア|侵入|侵害|ハッキング|データ流出/i;

  const titleHint = vulnerabilityHintFromTitle(t);
  const DIGEST_脆弱性関連_FALLBACK =
    titleHint ||
    "抜粋だけでは CVE・攻撃手口の特定に至らない。技術詳細・影響範囲は記事本文および公表元の続報で要確認。";
  let 脆弱性関連 = DIGEST_脆弱性関連_FALLBACK;
  const cveRe = /CVE-\d{4}-\d+/gi;
  const cveMatch = cveRe.exec(ex);
  /** 抜粋に「脆弱性」があれば CVE 無しでもその付近を要約に載せる（製品名＋脆弱性の一行が多い） */
  const vulnPhrase = ex.match(/[^。\n]{6,240}脆弱性[^。\n]{0,240}/);
  if (cveMatch) {
    脆弱性関連 = excerptWindowAroundCve(ex, cveMatch.index, cveMatch[0].length, 520);
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
  } else if (vulnPhrase) {
    脆弱性関連 = truncateForLlm(vulnPhrase[0].trim(), 520);
  }
  /** 技術チャンク判定は通ったが重複除外ですべて落ちた → 脆弱性を含む抜粋があれば採用 */
  if (脆弱性関連 === DIGEST_脆弱性関連_FALLBACK && vulnPhrase) {
    脆弱性関連 = truncateForLlm(vulnPhrase[0].trim(), 520);
  }
  if (脆弱性関連 === DIGEST_脆弱性関連_FALLBACK && titleHint) {
    脆弱性関連 = titleHint;
  }

  const incidentContextRe =
    /サイバー攻撃|不正アクセス|情報漏えい|情報漏洩|ランサム|マルウェア|侵入|侵害|ハッキング|データ流出|インシデント/i;
  let 修正対策 =
    /パッチ|アップデート|更新|緊急|修正版|ワークアラウンド/i.test(t)
      ? "タイトルに更新・対応の示唆あり。適用対象バージョン・入手元は記事本文の手順に従い確認。"
      : incidentContextRe.test(ex) || incidentContextRe.test(t)
        ? "調査・復旧・開示の有無は記事および公表会社の公式発表で確認。社内では類似システム・取引先への影響範囲の整理が有効。"
        : "パッチ・手順の記載が抜粋に無い場合は、記事内の対応案およびベンダ・公表元の案内を参照。";
  const fixSnip = ex.match(
    /[^。\n]{0,80}(パッチ|アップデート|更新プログラム|修正版|ワークアラウンド|設定変更|対策)[^。\n]{0,240}/,
  );
  const incidentResponseSnip = ex.match(
    /[^。\n]{0,80}(調査|復旧|業務影響|警察|届出|開示|顧客|取引先|対応)[^。\n]{0,280}/,
  );
  if (fixSnip) {
    修正対策 = truncateForLlm(fixSnip[0].trim(), 500);
  } else if ((incidentContextRe.test(ex) || incidentContextRe.test(t)) && incidentResponseSnip) {
    修正対策 = truncateForLlm(incidentResponseSnip[0].trim(), 500);
  } else if (cveMatch && /悪用|緊急対応|KEV|要請|注意喚起/i.test(ex)) {
    修正対策 = truncateForLlm(
      "該当 CVE・製品の利用有無を確認し、ベンダのセキュリティアドバイザリの修正版・ワークアラウンドを優先適用。悪用・緊急要請が示される場合は適用順位を上げ、影響範囲の洗い出しを早める。",
      500,
    );
  }

  const 見解 =
    "優先度は事案の公開状況と社内利用資産に依存。関係システムの利用有無とパッチ適用方針を早めに整理するとよい。";

  const digest = [
    `事象: ${事象本文}`,
    `脆弱性関連: ${脆弱性関連}`,
    `修正・対策: ${修正対策}`,
    `見解: ${見解}`,
  ].join("\n\n");

  return { overview, digest };
}

/** kintone 要約（digest）の 4 見出し。順序・表記は format-news-gemini の DIGEST_HEADINGS と一致させる */
const DIGEST_SECTION_LABELS = ["事象:", "脆弱性関連:", "修正・対策:", "見解:"] as const;

/**
 * 事象・脆弱性関連・修正・対策・見解の各ブロックの間に空行を 1 行入れる（一覧・リッチ変換で段落分けされやすくする）
 */
export function layoutDigestWithSectionSpacing(digest: string): string {
  const d = digest.replace(/\r\n/g, "\n").trim();
  const parts: string[] = [];
  for (let i = 0; i < DIGEST_SECTION_LABELS.length; i++) {
    const h = DIGEST_SECTION_LABELS[i];
    const next = DIGEST_SECTION_LABELS[i + 1];
    const start = d.indexOf(h);
    if (start < 0) {
      return d;
    }
    const from = start + h.length;
    const end = next ? d.indexOf(next, from) : d.length;
    if (next !== undefined && end < 0) {
      return d;
    }
    const to = end < 0 ? d.length : end;
    const body = d.slice(from, to).trim();
    parts.push(`${h} ${body}`);
  }
  return parts.join("\n\n");
}

/**
 * Gemini や手入力で混入しやすい「見解:」重複・文末の「ます。です。」を整える
 */
export function normalizeInsightParagraphBody(raw: string): string {
  let s = raw.trim().replace(/^見解:\s*/i, "").replace(/\r\n/g, "\n");
  while (/です[。．]\s*です[。．]/.test(s)) {
    s = s.replace(/です[。．]\s*です[。．]/g, "です。");
  }
  s = s.replace(/します\s*。\s*です[。．]/g, "します。");
  s = s.replace(/ください\s*。\s*です[。．]/g, "ください。");
  return s.trim();
}

/**
 * digest 末尾の「見解:」直後の本文だけを差し替える（Gemini 見解のみ注入など）
 */
export function replaceDigestInsightParagraph(digest: string, newInsightBody: string): string {
  const label = "見解:";
  const idx = digest.lastIndexOf(label);
  const body = normalizeInsightParagraphBody(newInsightBody);
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
