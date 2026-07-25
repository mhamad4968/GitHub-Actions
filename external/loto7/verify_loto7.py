"""軽いインポート・統計・検証のスモークテスト（CI や手元確認用）。"""
import os
import random
import sys

# スクリプトのあるディレクトリを import パスに
_BASE = os.path.dirname(os.path.abspath(__file__))
if _BASE not in sys.path:
    sys.path.insert(0, _BASE)


def main():
    import ai_server  # noqa: F401
    from loto7_predict import (
        enrich_prediction_ss,
        ensemble_history_weight_map,
        strategy_polar,
        validate_pick,
    )
    from loto7_stats import cycles_api_payload, frequency_trend_payload, sum_stats

    ss0 = sum_stats([])
    assert ss0["mean"] == 133.0 and ss0["std"] >= 8.0
    assert cycles_api_payload([]) == {"cycles": {}, "most_overdue": [], "most_regular": []}
    ft = frequency_trend_payload([])
    assert ft["trend"] == [] and ft["window"] == 30

    # 極小 std でも例外にならず bool が返ること
    assert isinstance(validate_pick([1, 2, 3, 4, 5, 6, 7], 28.0, 0.0), bool)
    nums = [3, 7, 12, 18, 22, 28, 33]
    assert isinstance(validate_pick(nums, ss0["mean"], ss0["std"]), bool)

    rnd = random.Random(42)
    fake_draws = [sorted(rnd.sample(range(1, 38), 7)) for _ in range(50)]
    ss_e = enrich_prediction_ss(fake_draws, sum_stats(fake_draws))
    assert "decade_target" in ss_e and isinstance(ss_e["decade_target"], dict)

    polar = strategy_polar(fake_draws, ss_e)
    assert len(polar) == 7 and len(set(polar)) == 7
    assert all(1 <= n <= 37 for n in polar)

    import sqlite3

    mem = sqlite3.connect(":memory:")
    mem.execute(
        "CREATE TABLE predictions (id INTEGER PRIMARY KEY, numbers TEXT, strategy TEXT, round_target INT)"
    )
    eh = ensemble_history_weight_map(mem, 99, limit=10)
    assert isinstance(eh, dict) and len(eh) == 37
    mem.close()

    print("verify_loto7: OK")


if __name__ == "__main__":
    main()
