import assert from "node:assert/strict";
import {
  rewriteKimiToolArgs,
  shouldConvertWinPathToWsl,
  winToWslPath,
} from "./win-to-wsl-path.mjs";

const wsl = { platform: "linux", env: {}, mntCExists: true };
const win = { platform: "win32", env: {}, mntCExists: false };

assert.equal(shouldConvertWinPathToWsl(wsl), true);
assert.equal(shouldConvertWinPathToWsl(win), false);
assert.equal(shouldConvertWinPathToWsl({ ...wsl, env: { KIMI_FORCE_WSL_PATH: "0" } }), false);
assert.equal(shouldConvertWinPathToWsl({ ...win, env: { KIMI_FORCE_WSL_PATH: "1" } }), true);

assert.equal(
  winToWslPath(
    "C:\\Users\\mhamada202408224\\kintone-ai-lab\\scripts\\lib\\jikkou-yosan-v2\\overhead-work-types.mjs",
    wsl,
  ),
  "/mnt/c/Users/mhamada202408224/kintone-ai-lab/scripts/lib/jikkou-yosan-v2/overhead-work-types.mjs",
);
assert.equal(
  winToWslPath(
    "C:/Users/mhamada202408224/kintone-ai-lab/customize/jikkou-yosan-v2-app1/desktop.ui.js",
    wsl,
  ),
  "/mnt/c/Users/mhamada202408224/kintone-ai-lab/customize/jikkou-yosan-v2-app1/desktop.ui.js",
);
assert.equal(
  winToWslPath(
    "/mnt/c/Users/mhamada202408224/kintone-ai-lab/scripts/lib/jikkou-yosan-v2/overhead-work-types.mjs",
    wsl,
  ),
  "/mnt/c/Users/mhamada202408224/kintone-ai-lab/scripts/lib/jikkou-yosan-v2/overhead-work-types.mjs",
);
assert.equal(winToWslPath("/mnt/C/Users/x/a.mjs", wsl), "/mnt/c/Users/x/a.mjs");
assert.equal(
  winToWslPath("C:\\Users\\x\\a.mjs", win),
  "C:\\Users\\x\\a.mjs",
);
assert.equal(winToWslPath("relative/file.mjs", wsl), "relative/file.mjs");
assert.equal(winToWslPath("", wsl), "");
assert.equal(winToWslPath(undefined, wsl), undefined);

const rewritten = rewriteKimiToolArgs(
  {
    path: "C:\\Users\\x\\a.mjs",
    workFolder: "C:\\Users\\x",
    focus: "security",
  },
  wsl,
);
assert.equal(rewritten.path, "/mnt/c/Users/x/a.mjs");
assert.equal(rewritten.workFolder, "/mnt/c/Users/x");
assert.equal(rewritten.focus, "security");

console.log("[mcp-kimi-wsl-path] win-to-wsl-path tests OK");
