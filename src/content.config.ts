// public-profile/ 配下の Markdown / JSON を「型付きのデータ」として読み込む定義。
// ここで決めた frontmatter の形（スキーマ）に合わないファイルはビルドが失敗するので、
// 書き間違いをビルド時に見つけられる。
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/** 掲載する repo の公開状態。Private でも「存在と目的」は載せる（中身は載せない） */
const visibility = z.enum(['public', 'private', 'archived']);

/** 関わり方。「何を作ったか」より「何を担ったか」を示すために持つ */
const projectStatus = z.enum(['active', 'paused', 'done', 'archived']);

/** 自作アプリ・リポジトリ（Projects ページ） */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './public-profile/projects' }),
  schema: z.object({
    title: z.string(),
    /** 一覧カードに出す 1〜2 文 */
    summary: z.string(),
    repo: z.url().optional(),
    /** 公開サイトがあれば */
    site: z.url().optional(),
    visibility,
    status: projectStatus,
    /** 例：2026-03 〜 */
    period: z.string().optional(),
    /** 主要技術。羅列ではなく「このプロジェクトで実際に使ったもの」だけ */
    stack: z.array(z.string()).default([]),
    /** true なら一覧の上段（主要プロジェクト）に出す。false は「Other」にまとめる */
    featured: z.boolean().default(false),
    /** 並び順。小さいほど先 */
    order: z.number().default(100),
    /** 関連する Systems の slug */
    systems: z.array(z.string()).default([]),
  }),
});

/** 開発・学習・生活改善の仕組み（Systems ページ） */
const systems = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './public-profile/systems' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(100),
    /** この仕組みを構成する repo / サービス。Projects の slug か、外部名 */
    components: z.array(z.string()).default([]),
  }),
});

/** profile.md / career.md / skills.md の 3 つ。1 ファイル 1 ページ */
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './public-profile' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** 「最終確認日」。習熟度や経歴は日付付きでないと誤読される。YAML は日付を Date として読むので文字列に揃える */
    updated: z
      .union([z.date(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
      .transform((v) => (typeof v === 'string' ? v : v.toISOString().slice(0, 10))),
    /** profile.md だけが持つ。外部リンクの一覧 */
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.url(),
          note: z.string().optional(),
        }),
      )
      .optional(),
    /** profile.md だけが持つ。トップの名前の直下に出す一言（1 文） */
    tagline: z.string().optional(),
    /** profile.md だけが持つ。トップに出す「何の人か」の要点。1 行 1 項目で 3 つまで。本文はトップには出さない */
    highlights: z.array(z.string()).max(3).optional(),
  }),
});

/** 技術記事（Articles ページ）。Phase 2 で自動取得に置き換えやすいよう JSON にしている */
const articles = defineCollection({
  loader: file('./public-profile/articles.json'),
  schema: z.object({
    title: z.string(),
    url: z.url(),
    platform: z.enum(['qiita', 'zenn', 'note', 'blog', 'other']),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tags: z.array(z.string()).default([]),
    /** 記事群のまとまり（連載名）。一覧で見出しにする */
    series: z.string().optional(),
    summary: z.string().optional(),
  }),
});

export const collections = { projects, systems, pages, articles };
