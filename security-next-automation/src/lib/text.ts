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
