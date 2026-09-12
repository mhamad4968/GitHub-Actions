/**
 * Kimi MCP は WSL 内で動く。Windows Cursor が C:\... を渡すと ENOENT。
 * ドライブ字句だけ /mnt/<drive>/ に写す。既に /mnt/... なら二重変換しない。
 */
import { existsSync } from "node:fs";

export function shouldConvertWinPathToWsl({
  platform = process.platform,
  env = process.env,
  mntCExists = existsSync("/mnt/c"),
} = {}) {
  if (env.KIMI_FORCE_WSL_PATH === "1") return true;
  if (env.KIMI_FORCE_WSL_PATH === "0") return false;
  return platform === "linux" && mntCExists;
}

export function winToWslPath(input, opts) {
  if (typeof input !== "string" || input === "") return input;
  if (!shouldConvertWinPathToWsl(opts)) return input;

  const mnt = input.match(/^\/mnt\/([A-Za-z])(\/.*)?$/);
  if (mnt) {
    const drive = mnt[1].toLowerCase();
    const rest = mnt[2] || "";
    return `/mnt/${drive}${rest}`;
  }

  const win = input.match(/^([A-Za-z]):[\\/](.*)$/);
  if (win) {
    const drive = win[1].toLowerCase();
    const rest = win[2].replace(/\\/g, "/");
    return `/mnt/${drive}/${rest}`;
  }

  return input;
}

export function rewriteKimiToolArgs(args, opts) {
  if (!args || typeof args !== "object" || Array.isArray(args)) return args;
  const out = { ...args };
  for (const key of ["path", "workFolder", "cwd"]) {
    if (typeof out[key] === "string") out[key] = winToWslPath(out[key], opts);
  }
  return out;
}
