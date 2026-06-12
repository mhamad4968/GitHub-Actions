/**
 * 新① 提案申請ver.02 — kintone フィールド定義ビルダー
 * 正本: docs/plans/2026-05-24-business-improvement-proposal-01-fields-hamada-review.md
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVAL_SPEC_PATH, fetchJson } from './business-improvement-kintone.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildDropdownOptions(items, valueKey = 'value') {
  const options = {};
  items.forEach((item, i) => {
    const key = String(item[valueKey]);
    options[key] = { label: item.label, index: String(i) };
  });
  return options;
}

function buildStageOptions(levels) {
  const keys = ['stage_a', 'stage_b', 'stage_c', 'stage_d', 'stage_e'];
  const options = {};
  levels.forEach((l, i) => {
    const key = keys[i] || `stage_${i}`;
    // kintone REST: option label must equal key
    options[key] = { label: key, index: String(i) };
  });
  return options;
}

function loadEvalSpec() {
  return JSON.parse(readFileSync(EVAL_SPEC_PATH, 'utf8'));
}

export function buildProposalFieldProperties(deptNames = []) {
  const spec = loadEvalSpec();
  const biz = spec.proposalTypes['業務改善提案'];
  const idea = spec.proposalTypes['アイデア提案'];

  const deptOptions = buildDropdownOptions(
    deptNames.filter(Boolean).map((name, i) => ({ value: name, label: name, index: i })),
    'value',
  );

  const proposalTypeOptions = {
    業務改善提案: { label: '業務改善提案', index: '0' },
    アイデア提案: { label: 'アイデア提案', index: '1' },
  };

  const rankOptions = {
    A: { label: 'A', index: '0' },
    B: { label: 'B', index: '1' },
    C: { label: 'C', index: '2' },
  };

  return {
    部署: {
      type: 'DROP_DOWN',
      code: '部署',
      label: '部署',
      required: false,
      noLabel: false,
      options: deptOptions,
    },
    社員名: {
      type: 'SINGLE_LINE_TEXT',
      code: '社員名',
      label: '社員名（代表提案者）',
      required: false,
      noLabel: false,
    },
    提案種別: {
      type: 'DROP_DOWN',
      code: '提案種別',
      label: '提案種別',
      required: false,
      noLabel: false,
      options: proposalTypeOptions,
    },
    提案件名: {
      type: 'SINGLE_LINE_TEXT',
      code: '提案件名',
      label: '提案件名',
      required: false,
      noLabel: false,
    },
    提案日: {
      type: 'DATE',
      code: '提案日',
      label: '提案日',
      required: false,
      noLabel: false,
    },
    完了日: {
      type: 'DATE',
      code: '完了日',
      label: '完了日',
      required: false,
      noLabel: false,
    },
    目的: {
      type: 'MULTI_LINE_TEXT',
      code: '目的',
      label: '目的',
      required: false,
      noLabel: false,
    },
    現状: {
      type: 'MULTI_LINE_TEXT',
      code: '現状',
      label: '現状',
      required: false,
      noLabel: false,
    },
    問題点: {
      type: 'MULTI_LINE_TEXT',
      code: '問題点',
      label: '問題点',
      required: false,
      noLabel: false,
    },
    改善案: {
      type: 'MULTI_LINE_TEXT',
      code: '改善案',
      label: '改善案',
      required: false,
      noLabel: false,
    },
    効果: {
      type: 'MULTI_LINE_TEXT',
      code: '効果',
      label: '効果',
      required: false,
      noLabel: false,
    },
    提案者一覧: {
      type: 'SUBTABLE',
      code: '提案者一覧',
      label: '提案者一覧',
      noLabel: false,
      fields: {
        提案者所属: {
          type: 'SINGLE_LINE_TEXT',
          code: '提案者所属',
          label: '所属',
          required: false,
          noLabel: false,
        },
        提案者名: {
          type: 'SINGLE_LINE_TEXT',
          code: '提案者名',
          label: '社員名',
          required: false,
          noLabel: false,
        },
      },
    },
    添付ファイル_0: {
      type: 'FILE',
      code: '添付ファイル_0',
      label: '添付ファイル',
      required: false,
      noLabel: false,
      thumbnailSize: '150',
    },
    eval_effect: {
      type: 'DROP_DOWN',
      code: 'eval_effect',
      label: '評価（効果）',
      required: false,
      noLabel: false,
      options: buildStageOptions(biz.items[0].levels),
    },
    eval_ingenuity: {
      type: 'DROP_DOWN',
      code: 'eval_ingenuity',
      label: '評価（工夫度）',
      required: false,
      noLabel: false,
      options: buildStageOptions(biz.items[1].levels),
    },
    eval_effort: {
      type: 'DROP_DOWN',
      code: 'eval_effort',
      label: '評価（努力度）',
      required: false,
      noLabel: false,
      options: buildStageOptions(biz.items[2].levels),
    },
    eval_overall: {
      type: 'DROP_DOWN',
      code: 'eval_overall',
      label: '評価（総合的審査）',
      required: false,
      noLabel: false,
      options: buildStageOptions(idea.items[0].levels),
    },
    評価コメント: {
      type: 'MULTI_LINE_TEXT',
      code: '評価コメント',
      label: '評価コメント',
      required: false,
      noLabel: false,
    },
    合計点: {
      type: 'NUMBER',
      code: '合計点',
      label: '合計点',
      required: false,
      noLabel: false,
      digit: false,
      unique: false,
      defaultValue: '',
      displayScale: '',
      unit: '',
      unitPosition: 'BEFORE',
    },
    表彰ランク_自動: {
      type: 'SINGLE_LINE_TEXT',
      code: '表彰ランク_自動',
      label: '表彰ランク（自動）',
      required: false,
      noLabel: false,
    },
    表彰ランク_最終: {
      type: 'DROP_DOWN',
      code: '表彰ランク_最終',
      label: '表彰ランク（最終）',
      required: false,
      noLabel: false,
      options: rankOptions,
    },
    付与ポイント: {
      type: 'NUMBER',
      code: '付与ポイント',
      label: '付与ポイント',
      required: false,
      noLabel: false,
      digit: false,
      unique: false,
      defaultValue: '',
      displayScale: '',
      unit: '',
      unitPosition: 'BEFORE',
    },
    branch_delegate: {
      type: 'CHECK_BOX',
      code: 'branch_delegate',
      label: '支店長判断',
      required: false,
      noLabel: false,
      options: {
        delegate: { label: '支店長へ判断を委ねる', index: '0' },
      },
    },
    差戻し理由: {
      type: 'MULTI_LINE_TEXT',
      code: '差戻し理由',
      label: '差戻し理由',
      required: false,
      noLabel: false,
    },
    申請者: {
      type: 'USER_SELECT',
      code: '申請者',
      label: '申請者（共有ID）',
      required: false,
      noLabel: false,
      entities: [],
      defaultValue: [],
    },
    部長評価者: {
      type: 'USER_SELECT',
      code: '部長評価者',
      label: '部長評価者',
      required: false,
      noLabel: false,
      entities: [],
      defaultValue: [],
    },
    支店長評価者: {
      type: 'USER_SELECT',
      code: '支店長評価者',
      label: '支店長評価者',
      required: false,
      noLabel: false,
      entities: [],
      defaultValue: [],
    },
    人事部長評価者: {
      type: 'USER_SELECT',
      code: '人事部長評価者',
      label: '人事部長評価者',
      required: false,
      noLabel: false,
      entities: [],
      defaultValue: [],
    },
    評価スナップショット: {
      type: 'SUBTABLE',
      code: '評価スナップショット',
      label: '評価スナップショット',
      noLabel: false,
      fields: {
        snap_phase: {
          type: 'SINGLE_LINE_TEXT',
          code: 'snap_phase',
          label: 'フェーズ',
          required: false,
          noLabel: false,
        },
        snap_actor: {
          type: 'SINGLE_LINE_TEXT',
          code: 'snap_actor',
          label: '操作者',
          required: false,
          noLabel: false,
        },
        snap_at: {
          type: 'DATETIME',
          code: 'snap_at',
          label: '日時',
          required: false,
          noLabel: false,
        },
        snap_total: {
          type: 'NUMBER',
          code: 'snap_total',
          label: '合計点',
          required: false,
          noLabel: false,
          digit: false,
          unique: false,
          defaultValue: '',
          displayScale: '',
          unit: '',
          unitPosition: 'BEFORE',
        },
        snap_rank_auto: {
          type: 'SINGLE_LINE_TEXT',
          code: 'snap_rank_auto',
          label: '自動ランク',
          required: false,
          noLabel: false,
        },
        snap_rank_final: {
          type: 'SINGLE_LINE_TEXT',
          code: 'snap_rank_final',
          label: '最終ランク',
          required: false,
          noLabel: false,
        },
        snap_comment: {
          type: 'MULTI_LINE_TEXT',
          code: 'snap_comment',
          label: '評価コメント',
          required: false,
          noLabel: false,
        },
      },
    },
    提案操作履歴: {
      type: 'SUBTABLE',
      code: '提案操作履歴',
      label: '提案操作履歴',
      noLabel: false,
      fields: {
        hist_at: {
          type: 'DATETIME',
          code: 'hist_at',
          label: '操作日時',
          required: false,
          noLabel: false,
        },
        hist_action: {
          type: 'SINGLE_LINE_TEXT',
          code: 'hist_action',
          label: '操作種別',
          required: false,
          noLabel: false,
        },
        hist_actor: {
          type: 'SINGLE_LINE_TEXT',
          code: 'hist_actor',
          label: '操作者',
          required: false,
          noLabel: false,
        },
        hist_detail: {
          type: 'MULTI_LINE_TEXT',
          code: 'hist_detail',
          label: '詳細',
          required: false,
          noLabel: false,
        },
      },
    },
  };
}

/** §3.2 WF — 作業者は customize がレコード保存時に USER_SELECT から設定 */
export function buildProposalProcessManagement() {
  const one = { type: 'ONE', entities: [] };
  const creator = { type: 'ONE', entities: [{ entity: { type: 'CREATOR' }, includeSubs: false }] };

  const states = {
    未処理: { name: '未処理', index: '0', assignee: creator },
    上司承認中: { name: '上司承認中', index: '1', assignee: one },
    支店長承認中: { name: '支店長承認中', index: '2', assignee: one },
    人事研修部長承認中: { name: '人事研修部長承認中', index: '3', assignee: one },
    申請者修正待ち: { name: '申請者修正待ち', index: '4', assignee: one },
    完了: { name: '完了', index: '5', assignee: one },
  };

  const actions = [
    { name: '申請', index: '0', from: '未処理', to: '上司承認中' },
    { name: '再申請', index: '1', from: '申請者修正待ち', to: '上司承認中' },
    { name: '部長承認_支店長へ', index: '2', from: '上司承認中', to: '支店長承認中' },
    { name: '部長承認_完了', index: '3', from: '上司承認中', to: '完了' },
    { name: '支店長承認_人事へ', index: '4', from: '支店長承認中', to: '人事研修部長承認中' },
    { name: '支店長承認_完了', index: '5', from: '支店長承認中', to: '完了' },
    { name: '人事承認_完了', index: '6', from: '人事研修部長承認中', to: '完了' },
    { name: '差戻し', index: '7', from: '上司承認中', to: '申請者修正待ち' },
    { name: '差戻し_支店長', index: '8', from: '支店長承認中', to: '申請者修正待ち' },
    { name: '差戻し_人事', index: '9', from: '人事研修部長承認中', to: '申請者修正待ち' },
  ];

  return { enable: true, states, actions };
}

export async function fetchDeptNamesFromSettings(baseUrl, headers, settingsAppId) {
  const q = encodeURIComponent('record_kind in ("所属行") order by $id asc limit 500');
  const url = `${baseUrl}/k/v1/records.json?app=${settingsAppId}&query=${q}&fields[0]=dept_name`;
  const j = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  return (j.records || []).map((r) => r.dept_name?.value).filter(Boolean);
}
