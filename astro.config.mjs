// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * サイトの公開 URL。llms.txt や OGP の絶対 URL に使う。
 * 優先順位：SITE_URL（手動指定）→ Vercel が本番ビルド時に渡す URL → ローカル既定値。
 * 独自ドメインを取ったら Vercel の環境変数 SITE_URL を設定するだけでよい（コードは触らない）。
 */
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
  site,
  // 静的出力。サーバー処理は持たない（Phase 1 の方針。PLAN.md）
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /projects/orgflow のような拡張子なしの URL にする（Vercel の cleanUrls と揃える）
    format: 'file',
  },
  integrations: [sitemap()],
});
