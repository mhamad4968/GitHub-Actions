#!/usr/bin/env node
/**
 * kintone 683 ブラウザ用: Claude 中継 URL を sessionStorage に入れるコンソール1行を出力する。
 *
 *   npm run user683:claude-browser-url:print
 */
import 'dotenv/config';

const port = Number(process.env.USER683_RELAY_PORT || 17884);
const relayUrl = `http://127.0.0.1:${port}/user683/summarize`;
const storageKey = 'user_support_683_claude_relay_url';

const snippet = [
  `sessionStorage.setItem('${storageKey}', '${relayUrl}');`,
  'location.reload();',
].join(' ');

console.log('[user683-claude-browser-url] kintone 683 一覧を開いた状態で DevTools コンソールに貼り付け:');
console.log(snippet);
console.log(
  '[user683-claude-browser-url] HTTPS の kintone では http が使えません。次を使ってください: npm run user683:claude-relay:public',
);
