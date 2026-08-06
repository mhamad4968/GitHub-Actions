#!/usr/bin/env node
/**
 * localtunnel@2.0.2 ships a nested axios@1.13.x that npm overrides cannot always
 * replace. Remove the nested copy so resolution uses the hoisted axios@1.19.0
 * from package.json overrides (user683 public tunnel only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nestedPkg = path.join(root, 'node_modules', 'localtunnel', 'node_modules', 'axios', 'package.json');

if (!fs.existsSync(nestedPkg)) {
  process.exit(0);
}

let version = '';
try {
  version = JSON.parse(fs.readFileSync(nestedPkg, 'utf8')).version || '';
} catch {
  process.exit(0);
}

const parts = version.split('.').map(Number);
const major = parts[0] || 0;
const minor = parts[1] || 0;
// axios < 1.18 still in GHSA-42h9-826w-cgv3 range
const vulnerable = major === 1 && minor < 18;

if (!vulnerable) {
  process.exit(0);
}

const nestedDir = path.dirname(nestedPkg);
fs.rmSync(nestedDir, { recursive: true, force: true });
console.log(`[patch-localtunnel-axios-dedupe] removed nested axios@${version} → use hoisted override`);
