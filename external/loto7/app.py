"""
Loto7 AI Predictor - Web UI
Flask + LSTM(TensorFlow) + SQLite
"""
import os, random, sqlite3, threading
import numpy as np
import pandas as pd
from flask import Flask, jsonify
from sklearn.preprocessing import MinMaxScaler

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "loto7_advanced.db")
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "loto7_model.h5")
WINDOW = 5

app = Flask(__name__)

_model = None
_scaler = None
_training = False

def get_db():
    return sqlite3.connect(DB_PATH)

def train_model():
    global _model, _scaler, _training
    _training = True
    try:
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense
        conn = get_db()
        df = pd.read_sql_query("SELECT n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round ASC", conn)
        conn.close()
        if len(df) < WINDOW + 1:
            _training = False
            return
        _scaler = MinMaxScaler()
        scaled = _scaler.fit_transform(df)
        X, y = [], []
        for i in range(len(scaled) - WINDOW):
            X.append(scaled[i:i+WINDOW])
            y.append(scaled[i+WINDOW])
        model = Sequential([
            LSTM(64, input_shape=(WINDOW, 7), return_sequences=True),
            LSTM(32),
            Dense(7, activation="sigmoid"),
        ])
        model.compile(optimizer="adam", loss="mse")
        model.fit(np.array(X), np.array(y), epochs=50, verbose=0)
        model.save(MODEL_PATH)
        _model = model
    except Exception as e:
        print(f"Training error: {e}")
    _training = False

def load_or_train():
    global _model, _scaler
    conn = get_db()
    df = pd.read_sql_query("SELECT n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round ASC", conn)
    conn.close()
    _scaler = MinMaxScaler()
    _scaler.fit(df)
    if os.path.exists(MODEL_PATH):
        from tensorflow.keras.models import load_model
        _model = load_model(MODEL_PATH)
    else:
        threading.Thread(target=train_model, daemon=True).start()

def predict_next():
    if _model is None or _scaler is None:
        return None
    conn = get_db()
    df = pd.read_sql_query("SELECT n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round DESC LIMIT %d" % WINDOW, conn)
    conn.close()
    if len(df) < WINDOW:
        return None
    df = df.iloc[::-1]
    scaled = _scaler.transform(df)
    inp = np.array([scaled])
    pred = _model.predict(inp, verbose=0)[0]
    raw = _scaler.inverse_transform([pred])[0]
    nums = [max(1, min(37, int(round(v)))) for v in raw]
    unique = []
    for n in nums:
        if n not in unique:
            unique.append(n)
    pool = [x for x in range(1, 38) if x not in unique]
    random.shuffle(pool)
    while len(unique) < 7:
        unique.append(pool.pop())
    return sorted(unique[:7])

@app.route("/")
def index():
    return HTML_PAGE

@app.route("/api/predict")
def api_predict():
    if _training:
        return jsonify({"status": "training", "numbers": None})
    nums = predict_next()
    return jsonify({"status": "ready" if nums else "no_model", "numbers": nums})

@app.route("/api/history")
def api_history():
    conn = get_db()
    rows = conn.execute("SELECT round,n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round DESC LIMIT 20").fetchall()
    conn.close()
    return jsonify([{"round": r[0], "numbers": list(r[1:8])} for r in rows])

@app.route("/api/retrain", methods=["POST"])
def api_retrain():
    if _training:
        return jsonify({"ok": False, "msg": "already training"})
    threading.Thread(target=train_model, daemon=True).start()
    return jsonify({"ok": True})

HTML_PAGE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Loto7 AI Predictor</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI','Meiryo',sans-serif; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #fff; min-height: 100vh; }
.container { max-width: 800px; margin: 0 auto; padding: 30px 20px; }
h1 { text-align: center; font-size: 2em; margin-bottom: 8px; background: linear-gradient(90deg, #f7971e, #ffd200); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sub { text-align: center; color: #8a8a9a; margin-bottom: 30px; font-size: 0.9em; }
.card { background: rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; margin-bottom: 24px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
.card h2 { font-size: 1.1em; color: #ffd200; margin-bottom: 16px; }
.balls { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.ball { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5em; font-weight: bold; background: linear-gradient(145deg, #f7971e, #ffd200); color: #1a1a2e; box-shadow: 0 4px 15px rgba(247,151,30,0.4); transition: transform 0.3s; }
.ball:hover { transform: scale(1.15); }
.ball.loading { background: #444; color: #888; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
.btn { display: inline-block; padding: 12px 28px; border: none; border-radius: 10px; background: linear-gradient(90deg, #f7971e, #ffd200); color: #1a1a2e; font-weight: bold; font-size: 1em; cursor: pointer; transition: 0.3s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(247,151,30,0.4); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.actions { text-align: center; margin-top: 16px; display: flex; gap: 12px; justify-content: center; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th { text-align: left; color: #ffd200; padding: 8px 6px; border-bottom: 1px solid rgba(255,255,255,0.15); font-size: 0.85em; }
td { padding: 8px 6px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.95em; }
.num-cell { font-weight: 600; letter-spacing: 2px; }
.status { text-align: center; padding: 12px; color: #ffd200; font-size: 0.9em; }
</style>
</head>
<body>
<div class="container">
  <h1>Loto7 AI Predictor</h1>
  <p class="sub">LSTM Neural Network / Data: mizuhobank.co.jp</p>

  <div class="card">
    <h2>AI Prediction - Next Draw</h2>
    <div class="balls" id="prediction">
      <div class="ball loading">?</div><div class="ball loading">?</div><div class="ball loading">?</div>
      <div class="ball loading">?</div><div class="ball loading">?</div><div class="ball loading">?</div><div class="ball loading">?</div>
    </div>
    <div id="status" class="status"></div>
    <div class="actions">
      <button class="btn" onclick="getPrediction()">Predict</button>
      <button class="btn" onclick="retrain()" id="btnRetrain">Retrain AI</button>
    </div>
  </div>

  <div class="card">
    <h2>Recent Results (Last 20)</h2>
    <table>
      <thead><tr><th>Round</th><th>Numbers</th></tr></thead>
      <tbody id="history"></tbody>
    </table>
  </div>
</div>

<script>
function getPrediction() {
  document.getElementById('status').textContent = 'Calculating...';
  fetch('/api/predict').then(r=>r.json()).then(d => {
    var el = document.getElementById('prediction');
    if (d.status === 'training') {
      document.getElementById('status').textContent = 'AI is training... please wait and try again.';
      return;
    }
    if (!d.numbers) {
      document.getElementById('status').textContent = 'No model yet. Click "Retrain AI" first.';
      return;
    }
    el.innerHTML = '';
    d.numbers.forEach(function(n) {
      var b = document.createElement('div');
      b.className = 'ball';
      b.textContent = n;
      el.appendChild(b);
    });
    document.getElementById('status').textContent = 'Prediction complete!';
  }).catch(function(e) {
    document.getElementById('status').textContent = 'Error: ' + e.message;
  });
}

function retrain() {
  var btn = document.getElementById('btnRetrain');
  btn.disabled = true;
  btn.textContent = 'Training...';
  document.getElementById('status').textContent = 'AI is retraining (this may take a minute)...';
  fetch('/api/retrain', {method:'POST'}).then(r=>r.json()).then(function() {
    setTimeout(function check() {
      fetch('/api/predict').then(r=>r.json()).then(function(d) {
        if (d.status === 'training') { setTimeout(check, 2000); return; }
        btn.disabled = false;
        btn.textContent = 'Retrain AI';
        getPrediction();
      });
    }, 3000);
  });
}

function loadHistory() {
  fetch('/api/history').then(r=>r.json()).then(function(rows) {
    var tb = document.getElementById('history');
    tb.innerHTML = '';
    rows.forEach(function(r) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>#' + r.round + '</td><td class="num-cell">' + r.numbers.join(' - ') + '</td>';
      tb.appendChild(tr);
    });
  });
}

loadHistory();
getPrediction();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    print("Loading model...")
    load_or_train()
    import webbrowser
    port = 5007
    threading.Timer(1.5, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()
    print(f"Open http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
