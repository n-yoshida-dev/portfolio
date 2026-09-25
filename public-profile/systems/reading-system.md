---
title: Reading System
summary: iPhone の ChatGPT から登録し、GitHub を正本に、GitHub Pages で閲覧し、週次レビューを AI が回す読書の仕組み。アプリを作らず、既存サービスの組み合わせで成立させた。
order: 3
components: [reading-log, ChatGPT Projects, Claude Code, GitHub Pages]
---

## 流れ

```
iPhone / ChatGPT（表紙の写真と一言で登録・進捗・感想）
  ↓ AI が Markdown を書き、GitHub の main に直接コミット
GitHub（正本。1 冊 1 ファイル、未整理は inbox/）
  ↓
Reading Log（books / inbox / reviews / templates）
  ↓ Jekyll が Markdown からサイトを生成
GitHub Pages（閲覧画面）
  ↓
週次レビュー（ChatGPT の定期タスクが、読書中の本・積読・アクションを見直す）
```

## 設計の要点

- **正本は GitHub、作業場所は ChatGPT**。会話の中だけに重要情報を残さない
- **AI ごとに役割を分ける**。日常の登録は iPhone の ChatGPT、大量登録や構造変更は Claude Code
- **全 AI 共通のルール（AI_RULES.md）を 1 つ持つ**。ChatGPT 用・Claude 用の入口ファイルは、そのルールを指すだけにする
- **書誌情報を推測で確定しない**。画像や会話から判別できない値は空欄にして、本人に確認する
- **本人の言葉を守る**。感想は勝手に要約・削除しない。AI の整理案は「AI による整理案」と明記する
- **読み切ることを目的にしない**。`skimmed`（拾い読みで完了）と `abandoned`（中止）を正常な完了として持つ。同時に読むのは 2 冊まで
- **読了後のアクションは 1〜3 件**。期限・完了条件・実行結果を持たせ、完了時は学びを追記する

## 判断したこと

- Notion・Obsidian・Todoist に同じ記録を重複保存しない
- 公開リポジトリなので、個人情報・勤務先の情報・書籍本文の長い引用は記録しない
- ChatGPT が `main` に直接コミットするため、ブランチ・PR は使わず「作業前に必ず pull、競合したら止めて報告」をルールにした

詳細は [Reading Log](/projects/reading-log) を参照。
