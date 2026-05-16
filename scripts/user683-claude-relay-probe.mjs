#!/usr/bin/env node
/**
 * ローカル Claude 中継へ POST し、HTTP と JSON 形を確認する。
 *
 *   npm run user683:claude-relay:probe
 */
import 'dotenv/config';

const port = Number(process.env.USER683_RELAY_PORT || 17884);
const url = `http://127.0.0.1:${port}/user683/summarize`;

async function main() {
  const body = {
    action: 'week',
    week: { corpus: '2026-05-14(水): テスト対応メモ（疎通確認）' },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const build = res.headers.get('x-relay-build') || res.headers.get('X-Relay-Build') || '';
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  console.log(`[user683-claude-probe] HTTP ${res.status} X-Relay-Build=${build || '(none)'}`);
  if (!res.ok) {
    console.error(text.slice(0, 500));
    process.exit(1);
  }
  if (!data || typeof data !== 'object') {
    console.error('[user683-claude-probe] NG: JSON でない応答');
    process.exit(1);
  }
  const summary = data.weekSummary != null ? String(data.weekSummary) : '';
  console.log(`[user683-claude-probe] weekSummary_len=${summary.length}`);
  if (summary.includes('API キー未設定')) {
    console.error(
      '[user683-claude-probe] NG: 中継は応答したが ANTHROPIC_API_KEY 未設定。.env を設定して中継を再起動してください。',
    );
    process.exit(2);
  }
  if (!summary.trim()) {
    console.error('[user683-claude-probe] NG: weekSummary が空');
    process.exit(1);
  }
  console.log('[user683-claude-probe] OK');
}

main().catch((e) => {
  console.error('[user683-claude-probe] NG:', e && e.message ? e.message : e);
  console.error(
    '[user683-claude-probe] 別ターミナルで npm run user683:claude-relay を起動してから再実行してください。',
  );
  process.exit(1);
});
