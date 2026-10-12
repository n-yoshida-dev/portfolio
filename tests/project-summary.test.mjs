// llms.txt の作品の行に出す要約（src/lib/project-summary.ts の projectIndexSummary）を確かめる。
// コードを AI が書いた作品には備考を、公開サイトのある作品には URL を、この順で続ける
import { describe, it, expect } from 'vitest';
import { projectIndexSummary, VIBE_CODING_NOTE } from '../src/lib/project-summary.ts';

describe('llms.txt の作品の行の要約', () => {
  const summary = '学習ログを AI に読ませて理解度を判定する。';
  const site = 'https://example.com/app/';

  it('備考も公開サイトも無い作品は、要約だけ', () => {
    expect(projectIndexSummary({ summary, vibeCoding: false })).toBe(summary);
  });

  it('コードを AI が書いた作品は、要約の後ろに備考が付く', () => {
    expect(projectIndexSummary({ summary, vibeCoding: true })).toBe(
      `${summary}${VIBE_CODING_NOTE}`,
    );
  });

  it('公開サイトのある作品は、要約の後ろに URL が付く', () => {
    expect(projectIndexSummary({ summary, vibeCoding: false, site })).toBe(
      `${summary} Live site: ${site}`,
    );
  });

  it('両方ある作品は、備考の後ろに URL が付く', () => {
    expect(projectIndexSummary({ summary, vibeCoding: true, site })).toBe(
      `${summary}${VIBE_CODING_NOTE} Live site: ${site}`,
    );
  });
});
