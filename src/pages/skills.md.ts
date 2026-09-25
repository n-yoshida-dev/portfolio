// /skills.md — Skills の Markdown 版
import type { APIRoute } from 'astro';
import { getPage, pageToMarkdown, markdownResponse } from '../lib/content';

export const GET: APIRoute = async () => markdownResponse(pageToMarkdown(await getPage('skills')));
