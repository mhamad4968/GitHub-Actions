"""
Loto7 AI ANALYZER — HTTP 層（Flask）。

予想・統計は loto7_predict / loto7_stats のみ（ブラウザから外部 LLM は呼ばない）。
改修時に別途意見を聞く運用は README-DEV.txt（Cursor 上の MCP 等・本アプリの外）。
"""
import datetime
import os
import random
import sqlite3
import sys
import threading
import time

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from loto7_constants import ALL_NUMBERS, ENSEMBLE_STRATEGY_NAME
from loto7_predict import (
    build_number_scores,
    calc_confidence,
    decay_weights,
    default_ensemble_pick_trials,
    default_ensemble_samples,
    default_max_gen_tries,
    enrich_prediction_ss,
    extended_strategies,
)
from loto7_stats import (
    build_full_analysis,
    correlation_api_payload,
    cycles_api_payload,
    frequency_map,
    frequency_trend_payload,
    load_all_draws,
    sum_stats,
)

base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=base_dir)
CORS(app)

DB_NAME = os.path.join(base_dir, "loto7_advanced.db")
PID_LOCK_PATH = os.path.join(base_dir, ".loto7_server.pid")

_analysis_cache = {"data": None, "ts": 0}
_analysis_cache_lock = threading.Lock()
CACHE_TTL = 300


def _process_alive(pid):
    pid = int(pid)
    if pid <= 0:
        return False
    if sys.platform == "win32":
        try:
            import ctypes

            k = ctypes.windll.kernel32
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            h = k.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
            if h:
                k.CloseHandle(h)
                return True
            return False
        except Exception:
            pass
    try:
        os.kill(pid, 0)
    except (OSError, ProcessLookupError, ValueError):
        return False
    return True


def _open_browser_url(url):
    import webbrowser

    ok = False
    if sys.platform == "win32":
        try:
            os.startfile(url)
            ok = True
        except OSError as e:
            print(f"[LOTO7] os.startfile 失敗: {e}")
    if not ok:
        try:
            ok = bool(webbrowser.open(url))
        except Exception as e:
            print(f"[LOTO7] webbrowser.open 失敗: {e}")
    if ok:
        print(f"[LOTO7] ブラウザを開きました: {url}")
    else:
        print(
            f"[LOTO7] 自動でブラウザを開けませんでした。次をアドレスバーに貼り付けてください:\n  {url}"
        )
    return ok


def _loto7_health_ok(base_url="http://127.0.0.1:5000", timeout=1.5):
    try:
        import urllib.request

        u = base_url.rstrip("/") + "/api/health"
        with urllib.request.urlopen(u, timeout=timeout) as resp:
            return resp.getcode() == 200
    except Exception:
        return False


def _wait_for_server_and_open_browser(base_url="http://127.0.0.1:5000", timeout_sec=90):
    import urllib.error
    import urllib.request

    health = base_url.rstrip("/") + "/api/health"
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(health, timeout=1.2) as resp:
                if resp.getcode() == 200:
                    break
        except (urllib.error.URLError, OSError, TimeoutError, ValueError):
            time.sleep(0.35)
    else:
        print(
            "[LOTO7] サーバーの応答待ちがタイムアウトしました。起動に失敗している可能性があります。"
        )
    _open_browser_url(base_url.rstrip("/") + "/")


def acquire_single_instance_or_exit():
    if os.path.isfile(PID_LOCK_PATH):
        old_pid = None
        try:
            with open(PID_LOCK_PATH, "r", encoding="ascii") as f:
                old_pid = int(f.read().strip())
        except (ValueError, OSError):
            pass
        if (
            old_pid is not None
            and old_pid != os.getpid()
            and _process_alive(old_pid)
            and _loto7_health_ok()
        ):
            print(f"[LOTO7] 既に起動中です (PID {old_pid})。http://127.0.0.1:5000 を開きます。")
            _open_browser_url("http://127.0.0.1:5000/")
            sys.exit(2)
        try:
            os.remove(PID_LOCK_PATH)
        except OSError:
            pass
    try:
        with open(PID_LOCK_PATH, "w", encoding="ascii") as f:
            f.write(str(os.getpid()))
    except OSError:
        pass

    def _unlink_lock_if_mine():
        try:
            if os.path.isfile(PID_LOCK_PATH):
                with open(PID_LOCK_PATH, "r", encoding="ascii") as f:
                    if f.read().strip() == str(os.getpid()):
                        os.remove(PID_LOCK_PATH)
        except OSError:
            pass

    import atexit

    atexit.register(_unlink_lock_if_mine)


def ensure_tables():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        """CREATE TABLE IF NOT EXISTS results (
        round INTEGER PRIMARY KEY,
        n1 INT, n2 INT, n3 INT, n4 INT, n5 INT, n6 INT, n7 INT,
        sum_val INT, odd_count INT)"""
    )
    c.execute(
        """CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        predict_date TEXT, numbers TEXT, strategy TEXT, round_target INT)"""
    )
    conn.commit()
    conn.close()


def _bg_fetch():
    try:
        from fetch_results import fetch_and_update

        ok, total = fetch_and_update()
        if ok:
            print(f"[BG] データ更新完了（{total}件）")
    except Exception as e:
        print(f"[BG] データ取得失敗（次回起動時にリトライ）: {e}")


def startup_data_load():
    ensure_tables()
    conn = sqlite3.connect(DB_NAME)
    count = conn.execute("SELECT count(*) FROM results").fetchone()[0]
    if count == 0:
        print("[起動] 初回起動: データ取得中（少しお待ちください）...")
        conn.close()
        try:
            from fetch_results import fetch_and_update

            ok, total = fetch_and_update()
            if ok and total > 0:
                print(f"実データ {total} 件で起動します。")
                return
        except Exception as e:
            print(f"[起動] 実データ取得失敗: {e}")
        conn = sqlite3.connect(DB_NAME)
        cnt2 = conn.execute("SELECT count(*) FROM results").fetchone()[0]
        if cnt2 == 0:
            print("オフライン: サンプルデータ 100 件を注入します。")
            for r in range(1, 101):
                nums = sorted(random.sample(ALL_NUMBERS, 7))
                conn.execute(
                    "INSERT INTO results VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (r, *nums, sum(nums), sum(1 for n in nums if n % 2)),
                )
            conn.commit()
        conn.close()
    else:
        conn.close()
        print(f"既存データ {count} 件で即起動。バックグラウンドで最新データを取得します。")
        threading.Thread(target=_bg_fetch, daemon=True).start()


# ---------------------------------------------------------------------
# API
# ---------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory(base_dir, "index.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/analysis")
def analysis():
    now = time.time()
    with _analysis_cache_lock:
        cached = _analysis_cache["data"]
        cache_ts = _analysis_cache["ts"]
    if cached and (now - cache_ts) < CACHE_TTL:
        return jsonify(cached)
    try:
        conn = sqlite3.connect(DB_NAME)
        draws = load_all_draws(conn)
        last_row = conn.execute(
            "SELECT round, n1,n2,n3,n4,n5,n6,n7, sum_val FROM results ORDER BY round DESC LIMIT 1"
        ).fetchone()
        conn.close()
        if not draws or not last_row:
            return jsonify({"status": "error", "comment": "データがありません。"})
        stats = build_full_analysis(draws)
        is_real = len(draws) > 200
        label = "実データ" if is_real else "サンプルデータ"
        result = {
            "hit_info": {"round": last_row[0], "nums": list(last_row[1:8])},
            "comment": f"第{last_row[0]}回の分析完了（{label} {len(draws)}回分）。合計値 {last_row[8]}（平均{stats['sum_stats']['mean']}）。",
            "stats": stats["sum_stats"]["recent5"],
            "full_stats": stats,
            "data_source": label,
        }
        with _analysis_cache_lock:
            _analysis_cache["data"] = result
            _analysis_cache["ts"] = now
        return jsonify(result)
    except Exception as e:
        print(f"DEBUG: Analysis Error -> {e}")
        return jsonify({"status": "error", "comment": f"分析エラー: {e}"})


@app.route("/api/predict")
def predict():
    try:
        conn = sqlite3.connect(DB_NAME)
        draws = load_all_draws(conn)
        if not draws:
            conn.close()
            return jsonify(
                {
                    "status": "error",
                    "message": "過去抽選データがありません。データ取得を実行してください。",
                }
            )
        last_row = conn.execute(
            "SELECT round FROM results ORDER BY round DESC LIMIT 1"
        ).fetchone()
        next_round = (last_row[0] + 1) if last_row else 1
        freq = frequency_map(draws)
        decay_w = decay_weights(draws, half_life=40)

        ss = enrich_prediction_ss(draws, sum_stats(draws))
        results = []
        for name, fn, desc in extended_strategies(conn, next_round):
            nums = fn(draws, ss)
            conf = calc_confidence(nums, freq, ss, draws, decay_w)
            nums_str = ",".join(map(str, nums))
            conn.execute(
                "INSERT INTO predictions (predict_date, numbers, strategy, round_target) VALUES (?,?,?,?)",
                (datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), nums_str, name, next_round),
            )
            results.append(
                {
                    "strategy": name,
                    "description": desc,
                    "numbers": nums,
                    "score": conf,
                    "sum": sum(nums),
                    "odd_count": sum(1 for n in nums if n % 2),
                    "high_count": sum(1 for n in nums if n >= 20),
                }
            )
        conn.execute(
            """DELETE FROM predictions WHERE id NOT IN (
            SELECT id FROM predictions ORDER BY id DESC LIMIT 320)"""
        )
        conn.commit()
        conn.close()
        results.sort(key=lambda x: -x["score"])
        return jsonify({"status": "success", "data": results, "next_round": next_round})
    except Exception as e:
        print(f"DEBUG: Predict Error -> {e}")
        return jsonify({"status": "error", "message": str(e)})


@app.route("/api/refresh")
def refresh_data():
    try:
        from fetch_results import fetch_and_update

        ok, total = fetch_and_update()
        if ok:
            with _analysis_cache_lock:
                _analysis_cache["data"] = None
                _analysis_cache["ts"] = 0
            return jsonify({"status": "success", "message": f"データ更新完了（{total}件）"})
        return jsonify({"status": "error", "message": "データ取得に失敗しました"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route("/api/correlation")
def correlation():
    conn = sqlite3.connect(DB_NAME)
    payload = correlation_api_payload(conn)
    conn.close()
    if payload is None:
        return jsonify({"status": "error"})
    return jsonify(payload)


@app.route("/api/cycles")
def cycles():
    conn = sqlite3.connect(DB_NAME)
    rows = conn.execute(
        "SELECT round, n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round ASC"
    ).fetchall()
    conn.close()
    return jsonify(cycles_api_payload(rows))


@app.route("/api/frequency-trend")
def frequency_trend():
    conn = sqlite3.connect(DB_NAME)
    rows = conn.execute(
        "SELECT n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round ASC"
    ).fetchall()
    conn.close()
    return jsonify(frequency_trend_payload(rows))


@app.route("/api/hit-check")
def hit_check():
    conn = sqlite3.connect(DB_NAME)
    preds = conn.execute(
        "SELECT predict_date, numbers, strategy, round_target FROM predictions ORDER BY id DESC LIMIT 100"
    ).fetchall()
    strategy_stats = {}
    results_list = []
    for pred_date, nums_str, strategy, target_round in preds:
        actual_row = conn.execute(
            "SELECT n1,n2,n3,n4,n5,n6,n7 FROM results WHERE round=?", (target_round,)
        ).fetchone()
        if not actual_row:
            continue
        pred_nums = set(int(x) for x in nums_str.split(",") if x.strip())
        actual_nums = set(actual_row)
        hits = pred_nums & actual_nums
        hit_count = len(hits)
        if strategy not in strategy_stats:
            strategy_stats[strategy] = {"total": 0, "hits": [0] * 8, "total_hit_nums": 0}
        strategy_stats[strategy]["total"] += 1
        strategy_stats[strategy]["hits"][hit_count] += 1
        strategy_stats[strategy]["total_hit_nums"] += hit_count
        results_list.append(
            {
                "date": pred_date,
                "strategy": strategy,
                "round": target_round,
                "predicted": sorted(pred_nums),
                "actual": sorted(actual_nums),
                "hits": sorted(hits),
                "hit_count": hit_count,
            }
        )
    conn.close()
    summary = []
    for strat, s in strategy_stats.items():
        avg_hits = round(s["total_hit_nums"] / s["total"], 2) if s["total"] > 0 else 0
        summary.append(
            {
                "strategy": strat,
                "predictions": s["total"],
                "avg_hits": avg_hits,
                "hit_distribution": s["hits"],
                "best_hit": max(i for i, v in enumerate(s["hits"]) if v > 0)
                if any(s["hits"])
                else 0,
            }
        )
    summary.sort(key=lambda x: -x["avg_hits"])
    return jsonify({"summary": summary, "recent": results_list[:20]})


@app.route("/api/ensemble")
def ensemble_predict():
    conn = sqlite3.connect(DB_NAME)
    draws = load_all_draws(conn)
    if not draws:
        conn.close()
        return jsonify(
            {
                "status": "error",
                "message": "過去抽選データがありません。データ取得を実行してください。",
            }
        )

    ss = sum_stats(draws)
    freq = frequency_map(draws)
    decay_w = decay_weights(draws, half_life=40)
    last_row = conn.execute(
        "SELECT round FROM results ORDER BY round DESC LIMIT 1"
    ).fetchone()
    next_round = (last_row[0] + 1) if last_row else 1

    ensemble_pick, sorted_nums, strat_weights, prefer_same = build_number_scores(
        conn, draws, ss, next_round
    )

    conf = calc_confidence(ensemble_pick, freq, ss, draws, decay_w)
    nums_str = ",".join(map(str, ensemble_pick))
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    conn.execute(
        "INSERT INTO predictions (predict_date, numbers, strategy, round_target) VALUES (?,?,?,?)",
        (ts, nums_str, ENSEMBLE_STRATEGY_NAME, next_round),
    )
    conn.execute(
        """DELETE FROM predictions WHERE id NOT IN (
        SELECT id FROM predictions ORDER BY id DESC LIMIT 320)"""
    )
    conn.commit()
    conn.close()

    overlap = len(set(ensemble_pick) & prefer_same)
    return jsonify(
        {
            "numbers": ensemble_pick,
            "confidence": min(conf + 5, 95),
            "next_round": next_round,
            "strategy_weights": {k: round(v, 3) for k, v in strat_weights.items()},
            "num_scores": {str(n): round(s, 2) for n, s in sorted_nums[:15]},
            "overlap_same_target": overlap,
            "saved_to_history": True,
        }
    )


if __name__ == "__main__":
    acquire_single_instance_or_exit()
    startup_data_load()
    print(
        f"[LOTO7] 予想スピード設定: ENSEMBLE_SAMPLES={default_ensemble_samples()}, "
        f"MAX_GEN_TRIES={default_max_gen_tries()}, ENSEMBLE_PICK_TRIALS={default_ensemble_pick_trials()} "
        "(環境変数 LOTO7_* で変更可)"
    )
    threading.Thread(
        target=_wait_for_server_and_open_browser, daemon=True
    ).start()
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
