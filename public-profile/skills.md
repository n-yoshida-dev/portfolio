---
title: Skills
description: 使える技術を、自分で書いて作ったもの・AI と開発する仕組み・学習中の 3 つに分け、確かめられる場所（リポジトリ）と一緒に載せています。
updated: 2026-10-06
---

**3 つに分けています**：自分で書いて作った（自分でコードを書いた作品があるもの）／AI と開発する仕組み（AI に開発を任せるための道具を、自分で作ったもの）／学習中（勉強中で、作品で示せるところまではまだ届いていないもの）。
AI がコードを書いたアプリ（[skill-matrix](/projects/skill-matrix) など）は、技術の根拠に数えていません。仕事でやってきたことは [Journey](/journey) にあります。

## 自分で書いて作った

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

### データベース：PostgreSQL — [OrgFlow](/projects/orgflow)

- OrgFlow の DDL・制約設計（CHECK 制約、複合外部キー、text + CHECK による状態列）
- ORACLE MASTER Silver SQL 2019

### CI・ブランチ運用：GitHub Actions — [OrgFlow](/projects/orgflow)

- OrgFlow（Java / Maven）の CI。lint / test / build と秘密情報スキャン
- ブランチ保護（Ruleset）を自分で設定し、`gh api` で保存値を検証
- PR 経由の squash マージ、Docker Compose でローカル DB

## AI と開発する仕組み

### Claude Code のプラグイン — [claude-plugins](/projects/claude-plugins)

- 秘密情報のコミットを止めるフック、編集直後の型チェック、起動時の進捗表
- 引き継ぎと、PR の作成からマージまでの手順を書いたスキル
- マージ前に、差分を「完了条件」と仕様に照らして検品する読み取り専用のレビュー役

### 文書で AI と分担する — [AI-assisted Development Workflow](/systems/ai-assisted-development)

- PLAN / SPEC / TODO / KNOWLEDGE / HANDOFF / 判断台帳の 6 つの文書を、どのアプリにも同じ形で置く
- [AI Study Coach](/projects/ai-study-coach) は、実装を AI エージェントに任せ、自分は要件・設計の選択・動作の確認を受け持って公開まで進めた練習（React / Supabase の根拠には数えない）

## 学習中

- **React**：JSX、state / props、データの流れ、画面を部品に分ける考え方まで。hooks、データ取得、ルーティングはこれから
- **Go**：基本の文法、struct / slice / map / ポインタ、メソッドまで学んで一時停止中。インターフェース、エラー処理、並行処理、テストはこれから
- **AWS**：Solutions Architect - Associate の試験に向けて勉強中

将来は、このページを [skill-matrix](/projects/skill-matrix)（学習の理解度を記録している自作ツール）から自動で作る予定です。
