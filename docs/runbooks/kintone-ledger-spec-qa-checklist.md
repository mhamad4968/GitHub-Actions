# 台帳 SPEC — GO 前 Q&A チェックリスト（R19）

**制定**: 2026-06-13（浜田 GO）  
**関門**: **いかなる kintone 台帳 SPEC も「仕様確定 GO」の前に本書を完走**

正本 SPEC 例:

- `docs/plans/2026-06-13-software-ledger-kintone-spec.md`
- `docs/plans/2026-06-13-storage-media-ledger-kintone-spec.md`

---

## 必須 6 項目（すべて YES で GO）

| # | 確認項目 | YES の定義 |
|---|----------|------------|
| 1 | **対象範囲** | 何を台帳化するか（媒体種別・ライセンス種別等）が列挙済み |
| 2 | **1 レコード粒度** | 物理 1 件 / 割当 1 件 等が明記 |
| 3 | **識別子** | スロット方式・必須スロット・id_kind 選択肢が確定 |
| 4 | **595 連携** | emp_id / user_name / dept 等の必須と picker 方式 |
| 5 | **一覧・印刷** | **支店/営業所フィルタ**・**社員単位リスト**・**印刷ヘッダ** が SPEC に明記（F2 再発防止） |
| 6 | **廃止/削除** | ライフサイクル（利用中/廃止/delete 条件）が確定 |

---

## AI 手順

1. 浜田と Q&A — **上表を口頭で埋める前に本ファイルを Read**  
2. 回答を SPEC §0 または §付録「Q&A 確定表」に反映  
3. 浜田 **「SPEC GO」** の文言を SPEC 状態行に記録  
4. **同日** `docs/plans/*-spec.md` を commit（R24）

**禁止**: フィールド表だけ先に書いて ⑤ を後追い（F2）。

---

## 機械検査

```powershell
npm run verify:kintone-ledger-spec-qa
```

（SPEC 冒頭に本 runbook 参照行があるか）

---

## 関連

- `creation-timing-ask.mdc` — kintone **作成** GO は SPEC GO の後
