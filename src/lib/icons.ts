// トップで使う線のアイコン（ロゴではない汎用の形）。色は持たず、描くときに文字色（currentColor）で塗る。
// 使う場所は About の外部リンクと Skills の区分見出し（SPEC.md §4。2026-10-03 ユーザーが見本から選択）と、
// 左の目次の下の GitHub・Qiita（2026-10-06 ユーザーが見本 B を選択）だけ。
// 形は見本（docs/design-candidates/2026-10-03-top-sections/）の B・C から引いた。どれも 24×24 の枠に描く

/** アイコンの名前と、その形（SVG の path の d 属性の並び） */
export const ICONS = {
  /** コード（GitHub・Skills の学習中以外の区分） */
  code: ['M8 5l-5 7 5 7', 'M16 5l5 7-5 7', 'M14 4l-4 16'],
  /** ペン（Qiita） */
  pen: ['M4 20h16', 'M4 16l10.5-10.5a2.1 2.1 0 0 1 3 3L7 19l-4 1z'],
  /** 開いた本（Reading Log） */
  book: [
    'M12 6.5c-1.5-1.5-4-2-8-2v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z',
    'M12 6.5v13',
  ],
  /** 芽（Skills の学習中） */
  sprout: [
    'M12 21v-9',
    'M12 12C12 8 9.5 5.5 5 5.5 5 9.5 7.5 12 12 12z',
    'M12 14.5c0-3.2 2-5.5 6.5-5.5 0 3.6-2.2 5.5-6.5 5.5z',
  ],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;

/** frontmatter の型定義（z.enum）に渡す名前の一覧 */
export const ICON_NAMES = Object.keys(ICONS) as [IconName, ...IconName[]];
