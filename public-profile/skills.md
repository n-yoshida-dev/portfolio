---
title: Skills
description: 技術スキルを「商用実務」「個人開発（根拠あり）」「理解確認済み・学習中」に分けて記載。技術名の羅列ではなく、何を作り、何を設計し、何を判断したかを根拠のプロジェクトとともに示します。
updated: 2026-09-25
---

**読み方**：このページは 4 つの区分を混ぜません。

| 区分 | 意味 |
|---|---|
| 商用実務 | 業務で担当した。ただしコードを書く仕事ではなかった |
| 個人開発 | 自分のリポジトリで設計・実装した。根拠のプロジェクトを併記 |
| 理解確認済み | 確認問題・自分の言葉での説明で理解を確かめた（実装の根拠はまだ薄い） |
| 学習中 | 学習を始めたが、習熟度を判定できる根拠がない |

習熟度の判定は非公開の学習ログを根拠に手で行っています。
将来は [skill-matrix](/projects/skill-matrix) からこのページを自動生成する予定です（現在は手動更新）。

## 商用実務（約 10 年）

コードを書く力ではなく、**業務を理解し、仕様に落とし、関係者と進め、検証する力**がここに入ります。

- **要件整理・仕様化・設計書**：インフラ製品の導入設計、移行計画、テスト計画、本番作業のタイムチャート
- **テスト工程**：結合テスト・システムテスト・運用テストの計画とリード
- **関係者調整・チームリード**：顧客折衝、7〜8 名のアサイン・教育・ドキュメントレビュー、プリセールス
- **インフラ基礎**：Windows クライアント管理製品の設計・構築、ネットワーク、仮想基盤の保守、Linux 操作（LinuC レベル 1）
- **課題管理**：不確実で引き継ぎが弱い状況でも、課題を切り出して前へ進める

## 個人開発（根拠のあるもの）

### バックエンド：Java / Spring Boot — [OrgFlow](/projects/orgflow)

| 何をしたか | 具体 |
|---|---|
| ドメイン設計 | 申請・承認・監査・マルチテナントを 20 以上の概念に分け、責務を文書化。状態遷移を明示的な状態モデルで表現 |
| DB 設計 | 概念 ER → 論理 ER（DBML）→ 物理 ER の 3 段。shared DB で `tenant_id` により分離し、複合外部キーで境界を強制 |
| API 契約 | OpenAPI を先に書く契約先行。業務操作カタログ → API 群 → path 候補の順で整理 |
| 認証 | Spring Security の OAuth2 Resource Server で JWT（HS256）を発行・検証。「ログイン済み」と「tenant 選択済み」を別の状態として claim で表現 |
| 例外設計 | HTTP ステータスを「クライアントが次に何をすべきか」で選ぶ方針を ADR 化し、`@RestControllerAdvice` で例外種別ごとに応答を決定 |
| 監査ログ | 業務処理と同一トランザクションで書く。外部キーを置かず操作時点の証跡を保持 |
| マイグレーション | Flyway。seed を本体から分離し、locations で環境ごとに切り替え |
| テスト | 単体は Mockito で隔離、DB を伴う検証は Testcontainers の PostgreSQL |
| 設計判断の記録 | ADR 36 本（1 ファイル 1 決定）、実装対応表、ドキュメント入口 |

### フロントエンド：React / TypeScript

- [AI Study Coach](/projects/ai-study-coach)：React 19 + Vite + Supabase。Google ログイン（OAuth）、行レベルセキュリティ（RLS）でユーザーごとにデータ分離、Vercel の preview / production 分離。**コードの多くは AI エージェントが実装し、自分は設計選択・レビュー・DDL 執筆・動作検証を担当**
- React の基礎（state / props / データフロー）は学習中の区分（下記）

### データベース：PostgreSQL

- OrgFlow の DDL・制約設計（CHECK 制約、複合外部キー、text + CHECK による状態列）
- AI Study Coach のテーブル DDL を自分で執筆（制約の命名、外部キーのインデックス）
- ORACLE MASTER Silver SQL 2019

### CI / CD・開発フロー

- GitHub Actions：OrgFlow（Java / Maven）と React アプリの両方で CI を構築。lint / typecheck / test / build と秘密情報スキャン
- ブランチ保護（Ruleset）を自分で設定し、`gh api` で保存値を検証
- PR 経由の squash マージ運用、Vercel の自動デプロイ
- Docker Compose でローカル DB

### AI 協働開発の仕組み — [claude-plugins](/projects/claude-plugins)

- Claude Code のフック（秘密情報のコミット阻止、編集直後の型チェック、起動時の進捗表）とスキル（引き継ぎ、PR フロー）をシェルスクリプトで実装
- マージ前に差分を「完了条件」と仕様に照らす読み取り専用のレビュー用エージェントを定義
- PLAN / SPEC / TODO / KNOWLEDGE / HANDOFF / 判断台帳という文書体系で複数のアプリを並行運用（[Systems](/systems/ai-assisted-development)）

### 静的サイト・ツール

- Jekyll + GitHub Pages（[Reading Log](/projects/reading-log)）、Astro（このサイト）
- Python / シェルによる検証スクリプト（家計 CSV の検算、機密数字のブロック）

## 理解確認済み・学習中

- **Go**：基本構文、struct / slice / map / ポインタ、メソッドまで学習。skill-matrix のバックエンド（CLI・検証ロジック）を Go で実装中。インターフェース、エラー処理、並行処理、`net/http`、テストはこれから
- **React**：起動フロー、JSX、state / props / データフロー、Thinking in React の部品分けまで理解を確認。hooks、データ取得、ルーティングはこれから
- **AWS**：Solutions Architect - Associate を学習中
- **Supabase の認証・RLS**：動作は確認済み。仕組みの言語化はまだ
- **課金（Stripe）**：未着手

## 商用実務で扱っていないもの（誤解を避けるため）

- Web バックエンドの商用開発（Java / Go とも）
- チーム開発でのコードレビュー・デプロイ・運用障害対応の一連の経験

これらを個人開発と公開リポジトリで補っている段階です。
