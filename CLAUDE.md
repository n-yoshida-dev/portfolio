# portfolio

Naoki Yoshida のポートフォリオサイト（Public）。自作アプリの一覧と、AI・GitHub・自作ツールを組み合わせた開発・学習の仕組みを公開する。
Astro の静的サイトで、コンテンツは `public-profile/` の Markdown / JSON。構成と運用は `README.md`。

## セッション開始時にすること

1. **`HANDOFF.md` を読む** — 現在地と次の一手だけがある（決定事項や履歴は持たない）
2. **設計・方針を提案する前に `logs/decisions.md` を読む** — ユーザーと合意済みの判断。蒸し返さない

未完タスクは SessionStart フックが `TODO.md` から自動で提示する。
引き継ぎは、区切りごとに Claude が `apps-workflow:handoff` をユーザーに聞かずに呼んで書く（`../CLAUDE.md`）。

## ドキュメントの役割

| ファイル | 役割 | 読み手 |
|---|---|---|
| `HANDOFF.md` | 現在地と次の一手だけ。履歴は持たない | AI |
| `logs/decisions.md` | ユーザーと合意した判断の台帳。`/decide` で追記 | AI |
| `PLAN.md` | 何を作るか・なぜ作るか | AI |
| `SPEC.md` | 確定仕様。コンテンツの型・ページ・AI 向け出力 | AI |
| `TODO.md` | タスクと進捗。Phase 2 候補も保留節に持つ | AI |
| `KNOWLEDGE.md` | 技術的な設計判断・ハマりどころ | AI |
| `README.md` | 構成・運用・公開情報の線引き | 人間 |

**同じ事実を AI 用と人間用の両方に書かない。** AI 用から人間用へリンクする。

## 守ること

- **このリポジトリは Public。`public-profile/` に「一般公開して問題ない情報」以外を書かない。**
  線引きは `README.md`「公開してよい情報の線引き」。`npm run lint`（禁止語スキャン）がヒットしたら**書き直す**。許可リストは作らない
- **非公開リポジトリ（personal-ai-context / study / ops / writing ほか）の中身をコピーしない。** 参照するのは「存在と目的」まで（例外は `README.md`「公開してよい情報の線引き」）。
  各リポジトリの CLAUDE.md や判断台帳の文面をそのまま貼らない。固有名詞（会社名・製品名・案件名・家族・地名）はスキャンで拾えないので目視で確認する
- **コンテンツの正本は `public-profile/`。** ページ側（`src/pages/`）に文章を直書きしない。見出し・説明文などの定型文だけを置く
- **HTML は人間向けに短く、Markdown 版・llms.txt は AI 向けに詳しく。** 長い本文は `highlights`（要点 3 行）を書いて HTML では畳み、Markdown 版は全文のまま（`SPEC.md` §4）
- **frontmatter の項目を増やすときは `src/content.config.ts` と `README.md`「コンテンツの更新」を同時に直す**
- **習熟度・経歴の記述は根拠と区分（商用実務 / 個人開発 / 理解確認済み / 学習中）を混ぜない。** 「触ったことがある」を「できる」と書かない
- **ライブラリを増やさない。** 素の CSS、JavaScript は Ask AI のコピー（`/ask` のボタンと、Gemini のボタン〔サイトの全文の先読みを含む〕。`SPEC.md` §3）と目次のスクロール監視（`SPEC.md` §4）だけ。追加するなら `KNOWLEDGE.md` に理由を書く
- `frontend/` `backend/` には分けない（サイトがリポジトリ直下。`PLAN.md`「技術的な方針」）。
  そのため apps-workflow の `check-edited.sh` は効かない。編集後は `npm run typecheck` を自分で回す

## Claude Code の設定

共通のフック・スキル・エージェントは [apps-workflow プラグイン](https://github.com/n-yoshida-dev/claude-plugins)から来る（`.claude/settings.json` の `enabledPlugins`）。
部品の一覧はプラグインの [README](https://github.com/n-yoshida-dev/claude-plugins/blob/main/plugins/apps-workflow/README.md) にあり、ここには写さない（写すと古くなる）。
`enabledPlugins` に書くだけでは入らず、アプリごとに project スコープの install が要る（手順は `../app-template/SETUP.md` §2）。

`/apps-workflow:pr-check` は `frontend/` が無いので使えない。代わりに README の「CI と同じ検査」を回す。

## 開発ダッシュボード（`dashboard/`）

- 起動：`node dashboard/update.mjs --serve --open`。進捗・あなた待ち・CI・本番の反映・禁止語スキャンを 1 画面で見る（中身と取得元は `dashboard/README.md`）
- 正本（TODO / HANDOFF / decisions / git / GitHub / Beads / public-profile）を読んで描くだけ。独自の状態を持たせない。サイトの一部ではない（ビルド・配信に含まれない）
- TODO の見出し規約・「確認待ち」に Beads の ID を書く書き方・HANDOFF の節名・CI のジョブ名・Beads の題名規約・README の「公開 URL：」を変えたら `dashboard/update.mjs` も直す

## 共通ルール

自作プロダクト共通の開発ルール（Git 運用・コーディング規則）は `../CLAUDE.md` にある。上位ディレクトリの CLAUDE.md は自動でロードされる。
