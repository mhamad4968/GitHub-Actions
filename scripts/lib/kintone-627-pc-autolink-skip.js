/**
 * 627（アカウント台帳）について、PC 台帳（594）との「自動結線」をスキップする判定。
 * 共有 PC 担当の管理者など、手で紐づける運用向け。
 *
 * 環境変数（dotenv 経由で読む。すべて省略可）:
 * - KINTONE_627_PC_AUTOLINK_SKIP_CATEGORY_SUBSTR … カンマ区切り。627 の CATEGORY（`カテゴリー`）の
 *   チップのいずれかに、いずれかの部分文字列が含まれる（大小無視）→ スキップ。
 *   **未設定時のみ** 既定で `管理者` を 1 件とみなす（= 管理者向け自動結線オフ）。
 *   カテゴリー判定を完全に止めるときは `.env` に空を指定:
 *   `KINTONE_627_PC_AUTOLINK_SKIP_CATEGORY_SUBSTR=`
 * - KINTONE_627_PC_AUTOLINK_SKIP_MAIL_SUBSTR … カンマ区切り。627 の mail に部分文字列（大小無視）→ スキップ
 * - KINTONE_627_PC_AUTOLINK_SKIP_MAILS_EXACT … カンマ区切り。mail 完全一致（大小無視）→ スキップ
 */

/** 627 のフィールドコード（app:fields 627 と一致） */
export const FC_627_CATEGORY = 'カテゴリー';
export const FC_627_MAIL = 'mail';

/** @param {string | undefined} envVal */
export function parseCommaList(envVal) {
  if (envVal == null || String(envVal).trim() === '') return [];
  return String(envVal)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ルールを環境変数から読む。`rules` を渡した `shouldSkip627PcAutolinkFromRecord` の第 2 引数に使う。
 */
export function loadSkipRulesFromEnv() {
  const rawCat = process.env.KINTONE_627_PC_AUTOLINK_SKIP_CATEGORY_SUBSTR;
  const categorySubstr =
    rawCat === undefined
      ? ['管理者']
      : parseCommaList(rawCat).map((s) => s.toLowerCase());
  const mailSubstr = parseCommaList(process.env.KINTONE_627_PC_AUTOLINK_SKIP_MAIL_SUBSTR).map((s) =>
    s.toLowerCase(),
  );
  const mailsExact = new Set(
    parseCommaList(process.env.KINTONE_627_PC_AUTOLINK_SKIP_MAILS_EXACT).map((s) => s.trim().toLowerCase()),
  );
  return { categorySubstr, mailSubstr, mailsExact };
}

function normMail(v) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

/**
 * @param {Record<string, unknown>} rec627 kintone 1 件の record オブジェクト
 * @param {{ categorySubstr: string[]; mailSubstr: string[]; mailsExact: Set<string> }} rules
 * @returns {{ skip: boolean, reason: string }}
 */
export function shouldSkip627PcAutolinkFromRecord(rec627, rules) {
  const mail = normMail(rec627[FC_627_MAIL]?.value);
  if (rules.mailsExact.size && mail && rules.mailsExact.has(mail)) {
    return { skip: true, reason: 'mail_exact' };
  }
  if (rules.mailSubstr.length && mail) {
    for (const sub of rules.mailSubstr) {
      if (sub && mail.includes(sub)) return { skip: true, reason: 'mail_substr' };
    }
  }
  const cat = rec627[FC_627_CATEGORY]?.value;
  const chips = Array.isArray(cat) ? cat : cat != null && String(cat).trim() !== '' ? [String(cat)] : [];
  if (rules.categorySubstr.length && chips.length) {
    for (const c of chips) {
      const cl = String(c).toLowerCase();
      for (const sub of rules.categorySubstr) {
        if (sub && cl.includes(sub)) return { skip: true, reason: 'category_substr' };
      }
    }
  }
  return { skip: false, reason: '' };
}
