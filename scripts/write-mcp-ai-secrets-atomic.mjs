#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { chmod, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const target =
  "/home/mhamada202408224/.config/cursor-mcp/ai-secrets.env";
const modeText = process.argv[2] ?? "600";

if (!/^[0-7]{3,4}$/.test(modeText)) {
  throw new Error("Invalid secret-file mode.");
}

const mode = Number.parseInt(modeText, 8);
const directory = path.dirname(target);
const temporary = path.join(
  directory,
  `.ai-secrets.${process.pid}.${randomUUID()}`,
);

const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(Buffer.from(chunk));
}
const content = Buffer.concat(chunks);

await mkdir(directory, { recursive: true, mode: 0o700 });
try {
  await writeFile(temporary, content, { flag: "wx", mode: 0o600 });
  await chmod(temporary, mode);
  await rename(temporary, target);
} finally {
  await rm(temporary, { force: true });
  content.fill(0);
}
