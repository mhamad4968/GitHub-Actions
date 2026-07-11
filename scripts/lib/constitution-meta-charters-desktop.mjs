/**
 * META 憲法チャーター（26/27/28）→ Desktop read-pack 31–33 同期定義
 * @see docs/plans/2026-07-11-constitution-round3-master-spec.md R3-6
 *
 * Desktop 番号 26–28 は夕反省・683中継・ジャンル早見で使用中のため、
 * チャーター全文控えは **31–33** に配置（憲法ファイル番号はファイル名に保持）。
 */
export const META_CHARTER_DESKTOP_SYNC = [
  {
    desktop: '31-META-26-formalization-lifecycle-charter.txt',
    src: 'docs/constitution/26-formalization-lifecycle-charter.md',
    needle: '形骸化ライフサイクル',
  },
  {
    desktop: '32-META-27-constitution-navigation-charter.txt',
    src: 'docs/constitution/27-constitution-navigation-charter.md',
    needle: '4 層モデル',
  },
  {
    desktop: '33-META-28-ceo-go-phases-charter.txt',
    src: 'docs/constitution/28-ceo-go-phases-charter.md',
    needle: 'G0',
  },
];

export const META_CHARTER_DESKTOP_MAX_PREFIX = 36;
