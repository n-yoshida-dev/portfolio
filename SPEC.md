# 確定仕様

**実装が参照する正本。** ユーザーの確認を経たものだけを書く。検討中のことは `PLAN.md` に置く。
人間向けの解説（構成・運用・線引き）は `README.md`。同じ事実を二重に書かない。

## 1. コンテンツモデル（`public-profile/`）

型の正本は `src/content.config.ts`。ここには意味だけを書く。

| コレクション | 場所 | 主な項目 | 用途 |
|---|---|---|---|
| `projects` | `projects/*.md` | title / tagline / summary / repo / site / visibility（public・private・archived）/ status（active・paused・done・archived）/ period / stack / featured / homeWide / order / systems / highlights | Projects 一覧・詳細。`featured: false` は Other / Experiments。`homeWide: true` はトップのカードが 3 列の広い画面だけ、主なプロジェクトの後ろに足す（§4）。本文が空なら詳細ページを作らない |
| `systems` | `systems/*.md` | title / tagline / summary / order / components / highlights | Systems 一覧・詳細 |
| `pages` | `profile.md` `career.md` `skills.md` | title / description / updated / links・tagline・highlights（profile のみ。highlights は 3 行まで） | Home / Journey / Skills |
| `articles` | `articles.json` | id / title / url / platform / publishedAt / tags / series / summary | Articles。連載（series）ごとにまとめ、連載内は古い順 |

- `updated` は「最終確認日」。YAML の日付は Date として読まれるので、型で `YYYY-MM-DD` の文字列に揃える
- `projects.systems` は `systems` の slug（ファイル名）を指す。壊れていないことをテストで確認する
- Private の repo は `visibility: private` で載せ、存在と目的だけを書く
- `tagline`（projects / systems）は一覧のカードに出す一文。句点なし・60 字以内（スキーマで確認）。`summary`（1〜2 文）は詳細ページの冒頭・Markdown 版・llms.txt に出し、カードには出さない。
  カードのために summary を削ると AI 向けの情報が減るので、別の項目に分けた（2026-09-27）
- `highlights`（projects / systems）は詳細ページの要点。3 行まで。本文に書いた事実だけから作る。本文が 400 字を超えるエントリは必須（テストで確認）

## 2. ページとルート

| ルート | 出力 | 元データ |
|---|---|---|
| `/` | Home。1 枚のページに 7 節（§4）。名前・tagline・highlights・リンク、主なプロジェクト（カード）、systems、skills と journey の短い版、articles、Ask AI。**profile.md の本文は出さない**（Markdown 版と llms-full.txt が持つ） | profile.md の frontmatter + 各コレクション |
| `/projects`, `/projects/<slug>` | 一覧、詳細。詳細は題名・summary・リンク・技術・`highlights` を出し、**本文は `<details>`（「詳しく読む」）で畳む**。`highlights` が無いエントリは本文をそのまま出す。関連する仕組みは題名だけ | projects |
| `/systems`, `/systems/<slug>` | 一覧、詳細。詳細の出し方は projects と同じ。関連するプロジェクトは題名だけ | systems |
| `/skills`, `/journey`, `/articles`, `/ask` | 単一ページ | skills.md / career.md / articles.json / `src/lib/ask.ts` |
| `/profile.md` `/skills.md` `/journey.md` `/articles.md` `/projects/<slug>.md` `/systems/<slug>.md` | Markdown 版（`text/markdown`） | 同上。`src/lib/content.ts` の *ToMarkdown が生成 |
| `/llms.txt` | AI 向け索引（llmstxt.org 形式：H1 / 引用の要約 / H2 ごとのリンク一覧） | 全コレクション |
| `/llms-full.txt` | 主要ページの Markdown を連結 | 全コレクション |
| `/sitemap-index.xml`, `/robots.txt`, `/og.png`, `/favicon.svg` | 補助 | — |

- URL は拡張子・末尾スラッシュなし（`trailingSlash: 'never'`、`build.format: 'file'`、Vercel の `cleanUrls`）
- 各 HTML ページは `<link rel="alternate" type="text/markdown">` とフッターのリンクで Markdown 版を指す
- 絶対 URL は `Astro.site`（`SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → localhost の順）から組み立てる

## 3. Ask AI

- 自前のチャットは持たない。訪問者の AI に渡すプロンプトを表示し、「コピー」「ChatGPT で開く」「Claude で開く」「Gemini（コピーして貼り付け）」を置く
- プロンプトは `src/lib/ask.ts` の 1 か所。`/llms.txt` を最初に読ませ、仕事の経験・自分で書いて作ったもの・AI と作ったもの・学習中を区別し、出典を示し、日本語で答えるよう指示する。
  最初の答えは 5 行以内の概要（1 行 1 文・40〜60 字で、年・プロジェクト名・技術などの具体的な事実を入れる）と、もっと聞くよう促す自然な一文と短い質問の例 3 つ（30 字前後まで）だけにさせ、詳しいことは聞かれてから答えさせる。
  名前は Naoki Yoshida と書かせて漢字を推測させない。スキルの程度は出典より上に書かせない（2026-10-06。ユーザーが本番の 3 つの AI の答えを見て、Claude には「「次に聞ける質問」のところがなんか気になる」、ChatGPT には「「次に聞くなら、この3つがおすすめです。」のところはClaudeよりも自然。前半の概要のところが少し寂しすぎるかな。」と言い、Gemini が出典に無い漢字の名前と「習得済み」を書いていた）。
  区分は、概要の中でスキルに触れるときに添えさせ、別のスキルの節は作らせない（作らせると答えが長くなる。Claude で試して確かめた）
  （長文だと読まれないため。2026-10-05 ユーザーの提案「あまり長文にし過ぎず、概要だけかいて、例えば質問を促すとかはどう？」に Claude が賛成して入れた。TODO フェーズ5）
  （プロンプト本文は英語。回答言語を指定しないと英語で返ってくる。2026-09-26 に Claude で実測）
- **入口のメニュー**（`src/components/AskEntry.astro`。2026-10-05、TODO フェーズ4「Ask AI の入口」）：右下の追従ボタンとトップの Ask AI 節のボタンは、
  押すと（PC はマウスを乗せても）「ChatGPT で開く」「Claude で開く」「Gemini（コピーして貼り付け）」「プロンプトを見る」（`/ask`）のメニューを開く。
  スマホにはマウスを乗せる操作が無いので、押して開く。開け閉めは HTML の popover で、外を押すか Esc で閉じる（JavaScript なし）。
  メニューの各 AI は新しいタブで開く。Gemini は URL でプロンプトを渡せないので、押すと同時にプロンプトをクリップボードへ写す（ここだけ JavaScript。写せなければリンクの文字で、Gemini では `/llms-full.txt` の全文を貼る道を案内する）。
  メニューは右下のボタンでは画面の右下（ボタンの真上）、トップの節ではボタンの真下に開く（CSS の anchor positioning に対応しないブラウザでは画面の中央）
- **Gemini にはサイトの全文を渡す**（2026-10-05、TODO フェーズ5。Gemini は llms.txt の URL を渡しても中身を取得できなかった）：Gemini のボタン（入口のメニューと `/ask`）は、
  URL を読ませるプロンプトではなく、「`---` の後ろがサイトの全文。URL は開かなくてよい」と書いたプロンプト（`buildPastedPrompt`。答え方の指示は URL 版と同じ）の後ろに、
  `/llms-full.txt` の全文（約 2.9 万字）をつないで写す。全文は入口にマウスを乗せた・メニューを開いた・`/ask` を開いた時点で先に読み込む（`src/scripts/ask-copy.ts`）。

## 4. デザイン

- 素の CSS 1 ファイル（`src/styles/global.css`）。色は文字・薄い文字・線・リンク・背景（地色 `--bg-subtle` を含む）の 5 系統。ダークモードは OS 設定に追従
- **構成は「1 枚のページ + 左の固定目次」**（2026-09-27。`logs/decisions.md`）。トップに 7 節（何の人か / Projects / Systems / Skills / Journey / Articles / Ask AI）を縦に並べ、
  左の目次はその節へ移動する。スクロールに合わせて今いる節の項目を強調する（この JavaScript だけ例外として持つ）。375px 幅では目次の全項目を上部に横並びで出す（ボタンで隠さない。2026-09-27 ユーザー確認）。
  左の目次の下には GitHub・Qiita をアイコン付きで置く。`/llms.txt` は人間には説明なしで伝わらないので、目次の下と表紙には置かず、トップの Ask AI 節とフッターに「AI 向けの要約」と説明を添えて置く（2026-10-06 ユーザーが見本 B を選択。llms.txt の置き場所は 3 案共通の Claude の案）。
  トップの各節は**短い版**（主なプロジェクト 4 件〔1600px 以上は `homeWide` の 2 件を足して 6 件〕、区分ごとのスキルのカード、年表、連載 × 公開月の図）で、詳しい版は各ページに残して「すべて →」で行く。
  **トップの先頭には画面 1 つ分の表紙を置く**（2026-10-05 ユーザーがコンペの見本 A を選択。`logs/decisions.md`。見本は `docs/design-candidates/2026-10-04-first-screen/`）。
  トップでは、左の固定目次（PC）は表紙の下から出る。375px 幅のトップは表紙の中の目次（全 7 項目・2 列・ボタンで隠さない）だけにし、上部の横並びの目次は出さない（同じ 7 項目が二重になるため）。トップ以外のページは今までどおり
- **トップの表紙**（見本 A）
  - 名前（大きく）・一言（`profile.md` の `tagline`）・要点 3 行（`highlights`）・目次 7 項目だけを置き、下端に ↓（読み上げない）。GitHub・Qiita は表紙のすぐ下の説明つきのリンクカードに任せ、表紙には文字リンクを置かない（2026-10-06 ユーザーが見本 B を選択。`logs/decisions.md`）。
    地色もカードも使わず、線だけで区切る。高さは画面の高さ以上（100svh。入りきらない画面では下へ伸びる）
  - PC：名前と一言の下に、左に要点 3 行（線で区切った行。小見出しを左の列、太字の見出しと薄い文字の補足を右の列）、右に目次。目次の上下の線を要点 3 行の上下の線とそろえる。
    表紙だけは左の目次が無いので最大 68rem（16rem + 52rem）。375px：名前 → 一言 → 要点 3 行（縦積み）→ 目次（2 列）
  - 目次の 1 行は番号（01〜07。読み上げない）・節の名前・件数。件数は今のトップで件数を出している 3 節（Projects〔全体の件数〕・Systems・Articles）だけで、データから数える。
    PC では件数の横に 1 件 1 マスの小さな図（Articles の図と同じ考え方）を並べ、マウスを乗せると行の右端に → が出る
  - 開いたときに 1 回だけ、線が左から引かれ、文字と目次の行が 10px 下から浮かび、件数のマスが左から現れる（CSS だけ。約 1.7 秒で終わる）。
    動きを減らす設定（`prefers-reduced-motion: reduce`）では動かさず、最初から終わりの姿で出す
- **トップの About・Skills・Journey・Articles の見せ方**（2026-10-03 ユーザーが見本 3 案から節ごとに選択。`logs/decisions.md`。見本は `docs/design-candidates/2026-10-03-top-sections/`）
  - About：要点（`profile.md` の `highlights`）の 1 つを「小見出し（label）→ 太字の見出し（title）→ 薄い文字の補足（detail）」で積む（C の太字の見出し）。
    並べ方は 2026-10-05 に見本 B の 3 列から、表紙の線で区切った 3 行に変えた（上の「トップの表紙」）。
    外部リンク（`links`）はアイコン・名前・note のカード 3 列（見本 B）で、表紙の直後に置く
  - Skills・Journey・Articles は見出しのすぐ下に、その節の読み方の一言（薄い文字）を置く（Skills・Articles は定型文で、区分や連載の数はデータから数える。Journey は `career.md` の冒頭の 1 文）
  - Skills：Skills ページと同じ区分ごとのカード（PC 2 列、項目名の無い区分は出さない）。カードは見出し（期間の括弧書き〔「約 10 年」〕があれば右端に）・区分の定義・項目のタグ・
    根拠のリンク（`###` 見出しのリンクがある区分だけ「根拠：」の行）。作品で示せる根拠がまだない区分（学習中）は全幅・破線の枠・地色なし（見本 C）
  - Journey：横の年表（点は青）に、時期 → 役割（太字）→ 担当（薄い文字。`career.md` の表の 3 列目そのまま）を縦に積む。375px では Journey ページと同じ縦の年表（見本 B）
  - Articles：連載 × 公開月の図。■ 1 つが記事 1 本で、公開した月の列に置く（色は薄い文字色）。連載は最初の記事が古い順。下にいちばん新しい記事を 1 本。
    図はビルド時に `articles.json` から作り、JavaScript は使わない。月が増えて入りきらないときは図だけを横にスクロールさせる（見本 C）
  - 線のアイコン（ロゴではない汎用の形。`src/lib/icons.ts`）は About のリンクと Skills の区分見出し（薄い文字色の線だけ）と、左の目次の下の GitHub・Qiita（リンクの色。2026-10-06 見本 B）にだけ使う。
    About のリンクカードは PC 3 列（「一覧は PC 2 列」の例外）。375px ではどれも 1 列
- **Ask AI の入口は右下の追従ボタン**（`/ask` 以外の全ページ。`position: fixed` で影なし。2026-09-27）。
  押すと（PC はマウスを乗せても）各 AI を選ぶメニューが開き、`/ask` に移らずに訪問者の AI を開ける（上の §3。2026-10-05）。
  トップでは表紙の上に出さず、本文と一緒に下から入ってきて同じ右下の位置で止まる（CSS の `position: sticky` だけ。2026-10-05 見本 A）。
  トップの Ask AI 節（説明の一文 + ボタン）も残す。右上は固定ヘッダーが無く見出しやスマホ上部の目次と重なるので使わない。
  `/ask` で出さないことと位置が右下であることはユーザー確認済み（2026-09-27）。
  追従ボタンとトップの節のボタンは同じ言葉「Ask AI about this portfolio」（`src/site.ts` の `ASK_BUTTON_LABEL`。2026-09-27 ユーザーが選択。`logs/decisions.md`）
- **ボタンは青を使わず、文字色で描く**（2026-09-27 ユーザーが見本 4 案から選択。`logs/decisions.md`）。青はリンク専用（例外：年表の点。2026-09-28 ユーザーが青を選択）。
  塗る（文字色の地 + 背景色の文字）のは主なボタン（`.button-primary`）と追従ボタン（`.ask-fab`）だけで、ほかのボタンは線だけ。角は 4px の角丸
- 一覧は**薄枠のカード**（地色 `--bg-subtle`、線 `--line`。PC 2 列、375px で 1 列）。年・区分・題名・一文・リンクを定位置に置く。
  経歴は年を左端に置いた年表（例外：トップの Journey 節は PC で横の年表、年が上。上の「トップの About・Skills・Journey・Articles の見せ方」）。
  グラデーション・影は使わない。アニメーションはトップの表紙の動き（上の「トップの表紙」）だけ。色は足さず、リンク色だけを効かせる
- **HTML は人間向けに短く、Markdown 版・llms.txt は AI 向けに詳しく。** 同じ文章を両方に同じ量で出さない。
  トップの最初の 1 画面は表紙で、名前 + 一言 + 要点 3 行 + 目次だけが入る（節の続きはその下）。一覧の 1 件は題名 + 一文 + リンク（2026-09-26。参考にした個人サイト 23 件の共通パターン。2026-09-27 に「1〜2 文」から「一文」へ）。
  詳細ページは開いた直後に見える文字数を 800 字以下にする（長い本文は畳む）。
  Skills / Journey の表は 1 セル 1 フレーズ・体言止めにし、句点（。）を使わない（テストで確認）。
  HTML では CSS で表を積み替え、Journey は年を左端に置いた年表、Skills は「ラベル + 値」の並びにする（横スクロールさせない。2026-09-27）。
  年表は 1 行を「時期 → 役割（太字）→ 担当（薄い文字）」の縦積みにし、左に縦線と点を添える（見本 A の形。点は青〔`--link`〕。2026-09-28 ユーザーが「青にしてみよっか」と選択。`logs/decisions.md`）。
  「ラベル + 値」はラベル太字 + 値は薄い文字（375px ではラベルの下に値）。どちらも列の見出しは画面から隠し、読み上げには残す（2026-09-28）。
  **Skills のページは区分ごとの薄枠のカードを先に出し、本文は「項目ごとの説明と根拠を読む」に畳む**（2026-09-28 ユーザーが見本 3 案から C を選択。`logs/decisions.md`）。
  カードは `##` 節ごとに 1 枚で、見出し・区分の定義（冒頭の「A（定義）／B（定義）」の行から）・項目名・根拠のリンク（`###` 見出しのリンク）を本文から取り出す（`src/lib/outline.ts` の `skillOverview`）。
  カードの下に、定義の行より後ろの文（判定の注記）を置く。開いた直後に見える文字は 500 字前後
  **例外：Skills / Journey は HTML と Markdown 版が同じ本文から作られる**ので、そこは短く保ち、技術の細部は projects / systems の本文
  （HTML では畳まれ、Markdown 版には全文が出る）に置く。こうして AI 向けの情報を減らさない
- 本文幅は最大 52rem（左の目次 16rem を除く。トップの表紙だけは最大 68rem）で、目次の右の残りの中央に置く（表紙も画面の中央）。モバイルは 16px の左右余白。
  **画面の幅で段階的に構成を変える**（2026-10-06 ユーザーが見本から C を選び、段階的に変えることを提案。`logs/decisions.md`。段階と枚数は Claude の案）：
  1600px 以上はトップだけ本文を最大 76rem・表紙を最大 92rem に広げ、Projects のカードを 3 列・6 枚（`homeWide` の 2 件を足す。見出しの件数も 6 にする）／
  1024〜1600px は 2 列・4 枚／640〜1024px は上部の目次で 2 列／640px 未満は 1 列。Systems（4 件）と Skills は広い画面でも 2 列。トップ以外のページは本文幅を広げない（長い文が読みにくくなるため）。足す 2 件を `homeWide` で選ぶことと、広げるのをトップだけにすることも Claude の案（ユーザーが見え方を見たあとで変わりうる）。Skills / Journey 以外の表（詳細ページの本文にあるもの）は横スクロール

## 5. 検査（CI と同じ）

`format:check` → `lint`（禁止語スキャン）→ `typecheck` → `test` → `build` → `check:home`（ビルドしたトップに 3 点の節が中身つきで出ているか）→ AI 向けファイルの存在確認、および秘密情報スキャン。
禁止語のパターンは `scripts/public-profile-rules.json`。ヒットは書き直しで解消し、許可リストを作らない。

## 6. Phase 1 でやらないこと

`PLAN.md`「やらないこと」と同じ。自動同期・API・DB・RAG・自前チャット・CMS・認証・analytics。
