# 🪦 Synthesis Graveyard (Negative Log Archives)

重要判断で**棄却された案**の永続記録。AGENTS.md **§54-2** 「不作為の記録」で規定。  
（本ディレクトリ内の旧条文名 **§53-7** への言及は、2026-04-24 時点の**歴史的アーカイブ**として残っている場合があります。現行の運用は §54-2 に従ってください。）

## 構造

| ディレクトリ | 内容 | 保存期間 |
|---|---|---|
| `<日付>/` | 日付別個別ファイル | 直近 3 ヶ月 |
| `summaries/<年月>.md` | 期限切れの月次集約 (要約化) | 永続 |
| `permanent/` | BREAKING 級議論の棄却案 | 永続 (削除禁止) |

## ファイル命名規則

`<日付>/<トピック ID>.md` または `<日付>/<トピック ID>-<連番>.md`

## 振り返り方

### A. RAG 検索 (推奨)

```bash
npm run rag:query "<検索クエリ>"
# 例: "過去棄却案 best-of-n", "Negative Log scope"
```

### B. 月次自動レビュー (S20 自動化後 / 4/27 適用予定)

毎月 1 日 21:00 cron で `rag:query` を自動実行 → 翌月の計画・憲法レビュー冒頭に提示

### C. 手動 grep

```bash
grep -r "<キーワード>" docs/archives/synthesis-graveyard/
```

## 重要原則 (§54-2-1)

**メイン AI** がテンプレに従い棄却案を記録し commit する。事後の虚偽差し替えは §47 違反。

## 関連

- AGENTS.md §54 (自己統治能力)
- 制定経緯: `docs/archives/synthesis-graveyard/2026-04-24/section-54-design-debate.md`

---

**初期化日**: 2026-04-24 20:25  
**最終更新**: 2026-04-25（§54-2 運用をメイン AI 記録に統一 / [BREAKING] v22）
