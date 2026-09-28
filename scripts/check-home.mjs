#!/usr/bin/env node
// ビルドしたトップ（dist/index.html）に、PLAN「誰のためのものか」の 3 点が中身つきで出ているかを検査する。
// 目的：単体テスト（tests/home-sections.test.mjs）はビルド前に走るので節の定義しか見られない。出来上がったページで、節が空になっていないことを確かめる。
// 使い方：node scripts/check-home.mjs [dist ディレクトリ]   欠けていれば exit 1
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** 3 点と、それを読み取れる節（SPEC.md §4。tests/home-sections.test.mjs の THREE_POINTS と同じ対応） */
const THREE_POINTS = [
  {
    point: '何の人か',
    id: 'about',
    need: '名前（h1）と一言',
    // 一言は名前の下の段落（class="lead"。profile.md の tagline）。隠した節名やリンクの文字では合格させない
    ok: (html) => /<h1[\s>]/.test(html) && leadText(html).length >= 5,
  },
  {
    point: '何を作ったか',
    id: 'projects',
    need: 'カード 1 枚以上',
    ok: (html) => countCards(html) >= 1,
  },
  {
    point: 'どう開発しているか',
    id: 'systems',
    need: 'カード 1 枚以上',
    ok: (html) => countCards(html) >= 1,
  },
];

/** タグを除いた本文（空白を詰める） */
function textOf(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 最初の `class="lead"` の段落の本文。無ければ空 */
function leadText(html) {
  const m = html.match(/<p[^>]*\sclass="(?:[^"]*\s)?lead(?:\s[^"]*)?"[^>]*>([\s\S]*?)<\/p>/);
  return m ? textOf(m[1]) : '';
}

/** カード（class="card"）の数。card-grid や card-top などの部品は数えない */
function countCards(html) {
  return (html.match(/class="card"/g) ?? []).length;
}

/** `<section id="…">` から次の `<section` か `</main>` までを取り出す。無ければ undefined */
export function sectionHtml(page, id) {
  const start = page.search(new RegExp(`<section[^>]*\\sid="${id}"`));
  if (start === -1) return undefined;
  const rest = page.slice(start);
  // 自分の開始タグに当たらないよう 1 文字目を飛ばして次の区切りを探し、位置は rest の座標に戻す
  const after = rest.slice(1);
  const ends = [after.search(/<section[\s>]/), after.search(/<\/main>/)]
    .filter((i) => i !== -1)
    .map((i) => i + 1);
  return rest.slice(0, ends.length > 0 ? Math.min(...ends) : rest.length);
}

/** 検査して、欠けているものの説明を返す（空なら合格） */
export function checkHome(page) {
  const problems = [];
  for (const { point, id, need, ok } of THREE_POINTS) {
    const html = sectionHtml(page, id);
    if (html === undefined) problems.push(`「${point}」の節 #${id} がトップに無い`);
    else if (!ok(html)) problems.push(`「${point}」の節 #${id} に ${need} が無い`);
  }
  return problems;
}

// コマンドとして実行されたときだけ検査する（テストから関数を読むときは走らせない）
// パスに空白や日本語があっても一致するよう、実行されたファイルを URL に直してから比べる
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv[2] ?? 'dist';
  let page;
  try {
    page = await readFile(path.join(dist, 'index.html'), 'utf8');
  } catch (error) {
    console.error(
      `::error::${path.join(dist, 'index.html')} を読めません（先に npm run build）: ${error.message}`,
    );
    process.exit(1);
  }
  const problems = checkHome(page);
  if (problems.length > 0) {
    for (const p of problems) console.error(`::error::${p}`);
    process.exit(1);
  }
  console.log(
    'トップの 3 点（何の人か・何を作ったか・どう開発しているか）が中身つきで出ていることを確認',
  );
}
