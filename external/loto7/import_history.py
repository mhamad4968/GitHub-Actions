# import_history.py
import sqlite3
import random

def import_dummy_data():
    conn = sqlite3.connect('loto7_advanced.db')
    # 過去500回分のデータをシミュレートして注入
    for r in range(1, 550):
        nums = sorted(random.sample(range(1, 38), 7))
        sum_val = sum(nums)
        odd_count = len([n for n in nums if n % 2 != 0])
        conn.execute("INSERT OR IGNORE INTO results VALUES (?,?,?,?,?,?,?,?,?,?)", 
                     (r, *nums, sum_val, odd_count))
    conn.commit()
    conn.close()
    print("過去データのインポートが完了しました。")

if __name__ == "__main__":
    import_dummy_data()
