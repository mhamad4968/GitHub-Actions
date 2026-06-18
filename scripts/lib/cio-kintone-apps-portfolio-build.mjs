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
    `(\\|\\s*\\*\\*[^|]*\\*\\*\\s*\\|\\s*\\*\\*${id}\\*\\*\\s*\\|[^|]*\\|[^|]*\\*\\*BUILD=\`)([^\`]+)(\`[^|]*\\|)`,
    'm',
  );
  const m = md.match(re);
  return m ? m[2].trim() : null;
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
