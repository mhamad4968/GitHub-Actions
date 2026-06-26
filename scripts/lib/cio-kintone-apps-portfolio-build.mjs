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
    `^\\|[^\\n]*\\*\\*${id}\\*\\*[^\\n]*\\*\\*BUILD=\`([^\`]+)\``,
    'm',
  );
  const m = md.match(re);
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

export function updatePortfolioDetailBuild(md, appId, build, revision) {
  const id = String(appId).trim();
  const lineRe = new RegExp(
    `^(\\|[^\\n]*\\*\\*${id}\\*\\*[^\\n]*)\\*\\*BUILD=\`([^\`]+)\`(\\s*rev\\s*\\*\\*)([^*]+)(\\*\\*[^\\n]*\\|)\\s*$`,
    'm',
  );
  if (lineRe.test(md)) {
    const next = md.replace(lineRe, (_m, p1, _oldBuild, p3, _oldRev, p5) => {
      const revCell = revision != null ? ` ${revision} ` : _oldRev;
      return `${p1}**BUILD=\`${build}\`${p3}${revCell}${p5}`;
    });
    return { md: next, changed: next !== md };
  }
  const buildOnly = new RegExp(
    `^(\\|[^\\n]*\\*\\*${id}\\*\\*[^\\n]*)\\*\\*BUILD=\`([^\`]+)\`([^\\n]*\\|)\\s*$`,
    'm',
  );
  if (!buildOnly.test(md)) return { md, changed: false };
  const next = md.replace(buildOnly, (_m, p1, _old, tail) => {
    const revSuffix = revision != null ? ` rev **${revision}**` : '';
    return `${p1}**BUILD=\`${build}\`${revSuffix}${tail}`;
  });
  return { md: next, changed: next !== md };
}
