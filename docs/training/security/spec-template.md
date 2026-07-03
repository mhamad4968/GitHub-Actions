# 情報セキュリティ勉強会 — 年度 spec テンプレート

**新年度着手時**: 本ファイルを `spec-YYYY.md` にコピーし、下表を埋める。

| 項目 | YYYY 年度の値 |
|------|----------------|
| 承認日 | |
| 実施期間 | 例: YYYY/7/15–12/15（各支店訪問） |
| テキスト時間 | 20 分 |
| 動画時間 | 20 分（別枠） |
| クイズ | Microsoft Forms（資料に含めない） |
| PPT スライド数 | 前年度 master をベース（2026=15） |
| Word 正本 | `masters/YYYY-security-training-distribution.docx` |
| PPT 正本 | `masters/YYYY-security-training-master.pptx` |

## 連絡先（資料に載せる文言）

- **正**: 「システム推進室へ連絡（社内掲示・マニュアル参照）」
- **禁止**: 個人の業務携帯・私的電話番号

## トピック（毎年見直し・バランス）

1. IPA 10 大脅威概観（**年度版の引用元を spec に明記**）
2. ランサムウェア
3. 偽セキュリティ警告（サポート詐欺）
4. AI 悪用標的型メール
5. 当社基本ルール・4 つの鉄則

## 動画 URL（年度ごとに差し替え可）

1. 
2. 
3. 

## 社内ルール（踏襲 unless 浜田 GO）

- LAN 切断を異常時初動に含める
- 私物 USB 禁止
- 公共フリー Wi-Fi 禁止
- 社内不正事例は載せない

## 資料種別

| 種別 | スライド数 | 用途 |
|------|-----------|------|
| Word | 章立て全文 | 配布・講師台本 |
| PPT | （前年度 master 枚数） | 投影 |

## AI 制作フロー（doc-lane）

1. 前年度 `masters/` を `output/` にコピーして編集開始
2. `npm run cio:pre-implement-gate`（D2: 年次・IPA・人事説明の盲点）
3. doc-lane PPTX MCP または python-pptx パッチ
4. 浜田 PowerPoint 目視 OK
5. `npm run security-training:sync-masters` → commit

正本 Runbook: `docs/runbooks/security-training-annual.md`
