// public-profile/ 配下の Markdown / JSON を「型付きのデータ」として読み込む定義。
// ここで決めた frontmatter の形（スキーマ）に合わないファイルはビルドが失敗するので、
// 書き間違いをビルド時に見つけられる。
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { ICON_NAMES } from './lib/icons';

/** 掲載する repo の公開状態。Private でも「存在と目的」は載せる（中身は載せない） */
const visibility = z.enum(['public', 'private', 'archived']);

/** 関わり方。「何を作ったか」より「何を担ったか」を示すために持つ */
const projectStatus = z.enum(['active', 'paused', 'done', 'archived']);

/**
 * 詳細ページの先頭に出す要点。1 行 1 項目で 3 つまで。本文に書いてある事実だけから作る。
 * これを書いたエントリは、HTML の詳細ページで本文を「詳しく読む」に畳む（Markdown 版は全文のまま）。
 * 本文が短いエントリは書かなくてよい（本文をそのまま出す）
 */
const detailHighlights = z.array(z.string()).min(1).max(3).optional();

/**
 * 一覧のカードに出す一文（SPEC.md §4）。句点（。）を含めず、60 字以内。
 * summary（詳細ページの冒頭・Markdown 版・llms.txt に出す 1〜2 文）とは別に持ち、AI 向けの情報を削らずにカードだけを短くする
 */
const cardTagline = z
  .string()
  .max(60, { error: 'tagline は 60 字以内にする（一覧のカードに出す一文）' })
  .refine((s) => !s.includes('。'), {
    error: 'tagline は一文にする（句点「。」を含めない）',
  });

/** 自作アプリ・リポジトリ（Projects ページ） */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './public-profile/projects' }),
  schema: z.object({
    title: z.string(),
    /** 一覧のカードに出す一文 */
    tagline: cardTagline,
    /** 詳細ページの冒頭・Markdown 版・llms.txt に出す 1〜2 文 */
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
    /**
     * true なら、トップの Projects がカード 3 列になる広い画面（1600px 以上）のときだけ、主要プロジェクトの後ろに足す。
     * 行をちょうど埋めるための枠で、featured: false のものに付ける（SPEC.md §4）
     */
    homeWide: z.boolean().default(false),
    /**
     * true ならコードを AI が書いた作品（バイブコーディング）。カード・詳細ページ・Markdown 版・llms.txt に同じ備考を 1 行出す。
     * こうした作品は Skills の根拠に数えず、作品集（Projects）として載せる（logs/decisions.md 2026-10-10）
     */
    vibeCoding: z.boolean().default(false),
    /** 並び順。小さいほど先 */
    order: z.number().default(100),
    /** 関連する Systems の slug */
    systems: z.array(z.string()).default([]),
    highlights: detailHighlights,
  }),
});

/** 開発・学習・生活改善の仕組み（Systems ページ） */
const systems = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './public-profile/systems' }),
  schema: z.object({
    title: z.string(),
    /** 一覧のカードに出す一文 */
    tagline: cardTagline,
    /** 詳細ページの冒頭・Markdown 版・llms.txt に出す 1〜2 文 */
    summary: z.string(),
    order: z.number().default(100),
    /** この仕組みを構成する repo / サービス。Projects の slug か、外部名 */
    components: z.array(z.string()).default([]),
    highlights: detailHighlights,
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
    /** profile.md だけが持つ。外部リンクの一覧。トップではアイコン・名前・note のカードになる */
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.url(),
          note: z.string().optional(),
          /** トップのカードに添える線のアイコン（ロゴではない汎用の形。src/components/Icon.astro）。無ければ出さない */
          icon: z.enum(ICON_NAMES).optional(),
        }),
      )
      .optional(),
    /** profile.md だけが持つ。トップの名前の直下に出す一言（1〜2 文） */
    tagline: z.string().optional(),
    /**
     * profile.md だけが持つ。トップに出す要点（個人で作っているもの・AI と開発する仕組み・学んでいること）。3 つまで。本文はトップには出さない。
     * トップでは 1 つを 1 列にし、label（小見出し）・title（太字の見出し）・detail（薄い文字の補足）の順に出す
     */
    highlights: z
      .array(
        z.object({
          label: z.string(),
          title: z.string(),
          detail: z.string().optional(),
        }),
      )
      .max(3)
      .optional(),
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
