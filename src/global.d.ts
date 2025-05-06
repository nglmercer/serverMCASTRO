export {};

declare global {
  interface Window {
    selecttab: {
      index: number;
      item: HTMLElement;
      tabs: string[];
    };
  }
}