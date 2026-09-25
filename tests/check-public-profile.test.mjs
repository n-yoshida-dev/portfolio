// 禁止語スキャンの回帰テスト。
// 「漏れてはいけない例が必ず引っかかる」「普通のプロフィール文は引っかからない」の両方を固定する。
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRules, scanText, scanDirectory } from '../scripts/check-public-profile.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('禁止語スキャン', () => {
  it('漏れてはいけない情報はすべて検出する', async () => {
    const rules = await loadRules();
    const cases = [
      ['金額', '年収は 650 万円です'],
      ['年収', '年収600万を希望'],
      ['資産', '住宅ローンを検討中'],
      ['家族', '妻と娘がいます'],
      ['育休', '2026 年に育休から復職'],
      ['住所', '神奈川県横浜市に住んでいます'],
      ['年齢', '現在 34歳'],
      ['転職活動', '3 社に応募し、面接が進行中'],
      ['企業名', '株式会社サンプルに勤務'],
      ['役職', '主任に昇格した'],
      ['健康', '通院しながら働いている'],
      ['メール', '連絡先は someone@example.com'],
      ['電話', '電話は 090-1234-5678'],
      ['API キー', 'token: ghp_abcdefghijklmnopqrstuvwxyz1234'],
      ['ローカルパス', '/home/someone/workspace/apps にある'],
      ['カード番号', 'カード 1234-5678-9012-3456'],
    ];
    for (const [label, text] of cases) {
      const hits = scanText(text, rules);
      expect(hits.length, `${label} が検出されなかった: ${text}`).toBeGreaterThan(0);
    }
  });

  it('普通のプロフィール文は検出しない', async () => {
    const rules = await loadRules();
    const ok = [
      '業務システムの現場で身につけた仕様化の力',
      '家族構成とライフイベントから世帯年収がいくら必要かを逆算するアプリ',
      'バックエンド（Go / Java）を軸に、自社プロダクトの開発に携わることを目指しています',
      'ADR を 36 本公開しています。2026-03 に開始',
      'AI エージェントに実装を任せ、自分はレビューを担当',
      '機密の数字（口座・カードなど）はフックが機械的にブロック',
      'HTTP 422 を返す。tenant_id で分離する',
      '医療上の診断や安全性を保証するものではない',
    ];
    for (const text of ok) {
      const hits = scanText(text, rules);
      expect(hits, `誤検知: ${text} → ${JSON.stringify(hits)}`).toEqual([]);
    }
  });

  it('実際の public-profile/ が禁止語を含まない', async () => {
    const rules = await loadRules();
    const hits = await scanDirectory(path.join(root, 'public-profile'), rules);
    expect(hits).toEqual([]);
  });
});
