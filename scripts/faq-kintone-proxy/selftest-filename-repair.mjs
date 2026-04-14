#!/usr/bin/env node
/**
 * repairKintoneFilename の挙動検証（server.mjs の実装と同期すること）
 */
import iconv from "iconv-lite";

function hasStrictFullwidthJapaneseFilenameChars(s) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(String(s));
}

function repairKintoneFilename(name) {
  if (name == null || name === "") return name;
  const s = String(name);
  if (hasStrictFullwidthJapaneseFilenameChars(s)) return s;
  let latin1AsUtf8 = s;
  try {
    latin1AsUtf8 = Buffer.from(s, "latin1").toString("utf8");
  } catch { /* noop */ }
  const latin1HasReplacement = latin1AsUtf8.includes("\uFFFD");
  if (
    latin1AsUtf8 !== s
    && hasStrictFullwidthJapaneseFilenameChars(latin1AsUtf8)
    && !latin1HasReplacement
  ) {
    return latin1AsUtf8;
  }
  if (!latin1HasReplacement) {
    try {
      const sj = iconv.decode(Buffer.from(s, "latin1"), "Shift_JIS");
      if (sj !== s && hasStrictFullwidthJapaneseFilenameChars(sj) && !sj.includes("\uFFFD")) return sj;
    } catch { /* noop */ }
    try {
      const sj2 = iconv.decode(Buffer.from(s, "utf8"), "Shift_JIS");
      if (sj2 !== s && hasStrictFullwidthJapaneseFilenameChars(sj2) && !sj2.includes("\uFFFD")) return sj2;
    } catch { /* noop */ }
  }
  return s;
}

const want = "テスト_半角ｶﾅ.jpg";
const latin1Mojibake = Buffer.from(want, "utf8").toString("latin1");
const halfOnly = "\uFF83\uFF74\uFF85.jpg";
const halfOnlyOut = repairKintoneFilename(halfOnly);
const truncated = "åå².png";
const truncatedOut = repairKintoneFilename(truncated);

const rows = [
  ["UTF-8 を Latin-1 誤読（典型）", latin1Mojibake, want],
  ["正しい日本語名（早期 return）", want, want],
  ["ASCII のみ", "readme.txt", "readme.txt"],
  ["半角カナのみ（厳格条件なし→latin1 修復を試行。戻り値は下記 out）", halfOnly, halfOnlyOut],
  ["C1 欠落の短いゴミ（SJIS 誤爆を避け据え置き）", truncated, truncatedOut],
];

console.log("=== repairKintoneFilename selftest ===\n");
for (const [label, input, expected] of rows) {
  const out = repairKintoneFilename(input);
  const ok = out === expected ? "PASS" : "FAIL";
  console.log(`${ok}\t${label}`);
  console.log(`  in : ${JSON.stringify(input)}`);
  console.log(`  out: ${JSON.stringify(out)}`);
  console.log(`  exp: ${JSON.stringify(expected)}\n`);
}
