---
title: ops
summary: 家計・タスク・メールなど、コーディング以外の定型雑務を Claude Code と半自動で回すモノレポ。業務ごとに手順書と作業メモを持ち、検算だけを機械に任せる。
repo: https://github.com/n-yoshida-dev/ops
visibility: private
status: active
period: 2026-08 〜
stack: [Markdown, Python, Shell, Claude Code hooks, Cloud routines]
featured: false
order: 24
systems: [ai-assisted-development]
---

- 業務ごとに「恒久的な手順書（README）」と「その回の作業メモ」を分け、同じ気づきが 3 回出たら手順書へ昇格させる
- 完全自動化は狙わず、一番つらい工程だけ自動化して最終確認は人間が行う。ただし検証（見落とし探し）は機械に任せる
- 機密の数字（口座・カードなど）はフックが機械的にブロックし、CSV などの入力データは Git 管理外に置く
- 毎朝のメールトリアージはクラウド上の定期実行（ルーチン）が、リポジトリの手順書を判定基準として読んで動く
