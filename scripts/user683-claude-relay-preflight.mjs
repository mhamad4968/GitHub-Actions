#!/usr/bin/env node
/**
 * 683 Claude 中継の起動前チェック（API キー・ポート・疎通の前提）。
 *
 *   npm run user683:claude-relay:preflight
 */
import 'dotenv/config';
import net from 'node:net';

const port = Number(process.env.USER683_RELAY_PORT || 17884);
const relayPath = '/user683/summarize';

function hasKey() {
  const v = process.env.ANTHROPIC_API_KEY;
  return Boolean(v && String(v).trim());
}

function portReachable(p) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host: '127.0.0.1', port: p }, () => {
      sock.end();
      resolve(true);
    });
    sock.once('error', () => resolve(false));
  });
}

function portBusy(p) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(true));
    srv.once('listening', () => {
      srv.close(() => resolve(false));
    });
    srv.listen(p, '127.0.0.1');
  });
}

async function main() {
  const keyOk = hasKey();
  const reachable = await portReachable(port);
  const busy = reachable ? true : await portBusy(port);
  console.log(`[user683-claude-preflight] ANTHROPIC_API_KEY=${keyOk ? 'set' : 'missing'}`);
  console.log(`[user683-claude-preflight] USER683_RELAY_PORT=${port}`);
  console.log(`[user683-claude-preflight] relay_path=${relayPath}`);
  console.log(
    `[user683-claude-preflight] port_127.0.0.1=${reachable ? 'listening' : busy ? 'in_use_or_blocked' : 'free'}`,
  );
  if (!keyOk) {
    console.error(
      '[user683-claude-preflight] NG: .env に ANTHROPIC_API_KEY を設定してから npm run user683:claude-relay を起動してください。',
    );
    process.exit(2);
  }
  if (busy) {
    console.log(
      '[user683-claude-preflight] ポート使用中（中継が既に起動している可能性）。npm run user683:claude-relay:probe で疎通確認してください。',
    );
    process.exit(0);
  }
  console.log('[user683-claude-preflight] OK: npm run user683:claude-relay で起動できます。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
