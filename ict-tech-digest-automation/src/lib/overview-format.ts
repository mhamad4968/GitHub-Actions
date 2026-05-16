/** Gemini 登録・掲示板表示用: overview を【事象】【影響】【推奨】3行に正規化 */

const LABELS = ["【事象】", "【影響】", "【推奨】"] as const;

function stripLabel(line: string): string {
  let s = line.trim();
  for (const lb of LABELS) {
    if (s.startsWith(lb)) return s.slice(lb.length).trim();
  }
  return s;
}

/**
 * 3行ラベル付き概要に整形（既にラベルがあればそのまま）
 */
export function normalizeOverview(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return "【事象】（要確認）\n【影響】（要確認）\n【推奨】（要確認）";
  }
  if (LABELS.every((lb) => t.includes(lb))) {
    return t
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");
  }

  const lines = t
    .split(/\n+/)
    .map(stripLabel)
    .filter(Boolean);

  const body = [
    lines[0] ?? t.slice(0, 200),
    lines[1] ?? "自社のインフラ・PC・セキュリティ運用への影響を確認してください。",
    lines[2] ?? "情シスとして今日中に確認・周知すべきアクションを検討してください。",
  ];

  return LABELS.map((lb, i) => lb + body[i]).join("\n");
}
