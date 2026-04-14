#!/usr/bin/env node
/**
 * repairKintoneFilename / Content-Disposition（server.mjs と同期すること）
 */
import iconv from "iconv-lite";

function hasStrictFullwidthJapaneseFilenameChars(s) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(String(s));
}

function eachCodeUnitSafeForLatin1ByteTruncation(s) {
  const u = String(s);
  for (let i = 0; i < u.length; i++) {
    const c = u.charCodeAt(i);
    if (c <= 0xff) continue;
    if (c >= 0xFF61 && c <= 0xFF9F) continue;
    return false;
  }
  return true;
}

function hasLatin1Utf8MojibakeSuspect(s) {
  const u = String(s);
  for (let i = 0; i < u.length; i++) {
    const c = u.charCodeAt(i);
    if (c >= 0x80 && c <= 0xff) return true;
  }
  if (/[\u00C2-\u00C4\u00C5\u00E2-\u00E5\u00E7\u00EF][\u0080-\u00BF]/.test(u)) return true;
  if (/[\u00C3\u00E3\u00E5][\u0080-\u00BF][\u0080-\u00BF]/.test(u)) return true;
  return false;
}

function contentDispositionWithUtf8Name(dispositionKind, utf8Name) {
  const base = String(utf8Name || "file").normalize("NFC");
  const kind = dispositionKind === "inline" ? "inline" : "attachment";
  const ascii = base.replace(/[^\x20-\x7E]/g, "_").replace(/\\/g, "_").replace(/"/g, "_") || "file";
  const asciiQuoted = ascii.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const star = encodeURIComponent(base);
  return `${kind}; filename*=UTF-8''${star}; filename="${asciiQuoted}"`;
}

function repairKintoneFilename(name) {
  if (name == null || name === "") return name;
  const s = String(name);
  if (hasStrictFullwidthJapaneseFilenameChars(s) && !hasLatin1Utf8MojibakeSuspect(s)) return s;

  let cur = s;
  for (let pass = 0; pass < 4; pass++) {
    if (!eachCodeUnitSafeForLatin1ByteTruncation(cur)) {
      if (hasStrictFullwidthJapaneseFilenameChars(cur) && !cur.includes("\uFFFD")) return cur;
      break;
    }
    let next;
    try {
      next = Buffer.from(cur, "latin1").toString("utf8");
    } catch {
      break;
    }
    if (next.includes("\uFFFD") || next === cur) break;
    cur = next;
    if (hasStrictFullwidthJapaneseFilenameChars(cur) && !hasLatin1Utf8MojibakeSuspect(cur)) return cur;
  }
  if (hasStrictFullwidthJapaneseFilenameChars(cur) && !cur.includes("\uFFFD")) return cur;

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
/** 半角カタカナ「テスト」+ .pdf */
const halfKatakana = "\uFF83\uFF6F\uFF7E\uFF84.pdf";
const halfOut = repairKintoneFilename(halfKatakana);
const nihongo = "日本語.jpg";
const truncated = "åå².png";
const truncatedOut = repairKintoneFilename(truncated);

const rows = [
  ["UTF-8 を Latin-1 誤読（典型）", latin1Mojibake, want],
  ["正しい日本語名（早期 return）", want, want],
  ["日本語.jpg（正しい UTF-8）", nihongo, nihongo],
  ["ASCII のみ", "readme.txt", "readme.txt"],
  ["半角カタカナのみ（ﾃｽﾄ.pdf 風）", halfKatakana, halfOut],
  ["C1 欠落の短いゴミ（据え置き）", truncated, truncatedOut],
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

const cd = contentDispositionWithUtf8Name("attachment", "日本語.jpg");
console.log("=== Content-Disposition sample ===\n" + cd);
const starOk = /^attachment; filename\*=UTF-8''/.test(cd) && cd.includes("%E6%97%A5%E6%9C%AC%E8%AA%9E.jpg");
const asciiPart = /filename="([^"]+)"/.exec(cd);
console.log(starOk ? "PASS\tfilename* is UTF-8'' percent-encoded" : "FAIL\tfilename*");
console.log(asciiPart ? `PASS\tASCII fallback: ${asciiPart[1]}` : "FAIL\tASCII fallback");
