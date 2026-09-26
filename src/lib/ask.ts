// Ask AI ページで訪問者の AI に渡すプロンプト。llms.txt を最初に読ませ、区分を混同しないよう指示する。
import { SITE } from '../site';

/** 訪問者の AI に渡すプロンプト本文。site はビルド時に確定した公開 URL */
export function buildAskPrompt(site: URL | undefined): string {
  const base = (site ?? new URL('http://localhost:4321')).toString().replace(/\/$/, '');
  return `Read ${base}/llms.txt first.

Then tell me about ${SITE.name}, a software engineer building
personal software and AI-assisted development systems.

Use the portfolio, GitHub projects, technical articles,
and other sources linked from llms.txt.

When discussing skills, distinguish professional experience,
personal development experience, and current learning.
Do not infer anything that is not stated in those sources.

Cite the sources you relied on.

Answer in Japanese.`;
}

/** 各 AI サービスの「プロンプト入り新規チャット」URL。対応していないサービスは undefined */
export function chatLinks(prompt: string): { label: string; href?: string }[] {
  const q = encodeURIComponent(prompt);
  return [
    { label: 'ChatGPT で開く', href: `https://chatgpt.com/?q=${q}` },
    { label: 'Claude で開く', href: `https://claude.ai/new?q=${q}` },
    { label: 'Gemini（コピーして貼り付け）', href: 'https://gemini.google.com/app' },
  ];
}
