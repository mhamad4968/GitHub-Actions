#!/usr/bin/env node
/**
 * 壁時計を手動で確実に起動（hook 未発火・watch 停止時のフォールバック）
 *   npm run session:clock:ensure
 */
import {
  readWebUrl,
  repoRoot,
  spawnWatch,
  spawnWebServer,
  stopWatchAndWeb,
} from './lib/session-clock-process.mjs';
import { runNodeScriptSync } from './lib/win-hidden-spawn.mjs';

function main() {
  const cleaned = stopWatchAndWeb();
  const set = runNodeScriptSync(repoRoot, 'scripts/session-clock.mjs', ['set']);
  const web = spawnWebServer();
  const watch = spawnWatch();
  const url = web.url || readWebUrl();

  const ok = set.status === 0;
  console.log('[session:clock:ensure] set:', ok ? 'OK' : `NG exit=${set.status}`);
  console.log('[session:clock:ensure] watch:', watch.message, watch.pid ? `pid=${watch.pid}` : '');
  console.log('[session:clock:ensure] web:', web.message, url ? url : '(url pending)');
  if (cleaned.watch || cleaned.web) {
    console.log('[session:clock:ensure] cleaned orphan:', cleaned);
  }
  process.exit(ok ? 0 : 1);
}

main();
