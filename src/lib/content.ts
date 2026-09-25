// public-profile のデータを取り出す・Markdown 文字列に組み立てる、ページ横断の共通処理。
// ページ側にロジックを持たせず、ここに集めておく（Phase 2 で自動生成に置き換えるときの境界）。
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type System = CollectionEntry<'systems'>;
export type Page = CollectionEntry<'pages'>;
export type Article = CollectionEntry<'articles'>;

/** order の昇順に並べる */
function byOrder<T extends { data: { order: number } }>(a: T, b: T): number {
  return a.data.order - b.data.order;
}

/** 主要プロジェクト（featured: true）。order 順 */
export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getCollection('projects', (p) => p.data.featured);
  return all.sort(byOrder);
}

/** その他・実験（featured: false）。order 順 */
export async function getOtherProjects(): Promise<Project[]> {
  const all = await getCollection('projects', (p) => !p.data.featured);
  return all.sort(byOrder);
}

/** Systems。order 順 */
export async function getSystems(): Promise<System[]> {
  const all = await getCollection('systems');
  return all.sort(byOrder);
}

/** 記事。新しい順 */
export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('articles');
  return all.sort((a, b) => b.data.publishedAt.localeCompare(a.data.publishedAt));
}

/** 記事を連載（series）ごとにまとめる。連載内は古い順（読む順） */
export function groupArticlesBySeries(articles: Article[]): Map<string, Article[]> {
  const groups = new Map<string, Article[]>();
  for (const a of articles) {
    const key = a.data.series ?? 'その他';
    const list = groups.get(key) ?? [];
    list.push(a);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.data.publishedAt.localeCompare(b.data.publishedAt));
  }
  return groups;
}

/** profile / career / skills のどれか 1 つ。無ければビルドを失敗させる（書き忘れを黙って通さない） */
export async function getPage(id: 'profile' | 'career' | 'skills'): Promise<Page> {
  const entry = await getEntry('pages', id);
  if (!entry) {
    throw new Error(`public-profile/${id}.md が見つかりません`);
  }
  return entry;
}

/** 相対パスをサイトの絶対 URL にする */
export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(path, site ?? 'http://localhost:4321').toString();
}

/** 公開状態の日本語ラベル */
export const visibilityLabel: Record<Project['data']['visibility'], string> = {
  public: 'Public',
  private: 'Private',
  archived: 'Archive',
};

/** 進行状態の日本語ラベル */
export const statusLabel: Record<Project['data']['status'], string> = {
  active: '進行中',
  paused: '一時停止',
  done: '完了',
  archived: '終了',
};

/**
 * プロジェクト 1 件を AI が読みやすい Markdown にする。
 * frontmatter の要点を冒頭に箇条書きで出し、本文をそのまま続ける。
 */
export function projectToMarkdown(p: Project, site: URL | undefined): string {
  const d = p.data;
  const lines = [
    `# ${d.title}`,
    '',
    d.summary,
    '',
    `- 公開状態: ${visibilityLabel[d.visibility]}`,
    `- 状態: ${statusLabel[d.status]}`,
  ];
  if (d.period) lines.push(`- 期間: ${d.period}`);
  if (d.repo) lines.push(`- リポジトリ: ${d.repo}`);
  if (d.site) lines.push(`- サイト: ${d.site}`);
  if (d.stack.length) lines.push(`- 技術: ${d.stack.join(', ')}`);
  if (d.systems.length) {
    lines.push(
      `- 関連する仕組み: ${d.systems.map((s) => absoluteUrl(`/systems/${s}.md`, site)).join(', ')}`,
    );
  }
  lines.push('', p.body ?? '');
  return lines.join('\n').trimEnd() + '\n';
}

/** Systems 1 件を Markdown にする */
export function systemToMarkdown(s: System): string {
  const d = s.data;
  const lines = [`# ${d.title}`, '', d.summary, ''];
  if (d.components.length) lines.push(`- 構成要素: ${d.components.join(', ')}`, '');
  lines.push(s.body ?? '');
  return lines.join('\n').trimEnd() + '\n';
}

/** profile / career / skills を Markdown にする */
export function pageToMarkdown(p: Page): string {
  const d = p.data;
  const lines = [`# ${d.title}`, '', d.description, '', `- 最終確認日: ${d.updated}`];
  if (d.links?.length) {
    lines.push('- リンク:');
    for (const l of d.links) lines.push(`  - ${l.label}: ${l.url}${l.note ? ` — ${l.note}` : ''}`);
  }
  lines.push('', p.body ?? '');
  return lines.join('\n').trimEnd() + '\n';
}

/** 記事一覧を Markdown にする */
export function articlesToMarkdown(articles: Article[]): string {
  const lines = [
    '# Articles',
    '',
    '技術記事の一覧。連載ごとに、読む順（公開日の古い順）に並べている。',
    '',
  ];
  for (const [series, list] of groupArticlesBySeries(articles)) {
    lines.push(`## ${series}`, '');
    for (const a of list) {
      lines.push(`- ${a.data.publishedAt} [${a.data.title}](${a.data.url})`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

/** Markdown を返すエンドポイント用のレスポンス */
export function markdownResponse(text: string): Response {
  return new Response(text, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
