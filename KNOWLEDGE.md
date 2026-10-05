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
→ 2026-09-28 に分かった正しい止め方：**`npx astro preview stop`**。Astro 7 の `astro preview` は、AI エージェントから起動されたと判定すると（`node_modules/astro/dist/cli/preview/index.js` の `isRunByAgent()`。人が端末で起動したときは手前で動き Ctrl+C で止まる）自分で裏に回り（親プロセスが `/init` になる）、
起動したコマンドは「Preview server running at …（pid …）Stop: astro preview stop」と出してすぐ終わる。
なので起動したシェルやバックグラウンドのタスクを止めても preview は残る。2026-09-27 の昼から 1 日近く preview が置き去りになったのはこのため。
使い終わったら `npx astro preview stop` を打ち、`ps` で `astro.mjs preview` が残っていないことを確かめてから区切る

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

### 2026-09-28：Skills のカードは本文から取り出す。区分の定義は冒頭の 1 行から読む

`/skills` の区分のカード（見出し・区分の定義・項目名・根拠のリンク）は、`skills.md` の本文を `src/lib/outline.ts` の `skillOverview` で読んで作る。選んだことと理由：

- **カード用の文章を frontmatter に別に書く案は採らなかった。** 同じ事実を本文と frontmatter の 2 か所で持つことになり、片方だけ直す事故が起きる。
  トップの Skills 節も本文から作っている（`skillGroups`）ので、それにそろえた
- **区分の定義は、最初の `##` より前にある「A（定義）／B（定義）」の行から読む。** 見出しが「理解確認済み・学習中」のように区分を「・」でつなぐときは、2 つの定義を「／」でつなぐ。
  その行より後ろの文（「判定は…」）はカードの下の注記にし、`[表示](URL)` はリンクのまま出す（`inlineSegments`）
- **トップの `skillGroups` は変えず、関数を分けた。** トップは「扱っていないもの」を出さない（項目名が無いので）が、カードでは 4 枚目として出す。
  共通の規則を 1 つの関数に寄せると、トップの見え方まで変わる
- 項目名の探し方は `###` 見出し → 箇条書き先頭の太字 → 箇条書きの本文（括弧の前まで）の順。「課金（Stripe）」のように太字の項目名に括弧が入るのは正しい形なので、括弧を落とすのは太字の無い箇条書きだけ
- 畳んだ本文（`<details>`）の中は、閉じているあいだ `innerText` に入らない。「開いた直後に見える文字数」は `main` の `innerText` で数えられる（閉じて 478 字、開いて 2,598 字）

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
  → 2026-09-28 にユーザーが青を選んだ（`logs/decisions.md` 2026-09-28）。2026-09-29 のフェーズ3「仕上げ」で `--link` にした
- 確かめ方：表ごとに各セルの `getBoundingClientRect()` を取り、年表は「上端が行ごとに下がり、左端がそろう」、「ラベル + 値」は「PC で同じ高さ・値が右、375px で値が下・左端がそろう」を数えた

### 2026-09-29：トップの 3 点は、ビルドの後に `dist/index.html` を読んで検査する

骨組みの PR で足した単体テスト（`tests/home-sections.test.mjs`）は、目次の定義に `about` `projects` `systems` の節があるかしか見ておらず、節が空でも通っていた。
単体テストはビルドの前に走るので出来上がったページを読めない。Astro の Container API で単体テストの中にページを描く案もあったが、
コンテンツコレクションを読むために Vite の設定をテストへ持ち込むことになるので採らなかった。
代わりに `scripts/check-home.mjs`（`npm run check:home`）で、ビルドした `dist/index.html` の節を切り出し、About に名前（h1）と一言、Projects と Systems にカードが 1 枚以上あるかを見る。
CI では「AI 向けファイルがあるか」と同じくビルドの後の段に置いた。判定の規則は作り物の HTML で単体テストしている（`tests/check-home.test.mjs`）。
書いたときに、節を切り出す位置を 1 文字ずらして開始タグの `<` を落とし、タグが本文扱いになって文字数が水増しされる不具合があった。その単体テストが見つけた

### 2026-09-29：検査をパイプでつなぐと、最後のコマンドの成否で判定される

2026-09-28 に `npm run format:check 2>&1 | tail -1 && git commit …` と打ち、整形の指摘が出たのにコミットと push まで進んだ。
シェルはパイプの終了コードを最後のコマンド（`tail`）で決めるので、`format:check` の失敗が `&&` に伝わらない。
止めたい検査は、パイプにつながず単独で `&&` につなぐ（出力を短くしたいときは `> /dev/null 2>&1` で捨てる）。`set -o pipefail` でも防げる

### 2026-10-03：トップの要点は文字列を区切らず、frontmatter で「ラベル・見出し・補足」に分けて持つ

About の要点を「小見出し → 太字の見出し → 補足」で出すことになり（`logs/decisions.md` 2026-10-03）、`profile.md` の `highlights` を文字列から `{ label, title, detail }` に変えた。
最初の「。」で区切って見出しと補足に分ける案もあったが、3 つ目の要点には「。」が無く、小見出しはどこにも書かれていないので採らなかった。
`highlights` を読むのはトップと Markdown 版（`pageToMarkdown`）だけで、Markdown 版では「- 何の人か：見出し。補足」の 1 行にしている。projects / systems の `highlights`（詳細ページの要点）は文字列のまま

### 2026-10-03：トップの Journey の担当は、経歴表の 3 列目をそのまま出す

見本 B は担当を作り手（AI）が独自に短くしていた。そのまま写すと同じ事実を `career.md` とトップの 2 か所で持つことになるので、表の 3 列目をそのまま出した（`careerTimeline` の `detail`）。
PC の 4 列では 1 列が 4〜5 行になる。長すぎると感じたら、トップで削るのではなく表のセル（Journey ページと Markdown 版も同じ文）を短くする

### 2026-10-03：Articles の図は月の数を CSS の変数で渡し、図だけを横スクロールにする

連載 × 公開月の図は、月の数（今は 4）を `style="--months: N"` で渡し、CSS の `repeat(var(--months), …)` で列を作る。JavaScript は使わない。
月が増えると列が細くなるので、1 列の最小幅（PC 2.75rem、375px 2rem）を決め、入りきらなければ図（`.series`）だけを横にスクロールさせる（ページ全体は横スクロールさせない）。
Astro のテンプレートで `{式}` と文字を改行をはさんで並べると、間の空白が消える（「{articleSource}⏎{articles.length} 本」が「書いた21 本」になった）。
空白を残したい文は、テンプレート文字列 1 つ（`` {`${a} ${b} 本を…`} ``）か `{' '}` で書く。
日本語の短い見出し（要点の見出し・年表の役割・連載名など）は `word-break: auto-phrase` で文節ごとに折り返す。対応していないブラウザは今までどおりの折り返しになるだけで、崩れない（確認したのは Playwright の Chromium だけ）

### 2026-10-04：仕組みの説明を書く前に、本人の認識ではなく現物で動きを確かめる。手元の複製は古いことがある

Reading Log の説明を書くとき、ずれが 2 件あった。
- 本人の説明「「personal-ai-context」の中身を分析して私が読むべき本の優先度を自動判定して提案する」は、公開の reading-log のルールと週次レビューで確かめると、
  週次レビューが personal-ai-context を読んでいなかった（本人「使っている認識だったんだけど、どうやら使ってなかったみたい。」）
- 「大量登録・構造変更は Claude Code」は本人の言葉ではなく、reading-log の README とサイトの旧文面にあった記述。Claude が実態に合うかを聞き、
  本人の回答「結局最初の大量登録はChatGPTのworkで行っちゃった。なので、Claude Codeは読書ログでは全然使ってないね。」でずれが分かった。ルールファイル自体が実態より古いこともある

公開ページに仕組みを書くときは、ルールファイル・実行結果（週次レビュー・コミット）で確かめ、そのうえで本人にも今の使い方を聞く。違っていたら書く前に本人に聞く。
また、手元の `~/workspace/personal/reading-log` は GitHub より古かった（2026-10-04 に確かめた時点で、手元は 08-30 で止まり、GitHub には W35 以降のレビューがあった）。
事実の確認は `git pull` してから、か GitHub 上の内容で行う

### 2026-10-04：ワークフローは、起動した回のユーザーの発言を作り手のエージェントにも中継する。コンペの条件が崩れる

最初の画面のコンペで、作り手（Opus・Fable）を Workflow ツールで動かした。ワークフローの各エージェントの最初には、
起動した回のユーザーの発言が「この依頼が優先する」という前置きつきでそのまま渡る。その回の発言は「personal-ai-contextを呼んでいいですよ。特に制限なく、全フォルダ・ファイル読んでもいいです。」（`logs/decisions.md` 2026-10-04）だったので、
personal-ai-context を**使わない**版の Fable の作り手がそれを自分への許可と読み、手元の personal-ai-context を読んだ（見本の文字には入っていなかったが、条件が崩れたので外して作り直した）。
考慮版の Fable も、渡した抜き出しの節に加えて本体を読んだ。Opus の作り手は、作業フォルダの外にあった調整役の対応表（伏せ字と作り手の対応）と検査スクリプトを読んだ。

回避：作り手を独立に動かすときは、

- 広い許可を含む発言の回にワークフローで作り手を起動しない。起動するなら Agent ツール（ユーザーの発言を中継しない）にする。作り直しは Agent ツールで行い、外を読んでいないことを確かめた
- 作り手への指示に「作業フォルダの外を読まない」と、読んではいけない場所（`~/workspace/personal/`、ほかの作り手のフォルダ、リポジトリ）を名前で書く
- 調整役の対応表は、作り手の作業フォルダの親に置かない（今回は scratchpad の別のフォルダへ移した）
- 作り手の記録（サブエージェントの jsonl）でツールの呼び出しを見て、外を読んでいないかを確かめてから比較に出す。見本の aim.md に「〜を読んだ」と書かれて気づくこともある

あわせて、非公開リポジトリ（personal-ai-context）を scratchpad に書き出す操作は、auto モードの分類器に「機密の出どころ」として止められた。
会話の中でユーザーの許可をもらってからは通った。手順と使用量の記録は Beads の ops-h49 のコメント（2026-10-04 試行 3）

### 2026-10-05：Artifact に一緒に載せた別の HTML は、リンクで単独のタブに開けない。比較ページの中に読み込んで表示する

コンペの比較ページ（非公開の Artifact）に見本の `A.html` などを `files` で一緒に載せ、`<a href="A.html" target="_blank">` で開く形にしたところ、
ユーザーが押すと「claude.ai はブロックされています ERR_BLOCKED_BY_RESPONSE」になった。公開する前に、リンクが開けるかを確かめていなかった。
ページの中で `fetch('A.html')` で読み、`<iframe srcdoc>` に入れて表示する形に直した（PC 1280px / スマホ 375px の幅を切り替え、動きをもう一度再生できる）。
見本の中のリンクは枠の外へ移動しないよう、`#` の移動以外は止めた。手元では `file://` だと `fetch` が通らないので、`python3 -m http.server` で配って確かめた

### 2026-10-05：表紙の実装。見本の HTML は写さず CSS だけを持ってきて、右下のボタンは本文の箱の末尾で sticky にする

見本 A（`docs/design-candidates/2026-10-04-first-screen/A.html`）は今のトップの HTML を写した 1 枚なので、そのまま置くと文面が正本と二重になる。
CSS だけを `global.css` に整形して移し、中身は今の部品（`HomeSection`・`profile.md` の `tagline` / `highlights` / `links`・`SECTIONS`）から組んだ。
表紙は `Base.astro` の名前つき slot（`slot="cover"`）で渡し、左の目次と本文の 2 列は `body` から `.layout` の箱に移した（表紙の下から 2 列が始まるため）。
About の節（`section#about`）は表紙の中に置き、外部リンクのカードは節の外（表紙の直後）に出した。`npm run check:home` は `section#about` の中の h1 と一言を見るので、そのまま通る。

右下の Ask AI ボタンは、見本では高さ 0 の箱を本文の先頭に置いて `position: sticky; top: calc(100svh - …)` で下端に貼っていた。
これだとボタンが HTML の先頭に来て、キーボードで Tab を押したとき左の目次より先にボタンへ移る。そこで箱を本文の箱（`.page`）の**末尾**に置き、
`position: sticky; bottom: calc(16px + ボタンの高さ)` にした。sticky の要素は自分の入っている箱（`.page`）の外へは動けないので、
表紙を見ている間は `.page` の上端（画面の下端の外）に留まり、本文が上がってくると一緒に入ってきて右下で止まる。見た目は見本と同じで、順番は今までどおりフッターの後。
トップ以外のページは表紙が無いので、今までどおり `position: fixed`（`Base.astro` が `Astro.slots.has('cover')` で切り替える）。

ほかに見本から変えたのは 1 点だけ：目次の → の出入り（`transition`）を、動きを減らす設定のときは止めるようにした（見本では設定にかかわらず動いていた）。
確かめ方：Playwright（Chromium）で 1280×800 と 375×812 を、ライト・ダーク・動きを減らす設定の 3 通りで撮り、
横スクロールなし（ページの幅＝画面の幅。開いて約 0.3 秒の動きの途中も）、ボタンが表紙では画面の外・表紙の後は右下 16px、ページ末尾でフッターの文字が隠れないことを測った。
`/projects`・`/skills` のボタンは右下 16px のまま、`/ask` には出ない

### 2026-10-05：Ask AI の入口のメニューは HTML の popover で開け閉めし、JavaScript は Gemini のコピーだけにする

ユーザーの依頼は「マウスオーバーで ChatGPT / Claude / Gemini を選んで押せる」と「スマホは押して開く」。開け閉めの作り方は 3 つあった。
自前の JavaScript で開け閉めする（CLAUDE.md「守ること」の JavaScript の例外が増える）、`<details>`（マウスを乗せて開く形と相性が悪く、外を押しても閉じない）、
HTML の popover（`popovertarget` を付けたボタンで開き、外を押すか Esc で閉じる。JavaScript なし。Chrome 114・Safari 17・Firefox 125 から）。popover にした。
マウスを乗せたときは、popover を開かずに同じメニューを CSS の `:hover` で入口の箱の中に出す（`@media (hover: hover) and (pointer: fine)` の間だけ）。
ブラウザの既定の `[popover]:not(:popover-open) { display: none }` は、作り手の CSS の `display: block` で上書きできる（読み込み元の順で作り手が勝つ）。
ボタンとメニューの間の隙間は、メニューの外側の透明な余白で埋めた。マウスが隙間を通る間も「入口の箱の上」のままなので、メニューが閉じない。

押して開いた popover は最前面（top layer）に出て、位置は画面が基準になる。右下のボタンは常に画面の右下にあるので、メニューも画面の右下に固定した。
トップの節のボタンにはメニューを付けて出すため、CSS の anchor positioning（`anchor-name` / `position-area`）を `@supports` の中で使い、未対応のブラウザでは画面の中央に出す。
右下のボタンにも一度 anchor positioning を付けたが、Chromium でメニューがボタンから離れた位置に出た（下のハマりと同時に起きていたので、原因は切り分けていない）。固定の位置で足りるので外した。

Gemini は URL でプロンプトを渡せないので、押したときに `navigator.clipboard.writeText` で写す。リンクは新しいタブで開く（同じタブで移ると、写し終える前にページが離れうるため）。
これに合わせて、メニューの ChatGPT・Claude も新しいタブで開く。`/ask` のボタンは今までどおり（同じタブ・Gemini はコピーしない）。

ハマったこと：右下の箱を固定する `.ask-entry-fab { position: fixed }` の後ろに、`.ask-entry { position: relative }` を書いていた。
クラス 1 つ同士で強さが同じなので後ろが勝ち、右下のボタンがページの末尾に普通に並んだ（Playwright でボタンの位置が y=2129 と出て気づいた）。
位置の基準にする指定は `.ask-entry-section` にだけ書く形に直した。同じ要素に付く 2 つのクラスに `position` を書き分けるときは、順番に頼らない

### 2026-10-05：Gemini にはサイトの全文を付けて写す。全文は先読みし、押した瞬間に写す

ユーザーが本番で Gemini に Ask したところ、「指定されたURL（…/llms.txt）へのアクセスを試みましたが、直接コンテンツを取得することができませんでした。」と返ってきた。
サイトは 200 で返り robots.txt も許可しているので、Gemini 側が外の URL を読みに行けないと見た（Claude の推定）。
URL の代わりに、`/llms-full.txt`（主要ページの Markdown をつないだもの。約 2.9 万字）をプロンプトの後ろにつないで写す形にした。
Gemini の入力欄にこの長さを貼れるかは、Playwright では確かめられない（実機の確認は TODO の該当タスク）。

写し方：押してから全文を読みに行くと、Gemini の新しいタブに移ったあとで写すことになり、ブラウザが「ページにフォーカスが無い」として拒むことがある。
そこで、入口にマウスを乗せた・フォーカスした・メニューを開いた（popover の `toggle`）・`/ask` を開いた時点で先に読み込み、押した瞬間はその場で `writeText` する。
押した時点でまだ読み込み中なら、`ClipboardItem` に「全文を読み込んでから作る Blob の Promise」を渡して `navigator.clipboard.write` する（押した瞬間に写す処理を始めておける書き方）。
Playwright で、読み込みを 1.5 秒遅らせても全文つきで写せることを確かめた（Chromium だけ）。
コピーの処理は `src/scripts/ask-copy.ts` の 1 か所にまとめ、入口のメニュー（AskEntry.astro）と `/ask` の両方が `<script>import …</script>` で読む（Astro が 1 ページ 1 回にまとめる）。
これで、名前は「コピーして貼り付け」なのに何も写さなかった `/ask` の Gemini のボタンも写すようになった（新しいタブで開く）
