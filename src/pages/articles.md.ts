// /articles.md — Articles の Markdown 版
import type { APIRoute } from 'astro';
import { getArticles, articlesToMarkdown, markdownResponse } from '../lib/content';

export const GET: APIRoute = async () => markdownResponse(articlesToMarkdown(await getArticles()));
