#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const helperPath = path.join(
  scriptDir,
  "update-mcp-ai-secrets-interactive.ps1",
);
const source = fs.readFileSync(helperPath, "utf8");
const atomicWriterSource = fs.readFileSync(
  path.join(scriptDir, "write-mcp-ai-secrets-atomic.mjs"),
  "utf8",
);

assert.match(source, /^\[CmdletBinding\(\)\]\s*\r?\nparam\(/m);
assert.match(source, /^\[CmdletBinding\(\)\]\s*\r?\nparam\(\)/m);
assert.doesNotMatch(
  source,
  /param\s*\([^)]*(?:MOONSHOT|DEEPSEEK|OPENROUTER|ApiKey|Secret)/is,
);

for (const key of [
  "MOONSHOT_API_KEY",
  "DEEPSEEK_API_KEY",
  "OPENROUTER_API_KEY",
]) {
  assert.match(
    source,
    new RegExp(
      `Read-Host\\s+"Enter new ${key}"\\s+-AsSecureString`,
      "i",
    ),
  );
}

assert.match(source, /SecureStringToBSTR/);
assert.match(source, /ZeroFreeBSTR/);
assert.match(source, /Join-Path\s+\$env:WINDIR\s+"System32\\wsl\.exe"/);
assert.match(source, /RedirectStandardInput\s*=\s*\$true/);
assert.match(source, /StandardInput\.Write\(\$StandardInputText\)/);
assert.match(source, /\$startInfo\.Arguments\s*=\s*\$allArguments\s+-join\s+" "/);
assert.match(atomicWriterSource, /writeFile\(temporary,\s*content/);
assert.match(atomicWriterSource, /chmod\(temporary,\s*mode\)/);
assert.match(atomicWriterSource, /rename\(temporary,\s*target\)/);
assert.match(atomicWriterSource, /content\.fill\(0\)/);
assert.match(source, /Invoke-AtomicWslWrite\s+-Content\s+\$newContent\s+-Mode\s+"600"/);
assert.match(source, /Invoke-NpmVerification\s+"verify:mcp-ai-secret-storage"/);
assert.match(source, /Invoke-NpmVerification\s+"cio:mcp:env"/);
assert.match(
  source,
  /Invoke-AtomicWslWrite\s+-Content\s+\$oldContent\s+-Mode\s+\$oldMode/,
);
assert.match(source, /Rollback completed/);
assert.match(source, /\.Dispose\(\)/);
assert.doesNotMatch(source, /Start-Transcript|Out-File|Add-Content/);

const hostLines = source
  .split(/\r?\n/)
  .filter((line) => /\bWrite-(?:Host|Output|Verbose|Debug|Information)\b/.test(line));
for (const line of hostLines) {
  assert.doesNotMatch(
    line,
    /\$(?:moonshot|deepseek|openrouter|oldContent|newContent|retainedContent|prefix)/i,
  );
}

console.log("[test-update-mcp-ai-secrets-interactive] OK");
