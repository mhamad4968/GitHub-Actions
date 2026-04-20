# 公式ドキュメント参照（Cursor / エ‑ジェント用）

フロント・バックエンド・AI 連携のコード生成・設計では、**各公式の最新ドキュメント**を正とする。必要に応じて **MCP の `fetch`** やブラウザで該当ページを開いて確認する。

---

## 0. kintone（Cursor @Docs に追加する URL・**最優先**）

Cursor 左の **@Docs** → **Add new doc** で、次の **表どおりの URL** をそれぞれ登録すると、チャットから公式仕様を参照しやすくなる。

※ご提示の `https://github.io` / `https://github.com` など **ドメインだけの URL は不十分**のため、下記の**公式ドキュメント／リポジトリ**に置き換えている。

| 区分 | 登録する URL | 補足 |
|------|----------------|------|
| **kintone API 全般**（最優先） | [https://cybozu.dev](https://cybozu.dev) | **JavaScript API**（画面カスタマイズ）・**REST API**（データ操作）など開発者向け仕様の入口。 |
| **kintone UI Component**（UI 部品） | [https://ui-component.kintone.dev](https://ui-component.kintone.dev) | kintone 風のボタン・フォーム等を自作する公式コンポーネントのドキュメント（**GitHub Pages の誤記ではなく本サイトを使う**）。ソース・Issue: [kintone-labs/kintone-ui-component](https://github.com/kintone-labs/kintone-ui-component) |
| **@kintone/rest-api-client** / js-sdk | [https://github.com/kintone/js-sdk](https://github.com/kintone/js-sdk) | Node.js・外部連携向け。**`@kintone/rest-api-client`** はリポジトリ内 `packages/rest-api-client`。[npm](https://www.npmjs.com/package/@kintone/rest-api-client) |

リポジトリ内の **kintone カスタマイズ**では、あわせて **`kintone-apps.md`** と **`.cursor/rules/kintone-javascript.mdc`** を正とする。

---

## 1. フロントエンド・アプリ開発

| 技術 | URL（トップ／入口） |
|------|---------------------|
| **Next.js**（App Router） | [https://nextjs.org](https://nextjs.org) · [App Router ドキュメント](https://nextjs.org/docs/app) |
| **React** | [https://react.dev](https://react.dev) |
| **Tailwind CSS** | [https://tailwindcss.com](https://tailwindcss.com) |
| **TypeScript** | [https://www.typescriptlang.org](https://www.typescriptlang.org) |

---

## 2. バックエンド・API・認証

| 技術 | URL（トップ／入口） |
|------|---------------------|
| **Supabase**（DB / 認証 / API） | [https://supabase.com](https://supabase.com) · [Docs](https://supabase.com/docs) |
| **Prisma**（ORM） | [https://www.prisma.io](https://www.prisma.io) · [Docs](https://www.prisma.io/docs) |
| **Firebase** | [https://firebase.google.com](https://firebase.google.com) · [Documentation](https://firebase.google.com/docs)（※ `google.com` 単独ではない） |

---

## 3. AI・エージェント開発（アプリ組み込み）

| 技術 | URL（トップ／入口） |
|------|---------------------|
| **OpenAI API** | [https://openai.com](https://openai.com) · [API / Platform docs](https://platform.openai.com/docs) |
| **LangChain** | [https://langchain.com](https://langchain.com) · [Python Docs](https://python.langchain.com/) |
| **Lucide**（アイコン） | [https://lucide.dev](https://lucide.dev) |

---

## 4. ドキュメント・ツール連携

| 技術 | URL（トップ／入口） |
|------|---------------------|
| **Notion** | [https://www.notion.so](https://www.notion.so) · **API は** [Notion Developers](https://developers.notion.com) |

---

## メモ

- リポジトリの主題が **kintone** のときは、**上記「0. kintone」**の @Docs 登録に加え、**`kintone-apps.md`** と **`.cursor/rules/kintone-javascript.mdc`** を優先する。
- URL・バージョンは公式の変更に追随するため、**手元のこの一覧だけで断定せず**、都度公式を確認する。
