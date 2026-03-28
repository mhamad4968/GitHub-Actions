/**
 * 雛形用の最小型。本番は dts-gen でアプリ固有の型を生成して置き換えると安全
 */
type KintoneIndexShowEvent = {
  type: string;
};

interface KintoneNamespace {
  events: {
    on: (
      events: string | string[],
      handler: (ev: KintoneIndexShowEvent) => KintoneIndexShowEvent | Promise<KintoneIndexShowEvent>,
    ) => void;
  };
  app: {
    getId: () => number | string;
    getHeaderMenuSpaceElement: () => HTMLElement | null;
  };
}

declare const kintone: KintoneNamespace;
