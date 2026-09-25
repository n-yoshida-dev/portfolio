# TODO

SessionStart フックが `##` 見出しごとに `- [x]` / `- [ ]` を数えて進捗表を出し、`- [ ]` の行を先頭12件まで提示する。**この記法を崩さないこと。**
着手順に並べる。上ほど先にやる。**1 タスクは PR 1 本の大きさ。** 各タスクに「完了条件：」を付ける（次の行に半角スペース 2 つで字下げ）。
見出しに「確認待ち」「保留」を含む節は合計から外れる。

## フェーズ1：Phase 1（公開できる状態まで）

- [x] リポジトリ作成・Astro の骨組み・public-profile のコレクション定義
  完了条件：`npm run build` が通り、`dist/` に HTML が出る
- [x] public-profile の執筆（profile / career / skills / projects 12 件 / systems 4 件 / articles 21 本）
  完了条件：`npm run lint` がヒット 0 件。非公開リポジトリの中身を転載していない
- [x] Home / Projects / Systems / Skills / Journey / Articles / Ask AI の各ページ
  完了条件：ブラウザで全ページが開き、モバイル幅（375px）で横スクロールが出ない
- [x] llms.txt / llms-full.txt / 各ページの Markdown 版
  完了条件：`dist/llms.txt` が H1・要約・各セクションのリンクを持ち、リンク先の `.md` がすべて存在する
- [x] 禁止語スキャン + 参照整合テスト + CI
  完了条件：`npm run test` が通り、CI が PR で緑になる
- [x] README（構成・運用・公開情報の線引き・デプロイ手順）
  完了条件：README だけ読んで、プロジェクトの追加とデプロイができる
- [ ] Vercel に接続して本番 URL を得る（ユーザー操作）
  完了条件：本番 URL で `/llms.txt` が開き、リンクが本番 URL になっている
- [ ] 本番 URL で Ask AI のプロンプトを実際に ChatGPT / Claude に投げ、回答が Skills の区分を守っているか確認する
  完了条件：回答が「商用実務」と「個人開発」を混同していない。混同するなら llms.txt の指示文を直す

## 確認待ち（ユーザーの回答が要るもの）

- [x] public-profile の記述レビュー（特に career.md と skills.md）。事実と違う点・出したくない点があれば直す（2026-09-26 回答済み。`logs/decisions.md` 2026-09-26）
- [x] Systems の「Personal AI Context System」は、非公開リポジトリの構造（入口 / 詳細 / 履歴 / メタ）まで書いている。この粒度でよいか（2026-09-26 「このままでよい」）
- [x] 生活系ブログ・note は載せない判断でよいか（`logs/decisions.md` 2026-09-25。2026-09-26 「載せない」で確定）

## フェーズ2：Phase 2 候補（保留）

- [ ] skill-matrix → `public-profile/skills.md` の自動生成
  完了条件：skill-matrix の `data/state.json` から skills.md を生成するスクリプトがあり、区分（商用実務 / 個人開発 / 学習中）が保たれる
- [ ] GitHub からプロジェクト情報（説明・最終更新・言語）を自動取得
  完了条件：`projects/*.md` の frontmatter に手で書いている項目のうち、GitHub API で取れるものが取れる
- [ ] Qiita の記事一覧の自動取得
  完了条件：`articles.json` が Qiita API から生成できる
- [ ] 独自ドメイン（`SITE_URL` の設定だけで済むようにしてある）
- [ ] analytics（プライバシーに配慮したもの）
- [ ] 自前の Ask AI（RAG）。訪問者の AI に任せる方式で足りなければ
