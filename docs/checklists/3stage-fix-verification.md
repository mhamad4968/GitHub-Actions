# ✅ 修復系の段階的検証 3 段階チェックリスト（§11-5 準拠）

**制定**: 2026-04-25 (Sat) / B-2 タスク / §11-5（2026-04-23 制定）の正式雛形化
**根拠 TSB**: TSB-013 v1+v2（cron 環境の uv PATH 不足）/ TSB-007 ep5（auto-heal --omit=dev 自爆）

---

## 🎯 使い方

スクリプト / cron / MCP / 環境変数 等の修復後、「治った」と宣言する **前に** 本チェックリストを 3 段階すべて埋める。

> 重要原則: **「直接実 call OK ≠ 手動 script OK ≠ cron 実 OK」**
> 違反すると表層対策で終わる（v1 が表層 / v2 で真因に到達するパターン = TSB-013 系列）。

---

## 📋 チェックリスト本体（コピペして利用）

```
## 🩺 §11-5 段階的検証 3 段階レポート

**修復対象**: <スクリプト名 / MCP 名 / 環境変数名>
**修復内容**: <1 行サマリ>
**根本原因仮説**: <なぜこれで治ると考えるか / TSB 番号があれば併記>

### ① 直接実 call

- [ ] 実行コマンド: `<例: mcp_user-cve-search_status / kintone-get-app 等>`
- [ ] 実行時刻: `YYYY-MM-DDTHH:MM JST`
- [ ] 結果: ✅ / ⚠️ / ❌
- [ ] 出力ログ抜粋:
  ```text
  <stdout / stderr の決定的 1-3 行>
  ```
- [ ] 判定根拠: <なぜ ✅ と言えるか / 黒帯ヘッダ・期待 schema・特定 status code 等>

### ② 手動 script 実行

- [ ] 実行コマンド: `<例: node scripts/health-check.mjs / npm run kintone:test>`
- [ ] 実行時刻: `YYYY-MM-DDTHH:MM JST`
- [ ] 結果: ✅ / ⚠️ / ❌
- [ ] exit code: `0` / `1` / `2` / その他
- [ ] 出力ログ抜粋（特に異常検知部分）:
  ```text
  <総合: 正常 N / 異常 0 のサマリ行 + 関連 MCP 行>
  ```
- [ ] 判定根拠: <①と②の差分はなかったか / ① で見えなかった失敗が出てないか>

### ③ cron 実環境再現

- [ ] 再現コマンド: `env -i PATH=<cron PATH> HOME=<cron HOME> bash -c '<実 cron 行>'`
- [ ] 実行時刻: `YYYY-MM-DDTHH:MM JST`
- [ ] 結果: ✅ / ⚠️ / ❌
- [ ] cron 側で異なる PATH / HOME / TZ / lang / shell 起因の差分があったか:
  - [ ] PATH に `~/.local/bin` 入ってる / 入ってない
  - [ ] PATH に `~/.nvm/versions/node/<ver>/bin` 入ってる / 入ってない
  - [ ] HOME=`/home/<user>` 期待通り
  - [ ] TZ=`Asia/Tokyo` または UTC 想定通り
  - [ ] shell が bash か sh か（NVM `.bashrc` の有無で挙動変わる）
- [ ] 出力ログ抜粋:
  ```text
  <cron シミュレートで出た決定的 1-3 行>
  ```
- [ ] **cron 実走の次回時刻**: `YYYY-MM-DDTHH:MM JST` までに `logs/<cron-name>.log` を確認

### 🎯 完了判定

- [ ] ① ② ③ **すべて ✅** で初めて「治った」と宣言可
- [ ] 1 段階でも ⚠️/❌ なら **TSB v2 として真因再追跡** + チェックリスト埋め直し
- [ ] **§47 鵜呑み禁止**: 「動くはず」「環境同じはず」を信じず、必ず実証
- [ ] **§11-2 信頼度ラベル**: 3 段階完遂で 🟢 100% / 部分なら 🟡 70% 以下を申告
```

---

## 🚨 過去の失敗パターン（教訓）

### TSB-013 v1（2026-04-23 / 表層対策で終わった例）

- 修復: rag MCP の timeout を 30s → 60s に拡張
- ① 直接実 call: `mcp_user-rag_status` ✅ → 「治った」と宣言
- ② 手動 script: `node scripts/health-check.mjs` ✅ → 二重 OK で安心感
- ③ cron 実環境: **未実施**（手動でのみ確認 = 段階 ② で停止）
- 結果: 翌朝 cron 06:00 で再失敗 → 浜田から §47「100% 証明して」要求 → ③ で再現したら **真因 = cron 環境で uv が PATH not found** と判明 = v2 で `~/.local/bin` 追加で完全解決

**教訓**: ② で OK でも cron 実環境は **PATH / HOME / shell 完全別物**。③ を省略した時点で「v1 (表層対策)」確定。

### TSB-007 ep5（2026-04-23 / 3 段階完遂で根絶した例）

- 修復: `scripts/auto-heal.mjs` の `npm audit fix --omit=dev` から `--omit=dev` 削除（devDeps を勝手に prune する自爆）
- ① 直接実 call: `npm audit fix --audit-level=moderate` 単体実行 ✅
- ② 手動 script: `node scripts/auto-heal.mjs` 完走後に `node_modules/eslint/` 残存確認 ✅
- ③ cron 実環境: 4/23 20:43 の cron 実走後に `node_modules/eslint/` 残存確認 ✅
- 結果: 4 時間後の auto-heal cron でも eslint 消失なし = **3 段階完遂で完全解決**

---

## 🔧 cron 環境再現の補助コマンド集

### 現在の cron 設定確認

```bash
crontab -l
```

### cron が使う PATH の確認方法

cron は `/etc/environment` + `crontab` 内の `PATH=...` のみを使う（ログイン shell の `.bashrc` は読まない）。実際の PATH を取得：

```bash
# crontab に一時行を仕込む手法
* * * * * env > /tmp/cron-env.txt
# 1 分後
cat /tmp/cron-env.txt
```

または **cron 行頭に PATH を明示**して再現：

```bash
env -i \
  HOME=/home/mhamada202408224 \
  PATH="/usr/bin:/bin" \
  bash -c '<実 cron コマンド>'
```

### よくある cron 起因の差分

| 差分原因 | 症状 | 対策 |
|---|---|---|
| NVM の Node が PATH に無い | `node: command not found` | cron 行頭で `PATH="/home/<user>/.nvm/versions/node/v<X>/bin:$PATH"` 明示 |
| `uv` 等の `~/.local/bin` 配下 tool が無い | `uv: command not found` | cron 行頭で `PATH="$HOME/.local/bin:$PATH"` 明示 |
| TZ が UTC | ログ時刻ずれ / 日付計算バグ | cron 行頭で `TZ="Asia/Tokyo"` 明示 |
| HOME が異なる | `~/.config/<app>/` 読めない | cron 行頭で `HOME="/home/<user>"` 明示 |
| shell が `sh` | `[[ ... ]]` 等 bashism 失敗 | cron 行頭 `SHELL=/bin/bash` |

---

## 📚 関連ドキュメント

- `AGENTS.md §11-5` 修復系の段階的検証 3 段階フレームワーク
- `AGENTS.md §11-2` 信頼度ラベル必須化（4 段階）
- `AGENTS.md §47` 鵜呑み禁止（チェックリスト前提）
- `docs/troubleshooting.md` TSB-007 ep5 / TSB-013 v1+v2
- `docs/checklists/image-3timing.md` 画像表示系修正の 3 タイミング動作確認（§11-4 連動）
