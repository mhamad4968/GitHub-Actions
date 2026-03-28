import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { useCallback, useMemo, useState } from 'react';
import { resolveAppId, resolveBaseUrl } from './env';

type AppProps = {
  /** 一覧を開いているアプリ ID（kintone.app.getId() から渡す。.env の VITE_KINTONE_APP_ID が優先） */
  appId: string;
};

/**
 * 一覧画面ヘッダ近くに出す React 部品の例
 */
export const App = ({ appId }: AppProps) => {
  const [message, setMessage] = useState<string | null>(null);
  /** .env または実行時の appId（ソースにベタ書きしない） */
  const effectiveAppId = useMemo(() => resolveAppId(appId), [appId]);

  /**
   * ボタン押下: REST API でレコード件数の取得だけ試す例（権限・フィールドに依存）
   */
  const onClick = useCallback(async () => {
    setMessage('読み込み中…');
    try {
      const baseUrl = resolveBaseUrl();
      const client = new KintoneRestAPIClient(baseUrl ? { baseUrl } : {});
      const res = await client.record.getRecords({
        app: effectiveAppId,
        totalCount: true,
        query: 'limit 1',
      });
      const total = 'totalCount' in res ? String(res.totalCount) : '（件数なし）';
      setMessage(`接続OK（totalCount の例: ${total}）`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(`エラー: ${msg}`);
    }
  }, [effectiveAppId]);

  const buttonLabel =
    typeof import.meta.env.VITE_BUTTON_LABEL === 'string' && import.meta.env.VITE_BUTTON_LABEL.trim() !== ''
      ? import.meta.env.VITE_BUTTON_LABEL.trim()
      : 'React ボタン（REST 接続テスト）';

  return (
    <div className="inline-flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={() => void onClick()}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {buttonLabel}
      </button>
      {message ? <p className="max-w-md text-xs text-slate-600">{message}</p> : null}
    </div>
  );
};
