/**
 * closed-v1 移行元 Excel アーカイブ（C:\tmp 作業フォルダ廃止後の正本）。
 * データ正本は kintone。再 import / verify 用の控えのみ。
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ARCHIVE_DIR = path.join(__dirname, '..', 'data', 'archive', 'closed-v1-migration-sources');

export function archiveXlsx(filename) {
  return path.join(ARCHIVE_DIR, filename);
}
