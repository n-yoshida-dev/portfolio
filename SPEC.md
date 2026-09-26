# 確定仕様

**実装が参照する正本。** ユーザーの確認を経たものだけを書く。検討中のことは `PLAN.md` に置く。
人間向けの解説（構成・運用・線引き）は `README.md`。同じ事実を二重に書かない。

## 1. コンテンツモデル（`public-profile/`）

型の正本は `src/content.config.ts`。ここには意味だけを書く。

| コレクション | 場所 | 主な項目 | 用途 |
|---|---|---|---|
| `projects` | `projects/*.md` | title / summary / repo / site / visibility（public・private・archived）/ status（active・paused・done・archived）/ period / stack / featured / order / systems | Projects 一覧・詳細。`featured: false` は Other / Experiments。本文が空なら詳細ページを作らない |
| `systems` | `systems/*.md` | title / summary / order / components | Systems 一覧・詳細 |
| `pages` | `profile.md` `career.md` `skills.md` | title / description / updated / links（profile のみ）/ tagline（profile のみ） | Home / Journey / Skills |
| `articles` | `articles.json` | id / title / url / platform / publishedAt / tags / series / summary | Articles。連載（series）ごとにまとめ、連載内は古い順 |

- `updated` は「最終確認日」。YAML の日付は Date として読まれるので、型で `YYYY-MM-DD` の文字列に揃える
- `projects.systems` は `systems` の slug（ファイル名）を指す。壊れていないことをテストで確認する
- Private の repo は `visibility: private` で載せ、存在と目的だけを書く

## 2. ページとルート

| ルート | 出力 | 元データ |
|---|---|---|
| `/` | Home | profile.md + featured 3 件 + systems 全件 |
| `/projects`, `/projects/<slug>` | 一覧、詳細 | projects |
| `/systems`, `/systems/<slug>` | 一覧、詳細 | systems |
| `/skills`, `/journey`, `/articles`, `/ask` | 単一ページ | skills.md / career.md / articles.json / `src/lib/ask.ts` |
| `/profile.md` `/skills.md` `/journey.md` `/articles.md` `/projects/<slug>.md` `/systems/<slug>.md` | Markdown 版（`text/markdown`） | 同上。`src/lib/content.ts` の *ToMarkdown が生成 |
| `/llms.txt` | AI 向け索引（llmstxt.org 形式：H1 / 引用の要約 / H2 ごとのリンク一覧） | 全コレクション |
| `/llms-full.txt` | 主要ページの Markdown を連結 | 全コレクション |
| `/sitemap-index.xml`, `/robots.txt`, `/og.png`, `/favicon.svg` | 補助 | — |

- URL は拡張子・末尾スラッシュなし（`trailingSlash: 'never'`、`build.format: 'file'`、Vercel の `cleanUrls`）
- 各 HTML ページは `<link rel="alternate" type="text/markdown">` とフッターのリンクで Markdown 版を指す
- 絶対 URL は `Astro.site`（`SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost の順）から組み立てる

## 3. Ask AI

- 自前のチャットは持たない。訪問者の AI に渡すプロンプトを表示し、「コピー」「ChatGPT で開く」「Claude で開く」「Gemini（コピーして貼り付け）」を置く
- プロンプトは `src/lib/ask.ts` の 1 か所。`/llms.txt` を最初に読ませ、商用実務・個人開発・学習中を区別し、出典を示し、日本語で答えるよう指示する
  （プロンプト本文は英語。回答言語を指定しないと英語で返ってくる。2026-09-26 に Claude で実測）

## 4. デザイン

- 素の CSS 1 ファイル（`src/styles/global.css`）。色は文字・薄い文字・線・リンク・背景の 5 つ。ダークモードは OS 設定に追従
- カード UI にせず、区切り線で並べる。グラデーション・影・アニメーションを使わない
- 本文幅は最大 52rem、モバイルは 16px の左右余白。表は横スクロール

## 5. 検査（CI と同じ）

`format:check` → `lint`（禁止語スキャン）→ `typecheck` → `test` → `build` → AI 向けファイルの存在確認、および秘密情報スキャン。
禁止語のパターンは `scripts/public-profile-rules.json`。ヒットは書き直しで解消し、許可リストを作らない。

## 6. Phase 1 でやらないこと

`PLAN.md`「やらないこと」と同じ。自動同期・API・DB・RAG・自前チャット・CMS・認証・analytics。
