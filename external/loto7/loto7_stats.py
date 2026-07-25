"""
過去抽選データの集計・分析（予想エンジンからも利用）。
Flask 非依存。DB 接続は呼び出し側が渡す。
"""
import os
from collections import Counter

import numpy as np
import pandas as pd

from loto7_constants import ALL_NUMBERS


def load_all_draws(conn):
    rows = conn.execute(
        "SELECT n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round ASC"
    ).fetchall()
    return [list(r) for r in rows]


def frequency_map(draws):
    cnt = Counter()
    for d in draws:
        cnt.update(d)
    return {n: cnt.get(n, 0) for n in ALL_NUMBERS}


def recent_frequency(draws, window=20):
    recent = draws[-window:] if len(draws) >= window else draws
    cnt = Counter()
    for d in recent:
        cnt.update(d)
    return {n: cnt.get(n, 0) for n in ALL_NUMBERS}


def gap_since_last(draws):
    gaps = {}
    total = len(draws)
    for n in ALL_NUMBERS:
        last_seen = -1
        for i in range(total - 1, -1, -1):
            if n in draws[i]:
                last_seen = i
                break
        gaps[n] = (total - 1 - last_seen) if last_seen >= 0 else total
    return gaps


def pair_frequency(draws, top_n=15):
    cnt = Counter()
    for d in draws:
        for i in range(len(d)):
            for j in range(i + 1, len(d)):
                cnt[(d[i], d[j])] += 1
    return cnt.most_common(top_n)


def number_position_stats(draws):
    if not draws:
        return []
    arr = np.array(draws)
    stats = []
    for i in range(7):
        col = arr[:, i]
        stats.append(
            {
                "pos": i + 1,
                "mean": round(float(np.mean(col)), 1),
                "std": round(float(np.std(col)), 1),
                "min": int(np.min(col)),
                "max": int(np.max(col)),
            }
        )
    return stats


def sum_stats(draws):
    """抽選が0件のときは NaN を避け、ロト7らしい既定の合計レンジを返す。"""
    if not draws:
        return {
            "mean": 133.0,
            "std": 20.0,
            "min": 28,
            "max": 217,
            "median": 133.0,
            "recent5": [],
        }
    sums = [sum(d) for d in draws]
    return {
        "mean": round(float(np.mean(sums)), 1),
        "std": max(round(float(np.std(sums)), 1), 0.01),
        "min": int(np.min(sums)),
        "max": int(np.max(sums)),
        "median": round(float(np.median(sums)), 1),
        "recent5": sums[-5:] if len(sums) >= 5 else sums,
    }


def empirical_min_draws():
    """帯・検証境界の実測推定に必要な最低抽選数。"""
    return max(25, int(os.environ.get("LOTO7_EMPIRICAL_MIN_DRAWS", "42")))


def _band_counts_aggregated(draws):
    counts = {"1-9": 0, "10-19": 0, "20-29": 0, "30-37": 0}
    for d in draws:
        for n in d:
            if n <= 9:
                counts["1-9"] += 1
            elif n <= 19:
                counts["10-19"] += 1
            elif n <= 29:
                counts["20-29"] += 1
            else:
                counts["30-37"] += 1
    return counts


def empirical_decade_target_weights(draws):
    """
    各番号帯の実測出現割合（全抽選の合計から）を、静的 decade 期待にブレンドした重み。
    band_chi / 信頼度計算で使う（合計は 7 に正規化）。
    """
    static = {"1-9": 1.7, "10-19": 1.9, "20-29": 1.9, "30-37": 1.5}
    if len(draws) < empirical_min_draws():
        return dict(static)
    blend_s = max(0.0, min(0.65, float(os.environ.get("LOTO7_DECADE_BLEND_STATIC", "0.30"))))
    cnt = _band_counts_aggregated(draws)
    tot = float(sum(cnt.values())) or 1.0
    emp = {b: 7.0 * cnt[b] / tot for b in static}
    mix = {b: blend_s * static[b] + (1.0 - blend_s) * emp[b] for b in static}
    s = sum(mix.values()) or 1.0
    scaled = {b: 7.0 * mix[b] / s for b in static}
    for b in static:
        scaled[b] = max(1.05, min(2.85, scaled[b]))
    s2 = sum(scaled.values()) or 1.0
    return {b: round(7.0 * scaled[b] / s2, 4) for b in static}


def empirical_validate_bounds(draws, ss):
    """
    過去実績の分位と sum_stats のガウス帯の併用で validate_pick 用の緩い箱を返す。
    データ不足時は None（従来の固定閾値）。
    """
    if len(draws) < empirical_min_draws():
        return None
    sums = np.array([sum(d) for d in draws], dtype=float)
    odds = np.array([sum(1 for n in d if n % 2) for d in draws], dtype=float)
    highs = np.array([sum(1 for n in d if n >= 20) for d in draws], dtype=float)
    spreads = np.array([max(d) - min(d) for d in draws], dtype=float)

    mean = float(ss["mean"])
    s_std = max(float(ss.get("std", 0) or 0), 8.0)
    g_lo = mean - 1.15 * s_std
    g_hi = mean + 1.15 * s_std
    sum_lo = min(g_lo, float(np.percentile(sums, 7.0)))
    sum_hi = max(g_hi, float(np.percentile(sums, 93.0)))
    sum_lo = max(28.0, sum_lo)
    sum_hi = min(245.0, sum_hi)
    if sum_hi - sum_lo < 18.0:
        sum_lo, sum_hi = g_lo - 3.0, g_hi + 3.0
        sum_lo = max(28.0, sum_lo)
        sum_hi = min(245.0, sum_hi)

    odd_lo = int(np.floor(np.percentile(odds, 8.0)))
    odd_hi = int(np.ceil(np.percentile(odds, 92.0)))
    odd_lo = max(2, min(odd_lo, 5))
    odd_hi = min(5, max(odd_hi, 2))
    if odd_lo > odd_hi:
        odd_lo, odd_hi = 2, 5

    high_lo = int(np.floor(np.percentile(highs, 8.0)))
    high_hi = int(np.ceil(np.percentile(highs, 92.0)))
    high_lo = max(2, min(high_lo, 5))
    high_hi = min(5, max(high_hi, 2))
    if high_lo > high_hi:
        high_lo, high_hi = 2, 5

    sp_lo = float(np.percentile(spreads, 7.0))
    sp_hi = float(np.percentile(spreads, 93.0))
    sp_lo = max(14.0, min(sp_lo, 23.0))
    sp_hi = min(37.0, max(sp_hi, 26.0))
    if sp_hi - sp_lo < 9.0:
        sp_lo, sp_hi = 16.0, 33.0

    return {
        "sum_lo": float(sum_lo),
        "sum_hi": float(sum_hi),
        "odd_min": odd_lo,
        "odd_max": odd_hi,
        "high_min": high_lo,
        "high_max": high_hi,
        "spread_min": sp_lo,
        "spread_max": sp_hi,
    }


def odd_even_stats(draws):
    counts = [sum(1 for n in d if n % 2) for d in draws]
    dist = Counter(counts)
    return {k: dist.get(k, 0) for k in range(8)}


def high_low_stats(draws):
    counts = [sum(1 for n in d if n >= 20) for d in draws]
    dist = Counter(counts)
    return {k: dist.get(k, 0) for k in range(8)}


def consecutive_stats(draws):
    total = len(draws)
    has_consec = sum(
        1 for d in draws if any(d[i + 1] - d[i] == 1 for i in range(6))
    )
    return round(has_consec / total * 100, 1) if total else 0


def decade_distribution(draws):
    bands = {"1-9": 0, "10-19": 0, "20-29": 0, "30-37": 0}
    total = 0
    for d in draws:
        for n in d:
            total += 1
            if n <= 9:
                bands["1-9"] += 1
            elif n <= 19:
                bands["10-19"] += 1
            elif n <= 29:
                bands["20-29"] += 1
            else:
                bands["30-37"] += 1
    if total > 0:
        return {k: round(v / total * 100, 1) for k, v in bands.items()}
    return bands


def build_full_analysis(draws):
    freq = frequency_map(draws)
    rec_freq = recent_frequency(draws, 20)
    gaps = gap_since_last(draws)
    ss = sum_stats(draws)
    oe = odd_even_stats(draws)
    hl = high_low_stats(draws)
    consec_pct = consecutive_stats(draws)
    pairs = pair_frequency(draws, 10)
    pos_stats = number_position_stats(draws)
    decades = decade_distribution(draws)

    sorted_by_freq = sorted(freq.items(), key=lambda x: -x[1])
    hot = [{"num": n, "count": c} for n, c in sorted_by_freq[:10]]
    cold = [{"num": n, "count": c} for n, c in sorted_by_freq[-10:]]

    sorted_by_gap = sorted(gaps.items(), key=lambda x: -x[1])
    overdue = [{"num": n, "gap": g} for n, g in sorted_by_gap[:10]]

    sorted_by_recent = sorted(rec_freq.items(), key=lambda x: -x[1])
    trending = [{"num": n, "count": c} for n, c in sorted_by_recent[:10]]

    return {
        "hot": hot,
        "cold": cold,
        "overdue": overdue,
        "trending": trending,
        "sum_stats": ss,
        "odd_even": oe,
        "high_low": hl,
        "consecutive_pct": consec_pct,
        "top_pairs": [{"pair": list(p), "count": c} for p, c in pairs],
        "position_stats": pos_stats,
        "decade_distribution": decades,
        "total_draws": len(draws),
    }


def correlation_api_payload(conn):
    df = pd.read_sql_query(
        "SELECT n1,n2,n3,n4,n5,n6,n7 FROM results ORDER BY round ASC", conn
    )
    if len(df) < 10:
        return None
    presence = pd.DataFrame(0, index=range(len(df)), columns=range(1, 38))
    for idx, row in df.iterrows():
        for v in row:
            presence.at[idx, int(v)] = 1
    corr = presence.corr()
    top_pos, top_neg = [], []
    for i in range(1, 38):
        for j in range(i + 1, 38):
            val = round(float(corr.at[i, j]), 3)
            entry = {"a": i, "b": j, "r": val}
            top_pos.append(entry)
            top_neg.append(entry)
    top_pos.sort(key=lambda x: -x["r"])
    top_neg.sort(key=lambda x: x["r"])
    return {
        "top_positive": top_pos[:15],
        "top_negative": top_neg[:15],
        "matrix_sample": {
            str(i): {str(j): round(float(corr.at[i, j]), 2) for j in range(1, 38)}
            for i in range(1, 38)
        },
    }


def cycles_api_payload(rows):
    """rows: list of (round, n1..n7) from SQLite."""
    if not rows:
        return {"cycles": {}, "most_overdue": [], "most_regular": []}
    cycle_data = {}
    for n in ALL_NUMBERS:
        appearances = [r[0] for r in rows if n in r[1:8]]
        if len(appearances) < 2:
            continue
        gaps = [
            appearances[i + 1] - appearances[i]
            for i in range(len(appearances) - 1)
        ]
        avg_gap = round(np.mean(gaps), 1)
        std_gap = round(np.std(gaps), 1)
        last_seen = rows[-1][0] - appearances[-1]
        due_score = round((last_seen - avg_gap) / std_gap, 1) if std_gap > 0 else 0
        cycle_data[n] = {
            "avg_gap": avg_gap,
            "std_gap": std_gap,
            "current_gap": last_seen,
            "due_score": due_score,
            "min_gap": int(np.min(gaps)),
            "max_gap": int(np.max(gaps)),
        }
    sorted_due = sorted(cycle_data.items(), key=lambda x: -x[1]["due_score"])
    return {
        "cycles": {str(k): v for k, v in cycle_data.items()},
        "most_overdue": [{"num": k, **v} for k, v in sorted_due[:10]],
        "most_regular": sorted(
            [{"num": k, **v} for k, v in cycle_data.items()],
            key=lambda x: x["std_gap"],
        )[:10],
    }


def frequency_trend_payload(rows):
    """rows: rows of 7 ints (n1..n7) per draw, oldest first."""
    window = 30
    track_nums = [3, 7, 14, 21, 28, 33, 37]
    if len(rows) < window:
        return {"trend": [], "tracked_numbers": track_nums, "window": window}
    trend = []
    for start in range(0, len(rows) - window + 1, 5):
        chunk = rows[start : start + window]
        freq = Counter()
        for r in chunk:
            freq.update(r)
        point = {"x": start + window}
        for n in track_nums:
            point[str(n)] = freq.get(n, 0)
        trend.append(point)
    return {"trend": trend, "tracked_numbers": track_nums, "window": window}
