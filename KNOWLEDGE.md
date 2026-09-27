# 設計判断とハマりどころ

コードを読めば分かることは書かない。書くのは次の2つだけ。

- **設計判断**：Claude が実装中に複数の選択肢から選んだこと。「なぜそうしたか」を必ず添える。
  ユーザーと合意して決めたことは、ここではなく `logs/decisions.md`（`/decide`）へ
- **ハマったこと**：想定と違った挙動、再発しそうな落とし穴。原因と回避方法をセットで

見出しは `### YYYY-MM-DD：<決めたこと>` の形式。

---

### 2026-09-25：Content Collections のローダーは `glob` と `file`、スキーマは `astro/zod`

- `public-profile/` は `src/content/` の外にあるので、`glob({ base: './public-profile/projects' })` で読む（Astro 5 以降の Content Layer）
- Astro 7 の zod は v4。`import { z } from 'astro/zod'` を使い、`z.string().url()` ではなく `z.url()`（前者は非推奨）
- `articles.json` は `file()` ローダー。配列の各要素に `id` が必須
- 他の選択肢：`src/content/` に置く（既定の場所だが、「公開プロフィールの正本」という意味が薄れるので採らなかった）

### 2026-09-25：YAML の日付は Date になる

`updated: 2026-09-25` は YAML パーサが Date 型として読み、`z.string()` だと `Expected "string", received "object"` でビルドが落ちる。
`z.union([z.date(), z.string()])` で受けて `YYYY-MM-DD` の文字列に変換するようにした。JSON 側（`publishedAt`）は文字列のままなので問題ない。

### 2026-09-25：URL は拡張子なし・末尾スラッシュなし

`trailingSlash: 'never'` + `build.format: 'file'` で `dist/projects.html` を出し、Vercel の `cleanUrls: true` で `/projects` として配信する。
`.md` エンドポイント（`[slug].md.ts`）はファイル名に拡張子を含むので、HTML と同じディレクトリに `orgflow.html` と `orgflow.md` が並ぶ。
sitemap は拡張子なしの URL を出すことを `dist/sitemap-0.xml` で確認した。
`format: 'directory'`（既定）でも動くが、`orgflow/index.html` と `orgflow.md` が別階層になり見通しが悪いので採らなかった。

### 2026-09-25：Prettier は `public-profile/` の Markdown を整形しない

人が読む文書の改行位置や表の桁を整形ツールに変えられると diff が読めなくなるので、`.prettierignore` で `*.md` を除外し、`README.md` だけ対象にした。
`.astro` ファイルは `prettier-plugin-astro` で整形する。

### 2026-09-25：禁止語スキャンの誤検知は「パターンを狭める」で直し、許可リストは作らない

初回のスキャンで「昇格」（習熟度の昇格・手順書への昇格）と「勤務先の情報は記録しない」が誤検知になった。
許可リストを作ると「この行は OK」が増え続けて検査が形骸化するので、パターンの側を狭めた（「昇格」単体を外し、役職名と「昇進」は残す）。
固有名詞（会社名・製品名）は Public リポジトリのパターンに書けない。目視の責任範囲として README に明記した。

### 2026-09-25：OGP 画像は sharp で SVG から生成する

Astro が画像処理のために sharp を同梱しているので、追加の依存なしに `scripts/generate-og.mjs` で 1200×630 の PNG を作れる。
ビルドのたびに生成せず、生成物（`public/og.png`）をコミットする。文言を変えるときだけ再実行する。

### 2026-09-25：apps-workflow の編集直後チェックはこのリポジトリでは動かない

`check-edited.sh` は `frontend/*.ts(x)` と `backend/*.go` しか見ないので、リポジトリ直下に置いた `src/` は対象外。
編集後は `npm run typecheck`（`astro check`）を自分で回す。`guard-secrets.sh`（コミット前の秘密情報検査）と起動時の進捗表は動く。

### 2026-09-26：Vercel の「デプロイごとの URL」は外から開けない。本番ドメインで確認する

初回デプロイ直後にユーザーが貼った `portfolio-<ハッシュ>-<チーム>.vercel.app` は、`curl` すると 302 で `vercel.com/sso-api` に飛び、
`/llms.txt` も取れなかった。原因は Deployment Protection の既定「Standard Protection」で、デプロイごとの URL と
`portfolio-git-main-…` の枝 URL はログインが要る。本番ドメイン（Settings → Domains の `portfolio-self-alpha-….vercel.app`）は
同じ設定のまま 200 で開き、`llms.txt` のリンクも `VERCEL_PROJECT_PRODUCTION_URL` 由来でこのドメインになっていた。
回避：本番 URL の確認は必ず Settings → Domains のドメインで行う。デプロイ画面の URL で 302 が返っても設定は変えない。

### 2026-09-26：トップの要点は本文から切り出さず、frontmatter の `highlights` に持つ

Home から profile.md の本文を外すとき、「本文の最初の節を要約して出す」案と「frontmatter に要点 3 行を別に持つ」案があった。
後者にした。本文は AI 向け（`/profile.md`・`/llms-full.txt`）に詳しいまま残し、人間向けの短い版は別の項目として書く方が、
「どちらを短くしたか」が frontmatter を見れば分かり、要約の生成ロジックも要らない。`max(3)` で 3 行に制限し、増やしたくなったら型で止まる。
`pageToMarkdown` でも highlights を先頭に出しているので、AI も同じ 3 行を最初に読む。

### 2026-09-26：「1 画面に収まる」の確認は Playwright で撮る（このリポジトリには入れない）

完了条件が「PC（1280×800）と 375px 幅でスクロールせずに見える」のとき、CSS からの概算では境界付近の判定ができない。
`astro preview` を起動し、Playwright の Chromium でその大きさのビューポートを撮って目視した。
Playwright はこのリポジトリの依存に足さず（ライブラリを増やさない方針）、別リポジトリにある既存のインストールを絶対パスで import した。
撮影スクリプトはセッションの scratchpad に置いた使い捨てで、
`chromium.launch()` → `newContext({ viewport })` → `page.goto(url, { waitUntil: 'networkidle' })` → `screenshot()` の 4 行で済む。
参考サイトの比較（23 件）も同じ方法で撮った。

### 2026-09-27：詳細ページは「highlights を書いたエントリだけ」本文を畳む

全エントリを一律に畳む案もあったが、本文が 2〜4 行（80〜380 字）のエントリまで「詳しく読む」を押させるのは手間が増えるだけなので、
`highlights` の有無で切り替えた（部品は `src/components/FoldedBody.astro`）。書き忘れで長い本文が丸見えになるのを防ぐため、
「本文 400 字超なら highlights 必須」を `tests/public-profile-detail.test.mjs` で検査する。400 字は、見出し・要約・リンク・技術タグが 300〜400 字を使うので、
完了条件の 800 字から引いた残り。profile と違い、projects / systems の `highlights` は Markdown 版に出さない
（本文に同じ事実が全部あり、完了条件が「`.md` を変えない」だったため）。関連する仕組み / プロジェクトの一覧は題名だけにした
（AI-assisted Development は関連が 10 件あり、要約付きだとそれだけで 800 字を超える）。
開閉は `<details>` なので JavaScript を出さない。Chrome はページ内検索で閉じた `<details>` の中もヒットさせて自動で開く。

### 2026-09-27：Skills / Journey は本文そのものを短くした（Markdown 版も短くなる）

Skills / Journey は HTML と Markdown 版が同じ本文から作られるので、表を短くすると AI 向けの `/skills.md` `/journey.md` も約 1 割短くなる
（3,117 → 2,827 字、1,999 → 1,679 字）。要約を frontmatter に別に持つ案（Home や詳細ページと同じ形）は、表の中身を 2 か所で管理することになるので採らなかった。
AI 向けの情報を減らさないよう、表から削った技術の細部（OAuth2 Resource Server、Flyway の `locations`）は `projects/orgflow.md` の本文へ移した
（HTML では畳まれ、Markdown 版には全文が出る。SPEC §4 に例外として明記）。それ以外に落としたのは言い換えと自己評価（「厳しい状況で仕事を完遂すること」など）で、
時期・役割・担当・数字は残した。Journey の「身についたこと」列は Skills の「商用実務」とほぼ同じ内容だったので外し、Skills に無かった「見積」「セキュリティ・可用性」だけを Skills へ移した。
「身についたこと」にあった語を Journey の「主な担当」に入れるのはやめた（「身についた」を「担当した」と言い換えることになり、事実の確認は本人にしかできないため）。
削った語が別のページに残っているかは、`grep -r '<語>' public-profile/` で 1 語ずつ確かめる（受け入れレビューで 2 語の抜けが見つかった）。
3 列の表は、auto レイアウトだと 1 列目の「2016〜2018」が「〜」の後ろで折れる。Skills / Journey の本文を `.label-tables` で囲み、1 列目だけ `white-space: nowrap` にした
（全ページの表に掛けると、OrgFlow 詳細の「できていること」のように 1 列目が長い表で横幅があふれる）。
セルの折り返しは、行の高さではなく `Range.getClientRects()` の上端の種類で数える。行の高さは隣のセルの折り返しに引きずられて、折れていないセルまで 2 行に見える。
