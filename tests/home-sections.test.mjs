// トップの 7 節（SPEC.md §4）が、目次の定義（src/site.ts の SECTIONS）とページ（src/pages/index.astro）の両方にそろっていることを確かめる。
// PLAN「誰のためのものか」の 3 点（何の人か・何を作ったか・どう開発しているか）に当たる節が、それぞれ 1 つ以上あることも見る。
// 短い版を本文から取り出す解析（src/lib/outline.ts）が、実際の skills.md / career.md で空にならないことも見る。
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, sectionIdForPath } from '../src/site.ts';
import { skillGroups, careerTimeline } from '../src/lib/outline.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** SPEC.md §4 の 7 節。この順に並ぶ */
const EXPECTED = ['about', 'projects', 'systems', 'skills', 'journey', 'articles', 'ask'];

/** PLAN「誰のためのものか」の 3 点と、それを読み取れる節 */
const THREE_POINTS = {
  何の人か: 'about',
  何を作ったか: 'projects',
  どう開発しているか: 'systems',
};

/** frontmatter を落として本文だけにする */
function bodyOf(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : text;
}

describe('トップの 7 節', () => {
  it('SECTIONS が SPEC の 7 節をこの順に持つ', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(EXPECTED);
    for (const s of SECTIONS) expect(s.label.length, `${s.id} の label`).toBeGreaterThan(0);
  });

  it('index.astro に 7 節すべてが 1 回ずつある', async () => {
    const page = await readFile(path.join(root, 'src/pages/index.astro'), 'utf8');
    for (const id of EXPECTED) {
      const count = page.match(new RegExp(`<HomeSection id="${id}"`, 'g'))?.length ?? 0;
      expect(count, `<HomeSection id="${id}"> の数`).toBe(1);
    }
  });

  it('3 点（何の人か・何を作ったか・どう開発しているか）に当たる節がある', () => {
    for (const [point, id] of Object.entries(THREE_POINTS)) {
      expect(
        SECTIONS.some((s) => s.id === id),
        `「${point}」の節 ${id}`,
      ).toBe(true);
    }
  });

  it('「すべて →」の行き先は既存のページを指す', async () => {
    const pages = path.join(root, 'src/pages');
    for (const s of SECTIONS) {
      if (!s.more) continue;
      const name = s.more.href.slice(1);
      const candidates = [`${name}.astro`, `${name}/index.astro`].map((f) => path.join(pages, f));
      const exists = await Promise.all(
        candidates.map((f) =>
          readFile(f).then(
            () => true,
            () => false,
          ),
        ),
      );
      expect(exists.some(Boolean), `${s.id} の行き先 ${s.more.href} のページ`).toBe(true);
    }
  });

  it('詳しい版のページを、その節に対応づける', () => {
    expect(sectionIdForPath('/projects')).toBe('projects');
    expect(sectionIdForPath('/projects/orgflow')).toBe('projects');
    expect(sectionIdForPath('/systems/learning-system')).toBe('systems');
    expect(sectionIdForPath('/ask')).toBe('ask');
    expect(sectionIdForPath('/')).toBeUndefined();
    expect(sectionIdForPath('/llms.txt')).toBeUndefined();
  });
});

describe('短い版の解析（Skills / Journey）', () => {
  it('skills.md から区分ごとの項目名が取れる', async () => {
    const body = bodyOf(await readFile(path.join(root, 'public-profile/skills.md'), 'utf8'));
    const groups = skillGroups(body);
    expect(groups.length).toBeGreaterThanOrEqual(3);
    for (const g of groups) {
      expect(g.items.length, `${g.name} の項目`).toBeGreaterThan(0);
      for (const item of g.items) {
        expect(item, `${g.name} の項目名に Markdown の記法が残っている`).not.toMatch(/[*\[\]]/);
      }
    }
    // 「扱っていないもの」のような、項目名を持たない区分は出さない
    expect(groups.map((g) => g.name)).not.toContain('商用実務で扱っていないもの');
  });

  it('career.md の経歴表から「時期 / 役割」が取れる', async () => {
    const body = bodyOf(await readFile(path.join(root, 'public-profile/career.md'), 'utf8'));
    const rows = careerTimeline(body);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      expect(r.period).toMatch(/^\d{4}/);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.title).not.toMatch(/[\[\]|]/);
    }
  });

  it('解析の形が崩れたときは空を返す（例外にしない）', () => {
    expect(skillGroups('本文だけで見出しが無い')).toEqual([]);
    expect(careerTimeline('## 経歴\n\n表が無い')).toEqual([]);
    expect(
      skillGroups('## 区分 A（補足）\n\n### 項目：名前 — 根拠\n\n## 区分 B\n\n- **太字** の説明'),
    ).toEqual([
      { name: '区分 A', items: ['名前'] },
      { name: '区分 B', items: ['太字'] },
    ]);
  });
});
