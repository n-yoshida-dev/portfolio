# このリポジトリを実際のアプリにする手順

`app-template` から作った直後の状態。**この作業は `~/workspace/apps/` 直下のセッションで行う。**
すべて終わったら **このファイルを削除してコミットする。**

## 1. 雛形を埋める

`{{ }}` で囲まれた箇所がプレースホルダ。全ファイルを走査して残りがないことを確認する。

```bash
grep -rn '{{' --exclude-dir=.git .
```

- `CLAUDE.md` — アプリ名・一行説明・固有の制約
- `README.md` — アプリ名・概要・セットアップ手順
- `PLAN.md` — 何を作るか・なぜ作るか（走り書きでよい）
- `HANDOFF.md` — 「現在地」の 3 行だけ埋める。以後も `/apps-workflow:handoff` が現在地だけを書き換える（履歴は積まない）

`SPEC.md` `TODO.md` `KNOWLEDGE.md` `logs/decisions.md` は空のまま始めてよい。

## 2. 共通プラグインをこのアプリに入れる

フック3種と `/apps-workflow:handoff` `/apps-workflow:pr-check` は `.claude/settings.json` の
`enabledPlugins` で [apps-workflow プラグイン](https://github.com/n-yoshida-dev/claude-plugins)から読み込む。
**ただし `enabledPlugins` だけでは install されない。アプリごとに project スコープで install が要る**
（install の記録は `~/.claude/plugins/installed_plugins.json` にプロジェクトのパス単位で持たれるため、
テンプレートで入れても新アプリには効かない）。マーケットプレイスの登録だけはマシン（WSL ディストリ）ごとに初回でよい。

これは `apps-workflow` だけでなく、`enabledPlugins` にある**全プラグイン**（security-guidance・frontend-design など）で同じ。
このアプリのディレクトリで開いた **Claude Code のセッション内**で 1 本ずつ実行する（スコープを聞かれたら project）。

```
/plugin marketplace add n-yoshida-dev/claude-plugins   # マシンごとに初回だけ
/plugin install apps-workflow@n-yoshida-dev            # アプリごとに必要。他のプラグインも同様に 1 本ずつ
```

Claude に代行させる場合は、VSCode 拡張に同梱の CLI でまとめて入れられる
（シェルの `claude` は PATH に無いが、フルパスなら Claude が実行できる）。

```bash
CLI=$(ls -d ~/.vscode-server/extensions/anthropic.claude-code-*/resources/native-binary/claude | sort -V | tail -1)
for p in $(jq -r '.enabledPlugins | keys[]' .claude/settings.json); do "$CLI" plugin install "$p" --scope project; done
```

どちらも**反映は次のセッションから**。
**`/plugin` の一覧や `claude plugin list` の「enabled」表示は `enabledPlugins` しか見ていないので当てにならない。**
導入済みかどうかは `~/.claude/plugins/installed_plugins.json` にこのアプリのパスの記録があるかで確認する。
セッション開始時に TODO の未完タスクが表示されれば apps-workflow は動いている。install 忘れは静かに死ぬ
（2026-08-30 の棚卸しで、3 アプリが 8 日間フックなしで動いていたことが判明）。

## 3. プロジェクトを初期化する

必要なほうだけ。CI は `frontend/package.json` と `backend/go.mod` の有無を見て自動でジョブを出し分けるので、
片方だけでも CI は緑になる。

```bash
# フロントエンド
npm create vite@latest frontend -- --template react-ts

# バックエンド
mkdir backend && cd backend && go mod init github.com/n-yoshida-dev/{アプリ名}
```

フロントエンドを作ったら `package.json` に `typecheck` / `lint` / `format:check` / `test` / `build` の
スクリプトを揃える。CI がこの5つを呼ぶ。

## 4. 開き直す

```bash
code ~/workspace/apps/{アプリ名}
```

**以降の設計・実装はこの新しいウィンドウで行う。** `~/workspace/apps/` 直下のセッションは閉じてよい。

## 5. このファイルを消す

```bash
rm SETUP.md
git add -A && git commit -m "chore: テンプレートから {アプリ名} を初期化"
```
