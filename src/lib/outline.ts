// Skills / Journey の本文（Markdown）から、トップの短い版に出す「骨格」だけを取り出す。
// 本文を 2 か所で持たないための処理（SPEC.md §4：Skills / Journey は HTML と Markdown 版が同じ本文から作られる）。
// 対象は public-profile/skills.md と career.md の書き方に合わせた最小限の解析で、汎用の Markdown パーサではない。

/** 区分（`##` 見出し）と、その中の項目名の一覧 */
export interface SkillGroup {
  /** 区分名。見出しの括弧書き（「（約 10 年）」など）は除く */
  name: string;
  /** 項目名。`###` 見出しか、箇条書き先頭の太字 */
  items: string[];
}

/** 年表の 1 行 */
export interface TimelineRow {
  period: string;
  title: string;
}

/** Markdown のリンク `[表示](URL)` を表示だけにする */
function stripLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

/** 見出しから括弧書き（全角・半角）を外す。「商用実務（約 10 年）」→「商用実務」 */
function stripParen(text: string): string {
  return text.replace(/\s*[（(].*?[）)]\s*$/, '').trim();
}

/** `###` 見出しの「：」より前を項目名にする。「バックエンド：Java / Spring Boot — OrgFlow」→「Java / Spring Boot」 */
function itemNameFromHeading(text: string): string {
  const plain = stripLinks(text);
  const afterColon = plain.includes('：') ? plain.slice(plain.indexOf('：') + 1) : plain;
  return afterColon.split(/\s+—\s+/)[0].trim();
}

/**
 * skills.md の本文を「区分 → 項目名」に畳む。
 * 項目名は `###` 見出しがあればそれ、無ければ箇条書き先頭の `**太字**`。どちらも無い区分は出さない（「商用実務で扱っていないもの」など）
 */
export function skillGroups(body: string): SkillGroup[] {
  const groups: SkillGroup[] = [];
  let current: { name: string; h3: string[]; bold: string[] } | undefined;
  const flush = () => {
    if (!current) return;
    const items = current.h3.length > 0 ? current.h3 : current.bold;
    if (items.length > 0) groups.push({ name: current.name, items });
  };
  for (const line of body.split('\n')) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      flush();
      current = { name: stripParen(h2[1]), h3: [], bold: [] };
      continue;
    }
    if (!current) continue;
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      current.h3.push(itemNameFromHeading(h3[1]));
      continue;
    }
    const bold = line.match(/^- \*\*([^*]+)\*\*/);
    if (bold) current.bold.push(stripLinks(bold[1]).trim());
  }
  flush();
  return groups;
}

/**
 * career.md の `## 経歴` にある表から「時期 / 役割」を取り出す（3 列目の担当はトップに出さない）。
 * 表は「| 時期 | 役割 | 主な担当 |」の形で、見出し行と区切り行（|---|）を飛ばす
 */
export function careerTimeline(body: string): TimelineRow[] {
  const rows: TimelineRow[] = [];
  let inSection = false;
  for (const line of body.split('\n')) {
    if (/^## /.test(line)) {
      inSection = line.startsWith('## 経歴');
      continue;
    }
    if (!inSection || !line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => stripLinks(c).trim());
    if (cells.length < 2 || cells[0] === '時期' || /^-+$/.test(cells[0])) continue;
    rows.push({ period: cells[0], title: cells[1] });
  }
  return rows;
}
