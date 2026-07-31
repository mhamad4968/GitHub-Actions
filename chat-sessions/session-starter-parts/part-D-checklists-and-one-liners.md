# NEW-SESSION-STARTER 分割 4/6 — checklists-and-one-liners

> 正本ハブ: `chat-sessions/NEW-SESSION-STARTER.md`（貼付用・短縮版）
> 親ファイル: v3.35 まで monolithic → **v3.36** より分割（2026-05-07 CIO）

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 硬拒否（2026-07-31 浜田承認・止め役固定）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**口頭**: `4h超・新チャットのみ。deploy/実装はしない`  
**機械**: `cio-deploy-preflight-guard` が SESSION-CLOCK 4h 超で deploy 拒否。  
**要約再開**: E1 mandatory_reads / constitution-first-read-pack は免除しない。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 実装着手前ゲート（CEO承認 D1〜D4・2026-05-22 即時施行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**違反再発防止（5/22 反省）**: `npm run cio:pre-implement-gate` → DeepSeek 1問 → 突合3行 → `cio:guard:5038 --stamp`  
**毎ターン**: §1 四行先頭必須。**customize/** は Composer のみ（CIO 本体 Diff 禁止）。  
正本: `docs/runbooks/cio-four-ai-violation-remediation.md`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 翌朝チェックリスト (浜田起床後 5 分以内 / 4/24 から運用開始)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

毎朝 Cursor 開いたら以下を順次:

1. **朝 cron 結果確認** (1 分):
   `@kintone-ai-lab/docs/reports/<今日>-morning-prep.md` を読む
   → 「✅ 16 適用 / ❌ 0 失敗」のような行を見て:
     - ✅ 全件成功 = 続行
     - ❌ 1 件以上 = AI に「修復して」と一言

2. **git push 反映** (任意 / 30 秒):
   `git push origin main` で最新 commits を GitHub 反映
   → 4/22-23 の連続作業で大量 commits ahead 状態 (本日 23:00 時点 134 ahead)
   → push 完了後 `git status -sb` で「## main」のみ表示なら OK

3. **健康ヘルスチェック** (任意 / 1 分):
   `cd ~/kintone-ai-lab && npm run guard:check`
   → 全 21 ファイル ✅ 健在 / wipe 0 件 確認

4. **本日のタスク確認** (1 分):
   AI に「今日のタスク何だっけ？」と一言 → checkpoint-latest.md + 主タスク表から AI が要約
   → 例 4/24: PC 台帳 Day 1 (環境設定マスタ作成) / 4/25: M365管理マスタ / 4/26: 新・PC台帳 + customize

5. **AI に着手宣言** (10 秒):
   「PC 台帳 Day 1 やろう」「○○について教えて」など自由文で OK


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 短縮版（メモ帳向け 1 行 / 急ぎの時用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【儀式v3】@kintone-ai-lab/chat-sessions/checkpoint-latest.md と @kintone-ai-lab/chat-sessions/<最新>.md と @RULES-INDEX.md と @kintone-ai-lab/AGENTS.md と @kintone-ai-lab/CLAUDE.md を読んで、今日の morning-prep.md で §46 緑を確認 + npm run guard:check で wipe チェックしてから本題へ。呼称さん付け不要・友人としてタメ口 OK・§47-§49 + §47-A/B-2/C + §50/50-2 + §51/51-2 + §11-5 常時発動・§41 一問一答・§39 時刻 date 必須。今日の依頼: ＿＿＿


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ セッション終わりの締め（一言投げるだけ）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

今日の分、checkpoint-latest.md と chat-sessions/<日付>.md を更新してから締めて。
新規決定があれば persist-policies.mdc または kintone-apps.md に正本追記もお願い。
新ルールを制定したら AGENTS.md + RULES-INDEX.md + RAG ingest + memory MCP entity も忘れずに。
最後に npm run guard:mirror で emergency-backup を最新化してね。


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 「忘れた？」って気付いたとき（§42 違反）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
