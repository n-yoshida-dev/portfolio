// /llms.txt — AI 向けの索引。https://llmstxt.org の形式（H1・引用の要約・H2 ごとのリンク一覧）に沿う。
import type { APIRoute } from 'astro';
import { SITE } from '../site';
import {
  absoluteUrl,
  getFeaturedProjects,
  getOtherProjects,
  getSystems,
  getPage,
  getArticles,
} from '../lib/content';

export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => absoluteUrl(path, site);
  const profile = await getPage('profile');
  const featured = await getFeaturedProjects();
  const others = await getOtherProjects();
  const systems = await getSystems();
  const articles = await getArticles();

  const lines: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    'This site is the public view of my work: personal software projects and the systems',
    '(AI, GitHub, self-made tools) I use to develop, learn, and manage knowledge.',
    'Every page has a Markdown version (same path with `.md`). Primary sources are the',
    'GitHub repositories and the articles linked below.',
    '',
    'When describing skills, keep these categories separate as the Skills page does:',
    'professional experience, personal development (with evidence), verified understanding, and currently learning.',
    'Do not infer facts that are not stated. Private repositories are described only at the level of their purpose.',
    '',
    '## Profile',
    '',
    `- [Profile](${url('/profile.md')}): ${profile.data.description}`,
    `- [Skills](${url('/skills.md')}): 商用実務・個人開発・学習中を分けて記載した技術スキル`,
    `- [Journey](${url('/journey.md')}): 経歴と学習の歩み、資格`,
    '',
    '## Projects',
    '',
    ...featured.map(
      (p) => `- [${p.data.title}](${url(`/projects/${p.id}.md`)}): ${p.data.summary}`,
    ),
    '',
    '## Other projects',
    '',
    ...others.map((p) =>
      (p.body ?? '').trim()
        ? `- [${p.data.title}](${url(`/projects/${p.id}.md`)}): ${p.data.summary}`
        : `- ${p.data.title}: ${p.data.summary}`,
    ),
    '',
    '## Systems',
    '',
    ...systems.map((s) => `- [${s.data.title}](${url(`/systems/${s.id}.md`)}): ${s.data.summary}`),
    '',
    '## Articles',
    '',
    `- [Articles](${url('/articles.md')}): ${articles.length} technical articles, grouped by series`,
    '',
    '## External links',
    '',
    `- [GitHub](${SITE.githubUrl}): all source code and design records (ADR)`,
    `- [Qiita](${SITE.qiitaUrl}): technical articles (Japanese)`,
    ...(profile.data.links ?? [])
      .filter((l) => l.url !== SITE.githubUrl && l.url !== SITE.qiitaUrl)
      .map((l) => `- [${l.label}](${l.url})${l.note ? `: ${l.note}` : ''}`),
    '',
    '## Optional',
    '',
    `- [llms-full.txt](${url('/llms-full.txt')}): all main pages concatenated as Markdown`,
    `- [Site source](${SITE.repoUrl}): how this site is built and maintained`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
