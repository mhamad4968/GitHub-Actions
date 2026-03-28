/**
 * Vite の環境変数（.env）は **ビルド時** にバンドルへ埋め込まれる。
 * ブラウザ向け JS なので、VITE_ に書いた値は **ユーザーが開発者ツールで読める**（秘密情報は入れない）。
 */

/** ビルド時に .env の VITE_KINTONE_APP_ID があればそれを使い、無ければ kintone 実行時の appId */
export const resolveAppId = (runtimeAppId: string): string => {
  const v = import.meta.env.VITE_KINTONE_APP_ID;
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  return runtimeAppId;
};

/** REST API のベース URL。空なら @kintone/rest-api-client の既定（今の画面と同一ドメイン） */
export const resolveBaseUrl = (): string | undefined => {
  const v = import.meta.env.VITE_KINTONE_BASE_URL;
  if (typeof v === 'string' && v.trim() !== '') return v.trim().replace(/\/+$/, '');
  return undefined;
};
