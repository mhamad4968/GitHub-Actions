# -*- coding: utf-8 -*-
"""
LOTO7 walk-forward 診断レポート（B）。

- look-ahead 禁止: 予想生成は当該回より前の抽選のみ使用
- KPI: 平均一致数 / P(k>=3) / P(k>=4) / P(k>=5)
- ボーナス番号は DB に無いため本数字一致のみ（2等は評価対象外）
- 保存済み predictions に依存せず、戦略を都度再生成（過学習回避）

使い方:
  python backtest_report.py
  python backtest_report.py --last 80 --seed 42
"""
from __future__ import annotations

import argparse
import os
import random
import sqlite3
import sys
from collections import defaultdict

_BASE = os.path.dirname(os.path.abspath(__file__))
if _BASE not in sys.path:
    sys.path.insert(0, _BASE)

from loto7_constants import (  # noqa: E402
    ENSEMBLE_STRATEGY_NAME,
    RANDOM_EXPECTED_HITS,
)
from loto7_predict import (  # noqa: E402
    STRATEGIES,
    build_number_scores,
    enrich_prediction_ss,
)
from loto7_stats import load_all_draws, sum_stats  # noqa: E402

DB_PATH = os.path.join(_BASE, "loto7_advanced.db")


def _hits(pred, actual) -> int:
    return len(set(pred) & set(actual))


def _pct(xs, pred) -> float:
    if not xs:
        return 0.0
    return 100.0 * sum(1 for x in xs if pred(x)) / len(xs)


def run_walk_forward(draws, last_n: int, seed: int, include_ensemble: bool):
    """
    draws[i] を評価対象とするとき、訓練は draws[:i] のみ。
    i は max(min_train, len-last_n) から len-1 まで。
    """
    random.seed(seed)
    try:
        import numpy as np

        np.random.seed(seed)
    except Exception:
        pass

    min_train = 80
    start = max(min_train, len(draws) - last_n)
    rows = []  # (round_index_1based_approx, name, hits)

    # round numbers: assume contiguous from DB order; use index+offset if needed
    for i in range(start, len(draws)):
        train = draws[:i]
        actual = draws[i]
        ss = enrich_prediction_ss(train, sum_stats(train))
        for name, fn, _ in STRATEGIES:
            pred = fn(train, ss)
            rows.append((i + 1, name, _hits(pred, actual)))

        if include_ensemble:
            # メモリ DB（過去予想なし）でアンサンブル投票だけ評価
            mem = sqlite3.connect(":memory:")
            mem.execute(
                "CREATE TABLE predictions (id INTEGER PRIMARY KEY, numbers TEXT, "
                "strategy TEXT, round_target INT)"
            )
            mem.execute(
                "CREATE TABLE results (round INT, n1 INT, n2 INT, n3 INT, n4 INT, "
                "n5 INT, n6 INT, n7 INT)"
            )
            # results は参照されない経路もあるが、空で可
            next_round = i + 1
            pick, _, _, _ = build_number_scores(mem, train, ss, next_round)
            mem.close()
            rows.append((i + 1, ENSEMBLE_STRATEGY_NAME, _hits(pick, actual)))

    return rows


def summarize(rows):
    by = defaultdict(list)
    for _, name, h in rows:
        by[name].append(h)
    out = []
    for name, hs in by.items():
        out.append(
            {
                "strategy": name,
                "n": len(hs),
                "avg": sum(hs) / len(hs),
                "p3": _pct(hs, lambda h: h >= 3),
                "p4": _pct(hs, lambda h: h >= 4),
                "p5": _pct(hs, lambda h: h >= 5),
                "vs_random": (sum(hs) / len(hs)) - RANDOM_EXPECTED_HITS,
            }
        )
    out.sort(key=lambda r: (-r["p4"], -r["avg"]))
    return out


def main():
    ap = argparse.ArgumentParser(description="LOTO7 walk-forward report")
    ap.add_argument("--last", type=int, default=60, help="評価する直近回数（既定60）")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument(
        "--no-ensemble",
        action="store_true",
        help="アンサンブル評価を省略（高速）",
    )
    args = ap.parse_args()

    if not os.path.exists(DB_PATH):
        print(f"DB not found: {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    draws = load_all_draws(conn)
    latest = conn.execute("SELECT MAX(round) FROM results").fetchone()[0]
    conn.close()

    print("=== LOTO7 walk-forward report ===")
    print(f"draws={len(draws)} latest_round={latest}")
    print(f"window=last {args.last}  seed={args.seed}")
    print(f"random_E≈{RANDOM_EXPECTED_HITS:.3f}  KPI=P(k>=4) / avg hits")
    print("(bonus球はDBに無いため本数字一致のみ。2等は評価対象外)")
    print()

    rows = run_walk_forward(
        draws,
        last_n=args.last,
        seed=args.seed,
        include_ensemble=not args.no_ensemble,
    )
    summary = summarize(rows)

    print(f"{'avg':>6} {'Δrand':>7} {'P≥3%':>7} {'P≥4%':>7} {'P≥5%':>7} {'n':>4}  strategy")
    for r in summary:
        print(
            f"{r['avg']:6.3f} {r['vs_random']:+7.3f} {r['p3']:6.1f}% {r['p4']:6.1f}% "
            f"{r['p5']:6.1f}% {r['n']:4d}  {r['strategy']}"
        )

    # 保存済み predictions の参考（look-ahead ではない実績ログ）
    conn = sqlite3.connect(DB_PATH)
    stored = conn.execute(
        "SELECT p.strategy, p.numbers, r.n1,r.n2,r.n3,r.n4,r.n5,r.n6,r.n7 "
        "FROM predictions p JOIN results r ON r.round=p.round_target"
    ).fetchall()
    conn.close()
    if stored:
        by = defaultdict(list)
        for strat, nums, *rn in stored:
            pred = {int(x) for x in nums.split(",") if x.strip()}
            by[strat].append(len(pred & set(rn)))
        print()
        print("--- stored predictions (reference, not walk-forward) ---")
        for strat, hs in sorted(by.items(), key=lambda kv: -sum(kv[1]) / len(kv[1])):
            avg = sum(hs) / len(hs)
            print(
                f"{avg:6.3f}  P≥4={_pct(hs, lambda h: h >= 4):5.1f}%  n={len(hs):3d}  {strat}"
            )


if __name__ == "__main__":
    main()
