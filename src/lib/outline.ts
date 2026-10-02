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
  /** 3 列目の「主な担当」。トップでは役割の下に薄い文字で出す。無ければ空 */
  detail: string;
}

/** トップの Skills 節のカード 1 枚（Skills ページのカードから、項目名のある区分だけを取ったもの） */
export interface TopSkillCard {
  /** 区分名（見出しの括弧書きを除く）。「商用実務」 */
  name: string;
  /**
   * 見出しの括弧書きのうち、期間（数字を含むもの）。「商用実務（約 10 年）」→「約 10 年」。
   * 「個人開発（根拠のあるもの）」のような期間でない括弧書きは出さない（見本 C の形）。無ければ空
   */
  span: string;
  definition: string;
  items: string[];
  evidence: SkillCard['evidence'];
  /** 実装の根拠がまだない区分（理解確認済み・学習中）。トップでは破線の枠で描く */
  tentative: boolean;
}

/** 記事 1 本のうち、連載 × 公開月の表に要る項目（articles.json の形） */
export interface CalendarArticle {
  title: string;
  url: string;
  publishedAt: string;
  series?: string;
}

/** トップの Articles 節の「連載 × 公開月」の表 */
export interface ArticleCalendar {
  /** 列になる月（YYYY-MM）。最初の記事の月から最後の記事の月まで、記事の無い月も含めて古い順 */
  months: string[];
  /** 行になる連載。最初の記事が古い順（学んだ順） */
  rows: { series: string; total: number; perMonth: number[] }[];
  /** いちばん新しい記事。記事が無ければ undefined */
  latest?: CalendarArticle & { series: string };
}

/** 実装の根拠がまだない区分の名前。CLAUDE.md「守ること」の区分（商用実務 / 個人開発 / 理解確認済み / 学習中）のうち後ろの 2 つ */
const TENTATIVE_KINDS = ['理解確認済み', '学習中'];

/** 連載の無い記事をまとめる名前（content.ts の groupArticlesBySeries と同じ） */
const NO_SERIES = 'その他';

/** Markdown のリンク `[表示](URL)` を表示だけにする */
function stripLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

/** 見出しから括弧書き（全角・半角）を外す。「商用実務（約 10 年）」→「商用実務」 */
function stripParen(text: string): string {
  return text.replace(/\s*[（(].*?[）)]\s*$/, '').trim();
}

/** 見出しの末尾の括弧書きの中身。「商用実務（約 10 年）」→「約 10 年」。無ければ空 */
function parenOf(text: string): string {
  return text.match(/[（(]([^（）()]*)[）)]\s*$/)?.[1].trim() ?? '';
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

/** トップの要点 1 つ（profile.md の highlights）を、Markdown 版の 1 行にする。「- 何の人か：見出し。補足」 */
export function highlightLine(h: { label: string; title: string; detail?: string }): string {
  return `- ${h.label}：${h.title}${h.detail ? `。${h.detail}` : ''}`;
}

/**
 * skills.md の本文から、トップの Skills 節のカードを作る。
 * Skills ページのカード（skillOverview）のうち、トップの短い版（skillGroups）に出る区分だけを残す
 * （「商用実務で扱っていないもの」のような項目名の無い区分はトップに出さない）
 */
export function topSkillCards(body: string): TopSkillCard[] {
  const shown = new Set(skillGroups(body).map((g) => g.name));
  return skillOverview(body)
    .cards.filter((c) => shown.has(stripParen(c.title)))
    .map((c) => {
      const name = stripParen(c.title);
      return {
        name,
        span: /\d/.test(parenOf(c.title)) ? parenOf(c.title) : '',
        definition: c.definition,
        items: c.items,
        evidence: c.evidence,
        tentative: TENTATIVE_KINDS.some((k) => name.includes(k)),
      };
    });
}

/** 「YYYY-MM」の翌月 */
function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/**
 * 記事の一覧から、トップの Articles 節の「連載 × 公開月」の表を作る（■ 1 つが記事 1 本）。
 * 月は最初の記事の月から最後の記事の月まで切れ目なく並べ、連載は最初の記事が古い順に並べる（階段状になり、学んだ順が読める）
 */
export function articleCalendar(articles: CalendarArticle[]): ArticleCalendar {
  if (articles.length === 0) return { months: [], rows: [] };
  const sorted = [...articles].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const first = sorted[0].publishedAt.slice(0, 7);
  const last = sorted[sorted.length - 1].publishedAt.slice(0, 7);
  const months = [first];
  while (months[months.length - 1] < last) months.push(nextMonth(months[months.length - 1]));

  // 古い順に見ていくので、Map への登録順がそのまま「最初の記事が古い順」になる
  const rows = new Map<string, { series: string; total: number; perMonth: number[] }>();
  for (const a of sorted) {
    const series = a.series ?? NO_SERIES;
    const row = rows.get(series) ?? { series, total: 0, perMonth: months.map(() => 0) };
    row.total += 1;
    row.perMonth[months.indexOf(a.publishedAt.slice(0, 7))] += 1;
    rows.set(series, row);
  }
  const newest = sorted[sorted.length - 1];
  return {
    months,
    rows: [...rows.values()],
    latest: { ...newest, series: newest.series ?? NO_SERIES },
  };
}

/**
 * career.md の最初の `##` より前にある段落の 1 文目（リンクは表示だけにする）。トップの Journey 節の一言に使う。
 * 「会社名は書かず、…載せています（…）。」のように、括弧の中の「。」では切らない。無ければ空
 */
export function careerLead(body: string): string {
  const intro = body.split(/^## /m)[0];
  const first = intro
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean);
  if (!first) return '';
  const plain = stripLinks(first);
  let depth = 0;
  for (let i = 0; i < plain.length; i++) {
    const ch = plain[i];
    if (ch === '（' || ch === '(') depth++;
    else if (ch === '）' || ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === '。' && depth === 0) return plain.slice(0, i + 1);
  }
  return plain;
}

/**
 * career.md の `## 経歴` にある表から「時期 / 役割 / 主な担当」を取り出す。
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
    rows.push({ period: cells[0], title: cells[1], detail: cells[2] ?? '' });
  }
  return rows;
}
