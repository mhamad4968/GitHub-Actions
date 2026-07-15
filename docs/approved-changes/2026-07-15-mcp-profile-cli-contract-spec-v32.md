# 2026-07-15 — cio:mcp:profile CLI 契約（仕様 v3.2）

> 浜田「仕様修正、コミット→PUSH」  
> 実装本体は `1a149537` 済 · 本変更は **統廃合spec / triggers への正本追記**

## 仕様（確定）

`--dry-run` と `--apply` を同時指定した場合は **exit 2 で書込拒否**する。  
旧実装の「apply 優先」は **禁止**（2026-07-15 誤適用事故の再発防止 · △18）。

## 正本更新

- `docs/plans/2026-07-11-mcp-tools-consolidation-spec.md` §6.3 / O3 / △18 / 改定履歴 v3.2
- `.cursor/rules/mcp-server-use-triggers.mdc`（同時禁止を明記）
- `scripts/cio-mcp-profile.mjs` ヘッダ（契約コメント）

## 検証

```powershell
npm run cio:mcp:profile -- --profile governance --dry-run
npm run cio:mcp:profile -- --dry-run --apply governance   # expect exit 2
```
