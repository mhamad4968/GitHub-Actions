#!/usr/bin/env node
/** CLI: 壁時計を完全停止（clear + watch + web）— sessionEnd hook と同じ */
import { stopAllClock } from './lib/session-clock-process.mjs';

const r = stopAllClock();
console.log(
  `[session-clock:stop] clearOk=${r.clearOk} watchStopped=${r.watch} webStopped=${r.web}`,
);
if (!r.clearOk) process.exit(2);
