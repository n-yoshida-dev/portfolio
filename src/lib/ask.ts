// Ask AI ページで訪問者の AI に渡すプロンプト。llms.txt を最初に読ませ、区分を混同しないよう指示する。
// 最初の答えは短い概要と次の質問の候補だけにさせる（長文は読まれないため。2026-10-05 ユーザーの提案、TODO フェーズ5）。
// 2026-10-06 に本番の 3 つの AI の答えを見たユーザーの感想（原文は SPEC.md §3）を受け、概要に具体的な事実を入れさせ、質問を自然な一文で促す形にした（直し方は Claude の解釈）
import { SITE } from '../site';

/** URL を渡せない AI（Gemini）に、プロンプトと一緒に貼り付けるサイトの全文 */
export const PASTE_SOURCE = '/llms-full.txt';

/** 答え方の指示。URL を読ませるプロンプトと、全文を貼り付けるプロンプトで共通 */
const ANSWER_RULES = `Keep your first answer short:
- An overview in at most 5 bullet points. Each is one sentence
  (about 40 to 60 Japanese characters) with concrete facts
  such as years, project names, or technologies.
- Then, in one natural sentence, invite me to ask more,
  and give 3 short example questions I might ask next
  (each under about 30 Japanese characters).
Give details only when I ask a follow-up question.

Write the name as "Naoki Yoshida". Do not guess how it is written in Japanese.
When you mention skills, say whether each comes from professional
experience, personal development, or current learning.
Do not describe a skill as more advanced than the sources say.
Do not add a separate skills section to the first answer.
Do not infer anything that is not stated in those sources.

Cite the sources you relied on (links only).

Answer in Japanese, including headings.`;

/** ビルド時に確定した公開 URL（末尾の / なし）。未設定なら開発サーバーの URL */
function siteBase(site: URL | undefined): string {
  return (site ?? new URL('http://localhost:4321')).toString().replace(/\/$/, '');
}

/** 訪問者の AI に渡すプロンプト本文。site はビルド時に確定した公開 URL */
export function buildAskPrompt(site: URL | undefined): string {
  return `Read ${siteBase(site)}/llms.txt first.

Then introduce ${SITE.name}, a software engineer building
personal software and AI-assisted development systems.

Use the portfolio, GitHub projects, technical articles,
and other sources linked from llms.txt.

${ANSWER_RULES}`;
}

/**
 * URL を読みに行けない AI（Gemini）に、サイトの全文（PASTE_SOURCE）の前に付けて貼り付けるプロンプト。
 * Gemini は llms.txt の URL を渡しても中身を取得できなかった（2026-10-05 ユーザーが本番で確認。TODO フェーズ5）
 */
export function buildPastedPrompt(site: URL | undefined): string {
  return `The text after the line "---" is ${siteBase(site)}${PASTE_SOURCE},
the portfolio of ${SITE.name}, a software engineer building
personal software and AI-assisted development systems.
Use only this text. You do not need to open any URL.

Introduce ${SITE.name} based on it.

${ANSWER_RULES}`;
}

/** 各 AI サービスへのリンク 1 つ */
export interface ChatLink {
  label: string;
  href?: string;
  /**
   * URL でプロンプトを渡せないサービス（Gemini）。開くと同時に、prompt と source の全文をつないでクリップボードへ写す
   * （src/scripts/ask-copy.ts）
   */
  copy?: { prompt: string; source: string };
}

/** 各 AI サービスの「プロンプト入り新規チャット」URL。対応していないサービスは undefined */
export function chatLinks(site: URL | undefined): ChatLink[] {
  const q = encodeURIComponent(buildAskPrompt(site));
  return [
    { label: 'ChatGPT で開く', href: `https://chatgpt.com/?q=${q}` },
    { label: 'Claude で開く', href: `https://claude.ai/new?q=${q}` },
    {
      label: 'Gemini（コピーして貼り付け）',
      href: 'https://gemini.google.com/app',
      copy: { prompt: buildPastedPrompt(site), source: PASTE_SOURCE },
    },
  ];
}
