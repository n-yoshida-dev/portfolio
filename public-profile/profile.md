---
title: Profile
description: Naoki Yoshida。業務システムの現場で仕様化・調整・テストを担ってきたソフトウェアエンジニア。Java/Spring Boot の個人開発と React の学習、AI・GitHub を組み合わせた開発・学習の仕組みづくりを公開しています。
updated: 2026-09-26
tagline: 業務システムの現場で身につけた「仕様を固め、関係者と進める力」を、個人開発と、AI・GitHub・自作ツールを組み合わせた開発・学習の仕組みづくりへ広げています。
links:
  - label: GitHub
    url: https://github.com/n-yoshida-dev
    note: すべてのコードと設計判断（ADR）の一次情報
  - label: Qiita
    url: https://qiita.com/n-yoshida-dev
    note: Spring Boot / 認証 / API 設計の学習記録（連載）
  - label: Reading Log
    url: https://n-yoshida-dev.github.io/reading-log/
    note: 読書記録の公開サイト（GitHub Pages）
---

## 何の人か

日本のソフトウェアエンジニアです。約 10 年、事業会社の情報システム部門と SIer で、
インフラ製品の導入設計・構築、要件整理、関係者調整、テスト工程、チームのリードを担当してきました。
2025 年からはアプリケーション開発部門で、移行計画・テスト計画・課題管理といった「開発を成立させる側」の仕事をしています。

コードを書く力は、業務ではなく個人開発で積んでいます。
2026 年 3 月から Java / Spring Boot で業務ワークフローアプリ [OrgFlow](/projects/orgflow) を設計・実装し、
並行して React を学習中です。

## 何を作っているか

- **業務アプリ**：申請・承認・監査・マルチテナントを扱う OrgFlow（Spring Boot）
- **自分のためのツール**：学習の理解度を可視化する skill-matrix、読書記録 Reading Log、家計・タスク・メールの半自動化
- **開発の仕組み**：Claude Code のプラグイン（フック・スキル・レビュー役）、AI 間で共有する個人コンテキストのリポジトリ

一覧は [Projects](/projects)、組み合わせ方は [Systems](/systems) にあります。

## どういう開発スタイルか

- **設計判断を文書に残す**：ADR（Architecture Decision Record）、OpenAPI を先に書く契約先行、ER 図を概念・論理・物理の 3 段で持つ
- **AI と分業する**：設計と判断は自分、実装の補助・検証・レビューは AI。AI が書いたコードは説明できるまでレビューする
- **仕組みで防ぐ**：秘密情報のコミット阻止フック、CI、マージ前の受け入れレビュー、公開プロフィールの禁止語スキャン
- **根拠のない「できる」を書かない**：習熟度は根拠（実装・記事・確認問題）付きでしか上げない。[Skills](/skills) はその方針で書いています

## このサイトについて

このサイトは「公開してよい情報だけ」を明示的に置いた場所です。
非公開のリポジトリ（学習ログ・個人コンテキスト・雑務）から、公開可能な部分だけを抜き出して手で書いています。
AI に私のことを調べさせたい場合は [Ask AI](/ask) と [llms.txt](/llms.txt) を使ってください。
