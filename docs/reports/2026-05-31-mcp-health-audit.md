# MCP 死活監査レポート — 2026-05-31

**実施**: CIO（Opus）  
**相談**: DeepSeek §50-3-8（盲点・触らない範囲）、Kimi（Tier 分類レビュー）  
**方針**: 安全性最優先・**構成変更なし**（Tier A のみ）

---

## 1. 総合判定

**問題なし — 全ゲート合格。** 実運用上の MCP は正常。唯一の「SKIP」は `cio:mcp:env:extended` の `markdownify` で、Windows 上 npx プローブを意図的に除外（TSB-029）。`health-check` では WSL 直起動経由で **initialize OK**。

---

## 2. ゲート結果

| コマンド | 結果 |
|----------|------|
| `npm run health-check` | 32/32 OK、100%、skip 2（figma/mintlify url-only） |
| `npm run cio:mcp:env` | SUMMARY OK 6/6 |
| `npm run cio:mcp:gate` | OK — `jbis-kintone.cybozu.com`、Space 48 HTTP 200 JSON |
| `npm run cio:mcp:env:extended` | OK 8/9、SKIP 1（markdownify / TSB-029） |
| `npm run verify:cio-mcp-registry` | 24 servers、必須 CIO 名 OK |
| `npm run verify:mcp-four-ai-alignment` | OK |
| `npm run verify:cursor-mcp-windows` | OK |
| `npm run mcp-status:refresh-usage --dry-run` | 表変更 0 |
| `npm run cio:env:enhance --quick` | OK |

---

## 3. AIチーム意見交換

### DeepSeek §50-3-8（盲点）

- **型整合**: skip サーバー（figma/mintlify）の参照漏れに注意 → 現状 registry/verify で整合済み
- **SPEC 乖離**: dry-run 変更 0 は憲法上「スキップ可」と解釈
- **差異ロジック**: markdownify の Windows SKIP は OS 分岐として正；Linux/WSL では通常起動

**触らない（合意）**

1. `cio:mcp:gate` の 6/6 ロジック
2. `verify:mcp-four-ai-alignment` のマトリクス
3. kintone Space 48 JSON / テナント設定

### Kimi（Tier 分類）

- **Tier A GO**: 監査記録・台帳更新・リスク明文化
- **Tier B 保留**: `mcp.json` 変更、`npx @latest` 一括更新

---

## 4. 最適化判断（本ターン）

| 項目 | 判断 | 理由 |
|------|------|------|
| `mcp.json` 編集 | **見送り** | 全 initialize OK・Tier B |
| `@kintone/mcp-server@latest` 更新 | **見送り** | gate 緑・破壊的変更リスク |
| `markdownify` extended SKIP | **維持** | TSB-029 恒久対策と一致 |
| `mcp-status:refresh-usage` 実書き込み | **不要** | dry-run 変更 0 |
| 台帳 `docs/mcp-status.md` | **更新** | 月次健康診断相当 |

---

## 5. O-3 パッケージ監視

```
@kintone/mcp-server          1.4.0
@iflow-mcp/markdownify-mcp   0.0.2  (pin 一致)
@colorsandfonts/mcp          1.1.0  (pin 一致)
@eslint/mcp                  0.3.6
@andredezzy/deep-directory-tree-mcp  1.0.1
```

**npx @latest リスク順（高→低）**: figma remote / kintone 公式 / markdownify（preinstall 問題）/ eslint-mcp / colors-fonts（pin 済）

---

## 6. 定例運用（変更なし）

```text
日常       npm run cio:mcp:env
Composer前 npm run cio:mcp:env:extended
週次       npm run cio:mcp:gate
金曜反省後 npm run mcp-status:refresh-usage
環境増強   npm run cio:env:enhance
```

正本: `docs/plans/2026-05-17-mcp-optimization-plan.md`
