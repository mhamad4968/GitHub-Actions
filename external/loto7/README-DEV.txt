LOTO7 app — developer note (Cursor / AI 改修時)

==============================================



1) 本リポ（*.py / index.html 等）を**改修するとき**

   - Cursor 上の担当 AI に、**編集に入る前または同一ターンの早い段階**で、

     **DeepSeek 等をセカンドオピニオン**として使わせる（盲点・反例・データ/API 取り扱いの見落とし）。

     組織ルールの「知恵袋へ1問」と同趣旨でよい。MCP 名は環境に合わせる。

   - これは **IDE（Cursor）からの MCP 等**であり、**本アプリの画面・Flask からは外部 LLM を呼ばない**。



2) レビュー反映メモ（空 DB・同時アクセス）

   - sum_stats([]) は NaN にならない既定値。cycles / frequency-trend は行数不足で空ペイロード。

   - validate_pick / calc_confidence は合計 std の下限で帯・スコアが崩れないようにしている。

   - /api/predict・/api/ensemble は抽選 0 件なら JSON エラー（index 側もメッセージ表示）。

   - /api/analysis のキャッシュ更新は threading.Lock で囲む。

   - 手元確認: python verify_loto7.py

3) アンサンブル偏りのチューニング（任意・環境変数）
   - LOTO7_ENSEMBLE_SCORE_POWER（既定 0.68）: 1 に近いほどスコア上位を強く採用、小さくすると top_k 内が平坦に近づく。
   - LOTO7_ENSEMBLE_UNIFORM_BLEND（既定 0.14）: top_k 内一様乱数の混ぜ比（0〜0.45）。
   - LOTO7_ENSEMBLE_HOT_DAMP（既定 0.86）: 「頻度重視（ホット）」系の投票係数。
   - LOTO7_ENSEMBLE_BALANCE_BOOST（既定 0.52）: 「総合バランス型」の投票係数（旧1.12強化は撤回）。
   - LOTO7_ENSEMBLE_PICK_TRIALS / LOTO7_ENSEMBLE_SAMPLES は従来どおり。

4) 実績連動（帯・検証境界・コールド戦略）
   - 抽選本数が LOTO7_EMPIRICAL_MIN_DRAWS（既定 42）以上のとき、過去データから帯の期待比を推定し ss['decade_target'] に格納（静的期待と LOTO7_DECADE_BLEND_STATIC でブレンド）。
   - 同条件で validate_pick 用の合計・奇偶・高低・スプレッドの許容を分位ベースで ss['validate_bounds'] に付与（従来ガウス帯と併用で広がりすぎを抑制）。
   - 戦略に「コールド寄り（低頻度）」を追加。予測・アンサンブルは enrich_prediction_ss 経由で上記を反映。

5) アンサンブル履歴の再利用（1口運用はそのまま）
   - predictions 内 strategy=アンサンブルAI の行だけを減衰付きで集約し、build_number_scores の num_scores に上乗せ。
   - LOTO7_ENSEMBLE_HISTORY_BLEND（既定 0.55、0 で無効）、LOTO7_ENSEMBLE_HISTORY_LOOKBACK、LOTO7_ENSEMBLE_HISTORY_DECAY で調整。
   - 全戦略共通の過去シグナル（PAST_SIGNAL_BLEND）とは別チャネル（アンサンブル寄りの継続性用）。

6) 2026-07-25 B+C 改善（KPI=平均一致数 / P(k≥4)、1等・2等は非KPI）
   - 目標賞を2等にしない（本数字6+ボーナスは1等級に希少。DBにボーナス列も無い）。
   - B: アンサンブル投票を実績連動＋事前係数で再設計。
     ペア・ポジション・バランスは抑制。コールドは保存履歴では強いが直近WFでは過剰になり得るため
     **控えめ強化**（ホット/トレンドも併用）。旧バランス強化（BALANCE_BOOST>1）は撤回。
   - C: 新戦略「対極（ホット×コールド）」= 低頻度から2〜3個＋高頻度から残り。
   - 診断: `python backtest_report.py`（walk-forward・過去データのみ・look-ahead禁止）。
     例: `python backtest_report.py --last 60 --seed 42`
   - データ更新: `python fetch_results.py`（2026-07-25 時点で第687回まで取込済）。
   - 追加 env: LOTO7_ENSEMBLE_COLD_BOOST / POLAR_BOOST / PAIR_DAMP / POSITION_DAMP、
     LOTO7_PRIOR_*（HOT/TREND/BALANCE/COLD/PAIR/POSITION/PAST/POLAR）。
   - LOTO7_ENSEMBLE_BALANCE_BOOST 既定は 0.52（旧1.12の強化は廃止）。
   - アプリ反映: `start_app.bat` で再起動（稼働中なら一度止めてから）。

