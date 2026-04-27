"""
個人用出納: SQLite + Streamlit 最小 UI。
起動: streamlit run app.py
"""
from __future__ import annotations

import calendar
import sqlite3
from datetime import date
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "cashbook.db"

# 銀行は別口座＝別残金。初期はこの2行（名前は一覧の口座名そのまま）。
DEFAULT_BANK_ACCOUNTS: tuple[tuple[str, int], ...] = (
    ("みずほ", 0),
    ("三井住友", 1),
)
# 合算一覧に載せる銀行。合算の起点＝みずほ・三井それぞれの手入力残高の合計（user_manual_bank_balance）。
COMBINED_BANK_NAMES: frozenset[str] = frozenset({"みずほ", "三井住友"})


def get_conn() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            opening_balance REAL NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY,
            account_id INTEGER NOT NULL REFERENCES accounts(id),
            txn_date TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            income REAL NOT NULL DEFAULT 0,
            expense REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date
        ON transactions (txn_date, id);
        """
    )
    # 既存 DB へ opening_balance を足す（一度だけ）
    cols = {row[1] for row in conn.execute("PRAGMA table_info(accounts)").fetchall()}
    if cols and "opening_balance" not in cols:
        conn.execute(
            "ALTER TABLE accounts ADD COLUMN opening_balance REAL NOT NULL DEFAULT 0"
        )
    n_acc = conn.execute("SELECT COUNT(*) FROM accounts").fetchone()[0]
    n_txn = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    if n_acc == 0:
        conn.executemany(
            "INSERT INTO accounts (name, sort_order, opening_balance) VALUES (?, ?, 0)",
            list(DEFAULT_BANK_ACCOUNTS),
        )
    elif n_acc == 1 and n_txn == 0:
        lone = conn.execute("SELECT id, name FROM accounts").fetchone()
        if lone and lone[1] == "デフォルト口座":
            conn.execute("DELETE FROM accounts WHERE id = ?", (lone[0],))
            conn.executemany(
                "INSERT INTO accounts (name, sort_order, opening_balance) VALUES (?, ?, 0)",
                list(DEFAULT_BANK_ACCOUNTS),
            )
    _migrate_recurring_schema(conn)
    _migrate_manual_bank_balances(conn)
    conn.commit()


def _migrate_recurring_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS recurring_rules (
            id INTEGER PRIMARY KEY,
            account_id INTEGER NOT NULL REFERENCES accounts(id),
            description TEXT NOT NULL DEFAULT '',
            income REAL NOT NULL DEFAULT 0,
            expense REAL NOT NULL DEFAULT 0,
            anchor_date TEXT NOT NULL,
            interval_months INTEGER NOT NULL DEFAULT 1
                CHECK (interval_months >= 1 AND interval_months <= 24),
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """
    )
    tcols = {row[1] for row in conn.execute("PRAGMA table_info(transactions)").fetchall()}
    if "recurring_rule_id" not in tcols:
        conn.execute("ALTER TABLE transactions ADD COLUMN recurring_rule_id INTEGER")
    if "period_key" not in tcols:
        conn.execute("ALTER TABLE transactions ADD COLUMN period_key TEXT")
    conn.executescript(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ux_txn_recurring_period
        ON transactions (recurring_rule_id, period_key)
        WHERE recurring_rule_id IS NOT NULL AND period_key IS NOT NULL;
        """
    )


def _migrate_manual_bank_balances(conn: sqlite3.Connection) -> None:
    """通帳ベースのみずほ・三井それぞれの手入力残高。合算の起点はその合計。"""
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS user_manual_bank_balance (
            bank_name TEXT PRIMARY KEY,
            balance REAL NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """
    )
    for bn in sorted(COMBINED_BANK_NAMES):
        conn.execute(
            "INSERT OR IGNORE INTO user_manual_bank_balance (bank_name, balance) VALUES (?, 0)",
            (bn,),
        )
    leg = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='combined_balance_anchor'"
    ).fetchone()
    if leg:
        row = conn.execute(
            "SELECT balance FROM combined_balance_anchor WHERE id = 1"
        ).fetchone()
        if row:
            legacy = float(row[0])
            srow = conn.execute(
                "SELECT COALESCE(SUM(balance), 0) FROM user_manual_bank_balance"
            ).fetchone()
            if srow and float(srow[0]) == 0 and legacy != 0:
                half = legacy / 2.0
                conn.execute(
                    """
                    UPDATE user_manual_bank_balance
                    SET balance = ?, updated_at = datetime('now') WHERE bank_name = 'みずほ'
                    """,
                    (half,),
                )
                conn.execute(
                    """
                    UPDATE user_manual_bank_balance
                    SET balance = ?, updated_at = datetime('now') WHERE bank_name = '三井住友'
                    """,
                    (half,),
                )
        conn.execute("DROP TABLE IF EXISTS combined_balance_anchor")


def get_manual_bank_balance(conn: sqlite3.Connection, bank_name: str) -> float:
    row = conn.execute(
        "SELECT balance FROM user_manual_bank_balance WHERE bank_name = ?",
        (bank_name,),
    ).fetchone()
    return float(row[0]) if row else 0.0


def set_manual_bank_balance(conn: sqlite3.Connection, bank_name: str, value: float) -> None:
    conn.execute(
        """
        UPDATE user_manual_bank_balance
        SET balance = ?, updated_at = datetime('now')
        WHERE bank_name = ?
        """,
        (float(value), bank_name),
    )
    conn.commit()


def get_sum_manual_two_banks(conn: sqlite3.Connection) -> float:
    row = conn.execute(
        "SELECT COALESCE(SUM(balance), 0) FROM user_manual_bank_balance"
    ).fetchone()
    return float(row[0]) if row else 0.0


def copy_ledger_balance_to_manual(conn: sqlite3.Connection, bank_name: str) -> None:
    """帳簿計算（期首＋取引）の残高を、その銀行の手入力欄にコピー。"""
    row = conn.execute("SELECT id FROM accounts WHERE name = ?", (bank_name,)).fetchone()
    if not row:
        return
    b = current_book_balance(conn, int(row[0]))
    set_manual_bank_balance(conn, bank_name, b)


def add_months(d: date, months: int) -> date:
    """同一「日」を保ちつつ月加算。月末超えはその月の最終日に丸める。"""
    m0 = d.month - 1 + months
    y = d.year + m0 // 12
    mo = m0 % 12 + 1
    last = calendar.monthrange(y, mo)[1]
    return date(y, mo, min(d.day, last))


def list_accounts(conn: sqlite3.Connection) -> pd.DataFrame:
    return pd.read_sql(
        "SELECT id, name FROM accounts ORDER BY sort_order, id",
        conn,
    )


def insert_transaction(
    conn: sqlite3.Connection,
    account_id: int,
    txn_date: date,
    description: str,
    income: float,
    expense: float,
    *,
    recurring_rule_id: int | None = None,
    period_key: str | None = None,
) -> None:
    conn.execute(
        """
        INSERT INTO transactions (
            account_id, txn_date, description, income, expense,
            recurring_rule_id, period_key
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            account_id,
            txn_date.isoformat(),
            description.strip(),
            float(income or 0),
            float(expense or 0),
            recurring_rule_id,
            period_key,
        ),
    )
    conn.commit()


def insert_recurring_rule(
    conn: sqlite3.Connection,
    account_id: int,
    description: str,
    income: float,
    expense: float,
    anchor_date: date,
    interval_months: int,
) -> int:
    cur = conn.execute(
        """
        INSERT INTO recurring_rules (
            account_id, description, income, expense, anchor_date, interval_months, active
        )
        VALUES (?, ?, ?, ?, ?, ?, 1)
        """,
        (
            account_id,
            description.strip(),
            float(income or 0),
            float(expense or 0),
            anchor_date.isoformat(),
            int(interval_months),
        ),
    )
    conn.commit()
    return int(cur.lastrowid)


def list_all_recurring_rules(conn: sqlite3.Connection) -> pd.DataFrame:
    """全口座の繰り返しルール（銀行名付き）。"""
    return pd.read_sql(
        """
        SELECT r.id, r.account_id, a.name AS bank_name, r.description, r.income,
               r.expense, r.anchor_date, r.interval_months, r.active
        FROM recurring_rules r
        JOIN accounts a ON a.id = r.account_id
        ORDER BY a.sort_order, a.id, r.id
        """,
        conn,
    )


def set_recurring_rule_active(conn: sqlite3.Connection, rule_id: int, active: bool) -> None:
    conn.execute(
        "UPDATE recurring_rules SET active = ? WHERE id = ?",
        (1 if active else 0, rule_id),
    )
    conn.commit()


def delete_recurring_rule(conn: sqlite3.Connection, rule_id: int) -> None:
    conn.execute("DELETE FROM recurring_rules WHERE id = ?", (rule_id,))
    conn.commit()


def generate_recurring_up_to(
    conn: sqlite3.Connection, account_id: int, through: date
) -> int:
    """有効なルールについて、through までの各回の取引を INSERT OR IGNORE（重複はスキップ）。"""
    rows = conn.execute(
        """
        SELECT id, account_id, description, income, expense, anchor_date, interval_months
        FROM recurring_rules
        WHERE active = 1 AND account_id = ?
        """,
        (account_id,),
    ).fetchall()
    inserted = 0
    for row in rows:
        rid = int(row[0])
        acc = int(row[1])
        desc = str(row[2] or "")
        inc = float(row[3] or 0)
        exp = float(row[4] or 0)
        anchor = date.fromisoformat(str(row[5]))
        step = int(row[6])
        d = anchor
        while d <= through:
            pk = f"{rid}:{d.year:04d}-{d.month:02d}"
            cur = conn.execute(
                """
                INSERT OR IGNORE INTO transactions (
                    account_id, txn_date, description, income, expense,
                    recurring_rule_id, period_key
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    acc,
                    d.isoformat(),
                    desc,
                    inc,
                    exp,
                    rid,
                    pk,
                ),
            )
            if cur.rowcount == 1:
                inserted += 1
            d = add_months(d, step)
    conn.commit()
    return inserted


def generate_all_recurring_up_to(conn: sqlite3.Connection, through: date) -> int:
    """有効なルールが紐づく全口座について、一括で取引生成。"""
    rows = conn.execute(
        "SELECT DISTINCT account_id FROM recurring_rules WHERE active = 1"
    ).fetchall()
    total = 0
    for (aid,) in rows:
        total += generate_recurring_up_to(conn, int(aid), through)
    return total


def get_opening_balance(conn: sqlite3.Connection, account_id: int) -> float:
    row = conn.execute(
        "SELECT opening_balance FROM accounts WHERE id = ?", (account_id,)
    ).fetchone()
    return float(row[0]) if row else 0.0


def set_opening_balance(conn: sqlite3.Connection, account_id: int, value: float) -> None:
    conn.execute(
        "UPDATE accounts SET opening_balance = ? WHERE id = ?",
        (float(value), account_id),
    )
    conn.commit()


def combined_opening_total(conn: sqlite3.Connection) -> float:
    """みずほ・三井住友の期首残金の合計（存在する口座のみ）。"""
    if not COMBINED_BANK_NAMES:
        return 0.0
    ph = ",".join("?" * len(COMBINED_BANK_NAMES))
    row = conn.execute(
        f"SELECT COALESCE(SUM(opening_balance), 0) FROM accounts WHERE name IN ({ph})",
        tuple(sorted(COMBINED_BANK_NAMES)),
    ).fetchone()
    return float(row[0]) if row else 0.0


def load_combined_ledger(conn: sqlite3.Connection) -> pd.DataFrame:
    """
    みずほ・三井住友の取引を日付順で統合。
    残金（合算）＝（手入力のみずほ＋手入力の三井住友）＋（収入−支出）の時系列累計。
    支出は残金を減らす方向に働く。
    """
    names_sorted = sorted(COMBINED_BANK_NAMES)
    id_rows = conn.execute(
        f"SELECT id, name FROM accounts WHERE name IN ({','.join('?' * len(names_sorted))}) "
        "ORDER BY sort_order, id",
        names_sorted,
    ).fetchall()
    if not id_rows:
        return pd.DataFrame(
            columns=["id", "txn_date", "bank_name", "description", "income", "expense", "balance"],
        )
    ids = [int(r[0]) for r in id_rows]
    ph = ",".join("?" * len(ids))
    q = f"""
    SELECT t.id, t.txn_date, a.name AS bank_name, t.description, t.income, t.expense
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    WHERE t.account_id IN ({ph})
    ORDER BY t.txn_date ASC, t.account_id ASC, t.id ASC
    """
    df = pd.read_sql(q, conn, params=tuple(ids))
    base = get_sum_manual_two_banks(conn)
    if df.empty:
        return df.assign(balance=pd.Series(dtype="float64"))
    net = df["income"].fillna(0) - df["expense"].fillna(0)
    df["balance"] = base + net.cumsum()
    return df


def account_balance_breakdown(
    conn: sqlite3.Connection, account_id: int
) -> tuple[float, float, float, int]:
    """期首、収入合計、支出合計、取引件数。帳簿残＝期首＋収入合計−支出合計。"""
    ob = get_opening_balance(conn, account_id)
    row = conn.execute(
        """
        SELECT COALESCE(SUM(income), 0), COALESCE(SUM(expense), 0), COUNT(*)
        FROM transactions WHERE account_id = ?
        """,
        (account_id,),
    ).fetchone()
    return (ob, float(row[0]), float(row[1]), int(row[2]))


def current_book_balance(conn: sqlite3.Connection, account_id: int) -> float:
    """その口座の帳簿上の最終残金（取引がなければ期首のみ）。"""
    ob, si, se, _n = account_balance_breakdown(conn, account_id)
    return ob + si - se


def current_combined_book_balance(conn: sqlite3.Connection) -> float:
    df = load_combined_ledger(conn)
    if df.empty:
        return get_sum_manual_two_banks(conn)
    return float(df["balance"].iloc[-1])


def sum_per_combined_bank_book(conn: sqlite3.Connection) -> float:
    """みずほ・三井それぞれの帳簿残（期首＋収支）を足した値。通帳の合計イメージ。"""
    total = 0.0
    for name in sorted(COMBINED_BANK_NAMES):
        row = conn.execute("SELECT id FROM accounts WHERE name = ?", (name,)).fetchone()
        if row:
            total += current_book_balance(conn, int(row[0]))
    return total


def combined_ledger_for_display(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(
            columns=["支払日", "銀行", "摘要", "収入", "支出", "残金（合算）"],
        )
    out = df.drop(columns=["id"], errors="ignore").rename(
        columns={
            "txn_date": "支払日",
            "bank_name": "銀行",
            "description": "摘要",
            "income": "収入",
            "expense": "支出",
            "balance": "残金（合算）",
        }
    )
    return out


def load_ledger(conn: sqlite3.Connection, account_id: int) -> pd.DataFrame:
    """支払日（txn_date）昇順 → 同日は id 昇順。残金は期首＋累計。"""
    q = """
    SELECT id, txn_date, description, income, expense
    FROM transactions
    WHERE account_id = ?
    ORDER BY txn_date ASC, id ASC
    """
    df = pd.read_sql(q, conn, params=(account_id,))
    opening = get_opening_balance(conn, account_id)
    if df.empty:
        out = df.assign(balance=pd.Series(dtype="float64"))
        return out
    net = df["income"].fillna(0) - df["expense"].fillna(0)
    df["balance"] = opening + net.cumsum()
    return df


def ledger_for_display(df: pd.DataFrame) -> pd.DataFrame:
    """Excel「一覧」に近い列名。一覧は閲覧用のため id は出さない。"""
    if df.empty:
        return pd.DataFrame(
            columns=["支払日", "摘要", "収入", "支出", "残金"],
        )
    out = df.drop(columns=["id"], errors="ignore").rename(
        columns={
            "txn_date": "支払日",
            "description": "摘要",
            "income": "収入",
            "expense": "支出",
            "balance": "残金",
        }
    )
    return out


def main() -> None:
    st.set_page_config(page_title="個人用出納", layout="wide")
    st.title("個人用出納")
    st.caption("データはこの PC 上の SQLite のみ。会社 kintone とは無関係。")

    conn = get_conn()
    init_db(conn)

    accounts = list_accounts(conn)
    acc_options = {row["name"]: int(row["id"]) for _, row in accounts.iterrows()}
    names = list(acc_options.keys())

    with st.sidebar:
        st.subheader("銀行")
        st.caption(
            "**合算の起点**は、下の **みずほ・三井それぞれの手入力**の合計です。"
            "その合計から、取引の収入・支出が増減します。銀行別の期首は帳簿計算用です。"
        )
        choice = st.selectbox("追加・繰り返し・銀行別一覧で使う銀行", names, index=0)
        account_id = acc_options[choice]
        st.divider()
        with st.expander("通帳の残高（みずほ・三井・手入力）", expanded=True):
            st.caption(
                "ここに入れた **2つの合計** が、合算一覧の起点になります。"
                "支出はその合計から引かれる形で一覧に反映されます。"
            )
            mz0 = get_manual_bank_balance(conn, "みずほ")
            sm0 = get_manual_bank_balance(conn, "三井住友")
            with st.form("sidebar_manual_balances"):
                in_mz = st.number_input("みずほ（円）", value=float(mz0), step=1000.0, key="sb_mz")
                in_sm = st.number_input("三井住友（円）", value=float(sm0), step=1000.0, key="sb_sm")
                if st.form_submit_button("手入力を保存", type="primary"):
                    set_manual_bank_balance(conn, "みずほ", in_mz)
                    set_manual_bank_balance(conn, "三井住友", in_sm)
                    st.rerun()
        sum_man = get_sum_manual_two_banks(conn)
        tail = current_combined_book_balance(conn)
        st.metric("手入力の合計（合算の起点）", f"{sum_man:,.0f} 円")
        st.metric("合算一覧の最終残（起点＋取引）", f"{tail:,.0f} 円")
        st.divider()
        st.markdown("**帳簿計算（参考）**")
        st.caption("期首＋取引だけで出した値。手入力と違うときは、通帳に合わせて上を直すか、帳簿側を「追加」で整えてください。")
        sum_books = sum_per_combined_bank_book(conn)
        st.metric("帳簿計算の合計（みずほ＋三井）", f"{sum_books:,.0f} 円")
        neg_bank = False
        for bn in ("みずほ", "三井住友"):
            if bn in acc_options:
                bid = acc_options[bn]
                bb = current_book_balance(conn, bid)
                st.metric(f"{bn}（帳簿）", f"{bb:,.0f} 円")
                if bb < 0:
                    neg_bank = True
        if neg_bank:
            st.warning(
                "帳簿計算がマイナスの口座があります（期首＋取引の結果）。"
                "通帳と合わせるには**期首**や**追加**で直すか、上の**手入力**を通帳の残高に合わせてください。"
            )
        with st.expander("選択中の銀行の計算内訳", expanded=False):
            ob, si, se, n = account_balance_breakdown(conn, account_id)
            end = ob + si - se
            st.write(f"**{choice}**（取引 {n} 件）")
            st.write(f"- 期首残金: **{ob:,.0f}** 円")
            st.write(f"- 収入の合計: **{si:,.0f}** 円")
            st.write(f"- 支出の合計: **{se:,.0f}** 円")
            st.write(f"- 期首＋収入−支出: **{end:,.0f}** 円（＝帳簿残）")
        st.divider()
        with st.expander("期首残金（その銀行の起点）", expanded=False):
            ob = get_opening_balance(conn, account_id)
            new_ob = st.number_input(
                f"「{choice}」の期首残金（円）",
                value=float(ob),
                step=1000.0,
                key=f"ob_{account_id}",
                help="銀行別の残金＝この口座の期首＋（収入−支出）。合算の起点はサイドバーのみずほ・三井の手入力の合計。",
            )
            if st.button("期首を保存", key=f"save_ob_{account_id}"):
                set_opening_balance(conn, account_id, new_ob)
                st.rerun()
        st.divider()
        st.markdown("**その他の口座を追加**（名前だけ）")
        new_name = st.text_input("口座名", key="new_acc")
        if st.button("口座を追加", type="secondary") and new_name.strip():
            try:
                conn.execute(
                    "INSERT INTO accounts (name, sort_order, opening_balance) VALUES (?, ?, 0)",
                    (new_name.strip(), len(names)),
                )
                conn.commit()
                st.rerun()
            except sqlite3.IntegrityError:
                st.error("同じ名前の口座があります。")

    tab1, tab2, tab3 = st.tabs(
        ["一覧（時系列）", "追加（都度）", "繰り返し（固定）"]
    )

    with tab1:
        sub_a, sub_b = st.tabs(["合算（みずほ＋三井）", f"銀行別（{choice}）"])
        with sub_a:
            st.subheader("合算一覧（みずほ＋三井住友）")
            st.markdown(
                "**残金（合算）** ＝ **（手入力のみずほ ＋ 手入力の三井住友）** ＋、"
                "この2口座の取引を時系列に並べた **（収入 − 支出）** の累計です。"
                "**支出は合計からマイナス**、収入はプラスに働きます。"
                "手入力は **サイドバー** の「通帳の残高」でも同じものを編集できます。"
            )
            ob_sum = combined_opening_total(conn)
            sum_man = get_sum_manual_two_banks(conn)
            c1, c2 = st.columns(2)
            with c1:
                st.metric("手入力の合計（起点）", f"{sum_man:,.0f} 円")
            with c2:
                st.metric("いまの合算残（起点＋取引）", f"{current_combined_book_balance(conn):,.0f} 円")
            st.caption(
                f"参考: 口座**期首の合計** {ob_sum:,.0f} 円 ／ **帳簿計算の合計** {sum_per_combined_bank_book(conn):,.0f} 円"
            )
            c3, c4 = st.columns(2)
            with c3:
                if st.button("みずほの帳簿残を手入力にコピー", key="cp_mz_man"):
                    copy_ledger_balance_to_manual(conn, "みずほ")
                    st.rerun()
            with c4:
                if st.button("三井住友の帳簿残を手入力にコピー", key="cp_sm_man"):
                    copy_ledger_balance_to_manual(conn, "三井住友")
                    st.rerun()
            cdf = load_combined_ledger(conn)
            cdisplay = combined_ledger_for_display(cdf)
            if cdf.empty:
                st.info("合算対象の取引がまだありません。「追加（都度）」でどちらかの銀行に登録してください。")
            else:
                st.dataframe(
                    cdisplay,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "支払日": st.column_config.TextColumn("支払日"),
                        "銀行": st.column_config.TextColumn("銀行"),
                        "摘要": st.column_config.TextColumn("摘要"),
                        "収入": st.column_config.NumberColumn("収入", format="%.0f 円"),
                        "支出": st.column_config.NumberColumn("支出", format="%.0f 円"),
                        "残金（合算）": st.column_config.NumberColumn(
                            "残金（合算）", format="%.0f 円"
                        ),
                    },
                )
        with sub_b:
            st.subheader(f"銀行別一覧（{choice}）")
            st.markdown(
                "この銀行口座だけの取引と、その口座単体の残金です。"
                "合算の残金は上の「合算」タブを見てください。"
            )
            df = load_ledger(conn, account_id)
            display_df = ledger_for_display(df)
            if df.empty:
                st.info("この銀行にはまだ取引がありません。「追加（都度）」タブから登録してください。")
                ob = get_opening_balance(conn, account_id)
                if ob != 0:
                    st.metric("期首残金のみ（取引なし）", f"{ob:,.0f} 円")
            else:
                st.dataframe(
                    display_df,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "支払日": st.column_config.TextColumn("支払日"),
                        "摘要": st.column_config.TextColumn("摘要"),
                        "収入": st.column_config.NumberColumn("収入", format="%.0f 円"),
                        "支出": st.column_config.NumberColumn("支出", format="%.0f 円"),
                        "残金": st.column_config.NumberColumn("残金", format="%.0f 円"),
                    },
                )

    with tab2:
        st.subheader("取引を追加（都度）")
        st.caption(
            "スーパー・ネット通販・臨時の入金など、**その都度金額が変わるもの**はここで1件ずつ登録します。"
            "家賃のように同じ額が続くものは「繰り返し（固定）」タブへ。"
        )
        st.info(
            f"**今登録する銀行: {choice}** — 通帳・ATMの実残高に合わせるときは、"
            "この銀行を選んだうえで **収入**（または支出）に差分を入れ、摘要に「残高調整」などと書くとよいです。"
            "合算の「残金」は一覧の「合算」タブで確認できます（起点はサイドバーでみずほ・三井を入力）。"
        )
        with st.form("add_txn"):
            d = st.date_input("支払日", value=date.today())
            desc = st.text_input("摘要")
            c1, c2 = st.columns(2)
            with c1:
                income = st.number_input("収入（円）", min_value=0.0, value=0.0, step=1000.0)
            with c2:
                expense = st.number_input("支出（円）", min_value=0.0, value=0.0, step=1000.0)
            submitted = st.form_submit_button("保存", type="primary")
        if submitted:
            if income <= 0 and expense <= 0:
                st.warning("収入か支出のどちらかを入れてください。")
            else:
                insert_transaction(conn, account_id, d, desc, income, expense)
                st.success("保存しました。")
                st.rerun()

    with tab3:
        _render_recurring_tab(conn, names, acc_options)

    conn.close()


def _interval_label(months: int) -> str:
    if months == 1:
        return "毎月"
    if months == 2:
        return "2か月ごと"
    return f"{months}か月ごと"


def _render_recurring_tab(
    conn: sqlite3.Connection,
    account_names: list[str],
    acc_options: dict[str, int],
) -> None:
    st.subheader("繰り返し（固定）— 全体")
    st.markdown(
        "**都度購入はここでは入れません。**「追加（都度）」タブで都度登録してください。"
        "ここは家賃・サブスクなど**同じ金額が決まった間隔で続くもの**だけです。"
        "ルールは**口座ごと**に紐づきますが、この画面では**すべての口座のルールを一覧**し、"
        "生成も**まとめて**行えます。"
        "**同じルール×同じ年月は二重登録されません**（再実行しても安全）。"
    )

    interval_options = [1, 2, 3, 6, 12]
    interval_format = {1: "毎月", 2: "2か月ごと", 3: "3か月ごと", 6: "半年ごと", 12: "年1回"}

    with st.form("add_recurring"):
        st.markdown("**新しい繰り返しルール**")
        rule_bank = st.selectbox(
            "引き落とし・記帳する口座",
            options=account_names,
            index=0,
            help="このルールで作る取引は、この口座にだけ登録されます。",
            key="rec_rule_bank",
        )
        rule_aid = acc_options[rule_bank]
        ra = st.date_input(
            "最初の支払日",
            value=date.today(),
            help="この日を1回目とし、そこから間隔どおりに続きます。",
            key="rec_anchor",
        )
        rdesc = st.text_input("摘要", key="rec_desc")
        c1, c2 = st.columns(2)
        with c1:
            rinc = st.number_input("収入（円）", min_value=0.0, value=0.0, step=1000.0, key="rec_inc")
        with c2:
            rexp = st.number_input("支出（円）", min_value=0.0, value=0.0, step=1000.0, key="rec_exp")
        rim = st.selectbox(
            "間隔",
            options=interval_options,
            index=0,
            format_func=lambda x: interval_format.get(x, f"{x}か月ごと"),
            key="rec_interval",
        )
        add_rule = st.form_submit_button("ルールを保存", type="primary")
    if add_rule:
        if rinc <= 0 and rexp <= 0:
            st.warning("収入か支出のどちらかを入れてください。")
        elif not rdesc.strip():
            st.warning("摘要を入れてください。")
        else:
            insert_recurring_rule(
                conn, rule_aid, rdesc, rinc, rexp, ra, int(rim)
            )
            st.success("ルールを保存しました。下の「一括生成」で取引に反映してください。")
            st.rerun()

    st.divider()
    st.markdown("**すべての有効ルールから取引を一括生成**")
    head = date.today().replace(day=1)
    end_head = add_months(head, 6)
    last_d = calendar.monthrange(end_head.year, end_head.month)[1]
    default_through = date(end_head.year, end_head.month, last_d)
    gen_through = st.date_input(
        "生成する最終日（この日を含む回まで）",
        value=default_through,
        key="gen_through",
    )
    if st.button("繰り返しから取引を一括生成", type="primary", key="gen_btn"):
        n = generate_all_recurring_up_to(conn, gen_through)
        st.success(f"{n} 件の取引を追加しました（既にあった分はスキップ）。")
        st.rerun()

    st.divider()
    rules_df = list_all_recurring_rules(conn)
    if rules_df.empty:
        st.info("まだ繰り返しルールがありません。")
        return

    show = rules_df.copy()
    show["間隔"] = show["interval_months"].map(_interval_label)
    show["有効"] = show["active"].map({1: "はい", 0: "いいえ"})
    show = show.rename(
        columns={
            "id": "ID",
            "bank_name": "口座",
            "description": "摘要",
            "income": "収入",
            "expense": "支出",
            "anchor_date": "最初の支払日",
        }
    )
    disp_cols = ["ID", "口座", "摘要", "収入", "支出", "最初の支払日", "間隔", "有効"]
    st.dataframe(
        show[disp_cols],
        use_container_width=True,
        hide_index=True,
    )

    st.markdown("**ルールの停止・再開・削除**")
    labels: list[str] = []
    ids: list[int] = []
    for _, r in rules_df.iterrows():
        rid = int(r["id"])
        st_ = "【停止中】" if int(r["active"]) == 0 else ""
        bnk = str(r["bank_name"])
        labels.append(
            f"{rid} — [{bnk}] {r['description']} {_interval_label(int(r['interval_months']))} {st_}".strip()
        )
        ids.append(rid)
    pick = st.selectbox("ルール", options=range(len(labels)), format_func=lambda i: labels[i], key="rule_pick")
    rid = ids[pick]
    active_now = int(rules_df.loc[rules_df["id"] == rid, "active"].iloc[0]) == 1
    c_a, c_b, c_c = st.columns(3)
    with c_a:
        if st.button("停止", disabled=not active_now, key="rule_off"):
            set_recurring_rule_active(conn, rid, False)
            st.rerun()
    with c_b:
        if st.button("再開", disabled=active_now, key="rule_on"):
            set_recurring_rule_active(conn, rid, True)
            st.rerun()
    with c_c:
        if st.button("ルール削除", key="rule_del"):
            delete_recurring_rule(conn, rid)
            st.success("ルールを削除しました（すでに生成した取引は残ります）。")
            st.rerun()


if __name__ == "__main__":
    main()
