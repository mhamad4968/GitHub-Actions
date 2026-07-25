"""
ロト7 予想ロジック（戦略・アンサンブル・制約付きスコアリング）。

外部 LLM（DeepSeek 等）は呼ばない。7個の選出は本モジュールと loto7_stats のみ。
"""
from __future__ import annotations

import math
import os
import random
from collections import Counter

import numpy as np

from loto7_constants import (
    ALL_NUMBERS,
    ENSEMBLE_STRATEGY_NAME,
    PAST_SIGNAL_BLEND,
    PAST_SYNC_STRATEGY_NAME,
    POLAR_STRATEGY_NAME,
)
from loto7_stats import (
    empirical_decade_target_weights,
    empirical_min_draws,
    empirical_validate_bounds,
    frequency_map,
    gap_since_last,
    number_position_stats,
    pair_frequency,
    sum_stats,
)


def default_max_gen_tries():
    return max(80, int(os.environ.get("LOTO7_MAX_GEN_TRIES", "220")))


def default_ensemble_samples():
    return max(4, int(os.environ.get("LOTO7_ENSEMBLE_SAMPLES", "11")))


def default_ensemble_pick_trials():
    return max(1500, int(os.environ.get("LOTO7_ENSEMBLE_PICK_TRIALS", "5200")))


def default_ensemble_score_power():
    """1.0=従来どおり強い上位偏重。0.5〜0.85 程度でスコア差を圧縮し帯・番号の偏りを緩和。"""
    return max(0.35, min(1.0, float(os.environ.get("LOTO7_ENSEMBLE_SCORE_POWER", "0.68"))))


def default_ensemble_uniform_blend():
    """top_k 内での一様成分（0=オフ）。小さく足すと同点付近からの抜けが増える。"""
    return max(0.0, min(0.45, float(os.environ.get("LOTO7_ENSEMBLE_UNIFORM_BLEND", "0.14"))))


def default_ensemble_hot_damp():
    """頻度重視系戦略の1票あたり係数（<1 でホット偏重を緩和）。"""
    return max(0.55, min(1.0, float(os.environ.get("LOTO7_ENSEMBLE_HOT_DAMP", "0.86"))))


def default_ensemble_balance_boost():
    """総合バランス型の1票あたり係数。実績下位のため既定は抑制（旧1.12→0.52）。"""
    return max(0.35, min(1.35, float(os.environ.get("LOTO7_ENSEMBLE_BALANCE_BOOST", "0.52"))))


def default_ensemble_cold_boost():
    """コールド寄りの1票あたり係数。直近WFでは過剰強化を避け控えめに。"""
    return max(1.0, min(2.0, float(os.environ.get("LOTO7_ENSEMBLE_COLD_BOOST", "1.18"))))


def default_ensemble_polar_boost():
    """対極戦略の1票あたり係数。"""
    return max(0.8, min(1.8, float(os.environ.get("LOTO7_ENSEMBLE_POLAR_BOOST", "1.12"))))


def default_ensemble_pair_damp():
    """共起ペア軸の抑制係数（実績下位）。"""
    return max(0.15, min(1.0, float(os.environ.get("LOTO7_ENSEMBLE_PAIR_DAMP", "0.32"))))


def default_ensemble_position_damp():
    """ポジション分析の抑制係数（実績下位）。"""
    return max(0.15, min(1.0, float(os.environ.get("LOTO7_ENSEMBLE_POSITION_DAMP", "0.38"))))


def strategy_vote_priors():
    """
    経験的重みに掛ける事前係数（B: 下位戦略抑制・レジーム追従）。
    保存履歴ではコールド優勢だが、直近 walk-forward ではホット/トレンド優勢 → 過剰ブースト禁止。
    """
    return {
        "頻度重視（ホットナンバー）": float(os.environ.get("LOTO7_PRIOR_HOT", "1.08")),
        "減衰トレンド分析": float(os.environ.get("LOTO7_PRIOR_TREND", "1.18")),
        "総合バランス型": float(os.environ.get("LOTO7_PRIOR_BALANCE", "0.48")),
        "コールド寄り（低頻度）": float(os.environ.get("LOTO7_PRIOR_COLD", "1.12")),
        "共起ペア軸": float(os.environ.get("LOTO7_PRIOR_PAIR", "0.28")),
        "ポジション分析": float(os.environ.get("LOTO7_PRIOR_POSITION", "0.34")),
        PAST_SYNC_STRATEGY_NAME: float(os.environ.get("LOTO7_PRIOR_PAST", "1.10")),
        POLAR_STRATEGY_NAME: float(os.environ.get("LOTO7_PRIOR_POLAR", "1.08")),
        ENSEMBLE_STRATEGY_NAME: 1.0,
    }

def default_ensemble_history_blend():
    """履歴のアンサンブル7個だけを num_scores に追加混ぜする係数（0 でオフ）。"""
    return max(0.0, min(2.5, float(os.environ.get("LOTO7_ENSEMBLE_HISTORY_BLEND", "0.55"))))


def default_ensemble_history_lookback():
    """参照する過去アンサンブル予想の最大件数。"""
    return max(6, int(os.environ.get("LOTO7_ENSEMBLE_HISTORY_LOOKBACK", "48")))


def default_ensemble_history_decay():
    """履歴インデックスあたりの減衰（小さいほど直近だけ効く）。"""
    return max(18.0, float(os.environ.get("LOTO7_ENSEMBLE_HISTORY_DECAY", "52")))


def enrich_prediction_ss(draws, ss):
    """実測に基づく帯ターゲットと validate_pick 用境界を ss に付与（データ不足時は無変更）。"""
    out = dict(ss)
    if len(draws) < empirical_min_draws():
        return out
    out["decade_target"] = empirical_decade_target_weights(draws)
    vb = empirical_validate_bounds(draws, ss)
    if vb:
        out["validate_bounds"] = vb
    return out


def _ensemble_sample_weights(scores_vec: np.ndarray) -> np.ndarray:
    p = default_ensemble_score_power()
    b = default_ensemble_uniform_blend()
    w = np.maximum(scores_vec.astype(float), 1e-12) ** p
    w /= w.sum()
    if b > 0:
        u = np.full_like(w, 1.0 / len(w))
        w = (1.0 - b) * w + b * u
        w /= w.sum()
    return w


def decay_weights(draws, half_life=50):
    w = {n: 0.0 for n in ALL_NUMBERS}
    total = len(draws)
    for i, d in enumerate(draws):
        age = total - 1 - i
        decay = 2.0 ** (-age / half_life)
        for n in d:
            w[n] += decay
    return w


def decade_target():
    """静的な帯の期待比。実測連動は enrich_prediction_ss が ss['decade_target'] に入れる。"""
    return {"1-9": 1.7, "10-19": 1.9, "20-29": 1.9, "30-37": 1.5}


def weighted_pick(weights, k=7):
    nums = list(weights.keys())
    w = np.array([weights[n] for n in nums], dtype=float)
    w = np.maximum(w, 0.001)
    w /= w.sum()
    chosen = np.random.choice(nums, size=k, replace=False, p=w)
    return sorted(chosen.tolist())


def band_of(n):
    if n <= 9:
        return "1-9"
    if n <= 19:
        return "10-19"
    if n <= 29:
        return "20-29"
    return "30-37"


def band_chi_on_target(nums, decade_weights=None):
    bands = Counter(band_of(n) for n in nums)
    target = decade_weights if decade_weights is not None else decade_target()
    s = sum(target.values()) or 1.0
    chi = 0.0
    for b, t in target.items():
        obs = bands.get(b, 0)
        exp = 7.0 * t / s
        if exp > 1e-6:
            chi += (obs - exp) ** 2 / exp
    return chi


def gap_metrics(nums):
    gaps = [nums[i + 1] - nums[i] for i in range(6)]
    g_min, g_max = min(gaps), max(gaps)
    var_g = float(np.var(gaps))
    return gaps, g_min, g_max, var_g


def _effective_sum_std(sum_std):
    """std が 0 や極小のときの除算・許容帯の崩れを避ける（レビュー指摘）。"""
    return max(float(sum_std or 0), 8.0)


def validate_pick(nums, sum_mean, sum_std, bounds=None):
    """bounds が dict のとき sum/奇偶/高低/スプレッドの上下限を実測ベースで上書き（未指定キーは従来値）。"""
    b = bounds or {}
    s_std = _effective_sum_std(sum_std)
    sum_lo = float(b.get("sum_lo", sum_mean - 1.15 * s_std))
    sum_hi = float(b.get("sum_hi", sum_mean + 1.15 * s_std))
    s = sum(nums)
    if not (sum_lo <= s <= sum_hi):
        return False
    odds = sum(1 for n in nums if n % 2)
    odd_min = int(b.get("odd_min", 2))
    odd_max = int(b.get("odd_max", 5))
    if odds < odd_min or odds > odd_max:
        return False
    highs = sum(1 for n in nums if n >= 20)
    h_min = int(b.get("high_min", 2))
    h_max = int(b.get("high_max", 5))
    if highs < h_min or highs > h_max:
        return False
    bands = Counter(band_of(n) for n in nums)
    if any(v > 3 for v in bands.values()):
        return False
    if len(bands) < 3:
        return False
    spread = nums[-1] - nums[0]
    sp_min = float(b.get("spread_min", 16))
    sp_max = float(b.get("spread_max", 34))
    if spread < sp_min or spread > sp_max:
        return False
    consec = sum(1 for i in range(6) if nums[i + 1] - nums[i] == 1)
    if consec > 2:
        return False
    _, _g_min, g_max, _var_g = gap_metrics(nums)
    if g_max <= 4:
        return False
    return True


def generate_with_retry(
    weight_fn, sum_mean, sum_std, max_tries=None, bounds=None, decade_tgt=None
):
    if max_tries is None:
        max_tries = default_max_gen_tries()
    dec = decade_tgt if decade_tgt is not None else decade_target()
    best, best_score = None, -1
    for _ in range(max_tries):
        nums = weight_fn()
        if not validate_pick(nums, sum_mean, sum_std, bounds):
            continue
        s = sum(nums)
        z = abs(s - sum_mean) / _effective_sum_std(sum_std)
        score = max(0, 10 - z * 3)
        odds = sum(1 for n in nums if n % 2)
        score += 3 if 3 <= odds <= 4 else 1
        bands = Counter(band_of(n) for n in nums)
        for b, t in dec.items():
            score += max(0, 2 - abs(bands.get(b, 0) - t))
        score += max(0, 6 - band_chi_on_target(nums, dec))
        _, _, _, var_g = gap_metrics(nums)
        score += min(4, var_g * 0.45)
        if score > best_score:
            best, best_score = nums, score
    return best if best else weight_fn()


def _vb_dt(ss):
    return ss.get("validate_bounds"), ss.get("decade_target")


def strategy_hot(draws, ss):
    freq = frequency_map(draws)
    vb, dt = _vb_dt(ss)
    return generate_with_retry(
        lambda: weighted_pick(freq), ss["mean"], ss["std"], bounds=vb, decade_tgt=dt
    )


def strategy_trend(draws, ss):
    dw = decay_weights(draws, half_life=30)
    vb, dt = _vb_dt(ss)
    return generate_with_retry(
        lambda: weighted_pick(dw), ss["mean"], ss["std"], bounds=vb, decade_tgt=dt
    )


def strategy_balanced(draws, ss):
    freq = frequency_map(draws)
    decay = decay_weights(draws, half_life=40)
    gaps = gap_since_last(draws)
    max_f = max(freq.values()) or 1
    max_d = max(decay.values()) or 1
    max_g = max(gaps.values()) or 1
    hybrid = {
        n: (freq[n] / max_f) * 0.32 + (decay[n] / max_d) * 0.38 + (gaps[n] / max_g) * 0.30
        for n in ALL_NUMBERS
    }
    vb, dt = _vb_dt(ss)
    return generate_with_retry(
        lambda: weighted_pick(hybrid), ss["mean"], ss["std"], bounds=vb, decade_tgt=dt
    )


def strategy_pair_boost(draws, ss):
    pairs = pair_frequency(draws, 10)
    decay = decay_weights(draws, half_life=40)
    if len(pairs) < 3:
        return strategy_hot(draws, ss)
    top3 = [list(p) for p, _ in pairs[:3]]

    def pick():
        base = random.choice(top3)
        rest_w = {n: decay[n] for n in ALL_NUMBERS if n not in base}
        r = weighted_pick(rest_w, k=5)
        return sorted(base + r)

    vb, dt = _vb_dt(ss)
    return generate_with_retry(pick, ss["mean"], ss["std"], bounds=vb, decade_tgt=dt)


def strategy_position(draws, ss):
    pos = number_position_stats(draws)
    decay = decay_weights(draws, half_life=40)
    if len(pos) < 7:
        return strategy_hot(draws, ss)

    def pick():
        chosen = []
        used = set()
        for p in pos:
            lo = max(1, int(p["mean"] - 1.2 * p["std"]))
            hi = min(37, int(p["mean"] + 1.2 * p["std"]))
            cands = {n: decay[n] for n in range(lo, hi + 1) if n not in used}
            if not cands:
                cands = {n: decay[n] for n in ALL_NUMBERS if n not in used}
            nums_list = list(cands.keys())
            w = np.array([cands[n] for n in nums_list], dtype=float)
            w = np.maximum(w, 0.001)
            w /= w.sum()
            pick_n = np.random.choice(nums_list, p=w)
            chosen.append(int(pick_n))
            used.add(int(pick_n))
        return sorted(chosen)

    vb, dt = _vb_dt(ss)
    return generate_with_retry(pick, ss["mean"], ss["std"], bounds=vb, decade_tgt=dt)


def strategy_cold(draws, ss):
    """低頻度寄りの重みでホット一極を薄める（validate は実測境界に追従）。"""
    freq = frequency_map(draws)
    max_f = max(freq.values()) or 1
    inv = {n: (max_f - float(freq[n]) + 4.0) ** 1.12 for n in ALL_NUMBERS}
    vb, dt = _vb_dt(ss)
    return generate_with_retry(
        lambda: weighted_pick(inv), ss["mean"], ss["std"], bounds=vb, decade_tgt=dt
    )


def strategy_polar(draws, ss):
    """
    対極（ホット×コールド）: 低頻度から 3〜4 個、高頻度から残りを採る。
    平均化で両極端が消えるのを防ぐ（C / DeepSeek 盲点3）。
    """
    freq = frequency_map(draws)
    max_f = max(freq.values()) or 1
    hot_w = {n: float(freq[n]) + 0.35 for n in ALL_NUMBERS}
    cold_w = {n: (max_f - float(freq[n]) + 4.0) ** 1.12 for n in ALL_NUMBERS}

    def pick():
        # 直近WFではコールド過多が弱い → 2〜3個に抑える
        n_cold = 2 if random.random() < 0.55 else 3
        cold_pick = weighted_pick(cold_w, k=n_cold)
        rest = {n: hot_w[n] for n in ALL_NUMBERS if n not in cold_pick}
        hot_pick = weighted_pick(rest, k=7 - n_cold)
        return sorted(cold_pick + hot_pick)

    vb, dt = _vb_dt(ss)
    return generate_with_retry(pick, ss["mean"], ss["std"], bounds=vb, decade_tgt=dt)


STRATEGIES = [
    (
        "頻度重視（ホットナンバー）",
        strategy_hot,
        "過去全回の出現頻度が高い数字に重みを付けて抽選。最も出やすい数字を狙う王道戦略。",
    ),
    (
        "減衰トレンド分析",
        strategy_trend,
        "直近の回ほど重みが大きい指数減衰モデル。最近の傾向変化を鋭敏に捉える。",
    ),
    (
        "総合バランス型",
        strategy_balanced,
        "出現頻度 + 減衰トレンド + 出現間隔の3軸ハイブリッド。減衰・間隔の比重をやや強化。",
    ),
    (
        "コールド寄り（低頻度）",
        strategy_cold,
        "全期間で出にくい番号へやや強い重み。アンサンブルのホット一極を抑える補助軸。",
    ),
    (
        POLAR_STRATEGY_NAME,
        strategy_polar,
        "低頻度帯から2〜3個・高頻度帯から残りを採る対極戦略。平均化で両端が消えるのを防ぐ。",
    ),
    (
        "共起ペア軸",
        strategy_pair_boost,
        "出現頻度TOP3ペアからランダムに軸を選び、減衰重みで残りを補完。相性を活用。",
    ),
    (
        "ポジション分析",
        strategy_position,
        "第1〜第7数字の各ポジション範囲内で減衰重み抽選。構造的な偏りを活用する精密戦略。",
    ),
]

def past_prediction_weight_map(conn, next_round, limit=280):
    rows = conn.execute(
        "SELECT numbers, strategy, round_target FROM predictions ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    wmap = {n: 0.0 for n in ALL_NUMBERS}
    if not rows:
        return wmap
    for idx, (nums_str, strat, target) in enumerate(rows):
        recency = math.exp(-idx / 85.0)
        try:
            tgt = int(target)
        except (TypeError, ValueError):
            tgt = next_round
        try:
            pred = {int(x) for x in nums_str.split(",") if x.strip()}
        except ValueError:
            continue
        row_w = recency * (1.55 if tgt == next_round else 1.0)
        actual = conn.execute(
            "SELECT n1,n2,n3,n4,n5,n6,n7 FROM results WHERE round=?", (tgt,)
        ).fetchone()
        if actual:
            hit_ct = len(pred & set(actual))
            row_w *= 0.52 + 0.48 * (hit_ct / 7.0)
        ens = 1.12 if strat == ENSEMBLE_STRATEGY_NAME else 1.0
        for n in pred:
            wmap[n] += row_w * ens
    return wmap


def ensemble_history_weight_map(conn, next_round, limit=None):
    """
    アンサンブルAI として保存された7個だけを時系列で重み付け。
    次回以降の build_number_scores で num_scores に上乗せする（1口運用は変えない）。
    """
    if limit is None:
        limit = default_ensemble_history_lookback()
    decay_idx = default_ensemble_history_decay()
    rows = conn.execute(
        """SELECT numbers, round_target FROM predictions
           WHERE strategy = ?
           ORDER BY id DESC LIMIT ?""",
        (ENSEMBLE_STRATEGY_NAME, limit),
    ).fetchall()
    wmap = {n: 0.0 for n in ALL_NUMBERS}
    if not rows:
        return wmap
    for idx, (nums_str, target) in enumerate(rows):
        recency = math.exp(-idx / decay_idx)
        try:
            tgt = int(target)
        except (TypeError, ValueError):
            tgt = next_round
        try:
            pred = {int(x) for x in nums_str.split(",") if x.strip()}
        except ValueError:
            continue
        row_w = recency * (1.62 if tgt == next_round else 1.0)
        actual = conn.execute(
            "SELECT n1,n2,n3,n4,n5,n6,n7 FROM results WHERE round=?", (tgt,)
        ).fetchone()
        if actual:
            hit_ct = len(pred & set(actual))
            row_w *= 0.48 + 0.52 * (hit_ct / 7.0)
        for n in pred:
            wmap[n] += row_w
    return wmap


def same_target_round_union(conn, next_round):
    u = set()
    rows = conn.execute(
        "SELECT numbers FROM predictions WHERE round_target=?", (next_round,)
    ).fetchall()
    for (nums_str,) in rows:
        try:
            u.update(int(x) for x in nums_str.split(",") if x.strip())
        except ValueError:
            continue
    return u


def strategy_past_votes(conn, next_round, draws, ss):
    wfu = past_prediction_weight_map(conn, next_round)
    decay = decay_weights(draws, half_life=38)
    md = max(decay.values()) or 1.0
    mx = max(wfu.values()) or 1.0
    hybrid = {n: 0.62 * (wfu[n] / mx) + 0.38 * (decay[n] / md) for n in ALL_NUMBERS}
    vb, dt = _vb_dt(ss)
    return generate_with_retry(
        lambda: weighted_pick(hybrid), ss["mean"], ss["std"], bounds=vb, decade_tgt=dt
    )


def extended_strategies(conn, next_round):
    past_row = (
        PAST_SYNC_STRATEGY_NAME,
        lambda d, s: strategy_past_votes(conn, next_round, d, s),
        "過去にこのアプリが提案した番号（同一目標回を強調）と減衰トレンドを合成。",
    )
    return list(STRATEGIES) + [past_row]


def all_strategy_names():
    return [name for name, _, _ in STRATEGIES] + [
        PAST_SYNC_STRATEGY_NAME,
        ENSEMBLE_STRATEGY_NAME,
    ]


def pick_ensemble_numbers(num_scores, ss, prefer_numbers, max_trials=None):
    if max_trials is None:
        max_trials = default_ensemble_pick_trials()
    prefer_numbers = set(prefer_numbers)
    ordered = sorted(num_scores.keys(), key=lambda n: -num_scores[n])
    order_idx = {n: i for i, n in enumerate(ordered)}
    top_k = ordered[: min(28, len(ordered))]
    if len(top_k) < 7:
        return sorted(ordered[:7])
    w_raw = np.array([max(num_scores[n], 1e-9) for n in top_k], dtype=float)
    w = _ensemble_sample_weights(w_raw)
    rng = np.random.default_rng()
    best_pick, best_key = None, None
    vb = ss.get("validate_bounds")
    dec = ss.get("decade_target")
    for _ in range(max_trials):
        pick = sorted(rng.choice(top_k, size=7, replace=False, p=w).tolist())
        if not validate_pick(pick, ss["mean"], ss["std"], vb):
            continue
        pref = len(set(pick) & prefer_numbers)
        tot = sum(num_scores[n] for n in pick)
        chi = band_chi_on_target(pick, dec)
        rank_div = sum(order_idx[n] for n in pick)
        _, _, _, var_g = gap_metrics(pick)
        # 帯バランス（低い chi）を最優先。次にスコア順位の分散（同 χ 帯での偏り緩和）。pref はその後。
        key = (-chi, rank_div, pref, tot, var_g)
        if best_key is None or key > best_key:
            best_key = key
            best_pick = pick
    if best_pick is not None:
        return best_pick
    ensemble_pick = sorted(ordered[:7])
    for _ in range(160):
        if validate_pick(ensemble_pick, ss["mean"], ss["std"], vb):
            return ensemble_pick
        pool = ordered[:15]
        ensemble_pick = sorted(random.sample(pool, 7))
    return sorted(ordered[:7])


def calc_confidence(nums, freq, ss, draws, decay_w):
    total = len(draws)
    if total == 0:
        return 50
    max_freq = max(freq.values()) or 1
    freq_score = sum(freq.get(n, 0) / max_freq for n in nums) / 7 * 25

    max_dw = max(decay_w.values()) or 1
    trend_score = sum(decay_w.get(n, 0) / max_dw for n in nums) / 7 * 15

    s = sum(nums)
    z = abs(s - float(ss["mean"])) / _effective_sum_std(ss.get("std", 0))
    sum_score = max(0, 20 - z * 8)

    odds = sum(1 for n in nums if n % 2)
    oe_score = 10 if 3 <= odds <= 4 else 6 if 2 <= odds <= 5 else 0

    highs = sum(1 for n in nums if n >= 20)
    hl_score = 10 if 3 <= highs <= 4 else 6 if 2 <= highs <= 5 else 0

    spread = nums[-1] - nums[0]
    spread_score = 10 if 20 <= spread <= 33 else 6 if 15 <= spread <= 35 else 2

    bands = Counter(band_of(n) for n in nums)
    dec = ss.get("decade_target") or decade_target()
    band_score = sum(max(0, 2.5 - abs(bands.get(b, 0) - t)) for b, t in dec.items())
    chi = band_chi_on_target(nums, dec)
    balance_penalty = max(0, 5.5 - chi * 0.65)
    _, _, _, var_g = gap_metrics(nums)
    spread_gap_score = min(6, var_g * 0.55)

    raw = (
        freq_score
        + trend_score
        + sum_score
        + oe_score
        + hl_score
        + spread_score
        + band_score
        + balance_penalty
        + spread_gap_score
    )
    return min(95, max(30, round(raw)))


def compute_strategy_weights(conn):
    """的中履歴から戦略名→重み（平均当たり数の正規化）× 事前係数。"""
    hit_data = {}
    preds_db = conn.execute(
        "SELECT numbers, strategy, round_target FROM predictions"
    ).fetchall()
    for nums_str, strat, target in preds_db:
        actual = conn.execute(
            "SELECT n1,n2,n3,n4,n5,n6,n7 FROM results WHERE round=?", (target,)
        ).fetchone()
        if not actual:
            continue
        pred_set = set(int(x) for x in nums_str.split(",") if x.strip())
        hits = len(pred_set & set(actual))
        if strat not in hit_data:
            hit_data[strat] = {"total": 0, "total_hits": 0}
        hit_data[strat]["total"] += 1
        hit_data[strat]["total_hits"] += hits

    priors = strategy_vote_priors()
    strat_weights = {}
    for name in all_strategy_names():
        if name in hit_data and hit_data[name]["total"] > 0:
            base = hit_data[name]["total_hits"] / hit_data[name]["total"]
        else:
            # 新戦略（対極など）はコールド近傍の初期値
            base = 1.20 if name == POLAR_STRATEGY_NAME else 1.0
        strat_weights[name] = base * float(priors.get(name, 1.0))
    total_w = sum(strat_weights.values()) or 1
    return {k: v / total_w for k, v in strat_weights.items()}


def _strategy_vote_damp(name: str) -> float:
    """1票あたりの追加減衰／強化（B）。"""
    damp = 1.0
    hd = default_ensemble_hot_damp()
    if "頻度" in name or "ホット" in name:
        damp *= hd
    if "バランス" in name:
        damp *= default_ensemble_balance_boost()
    if "コールド" in name:
        damp *= default_ensemble_cold_boost()
    if "対極" in name:
        damp *= default_ensemble_polar_boost()
    if "ペア" in name:
        damp *= default_ensemble_pair_damp()
    if "ポジション" in name:
        damp *= default_ensemble_position_damp()
    return damp


def build_number_scores(conn, draws, ss, next_round):
    """アンサンブル用の各番号スコア（浮動小数）。"""
    ss = enrich_prediction_ss(draws, dict(ss))
    strat_weights = compute_strategy_weights(conn)
    past_signal = past_prediction_weight_map(conn, next_round)
    max_past = max(past_signal.values()) or 1.0

    num_scores = {n: 0.0 for n in ALL_NUMBERS}
    n_samples = default_ensemble_samples()
    for name, fn, _ in extended_strategies(conn, next_round):
        w = strat_weights.get(name, 0.12) * _strategy_vote_damp(name)
        if w < 0.015:
            continue
        # 下位戦略はサンプル回数も減らしてノイズ混入を抑制
        samples = n_samples
        if "ペア" in name or "ポジション" in name:
            samples = max(2, n_samples // 3)
        elif "バランス" in name:
            samples = max(3, n_samples // 2)
        elif "コールド" in name or "対極" in name:
            samples = n_samples + 2
        for _ in range(samples):
            nums = fn(draws, ss)
            for n in nums:
                num_scores[n] += w

    for n in ALL_NUMBERS:
        num_scores[n] += PAST_SIGNAL_BLEND * (past_signal[n] / max_past)

    ehb = default_ensemble_history_blend()
    if ehb > 0:
        ens_hist = ensemble_history_weight_map(conn, next_round)
        max_eh = max(ens_hist.values()) or 1.0
        for n in ALL_NUMBERS:
            num_scores[n] += ehb * (ens_hist[n] / max_eh)

    sorted_nums = sorted(num_scores.items(), key=lambda x: -x[1])
    prefer_same = same_target_round_union(conn, next_round)
    ensemble_pick = pick_ensemble_numbers(num_scores, ss, prefer_same)
    return ensemble_pick, sorted_nums, strat_weights, prefer_same
