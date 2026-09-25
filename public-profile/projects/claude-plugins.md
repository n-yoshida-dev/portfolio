---
title: claude-plugins
summary: 自作アプリで使い回す Claude Code プラグインのマーケットプレイス。秘密情報のコミット阻止、編集直後の型チェック、進捗表、引き継ぎ、PR フロー、マージ前の受け入れレビュー役をまとめている。
repo: https://github.com/n-yoshida-dev/claude-plugins
visibility: public
status: active
period: 2026-08 〜
stack: [Shell, Claude Code plugin, GitHub Actions, shellcheck]
featured: true
order: 5
systems: [ai-assisted-development]
---

## なぜ作ったか

複数の自作アプリを並行して進めると、Claude Code の設定（フック・スキル）を各リポジトリにコピーすることになり、
直すたびに全リポジトリを回ることになります。プラグインにすれば直すのは 1 か所で済みます。

## 中身（apps-workflow プラグイン）

| 種別 | 名前 | 何をするか |
|---|---|---|
| フック | guard-secrets | `git add` / `commit` の直前にステージ済みファイルを検査し、秘密情報やローカル専用ファイルがあればブロックする |
| フック | check-edited | フロントエンドの TypeScript を編集したら typecheck と lint、Go なら `go vet` を自動で走らせる |
| フック | session-briefing | セッション開始時に TODO からフェーズ別の進捗表を作り、未完タスクを提示する |
| スキル | progress / handoff / pr-check / pr-flow | 進捗表の表示、引き継ぎ文書の更新、CI と同じ検査のローカル実行、PR 作成からマージまでの手順 |
| エージェント | acceptance-reviewer | マージ前に差分を「完了条件」と仕様に照らして検品する読み取り専用の評価役。判定だけ返し、直すのは呼び出し側 |

## 守っていること

- 検査ロジックはシェルスクリプトに置き、単体で `echo '<json>' | bash hooks/xxx.sh` と叩いて検証できる状態を保つ
- フックはプロジェクトに無いもの（`frontend/` が無い等）を黙ってスキップし、エラーを出さない
- 利用側に配る変更は `version` を上げる。CI で `claude plugin validate --strict` と shellcheck を通す
- ハマった点（スキル内のシェル埋め込みは単純な 1 コマンドだけにする、`enabledPlugins` に書くだけでは install されない等）は README に残す
