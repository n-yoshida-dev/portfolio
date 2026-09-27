// サイト全体で使う定数。ここ以外にサイト名や GitHub アカウントを直書きしない。
export const SITE = {
  name: 'Naoki Yoshida',
  /** <title> の末尾と OGP の site_name */
  title: 'Naoki Yoshida — Portfolio',
  description:
    'Software engineer building personal software and AI-assisted development systems. 自作アプリと、AI・GitHub・自作ツールを組み合わせた開発・学習の仕組みを公開しています。',
  github: 'n-yoshida-dev',
  githubUrl: 'https://github.com/n-yoshida-dev',
  qiitaUrl: 'https://qiita.com/n-yoshida-dev',
  repoUrl: 'https://github.com/n-yoshida-dev/portfolio',
  locale: 'ja_JP',
} as const;

/** トップの 1 節。目次（左の固定目次）と、トップの見出し・「すべて →」の行き先を同じ定義から作る */
export interface Section {
  /** `<section id>` と目次リンクの `#id`。変えるときは index.astro の `<HomeSection id>` も一緒に変える */
  id: string;
  /** 目次とトップの見出しに出す名前 */
  label: string;
  /** 詳しい版のページ。無い節（About）は「すべて →」を出さない */
  more?: { href: string; label: string };
}

/**
 * トップの 7 節。この順に縦に並べ、左の目次もこの順（SPEC.md §4）。
 * 節を増やす・減らすときはここと index.astro を直す（tests/home-sections.test.mjs が両方の一致を確かめる）
 */
export const SECTIONS: readonly Section[] = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects', more: { href: '/projects', label: 'すべてのプロジェクト' } },
  { id: 'systems', label: 'Systems', more: { href: '/systems', label: 'すべての仕組み' } },
  { id: 'skills', label: 'Skills', more: { href: '/skills', label: '根拠つきの一覧' } },
  { id: 'journey', label: 'Journey', more: { href: '/journey', label: '担当の詳細と学習の歩み' } },
  { id: 'articles', label: 'Articles', more: { href: '/articles', label: 'すべての記事' } },
  { id: 'ask', label: 'Ask AI' },
] as const;

/** 現在のパスが属する節の id。詳しい版のページ（/projects など）とその配下を、その節に対応づける */
export function sectionIdForPath(pathname: string): string | undefined {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/ask') return 'ask';
  return SECTIONS.find(
    (s) => s.more && (path === s.more.href || path.startsWith(s.more.href + '/')),
  )?.id;
}
