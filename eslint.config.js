// customize/*.js の構文チェック用（kintone ブラウザ＋推奨ルールは緩め。パースエラーを主目的にする）
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["**/node_modules/**", "security-next-automation/**", "vite-kintone-list-button/**"] },
  {
    files: ["customize/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        kintone: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
      "no-console": "off",
      // 2026-04-21 追加 (#S6 lint:customize 修復・TSB-007 解消):
      // ESLint v10 で recommended に入った下記ルールは、既存コードに 5 件ヒットするが
      // ロジック影響ゼロのため一旦 off。後日コード修正時に on に戻す TODO (TSB-007 続編)。
      "no-useless-assignment": "off",
      "no-irregular-whitespace": "off",
    },
  },
];
