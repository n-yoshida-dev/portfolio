// トップの About 以外の短い版（SPEC.md §4。2026-10-03 に見本から選んだ形）を作る読み取り処理（src/lib/outline.ts）を確かめる。
// Skills のカード（topSkillCards）・Journey の担当（careerTimeline の detail）・Articles の連載 × 公開月の表（articleCalendar）。
// 実際の public-profile で空にならないことと、読み取りの規則そのものを見る。
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { topSkillCards, careerTimeline, articleCalendar } from '../src/lib/outline.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** frontmatter を落として本文だけにする */
function bodyOf(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : text;
}

describe('トップの Skills のカード', async () => {
  const body = bodyOf(await readFile(path.join(root, 'public-profile/skills.md'), 'utf8'));
  const cards = topSkillCards(body);

  it('項目名のある区分だけがカードになり、どのカードにも項目がある', () => {
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.map((c) => c.name)).not.toContain('商用実務で扱っていないもの');
    for (const c of cards) expect(c.items.length, `${c.name} の項目`).toBeGreaterThan(0);
  });

  it('見出しの括弧書きは区分名から外して span に入る', () => {
    const work = cards.find((c) => c.name === '商用実務');
    expect(work?.span).toBe('約 10 年');
    for (const c of cards) expect(c.name).not.toMatch(/[（(]/);
  });

  it('根拠がまだない区分（理解確認済み・学習中）だけが tentative になる', () => {
    expect(cards.filter((c) => c.tentative).map((c) => c.name)).toEqual(['理解確認済み・学習中']);
  });
});

describe('トップの Journey の担当', async () => {
  const body = bodyOf(await readFile(path.join(root, 'public-profile/career.md'), 'utf8'));

  it('経歴表の 3 列目（主な担当）が detail に入る', () => {
    const rows = careerTimeline(body);
    for (const r of rows) {
      expect(r.detail.length, `${r.period} の担当`).toBeGreaterThan(0);
      expect(r.detail).not.toMatch(/[\[\]|]/);
    }
  });

  it('2 列しかない表では detail が空になる（例外にしない）', () => {
    expect(careerTimeline('## 経歴\n\n| 時期 | 役割 |\n|---|---|\n| 2020 | 役割 A |')).toEqual([
      { period: '2020', title: '役割 A', detail: '' },
    ]);
  });
});

describe('トップの Articles の連載 × 公開月', async () => {
  const articles = JSON.parse(
    await readFile(path.join(root, 'public-profile/articles.json'), 'utf8'),
  );
  const cal = articleCalendar(articles);

  it('すべての記事がどこかの月に 1 回ずつ数えられる', () => {
    const counted = cal.rows.reduce((sum, r) => sum + r.perMonth.reduce((a, b) => a + b, 0), 0);
    expect(counted).toBe(articles.length);
    for (const r of cal.rows) {
      expect(
        r.perMonth.reduce((a, b) => a + b, 0),
        `${r.series} の合計`,
      ).toBe(r.total);
      expect(r.perMonth.length).toBe(cal.months.length);
    }
  });

  it('連載は最初の記事が古い順、最新はいちばん新しい記事', () => {
    const firstMonth = (r) => r.perMonth.findIndex((n) => n > 0);
    const order = cal.rows.map(firstMonth);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    const newest = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
    expect(cal.latest?.url).toBe(newest.url);
  });

  it('記事の無い月も列に入り、連載の無い記事は「その他」にまとまる', () => {
    const made = articleCalendar([
      { title: 'a', url: 'https://example.com/a', publishedAt: '2025-11-03', series: 'S' },
      { title: 'b', url: 'https://example.com/b', publishedAt: '2026-02-10' },
    ]);
    expect(made.months).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(made.rows).toEqual([
      { series: 'S', total: 1, perMonth: [1, 0, 0, 0] },
      { series: 'その他', total: 1, perMonth: [0, 0, 0, 1] },
    ]);
    expect(made.latest?.series).toBe('その他');
  });

  it('記事が無ければ空を返す（例外にしない）', () => {
    expect(articleCalendar([])).toEqual({ months: [], rows: [] });
  });
});
