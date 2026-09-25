// /systems/<slug>.md — Systems 詳細の Markdown 版
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { systemToMarkdown, markdownResponse, type System } from '../../lib/content';

export const getStaticPaths: GetStaticPaths = async () => {
  const systems = await getCollection('systems');
  return systems.map((system) => ({ params: { slug: system.id }, props: { system } }));
};

export const GET: APIRoute<{ system: System }> = ({ props }) =>
  markdownResponse(systemToMarkdown(props.system));
