/**
 * 資料作成 MCP — 経営会議・情報セキュリティレポート月次
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MCP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_WORK_DIR = process.env.SHIRYO_WORK_DIR || 'C:\\tmp\\資料作成';
const TEMPLATE_NAME = '_template_完成スタイル.docx';
const PYTHON_CLI = path.join(MCP_ROOT, 'python', 'report_cli.py');

export const QUALITY_CHECKLIST = [
  { id: 'definition_box', label: '「〇〇とは」丸角図形', patterns: [/とは[：:]/] },
  { id: 'stage_table', label: '手口の段階×狙い表', patterns: [/段階・項目|主な手口・特徴|狙い/] },
  { id: 'lesson_table', label: '当社へ置き換えると表', patterns: [/当社へ置き換えると|当社への示唆/] },
  { id: 'please_section', label: '皆様にお願いしたいこと', patterns: [/皆様にお願いしたいこと|お願いしたいこと/] },
  { id: 'closing', label: '周知締め文', patterns: [/十分な理解と対処が必要ですので.*周知をお願いします/] },
  { id: 'empty_detection', label: '検知状況は空欄または未記入', patterns: [/感染被疑事象はなし|感染被疑事象は\s*$/], inverse: false },
  { id: 'section2_heading', label: '２.検知状況セクション', patterns: [/２\.２０２６年.+の情報セキュリティ検知状況/] },
];

export const IMAGE_SOURCE_HINTS = [
  { name: '警察庁', url: 'https://www.npa.go.jp/', use: 'サイバー犯罪・詐欺手口' },
  { name: 'JC3', url: 'https://www.jc3.or.jp/', use: '注意喚起・脅威具体例' },
  { name: 'IPA', url: 'https://www.ipa.go.jp/', use: '10大脅威・統計' },
  { name: '総務省', url: 'https://www.soumu.go.jp/', use: '電気通信・漏えい報告' },
  { name: 'NISC', url: 'https://www.nisc.go.jp/', use: '政府・重要インフラ' },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function runPython(subcmd, extraArgs = []) {
  const py = process.env.SHIRYO_PYTHON || 'python';
  const args = [PYTHON_CLI, subcmd, ...extraArgs];
  const r = spawnSync(py, args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `python exit ${r.status}`);
  }
  const line = (r.stdout || '').trim().split('\n').pop();
  return JSON.parse(line);
}

export function getConfig() {
  const workflowPath = path.join(DEFAULT_WORK_DIR, '00-運用フロー.md');
  let workflow = '';
  if (fs.existsSync(workflowPath)) {
    workflow = fs.readFileSync(workflowPath, 'utf-8');
  }
  return {
    workDir: DEFAULT_WORK_DIR,
    templatePath: path.join(DEFAULT_WORK_DIR, TEMPLATE_NAME),
    workflowPath,
    workflow,
    checklist: QUALITY_CHECKLIST.map((c) => c.label),
    imageSourceHints: IMAGE_SOURCE_HINTS,
    mcpRoot: MCP_ROOT,
  };
}

export function listFiles(workDir = DEFAULT_WORK_DIR) {
  ensureDir(workDir);
  const entries = fs.readdirSync(workDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => {
      const full = path.join(workDir, e.name);
      const st = fs.statSync(full);
      return { name: e.name, size: st.size, modified: st.mtime.toISOString() };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

export function buildFilename({ meetingMonth, reportMonth, reportYear = 2026, meetingYear = 2026 }) {
  const mm = String(reportMonth).padStart(2, '0');
  const name = `【${meetingYear}年${meetingMonth}月度経営会議資料】${reportYear}年${mm}月情報セキュリティレポート.docx`;
  return { filename: name, fullPath: path.join(DEFAULT_WORK_DIR, name) };
}

export function copyTemplate({ meetingMonth, reportMonth, reportYear, meetingYear, meetingDate }) {
  const templatePath = path.join(DEFAULT_WORK_DIR, TEMPLATE_NAME);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  const { filename, fullPath } = buildFilename({ meetingMonth, reportMonth, reportYear, meetingYear });
  ensureDir(DEFAULT_WORK_DIR);
  fs.copyFileSync(templatePath, fullPath);
  const headerResult = runPython('set_header', [
    '--docx', fullPath,
    '--report-month', String(reportMonth),
    '--meeting-date', meetingDate || '',
  ]);
  const emptyResult = runPython('prepare_empty_sections', [
    '--docx', fullPath,
    '--report-year', String(reportYear),
    '--report-month', String(reportMonth),
  ]);
  return { filename, fullPath, headerResult, emptyResult };
}

export function insertDefinitionBox({ docxPath, header, body, paragraphIndex = 8 }) {
  const assetsDir = path.join(MCP_ROOT, 'assets');
  return runPython('insert_definition_box', [
    '--docx', docxPath,
    '--header', header,
    '--body', body,
    '--paragraph-index', String(paragraphIndex),
    '--assets-dir', assetsDir,
  ]);
}

export function extractDocumentText(docxPath) {
  return runPython('extract_text', ['--docx', docxPath]);
}

export function reviewChecklist(docxPath) {
  const { text } = extractDocumentText(docxPath);
  const fixed = QUALITY_CHECKLIST.map((item) => {
    const matched = item.patterns.some((re) => re.test(text));
    return { id: item.id, label: item.label, ok: matched, matched };
  });
  const score = fixed.filter((r) => r.ok).length;
  return { docxPath, score, total: fixed.length, items: fixed, textPreview: text.slice(0, 2000) };
}

export function saveImageCandidates({ meetingMonth, topics, candidates }) {
  const lines = [
    `# 画像候補_${meetingMonth}月度経営会議`,
    '',
    `作成: ${new Date().toISOString().slice(0, 10)}`,
    '',
  ];
  for (const topic of topics || []) {
    lines.push(`## ${topic.title || topic}`, '');
    lines.push('| # | 用途 | URL | 出典 | 転載メモ |');
    lines.push('|---|------|-----|------|----------|');
    const rows = (candidates && candidates[topic.id || topic.title]) || [];
    if (rows.length === 0) {
      lines.push('| 1 | | | | |');
    } else {
      rows.forEach((row, i) => {
        lines.push(`| ${i + 1} | ${row.use || ''} | ${row.url || ''} | ${row.source || ''} | ${row.note || ''} |`);
      });
    }
    lines.push('');
  }
  lines.push('## 公式探索の起点', '');
  for (const h of IMAGE_SOURCE_HINTS) {
    lines.push(`- **${h.name}**: ${h.url} — ${h.use}`);
  }
  const outPath = path.join(DEFAULT_WORK_DIR, `画像候補_${meetingMonth}月度.md`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  return { path: outPath, lines: lines.length };
}

export function promoteToTemplate(docxPath) {
  const templatePath = path.join(DEFAULT_WORK_DIR, TEMPLATE_NAME);
  fs.copyFileSync(docxPath, templatePath);
  // Refresh embedded shape asset from new template
  const assetsDir = path.join(MCP_ROOT, 'assets');
  ensureDir(assetsDir);
  try {
    const py = `
import zipfile
from xml.etree import ElementTree as ET
path = r"${docxPath.replace(/\\/g, '\\\\')}"
out = r"${path.join(assetsDir, 'roundrect-paragraph.xml').replace(/\\/g, '\\\\')}"
z = zipfile.ZipFile(path)
root = ET.fromstring(z.read('word/document.xml'))
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
for p in root.find(W+'body').findall(W+'p'):
    raw = ET.tostring(p, encoding='unicode')
    if 'roundrect' in raw or 'roundRect' in raw:
        open(out,'w',encoding='utf-8').write(raw)
        break
`;
    spawnSync(process.env.SHIRYO_PYTHON || 'python', ['-c', py], { encoding: 'utf-8' });
  } catch {
    /* optional */
  }
  return { templatePath, from: docxPath };
}

export function getImageSearchHints({ theme, keywords = [] }) {
  const kw = [theme, ...keywords].filter(Boolean).join(' ');
  const queries = [
    `${kw} site:jc3.or.jp`,
    `${kw} site:npa.go.jp`,
    `${kw} site:ipa.go.jp 注意喚起`,
    `${kw} filetype:pdf 警察庁 OR JC3`,
  ];
  return { theme, queries, officialSources: IMAGE_SOURCE_HINTS };
}

export function saveReviewNotes({ meetingMonth, notes, items }) {
  const outPath = path.join(DEFAULT_WORK_DIR, `_review_${meetingMonth}月度.json`);
  const payload = {
    meetingMonth,
    reviewedAt: new Date().toISOString(),
    notes: notes || '',
    items: items || [],
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  return { path: outPath };
}
