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
→ 2026-09-28 に Journey は年表（`.timeline-tables`）、Skills は「ラベル + 値」（`.kv-tables`）へ積み替え、`.label-tables` は無くなった（下の 2026-09-28 の項）。
セルの折り返しは、行の高さではなく `Range.getClientRects()` の上端の種類で数える。行の高さは隣のセルの折り返しに引きずられて、折れていないセルまで 2 行に見える。

### 2026-09-27：GitHub のプロフィールは Claude から変えられない

`gh` のトークンのスコープは `repo` / `workflow` / `gist` / `read:org` / `delete_repo` で、`user` が無い。`gh api -X PATCH /user` で bio を書き換えられないので、
プロフィール（bio・Website 欄）の変更は文案を渡して https://github.com/settings/profile でユーザーが行う。反映の確認は `gh api /user --jq '{bio, blog}'`（読み取りはできる）。
Website 欄は API では `blog` という名前。

### 2026-09-27：`astro preview` を止めるときは `pkill -f` を使わない

`pkill -f "astro preview --port 4399"` は、そのコマンドを含む自分のシェル（Bash ツールの実行）にも一致し、シェルごと終了して preview は残る（終了コード 144）。
`ps -eo pid,args | grep 'astro.mjs preview --port 4399' | grep -v grep` で PID を引いて `kill` する。
同じ日のカードの PR の確認でも、この項目を読まずに `pkill -f "astro preview --port 4329"` を打って 2 回目が起きた。preview を立て直す前にこの項目を見る。

### 2026-09-27：開発ダッシュボード（`dashboard/`）はテンプレートの写し。整形の対象から外し、テンプレートとの違いは 3 か所だけ

- apps-workflow の dashboard スキルのテンプレートを写したもの。サイトの一部ではない（Astro のビルドにも Vercel の配信にも入らない）。依存 0 なので「ライブラリを増やさない」には当たらない
- テンプレートはセミコロン無しで書かれていて、このリポジトリの Prettier 設定と合わない。整形するとテンプレートとの差分が全行に出て、テンプレートが更新されたときに写し直せなくなるので、`.prettierignore` に `dashboard/` を足した
- テンプレートから変えたのは 3 か所：`readProjectSpecific()`（★ の節。本番の反映・禁止語スキャン・件数）、`collect()` の「確認待ちと Beads の重複を除く」処理
  （TODO の確認待ちに Beads の ID を書く運用のため、そのままだと同じ 1 件が 2 行出る）、`index.html` の「今のタスク」の補足行（`###` の小見出しが無いと先頭に「·」だけ残る）。後の 2 つはテンプレート側にも入れる候補
- 本番の反映は、Vercel が GitHub に残すデプロイ記録（environment=Production）と main の先端を比べて判定する。REST だと 3 回・約 4.5 秒かかるので、GraphQL 1 回（約 1.3 秒）にまとめた
- 生成は約 7 秒。大半はテンプレート共通の `gh` 4 回（各 1.5 秒前後）と `bd list`（2〜9 秒。初回が遅い）
- 他の選択肢：Prettier で整形してから使う（テンプレートとの差分が全行に出るので採らなかった）

### 2026-09-27：目次の「今いる節」はスクロール位置の計算で決める（IntersectionObserver にしない）

トップを 1 枚のページ + 左の固定目次にした（`logs/decisions.md` 2026-09-27）。目次の固定は CSS の `position: sticky` だけで済むが、
「今いる節」の強調はスクロール位置を見ないと決まらないので、ここだけ JavaScript を持つ（サイトで 2 つ目。もう 1 つは Ask AI のコピー）。
実装は `src/pages/index.astro` の `<script>` で約 20 行。画面の上から 1/3 の線を最後に通過した節を今いる節とし、目次リンクの `aria-current="location"` を付け替える。
IntersectionObserver で節の出入りを見る案は、最後の節（Ask AI はボタンだけで短い）がページ末尾で線に届かず一度も「今いる節」にならないので、
末尾判定を別に足すことになる。スクロール位置の計算なら「末尾まで来たら最後の節」を 1 行で書けるので、こちらにした。
`scroll` イベントは `requestAnimationFrame` で 1 フレーム 1 回にまとめる。
目次と節の対応は `src/site.ts` の `SECTIONS` 1 か所に置き、目次（`Base.astro`）・節の枠（`HomeSection.astro`）・テスト（`tests/home-sections.test.mjs`）が同じ配列を読む。
`HomeSection` は `SECTIONS` に無い id を渡すとビルドを失敗させる（目次に無い節を作らせない）。

### 2026-09-27：トップの Skills / Journey の短い版は本文（Markdown）を解析して作る

Skills / Journey は HTML と Markdown 版が同じ本文から作られる（SPEC §4 の例外）。トップの短い版（区分ごとの項目名、時期 + 役割）を frontmatter に別に持つと
表の中身を 2 か所で管理することになるので、`src/lib/outline.ts` が本文を解析して取り出す。`##` を区分、`###` か箇条書き先頭の `**太字**` を項目名、
`## 経歴` の表の 1〜2 列目を年表にする。汎用の Markdown パーサではなく `skills.md` / `career.md` の書き方に依存した最小限の解析なので、
書き方を変えると項目が消える。`tests/home-sections.test.mjs` が実データで空にならないことを検査する。
項目名の区切りは「、」にした（項目名に「Java / Spring Boot」「CI / CD」のように「 / 」が含まれるため）。

### 2026-09-27：`build.format: 'file'` だと `Astro.url.pathname` が `.html` 付きになる

ビルド時の `Astro.url.pathname` は `/index.html` `/projects.html` のように拡張子付きで渡る（公開 URL は拡張子なし）。
Phase 1 からこれに気づかず、canonical と `og:url` が `.html` 付きで本番に出ていて、ナビの「今のページ」の強調も一度も効いていなかった。
`Base.astro` で `.html` と末尾の `/index` を落として公開 URL の形にそろえてから、canonical と目次の強調に使う。

### 2026-09-27：カードの一文は `summary` を削らず、別の項目 `tagline` に書く。一文の検査はスキーマに置く

`summary` は詳細ページの冒頭・meta description・Markdown 版・`/llms.txt` の 4 か所で使っている。カードのために 1 文へ削ると AI 向けの情報まで減るので、カード専用の `tagline` を足した（定義は SPEC §1）。
`summary` の最初の 1 文を自動で切り出す案は捨てた。OrgFlow は「Java / Spring Boot」が、AI Study Coach は「AI 協働の練習題材」という但し書き（`logs/decisions.md` 2026-09-26）が落ちるため。
「句点なし・60 字以内」はテストではなくスキーマ（`src/content.config.ts` の `cardTagline`）で検査する。ビルドのエラーにエントリ名と項目名が出るので、どこを直すか分かる。
「！」「？」で 2 文にした場合は通る（今の 16 件には無い）。

### 2026-09-27：画面の重なりを数えるときは、畳まれた `<details>` の中身を除く（`checkVisibility()`）

追従ボタンと本文の重なりを Playwright で数えたとき、375px 幅の詳細 5 ページで「重なりあり」と出た。重なったとされたのは「詳しく読む」に畳まれた本文の表や図で、画面には出ていない。
閉じた `<details>` の中身でも `getBoundingClientRect()` は位置を返した（Chrome が中身を `content-visibility: hidden` で隠しているため、というのは Claude の推定で未確認）。
要素を `el.checkVisibility({ contentVisibilityAuto: true })` で絞ってから数えると、誤検知が消えた。

### 2026-09-27：`astro preview` は 1 つのプロジェクトで 1 本しか立たない。見本は `dist` の写しを別のサーバーで配る

Astro 7 の `astro preview --port <別の番号>` は、同じプロジェクトの preview が既に動いていると
「Preview server already running at http://localhost:4329」と出してすぐ終わる（終了コード 0 なので失敗に見えない）。
ボタンの見本を撮ったときは、`dist` を scratchpad に写して `python3 -m http.server` で配った。この方法は既存の preview に触らず、ビルドし直しても見本の中身が変わらない。
ただし `build.format: 'file'` なので、`/ask` は `/ask.html` と拡張子を付けて開く（Python のサーバーは拡張子を補わない）。
見本の見た目は、撮るときに `page.addStyleTag()` で CSS を差し込んで切り替えた。リポジトリのファイルは変えずに済む。

### 2026-09-27：ビルド後の CSS では `#ffffff` が `#fff` になる。色を突き合わせるときは 3 桁も読む

ボタンの色が CSS 変数の色だけかを Playwright で確かめたとき、`getComputedStyle(document.documentElement).getPropertyValue('--bg')` が `#fff` を返した。
ビルドの圧縮で 6 桁が 3 桁に縮められるためで、6 桁を前提にした変換では白が「変数にない色」と誤検知された。3 桁を 6 桁に戻してから比べる。

### 2026-09-28：Markdown の表は、ページの囲みのクラスと CSS だけで年表・「ラベル + 値」に積み替える

Journey と Skills の表を、Markdown（`career.md` / `skills.md`）もマークアップも変えずに見た目だけ変えた。
変えたのはページの囲みのクラス（`.timeline-tables` / `.kv-tables`）と CSS だけで、Markdown 版と `llms-full.txt` はビルド前後で `cmp` が同一。選んだことと理由：

- **表の部品は `display: block`（年表）と `display: grid`（「ラベル + 値」の 1 行）にした。`display: contents` は使わない。**
  トップの `.kv-list` のように「表全体を 1 つの grid にして行をまたいで列をそろえる」には `tr` を `display: contents` にする必要がある。
  1 行ずつの grid + ラベル列の固定幅（`10rem`。いちばん長い「設計判断の記録」「マイグレーション」が収まる）でも列はそろうので、部品を増やさない方を採った。
  読み上げ上の表の構造は、`display: contents` でも `block` / `grid` でも、ブラウザによっては落ちることがある（元の `table { display: block }` も同じ。Claude の理解で未検証）。
  見出しの文字を DOM に残すことで、何の列かは読み上げで分かるようにした
- **年表の表は `width: auto` にした。** 全体の `table { width: 100% }` のまま左に `margin-left` を足すと、右端が本文の幅からその分はみ出す（受け入れレビューで見つかった）
- **列の見出し（`thead`）は `display: none` にせず、画面から隠すだけにした**（About の節名と同じ書き方）。読み上げでは「時期・役割・主な担当」が残る
- **2 列の表（時期・出来事）と 3 列の表（時期・役割・担当）を、同じクラスの中で `td:nth-child(2):not(:last-child)` で分けた。** 3 列の表の役割だけを太字にするため。ページごとにクラスを分ける案は、Markdown 側に目印が要るので採らなかった
- **年表の点は `--fg-muted`（薄い文字色）。** 見本 A は紫、SPEC §4 の方向は「リンク色だけを効かせる」だが、2026-09-27 のボタンの判断で「青はリンク専用」にしたので、リンクでない点に青を使わなかった。
  ただし同日のデザインの判断には「リンク色（青）だけを効かせる」ともあり、見本 A の紫の点を青に置き換える読み方もできる。灰色か青かはユーザー未確認（`TODO.md` 確認待ち）
  → 2026-09-28 にユーザーが青を選んだ（`logs/decisions.md` 2026-09-28。実装はフェーズ3「仕上げ」）
- 確かめ方：表ごとに各セルの `getBoundingClientRect()` を取り、年表は「上端が行ごとに下がり、左端がそろう」、「ラベル + 値」は「PC で同じ高さ・値が右、375px で値が下・左端がそろう」を数えた
