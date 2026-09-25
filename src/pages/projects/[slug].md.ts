// /projects/<slug>.md — プロジェクト詳細の Markdown 版。HTML 版と同じ条件（本文あり）でだけ作る
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { projectToMarkdown, markdownResponse, type Project } from '../../lib/content';

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCollection('projects', (p) => (p.body ?? '').trim().length > 0);
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
};

export const GET: APIRoute<{ project: Project }> = ({ props, site }) =>
  markdownResponse(projectToMarkdown(props.project, site));
