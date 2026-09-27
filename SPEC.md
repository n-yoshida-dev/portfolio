# 確定仕様

**実装が参照する正本。** ユーザーの確認を経たものだけを書く。検討中のことは `PLAN.md` に置く。
人間向けの解説（構成・運用・線引き）は `README.md`。同じ事実を二重に書かない。

## 1. コンテンツモデル（`public-profile/`）

型の正本は `src/content.config.ts`。ここには意味だけを書く。

| コレクション | 場所 | 主な項目 | 用途 |
|---|---|---|---|
| `projects` | `projects/*.md` | title / tagline / summary / repo / site / visibility（public・private・archived）/ status（active・paused・done・archived）/ period / stack / featured / order / systems / highlights | Projects 一覧・詳細。`featured: false` は Other / Experiments。本文が空なら詳細ページを作らない |
| `systems` | `systems/*.md` | title / tagline / summary / order / components / highlights | Systems 一覧・詳細 |
| `pages` | `profile.md` `career.md` `skills.md` | title / description / updated / links・tagline・highlights（profile のみ。highlights は 3 行まで） | Home / Journey / Skills |
| `articles` | `articles.json` | id / title / url / platform / publishedAt / tags / series / summary | Articles。連載（series）ごとにまとめ、連載内は古い順 |

- `updated` は「最終確認日」。YAML の日付は Date として読まれるので、型で `YYYY-MM-DD` の文字列に揃える
- `projects.systems` は `systems` の slug（ファイル名）を指す。壊れていないことをテストで確認する
- Private の repo は `visibility: private` で載せ、存在と目的だけを書く
- `tagline`（projects / systems）は一覧のカードに出す一文。句点なし・60 字以内（スキーマで確認）。`summary`（1〜2 文）は詳細ページの冒頭・Markdown 版・llms.txt に出し、カードには出さない。
  カードのために summary を削ると AI 向けの情報が減るので、別の項目に分けた（2026-09-27）
- `highlights`（projects / systems）は詳細ページの要点。3 行まで。本文に書いた事実だけから作る。本文が 400 字を超えるエントリは必須（テストで確認）

## 2. ページとルート

| ルート | 出力 | 元データ |
|---|---|---|
| `/` | Home。1 枚のページに 7 節（§4）。名前・tagline・highlights・リンク、主なプロジェクト（カード）、systems、skills と journey の短い版、articles、Ask AI。**profile.md の本文は出さない**（Markdown 版と llms-full.txt が持つ） | profile.md の frontmatter + 各コレクション |
| `/projects`, `/projects/<slug>` | 一覧、詳細。詳細は題名・summary・リンク・技術・`highlights` を出し、**本文は `<details>`（「詳しく読む」）で畳む**。`highlights` が無いエントリは本文をそのまま出す。関連する仕組みは題名だけ | projects |
| `/systems`, `/systems/<slug>` | 一覧、詳細。詳細の出し方は projects と同じ。関連するプロジェクトは題名だけ | systems |
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

- 素の CSS 1 ファイル（`src/styles/global.css`）。色は文字・薄い文字・線・リンク・背景（地色 `--bg-subtle` を含む）の 5 系統。ダークモードは OS 設定に追従
- **構成は「1 枚のページ + 左の固定目次」**（2026-09-27。`logs/decisions.md`）。トップに 7 節（何の人か / Projects / Systems / Skills / Journey / Articles / Ask AI）を縦に並べ、
  左の目次はその節へ移動する。スクロールに合わせて今いる節の項目を強調する（この JavaScript だけ例外として持つ）。375px 幅では目次を上部に畳む。
  トップの各節は**短い版**（主なプロジェクト 4 件、区分ごとの項目名だけのスキル、年表）で、詳しい版は各ページに残して「すべて →」で行く
- **Ask AI の入口は右下の追従ボタン**（「AI に聞く」。`/ask` 以外の全ページ。`position: fixed` だけで JavaScript・影なし。2026-09-27）。
  トップの Ask AI 節（説明の一文 + ボタン）も残す。右上は固定ヘッダーが無く見出しやスマホ上部の目次と重なるので使わない。
  `/ask` で出さないことはユーザー確認済み（2026-09-27「まあそうね」）。ラベル「AI に聞く」は「何を？」と分かりにくいので言い換える予定で、言葉はユーザーの確認待ち（`TODO.md` 確認待ち）
- 一覧は**薄枠のカード**（地色 `--bg-subtle`、線 `--line`。PC 2 列、375px で 1 列）。年・区分・題名・一文・リンクを定位置に置く。
  経歴は年を左端に置いた年表。グラデーション・影・アニメーションは使わない。色は足さず、リンク色だけを効かせる
- **HTML は人間向けに短く、Markdown 版・llms.txt は AI 向けに詳しく。** 同じ文章を両方に同じ量で出さない。
  トップの最初の 1 画面に名前 + 一言 + 要点 3 行 + 目次が入る（節の続きはその下）。一覧の 1 件は題名 + 一文 + リンク（2026-09-26。参考にした個人サイト 23 件の共通パターン。2026-09-27 に「1〜2 文」から「一文」へ）。
  詳細ページは開いた直後に見える文字数を 800 字以下にする（長い本文は畳む）。
  Skills / Journey の表は 1 セル 1 フレーズ・体言止めにし、句点（。）を使わない（テストで確認）。
  HTML では CSS で表を積み替え、Journey は年を左端に置いた年表、Skills は「ラベル + 値」の並びにする（横スクロールさせない。2026-09-27）。
  **例外：Skills / Journey は HTML と Markdown 版が同じ本文から作られる**ので、そこは短く保ち、技術の細部は projects / systems の本文
  （HTML では畳まれ、Markdown 版には全文が出る）に置く。こうして AI 向けの情報を減らさない
- 本文幅は最大 52rem（左の目次 16rem を除く）、モバイルは 16px の左右余白。Skills / Journey 以外の表（詳細ページの本文にあるもの）は横スクロール

## 5. 検査（CI と同じ）

`format:check` → `lint`（禁止語スキャン）→ `typecheck` → `test` → `build` → AI 向けファイルの存在確認、および秘密情報スキャン。
禁止語のパターンは `scripts/public-profile-rules.json`。ヒットは書き直しで解消し、許可リストを作らない。

## 6. Phase 1 でやらないこと

`PLAN.md`「やらないこと」と同じ。自動同期・API・DB・RAG・自前チャット・CMS・認証・analytics。
