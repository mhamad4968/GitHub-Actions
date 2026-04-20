---
description: WSL から Windows 用ファイル(.bat/.ps1/.cmd/.reg)を書くときの必須ルール
globs: "**/*.bat,**/*.cmd,**/*.ps1"
alwaysApply: false
---

# Windows 用ファイルを WSL から書くときの鉄則

## 1. Write ツール禁止（.bat / .cmd）

Cursor の Write / StrReplace ツールは **UTF-8 + LF** で保存する。
Windows CMD は **ASCII or CP932 + CRLF** が必須。LF だけだと構文解析が壊れる。

**必ず Shell で `printf` + `\r\n` を使って書く:**

```bash
printf '@echo off\r\necho Hello\r\n' > /mnt/c/path/to/script.bat
```

書いた後は `file script.bat` で `CRLF line terminators` を確認する。

## 2. バッチファイル内の日本語

- バッチファイルの `echo` 等に日本語を入れると、CP932 環境で文字化け or 構文エラーになる
- **バッチ本体は ASCII のみ**。日本語メッセージが必要なら Python 側で出力する

## 3. Windows CMD の `start` コマンド

| パターン | 動作 | 注意 |
|----------|------|------|
| `start "" /min python app.py` | 別窓(最小化)で起動 | 窓が増える |
| `start "" /b python app.py` | 同窓バックグラウンド | **リダイレクト `>` と併用不可**（start 自身に適用される） |
| `python app.py` | 同窓フォアグラウンド | **最もシンプルで確実** |

別窓を避けたいなら Python を**直接実行**し、ブラウザ自動起動は Python 側で行う。

## 4. テストはターゲット環境で

WSL の `python3` で動いても Windows の `python` で動くとは限らない。
Windows バッチの動作確認は `cmd.exe /c "..."` で行う。

## 5. 同じ失敗を繰り返さない

ファイルを書き直しても同じエラーが出たら、**表面の修正ではなく根本原因（エンコーディング、改行コード、パス）を疑う**。
