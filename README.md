# portfolio

[![CI](https://github.com/n-yoshida-dev/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/n-yoshida-dev/portfolio/actions/workflows/ci.yml)

[Naoki Yoshida](https://github.com/n-yoshida-dev) のポートフォリオサイト。
自作アプリの一覧（Projects）に加えて、AI・GitHub・自作ツールを組み合わせた開発・学習・知識管理の仕組み（Systems）を公開する。
AI が私について調べるための入口（`/llms.txt`、各ページの Markdown 版、Ask AI ページ）も持つ。

## 構成

```text
portfolio/
├── public-profile/          ← 公開してよい情報だけの正本（手動管理の Markdown / JSON）
│   ├── profile.md           ← トップに出す自己紹介とリンク
│   ├── career.md            ← Journey（経歴・学習の歩み・資格）
│   ├── skills.md            ← Skills（商用実務 / 個人開発 / 学習中 を分けて記載）
│   ├── articles.json        ← Articles（技術記事へのリンク）
│   ├── projects/*.md        ← Projects。1 ファイル 1 リポジトリ
│   └── systems/*.md         ← Systems。1 ファイル 1 仕組み
├── src/
│   ├── content.config.ts    ← public-profile の frontmatter の型（ここに合わないとビルドが失敗する）
│   ├── lib/                 ← データ取得・Markdown 変換・Ask AI のプロンプト
│   ├── layouts/ components/ styles/
│   └── pages/               ← ルーティング。*.md.ts と llms*.txt.ts は AI 向けのテキスト出力
├── scripts/
│   ├── check-public-profile.mjs   ← 禁止語スキャン（npm run lint）
│   ├── public-profile-rules.json  ← 禁止語パターンと理由
│   └── generate-og.mjs            ← OGP 画像の生成（public/og.png）
├── tests/                   ← スキャンの回帰テストと public-profile の参照整合テスト
└── .github/workflows/ci.yml
```

技術：[Astro](https://astro.build)（静的出力）+ TypeScript + 素の CSS。ライブラリは最小限にし、JavaScript は Ask AI のコピーボタンだけ。
ホスティングは Vercel（設定ファイル不要。`vercel.json` は URL の末尾スラッシュを揃えるためだけにある）。

## ページ

| URL                | 内容                                                     | Markdown 版           |
| ------------------ | -------------------------------------------------------- | --------------------- |
| `/`                | Home。何の人か・何を作っているか・どう仕組み化しているか | `/profile.md`         |
| `/projects`        | Projects 一覧（主要 + Other / Experiments）              | —                     |
| `/projects/<slug>` | Projects 詳細（本文があるものだけ）                      | `/projects/<slug>.md` |
| `/systems`         | Systems 一覧                                             | —                     |
| `/systems/<slug>`  | Systems 詳細                                             | `/systems/<slug>.md`  |
| `/skills`          | Skills                                                   | `/skills.md`          |
| `/journey`         | Journey（経歴・学習の歩み）                              | `/journey.md`         |
| `/articles`        | Articles（連載ごと）                                     | `/articles.md`        |
| `/ask`             | Ask AI about me（プロンプトのコピーと各 AI へのリンク）  | —                     |
| `/llms.txt`        | AI 向け索引（[llmstxt.org](https://llmstxt.org) 形式）   | —                     |
| `/llms-full.txt`   | 主要ページの Markdown を 1 ファイルに連結                | —                     |

## 開発

```bash
npm ci
npm run dev          # http://localhost:4321
npm run build        # dist/ に静的出力
npm run preview      # ビルド結果の確認
```

CI と同じ検査をまとめて回す：

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build
```

| コマンド               | 内容                                                      |
| ---------------------- | --------------------------------------------------------- |
| `npm run format:check` | Prettier（`public-profile/` の Markdown は対象外）        |
| `npm run lint`         | `public-profile/` の禁止語スキャン                        |
| `npm run typecheck`    | `astro check`（Astro / TypeScript の型検査）              |
| `npm run test`         | Vitest（スキャンの回帰テスト、public-profile の参照整合） |
| `npm run build`        | ビルド。frontmatter が型に合わないとここで失敗する        |

OGP 画像を作り直すとき：`node scripts/generate-og.mjs`（文言は同スクリプト内）。

## コンテンツの更新

すべて `public-profile/` の編集で完結する。コードは触らない。

- **プロジェクトを足す**：`public-profile/projects/<slug>.md` を作る。frontmatter の項目は `src/content.config.ts` を参照。
  `featured: true` で主要プロジェクト、`false` で Other / Experiments。本文が空なら詳細ページは作られない（一覧だけに出る）
- **仕組みを足す**：`public-profile/systems/<slug>.md` を作る。`order` で並び順
- **記事を足す**：`public-profile/articles.json` に 1 要素足す。`series` で連載ごとにまとまる
- **経歴・スキルを直す**：`career.md` / `skills.md` を編集し、frontmatter の `updated` を更新する

反映は `npm run build` が通れば完了。`main` へマージすると Vercel が自動でデプロイする。

## 公開してよい情報の線引き

このリポジトリは Public。`public-profile/` は、非公開の正本群（学習ログ・個人コンテキスト・雑務のリポジトリ）から
「一般公開して問題ないプロフィール・技術・成果物の情報」だけを **手で抜き出したもの** で、自動同期はしない。

**書かないもの**：家族、金銭、住所、生年月日・年齢、転職活動の具体的状況、企業名・応募先、現職の内部情報、人事評価・役職・給与、健康、連絡先、認証情報、ローカルのパス。

- `npm run lint` が上のパターンを機械的に検査する（`scripts/public-profile-rules.json`）。ヒットしたら **書き直す**。許可リストは作らない
- パターンにできないもの（会社名・製品名・固有の案件名）は、PR を出す前に目視で確認する
- Private リポジトリは「存在と目的」だけを書き、中身（ファイル構成の詳細・実データ・判断の経緯の固有名詞）は書かない

## デプロイ（Vercel）

1. Vercel でこのリポジトリを Import する。フレームワークは Astro として自動検出される（Build: `astro build`、Output: `dist`）
2. 本番 URL は Vercel がビルド時に渡す `VERCEL_PROJECT_PRODUCTION_URL` から `astro.config.mjs` が組み立てる。
   独自ドメインにしたら、環境変数 `SITE_URL`（例：`https://example.com`）を設定するだけでよい
3. `main` へのマージで本番、PR ごとにプレビューが作られる

`SITE_URL` は `/llms.txt`・各 `.md`・OGP・sitemap の絶対 URL に使う。ローカルでは `http://localhost:4321`。

## ライセンス

コード（`src/` `scripts/` `tests/` 設定ファイル）は MIT。
`public-profile/` の文章と `public/og.png` は著作権を留保する（引用・要約は自由。丸ごとの転載は不可）。

## 開発ドキュメント（AI 向け）

`PLAN.md`（何を・なぜ）/ `SPEC.md`（確定仕様）/ `TODO.md`（タスク）/ `KNOWLEDGE.md`（技術判断とハマりどころ）/
`HANDOFF.md`（現在地）/ `logs/decisions.md`（合意した判断の台帳）。Phase 2 の候補は `TODO.md` にある。
