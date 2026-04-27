# 個人用出納（SQLite + Streamlit）

会社 kintone とは無関係。**この PC ローカル**の SQLite（`data/cashbook.db`）にだけ保存します。

## できること

| タブ | 用途 |
|------|------|
| **一覧（時系列）** | 支払日順の閲覧専用一覧。残金＝期首残金＋収入−支出の累計。 |
| **追加（都度）** | スーパー・通販・臨時入金など、**その都度**1件ずつ登録。 |
| **繰り返し（固定）** | 家賃・サブスクなど**同額が毎月／2か月ごとなど**続くものをルール化し、指定期間まで取引を一括生成。 |

- **銀行**: 初期は **みずほ** と **三井住友** の2口座。銀行ごとに期首残金・取引・残金が独立。
- **誤入力対策**: 一覧はセル編集なし。数字の変更はフォーム経由のみ。

## セットアップ

```bash
cd personal-cashbook
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

（`python3-venv` が無い環境では OS のパッケージで venv を入れてから実行してください。）

## 起動

```bash
streamlit run app.py
```

または（仮想環境に streamlit がある場合はそれを使う）:

```bash
chmod +x run.sh
./run.sh
```

初回起動で `data/cashbook.db` が作成されます。

### Windows からダブルクリック起動（WSL 利用時）

- **`start-from-windows.bat` は `app.py` と同じ `personal-cashbook` フォルダの中に置く**（フォルダ外にコピーしない）。
- デスクトップには **この bat へのショートカット**を作るとよいです（リンク先は `...\personal-cashbook\start-from-windows.bat`）。
- bat は **`wslpath`** で現在のフォルダを WSL 用パスに変換するので、デスクトップ以外の場所に置いても動きます。
- 起動しないとき: **既定の WSL** に `.venv` と同じ環境があるか確認（`wsl -l -v`）。別ディストリだけ使う場合は bat 内の `wsl.exe` を `wsl.exe -d ディストリ名` に変更してください。

## データの扱い

- **バックアップ**: `data/cashbook.db` をコピーするだけで丸ごと退避できます。
- **Git**: `data/*.db` は `.gitignore` で除外済み（履歴に載せない前提）。

## Excel の「一覧」との対応（意図）

- 列のイメージ: 支払日・摘要・収入・支出・残金。
- 時系列は支払日昇順で固定。残金は式ではなく計算表示。

## 依存

- Python 3.10+ 想定
- `requirements.txt`: Streamlit（pandas は Streamlit 経由で利用）
