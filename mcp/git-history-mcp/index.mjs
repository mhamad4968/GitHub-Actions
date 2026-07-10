#!/usr/bin/env node
/**
 * git-history-mcp — constitution / commit 4-element context (§50-3-11 第12層)
 * コア正本: scripts/lib/git-history-core.mjs（O2 thin 化）
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpServer } from '../lib/mcp-stdio.mjs';
import {
  analyzeCommitFourElements,
  getCommitDetail,
  searchConstitutionLayers,
  searchGitLog,
  searchR19R20Ritual,
} from '../../scripts/lib/git-history-core.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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
  search_git_log: (args) => searchGitLog(repoRoot, args),
  get_commit_detail: ({ hash }) => getCommitDetail(repoRoot, hash),
  analyze_commit_four_elements: ({ hash }) => analyzeCommitFourElements(repoRoot, hash),
  search_constitution_layers: (args) => searchConstitutionLayers(repoRoot, args),
  search_r19_r20_ritual: (args) => searchR19R20Ritual(repoRoot, args),
};

createMcpServer({
  name: 'git-history-mcp',
  version: '1.0.1',
  tools,
  handlers,
});
