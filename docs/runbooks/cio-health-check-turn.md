# 「チェックして」ターン — 標準チェーン（R33）

**制定**: 2026-06-13（浜田 GO）  
**位置づけ**: **インフラ・整合レーン** — 台帳 kintone 作成（項番 -0）とは **別**

---

## トリガー

浜田: ヘルスチェック / githubチェック / チェックして / 健康状況 / CI 確認 等

**R23**: 返答より **先に** 下記コマンドを実行。

---

## 標準チェーン（PowerShell）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run health-check
npm run verify:session-handoff-integrity -- --validate-export
npm run verify:win-hidden-spawn-hotpaths
npm run desktop:sync-and-verify
gh auth status
gh run list --limit 3
```

### NG 時

| 種別 | 対応 |
|------|------|
| 軽微（1 ファイル・検知ロジック） | **同一ターンで修正 + 再実行** |
| ahead / 未 commit | B1/B4 → push → 再チェーン |
| bridge gitHead | `npm run cio:session:export-handoff` → R31 参照 |
| PS フラッシュ（体感） | **止めずに** `windows-spawn-flash-triage.md` |

---

## 返答に含めるもの（R26）

- 各コマンド exit 結果（表可）
- 修正した file 1 行要約
- 残 NG と次に浜田判断が要る 1 点

## 返答に含めないもの

- 明日の台帳 GO / 第1手 / レーン宣言
- 改善案 R19–R33 を「明日やるリスト」化

---

## 関連

- `.cursor/rules/session-close-execute-first.mdc`
- `npm run verify:health-check-regression`（R30）
