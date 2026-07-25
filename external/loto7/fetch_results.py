"""
ロト7 過去当選番号の自動取得・DB反映スクリプト

データソース: KYO's LOTO7 (https://loto7.thekyo.jp/)
CSV は Shift-JIS エンコーディング。抽選日当日 20 時頃に更新される。
"""
import sqlite3, os, sys, urllib.request, csv, io

CSV_URL = "https://loto7.thekyo.jp/data/loto7.csv"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "loto7_advanced.db")

def ensure_tables(conn):
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS results (
        round INTEGER PRIMARY KEY,
        n1 INT, n2 INT, n3 INT, n4 INT, n5 INT, n6 INT, n7 INT,
        sum_val INT, odd_count INT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        predict_date TEXT, numbers TEXT, strategy TEXT, round_target INT)''')
    conn.commit()

def download_csv():
    """みずほ銀行系 CSV をダウンロードし、テキストとして返す"""
    req = urllib.request.Request(CSV_URL, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        raw = resp.read()
        return raw.decode("shift_jis")
    except Exception as e:
        print(f"[fetch] CSVダウンロード失敗: {e}")
        return None

def parse_and_import(csv_text, conn):
    """CSV テキストをパースして DB に UPSERT"""
    reader = csv.reader(io.StringIO(csv_text))
    header = next(reader, None)
    if not header:
        print("[fetch] CSVヘッダーが空です")
        return 0

    imported = 0
    skipped = 0
    for row in reader:
        if len(row) < 10:
            continue
        try:
            round_num = int(row[0].strip())
            nums = [int(row[i].strip()) for i in range(2, 9)]  # 第1〜第7数字
            sum_val = sum(nums)
            odd_count = sum(1 for n in nums if n % 2 != 0)
            conn.execute(
                "INSERT OR REPLACE INTO results VALUES (?,?,?,?,?,?,?,?,?,?)",
                (round_num, *nums, sum_val, odd_count)
            )
            imported += 1
        except (ValueError, IndexError):
            skipped += 1
            continue

    conn.commit()
    return imported

def fetch_and_update():
    """メインエントリポイント: ダウンロード → パース → DB反映"""
    print("[fetch] ロト7当選データを取得中...")
    csv_text = download_csv()
    if not csv_text:
        return False, 0

    conn = sqlite3.connect(DB_PATH)
    ensure_tables(conn)

    existing = conn.execute("SELECT count(*) FROM results").fetchone()[0]
    imported = parse_and_import(csv_text, conn)
    new_total = conn.execute("SELECT count(*) FROM results").fetchone()[0]
    latest = conn.execute("SELECT round FROM results ORDER BY round DESC LIMIT 1").fetchone()

    conn.close()

    added = new_total - existing
    latest_round = latest[0] if latest else 0
    print(f"[fetch] 完了: {imported}件処理, 新規{added}件追加, DB合計{new_total}件, 最新=第{latest_round}回")
    return True, new_total

if __name__ == "__main__":
    ok, total = fetch_and_update()
    if not ok:
        print("[fetch] 取得に失敗しました。ネットワーク接続を確認してください。")
        sys.exit(1)
