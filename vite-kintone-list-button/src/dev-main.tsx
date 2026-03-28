/**
 * ローカル `npm run dev` 用。kintone 無しで見た目だけ確認
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App appId="999" />
    </StrictMode>,
  );
}
