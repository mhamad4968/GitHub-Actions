import XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';

const path = 'C:\\tmp\\複合機管理台帳\\複合機管理台帳.xlsx';
const wb = XLSX.readFile(path, { cellDates: true });
const ws = wb.Sheets['複合機一覧'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const rows = [];
let prevLoc = '';
for (let i = 3; i < data.length; i++) {
  const r = data[i] || [];
  if (!r[0] && !r[1] && !r[2] && !r[8]) continue;
  let loc = String(r[0] || '').trim();
  if (loc === '〃') loc = prevLoc;
  else if (loc) prevLoc = loc;
  const intro = r[9];
  let introduced = '';
  if (intro instanceof Date) {
    introduced = intro.toISOString().slice(0, 10);
  } else {
    const s = String(intro || '').replace(/\D/g, '');
    if (s.length === 8) introduced = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  rows.push({
    sort_no: rows.length + 1,
    location_name: loc,
    manufacturer: String(r[1] || '').trim(),
    model_name: String(r[2] || '').trim(),
    connection_type: String(r[3] || '').trim(),
    ip_address: String(r[4] || '').trim(),
    ip_prefix: String(r[5] || '').trim(),
    admin_id: String(r[6] ?? '').trim(),
    admin_password: String(r[7] ?? '').trim() ? '***' : '',
    machine_no: String(r[8] ?? '').trim(),
    introduced_date: introduced,
    install_location: String(r[10] || '').trim().replace(/\r\n/g, '\n'),
    contract_holder: String(r[11] || '').trim(),
    lease_contract_no: String(r[12] || '').trim(),
    note: String(r[13] || '').trim(),
  });
}
const out = {
  source: path,
  sheet: '複合機一覧',
  headerRows: 3,
  dataRowCount: rows.length,
  manufacturers: [...new Set(rows.map((x) => x.manufacturer))],
  connectionTypes: [...new Set(rows.map((x) => x.connection_type))],
  rows,
};
writeFileSync('docs/plans/tmp-mfp-xlsx-structure.json', JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('Wrote docs/plans/tmp-mfp-xlsx-structure.json', rows.length, 'rows');
