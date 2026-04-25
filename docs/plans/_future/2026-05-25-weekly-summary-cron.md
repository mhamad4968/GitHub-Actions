# 📅 C-12 週次サマリ cron 新設 (毎週日曜 21:00)

**制定日**: 2026-04-25 (Sat) / J-シリーズ Tier C 登録
**実施予定日**: 2026-05-25 (Sun) 初回稼働
**契機**: 2026-04-25 浜田「妥協なく深く考えて今でできることはすべて」指示の Tier C リスト

---

## 🎯 目的

`chat-sessions/YYYY-MM-DD.md` を週次で集約し、`docs/reports/weekly/YYYY-MM-DD.md` として「今週何をやったか」を 1 ファイルにまとめる。

- 浜田が月曜朝に前週の成果をワンクリックで確認可能
- 翌週セッション開始時の AI が文脈把握しやすい
- 5月目標進捗 (#1〜#9) を週次で機械的に追跡

---

## 📋 設計

### スクリプト: `scripts/weekly-summary.mjs`

**入力**:
- `chat-sessions/YYYY-MM-DD.md` 直近 7 日分
- `logs/morning-prep/YYYY-MM-DD.md` 直近 7 日分
- `git log --since="7 days ago" --pretty=format:'%h %s'`
- `docs/troubleshooting.md` (新規 TSB の有無)

**処理**:
1. 7 日分の chat-sessions から `### HH:MM` 見出しを抽出 → タイムライン化
2. git log から commit 件数 + 主要 commit (BREAKING / FEAT) リスト化
3. 新規 TSB を検出 (id ベース diff)
4. ヘルススコア推移 (logs/morning-prep のメタ抽出)
5. markdown レポート生成 → `docs/reports/weekly/YYYY-MM-DD.md`

**出力例**:
```markdown
# 週次サマリ 2026-05-18 〜 2026-05-24

## ✅ 成果
- commit 28 件 (BREAKING 1 / FEAT 12 / FIX 8 / DOCS 7)
- 新規 TSB: 1 件 (TSB-017)
- 5月目標進捗: #1 ✅ 完 / #2 進行 / ...

## 📅 タイムライン
...

## 🩺 ヘルス推移
- 月: 22/22 / 火: 22/22 / ... / 日: 22/22
```

### cron 登録

```cron
0 21 * * 0  cd ~/kintone-ai-lab && PATH=... node scripts/weekly-summary.mjs >> logs/weekly-summary/$(date +\%Y-\%W).log 2>&1
```

---

## ✅ 完了条件

1. `scripts/weekly-summary.mjs` 新規 + 動作確認 (手動実行で先週分生成)
2. `logs/weekly-summary/` ディレクトリ作成 (`.gitignore` 既定対象)
3. `docs/reports/weekly/` ディレクトリ作成
4. crontab 登録 + バックアップ
5. README に「週次サマリは毎週日曜 21:00 に自動生成 → docs/reports/weekly/」追記
6. 初回 5/25 (Sun) 21:00 自動稼働を確認

---

## ⚠️ リスク + 対策

- **リスク 低**: 副作用は markdown 生成のみ / kintone API write なし / sudo 不要
- **対策**: §11-5 段階検証 (普通実行 / env -i / cron 環境再現) を実施

---

## 🔗 関連

- 起源: 2026-04-25 J-シリーズ Tier C
- 類似先例: monthly-security-rounds (S14) / daily-morning-prep
- 依存: なし
