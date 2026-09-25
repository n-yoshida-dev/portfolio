# portfolio

Naoki Yoshida のポートフォリオサイト（Public）。自作アプリの一覧と、AI・GitHub・自作ツールを組み合わせた開発・学習の仕組みを公開する。
Astro の静的サイトで、コンテンツは `public-profile/` の Markdown / JSON。構成と運用は `README.md`。

## セッション開始時にすること

1. **`HANDOFF.md` を読む** — 現在地と次の一手だけがある（決定事項や履歴は持たない）
2. **設計・方針を提案する前に `logs/decisions.md` を読む** — ユーザーと合意済みの判断。蒸し返さない

未完タスクは SessionStart フックが `TODO.md` から自動で提示する。
セッションの区切りには `/apps-workflow:handoff` を実行して引き継ぎを書く。

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
- **非公開リポジトリ（personal-ai-context / study / ops / writing ほか）の中身をコピーしない。** 参照するのは「存在と目的」まで。
  各リポジトリの CLAUDE.md や判断台帳の文面をそのまま貼らない。固有名詞（会社名・製品名・案件名・家族・地名）はスキャンで拾えないので目視で確認する
- **コンテンツの正本は `public-profile/`。** ページ側（`src/pages/`）に文章を直書きしない。見出し・説明文などの定型文だけを置く
- **frontmatter の項目を増やすときは `src/content.config.ts` と `README.md`「コンテンツの更新」を同時に直す**
- **習熟度・経歴の記述は根拠と区分（商用実務 / 個人開発 / 理解確認済み / 学習中）を混ぜない。** 「触ったことがある」を「できる」と書かない
- **ライブラリを増やさない。** 素の CSS、JavaScript は Ask AI のコピーだけ。追加するなら `KNOWLEDGE.md` に理由を書く
- `frontend/` `backend/` には分けない（サイトがリポジトリ直下。`PLAN.md`「技術的な方針」）。
  そのため apps-workflow の `check-edited.sh` は効かない。編集後は `npm run typecheck` を自分で回す

## Claude Code の設定

共通のフック・スキル・エージェントは [apps-workflow プラグイン](https://github.com/n-yoshida-dev/claude-plugins)から来る（`.claude/settings.json` の `enabledPlugins`）。
**`enabledPlugins` だけでは install されない。project スコープで install が要る**（手順は `../CLAUDE.md`「新しいアプリを作るとき」）。

| 種別 | 中身 | 出どころ |
|---|---|---|
| `/apps-workflow:progress` | TODO.md からフェーズ別の進捗表を出す | プラグイン |
| `/apps-workflow:handoff` | HANDOFF / TODO / KNOWLEDGE / `logs/decisions.md` を更新して次のセッションへ渡す | プラグイン |
| `/apps-workflow:pr-check` | CI と同じ検査をローカルでまとめて実行する | プラグイン（`frontend/` が無いので、代わりに README の「CI と同じ検査」を回す） |
| `/apps-workflow:pr-flow` | PR の作成からマージまでの手順 | プラグイン |
| `/decide` | 議論で決めたことを `logs/decisions.md` に 1 件追記する | ユーザー設定 |
| `apps-workflow:acceptance-reviewer` | マージ前に差分を「完了条件：」・SPEC.md・「守ること」に照らして検品する読み取り専用エージェント | プラグイン |
| `guard-secrets.sh` | 秘密情報・ローカル専用ファイルのコミットを阻止（PreToolUse） | プラグイン |
| `session-briefing.sh` | 進捗表と TODO.md の未完タスクを起動時に提示（SessionStart） | プラグイン |

## 共通ルール

自作プロダクト共通の開発ルール（Git 運用・コーディング規則）は `../CLAUDE.md` にある。上位ディレクトリの CLAUDE.md は自動でロードされる。
