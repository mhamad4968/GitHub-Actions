#!/usr/bin/env node
/**
 * Desktop に壁時計 START/STOP bat + VBS（ウィンドウ非表示）を配置
 *   npm run session:clock:install-desktop-bat
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoForBat = root.replace(/\//g, '\\');

function desktopDir() {
  const env = process.env.SESSION_CLOCK_DESKTOP_DIR;
  if (env) return path.resolve(env);
  return path.join(os.homedir(), 'Desktop');
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[install-session-clock-desktop-bat] OK ${filePath}`);
}

const dest = desktopDir();
const startVbs = path.join(dest, '壁時計_START_hidden.vbs');
const stopVbs = path.join(dest, '壁時計_STOP_hidden.vbs');
const startBat = path.join(dest, '壁時計_START.bat');
const stopBat = path.join(dest, '壁時計_STOP.bat');

const nodeExe = process.execPath.replace(/\//g, '\\');
const launchScript = path.join(root, 'scripts', 'session-clock-desktop-launch.mjs').replace(
  /\//g,
  '\\',
);

write(
  startVbs,
  [
    'Set sh = CreateObject("WScript.Shell")',
    `sh.CurrentDirectory = "${repoForBat}"`,
    'rem 第3引数 True = node 完了まで待つ（WEB 起動・ブラウザ表示後に bat へ戻る）',
    `sh.Run """${nodeExe}"" ""${launchScript}""", 0, True`,
    '',
  ].join('\r\n'),
);

write(
  stopVbs,
  [
    'Set sh = CreateObject("WScript.Shell")',
    `sh.CurrentDirectory = "${repoForBat}"`,
    `sh.Run """${nodeExe}"" ""${launchScript}"" --stop", 0, False`,
    '',
  ].join('\r\n'),
);

write(
  startBat,
  [
    '@echo off',
    'chcp 65001 >nul',
    'title 壁時計 START',
    'echo.',
    'echo  ========================================',
    'echo   壁時計 START（WEB が開くまでお待ちください）',
    'echo  ========================================',
    'echo.',
    `wscript.exe //nologo "%~dp0壁時計_START_hidden.vbs"`,
    'set ERR=%ERRORLEVEL%',
    'if %ERR% NEQ 0 (',
    '  echo.',
    '  echo  [失敗] 壁時計の起動に失敗しました code=%ERR%',
    '  echo  ログ: kintone-ai-lab\\logs\\session-clock-desktop-launch.log',
    '  pause',
    '  exit /b %ERR%',
    ')',
    'echo.',
    'echo  [完了] 壁時計とブラウザの準備ができました。',
    'timeout /t 3 /nobreak >nul',
    '',
  ].join('\r\n'),
);

write(
  stopBat,
  [
    '@echo off',
    'rem 壁時計 — 手動停止',
    `wscript.exe //nologo "%~dp0壁時計_STOP_hidden.vbs"`,
    'if errorlevel 1 exit /b 1',
    'echo 壁時計を停止しました。',
    'timeout /t 3 /nobreak >nul',
    '',
  ].join('\r\n'),
);

console.log(
  '[install-session-clock-desktop-bat] 運用: Cursor 起動後に 壁時計_START.bat をダブルクリック',
);
console.log(`[install-session-clock-desktop-bat] mode: ${path.join(root, '.cio', 'session-clock-mode.json')}`);
