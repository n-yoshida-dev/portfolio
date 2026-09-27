---
title: Skills
description: 技術スキルを 4 つの区分（商用実務 / 個人開発 / 理解確認済み / 学習中）に分けて、根拠のプロジェクトとともに記載しています。
updated: 2026-09-27
---

**区分は混ぜません**：商用実務（業務で担当。コードを書く仕事ではない）／個人開発（自分のリポジトリで設計・実装）／理解確認済み（確認問題・自分の言葉での説明で確認。実装の根拠はまだ薄い）／学習中（判定できる根拠がまだない）。
判定は非公開の学習ログを根拠に手で行い、将来は [skill-matrix](/projects/skill-matrix) から自動生成する予定です。

## 商用実務（約 10 年）

コードを書く力ではなく、**業務を理解し、仕様に落とし、関係者と進め、検証する力**がここに入ります。

- **要件整理・仕様化・設計書**：インフラ製品の導入設計、移行計画、テスト計画、本番作業のタイムチャート
- **テスト工程**：結合テスト・システムテスト・運用テストの計画とリード
- **関係者調整・チームリード**：顧客折衝、7〜8 名のアサイン・教育・ドキュメントレビュー、見積、プリセールス
- **インフラ基礎**：IT 資産管理製品（SKYSEA Client View）の導入設計・構築を約 5 年、ネットワーク・セキュリティ・可用性の基礎、仮想基盤の保守、Linux 操作（LinuC レベル 1）
- **既存コードの読解**：稼働中の Java アプリケーションを読んで設定変更・障害対応・バグの原因調査を行った（機能追加・改修は未経験）
- **課題管理**：不確実で引き継ぎが弱い状況でも、課題を切り出して前へ進める

## 個人開発（根拠のあるもの）

### バックエンド：Java / Spring Boot — [OrgFlow](/projects/orgflow)

| 何をしたか | 具体 |
|---|---|
| ドメイン設計 | 18 の主要概念に分けて責務を文書化、状態遷移を状態モデルで表現 |
| DB 設計 | 概念 → 論理（DBML）→ 物理の 3 段の ER、`tenant_id` と複合外部キーで境界を強制 |
| API 契約 | OpenAPI の契約先行（業務操作カタログ → API 群 → path 候補） |
| 認証 | Spring Security で JWT（HS256）を発行・検証、tenant 選択の前後を claim で区別 |
| 例外設計 | HTTP ステータスの選び方を ADR 化、`@RestControllerAdvice` で一元化 |
| 監査ログ | 業務処理と同一トランザクション、外部キーなしで操作時点の証跡を保持 |
| マイグレーション | Flyway、seed を本体から分離して環境ごとに切り替え |
| テスト | 単体は Mockito、DB を伴う検証は Testcontainers（PostgreSQL） |
| 設計判断の記録 | ADR 36 本（1 ファイル 1 決定）、実装対応表、ドキュメント入口 |

### データベース：PostgreSQL

- OrgFlow の DDL・制約設計（CHECK 制約、複合外部キー、text + CHECK による状態列）
- ORACLE MASTER Silver SQL 2019

### CI / CD・開発フロー

- GitHub Actions：OrgFlow（Java / Maven）で CI を構築。lint / test / build と秘密情報スキャン
- ブランチ保護（Ruleset）を自分で設定し、`gh api` で保存値を検証
- PR 経由の squash マージ運用、Vercel の自動デプロイ
- Docker Compose でローカル DB

### AI 協働開発の仕組み — [claude-plugins](/projects/claude-plugins)

- Claude Code のフック（秘密情報のコミット阻止、編集直後の型チェック、起動時の進捗表）とスキル（引き継ぎ、PR フロー）をシェルスクリプトで実装
- マージ前に差分を「完了条件」と仕様に照らす読み取り専用のレビュー用エージェントを定義
- PLAN / SPEC / TODO / KNOWLEDGE / HANDOFF / 判断台帳という文書体系で複数のアプリを並行運用（[Systems](/systems/ai-assisted-development)）
- AI エージェントに実装を任せ、自分は要件・設計選択・レビュー・動作検証を担う練習として [AI Study Coach](/projects/ai-study-coach) を公開まで通した（React / Supabase の実力の根拠には数えない）

### 静的サイト・ツール

- Jekyll + GitHub Pages（[Reading Log](/projects/reading-log)）、Astro（このサイト）
- Python / シェルによる検証スクリプト（家計 CSV の検算、機密数字のブロック）

## 理解確認済み・学習中

- **Go**：基本構文、struct / slice / map / ポインタ、メソッドまで学習し、現在は一時停止中。インターフェース、エラー処理、並行処理、`net/http`、テストは未着手。skill-matrix のバックエンドは Go を採用しているが AI エージェントとの協働で実装しており、Go の実力の根拠には数えない
- **React**：起動フロー、JSX、state / props / データフロー、Thinking in React の部品分けまで理解を確認。hooks、データ取得、ルーティングはこれから。AI Study Coach と skill-matrix のフロントエンドは AI 協働で実装しており、根拠には数えない
- **AWS**：Solutions Architect - Associate を学習中
- **Supabase の認証・RLS**：動作は確認済み。仕組みの言語化はまだ
- **課金（Stripe）**：未着手

## 商用実務で扱っていないもの（誤解を避けるため）

- Web バックエンドの新規機能の実装・改修（Java / Go とも。既存コードの読解は上の「商用実務」）
- チーム開発でのコードレビュー・デプロイの一連の経験

これらを個人開発と公開リポジトリで補っている段階です。
