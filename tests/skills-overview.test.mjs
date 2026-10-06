// Skills ページのカード（SPEC.md §4）を本文から取り出す解析（src/lib/outline.ts の skillOverview）を確かめる。
// 実際の skills.md で「すべての ## 節がカードになり、どのカードにも項目がある」ことと、読み取りの規則そのものを見る。
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { skillOverview, inlineSegments } from '../src/lib/outline.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** frontmatter を落として本文だけにする */
function bodyOf(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : text;
}

describe('skills.md のカード', async () => {
  const body = bodyOf(await readFile(path.join(root, 'public-profile/skills.md'), 'utf8'));
  const { cards, note } = skillOverview(body);

  it('## 節がすべてカードになり、見出しの順に並ぶ', () => {
    const h2 = body.split('\n').filter((l) => l.startsWith('## '));
    expect(cards.map((c) => c.title)).toEqual(h2.map((l) => l.slice(3).trim()));
  });

  it('どのカードにも項目があり、Markdown の記法が残らない', () => {
    for (const c of cards) {
      expect(c.items.length, `${c.title} の項目`).toBeGreaterThan(0);
      for (const item of c.items) {
        // 括弧は項目名そのものに入ることがあるので見ない。落とすのは太字の無い箇条書きだけ（下の規則のテスト）
        expect(item, `${c.title} の項目名`).not.toMatch(/[*\[\]]/);
        expect(item.length).toBeGreaterThan(0);
      }
    }
  });

  it('区分のカードには冒頭の定義が付き、根拠のリンクが 1 つ以上ある', () => {
    expect(cards.filter((c) => c.definition).length).toBeGreaterThanOrEqual(3);
    expect(cards.flatMap((c) => c.evidence).length).toBeGreaterThan(0);
    for (const e of cards.flatMap((c) => c.evidence)) expect(e.href).toMatch(/^\//);
  });

  it('判定の注記が取れて、リンクが残る', () => {
    expect(note.map((s) => s.text).join('').length).toBeGreaterThan(0);
    expect(note.some((s) => s.href)).toBe(true);
  });
});

describe('skillOverview の規則', () => {
  const body = [
    '**区分**：A（定義 1。補足）／B（定義 2）／C（定義 3）。',
    '判定は [ツール](/projects/tool) で行う。',
    '',
    '## A（約 3 年）',
    '',
    '- **項目 1**：説明',
    '',
    '## B（根拠のあるもの）',
    '',
    '### 分類：項目 2 — [根拠](/projects/x)',
    '',
    '### 分類：項目 2b — [根拠](/projects/x)',
    '',
    '## B・C',
    '',
    '- **項目 3**：説明',
    '',
    '## 扱っていないもの（補足）',
    '',
    '- 項目 4（括弧は落とす）',
  ].join('\n');
  const { cards, note } = skillOverview(body);

  it('見出しはそのまま、定義は括弧書きを除いた区分名で引き、「・」でつながる区分は「／」でつなぐ', () => {
    expect(cards.map((c) => [c.title, c.definition])).toEqual([
      ['A（約 3 年）', '定義 1。補足'],
      ['B（根拠のあるもの）', '定義 2'],
      ['B・C', '定義 2／定義 3'],
      ['扱っていないもの（補足）', ''],
    ]);
  });

  it('項目名は ### → 太字 → 箇条書きの本文（括弧の前まで）の順に取り、### のリンクを重ねずに根拠にする', () => {
    expect(cards.map((c) => c.items)).toEqual([
      ['項目 1'],
      ['項目 2', '項目 2b'],
      ['項目 3'],
      ['項目 4'],
    ]);
    // 同じリンクを根拠にする見出しが続いても、根拠は 1 つにまとめる
    expect(cards[1].evidence).toEqual([{ label: '根拠', href: '/projects/x' }]);
  });

  it('定義の行より後ろが注記になり、リンクを保つ', () => {
    expect(note).toEqual([
      { text: '判定は ' },
      { text: 'ツール', href: '/projects/tool' },
      { text: ' で行う。' },
    ]);
  });

  it('見出しも定義も無い本文は空', () => {
    expect(skillOverview('本文だけ')).toEqual({ cards: [], note: [] });
    expect(inlineSegments('リンクなし')).toEqual([{ text: 'リンクなし' }]);
  });
});
