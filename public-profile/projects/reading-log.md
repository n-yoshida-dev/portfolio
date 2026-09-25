---
title: Reading Log
summary: GitHub を正本に、ChatGPT / Claude / Claude Code を横断して使う読書管理システム。iPhone から登録し、GitHub Pages で閲覧し、週次レビューを AI が回す。
repo: https://github.com/n-yoshida-dev/reading-log
site: https://n-yoshida-dev.github.io/reading-log/
visibility: public
status: active
period: 2026-08 〜
stack: [Markdown, Jekyll, GitHub Pages, ChatGPT Projects, Claude Code]
featured: true
order: 3
systems: [reading-system]
---

## 何か

本の書誌情報・進捗・メモ・感想・読了後のアクションを、1 冊 1 Markdown ファイルで管理するリポジトリです。
アプリを作ったのではなく、**GitHub と既存の AI サービスを組み合わせて「仕組み」だけを作りました。**

## 特徴

- **正本は GitHub**。ChatGPT のプロジェクトや各 AI のメモリに重要情報を残さない
- **入力は iPhone の ChatGPT**。表紙の写真と一言で登録し、AI が Markdown を書いて GitHub に反映する
- **大量登録・構造変更は Claude Code**。日常と保守で使う AI を分ける
- **全 AI 共通のルール（AI_RULES.md）**。書誌情報を推測で確定しない、本人の感想を勝手に要約しない、本文の長い引用を残さない、など
- **完読を絶対視しない**。ステータスに `skimmed`（拾い読みで完了）と `abandoned`（中止）を正常な完了として持つ。同時に読むのは 2 冊まで
- **アクションは 1〜3 件に絞る**。読了後の行動を期限・完了条件付きで残す
- **閲覧は GitHub Pages（Jekyll）**。Markdown を更新すればサイトが追随する

## 判断したこと

- Notion や Obsidian に重複保存しない。将来使うとしても GitHub を一次情報にする
- ブランチ・PR は使わない。ChatGPT が `main` に直接コミットするため、作業前の `git pull` を全 AI のルールにした
- 公開リポジトリなので、個人情報・勤務先の情報・書籍本文の長い引用は記録しない
