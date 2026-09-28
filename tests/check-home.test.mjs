// ビルド後のトップの検査（scripts/check-home.mjs）が、3 点の節の欠けや空を見逃さないことを確かめる。
// 実際の dist/index.html への検査は CI のビルドの後に走る（この単体テストはビルド前に走るため、作り物の HTML で規則だけを見る）
import { describe, it, expect } from 'vitest';
import { checkHome, sectionHtml } from '../scripts/check-home.mjs';

/** 3 点の節を持つトップの HTML。引数で節の中身を差し替える */
function page({ about, projects, systems } = {}) {
  return `<main>
    <section id="about" class="home-section"><h2>About</h2>${about ?? '<h1>Naoki Yoshida</h1><p class="lead" data-astro-cid-x>業務システムの現場で約 10 年、仕様化とテストを担当</p>'}</section>
    <section id="projects" class="home-section"><h2>Projects</h2>${projects ?? '<ul class="card-grid"><li class="card">OrgFlow</li></ul>'}</section>
    <section id="systems" class="home-section"><h2>Systems</h2>${systems ?? '<ul class="card-grid"><li class="card">Learning System</li></ul>'}</section>
    <section id="ask" class="home-section"><h2>Ask AI</h2></section>
  </main>`;
}

describe('トップの 3 点の検査', () => {
  it('3 つの節に中身があれば合格', () => {
    expect(checkHome(page())).toEqual([]);
  });

  it('節が無い・カードが無い・一言が無いと、それぞれ指摘する', () => {
    expect(checkHome(page().replace('id="systems"', 'id="other"'))).toEqual([
      '「どう開発しているか」の節 #systems がトップに無い',
    ]);
    expect(checkHome(page({ projects: '<p>準備中</p>' }))).toEqual([
      '「何を作ったか」の節 #projects に カード 1 枚以上 が無い',
    ]);
    expect(checkHome(page({ about: '<h1>N</h1>' }))).toEqual([
      '「何の人か」の節 #about に 名前（h1）と一言 が無い',
    ]);
  });

  it('一言（class="lead"）が無ければ、名前やリンクの文字が多くても不合格', () => {
    const about =
      '<h1>Naoki Yoshida</h1><p><a href="#">GitHub</a> <a href="#">Qiita</a> <a href="#">Reading Log</a></p>';
    expect(checkHome(page({ about }))).toEqual([
      '「何の人か」の節 #about に 名前（h1）と一言 が無い',
    ]);
    expect(checkHome(page({ about: '<h1>Naoki Yoshida</h1><p class="lead"> </p>' }))).toEqual([
      '「何の人か」の節 #about に 名前（h1）と一言 が無い',
    ]);
  });

  it('節の範囲は次の節の手前までで、隣の節のカードを数えない', () => {
    const html = page({ projects: '' });
    expect(sectionHtml(html, 'projects')).not.toContain('class="card"');
    expect(checkHome(html)).toEqual(['「何を作ったか」の節 #projects に カード 1 枚以上 が無い']);
  });
});
