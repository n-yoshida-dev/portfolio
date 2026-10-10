// 詳細ページ（Projects / Systems）が「開いた直後に見える文字数 800 字以下」を保てることを、元の Markdown の側で確かめる。
// 本文が長いエントリは highlights（要点 3 行）を持たせ、HTML では本文を「詳しく読む」に畳む決まり（SPEC.md §4）。
import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public-profile');

/**
 * 畳まずに出してよい本文の上限（文字数）。
 * 見出し・要約・リンク・技術タグで 300〜400 字を使うので、800 字から引いた残りを本文の枠にしている
 */
const MAX_UNFOLDED_BODY = 400;

/** frontmatter と本文に分ける（簡易パーサ。先頭の --- で囲んだ形しか使わない） */
async function readEntry(file) {
  const text = await readFile(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file} の frontmatter を読めない`);
  return { frontmatter: m[1], body: m[2].trim() };
}

describe('詳細ページの本文の長さ', () => {
  for (const dir of ['projects', 'systems']) {
    it(`${dir} の本文が ${MAX_UNFOLDED_BODY} 字を超えるなら highlights を持つ`, async () => {
      const files = (await readdir(path.join(root, dir))).filter((f) => f.endsWith('.md'));
      for (const f of files) {
        const { frontmatter, body } = await readEntry(path.join(root, dir, f));
        const length = [...body].length;
        if (length <= MAX_UNFOLDED_BODY) continue;
        expect(
          /^highlights:/m.test(frontmatter),
          `${dir}/${f} は本文が ${length} 字あるのに highlights が無い（詳細ページで本文を畳めない）`,
        ).toBe(true);
      }
    });
  }
});

describe('コードを AI が書いた作品の備考（vibeCoding）', () => {
  it('自分で実装している OrgFlow には付けず、AI が実装した skill-matrix には付ける', async () => {
    const orgflow = await readEntry(path.join(root, 'projects', 'orgflow.md'));
    const skillMatrix = await readEntry(path.join(root, 'projects', 'skill-matrix.md'));
    expect(/^vibeCoding: true$/m.test(orgflow.frontmatter)).toBe(false);
    expect(/^vibeCoding: true$/m.test(skillMatrix.frontmatter)).toBe(true);
  });
});
