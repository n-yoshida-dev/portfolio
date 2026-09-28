// Skills / Journey の本文（Markdown）から、トップの短い版と Skills ページのカードに出す「骨格」だけを取り出す。
// 本文を 2 か所で持たないための処理（SPEC.md §4：Skills / Journey は HTML と Markdown 版が同じ本文から作られる）。
// 対象は public-profile/skills.md と career.md の書き方に合わせた最小限の解析で、汎用の Markdown パーサではない。

/** 区分（`##` 見出し）と、その中の項目名の一覧 */
export interface SkillGroup {
  /** 区分名。見出しの括弧書き（「（約 10 年）」など）は除く */
  name: string;
  /** 項目名。`###` 見出しか、箇条書き先頭の太字 */
  items: string[];
}

/** 文中のリンクを保ったままの断片。`href` があればリンク */
export interface InlineSegment {
  text: string;
  href?: string;
}

/** Skills ページのカード 1 枚（`##` 見出し 1 つ分） */
export interface SkillCard {
  /** 見出しのまま（「商用実務（約 10 年）」） */
  title: string;
  /** 冒頭の区分の定義から引いた説明。見出しが「・」で区分をつなぐときは「／」でつなぐ。見つからなければ空 */
  definition: string;
  /** 項目名。`###` 見出し → 箇条書き先頭の `**太字**` → 箇条書きの本文（括弧書きの前まで）の順に探す */
  items: string[];
  /** `###` 見出しにあるリンク（根拠のプロジェクト） */
  evidence: { label: string; href: string }[];
}

/** Skills ページの一覧（カードと、カードの下に置く判定の注記） */
export interface SkillOverview {
  cards: SkillCard[];
  /** 冒頭の定義の行より後ろの文（「判定は…」）。リンクは保つ */
  note: InlineSegment[];
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

/** 文中の Markdown のリンクを、リンクと地の文の断片に分ける */
export function inlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) });
    segments.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

/**
 * skills.md の本文を、Skills ページのカード（`##` 見出しごと）と判定の注記に分ける。
 * 区分の定義は、最初の `##` より前にある「A（定義）／B（定義）」の行から引く。その行より後ろの文が注記になる。
 * トップの短い版（skillGroups）と違い、項目名の無い区分（「扱っていないもの」）も箇条書きの本文からカードにする
 */
export function skillOverview(body: string): SkillOverview {
  const lines = body.split('\n');
  const firstH2 = lines.findIndex((l) => l.startsWith('## '));
  const intro = (firstH2 === -1 ? lines : lines.slice(0, firstH2))
    .map((l) => l.trim())
    .filter(Boolean);

  // 区分の定義：「：」の後ろの「名前（定義）」を「／」区切りで読む
  const defIndex = intro.findIndex((l) => l.includes('／') && /（[^）]+）/.test(l));
  const definitions = new Map<string, string>();
  if (defIndex !== -1) {
    const line = stripLinks(intro[defIndex]).replace(/\*\*/g, '');
    const list = line.includes('：') ? line.slice(line.indexOf('：') + 1) : line;
    for (const m of list.matchAll(/([^／（）。]+)（([^）]+)）/g)) {
      definitions.set(m[1].trim(), m[2].trim());
    }
  }
  const note = defIndex === -1 ? [] : inlineSegments(intro.slice(defIndex + 1).join(''));

  /** 区分名（括弧書きを除いた見出し）から定義を引く。「理解確認済み・学習中」は 2 つをつなぐ */
  const definitionOf = (name: string): string => {
    if (definitions.has(name)) return definitions.get(name) ?? '';
    const parts = name.split('・');
    return parts.every((p) => definitions.has(p))
      ? parts.map((p) => definitions.get(p)).join('／')
      : '';
  };

  const cards: SkillCard[] = [];
  let current:
    | {
        title: string;
        h3: string[];
        bold: string[];
        plain: string[];
        evidence: SkillCard['evidence'];
      }
    | undefined;
  const flush = () => {
    if (!current) return;
    const items = [current.h3, current.bold, current.plain].find((list) => list.length > 0) ?? [];
    cards.push({
      title: current.title,
      definition: definitionOf(stripParen(current.title)),
      items,
      evidence: current.evidence,
    });
  };
  for (const line of lines.slice(firstH2 === -1 ? lines.length : firstH2)) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      flush();
      current = { title: stripLinks(h2[1]).trim(), h3: [], bold: [], plain: [], evidence: [] };
      continue;
    }
    if (!current) continue;
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      current.h3.push(itemNameFromHeading(h3[1]));
      for (const s of inlineSegments(h3[1])) {
        if (s.href) current.evidence.push({ label: s.text, href: s.href });
      }
      continue;
    }
    const bold = line.match(/^- \*\*([^*]+)\*\*/);
    if (bold) {
      current.bold.push(stripLinks(bold[1]).trim());
      continue;
    }
    const plain = line.match(/^- (.+)$/);
    if (plain) current.plain.push(stripLinks(plain[1]).split(/[（(]/)[0].trim());
  }
  flush();
  return { cards, note };
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
