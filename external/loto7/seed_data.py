# seed_data.py
import sqlite3
import random

def seed():
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

    print("過去データをDBに注入しています...")
    for r in range(1, 571):
        nums = sorted(random.sample(range(1, 38), 7))
        sum_val = sum(nums)
        odd_count = len([n for n in nums if n % 2 != 0])
        cursor.execute("INSERT OR IGNORE INTO results VALUES (?,?,?,?,?,?,?,?,?,?)",
                     (r, *nums, sum_val, odd_count))

    conn.commit()
    conn.close()
    print("注入完了！これでAIが学習・分析できる状態になりました。")

if __name__ == "__main__":
    seed()
