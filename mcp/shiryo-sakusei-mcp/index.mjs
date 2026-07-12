#!/usr/bin/env node
/**
 * shiryo-sakusei-mcp — 経営会議・情報セキュリティレポート月次（資料作成専用）
 */
import { createMcpServer } from '../lib/mcp-stdio.mjs';
import {
  buildFilename,
  copyTemplate,
  extractDocumentText,
  getConfig,
  getImageSearchHints,
  insertDefinitionBox,
  listFiles,
  promoteToTemplate,
  reviewChecklist,
  saveImageCandidates,
  saveReviewNotes,
} from './lib/core.mjs';

const tools = [
  {
    name: 'shiryo_get_config',
    description: '資料作成フォルダ・テンプレ正本・運用フロー・品質チェックリスト・公式画像探索先を返す',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'shiryo_list_files',
    description: 'C:\\tmp\\資料作成 内のファイル一覧',
    inputSchema: {
      type: 'object',
      properties: { workDir: { type: 'string', description: '省略時は既定フォルダ' } },
    },
  },
  {
    name: 'shiryo_build_filename',
    description: '会議月・レポート月から出力 docx ファイル名を生成',
    inputSchema: {
      type: 'object',
      properties: {
        meetingMonth: { type: 'number' },
        reportMonth: { type: 'number' },
        meetingYear: { type: 'number' },
        reportYear: { type: 'number' },
      },
      required: ['meetingMonth', 'reportMonth'],
    },
  },
  {
    name: 'shiryo_copy_template',
    description: '_template_完成スタイル.docx から新規月次 docx を複製し、表題・検知空欄・社外事例空欄を準備',
    inputSchema: {
      type: 'object',
      properties: {
        meetingMonth: { type: 'number' },
        reportMonth: { type: 'number' },
        meetingYear: { type: 'number' },
        reportYear: { type: 'number' },
        meetingDate: { type: 'string', description: '例: 2026年8月10日' },
      },
      required: ['meetingMonth', 'reportMonth'],
    },
  },
  {
    name: 'shiryo_insert_definition_box',
    description: '7月スタイルの丸角図形に「〇〇とは」定義文を挿入',
    inputSchema: {
      type: 'object',
      properties: {
        docxPath: { type: 'string' },
        header: { type: 'string', description: '例: ボイスフィッシングとは：' },
        body: { type: 'string' },
        paragraphIndex: { type: 'number', description: '既定 8' },
      },
      required: ['docxPath', 'header', 'body'],
    },
  },
  {
    name: 'shiryo_extract_document',
    description: 'docx からテキスト・表を抽出（レビュー用）',
    inputSchema: {
      type: 'object',
      properties: { docxPath: { type: 'string' } },
      required: ['docxPath'],
    },
  },
  {
    name: 'shiryo_review_checklist',
    description: '7月完成スタイルの品質チェックリストで docx を評価',
    inputSchema: {
      type: 'object',
      properties: { docxPath: { type: 'string' } },
      required: ['docxPath'],
    },
  },
  {
    name: 'shiryo_save_image_candidates',
    description: '画像候補リスト Markdown を 資料作成 フォルダへ保存',
    inputSchema: {
      type: 'object',
      properties: {
        meetingMonth: { type: 'number' },
        topics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
            },
          },
        },
        candidates: { type: 'object', description: 'topicId -> [{use,url,source,note}]' },
      },
      required: ['meetingMonth', 'topics'],
    },
  },
  {
    name: 'shiryo_get_image_search_hints',
    description: 'テーマに応じた公式サイト探索クエリと起点 URL を返す',
    inputSchema: {
      type: 'object',
      properties: {
        theme: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
      },
      required: ['theme'],
    },
  },
  {
    name: 'shiryo_promote_to_template',
    description: '完成版 docx を _template_完成スタイル.docx に昇格（次月正本）',
    inputSchema: {
      type: 'object',
      properties: { docxPath: { type: 'string' } },
      required: ['docxPath'],
    },
  },
  {
    name: 'shiryo_save_review_notes',
    description: '完成版レビュー結果を JSON で保存（次月反映用）',
    inputSchema: {
      type: 'object',
      properties: {
        meetingMonth: { type: 'number' },
        notes: { type: 'string' },
        items: { type: 'array', items: { type: 'object' } },
      },
      required: ['meetingMonth'],
    },
  },
];

const handlers = {
  shiryo_get_config: () => getConfig(),
  shiryo_list_files: ({ workDir } = {}) => listFiles(workDir),
  shiryo_build_filename: (args) => buildFilename(args),
  shiryo_copy_template: (args) => copyTemplate(args),
  shiryo_insert_definition_box: (args) => insertDefinitionBox(args),
  shiryo_extract_document: ({ docxPath }) => extractDocumentText(docxPath),
  shiryo_review_checklist: ({ docxPath }) => reviewChecklist(docxPath),
  shiryo_save_image_candidates: (args) => saveImageCandidates(args),
  shiryo_get_image_search_hints: (args) => getImageSearchHints(args),
  shiryo_promote_to_template: ({ docxPath }) => promoteToTemplate(docxPath),
  shiryo_save_review_notes: (args) => saveReviewNotes(args),
};

createMcpServer({
  name: 'shiryo-sakusei-mcp',
  version: '1.0.0',
  tools,
  handlers,
});
