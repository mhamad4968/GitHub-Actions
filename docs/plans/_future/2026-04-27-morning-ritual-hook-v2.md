# 🔌 Cursor Hook 段階 2: sessionStart hook で morning-prep 自動 Read

**制定日**: 2026-04-23 (Thu)  
**実施予定日**: 2026-04-27 (Sun) 以降 / 4/26 customize Day 完了後  
**契機**: 浜田 2026-04-23 23:00 改善案 #4 承認 / 朝の儀式自動化強化  
**ベース**: 既存 Cursor Hook 段階 1 (commit `d413c3a` / 4/22 制定)

---

## 🎯 目的

**Cursor 起動時に最新の `docs/reports/<今日>-morning-prep.md` を AI が自動 Read する**ことで、浜田の手動操作 (新セッション開始時に儀式テンプレ貼付 → 朝ブリーフィング読込) を削減し、§42 過去ログ確認義務を hook で自動保証する。

## 📋 現状 (4/23 時点)

- 朝の儀式: 浜田が新チャットに `NEW-SESSION-STARTER.md` (フル版) コピペ → AI が手動で morning-prep.md を Read
- 浜田負担: コピペ 1 回 + AI への確認待ち
- 抜け漏れリスク: 浜田が忙しいと儀式スキップ → §42 違反 → AI が「忘れた？」反応

## 🆕 sessionStart hook 段階 2 設計

### 動作
1. Cursor がセッション開始 (新チャット起動 or 復帰)
2. `~/.cursor/hooks/sessionStart.sh` 自動実行
3. スクリプトが今日の `docs/reports/<日付>-morning-prep.md` を AI コンテキストに injection
4. AI が「今日のブリーフィングを読み込みました。健康状態 N/N」と自動宣言してから本題へ

### 実装ファイル
- `~/.cursor/hooks/sessionStart.sh` (新規)
- 内容:
  ```bash
  #!/usr/bin/env bash
  TODAY=$(date '+%Y-%m-%d')
  MORNING_PREP=/home/mhamada202408224/kintone-ai-lab/docs/reports/${TODAY}-morning-prep.md
  if [ -f "$MORNING_PREP" ]; then
    echo "<context>"
    echo "本日 ($TODAY) の朝ブリーフィング (sessionStart hook で自動投入):"
    cat "$MORNING_PREP"
    echo "</context>"
  else
    echo "<context>本日の朝ブリーフィング ($MORNING_PREP) は未生成 (cron 06:00 待ち or 失敗)</context>"
  fi
  ```

### Cursor 設定変更
- `~/.cursor/settings.json` に hook 登録
  ```json
  {
    "hooks": {
      "sessionStart": "~/.cursor/hooks/sessionStart.sh"
    }
  }
  ```

## 🚦 段階導入

| 段階 | 内容 | 実施日 |
|---|---|---|
| 段階 1 (4/22 完了) | Cursor Hook 化チェックリスト + L3 操作ガード (commit `d413c3a`) | 完了 |
| **段階 2 (本文書)** | sessionStart hook で morning-prep 自動 Read | **4/27 以降** |
| 段階 3 (5/22+) | sessionEnd hook で checkpoint 自動更新 + guard:mirror 自動実行 | 5/22+ |

## 🚨 リスク + 対策

| リスク | 対策 |
|---|---|
| morning-prep が大きすぎて context 溢れる | 先頭 200 行に制限 (`head -200 $MORNING_PREP`) |
| hook 実行時に sleep / 起動遅延 | timeout 5s + 失敗時 stderr メッセージ表示 |
| Cursor 仕様変更 (hook API 変化) | 公式 docs で動作確認後実施 (5/15 までに調査) |

## ✅ 完了判定

- [ ] Cursor 公式 hook ドキュメント参照 + 動作確認
- [ ] `~/.cursor/hooks/sessionStart.sh` 作成 + chmod +x
- [ ] `~/.cursor/settings.json` に hook 登録
- [ ] Cursor 再起動 → 新チャット起動 → AI が「ブリーフィング読み込みました」自動宣言確認
- [ ] morning-prep が context に正しく injection されてることを目視確認

## 🔗 関連

- 改善案 #4 (浜田 2026-04-23 23:00 承認)
- 改善案 #1 hooks 段階 1 (4/22 制定 / commit `d413c3a`)
- AGENTS.md §42 セッション冒頭の過去ログ確認義務
- AGENTS.md §46 朝ルーチン絶対優先義務
- NEW-SESSION-STARTER.md v3 (現状の手動儀式)

## 📅 schedule

- **4/27 (日) 以降**: PC 台帳 customize Day 完了後の安定期で実施
- **5/15 までに**: Cursor 公式 hook docs 調査完了
- **段階 3 検討**: 5/22+ で sessionEnd hook
