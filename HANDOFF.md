# 引き継ぎ

`/apps-workflow:handoff` で更新する。**次のセッションが最初に読むファイル。**

**ここには「今どこにいるか」だけを書く。目安 40 行。履歴を積まない。**

| 書きたくなったこと | 行き先 |
|---|---|
| 決めたこと・理由・却下した案 | `logs/decisions.md`（`/decide` で追記） |
| ハマったこと・落とし穴・技術的な選択の理由 | `KNOWLEDGE.md` |
| やること・ユーザーへの確認待ち | `TODO.md` |
| やったこと | 書かない。`git log` と PR が持っている |
| 毎回守る手順・環境の注意 | `CLAUDE.md`（短く）か `.claude/rules/` |

## 進捗

（`/apps-workflow:handoff` が TODO.md から自動で集計し、この節を丸ごと置き換える）

## 現在地

- フェーズ：Phase 1 の実装は完了。ローカルで build / typecheck / test / lint が通る
- main：初回 PR（`feat/initial-setup`）のマージ待ち、またはマージ直後
- Vercel：未接続（ユーザーのブラウザ操作が要る。手順は `README.md`「デプロイ」）
- 確認待ち：`TODO.md`「確認待ち」の 3 件（public-profile の記述レビュー、Personal AI Context の粒度、ブログ・note の非掲載）

## 次セッションで最初にやること

1. ユーザーの public-profile レビュー結果を反映し、`npm run lint && npm run test && npm run build` を通す

`TODO.md` の先頭と一致させる。書くのは最初の一手だけで、一覧は `TODO.md` が持つ。
