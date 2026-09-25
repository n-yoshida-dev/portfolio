# 何を作るか・なぜ作るか

走り書きのままでよい。固まった仕様は `SPEC.md` へ移す。

## 解きたい課題

成果物が GitHub の複数リポジトリ（一部は Private）、Qiita、GitHub Pages、Vercel に散らばっていて、
「何の人で、何を作っていて、どう開発しているか」を 1 か所で見せられない。
また、自分に関する情報の正本は非公開リポジトリにあり、AI に自分のことを調べさせようとしても公開された入口が無い。

## 誰のためのものか

1. **転職の選考で見る人**：短時間で「何の人か」「何を作ったか」「どう開発しているか」を把握したい
2. **AI**：訪問者の ChatGPT / Claude / Gemini が、私について根拠付きで答えられるようにする（`/llms.txt`、Markdown 版、Ask AI）
3. **自分**：分散した成果物の索引。将来は skill-matrix から Skills を自動生成する土台

## 見せたいこと

- **Projects**：何を作ったか（OrgFlow を主力に、skill-matrix / Reading Log / AI Study Coach / claude-plugins。その他は Other にまとめる）
- **Systems**：それらをどう組み合わせて、開発・学習・生活改善を仕組み化しているか
  （Personal AI Context / Learning System / Reading System / AI-assisted Development Workflow）
- **Skills**：技術名の羅列ではなく、何を作り・設計し・判断したか。「商用実務」「個人開発」「理解確認済み」「学習中」を混ぜない
- **Journey / Articles / Ask AI / llms.txt**

## やらないこと（Phase 1）

- skill-matrix / personal-ai-context との自動同期。`public-profile/` は手動管理の「公開用ビュー」
- API・DB・RAG・自前の AI チャット・CMS・認証・analytics の作り込み
- 非公開リポジトリの中身の転載。家族・金銭・住所・転職活動の状況・企業名・現職の内部情報・人事評価・健康は書かない
- 生活系のブログ・note 記事の掲載（技術と無関係で、家族の情報に触れるため）
- 派手な見た目（グラデーション、光るカード、3D、アニメーション、ロゴの羅列）

## Phase 2 の候補（Phase 1 完成後に判断）

skill-matrix → `public-profile/skills.md` の自動生成、GitHub からのプロジェクト情報の自動更新、記事一覧の自動取得、
自前の Ask AI、独自ドメイン、analytics。一覧は `TODO.md` の保留節。

## 技術的な方針（`../CLAUDE.md` の既定から外れる点）

- **Astro（静的出力）+ TypeScript**。React + Vite ではない。内容が Markdown で、サーバー処理が無く、
  `/llms.txt` や各ページの `.md` 版を「1 ファイル 1 エンドポイント」で作れるため。React は必要になったら部分的に足せる
- **サイトをリポジトリ直下に置く**。`frontend/` `backend/` に分けない。バックエンドが無く、Vercel の設定を減らせるため。
  代わりに apps-workflow の編集直後チェックは効かないので、`npm run typecheck` を自分で回す
- **ライブラリは最小限**。CSS はフレームワークなし、JavaScript は Ask AI のコピーボタンだけ
- **ホスティングは Vercel**。GitHub Pages ではない（PR ごとのプレビューと将来の独自ドメインのため）
- **公開情報の線引きを機械化する**。`scripts/check-public-profile.mjs` が禁止語を検査し、CI で必ず走る（ops の原則「判断は人間、検算は機械」）
