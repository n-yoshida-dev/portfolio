---
title: AI Study Coach
summary: 学習記録を管理する React + TypeScript + Supabase のアプリ。AI コーディングエージェントと協働して「要件 → 実装依頼 → レビュー → CI → デプロイ → 認証」を一通り公開まで持っていく訓練の題材。
repo: https://github.com/n-yoshida-dev/ai-study-coach
site: https://ai-study-coach-alpha.vercel.app/
visibility: public
status: paused
period: 2026-07 〜 2026-08
stack: [React 19, TypeScript, Vite, Supabase, PostgreSQL, Vitest, Oxlint, GitHub Actions, Vercel]
featured: true
order: 4
systems: [ai-assisted-development, learning-system]
---

## 何か

学習記録を登録・閲覧する Web アプリです。機能そのものより、
**AI エージェント（Codex / Claude Code）に実装を任せながら、自分が設計・レビュー・検証を担う**練習として作りました。
OrgFlow が「自分で考えて自分で書く」場なのに対し、こちらは「AI に任せて自分は判断する」場と役割を分けています。

## 通したこと

| 段階 | 内容 |
|---|---|
| 要件定義・タスク分割 | 要件を書き、AI に渡せる粒度のタスクに分けた |
| 実装依頼とレビュー | AI が書いたコードの差分を読み、意図と違う点を指摘して直させた |
| CI | GitHub Actions で lint / test / build。CI が赤くなる実験も行い、終了コードで合否が決まることを確認 |
| ブランチ保護 | Ruleset で PR 必須・必須チェック・force push 禁止を自分で設定し、`gh api` で保存値を検証 |
| デプロイ | Vercel。PR ごとに preview、main へのマージで production |
| 認証 | Supabase Auth による Google ログイン（OAuth）。OAuth の設定はコンソール操作を自分で実施 |
| データ分離 | 行レベルセキュリティ（RLS）でユーザーごとにデータを分離。他人の `user_id` を詐称した INSERT が拒否されることをブラウザで確認 |

## 自分が担当した範囲（正直に）

- テーブルの DDL は自分で書き、レビュー指摘（`date` 型、空文字と NULL の統一、制約の命名、外部キーのインデックス）を反映した
- 認証・データアクセスのコードは AI が実装した。自分は設計の選択（型は CLI で生成する、`user_id` はアプリが送る）と動作検証を担当した
- 「BaaS が自動生成できるのは CRUD だけで、業務ロジックや監査は自動化できない」と自分で指摘し、バックエンド自作との使い分けを整理した

## 状態

Phase 4（認証・ユーザー管理）まで完了して一区切り。以降を続けるかは未定です。
