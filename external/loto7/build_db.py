import sqlite3

def init_db():
    conn = sqlite3.connect('loto7_advanced.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS results (
        round INTEGER PRIMARY KEY,
        n1 INT, n2 INT, n3 INT, n4 INT, n5 INT, n6 INT, n7 INT,
        sum_val INT, odd_count INT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        predict_date TEXT,
        numbers TEXT,
        strategy TEXT,
        round_target INT)''')
    conn.commit()
    conn.close()
    print("データベース(loto7_advanced.db)を初期化しました。")

if __name__ == "__main__":
    init_db()
