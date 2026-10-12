// 作品の要約に添える文言と、llms.txt の作品の行の組み立て。
// astro:content に依存させないことで、Vitest から直接読み込んで確かめられるようにしている。

/** コードを AI が書いた作品（frontmatter の vibeCoding: true）に添える備考。表示する場所はどこもこの文言を使う */
export const VIBE_CODING_NOTE = '※バイブコーディング（コードは AI が書いた）';

/** llms.txt の作品の行に出す要約。コードを AI が書いた作品には備考を、公開サイトのある作品にはその URL を続ける */
export function projectIndexSummary(d: {
  summary: string;
  vibeCoding: boolean;
  site?: string;
}): string {
  const summary = d.vibeCoding ? `${d.summary}${VIBE_CODING_NOTE}` : d.summary;
  return d.site ? `${summary} Live site: ${d.site}` : summary;
}
