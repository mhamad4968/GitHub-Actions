#!/usr/bin/env node
/**
 * install-git-hooks.mjs — git-hooks/ → .git/hooks/ へコピー（Windows でも symlink 不要）
 *
 * 使い方: node scripts/install-git-hooks.mjs
 * アンインストール: node scripts/install-git-hooks.mjs --uninstall
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'git-hooks');
const DST = path.join(ROOT, '.git', 'hooks');
const UNINSTALL = process.argv.includes('--uninstall');

if (!fs.existsSync(path.join(ROOT, '.git'))) {
  console.error('❌ .git が見つかりません（リポジトリのルートで実行してください）');
  process.exit(1);
}

if (!fs.existsSync(SRC)) {
  console.error('❌ git-hooks/ が見つかりません');
  process.exit(1);
}

fs.mkdirSync(DST, { recursive: true });

const hooks = fs.readdirSync(SRC).filter((n) => !n.startsWith('.'));

if (UNINSTALL) {
  let n = 0;
  for (const name of hooks) {
    const target = path.join(DST, name);
    if (!fs.existsSync(target)) continue;
    const srcPath = path.join(SRC, name);
    let remove = false;
    if (fs.lstatSync(target).isSymbolicLink()) {
      remove = true;
    } else {
      try {
        const a = fs.readFileSync(srcPath);
        const b = fs.readFileSync(target);
        if (name === 'post-commit') {
          // 旧 bash 版 or 新 sh 版のいずれか一致なら削除
          const bstr = b.toString('utf8');
          remove =
            b.equals(a) ||
            bstr.includes('git-hook-post-commit.mjs') ||
            bstr.includes('verify-breaking-deletions.mjs');
        } else if (b.equals(a)) {
          remove = true;
        }
      } catch {
        remove = false;
      }
    }
    if (remove) {
      fs.unlinkSync(target);
      console.log('  ✅ 削除', name);
      n++;
    }
  }
  console.log(`\n✅ アンインストール完了 (${n} 件)`);
  process.exit(0);
}

console.log('📦 git hooks インストール（コピー方式）...\n');
let installed = 0;
for (const name of hooks) {
  const from = path.join(SRC, name);
  const to = path.join(DST, name);
  if (fs.existsSync(to)) {
    try {
      fs.rmSync(to, { force: true });
    } catch (e) {
      try {
        fs.renameSync(to, `${to}.bak.${Date.now()}`);
        console.log(`  ⚠️  ${name} を .bak に退避 (${e.message})`);
      } catch (e2) {
        console.error(`  ❌ ${name}: 既存 hook を置換できません (${e2.message}) — .git/hooks/${name} を手動削除して再実行`);
        process.exit(1);
      }
    }
  }
  fs.copyFileSync(from, to);
  try {
    fs.chmodSync(to, 0o755);
  } catch {
    /* Windows は無視 */
  }
  console.log(`  ✅ ${name} → ${to}`);
  installed++;
}
console.log(`\n✅ インストール完了 (${installed} 件)`);
console.log('\n動作確認: 任意の変更を commit すると post-commit が走る（ログ: logs/git-hooks/post-commit.log）\n');
