#!/usr/bin/env node
/**
 * git-history-mcp — constitution / commit 4-element context (§50-3-11 第12層)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpServer } from '../lib/mcp-stdio.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function git(args, opts = {}) {
  const r = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || 'git failed').trim());
  }
  return (r.stdout || '').trim();
}

function parseFourElements(body) {
  const keys = ['前提', '手順', '禁止', 'exit'];
  const out = {};
  for (const k of keys) {
    const re = new RegExp(`^${k}[:：]\\s*(.+)$`, 'm');
    const m = body.match(re);
    out[k] = m ? m[1].trim() : null;
  }
  return out;
}

const tools = [
  {
    name: 'search_git_log',
    description: 'Search git log (grep, since, path, maxCount)',
    inputSchema: {
      type: 'object',
      properties: {
        grep: { type: 'string' },
        since: { type: 'string', description: 'e.g. 2026-06-01' },
        path: { type: 'string' },
        maxCount: { type: 'number' },
      },
    },
  },
  {
    name: 'get_commit_detail',
    description: 'Get full commit message and changed files',
    inputSchema: {
      type: 'object',
      properties: { hash: { type: 'string' } },
      required: ['hash'],
    },
  },
  {
    name: 'analyze_commit_four_elements',
    description: 'Parse Kimi 4-element structure (前提/手順/禁止/exit) from commit body',
    inputSchema: {
      type: 'object',
      properties: { hash: { type: 'string' } },
      required: ['hash'],
    },
  },
  {
    name: 'search_constitution_layers',
    description: 'Find AGENTS.md commits mentioning 第N層 or §50-3-11',
    inputSchema: {
      type: 'object',
      properties: {
        layer: { type: 'string', description: 'e.g. 11 or 12' },
        maxCount: { type: 'number' },
      },
    },
  },
  {
    name: 'search_r19_r20_ritual',
    description: 'Find commits related to R19/R20/session-close-git/cio:session:close-git',
    inputSchema: {
      type: 'object',
      properties: { maxCount: { type: 'number' } },
    },
  },
];

const handlers = {
  search_git_log({ grep, since, path: filePath, maxCount = 30 }) {
    const args = ['log', '--oneline', `--max-count=${Math.min(maxCount || 30, 200)}`];
    if (since) args.push(`--since=${since}`);
    if (grep) args.push(`--grep=${grep}`);
    if (filePath) args.push('--', filePath);
    return git(args).split(/\r?\n/).filter(Boolean);
  },
  get_commit_detail({ hash }) {
    const subject = git(['log', '-1', '--format=%s', hash]);
    const body = git(['log', '-1', '--format=%b', hash]);
    const files = git(['show', '--name-only', '--format=', hash]).split(/\r?\n/).filter(Boolean);
    return { hash, subject, body, files };
  },
  analyze_commit_four_elements({ hash }) {
    const body = git(['log', '-1', '--format=%b', hash]);
    return { hash, fourElements: parseFourElements(body), rawBody: body };
  },
  search_constitution_layers({ layer, maxCount = 20 }) {
    const pattern = layer ? `第${layer}層` : '§50-3-11';
    return git([
      'log',
      '--oneline',
      `--max-count=${Math.min(maxCount || 20, 100)}`,
      `--grep=${pattern}`,
      '--',
      'AGENTS.md',
    ])
      .split(/\r?\n/)
      .filter(Boolean);
  },
  search_r19_r20_ritual({ maxCount = 30 }) {
    const patterns = ['R19', 'R20', 'session:close-git', 'cio:session:close-git'];
    const out = {};
    for (const p of patterns) {
      out[p] = git([
        'log',
        '--oneline',
        `--max-count=${Math.min(maxCount || 30, 100)}`,
        `--grep=${p}`,
      ])
        .split(/\r?\n/)
        .filter(Boolean);
    }
    return out;
  },
};

createMcpServer({
  name: 'git-history-mcp',
  version: '1.0.0',
  tools,
  handlers,
});
