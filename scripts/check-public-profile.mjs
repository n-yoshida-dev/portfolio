#!/usr/bin/env node
// public-profile/ 配下の全ファイルを禁止語パターンで検査する。
// 目的：「公開してよい情報だけ」を人の注意力ではなく機械で担保する（判断は人間、検算は機械）。
// 使い方：node scripts/check-public-profile.mjs [ディレクトリ]   ヒットがあれば exit 1
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const rulesPath = path.join(here, 'public-profile-rules.json');

/** ルール定義を読み込み、正規表現にコンパイルする */
export async function loadRules(file = rulesPath) {
  const json = JSON.parse(await readFile(file, 'utf8'));
  return json.rules.map((r) => ({ ...r, regex: new RegExp(r.pattern, 'gu') }));
}

/** 1 つのテキストを検査し、ヒットした行を返す */
export function scanText(text, rules, fileLabel = '(text)') {
  const hits = [];
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    for (const rule of rules) {
      rule.regex.lastIndex = 0;
      const match = rule.regex.exec(line);
      if (match) {
        hits.push({
          file: fileLabel,
          line: index + 1,
          rule: rule.id,
          reason: rule.reason,
          matched: match[0],
          text: line.trim(),
        });
      }
    }
  });
  return hits;
}

/** ディレクトリを再帰的に走査し、テキストファイルの一覧を返す */
async function listFiles(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) {
      out.push(...(await listFiles(full)));
    } else if (/\.(md|json|ya?ml|txt)$/i.test(name)) {
      out.push(full);
    }
  }
  return out.sort();
}

/** ディレクトリ全体を検査する */
export async function scanDirectory(dir, rules) {
  const hits = [];
  for (const file of await listFiles(dir)) {
    const text = await readFile(file, 'utf8');
    hits.push(...scanText(text, rules, path.relative(process.cwd(), file)));
  }
  return hits;
}

/** CLI として実行されたときだけ動く */
async function main() {
  const target = process.argv[2] ?? path.join(here, '..', 'public-profile');
  const rules = await loadRules();
  const hits = await scanDirectory(target, rules);
  if (hits.length === 0) {
    console.log(`public-profile の禁止語スキャン: 問題なし（${target}）`);
    return;
  }
  console.error(
    `public-profile の禁止語スキャン: ${hits.length} 件ヒット。書き直してください（許可リストはありません）`,
  );
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  [${h.rule}] ${h.reason}`);
    console.error(`      一致: "${h.matched}"  行: ${h.text}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
