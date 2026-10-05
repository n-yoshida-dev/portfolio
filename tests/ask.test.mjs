// Ask AI の入口のメニュー（src/components/AskEntry.astro）に並べる各 AI のリンク（src/lib/ask.ts の chatLinks）を確かめる。
// ChatGPT / Claude は URL にプロンプトを入れて開き、URL で渡せない Gemini だけがコピーを伴う
import { describe, it, expect } from 'vitest';
import { buildAskPrompt, chatLinks } from '../src/lib/ask.ts';

describe('Ask AI の各 AI へのリンク', () => {
  const prompt = buildAskPrompt(new URL('https://example.com/'));
  const links = chatLinks(prompt);

  it('ChatGPT・Claude・Gemini の 3 つが、どれもリンク先を持つ', () => {
    expect(links.map((l) => l.label)).toEqual([
      'ChatGPT で開く',
      'Claude で開く',
      'Gemini（コピーして貼り付け）',
    ]);
    for (const l of links) expect(l.href, l.label).toMatch(/^https:\/\//);
  });

  it('ChatGPT・Claude は URL にプロンプトを入れ、コピーは伴わない', () => {
    for (const l of links.slice(0, 2)) {
      expect(l.href, l.label).toContain(`?q=${encodeURIComponent(prompt)}`);
      expect(l.copy, l.label).toBeFalsy();
    }
  });

  it('Gemini だけがコピーを伴う（URL でプロンプトを渡せないため）', () => {
    expect(links.filter((l) => l.copy).map((l) => l.label)).toEqual([
      'Gemini（コピーして貼り付け）',
    ]);
  });

  it('プロンプトは公開 URL の llms.txt を最初に読ませる', () => {
    expect(prompt.startsWith('Read https://example.com/llms.txt first.')).toBe(true);
  });

  it('最初の答えを短い概要と次の質問の候補にさせ、区分・出典・日本語の指示も残す', () => {
    expect(prompt).toContain('at most 5 bullet points');
    expect(prompt).toContain('suggest 3 questions');
    expect(prompt).toContain('professional\nexperience, personal development, or current learning');
    expect(prompt).toContain('Do not add a separate skills section');
    expect(prompt).toContain('Cite the sources');
    expect(prompt).toContain('Answer in Japanese.');
  });
});
