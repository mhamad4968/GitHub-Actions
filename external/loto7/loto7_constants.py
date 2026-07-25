"""Loto7 アプリ共通定数（DB 戦略名・番号レンジ）。"""

ALL_NUMBERS = list(range(1, 38))

ENSEMBLE_STRATEGY_NAME = "アンサンブルAI"
PAST_SYNC_STRATEGY_NAME = "過去予想シンク"
POLAR_STRATEGY_NAME = "対極（ホット×コールド）"

# アンサンブルで過去予想シグナルを混ぜる係数（loto7_predict で使用）
PAST_SIGNAL_BLEND = 3.2

# ランダム7口の期待一致数 E[|A∩B|] = 7*(7/37)
RANDOM_EXPECTED_HITS = 7.0 * 7.0 / 37.0
