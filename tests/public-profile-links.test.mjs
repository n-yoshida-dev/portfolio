// public-profile 内の参照が壊れていないことを確かめる。
// projects/*.md の systems: が実在する systems/*.md を指しているか、articles.json の id が重複していないか。
import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public-profile');

/** frontmatter の `systems: [a, b]` を読む（簡易パーサ。この形式しか使わない） */
async function readSystemsRefs(file) {
  const text = await readFile(file, 'utf8');
  const m = text.match(/^systems:\s*\[(.*?)\]\s*$/m);
  if (!m || !m[1].trim()) return [];
  return m[1].split(',').map((s) => s.trim());
}

describe('public-profile の参照整合', () => {
  it('projects の systems: は実在する systems を指す', async () => {
    const systems = (await readdir(path.join(root, 'systems')))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
    const projects = (await readdir(path.join(root, 'projects'))).filter((f) => f.endsWith('.md'));
    for (const p of projects) {
      const refs = await readSystemsRefs(path.join(root, 'projects', p));
      for (const ref of refs) {
        expect(systems, `${p} の systems: "${ref}" に対応する systems/${ref}.md が無い`).toContain(
          ref,
        );
      }
    }
  });

  it('articles.json の id と url は重複しない', async () => {
    const articles = JSON.parse(await readFile(path.join(root, 'articles.json'), 'utf8'));
    const ids = articles.map((a) => a.id);
    const urls = articles.map((a) => a.url);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
