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
    },
  },
];
