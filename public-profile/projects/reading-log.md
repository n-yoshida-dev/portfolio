---
title: Reading Log
tagline: 毎週 AI が読書記録を読み、次に読む 1 冊を理由付きで提案する読書管理システム
summary: GitHub を正本に、ChatGPT / Claude / Claude Code を横断して使う読書管理システム。毎週 ChatGPT の定期タスクが読書記録を読み、次に読む 1 冊を理由付きで提案する。今後、会話から積み上げた自分の長期コンテキスト（Personal AI Context）とつなぎ、その文脈も踏まえて優先度を決める予定。
repo: https://github.com/n-yoshida-dev/reading-log
site: https://n-yoshida-dev.github.io/reading-log/
visibility: public
status: active
period: 2026-08 〜
stack: [Markdown, Jekyll, GitHub Pages, ChatGPT Projects, Claude Code]
featured: true
order: 3
systems: [reading-system]
highlights:
  - アプリは作らず、GitHub と既存の AI サービスの組み合わせで「仕組み」だけを作った
  - 1 冊 1 Markdown ファイル。表紙の写真と一言で登録すると、AI が Markdown を書いて GitHub に反映する
  - 完読を目的にしない。拾い読み・中止も正常な完了とし、同時に読むのは 2 冊まで
---

## 何か

本の書誌情報・進捗・メモ・感想・読了後のアクションを、1 冊 1 Markdown ファイルで管理するリポジトリです。
アプリを作ったのではなく、**GitHub と既存の AI サービスを組み合わせて「仕組み」だけを作りました。**

## 特徴

- **正本は GitHub**。ChatGPT のプロジェクトや各 AI のメモリに重要情報を残さない
- **入力は iPhone の ChatGPT**。表紙の写真と一言で登録し、AI が Markdown を書いて GitHub に反映する
- **大量登録・構造変更は Claude Code**。日常と保守で使う AI を分ける
- **次に読む 1 冊を AI が毎週提案する**。ChatGPT の定期タスクが全冊の記録・inbox・前回のレビューを読み、次の 1 冊と理由を週次レビューに書く。
  理由は各本の記録（読む目的・進み具合・やり残したアクションなど）に結び付け、情報が足りないときは「暫定」と書いて推測で埋めない
- **AI の提案と本人の判断を分ける**。ステータスの変更などは「AI 提案、本人未合意」と書き、本人が確認するまで本のファイルに反映しない
- **全 AI 共通のルール（AI_RULES.md）**。書誌情報を推測で確定しない、本人の感想を勝手に要約しない、本文の長い引用を残さない、など
- **完読を絶対視しない**。ステータスに `skimmed`（拾い読みで完了）と `abandoned`（中止）を正常な完了として持つ。同時に読むのは 2 冊まで
- **アクションは 1〜3 件に絞る**。読了後の行動を期限・完了条件付きで残す
- **閲覧は GitHub Pages（Jekyll）**。Markdown を更新すればサイトが追随する

## 判断したこと

- Notion や Obsidian に重複保存しない。将来使うとしても GitHub を一次情報にする
- ブランチ・PR は使わない。ChatGPT が `main` に直接コミットするため、作業前の `git pull` を全 AI のルールにした
- 公開リポジトリなので、個人情報・勤務先の情報・書籍本文の長い引用は記録しない

## これからつなぐもの

今の提案は、読書記録に書かれていることだけを根拠にしています。
今後、ChatGPT との会話から毎週積み上げている自分の長期コンテキスト（非公開。[Personal AI Context System](/systems/personal-ai-context)）を
ChatGPT の定期タスクから読めるようにし、目標や今の関心も踏まえて読む本の優先度を決める予定です。
非公開側の中身は、公開の読書記録には書き写しません。
