#!/usr/bin/env node
/** Build kintone-account-db-fields.json from org/dept masters */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELDS_PATH, loadDeptsByOrg, loadOrgs, flattenDepts } from './lib/kintone-account-kintone.mjs';

function dropOptions(values) {
  const options = {};
  values.forEach((label, i) => {
    options[label] = { label, index: String(i) };
  });
  return options;
}

const orgs = loadOrgs();
const deptsByOrg = loadDeptsByOrg();
const depts = flattenDepts(deptsByOrg);

const paySites = ['本社', '首都圏支店'];
const accountTypes = ['特権アカウント', '本社共有', '本社個人', '首都圏支店個人'];
const statuses = ['使用中', '終了'];

const properties = {
  record_kind: {
    type: 'SINGLE_LINE_TEXT',
    code: 'record_kind',
    label: 'レコード種別',
    required: false,
    noLabel: false,
    defaultValue: '',
  },
  pay_site: {
    type: 'DROP_DOWN',
    code: 'pay_site',
    label: '支払箇所',
    required: true,
    noLabel: false,
    defaultValue: '',
    options: dropOptions(paySites),
  },
  account_type: {
    type: 'DROP_DOWN',
    code: 'account_type',
    label: 'アカウント種別',
    required: true,
    noLabel: false,
    defaultValue: '',
    options: dropOptions(accountTypes),
  },
  org: {
    type: 'DROP_DOWN',
    code: 'org',
    label: '所属グループ',
    required: true,
    noLabel: false,
    defaultValue: '',
    options: dropOptions(orgs),
  },
  dept: {
    type: 'DROP_DOWN',
    code: 'dept',
    label: '所属',
    required: true,
    noLabel: false,
    defaultValue: '',
    options: dropOptions(depts),
  },
  display_name: {
    type: 'SINGLE_LINE_TEXT',
    code: 'display_name',
    label: '表示名',
    required: true,
    noLabel: false,
    defaultValue: '',
  },
  login_name: {
    type: 'SINGLE_LINE_TEXT',
    code: 'login_name',
    label: 'ログイン名',
    required: true,
    noLabel: false,
    defaultValue: '',
  },
  login_id: {
    type: 'SINGLE_LINE_TEXT',
    code: 'login_id',
    label: 'ログインID',
    required: true,
    noLabel: false,
    unique: true,
    defaultValue: '',
  },
  status: {
    type: 'DROP_DOWN',
    code: 'status',
    label: 'ステータス',
    required: true,
    noLabel: false,
    defaultValue: '使用中',
    options: dropOptions(statuses),
  },
  start_date: {
    type: 'DATE',
    code: 'start_date',
    label: '利用開始日',
    required: true,
    noLabel: false,
    defaultValue: '',
  },
  end_date: {
    type: 'DATE',
    code: 'end_date',
    label: '利用終了日',
    required: false,
    noLabel: false,
    defaultValue: '',
  },
  note: {
    type: 'MULTI_LINE_TEXT',
    code: 'note',
    label: '備考',
    required: false,
    noLabel: false,
    defaultValue: '',
  },
  snapshot_month: {
    type: 'SINGLE_LINE_TEXT',
    code: 'snapshot_month',
    label: '設定対象月',
    required: false,
    noLabel: false,
    defaultValue: '',
  },
  contract_total: {
    type: 'NUMBER',
    code: 'contract_total',
    label: '総契約数',
    required: false,
    noLabel: false,
    unique: false,
    digit: false,
    defaultValue: '',
    displayScale: '',
    unit: '',
    unitPosition: 'BEFORE',
  },
  unit_price_monthly: {
    type: 'NUMBER',
    code: 'unit_price_monthly',
    label: '1アカウント月額',
    required: false,
    noLabel: false,
    unique: false,
    digit: false,
    defaultValue: '',
    displayScale: '',
    unit: '円',
    unitPosition: 'AFTER',
  },
};

writeFileSync(FIELDS_PATH, `${JSON.stringify({ properties }, null, 2)}\n`, 'utf8');
console.log(`wrote ${FIELDS_PATH} orgs=${orgs.length} depts=${depts.length}`);
