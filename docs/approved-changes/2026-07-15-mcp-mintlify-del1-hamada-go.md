# 2026-07-15 — mintlify DEL-1 浜田追認 GO（P3 CLOSED）

> 浜田「AIチームが削除で問題ないと判断したなら対応してよい」  
> **cyber-news / Cold / 736 は触っていない**

## AIチーム判定

| 役割 | 判定 |
|------|------|
| 事実確認 | user/repo `mcp.json` · overlay · manifest — **mintlify 不在** · 台帳 26 本 |
| `verify:mcp-deleted-refs` | OK（active refs なし） |
| DeepSeek | 削除 GO 方向 · triggers「削除予定」残渣を指摘 |
| Kimi | 不在なら証跡・台帳更新が本分 |
| **CIO** | **RESIDUAL_CLEANUP + 追認 CLOSED**（再削除対象なし · 再注入防止を実施） |

## 本日実施

1. `mcp-server-use-triggers.mdc` … **削除済** + 再追加禁止
2. `repo-mcp-overlays.mjs` … △10 警告コメント（mintlify を overlay に戻さない）
3. `docs/mcp-status.md` … enhance overlay 説明から mintlify 除去
4. 統廃合 spec §10 P3 … **CLOSED** 記録
5. §8.3 ゲート再実行 · `cio:mcp:gate` · overlay 再適用（再注入されないこと）

## 浜田作業（§8.2 #1）

**Cursor: Developer: Reload Window** 後、任意で `npm run cio:mcp:gate` を再確認。

## ロールバック

`%USERPROFILE%\.cursor\mcp.json.bak-overlay-*` および Git 履歴から復元可。  
復活させる場合は **浜田 GO + overlay 非掲載のまま手動追加は非推奨**（△10）。
