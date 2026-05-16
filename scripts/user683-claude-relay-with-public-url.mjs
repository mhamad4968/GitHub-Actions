#!/usr/bin/env node
/**
 * HTTPS の kintone 683 向け: Claude 中継をローカルで起動し、公開 HTTPS URL を表示する。
 *
 *   npm run user683:claude-relay:public
 *
 * 別ターミナルで中継だけ動かしている場合:
 *   npm run user683:claude-relay:public -- --no-spawn
 *
 * 依存: devDependency `localtunnel`（初回のみ `npm install`）
 */
import { execFile, spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  let noSpawn = false;
  let port = Number(process.env.USER683_RELAY_PORT || 17884);
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--no-spawn') {
      noSpawn = true;
    } else if (argv[i] === '--port' && argv[i + 1]) {
      port = Number(argv[++i]);
    }
  }
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    console.error('[user683-claude-relay:public] 無効なポート');
    process.exit(2);
  }
  return { noSpawn, port };
}

/** listen 済みか（HTTP ではなく TCP で確認。Windows で OPTIONS が届かない事例の回避） */
function probeTcpListen(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.setTimeout(3000);
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/** Windows: Node の TCP がループバックに失敗しても Test-NetConnection が True になる環境があるため、同じ API で確認する */
function probePortWindowsPowershell(port) {
  return new Promise((resolve) => {
    const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
    const exe = path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const cmd = [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `$r = Test-NetConnection -ComputerName 127.0.0.1 -Port ${port} -WarningAction SilentlyContinue; if ($r.TcpTestSucceeded) { exit 0 } else { exit 1 }`,
    ];
    execFile(exe, cmd, { timeout: 20000, windowsHide: true }, (err) => {
      resolve(!err);
    });
  });
}

async function waitForRelay(port, maxMs) {
  const t0 = Date.now();
  let lastLogAt = t0;
  const pollMs = process.platform === 'win32' ? 1500 : 500;
  while (Date.now() - t0 < maxMs) {
    if (Date.now() - lastLogAt >= 10000) {
      lastLogAt = Date.now();
      console.error(
        '[user683-claude-relay:public] 中継の応答を待っています… (' + Math.round((Date.now() - t0) / 1000) + 's)',
      );
    }
    let ready = false;
    if (process.platform === 'win32') {
      ready =
        (await probeTcpListen('127.0.0.1', port)) ||
        (await probeTcpListen('localhost', port)) ||
        (await probePortWindowsPowershell(port));
    } else {
      ready =
        (await probeTcpListen('127.0.0.1', port)) || (await probeTcpListen('localhost', port));
    }
    if (ready) {
      return true;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return false;
}

function spawnClaudeRelayChild() {
  const npmCli = process.env.npm_execpath;
  if (npmCli) {
    return spawn(process.execPath, [npmCli, 'run', 'user683:claude-relay'], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      windowsHide: true,
    });
  }
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(npmCmd, ['run', 'user683:claude-relay'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    windowsHide: true,
  });
}

function printPasteLine(publicSummarizeUrl) {
  const encoded = encodeURIComponent(publicSummarizeUrl);
  const base683 = String(process.env.USER683_KINTONE_683_URL || '').trim().replace(/\/+$/, '');
  const one =
    "window.USER683_CLAUDE_RELAY_URL = '" + publicSummarizeUrl + "'; location.reload();";
  console.log('');
  console.log('========== 683（HTTPS kintone）: コンソール不要（アドレス欄）==========');
  if (base683) {
    const join = base683.indexOf('?') >= 0 ? '&' : '?';
    console.log('次の 1 行をコピーし、ブラウザで開いてください（683 一覧が開き、中継 URL が取り込まれます）:');
    console.log(base683 + join + 'user683_claude_relay=' + encoded);
  } else {
    console.log('683 一覧を開いているタブの「アドレス欄の末尾」に、次の 1 行を貼り付けて Enter してください。');
    console.log('（すでに URL に ? がある場合は、先頭の ? を & に変えてください）');
    console.log('?user683_claude_relay=' + encoded);
  }
  console.log('');
  console.log('========== 従来: コンソール（F12）用の 1 行 ==========');
  console.log(one);
  console.log('================================================================');
  console.log('');
  console.log(
    '※ トンネル URL は第三者も理論上叩けます。機密コーパスを避け、終わったらこのターミナルで Ctrl+C を押して止めてください。',
  );
  console.log('');
}

async function main() {
  const { noSpawn, port } = parseArgs(process.argv);
  let relayChild = null;

  if (!noSpawn) {
    relayChild = spawnClaudeRelayChild();
    relayChild.on('error', (err) => {
      console.error('[user683-claude-relay:public] 中継の起動に失敗しました:', err.message);
      process.exit(1);
    });
    relayChild.on('exit', (code, sig) => {
      if (sig) {
        process.exit(0);
      }
      if (code && code !== 0) {
        console.error('[user683-claude-relay:public] 中継プロセスが終了しました (code=' + code + ')');
        process.exit(code || 1);
      }
      console.error('[user683-claude-relay:public] 中継が終了しました。このウィンドウを閉じるか Ctrl+C で終了してください。');
      process.exit(0);
    });
    await new Promise((r) => setTimeout(r, 2500));
  } else {
    console.log('[user683-claude-relay:public] 中継は起動しません（--no-spawn）。127.0.0.1:' + port + ' を待ちます…');
  }

  const ok = await waitForRelay(port, noSpawn ? 8000 : 60000);
  if (!ok) {
    console.error(
      '[user683-claude-relay:public] 127.0.0.1:' +
        port +
        ' が開いていません（Windows は Test-NetConnection と同じ判定で確認しました）。',
    );
    console.error(
      noSpawn
        ? '別ターミナルで npm run user683:claude-relay を起動してから再実行するか、--port を確認してください。'
        : 'ポート ' +
            port +
            ' が他プロセスで使用中でないか、ファイアウォールが Node をブロックしていないか確認してください。' +
            ' 手動起動なら: npm run user683:claude-relay' +
            (process.platform === 'win32'
              ? '\n診断（PowerShell）: Test-NetConnection -ComputerName 127.0.0.1 -Port ' + port
              : ''),
    );
    if (relayChild && !relayChild.killed) {
      relayChild.kill('SIGTERM');
    }
    process.exit(1);
  }

  let localtunnel;
  try {
    const mod = await import('localtunnel');
    localtunnel = mod.default;
  } catch (e) {
    console.error('[user683-claude-relay:public] localtunnel を読み込めませんでした。リポルートで npm install を実行してください。');
    console.error(String(e && e.message ? e.message : e));
    if (relayChild && !relayChild.killed) {
      relayChild.kill('SIGTERM');
    }
    process.exit(1);
  }

  let tunnel;
  try {
    tunnel = await localtunnel({ port });
  } catch (e) {
    console.error('[user683-claude-relay:public] トンネル開始に失敗しました:', String(e && e.message ? e.message : e));
    if (relayChild && !relayChild.killed) {
      relayChild.kill('SIGTERM');
    }
    process.exit(1);
  }

  const base = String(tunnel.url || '').replace(/\/+$/, '');
  if (!/^https:\/\//i.test(base)) {
    console.error('[user683-claude-relay:public] 想定外のトンネル URL:', tunnel.url);
    tunnel.close();
    if (relayChild && !relayChild.killed) {
      relayChild.kill('SIGTERM');
    }
    process.exit(1);
  }
  const publicSummarizeUrl = base + '/user683/summarize';

  printPasteLine(publicSummarizeUrl);

  const shutdown = () => {
    try {
      tunnel.close();
    } catch {
      /* ignore */
    }
    if (relayChild && !relayChild.killed) {
      try {
        relayChild.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }
  };
  process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
