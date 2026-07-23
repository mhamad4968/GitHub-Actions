/**
 * kintone-apps.md ポートフォリオ機械表（| app | BUILD | revision |）から BUILD を読む。
 */
export function parsePortfolioMachineBuild(md, appId) {
  const id = String(appId).trim();
  const re = new RegExp(`^\\|\\s*${id}\\s*\\|\\s*\`([^\`]+)\`\\s*\\|`, 'm');
  const m = md.match(re);
  if (!m) return null;
  const build = m[1].trim();
  if (!build || build === '—' || build === '-') return null;
  return build;
}

export function parsePortfolioDetailBuild(md, appId) {
  const id = String(appId).trim();
  const re = new RegExp(
    `^\\|[^\\n]*?\\*\\*${id}\\*\\*[^\\n]*?\\*\\*BUILD=\`([^\`]+)\``,
    'm',
  );
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

/** 機械表: | app | `BUILD` | **rev** | `fileKey` | */
export function parsePortfolioMachineFileKey(md, appId) {
  const id = String(appId).trim();
  const re = new RegExp(
    `^\\|\\s*${id}\\s*\\|\\s*\`[^\`]+\`\\s*\\|\\s*\\*\\*[^*]+\\*\\*\\s*\\|\\s*\`([^\`]+)\``,
    'm',
  );
  const m = md.match(re);
  if (!m) return null;
  const key = m[1].trim();
  if (!key || key === '—' || key === '-') return null;
  return key;
}

/** 詳細行: fileKey **`…`** */
export function parsePortfolioDetailFileKey(md, appId) {
  const id = String(appId).trim();
  const lineRe = new RegExp(`^\\|[^\\n]*\\*\\*${id}\\*\\*[^\\n]*\\|`, 'm');
  const line = md.match(lineRe)?.[0];
  if (!line) return null;
  const m = line.match(/fileKey\s+\*\*`([^`]+)`\*\*/i);
  return m ? m[1].trim() : null;
}

export function updatePortfolioMachineBuild(md, appId, build, revision) {
  const id = String(appId).trim();
  const re = new RegExp(`^(\\|\\s*${id}\\s*\\|\\s*\`)([^\`]+)(\`\\s*\\|)([^|]*)(\\|)`, 'm');
  if (!re.test(md)) return { md, changed: false };
  const next = md.replace(re, (_m, p1, _old, p3, revPart, p5) => {
    const revCell = revision != null ? ` **${revision}** ` : revPart;
    return `${p1}${build}${p3}${revCell}${p5}`;
  });
  return { md: next, changed: next !== md };
}

/** 詳細行 tail 先頭の rev ** N ** / **** garble を除去 */
function stripDetailRevPrefix(tail) {
  let t = String(tail);
  let changed = true;
  while (changed) {
    changed = false;
    if (/^\s*rev\s*\*\*\s*\d+\s*\*\*/i.test(t)) {
      t = t.replace(/^\s*rev\s*\*\*\s*\d+\s*\*\*\s*/i, ' ');
      changed = true;
      continue;
    }
    if (/^\s*\*+\s*/.test(t)) {
      t = t.replace(/^\s*\*+\s*/, ' ');
      changed = true;
    }
  }
  return t;
}

export function updatePortfolioDetailBuild(md, appId, build, revision) {
  const id = String(appId).trim();
  const lineRe = new RegExp(
    `^(\\|[^\\n]*\\*\\*${id}\\*\\*[^\\n]*?)\\*\\*BUILD=\`[^\`]+\`([^\\n]*\\|)\\s*$`,
    'm',
  );
  if (!lineRe.test(md)) return { md, changed: false };
  const next = md.replace(lineRe, (_m, p1, tail) => {
    const cleanTail = stripDetailRevPrefix(tail);
    const revPart = revision != null ? ` rev **${revision}**` : '';
    return `${p1}**BUILD=\`${build}\`${revPart}${cleanTail}`;
  });
  return { md: next, changed: next !== md };
}
