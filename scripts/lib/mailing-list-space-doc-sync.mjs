/**
 * R-ML-03 — メーリングリスト Space 移設後の doc 正本を一括 patch（doc 漏れ防止）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT_REL_PATHS = {
  closures: 'data/cio-project-closures.json',
  spec: 'docs/plans/2026-06-29-mailing-list-kintone-spec.md',
  completion: 'docs/reports/2026-06-29-mailing-list-completion.md',
  kintoneApps: 'kintone-apps.md',
};

function replaceAll(text, pairs) {
  let out = text;
  let changed = false;
  for (const [from, to] of pairs) {
    if (out.includes(from)) {
      out = out.split(from).join(to);
      changed = true;
    }
  }
  return { text: out, changed };
}

/**
 * @param {string} root
 * @param {{ spaceId: number, threadId: number, dbAppId?: number, dashAppId?: number }} opts
 * @returns {{ changed: string[], skipped: string[] }}
 */
export function syncMailingListSpaceDocs(root, { spaceId, threadId, dbAppId = 750, dashAppId = 751 }) {
  const changed = [];
  const skipped = [];
  const spaceLabel = `Space ${spaceId}`;
  const threadLabel = `thread ${threadId}`;
  const spaceUrl = `https://jbis-kintone.cybozu.com/k/#/space/${spaceId}`;

  const closuresPath = path.join(root, ROOT_REL_PATHS.closures);
  if (fs.existsSync(closuresPath)) {
    const raw = fs.readFileSync(closuresPath, 'utf8');
    const j = JSON.parse(raw);
    const entry = (j.closures || []).find((c) => c.id === 'mailing-list');
    if (entry) {
      let touched = false;
      const wantSection = `${spaceLabel} — ${dbAppId}–${dashAppId}`;
      if (entry.kintoneAppsSection !== wantSection) {
        entry.kintoneAppsSection = wantSection;
        touched = true;
      }
      const noteNeedle = 'Space 21 移設+ACL';
      if (!String(entry.note || '').includes(noteNeedle)) {
        entry.note = `${String(entry.note || '').replace(/\s*$/, '')} ${spaceLabel} 移設+ACL（${new Date().toISOString().slice(0, 10)} script sync）`.trim();
        touched = true;
      }
      if (touched) {
        fs.writeFileSync(closuresPath, JSON.stringify(j, null, 2) + '\n', 'utf8');
        changed.push(ROOT_REL_PATHS.closures);
      } else skipped.push(ROOT_REL_PATHS.closures);
    }
  }

  const specPath = path.join(root, ROOT_REL_PATHS.spec);
  if (fs.existsSync(specPath)) {
    let text = fs.readFileSync(specPath, 'utf8');
    const pairs = [
      ['Space 48', spaceLabel],
      ['thread 52', threadLabel],
      ['#/space/48', `#/space/${spaceId}`],
    ];
    if (!text.includes(spaceUrl) && text.includes('jbis-kintone.cybozu.com/k/#/space/')) {
      pairs.push(['jbis-kintone.cybozu.com/k/#/space/48', `jbis-kintone.cybozu.com/k/#/space/${spaceId}`]);
    }
    const r = replaceAll(text, pairs);
    if (r.changed) {
      fs.writeFileSync(specPath, r.text, 'utf8');
      changed.push(ROOT_REL_PATHS.spec);
    } else skipped.push(ROOT_REL_PATHS.spec);
  }

  const completionPath = path.join(root, ROOT_REL_PATHS.completion);
  if (fs.existsSync(completionPath)) {
    let text = fs.readFileSync(completionPath, 'utf8');
    const r = replaceAll(text, [
      ['Space 48 / thread 52', `${spaceLabel} / ${threadLabel}`],
      ['Space 48', spaceLabel],
      ['thread 52', threadLabel],
    ]);
    if (r.changed) {
      fs.writeFileSync(completionPath, r.text, 'utf8');
      changed.push(ROOT_REL_PATHS.completion);
    } else skipped.push(ROOT_REL_PATHS.completion);
  }

  const appsPath = path.join(root, ROOT_REL_PATHS.kintoneApps);
  if (fs.existsSync(appsPath)) {
    let text = fs.readFileSync(appsPath, 'utf8');
    const r = replaceAll(text, [
      ['**Space 48 / thread 52**', `**${spaceLabel} / ${threadLabel}**`],
      ['Space 48 / thread 52', `${spaceLabel} / ${threadLabel}`],
    ]);
    if (r.changed) {
      fs.writeFileSync(appsPath, r.text, 'utf8');
      changed.push(ROOT_REL_PATHS.kintoneApps);
    } else skipped.push(ROOT_REL_PATHS.kintoneApps);
  }

  return { changed, skipped };
}
