---
title: OrgFlow
summary: 申請・承認フローを題材にした業務ワークフロー API。Java / Spring Boot で、マルチテナント、JWT 認証、権限、監査ログ、状態遷移を扱う主力プロジェクト。
repo: https://github.com/n-yoshida-dev/orgflow
visibility: public
status: active
period: 2026-03 〜
stack: [Java 21, Spring Boot, Spring Security, Spring Data JPA, PostgreSQL, Flyway, OpenAPI, Testcontainers, Docker Compose, GitHub Actions]
featured: true
order: 1
systems: [ai-assisted-development, learning-system]
---

## 何を作っているか

社内の「申請して、承認されて、記録が残る」業務を扱う API です。
単なる CRUD ではなく、業務アプリで避けて通れない次の要素を最初から題材に含めています。

- **マルチテナント**：複数の会社（tenant）が 1 つの DB を共有しながら、データが混ざらない
- **権限**：tenant 全体の管理権限と、部門（internal organization）単位の業務権限を分ける
- **申請の状態遷移**：下書き → 申請 → 承認 / 差し戻し / 却下 を明示的な状態モデルで表現
- **承認ルートの固定**：申請時点で評価した承認ルートを申請に紐づけて保存し、後からルール設定が変わっても既存の申請に影響しない
- **監査ログ**：誰が・いつ・何をしたかを、業務処理と同じトランザクションで記録

## 現在の実装範囲（2026-09 時点）

| できていること | まだのもの |
|---|---|
| ログイン（DB の users と BCrypt で照合）→ JWT 発行 | 申請の submit / 承認 / 差し戻しの状態遷移 |
| JWT の検証（署名・issuer・期限）と保護 API | アプリ層での権限チェック（スキーマと設計は済み） |
| tenant の選択（所属確認 → `current_tenant_id` claim 入りの JWT 再発行） | フロントエンド |
| 所属 tenant 一覧、申請の下書き作成 API | デプロイ（AWS を想定） |
| 例外ハンドラによる HTTP ステータスの一元管理、ログ出力 | |
| 単体テスト（Mockito）、DB を伴うテスト（Testcontainers）、CI | |

正確な現状は [リポジトリ](https://github.com/n-yoshida-dev/orgflow) の README と `docs/` を見てください。

## 設計で判断したこと

設計判断は ADR（Architecture Decision Record。「何を・なぜ決めたか」を 1 ファイル 1 決定で残す文書）として 36 本公開しています。
一部を挙げます。

- **tenant と internal organization を分ける**：契約主体（データ分離の境界）と部門（申請の帰属先）は責務が違う
- **shared DB で `tenant_id` により分離し、複合外部キーで境界を強制する**：DB 分割より運用が軽く、境界の漏れは DB 制約で防ぐ
- **role は user ではなく「所属」に付与する**：同じ人でも tenant や部門ごとに権限が違うため
- **「ログイン済み」と「tenant 選択済み」を別の状態にする**：JWT の claim で表現し、claim 不正は 401、未選択は 403、所属なしは 404 に分ける
- **HTTP ステータスは「クライアントが次に何をすべきか」で選ぶ**：直して再送なら 422、権限を得てからなら 403、存在を明かさないなら 404
- **OpenAPI を先に書く**：業務操作カタログ → API 群 → path 候補 → YAML の順で整理し、実装は契約に合わせる
- **状態列は enum 型ではなく text + CHECK 制約**：状態を増やすときのマイグレーションを軽くする
- **main への変更は PR と squash マージのみ**：ブランチ保護を設定し、CI を必須チェックにする

## 進め方

- 題材選定 → 設計概要 → 業務ルール → 概念 / 論理 / 物理 ER 図 → OpenAPI → 実装、の順に進めた
- 最初の 4 か月は ChatGPT を「継続メンター」として相談しながら自分で実装し、2026-07 からは Claude Code を併用
- 実装の過程を Qiita に連載（[Articles](/articles)）。認証・JWT・マルチテナントの記事はこのプロジェクトが題材

## 学んだこと

- ER 図から書き始めると詰まる。先に「概念が何を表すか」を文章で固定する必要があった
- 例外と HTTP ステータスの対応は、実装より「誰が次に何をするか」で決めると迷わない
- Flyway は起動のたびに走る。seed を本体から分離しないと本番にも seed が入る問題を自分で見つけて直した
