#!/usr/bin/env node
// OGP 画像（SNS やチャットでリンクを貼ったときに出る画像）を SVG から生成して public/og.png に置く。
// sharp は Astro が画像処理のために同梱しているものを使う。実行：node scripts/generate-og.mjs
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'public', 'og.png');

const name = 'Naoki Yoshida';
const line1 = 'Software engineer building personal software';
const line2 = 'and AI-assisted development systems.';
const line3 = 'Projects · Systems · Skills · Ask AI';

// 1200×630 は OGP の標準サイズ。装飾は付けず、文字と 1 本の線だけ
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="80" y="80" width="6" height="470" fill="#1f2328"/>
  <text x="120" y="230" font-family="Helvetica, Arial, 'Noto Sans JP', sans-serif" font-size="72" font-weight="700" fill="#1f2328">${name}</text>
  <text x="120" y="320" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#59636e">${line1}</text>
  <text x="120" y="370" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#59636e">${line2}</text>
  <text x="120" y="500" font-family="Menlo, Consolas, monospace" font-size="28" fill="#0969da">${line3}</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile(out, png);
console.log(`OGP 画像を生成: ${path.relative(process.cwd(), out)} (${png.length} bytes)`);
