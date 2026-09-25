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
