/**
 * @kintone/customize-uploader 用の customize-manifest.json を、desktop.js と同じ階層にまとめて出力する。
 * 公式はマニフェストをアップロード対象ファイルと「同じ階層」に置く前提（kintone.dev の手順どおり）。
 *
 * 実行: npm run generate:customize-manifests
 * 正本の対応表は kintone-apps.md の customize 列と .github/workflows/kintone-customize-deploy.yml の 629 分岐に合わせる。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** アプリ ID と customize ディレクトリ（ルートからの相対）、desktop JS のファイル名 */
const targets = [
  { appId: "594", relDir: "customize/594", desktopJs: "desktop.js" },
  { appId: "595", relDir: "customize/595", desktopJs: "desktop.js" },
  { appId: "626", relDir: "customize/626", desktopJs: "desktop.js" },
  { appId: "627", relDir: "customize/627", desktopJs: "desktop.js" },
  { appId: "629", relDir: "customize/shucccho-seisan", desktopJs: "desktop.js" },
  { appId: "640", relDir: "customize/640", desktopJs: "desktop.js" },
  { appId: "641", relDir: "customize/641", desktopJs: "desktop.js" },
];

function buildManifest(appId, desktopJs) {
  return {
    app: String(appId),
    scope: "ALL",
    desktop: {
      js: [desktopJs],
      css: [],
    },
    mobile: {
      js: [],
      css: [],
    },
  };
}

for (const t of targets) {
  const dirAbs = join(root, t.relDir);
  const manifestPath = join(dirAbs, "customize-manifest.json");
  mkdirSync(dirAbs, { recursive: true });
  const json = `${JSON.stringify(buildManifest(t.appId, t.desktopJs), null, 2)}\n`;
  writeFileSync(manifestPath, json, "utf8");
  console.log("wrote", join(t.relDir, "customize-manifest.json"));
}
