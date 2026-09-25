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

/** ナビゲーション。ページを増やすときはここに 1 行足す */
export const NAV = [
  { href: '/projects', label: 'Projects' },
  { href: '/systems', label: 'Systems' },
  { href: '/skills', label: 'Skills' },
  { href: '/journey', label: 'Journey' },
  { href: '/articles', label: 'Articles' },
  { href: '/ask', label: 'Ask AI' },
] as const;
