// デザイン見本（3 案 × 4 ページ）を静的 HTML で生成する使い捨てスクリプト。
// 文言はすべて public-profile/ の既存の文章から取り、新しい事実は書かない。
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2];
if (!OUT) {
  console.error('使い方: node gen-mock.mjs <出力先ディレクトリ>');
  process.exit(1);
}

// ---------- 共通データ（public-profile/ から転記） ----------
const NAME = 'Naoki Yoshida';
const TAGLINE =
  '「仕様を固め、関係者と進める力」を、個人開発と AI 協働の仕組みづくりへ広げているソフトウェアエンジニア。';
const HIGHLIGHTS = [
  {
    label: '商用実務 約 10 年',
    text: '要件整理・仕様化・テスト・チームリード（継続的にコードを書く担当ではない）',
  },
  {
    label: '個人開発 2026〜',
    text: 'Java / Spring Boot で業務ワークフロー API OrgFlow を設計・実装中。React は学習中',
  },
  { label: '進め方', text: '設計判断を ADR に残し、AI と分業し、公開情報の線引きを機械で検査する' },
];
const LINKS = [
  { label: 'GitHub', url: 'https://github.com/n-yoshida-dev' },
  { label: 'Qiita', url: 'https://qiita.com/n-yoshida-dev' },
  { label: 'Reading Log', url: 'https://n-yoshida-dev.github.io/reading-log/' },
];
const PROJECTS = [
  {
    id: 'orgflow',
    title: 'OrgFlow',
    one: '申請・承認フローを題材にした業務ワークフロー API',
    year: '2026-03 〜',
    vis: 'Public',
    st: '進行中',
    num: 'ADR 36 本',
    group: '業務アプリ',
    featured: true,
    stack: [
      'Java 21',
      'Spring Boot',
      'Spring Security',
      'PostgreSQL',
      'Flyway',
      'OpenAPI',
      'Testcontainers',
    ],
  },
  {
    id: 'skill-matrix',
    title: 'skill-matrix',
    one: '学習ログを AI に読ませて「分野 × 詳細項目」の理解度を判定し、マトリクスとして可視化する個人用システム',
    year: '2026-08 〜',
    vis: 'Private',
    st: '進行中',
    num: '理解度 5 段階',
    group: '自分のためのツール',
    featured: true,
    stack: ['Go', 'TypeScript', 'React', 'Vite', 'GitHub Actions'],
  },
  {
    id: 'reading-log',
    title: 'Reading Log',
    one: 'GitHub を正本に、ChatGPT / Claude / Claude Code を横断して使う読書管理システム',
    year: '2026-08 〜',
    vis: 'Public',
    st: '進行中',
    num: 'GitHub Pages',
    group: '自分のためのツール',
    featured: true,
    stack: ['Markdown', 'Jekyll', 'GitHub Pages', 'ChatGPT Projects'],
  },
  {
    id: 'claude-plugins',
    title: 'claude-plugins',
    one: '自作アプリで使い回す Claude Code プラグインのマーケットプレイス',
    year: '2026-08 〜',
    vis: 'Public',
    st: '進行中',
    num: 'フック 3 種',
    group: '開発の道具',
    featured: true,
    stack: ['Shell', 'Claude Code plugin', 'GitHub Actions', 'shellcheck'],
  },
  {
    id: 'ai-study-coach',
    title: 'AI Study Coach',
    one: '学習記録を管理する React + TypeScript + Supabase のアプリ（AI 協働開発の練習題材）',
    year: '2026-07 〜 08',
    vis: 'Public',
    st: '一時停止',
    num: 'Vercel 公開',
    group: '開発の道具',
    featured: false,
    stack: ['React 19', 'TypeScript', 'Supabase', 'Vercel'],
  },
  {
    id: 'life-plan-simulator',
    title: 'life-plan-simulator',
    one: '希望するライフイベントから「いつ・いくら必要か」を年次で逆算するアプリ',
    year: '2026-08 〜',
    vis: 'Private',
    st: '進行中',
    num: '',
    group: '自分のためのツール',
    featured: false,
    stack: [],
  },
  {
    id: 'babyfood-check',
    title: 'babyfood-check',
    one: '離乳食の食材チェックの進捗を管理する Web アプリ',
    year: '2026-08',
    vis: 'Private',
    st: '一時停止',
    num: '',
    group: '自分のためのツール',
    featured: false,
    stack: [],
  },
  {
    id: 'home-site-finder',
    title: 'home-site-finder',
    one: '戸建てを建てる場所を町丁目の単位で比較する判断資料アプリ',
    year: '2026-08',
    vis: 'Private',
    st: '一時停止',
    num: '',
    group: '自分のためのツール',
    featured: false,
    stack: [],
  },
  {
    id: 'photo-prompt-builder',
    title: 'photo-prompt-builder',
    one: '写真加工用の英語プロンプトを選ぶだけで組み立てる Web ツール',
    year: '2026-09',
    vis: 'Private',
    st: '一時停止',
    num: '',
    group: '自分のためのツール',
    featured: false,
    stack: [],
  },
  {
    id: 'ops',
    title: 'ops',
    one: '家計・タスク・メールなどの定型雑務を Claude Code と半自動で回すモノレポ',
    year: '2026-08 〜',
    vis: 'Private',
    st: '進行中',
    num: '',
    group: '自分のためのツール',
    featured: false,
    stack: [],
  },
  {
    id: 'app-template',
    title: 'app-template',
    one: '自作アプリを新しく始めるときのテンプレートリポジトリ',
    year: '2026-09 〜',
    vis: 'Public',
    st: '進行中',
    num: '',
    group: '開発の道具',
    featured: false,
    stack: [],
  },
  {
    id: 'archived',
    title: '過去の練習リポジトリ',
    one: '2026 年前半の練習用リポジトリ。現在は更新していない',
    year: '2026-03 〜 06',
    vis: 'Archive',
    st: '終了',
    num: '',
    group: 'Archive',
    featured: false,
    stack: [],
  },
];
const SYSTEMS = [
  {
    id: 'personal-ai-context',
    title: 'Personal AI Context System',
    one: '複数の AI を跨いで自分の長期コンテキストを 1 つの非公開リポジトリで管理する',
  },
  {
    id: 'learning-system',
    title: 'Learning System',
    one: '学習ログを根拠に理解度を判定し、根拠のない昇格をしない',
  },
  {
    id: 'reading-system',
    title: 'Reading System',
    one: 'iPhone の ChatGPT から登録し、GitHub を正本に、週次レビューを AI が回す',
  },
  {
    id: 'ai-assisted-development',
    title: 'AI-assisted Development Workflow',
    one: '文書・CI・レビューで複数の自作アプリを並行して進める。判断は人間、検算は機械',
  },
];
const SKILLS = {
  pro: {
    title: '商用実務',
    sub: '約 10 年',
    note: '業務で担当。コードを書く仕事ではない',
    items: [
      [
        '要件整理・仕様化・設計書',
        'インフラ製品の導入設計、移行計画、テスト計画、本番作業のタイムチャート',
      ],
      ['テスト工程', '結合テスト・システムテスト・運用テストの計画とリード'],
      [
        '関係者調整・チームリード',
        '顧客折衝、7〜8 名のアサイン・教育・ドキュメントレビュー、見積、プリセールス',
      ],
      [
        'インフラ基礎',
        'IT 資産管理製品（SKYSEA Client View）の導入設計・構築を約 5 年、Linux 操作（LinuC レベル 1）',
      ],
      [
        '既存コードの読解',
        '稼働中の Java アプリの設定変更・障害対応・バグの原因調査（機能追加・改修は未経験）',
      ],
      ['課題管理', '不確実で引き継ぎが弱い状況でも、課題を切り出して前へ進める'],
    ],
  },
  own: {
    title: '個人開発',
    sub: '根拠のあるもの',
    note: '自分のリポジトリで設計・実装',
    groups: [
      {
        name: 'Java / Spring Boot',
        ev: 'OrgFlow',
        items: [
          ['ドメイン設計', '18 の主要概念に分けて責務を文書化、状態遷移を状態モデルで表現'],
          [
            'DB 設計',
            '概念 → 論理（DBML）→ 物理の 3 段の ER、tenant_id と複合外部キーで境界を強制',
          ],
          ['API 契約', 'OpenAPI の契約先行（業務操作カタログ → API 群 → path 候補）'],
          ['認証', 'Spring Security で JWT（HS256）を発行・検証、tenant 選択の前後を claim で区別'],
          ['例外設計', 'HTTP ステータスの選び方を ADR 化、@RestControllerAdvice で一元化'],
          ['監査ログ', '業務処理と同一トランザクション、外部キーなしで操作時点の証跡を保持'],
          ['マイグレーション', 'Flyway、seed を本体から分離して環境ごとに切り替え'],
          ['テスト', '単体は Mockito、DB を伴う検証は Testcontainers（PostgreSQL）'],
          ['設計判断の記録', 'ADR 36 本（1 ファイル 1 決定）、実装対応表、ドキュメント入口'],
        ],
      },
      {
        name: 'PostgreSQL',
        ev: 'OrgFlow',
        items: [
          ['DDL・制約設計', 'CHECK 制約、複合外部キー、text + CHECK による状態列'],
          ['資格', 'ORACLE MASTER Silver SQL 2019'],
        ],
      },
      {
        name: 'CI / CD・開発フロー',
        ev: 'OrgFlow',
        items: [
          ['GitHub Actions', 'lint / test / build と秘密情報スキャン'],
          ['ブランチ保護', 'Ruleset を自分で設定し、gh api で保存値を検証'],
          ['運用', 'PR 経由の squash マージ、Vercel の自動デプロイ、Docker Compose でローカル DB'],
        ],
      },
      {
        name: 'AI 協働開発の仕組み',
        ev: 'claude-plugins',
        items: [
          [
            'フック・スキル',
            '秘密情報のコミット阻止、編集直後の型チェック、進捗表、引き継ぎ、PR フロー',
          ],
          ['レビュー役', 'マージ前に差分を「完了条件」と仕様に照らす読み取り専用エージェント'],
          ['文書体系', 'PLAN / SPEC / TODO / KNOWLEDGE / HANDOFF / 判断台帳で複数アプリを並行運用'],
        ],
      },
      {
        name: '静的サイト・ツール',
        ev: 'Reading Log',
        items: [
          ['静的サイト', 'Jekyll + GitHub Pages、Astro（このサイト）'],
          ['検証スクリプト', 'Python / シェル（家計 CSV の検算、機密数字のブロック）'],
        ],
      },
    ],
  },
  learn: {
    title: '理解確認済み・学習中',
    sub: '',
    note: '確認問題・自分の言葉での説明で確認。実装の根拠はまだ薄い',
    items: [
      [
        'Go',
        '理解確認済み',
        '基本構文〜メソッドまで。一時停止中。インターフェース・並行処理・net/http は未着手',
      ],
      [
        'React',
        '理解確認済み',
        '起動フロー、JSX、state / props、Thinking in React まで。hooks・データ取得はこれから',
      ],
      ['AWS', '学習中', 'Solutions Architect - Associate'],
      ['Supabase 認証・RLS', '学習中', '動作は確認済み。仕組みの言語化はまだ'],
      ['Stripe', '未着手', ''],
    ],
  },
  not: [
    'Web バックエンドの新規機能の実装・改修（Java / Go とも）',
    'チーム開発でのコードレビュー・デプロイの一連の経験',
  ],
};
const CAREER = [
  [
    '2016〜2018',
    '事業会社の情報システム担当',
    'ヘルプデスク、PC 調達、仮想基盤の保守、全国拠点のネットワーク管理',
  ],
  [
    '2019〜2020',
    'SIer の設計・構築エンジニア',
    'IT 資産管理製品（SKYSEA Client View）の設計・構築',
  ],
  [
    '2020〜2024',
    '同領域のチームリーダー',
    '案件推進、7〜8 名のアサイン・教育・ドキュメントレビュー、プリセールス',
  ],
  [
    '2025〜',
    'アプリケーション開発部門（本人希望で異動）',
    '移行計画とテスト計画、結合・システムテスト、課題管理、複数案件のリード',
  ],
];
const LEARNING = [
  ['2025 春', 'Java / Spring Boot の独学を開始'],
  ['2026-03', 'OrgFlow を開始。ドメイン設計・ER 図・ADR から着手'],
  ['2026-04〜06', 'OpenAPI 契約先行、JWT 認証、マルチテナントを実装。Qiita に連載'],
  ['2026-07', '学習用リポジトリを統合して Claude Code へ移行、習熟度台帳の運用開始'],
  [
    '2026-08',
    'OrgFlow に単体テスト・Testcontainers・CI を追加。AI Study Coach を公開、Reading Log を開始',
  ],
  ['2026-09', 'Claude Code プラグインを整備、skill-matrix を再設計、このポートフォリオを作成'],
];
const CERTS = [
  '基本情報技術者',
  'Oracle Certified Java Programmer, Silver SE 17',
  'ORACLE MASTER Silver SQL 2019',
  'LinuC レベル 1',
];
const CERT_LEARNING = 'AWS Certified Solutions Architect - Associate';
const DIRECTION =
  'バックエンド（Java / Spring Boot を軸に、Go も視野）を中心に、フロントエンド（React）も扱える形で、自社プロダクトを継続的に改善する開発に携わることを目指しています。';
const NAV = [
  ['index.html', 'Projects', 'projects.html'],
  ['systems.html', 'Systems', 'systems.html'],
  ['skills.html', 'Skills', 'skills.html'],
  ['journey.html', 'Journey', 'journey.html'],
  ['articles.html', 'Articles', 'articles.html'],
  ['ask.html', 'Ask AI', 'ask.html'],
].map(([, label, href]) => ({ label, href }));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const featured = PROJECTS.filter((p) => p.featured);
const others = PROJECTS.filter((p) => !p.featured);

// 1 ページ分の HTML を組み立てる（<head> と CSS を共通化）
function page(title, css, body) {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — ${NAME}</title><style>${css}</style></head><body>${body}</body></html>`;
}

// ---------- 案 A：サイドバー + 年表（okojomoeko / brittanychiang 起点） ----------
const cssA = `
:root{--fg:#1f2328;--muted:#59636e;--line:#d8dee4;--link:#0969da;--bg:#fff;--accent:#5b4bd6;--sans:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP','Hiragino Sans',sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box}body{margin:0;font-family:var(--sans);font-size:16px;line-height:1.7;color:var(--fg);background:var(--bg)}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
.side{border-bottom:1px solid var(--line);padding:1rem 16px}
.side .name{font-weight:700;font-size:1.1rem;color:var(--fg)}.side .role{color:var(--muted);font-size:.9rem;margin:.1rem 0 .6rem}
.side nav{display:flex;flex-wrap:wrap;gap:.2rem 1rem;font-size:.95rem}.side nav a{color:var(--muted)}.side nav a.cur{color:var(--fg);font-weight:600}
.side .social{display:flex;gap:1rem;font-size:.85rem;margin-top:.6rem}
main{max-width:44rem;padding:1.5rem 16px 3rem}
h1{font-size:2rem;line-height:1.25;margin:0 0 .3rem}.lead{color:var(--muted);margin:0 0 1.5rem}
h2{font-size:.85rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:2.5rem 0 .8rem;font-weight:700}
h2 .n{color:var(--muted);font-weight:400;letter-spacing:0;text-transform:none;margin-left:.6rem}
.about{display:grid;gap:.6rem;margin:0}.about div{display:grid;grid-template-columns:9rem 1fr;gap:.5rem}.about dt{font-weight:600;color:var(--fg)}.about dd{margin:0;color:var(--muted)}
.tl{list-style:none;padding:0;margin:0;border-left:2px solid var(--line)}
.tl > li{position:relative;padding:0 0 1.2rem 1.4rem}.tl > li::before{content:'';position:absolute;left:-7px;top:.55rem;width:12px;height:12px;border-radius:50%;background:var(--accent)}
.tl .y{font-family:var(--mono);font-size:.8rem;color:var(--muted)}.tl .t{font-weight:600;font-size:1.05rem}.tl .t a{color:var(--fg)}.tl .d{margin:.1rem 0 0;color:var(--muted);font-size:.95rem}
.tl .m{display:flex;flex-wrap:wrap;gap:.3rem .8rem;font-size:.8rem;margin-top:.3rem;color:var(--muted)}
.chip{display:inline-block;font-size:.72rem;border:1px solid var(--line);border-radius:999px;padding:0 .55em;color:var(--muted);vertical-align:middle}
.tags{display:flex;flex-wrap:wrap;gap:.3rem;margin:.4rem 0 0;padding:0;list-style:none}.tags li{font-family:var(--mono);font-size:.75rem;border:1px solid var(--line);border-radius:4px;padding:0 .45em;color:var(--muted)}
.kv{list-style:none;padding:0;margin:0;display:grid;gap:.45rem}.kv li{display:grid;grid-template-columns:11rem 1fr;gap:.6rem;font-size:.95rem}.kv b{font-weight:600}.kv span{color:var(--muted)}
.kv3 li{grid-template-columns:9rem 6.5rem 1fr}
h3{font-size:1rem;margin:1.4rem 0 .5rem}h3 .ev{font-weight:400;color:var(--muted);font-size:.85rem;margin-left:.5rem}
.more{margin-top:.8rem;font-size:.95rem}
.note{color:var(--muted);font-size:.9rem;margin:.3rem 0 0}
@media(min-width:64rem){body{display:grid;grid-template-columns:16rem 1fr;min-height:100vh}
.side{position:sticky;top:0;height:100vh;border-bottom:0;border-right:1px solid var(--line);padding:2.5rem 1.5rem;display:flex;flex-direction:column}
.side .name{font-size:1.25rem}.side nav{flex-direction:column;gap:.35rem;margin-top:1.2rem;font-size:1rem}.side .social{margin-top:auto}
main{padding:3rem 3rem 4rem}}
@media(max-width:40rem){.about div,.kv li,.kv3 li{grid-template-columns:1fr}.about dt{margin-top:.3rem}}
`;
// 案 A のサイドバー（名前・肩書・目次・SNS）。cur は現在ページ名
function sideA(cur) {
  return `<aside class="side"><a class="name" href="index.html">${NAME}</a><div class="role">Software Engineer · Java / Spring Boot</div><nav>${NAV.map((n) => `<a href="${n.href}" class="${n.label === cur ? 'cur' : ''}">${n.label}</a>`).join('')}</nav><div class="social">${LINKS.map((l) => `<a href="${l.url}">${l.label}</a>`).join('')}<a href="#">llms.txt</a></div></aside>`;
}
// 案 A のプロジェクト一覧（年を左端に置いたタイムライン）
function tlProjectsA(list, withTags) {
  return `<ul class="tl">${list.map((p) => `<li><div class="y">${p.year}</div><div class="t"><a href="#">${p.title}</a> <span class="chip">${p.vis}</span> <span class="chip">${p.st}</span></div><p class="d">${esc(p.one)}</p><div class="m"><a href="#">GitHub</a>${p.num ? `<span>${p.num}</span>` : ''}</div>${withTags && p.stack.length ? `<ul class="tags">${p.stack.map((s) => `<li>${s}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>`;
}
const pagesA = {
  index: page(
    'Home',
    cssA,
    `${sideA('')}<main><h1>${NAME}</h1><p class="lead">${TAGLINE}</p>
<h2>About</h2><dl class="about">${HIGHLIGHTS.map((h) => `<div><dt>${h.label}</dt><dd>${h.text}</dd></div>`).join('')}</dl>
<h2>Projects <span class="n">${featured.length} / ${PROJECTS.length - 1} 件</span></h2>${tlProjectsA(featured, false)}<p class="more"><a href="projects.html">すべてのプロジェクト →</a></p>
<h2>Journey</h2><ul class="tl">${CAREER.map(([y, r]) => `<li><div class="y">${y}</div><div class="t">${r}</div></li>`).join('')}</ul><p class="more"><a href="journey.html">担当の詳細・学習の歩み →</a></p>
<h2>Systems <span class="n">4 件</span></h2><ul class="kv">${SYSTEMS.map((s) => `<li><b><a href="#">${s.title}</a></b><span>${s.one}</span></li>`).join('')}</ul>
<h2>Ask AI</h2><p class="note">あなたの AI に私のことを調べさせるためのプロンプト → <a href="#">Ask AI</a> / <a href="#">llms.txt</a></p></main>`,
  ),
  projects: page(
    'Projects',
    cssA,
    `${sideA('Projects')}<main><h1>Projects</h1><p class="lead">何を作ったか。Private のものは存在と目的だけ。組み合わせ方は <a href="#">Systems</a>。</p>
<h2>主なプロジェクト <span class="n">${featured.length} 件</span></h2>${tlProjectsA(featured, true)}
<h2>Other / Experiments <span class="n">${others.length} 件</span></h2>${tlProjectsA(others, false)}</main>`,
  ),
  skills: page(
    'Skills',
    cssA,
    `${sideA('Skills')}<main><h1>Skills</h1><p class="lead">4 つの区分を混ぜない：商用実務 / 個人開発 / 理解確認済み / 学習中。判定は非公開の学習ログを根拠に手で行う。</p>
<h2>商用実務 <span class="n">約 10 年 · コードを書く仕事ではない</span></h2><ul class="kv">${SKILLS.pro.items.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ul>
<h2>個人開発 <span class="n">根拠のあるもの</span></h2>${SKILLS.own.groups.map((g) => `<h3>${g.name}<span class="ev">根拠：<a href="#">${g.ev}</a></span></h3><ul class="kv">${g.items.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ul>`).join('')}
<h2>理解確認済み・学習中</h2><ul class="kv kv3">${SKILLS.learn.items.map(([k, s, v]) => `<li><b>${k}</b><span class="chip">${s}</span><span>${v}</span></li>`).join('')}</ul>
<h2>商用実務で扱っていないもの</h2><ul class="kv">${SKILLS.not.map((v) => `<li><span>${v}</span></li>`).join('')}</ul></main>`,
  ),
  journey: page(
    'Journey',
    cssA,
    `${sideA('Journey')}<main><h1>Journey</h1><p class="lead">会社名は書かず、役割の変遷だけ。身についたことは <a href="#">Skills</a> の「商用実務」に。</p>
<h2>経歴</h2><ul class="tl">${CAREER.map(([y, r, d]) => `<li><div class="y">${y}</div><div class="t">${r}</div><p class="d">${d}</p></li>`).join('')}</ul>
<p class="note"><b>正直に書いておくこと</b>：業務では既存の Java コードの読解・障害対応はあるが、機能追加・改修のように継続的にコードを書く仕事は担当していない。実装力は個人開発で積み、根拠を公開している。</p>
<h2>学習と開発の歩み</h2><ul class="tl">${LEARNING.map(([y, d]) => `<li><div class="y">${y}</div><div class="t" style="font-weight:400">${d}</div></li>`).join('')}</ul>
<h2>資格</h2><ul class="kv">${CERTS.map((c) => `<li><b>${c}</b><span></span></li>`).join('')}<li><b>${CERT_LEARNING}</b><span class="chip">学習中</span></li></ul>
<h2>今の方向</h2><p class="note">${DIRECTION}</p></main>`,
  ),
};

// ---------- 案 B：索引・等幅（koki.me 起点） ----------
const cssB = `
:root{--fg:#1f2328;--muted:#6b7480;--line:#dde2e8;--link:#1f2328;--bg:#fff;--mono:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Noto Sans Mono CJK JP',monospace}
*{box-sizing:border-box}body{margin:0;font-family:var(--mono);font-size:15px;line-height:1.75;color:var(--fg);background:var(--bg)}
a{color:var(--link);text-decoration:underline;text-underline-offset:.2em}a:hover{color:#0969da}
.wrap{max-width:62rem;margin:0 auto;padding:1.25rem 16px 3rem}
header{display:flex;flex-wrap:wrap;gap:.3rem 1.2rem;margin-bottom:2.2rem}header a{color:var(--muted);text-decoration:none}header a.cur{color:var(--fg);text-decoration:underline}
h1{font-size:2rem;margin:0 0 .2rem;font-weight:600}.lead{color:var(--muted);margin:0 0 1.6rem}
h2{font-size:.95rem;color:var(--muted);font-weight:400;margin:2rem 0 .6rem}h2::before{content:'## '}
h3{font-size:.95rem;color:var(--muted);font-weight:400;margin:1.4rem 0 .4rem}h3::before{content:'### '}
.inl{margin:0}.inl a+a::before,.inl span+span::before{content:' / ';color:var(--muted)}
ul{list-style:none;padding:0;margin:0}
.rows li{display:grid;grid-template-columns:minmax(10rem,14rem) 1fr auto;gap:.2rem 1.2rem;padding:.3rem 0;border-top:1px dashed var(--line)}.rows li:first-child{border-top:0}
.rows li::before{content:'- ';color:var(--muted);position:absolute;margin-left:-1.2rem}
.rows{padding-left:1.2rem}.rows .k{font-weight:600}.rows .v{color:var(--muted)}.rows .r{color:var(--muted);font-size:.85rem;white-space:nowrap;text-align:right}
.r .b{border:1px solid var(--line);border-radius:3px;padding:0 .4em;margin-left:.5em;font-size:.8rem}
.plain li{padding:.15rem 0}.plain li::before{content:'- ';color:var(--muted)}
.plain .y{color:var(--muted);display:inline-block;min-width:8rem}
.tags span{border:1px solid var(--line);border-radius:3px;padding:0 .45em;font-size:.85rem;margin:0 .35rem .35rem 0;display:inline-block}
.tags span+span::before{content:none}
p.note{color:var(--muted);margin:.4rem 0 0;font-size:.9rem}
@media(max-width:40rem){body{font-size:14px}.rows li{grid-template-columns:1fr}.rows .r{text-align:left;white-space:normal}.plain .y{display:block;min-width:0}}
`;
// 案 B の上ナビ（等幅・現在ページに下線）
function headB(cur) {
  return `<header><a href="index.html" class="${cur === '' ? 'cur' : ''}">Home</a>${NAV.map((n) => `<a href="${n.href}" class="${n.label === cur ? 'cur' : ''}">${n.label}</a>`).join('')}</header>`;
}
// 案 B のプロジェクト一覧（題名 / 一文 / 年・区分 の 3 カラム行）
function rowsB(list) {
  return `<ul class="rows">${list.map((p) => `<li><span class="k"><a href="#">${p.title}</a></span><span class="v">${esc(p.one)}</span><span class="r">${p.year}<span class="b">${p.vis}</span></span></li>`).join('')}</ul>`;
}
const groupsB = ['業務アプリ', '自分のためのツール', '開発の道具', 'Archive'];
const pagesB = {
  index: page(
    'Home',
    cssB,
    `<div class="wrap">${headB('')}<h1>${NAME}</h1><p class="lead">${TAGLINE}</p>
<h2>Now</h2><ul class="rows">${HIGHLIGHTS.map((h) => `<li><span class="k">${h.label}</span><span class="v">${h.text}</span><span class="r"></span></li>`).join('')}</ul>
<h2>Links</h2><p class="inl">${LINKS.map((l) => `<a href="${l.url}">${l.label}</a>`).join('')}<a href="#">llms.txt</a></p>
<h2>Projects</h2>${rowsB(featured)}<p class="note"><a href="projects.html">All ${PROJECTS.length - 1} projects →</a></p>
<h2>Systems</h2><ul class="rows">${SYSTEMS.map((s) => `<li><span class="k"><a href="#">${s.title}</a></span><span class="v">${s.one}</span><span class="r"></span></li>`).join('')}</ul>
<h2>Explore</h2><ul class="rows"><li><span class="k"><a href="skills.html">Skills</a></span><span class="v">商用実務 / 個人開発 / 理解確認済み / 学習中 を分けて記載</span><span class="r"></span></li><li><span class="k"><a href="journey.html">Journey</a></span><span class="v">経歴と学習の歩み、資格</span><span class="r"></span></li><li><span class="k"><a href="#">Articles</a></span><span class="v">Qiita の連載 21 本</span><span class="r"></span></li><li><span class="k"><a href="#">Ask AI</a></span><span class="v">あなたの AI に私のことを調べさせるプロンプト</span><span class="r"></span></li></ul></div>`,
  ),
  projects: page(
    'Projects',
    cssB,
    `<div class="wrap">${headB('Projects')}<h1>Projects</h1><p class="lead">何を作ったか。Private のものは存在と目的だけ。</p>
${groupsB
  .map((g) => {
    const list = PROJECTS.filter((p) => p.group === g);
    return `<h2>${g} (${list.length})</h2>${rowsB(list)}`;
  })
  .join('')}</div>`,
  ),
  skills: page(
    'Skills',
    cssB,
    `<div class="wrap">${headB('Skills')}<h1>Skills</h1><p class="lead">4 つの区分を混ぜない：商用実務 / 個人開発 / 理解確認済み / 学習中。</p>
<h2>商用実務 (約 10 年 · コードを書く仕事ではない)</h2><ul class="rows">${SKILLS.pro.items.map(([k, v]) => `<li><span class="k">${k}</span><span class="v">${v}</span><span class="r"></span></li>`).join('')}</ul>
<h2>個人開発 (根拠のあるもの)</h2>${SKILLS.own.groups.map((g) => `<h3>${g.name} — <a href="#">${g.ev}</a></h3><ul class="rows">${g.items.map(([k, v]) => `<li><span class="k">${k}</span><span class="v">${v}</span><span class="r"></span></li>`).join('')}</ul>`).join('')}
<h2>理解確認済み・学習中</h2><ul class="rows">${SKILLS.learn.items.map(([k, s, v]) => `<li><span class="k">${k}</span><span class="v">${v}</span><span class="r"><span class="b">${s}</span></span></li>`).join('')}</ul>
<h2>商用実務で扱っていないもの</h2><ul class="plain">${SKILLS.not.map((v) => `<li>${v}</li>`).join('')}</ul></div>`,
  ),
  journey: page(
    'Journey',
    cssB,
    `<div class="wrap">${headB('Journey')}<h1>Journey</h1><p class="lead">会社名は書かず、役割の変遷だけ。</p>
<h2>Career</h2><ul class="rows">${CAREER.map(([y, r, d]) => `<li><span class="k">${r}</span><span class="v">${d}</span><span class="r">${y}</span></li>`).join('')}</ul>
<p class="note">正直に書いておくこと：既存 Java コードの読解・障害対応はあるが、継続的にコードを書く仕事は担当していない。実装力は個人開発で積み、根拠を公開している。</p>
<h2>Learning &amp; Building</h2><ul class="plain">${LEARNING.map(([y, d]) => `<li><span class="y">${y}</span>${d}</li>`).join('')}</ul>
<h2>Certifications</h2><ul class="plain">${CERTS.map((c) => `<li>${c}</li>`).join('')}<li>${CERT_LEARNING} <span class="tags"><span>学習中</span></span></li></ul>
<h2>Direction</h2><p class="note">${DIRECTION}</p></div>`,
  ),
};

// ---------- 案 C：カード + 1 色 + 数字（tania.dev/projects 起点） ----------
const cssC = `
:root{--fg:#22252a;--muted:#646b75;--line:#e2ddd2;--card:#f5f2ea;--bg:#fbfaf7;--accent:#b42352;--sans:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP','Hiragino Sans',sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box}body{margin:0;font-family:var(--sans);font-size:16px;line-height:1.7;color:var(--fg);background:var(--bg)}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
header{border-bottom:1px solid var(--line);background:var(--bg)}header .in{max-width:64rem;margin:0 auto;padding:.8rem 16px;display:flex;flex-wrap:wrap;gap:.3rem 1.2rem;align-items:center}
header .brand{font-weight:700;color:var(--fg);margin-right:auto}header nav{display:flex;flex-wrap:wrap;gap:.2rem 1rem;font-size:.95rem}header nav a{color:var(--muted)}header nav a.cur{color:var(--accent);font-weight:600}
main{max-width:64rem;margin:0 auto;padding:2rem 16px 4rem}
h1{font-size:2.2rem;margin:0 0 .3rem;line-height:1.25}.lead{color:var(--muted);font-size:1.05rem;margin:0 0 1.5rem;max-width:44rem}
h2{font-size:1.2rem;margin:2.5rem 0 1rem;display:flex;align-items:baseline;gap:.6rem}h2 .n{font-size:.85rem;color:var(--muted);font-weight:400}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem;margin:1.5rem 0}.stat{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:.9rem 1rem}
.stat b{display:block;font-size:1.6rem;line-height:1.2;color:var(--accent);font-family:var(--mono)}.stat span{display:block;color:var(--muted);font-size:.85rem;margin-top:.2rem}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.9rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.25rem}
.card .top{display:flex;justify-content:space-between;font-family:var(--mono);font-size:.8rem;color:var(--muted)}.card .top .num{color:var(--fg)}
.card .t{font-weight:700;font-size:1.1rem}.card .t a{color:var(--accent)}.card .d{margin:0;color:var(--fg);font-size:.95rem}
.card .links{display:flex;flex-wrap:wrap;gap:.8rem;font-size:.9rem;margin-top:.3rem;font-weight:600}
.card .tags{display:flex;flex-wrap:wrap;gap:.3rem;margin:.3rem 0 0;padding:0;list-style:none}.card .tags li{font-family:var(--mono);font-size:.72rem;border:1px solid var(--line);background:var(--bg);border-radius:4px;padding:0 .45em;color:var(--muted)}
.chip{display:inline-block;font-size:.72rem;border:1px solid var(--line);border-radius:999px;padding:0 .55em;color:var(--muted);background:var(--bg)}
.card.wide{grid-column:1/-1}
.card h3{margin:0;font-size:1rem;color:var(--accent)}.card h3 .sub{color:var(--muted);font-weight:400;font-size:.85rem;margin-left:.5rem}
.kv{list-style:none;padding:0;margin:.4rem 0 0;display:grid;gap:.35rem}.kv li{display:grid;grid-template-columns:10rem 1fr;gap:.6rem;font-size:.93rem}.kv b{font-weight:600}.kv span{color:var(--muted)}
.card h4{margin:.8rem 0 .2rem;font-size:.95rem}.card h4 .ev{font-weight:400;color:var(--muted);font-size:.85rem;margin-left:.5rem}
.tl{list-style:none;padding:0;margin:0}.tl li{display:grid;grid-template-columns:8rem 1fr;gap:.8rem;padding:.7rem 0;border-top:1px solid var(--line)}.tl li:first-child{border-top:0}
.tl .y{font-family:var(--mono);color:var(--accent);font-size:.9rem;font-weight:600}.tl .t{font-weight:600}.tl .d{margin:0;color:var(--muted);font-size:.93rem}
.explore{display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;font-weight:600}
p.note{color:var(--muted);font-size:.93rem;margin:.6rem 0 0;max-width:44rem}
@media(max-width:40rem){.stats,.grid{grid-template-columns:1fr}.kv li,.tl li{grid-template-columns:1fr;gap:.1rem}h1{font-size:1.7rem}}
`;
// 案 C のヘッダー（名前 + 上ナビ、現在ページをアクセント色に）
function headC(cur) {
  return `<header><div class="in"><a class="brand" href="index.html">${NAME}</a><nav>${NAV.map((n) => `<a href="${n.href}" class="${n.label === cur ? 'cur' : ''}">${n.label}</a>`).join('')}</nav></div></header>`;
}
// 案 C のプロジェクト一覧（年・数字・題名・一文・リンクを定位置に置いた薄枠カード 2 列）
function cardsC(list, withTags) {
  return `<div class="grid">${list.map((p) => `<div class="card"><div class="top"><span>${p.year}</span><span class="num">${p.num}</span></div><div class="t"><a href="#">${p.title}</a> <span class="chip">${p.vis}</span> <span class="chip">${p.st}</span></div><p class="d">${esc(p.one)}</p><div class="links"><a href="#">GitHub</a><a href="#">詳細</a></div>${withTags && p.stack.length ? `<ul class="tags">${p.stack.map((s) => `<li>${s}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>`;
}
const pagesC = {
  index: page(
    'Home',
    cssC,
    `${headC('')}<main><h1>${NAME}</h1><p class="lead">${TAGLINE}</p>
<div class="stats"><div class="stat"><b>約 10 年</b><span>業務システムの現場。要件整理・仕様化・テスト・チームリード</span></div><div class="stat"><b>ADR 36 本</b><span>OrgFlow（Java / Spring Boot）の設計判断を公開</span></div><div class="stat"><b>記事 21 本</b><span>Qiita に連載。React は学習中</span></div></div>
<p class="explore">${LINKS.map((l) => `<a href="${l.url}">${l.label}</a>`).join('')}<a href="#">Ask AI</a><a href="#">llms.txt</a></p>
<h2>Projects <span class="n">主な ${featured.length} 件 · <a href="projects.html">すべて（${PROJECTS.length - 1}）→</a></span></h2>${cardsC(featured, false)}
<h2>Systems <span class="n">どう組み合わせて仕組み化しているか</span></h2><div class="grid">${SYSTEMS.map((s) => `<div class="card"><div class="t"><a href="#">${s.title}</a></div><p class="d">${s.one}</p></div>`).join('')}</div>
<h2>Skills / Journey</h2><p class="note">区分を混ぜない <a href="skills.html">Skills</a>（商用実務 / 個人開発 / 理解確認済み / 学習中）と、役割の変遷だけの <a href="journey.html">Journey</a>。</p></main>`,
  ),
  projects: page(
    'Projects',
    cssC,
    `${headC('Projects')}<main><h1>Projects</h1><p class="lead">何を作ったか。Private のものは存在と目的だけ。組み合わせ方は <a href="#">Systems</a>。</p>
<h2>主なプロジェクト <span class="n">${featured.length} 件</span></h2>${cardsC(featured, true)}
<h2>Other / Experiments <span class="n">${others.length} 件</span></h2>${cardsC(others, false)}</main>`,
  ),
  skills: page(
    'Skills',
    cssC,
    `${headC('Skills')}<main><h1>Skills</h1><p class="lead">4 つの区分を混ぜない。判定は非公開の学習ログを根拠に手で行う。</p>
<div class="grid">
<div class="card wide"><h3>商用実務<span class="sub">約 10 年 · 業務で担当。コードを書く仕事ではない</span></h3><ul class="kv">${SKILLS.pro.items.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ul></div>
<div class="card wide"><h3>個人開発<span class="sub">根拠のあるもの · 自分のリポジトリで設計・実装</span></h3>${SKILLS.own.groups.map((g) => `<h4>${g.name}<span class="ev">根拠：<a href="#">${g.ev}</a></span></h4><ul class="kv">${g.items.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ul>`).join('')}</div>
<div class="card"><h3>理解確認済み・学習中<span class="sub">実装の根拠はまだ薄い</span></h3><ul class="kv">${SKILLS.learn.items.map(([k, s, v]) => `<li><b>${k} <span class="chip">${s}</span></b><span>${v}</span></li>`).join('')}</ul></div>
<div class="card"><h3>商用実務で扱っていないもの<span class="sub">誤解を避けるため</span></h3><ul class="kv">${SKILLS.not.map((v) => `<li><span style="grid-column:1/-1">${v}</span></li>`).join('')}</ul></div>
</div></main>`,
  ),
  journey: page(
    'Journey',
    cssC,
    `${headC('Journey')}<main><h1>Journey</h1><p class="lead">会社名は書かず、役割の変遷だけ。身についたことは <a href="#">Skills</a> の「商用実務」に。</p>
<div class="grid">
<div class="card wide"><h3>経歴<span class="sub">2016〜</span></h3><ul class="tl">${CAREER.map(([y, r, d]) => `<li><span class="y">${y}</span><div><div class="t">${r}</div><p class="d">${d}</p></div></li>`).join('')}</ul><p class="note"><b>正直に書いておくこと</b>：既存 Java コードの読解・障害対応はあるが、継続的にコードを書く仕事は担当していない。実装力は個人開発で積み、根拠を公開している。</p></div>
<div class="card wide"><h3>学習と開発の歩み<span class="sub">2025〜</span></h3><ul class="tl">${LEARNING.map(([y, d]) => `<li><span class="y">${y}</span><div class="d" style="color:var(--fg)">${d}</div></li>`).join('')}</ul></div>
<div class="card"><h3>資格</h3><ul class="kv">${CERTS.map((c) => `<li><span style="grid-column:1/-1;color:var(--fg)">${c}</span></li>`).join('')}<li><span style="grid-column:1/-1">${CERT_LEARNING} <span class="chip">学習中</span></span></li></ul></div>
<div class="card"><h3>今の方向</h3><p class="d">${DIRECTION}</p></div>
</div></main>`,
  ),
};

for (const [k, pages] of Object.entries({ a: pagesA, b: pagesB, c: pagesC })) {
  mkdirSync(`${OUT}/${k}`, { recursive: true });
  for (const [name, html] of Object.entries(pages)) writeFileSync(`${OUT}/${k}/${name}.html`, html);
}
console.log('done');
