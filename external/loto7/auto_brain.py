import requests, sqlite3, pandas as pd, numpy as np
from bs4 import BeautifulSoup
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler

def get_latest_mizuho():
    # みずほ銀行の最新ページをスクレイピング
    url = "https://www.mizuhobank.co.jp/takarakuji/check/loto/loto7/index.html"
    res = requests.get(url); res.encoding = 'shift_jis'
    soup = BeautifulSoup(res.text, 'html.parser')
    try:
        r_txt = soup.find('th', class_='alnCenter').get_text()
        r_num = int("".join(filter(str.isdigit, r_txt)))
        cells = soup.find_all('td', class_='alnCenter extension')
        nums = sorted([int(c.get_text()) for c in cells[:7]])
        return r_num, nums
    except Exception as e:
        print(f"データ取得エラー: {e}"); return None, None

def train_ai():
    conn = sqlite3.connect('loto7_advanced.db')
    df = pd.read_sql_query("SELECT n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round ASC", conn)
    conn.close()
    if len(df) < 10: return # データが少ない場合はスキップ
    
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df)
    X, y = [], []
    win = 5 # 過去5回を元に学習
    for i in range(len(scaled) - win):
        X.append(scaled[i:i+win]); y.append(scaled[i+win])
    
    model = Sequential([LSTM(50, input_shape=(win, 7)), Dense(7, activation='sigmoid')])
    model.compile(optimizer='adam', loss='mse')
    model.fit(np.array(X), np.array(y), epochs=30, verbose=0)
    model.save('loto7_model.h5')
    print("AIの再学習が完了しました。")

if __name__ == "__main__":
    r, n = get_latest_mizuho()
    if r:
        conn = sqlite3.connect('loto7_advanced.db')
        conn.execute("INSERT OR IGNORE INTO results VALUES (?,?,?,?,?,?,?,?,?,?)", 
                     (r, *n, sum(n), len([x for x in n if x % 2 != 0])))
        conn.commit(); conn.close()
        print(f"最新の第{r}回をDBに反映しました。")
        train_ai()
