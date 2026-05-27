/**
 * morning-prep-rag.mjs — 朝ブリーフィング用 RAG 更新（クロスプラットフォーム・短時間完走）
 *
 * 問題（TSB-037）: Windows ネイティブ経路で bash+npx+docs/ 全件 ingest が WSL 越しに 15 分超 →
 * Cursor エージェントのシェル待機上限で強制終了されがち。
 *
 * 方針:
 * - 常に node スクリプト（rag-mirror-canonical-docs / rag-ingest-path）を使用
 * - Windows: extra-docs のみ（憲法ミラー。通常 1〜3 分）
 * - Linux/WSL cron: extra-docs + docs/（フル。タイムアウト長め）
 * - フル docs/ を Windows で走らせるときのみ MORNING_PREP_RAG_DOCS=1
 */
import { IS_WIN } from './repo-node-env.mjs';

/**
 * @param {(label: string, cmd: string, opts?: { timeoutMs?: number }) => { ok: boolean; stdout: string; stderr: string; exit: number }} runCmd
 * @param {(msg: string) => void} log
 */
export function runMorningPrepRag(runCmd, log) {
  const fullDocs =
    process.env.MORNING_PREP_RAG_DOCS === '1' ||
    process.env.MORNING_PREP_RAG_DOCS === 'true' ||
    !IS_WIN;

  const runIngest =
    process.env.MORNING_PREP_RAG_INGEST === '1' ||
    process.env.MORNING_PREP_RAG_INGEST === 'true' ||
    !IS_WIN;

  log(
    `rag mode: mirror=always ingest=${runIngest ? 'yes' : 'skip(win-default)'} docs/=${fullDocs ? 'yes' : 'skip'}`,
  );

  const rMirror = runCmd('rag-mirror', 'node scripts/rag-mirror-canonical-docs.mjs', {
    timeoutMs: 90_000,
  });

  let rExtra = {
    ok: true,
    stdout: IS_WIN
      ? '(Windows 既定: npx ingest スキップ。ミラーのみ。ingest は WSL cron 06:00 または MORNING_PREP_RAG_INGEST=1)'
      : '(ingest skipped)',
    stderr: '',
    exit: 0,
  };

  if (runIngest) {
    rExtra = runCmd('rag-ingest-extra', 'node scripts/rag-ingest-path.mjs .rag/extra-docs/', {
      timeoutMs: 240_000,
    });
  }

  let rDocs = {
    ok: true,
    stdout: IS_WIN
      ? '(Windows 既定: docs/ 全件 ingest はスキップ。WSL cron 06:00 または MORNING_PREP_RAG_DOCS=1)'
      : '(docs/ skipped)',
    stderr: '',
    exit: 0,
  };

  if (fullDocs) {
    rDocs = runCmd('rag-ingest-docs', 'node scripts/rag-ingest-path.mjs docs/', {
      timeoutMs: IS_WIN ? 420_000 : 900_000,
    });
  }

  const ragOutput = [rMirror.stdout, rMirror.stderr, rExtra.stdout, rExtra.stderr, rDocs.stdout, rDocs.stderr]
    .filter(Boolean)
    .join('\n');
  const ragHasInnerError = /\b(?:Error|ERR_[A-Z_]+|Exception|Traceback)\b/.test(ragOutput);

  const ok = rMirror.ok && rExtra.ok && rDocs.ok && !ragHasInnerError;

  return {
    ok,
    ragHasInnerError,
    rMirror,
    rExtra,
    rDocs,
    fullDocs,
    ragOutput,
  };
}
