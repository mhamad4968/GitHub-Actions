/**
 * 社員マスタ(595) 全レコードに EMP-ID を一括付番するスクリプト
 * レコード番号 昇順で EMP-0001 から連番を振る。
 * 既に emp_id が入っているレコードはスキップ（上書きしない）。
 */
import "dotenv/config";

const BASE_URL = process.env.KINTONE_BASE_URL?.trim().replace(/\/$/, "");
const USER = process.env.KINTONE_USERNAME?.trim();
const PASS = process.env.KINTONE_PASSWORD?.trim();
const APP_ID = "595";

if (!BASE_URL || !USER || !PASS) {
  console.error("ERROR: .env に KINTONE_BASE_URL / USERNAME / PASSWORD を設定してください");
  process.exit(1);
}

const auth = Buffer.from(`${USER}:${PASS}`).toString("base64");
const authHeader = { "X-Cybozu-Authorization": auth };
const postHeaders = { ...authHeader, "Content-Type": "application/json" };

async function kGet(path, params) {
  const u = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
  console.log("  DEBUG URL:", u.toString().replace(/X-Cybozu.*/, "***"));
  const res = await fetch(u.toString(), { headers: authHeader });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function kPut(path, body) {
  const res = await fetch(BASE_URL + path, { method: "PUT", headers: postHeaders, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getAllRecords() {
  let all = [];
  let offset = 0;
  while (true) {
    const q = "limit 500 offset " + offset;
    const data = await kGet("/k/v1/records.json", { app: APP_ID, query: q });
    const recs = data.records || [];
    all = all.concat(recs);
    console.log(`  Fetched ${recs.length} records (offset ${offset}, total so far ${all.length})`);
    if (recs.length < 500) break;
    offset += 500;
  }
  return all;
}

async function main() {
  console.log("=== EMP-ID 一括付番スクリプト ===");
  console.log(`対象: ${BASE_URL} App ${APP_ID}`);
  console.log("");

  // 1. 全レコード取得
  console.log("[1/4] 全レコード取得中...");
  const all = await getAllRecords();
  console.log(`  合計: ${all.length} 件`);

  // 2. 未付番のレコードを特定
  const needsAssign = [];
  let seq = 1;
  for (const r of all) {
    const existing = (r.emp_id?.value || "").trim();
    if (existing) {
      // 既に付番済み → 番号を進めるだけ（上書きしない）
      const num = parseInt(existing.replace("EMP-", ""), 10);
      if (num >= seq) seq = num + 1;
    } else {
      needsAssign.push(r.$id.value);
    }
  }
  console.log(`  付番済み: ${all.length - needsAssign.length} 件`);
  console.log(`  未付番:   ${needsAssign.length} 件`);
  console.log(`  次の番号: EMP-${String(seq).padStart(4, "0")}`);

  if (needsAssign.length === 0) {
    console.log("\n✅ 全レコード付番済み。追加作業なし。");
    return;
  }

  // 3. バッチ更新（100件ずつ）
  console.log(`\n[2/4] 未付番 ${needsAssign.length} 件に EMP-ID を付番中...`);
  for (let i = 0; i < needsAssign.length; i += 100) {
    const batch = needsAssign.slice(i, i + 100).map((id, j) => ({
      id,
      record: { emp_id: { value: `EMP-${String(seq + i + j).padStart(4, "0")}` } },
    }));
    await kPut("/k/v1/records.json", { app: APP_ID, records: batch });
    console.log(`  Batch ${Math.floor(i / 100) + 1}: ${batch.length} 件更新 (EMP-${String(seq + i).padStart(4, "0")} 〜 EMP-${String(seq + i + batch.length - 1).padStart(4, "0")})`);
  }

  // 4. 検証（全件再取得して重複チェック）
  console.log("\n[3/4] 検証: 全件再取得して重複チェック...");
  const verify = await getAllRecords();
  const ids = verify.map((r) => r.emp_id?.value).filter(Boolean);
  const uniqueSet = new Set(ids);
  const empty = verify.filter((r) => !(r.emp_id?.value || "").trim()).length;
  console.log(`  付番済み: ${ids.length} 件`);
  console.log(`  ユニーク: ${uniqueSet.size} 件`);
  console.log(`  重複:     ${ids.length - uniqueSet.size} 件`);
  console.log(`  未付番:   ${empty} 件`);
  console.log(`  先頭:     ${ids[0]}`);
  console.log(`  末尾:     ${ids[ids.length - 1]}`);

  // 5. 結果判定
  console.log("\n[4/4] 最終判定:");
  if (ids.length === verify.length && uniqueSet.size === ids.length && empty === 0) {
    console.log("✅ PASS: 全 " + verify.length + " 件に重複なく EMP-ID を付番完了。");
  } else {
    console.log("❌ FAIL: 問題あり。上記の数値を確認してください。");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
