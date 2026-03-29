/**
 * Security NEXT ニュース（KINTONE_APP_ID ＝通常 631）のレコードをすべて削除する。
 * - 要約フィールドが空の整理や、テストデータのクリアに使う。
 * - 誤実行防止のため、環境変数 DELETE_ALL_SECURITY_NEXT_NEWS=1 が無いと終了する。
 * - API トークンに「レコードの削除」権限が必要（無いと kintone がエラーを返す）。
 */
import { loadConfig } from "./lib/config.js";
import { createKintoneClient } from "./lib/kintone-client.js";

/** 誤って全削除しないよう、明示的に 1 を渡したときだけ削除を実行する */
const confirm = process.env.DELETE_ALL_SECURITY_NEXT_NEWS?.trim() === "1";

if (!confirm) {
  console.error(
    [
      "中止: 631 番ニュースアプリの全削除には確認フラグが必要です。",
      "  DELETE_ALL_SECURITY_NEXT_NEWS=1 を付けて再実行してください。",
      "  例: DELETE_ALL_SECURITY_NEXT_NEWS=1 npm run delete-all-news",
    ].join("\n"),
  );
  process.exit(1);
}

const cfg = loadConfig();
const client = createKintoneClient(cfg, cfg.kintoneApiTokenForCollect);
const appId = cfg.newsAppId;

/** レコード ID 付きで一覧取得（削除 API に id が必要なため） */
const rows = await client.record.getAllRecordsWithId({
  app: appId,
  fields: [],
});

if (rows.length === 0) {
  console.log(`アプリ ${appId}: 削除対象のレコードはありません。`);
  process.exit(0);
}

await client.record.deleteAllRecords({
  app: appId,
  records: rows.map((r) => ({ id: r.$id.value as string })),
});

console.log(`アプリ ${appId}: ${rows.length} 件のレコードを削除しました。`);
process.exit(0);
