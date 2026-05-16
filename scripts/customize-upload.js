/**
 * 指定アプリ向け customize-manifest.json を @kintone/customize-uploader に渡してアップロードする。
 * API トークンではなくログイン（KINTONE_USERNAME / KINTONE_PASSWORD）または OAuth（KINTONE_OAUTH_TOKEN）が必要。
 *
 * 使用例: npm run upload -- 594
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** generate-customize-manifests.js と同じ対応（マニフェストの実体パス）。594 は廃止予定だが `disable:594:browserjs` 等のためエントリ維持。 */
const manifestByApp = {
  594: join(root, "customize/594/customize-manifest.json"),
  595: join(root, "customize/595/customize-manifest.json"),
  626: join(root, "customize/626/customize-manifest.json"),
  627: join(root, "customize/627/customize-manifest.json"),
  629: join(root, "customize/shucccho-seisan/customize-manifest.json"),
};

const appId = process.argv[2]?.trim();
if (!appId || !/^\d+$/.test(appId) || !manifestByApp[appId]) {
  console.error("Usage: node scripts/customize-upload.js <APP_ID>");
  console.error("  APP_ID: one of " + Object.keys(manifestByApp).sort().join(", "));
  process.exit(2);
}

const manifest = manifestByApp[appId];
if (!existsSync(manifest)) {
  console.error("Missing manifest. Run: npm run generate:customize-manifests");
  console.error("Expected:", manifest);
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["--yes", "@kintone/customize-uploader", manifest],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: false,
  },
);

process.exit(result.status === null ? 1 : result.status);
