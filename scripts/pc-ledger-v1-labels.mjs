/**
 * 新・PC台帳ver.1 — フィールド code → kintone 画面表示ラベル（短文）
 * 正本（意味・制約）: docs/plans/2026-04-21-new-pc-ledger-spec.md §4.2
 * 表示ラベル（短文）の正本: scripts/data/pc-ledger-v1-ui-display-labels.json
 * 整合検証: npm run pc-ledger:verify-labels-spec
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DISPLAY_PATH = path.join(__dirname, 'data', 'pc-ledger-v1-ui-display-labels.json');

const raw = JSON.parse(fs.readFileSync(DISPLAY_PATH, 'utf8'));
export const PC_LEDGER_V1_LABELS = raw.fields;
