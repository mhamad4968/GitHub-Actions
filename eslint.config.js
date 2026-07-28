// customize/*.js の構文チェック用（kintone ブラウザ＋推奨ルールは緩め。パースエラーを主目的にする）
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "security-next-automation/**",
      "vite-kintone-list-button/**",
      // workdays 687/688: deploy 対象は desktop.js のみ（ui*.js は build 用断片）
      "customize/**/desktop.ui.js",
      "customize/**/desktop.ui.slim.js",
      // 736 PH1c: desktop.reorder.js は build 用断片（desktop.ui.js と同様）
      "customize/**/desktop.reorder.js",
      // 678: Vite/SheetJS ビルド成果物（.gitignore・deploy は bundle、lint 対象外）
      "customize/**/desktop.bundle.js",
      // 719 Wi-Fi: qrcode vendor + desktop.src.js → desktop.js 結合成果物（lint は src のみ）
      "customize/**/qrcode-vendor.js",
      "customize/wifi-ssid-dash/desktop.js",
      // 734 VPN: SheetJS + desktop.src.js → desktop.js 結合成果物（lint は src のみ）
      "customize/vpn-account-dash/desktop.js",
      // total-network dash: SheetJS bundle（lint は desktop.src.js のみ）
      "customize/total-network-dash/desktop.js",
      // 742 複合機: SheetJS + location master + desktop.src.js → desktop.js（lint は src のみ）
      "customize/mfp-ledger-dash/desktop.js",
      // 749 NAS: SheetJS + org/location master + desktop.src.js → desktop.js（lint は src のみ）
      "customize/nas-ledger-dash/desktop.js",
      // 751 メーリングリスト: SheetJS + dept master + desktop.src.js → desktop.js（lint は src のみ）
      "customize/mailing-list-dash/desktop.js",
      // JREクラウド: SheetJS + desktop.src.js → desktop.js（lint は src のみ）
      "customize/jre-cloud-account-dash/desktop.js",
      // Kintoneアカウント: SheetJS + desktop.src.js → desktop.js（lint は src のみ）
      "customize/kintone-account-dash/desktop.js",
      // JRE-C_Hub: SheetJS + desktop.src.js → desktop.js（lint は src のみ）
      "customize/jre-chub-account-dash/desktop.js",
      // 東海支店 iPad: SheetJS + desktop.src.js → desktop.js（lint は src のみ）
      "customize/tokai-ipad-dash/desktop.js",
    ],
  },
  {
    files: ["customize/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        kintone: "readonly",
        // 678 一覧/差異 Excel（SheetJS・desktop.bundle.js 同梱）
        XLSX: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
      "no-console": "off",
      // 2026-04-25 復帰 (TSB-007 続編・A-3 完遂):
      // 旧 off の no-useless-assignment / no-irregular-whitespace は recommended 既定 (error) に戻した。
      // 5 違反は customize/594/627 のコード側で実修正済み (let init 削除 / \u3000 escape 化)。
    },
  },
  {
    files: ["customize/**/desktop.src.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        kintone: "readonly",
        QRCode: "readonly",
        XLSX: "readonly",
        MFP_LOCATION_MASTER: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
];
