# {{APP_NAME}}

{{一行で「何をするアプリか」。SETUP.md の手順で埋めること}}

## セッション開始時にすること

1. **`HANDOFF.md` を読む** — 現在地と次の一手だけがある（決定事項や履歴は持たない）
2. **設計・方針を提案する前に `logs/decisions.md` を読む** — ユーザーと合意済みの判断。蒸し返さない
3. {{個人データを扱うアプリなら「実データが必要な作業なら `PRIVATE.md` を読む（.gitignore 対象）」。扱わないなら、この行ごと削除する}}

未完タスクは SessionStart フックが `TODO.md` から自動で提示する。
セッションの区切りには `/apps-workflow:handoff` を実行して引き継ぎを書く。

## ドキュメントの役割

| ファイル | 役割 | 読み手 |
|---|---|---|
| `HANDOFF.md` | 現在地と次の一手だけ。履歴は持たない | AI |
| `logs/decisions.md` | ユーザーと合意した判断の台帳。`/decide` で追記 | AI |
| `PLAN.md` | 何を作るか・なぜ作るか | AI |
| `SPEC.md` | 確定仕様。実装が参照する正本 | AI |
| `TODO.md` | タスクと進捗 | AI |
| `KNOWLEDGE.md` | 技術的な設計判断・ハマりどころ | AI |
| `docs/` | 要件定義・アーキテクチャの解説 | 人間 |

**同じ事実を AI 用と人間用の両方に書かない。** AI 用から人間用へリンクする。

## 守ること

{{このアプリ固有の制約をここに書く。以下は雛形の例。該当しないものは消す}}

- **秘密情報・個人の実数値をリポジトリに入れない。** サンプル・プリセットはすべてダミー値。
  実データは `PRIVATE.md` と gitignore 対象の `*.local.json` で扱う
- **`{{ドメインロジックのディレクトリ}}` は純粋関数のみ。** React・DOM・localStorage を import しない
- **外部由来の数値（税率・料金表・制度の閾値）をコードに直書きしない。**
  JSON に分離し、`source` と `checkedAt` を記録する
- ロジックを変更したら、対応する単体テストを同時に更新する

## Claude Code の設定

共通のフック3種・スキル4種・エージェント1種は [apps-workflow プラグイン](https://github.com/n-yoshida-dev/claude-plugins)から来る（`.claude/settings.json` の `enabledPlugins`）。
**`enabledPlugins` だけでは install されない。アプリごとに project スコープで install が要る**（反映は次のセッションから）。手順は `../CLAUDE.md`「新しいアプリを作るとき」を参照。

| 種別 | 中身 | 出どころ |
|---|---|---|
| `/apps-workflow:progress` | TODO.md からフェーズ別の進捗表（バー・残り件数・前回の区切りからの増減）を出す | プラグイン |
| `/apps-workflow:handoff` | HANDOFF（進捗表 + 現在地）/ TODO / KNOWLEDGE / `logs/decisions.md` を更新して次のセッションへ渡す | プラグイン |
| `/apps-workflow:pr-check` | CI と同じ検査をローカルでまとめて実行する（コミット・PR の前） | プラグイン |
| `/apps-workflow:pr-flow` | PR の作成からマージまでの手順。Claude が PR を作る・マージするときに呼ぶ | プラグイン |
| `/decide` | 議論で決めたことを `logs/decisions.md` に 1 件追記する | ユーザー設定（`~/.claude/commands/decide.md`。全リポジトリ共通） |
| `apps-workflow:acceptance-reviewer` | マージ前に差分を「完了条件：」・SPEC.md・「守ること」に照らして検品する読み取り専用エージェント。PR を作って CI を待つ間に Agent ツールで呼ぶ | プラグイン |
| `guard-secrets.sh` | 秘密情報・ローカル専用ファイルのコミットを阻止（PreToolUse） | プラグイン |
| `check-edited.sh` | frontend の typecheck / lint、backend の go vet（PostToolUse） | プラグイン |
| `session-briefing.sh` | 進捗表と TODO.md の未完タスクを起動時に提示（SessionStart）。進捗表は最初の返答でユーザーに見せる | プラグイン |

このアプリ固有のフック・スキルは `.claude/` に置く。固有のルールが増えたら `.claude/rules/` に切り出し、CLAUDE.md からはリンクだけにする。

## 共通ルール

自作プロダクト共通の開発ルール（技術スタック・Git運用・コーディング規則）は `../CLAUDE.md` にある。
上位ディレクトリの CLAUDE.md は自動でロードされる。
