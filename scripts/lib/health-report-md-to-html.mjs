/**
 * space-health-report.mjs が出力する Markdown のうち、
 * 見出し・箇条書き・GitHub 風テーブルを HTML に変換する（ポータル貼り付け用）。
 */

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {string} href */
function escapeAttr(href) {
  return escapeHtml(href).replace(/'/g, "&#39;");
}

/**
 * `**` と `[](url)` のみリッチ化し、それ以外はエスケープする。
 * @param {string} segment
 */
function escapeOutsideLinks(segment) {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(segment))) {
    out += escapeHtml(segment.slice(last, m.index));
    out += `<a href="${escapeAttr(m[2])}" rel="noopener noreferrer">${escapeHtml(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  out += escapeHtml(segment.slice(last));
  return out;
}

/** @param {string} cell */
function formatTableCell(cell) {
  const parts = cell.trim().split(/\*\*/);
  return parts
    .map((seg, k) => (k % 2 === 1 ? `<strong>${escapeHtml(seg)}</strong>` : escapeOutsideLinks(seg)))
    .join("");
}

/**
 * @param {string[]} tableLines 先頭が | から始まる行の塊
 */
function tableLinesToHtml(tableLines) {
  const rows = [];
  for (const line of tableLines) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    if (/^\|\s*-{3,}/.test(t)) continue;
    const cells = t
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length) rows.push(cells);
  }
  if (rows.length === 0) return `<p>${escapeHtml(tableLines.join("\n"))}</p>`;
  const head = rows[0];
  const body = rows.slice(1);
  const th = head
    .map(
      (c) =>
        `<th style="border:1px solid #e2e8f0;padding:8px 10px;background:#f8fafc;text-align:left;font-size:11px;font-weight:600;color:#334155;letter-spacing:0.02em">${formatTableCell(c)}</th>`,
    )
    .join("");
  const trs = body
    .map((r, ri) => {
      const pad = head.length - r.length;
      const cells = [...r, ...Array(Math.max(0, pad)).fill("—")].slice(0, head.length);
      const bg = ri % 2 === 0 ? "#ffffff" : "#fafbfc";
      return `<tr style="background:${bg}">${cells.map((c) => `<td style="border:1px solid #e2e8f0;padding:8px 10px;font-size:12px;vertical-align:top;color:#334155">${formatTableCell(c)}</td>`).join("")}</tr>`;
    })
    .join("");
  return (
    `<div style="overflow-x:auto;margin:10px 0;border-radius:8px;border:1px solid #e2e8f0;background:#fff">` +
    `<table style="border-collapse:collapse;width:100%;max-width:100%;table-layout:fixed">` +
    `<thead><tr>${th}</tr></thead>` +
    `<tbody>${trs}</tbody>` +
    `</table></div>`
  );
}

/**
 * @param {string} md
 */
export function healthReportMarkdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      blocks.push(
        `<h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;border-left:4px solid #2563eb;padding:4px 0 4px 10px;background:linear-gradient(90deg,#f8fafc 0%,transparent 100%)">${escapeOutsideLinks(line.slice(3))}</h3>`,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        `<h4 style="margin:12px 0 6px;font-size:13px;font-weight:700;color:#1e293b">${escapeOutsideLinks(line.slice(4))}</h4>`,
      );
      i++;
      continue;
    }
    if (line.trim().startsWith("|")) {
      const chunk = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) chunk.push(lines[i++]);
      blocks.push(tableLinesToHtml(chunk));
      continue;
    }
    if (line.startsWith("- ")) {
      const raw = line.slice(2);
      const parts = raw.split(/\*\*/);
      const inner = parts
        .map((seg, k) => (k % 2 === 1 ? `<strong>${escapeHtml(seg)}</strong>` : escapeOutsideLinks(seg)))
        .join("");
      blocks.push(`<p style="margin:5px 0;font-size:13px;color:#334155">${inner}</p>`);
      i++;
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    blocks.push(`<p style="margin:5px 0;font-size:13px">${escapeOutsideLinks(line)}</p>`);
    i++;
  }
  return `<div class="jbis-health-md" style="font-size:13px;line-height:1.55;color:#334155">${blocks.join("\n")}</div>`;
}
