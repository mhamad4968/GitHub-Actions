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
      // 678: Vite/SheetJS ビルド成果物（.gitignore・deploy は bundle、lint 対象外）
      "customize/**/desktop.bundle.js",
      // 719 Wi-Fi: qrcode vendor + desktop.src.js → desktop.js 結合成果物（lint は src のみ）
      "customize/**/qrcode-vendor.js",
      "customize/wifi-ssid-dash/desktop.js",
      // 734 VPN: SheetJS + desktop.src.js → desktop.js 結合成果物（lint は src のみ）
      "customize/vpn-account-dash/desktop.js",
      // total-network dash: SheetJS bundle（lint は desktop.src.js のみ）
      "customize/total-network-dash/desktop.js",
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
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
];
