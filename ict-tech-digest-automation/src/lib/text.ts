/** kintone クエリ用に文字列をエスケープ */
export function escapeKintoneQueryString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
