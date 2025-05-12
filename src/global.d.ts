// globalSignals.ts
export {};
export interface Editortype {
  editorId: string; 
  initialLanguage?: string;
  initialContentProp?: string;
  instanceNameProp?: string;
  componentId?: string;
  initialContent?: string;
  IDS?: string[];
}
declare global {
  interface Window {
    $signals: {
      store: Map<string, Signal<any>>;
      create: <T>(name: string, initialValue: T) => Signal<T>;
      get: <T>(name: string) => Signal<T> | undefined;
      computed: <T>(name: string, computeFn: () => T) => Signal<T>;
      batch: (fn: () => void) => void;
      subscribe: <T>(name: string, callback: (value: T, oldValue: T) => void) => () => void;
      set: <T>(name: string, value: T) => void;
    };
    selecttab: {
      index: number;
      item: HTMLElement;
      tabs: string[];
    };
    selectedServer: string;
    serverStatus: string;
    EditorConfig:Editortype;
  }
}
