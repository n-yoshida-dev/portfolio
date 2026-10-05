// Ask AI ページで訪問者の AI に渡すプロンプト。llms.txt を最初に読ませ、区分を混同しないよう指示する。
// 最初の答えは短い概要と次の質問の候補だけにさせる（長文は読まれないため。2026-10-05 ユーザーの提案、TODO フェーズ5）
import { SITE } from '../site';

/** 訪問者の AI に渡すプロンプト本文。site はビルド時に確定した公開 URL */
export function buildAskPrompt(site: URL | undefined): string {
  const base = (site ?? new URL('http://localhost:4321')).toString().replace(/\/$/, '');
  return `Read ${base}/llms.txt first.

Then introduce ${SITE.name}, a software engineer building
personal software and AI-assisted development systems.

Use the portfolio, GitHub projects, technical articles,
and other sources linked from llms.txt.

Keep your first answer short:
- An overview in at most 5 bullet points, each one short sentence
  (about 40 Japanese characters).
- Then suggest 3 questions I could ask next to learn more.
Give details only when I ask a follow-up question.

When you mention skills, say whether each comes from professional
experience, personal development, or current learning.
Do not add a separate skills section to the first answer.
Do not infer anything that is not stated in those sources.

Cite the sources you relied on (links only).

Answer in Japanese.`;
}

/** 各 AI サービスへのリンク 1 つ */
export interface ChatLink {
  label: string;
  href?: string;
  /** URL でプロンプトを渡せないサービス（Gemini）。開くと同時にプロンプトをクリップボードへ写す */
  copy?: boolean;
}

/** 各 AI サービスの「プロンプト入り新規チャット」URL。対応していないサービスは undefined */
export function chatLinks(prompt: string): ChatLink[] {
  const q = encodeURIComponent(prompt);
  return [
    { label: 'ChatGPT で開く', href: `https://chatgpt.com/?q=${q}` },
    { label: 'Claude で開く', href: `https://claude.ai/new?q=${q}` },
    { label: 'Gemini（コピーして貼り付け）', href: 'https://gemini.google.com/app', copy: true },
  ];
}
