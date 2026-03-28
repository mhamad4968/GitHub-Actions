import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const MOUNT_ID = 'jbis-react-list-button-root';

/**
 * 一覧画面で「フィルターの上・ツールバー付近」の **ヘッダーメニュー用スペース** に UI を載せる。
 * `getHeaderMenuSpaceElement()` が返すのは、kintone が用意した **メニューボタン列の右側に並ぶ空き DOM**。
 * 親が横並びのときが多いので、マウント先に `w-full flex justify-end` を付け **右端寄せ**にする。
 */
const mountListViewButton = (): void => {
  const header = kintone.app.getHeaderMenuSpaceElement();
  if (!header) {
    console.warn('[kintone-list-button] ヘッダメニュー領域が取得できませんでした');
    return;
  }
  let el = document.getElementById(MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    // ツールバー内で右側に寄せる（テーマにより親が flex でない場合は見た目だけズレることがある）
    el.className = 'jbis-kintone-header-menu-right w-full flex justify-end items-center';
    el.setAttribute('data-jbis-mount', 'list-header-menu-right');
    header.appendChild(el);
  }
  const appId = String(kintone.app.getId());
  const root = createRoot(el);
  root.render(
    <StrictMode>
      <App appId={appId} />
    </StrictMode>,
  );
};

// 一覧画面表示後にマウント（イベントを返して kintone 標準処理を継続）
kintone.events.on('app.record.index.show', (event) => {
  mountListViewButton();
  return event;
});
