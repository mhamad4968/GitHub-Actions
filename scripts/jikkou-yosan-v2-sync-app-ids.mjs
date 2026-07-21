#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const statePath = path.join(
  root,
  "scripts/data/jikkou-yosan-v2-app-ids.json",
);
const state = JSON.parse(readFileSync(statePath, "utf8"));
// Tests may redirect the sync targets (e.g. to a temp copy) so they never
// mutate the committed customize files. customize/736 stays forbidden.
const targetDirectory = process.env.JIKKOU_YOSAN_V2_SYNC_DIR
  ? path.resolve(root, process.env.JIKKOU_YOSAN_V2_SYNC_DIR)
  : path.join(root, "customize/jikkou-yosan-v2-app1");
const protectedDirectory = path.resolve(root, "customize/736");
if (
  targetDirectory === protectedDirectory ||
  targetDirectory.startsWith(`${protectedDirectory}${path.sep}`)
) {
  throw new Error("Ver.02 sync must never write customize/736");
}
const targets = [
  path.join(targetDirectory, "desktop.ui.js"),
  path.join(targetDirectory, "desktop.js"),
];

function appIdLiteral(appKey) {
  const value = state?.apps?.[appKey]?.appId;
  if (value === null) return "null";
  const appId = Number(value);
  if (!Number.isSafeInteger(appId) || appId <= 0) {
    throw new RangeError(`${appKey}.appId must be a positive integer or null`);
  }
  if (appId === 735 || appId === 736) {
    throw new Error(`${appKey}.appId must not be 735 or 736`);
  }
  return String(appId);
}

function replaceMarker(source, marker, literal, targetPath) {
  const pattern = new RegExp(`(/\\* @JY_V2_${marker} \\*/\\s*)(?:null|\\d+)`, "g");
  const matches = source.match(pattern) || [];
  if (matches.length !== 1) {
    throw new Error(
      `${path.relative(root, targetPath)}: expected one ${marker} marker, found ${matches.length}`,
    );
  }
  return source.replace(pattern, `$1${literal}`);
}

for (const targetPath of targets) {
  if (!existsSync(targetPath)) continue;
  const original = readFileSync(targetPath, "utf8");
  let source = original;
  source = replaceMarker(source, "APP1", appIdLiteral("app1"), targetPath);
  source = replaceMarker(source, "APP2", appIdLiteral("app2"), targetPath);
  source = replaceMarker(source, "APP3", appIdLiteral("app3"), targetPath);
  if (source === original) {
    console.log(`Unchanged ${path.relative(root, targetPath)}`);
    continue;
  }
  writeFileSync(targetPath, source, "utf8");
  console.log(`Synced ${path.relative(root, targetPath)}`);
}
