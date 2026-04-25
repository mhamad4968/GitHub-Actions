# 📅 K-3 AGENTS.md リアルタイム編集監視 hook (TSB-017 防御)

**制定日**: 2026-04-25 (Sat) / TSB-017 (原因不明 AGENTS.md 編集) 直後の対応
**実装完了日**: **2026-04-25 11:35**（浜田 GO: K-3 本日前倒し / 当初予定 4/26 を前倒し）
**契機**: TSB-017 = §42-2-2 hash 監視は機能したが手動チェックでしか発見できない死角を露呈

## ✅ 実装サマリ（v23.5）

| 項目 | 実装 |
|---|---|
| 監視ロジック | 既存 `scripts/file-watcher.mjs` に憲法 5 ファイル SHA256 + 500ms debounce + 60s grace を追加 |
| ログ | `logs/file-watcher/agents-md-changes.jsonl`（1 行 1 イベント JSON） |
| 健康診断 | `scripts/health-check.mjs` **S16**（未稼働 = warn、ng ではない） |
| smoke | `scripts/rule-watcher-status.mjs` を第 7 検査として追加（exit 2 = warn） |
| 朝報 | `daily-morning-prep.mjs` **§5-5** 過去 24h 集計 |
| 憲法追記 | AGENTS.md §42-2-2 補完 + §51-3 段階 3 行 + 付則 v23.5 |

---

## 🎯 目的

AGENTS.md (および主要ルール 5 ファイル) の編集を **リアルタイム** で検知し、現セッション AI が編集していない場合は即座に警告する。

post-commit hook (I-9) は commit 後検知だが、TSB-017 は「working tree 段階」で発生 = commit 前死角。これを埋める。

---

## 📋 設計

### 既存基盤（実装方針どおり `fs.watch` 延長）

`scripts/file-watcher.mjs` は Node `fs.watch`（inotify）ベースで稼働中。**憲法 5 ファイル** に SHA256 変化検知を追加済み（`chokidar` 依存は追加していない）。

### 追加する動作

```javascript
watcher.on('change', (file) => {
  if (PROTECTED_FILES.includes(file)) {
    const newHash = sha256(file);
    const prevHash = readSessionHash(file);
    if (newHash !== prevHash) {
      // 1. logs/file-watcher/agents-md-changes.jsonl に追記
      // 2. 端末ベル + 標準エラー出力で即時警告
      // 3. AI セッション側に通知できる仕組みがあればそれも (今後検討)
    }
  }
});
```

### 対象ファイル

- `AGENTS.md` (最重要)
- `RULES-INDEX.md`
- `WORKFLOW.md`
- `CLAUDE.md`
- `kintone-apps.md`

### 警告条件

- ファイル mtime + sha256 hash が変わった
- かつ、**現セッションの AI がそのファイルを開いていない / 編集していない**（判定方法は要検討 / 簡易版は単に「変更時は常に警告」でも OK）

---

## ✅ 完了条件

1. `scripts/file-watcher.mjs` に AGENTS.md 系監視 + 警告ロジック追加
2. `logs/file-watcher/agents-md-changes.jsonl` 自動生成 (mtime / hash / pid 等記録)
3. 警告がうるさすぎない設定 (例: AI セッション開始から 60 秒以内の編集は AI 由来と推定 / debounce)
4. テスト: 別ターミナルから AGENTS.md を `echo X >> AGENTS.md` で編集 → 即時 stderr 警告が出ることを確認
5. README / AGENTS.md §42-2-2 に「リアルタイム監視機構あり」追記
6. cron の朝ブリーフィングに「直近 24h の AGENTS.md 編集回数」を追加

---

## ⚠️ リスク + 対策

- **リスク 中**: file watcher 自体が高頻度 I/O で CPU 食う可能性 → chokidar は inotify ベースなので軽量、debounce で十分
- **リスク 中**: 「AI が編集中」の判定が甘いと false positive 多発 → 段階導入 (まずは無条件警告 / その後賢く)
- **対策**: 1 週間試運用後、調整

---

## 🔗 関連

- 起源: TSB-017 (2026-04-25 11:03 検出)
- 関連基盤: scripts/file-watcher.mjs / git-hooks/post-commit
- 関連ルール: §42-2-2 hash 監視 / §51 並列禁止
- 補完関係: post-commit hook = commit 後検知 / 本案 = working tree 段階検知 → 2 段防御
