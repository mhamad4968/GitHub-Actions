/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 任意: REST 先用。未設定なら kintone.app.getId() */
  readonly VITE_KINTONE_APP_ID?: string;
  /** 任意: 別ドメイン API 用。未設定ならブラウザの kintone 本体と同一 */
  readonly VITE_KINTONE_BASE_URL?: string;
  readonly VITE_BUTTON_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
