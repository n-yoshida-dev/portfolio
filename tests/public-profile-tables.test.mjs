// 本文がそのまま HTML に出るページ（Skills / Journey）の表を短く保つ。
// 表のセルは 1 セル 1 文までにし、句点（。）で文を重ねない決まり（SPEC.md §4）。
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public-profile');

/** 本文を畳まずに全文 HTML に出すページ。projects / systems の本文は畳むので対象外 */
const PAGES = ['skills.md', 'career.md'];

describe('Skills / Journey の表', () => {
  for (const page of PAGES) {
    it(`${page} の表のセルに句点（。）が無い`, async () => {
      const lines = (await readFile(path.join(root, page), 'utf8')).split('\n');
      lines.forEach((line, i) => {
        if (!line.startsWith('|')) return;
        expect(line.includes('。'), `${page}:${i + 1} の表のセルに句点がある：${line}`).toBe(false);
      });
    });
  }
});
