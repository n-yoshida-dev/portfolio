// /llms-full.txt — 主要ページの Markdown を 1 ファイルに連結したもの。AI が 1 回で全体を読める。
import type { APIRoute } from 'astro';
import { SITE } from '../site';
import {
  getFeaturedProjects,
  getOtherProjects,
  getSystems,
  getPage,
  getArticles,
  projectToMarkdown,
  systemToMarkdown,
  pageToMarkdown,
  articlesToMarkdown,
} from '../lib/content';

export const GET: APIRoute = async ({ site }) => {
  const parts: string[] = [`# ${SITE.name} — full text`, '', `> ${SITE.description}`, ''];

  for (const id of ['profile', 'skills', 'career'] as const) {
    parts.push('---', '', pageToMarkdown(await getPage(id)));
  }
  for (const p of [...(await getFeaturedProjects()), ...(await getOtherProjects())]) {
    parts.push('---', '', projectToMarkdown(p, site));
  }
  for (const s of await getSystems()) {
    parts.push('---', '', systemToMarkdown(s));
  }
  parts.push('---', '', articlesToMarkdown(await getArticles()));

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
