// globalSignals.ts
export {};
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
    };
    interface Window {
      selecttab: {
        index: number;
        item: HTMLElement;
        tabs: string[];
      };
    }
    interface Window {
      selectedServer: string;
    }
  }
// Implementación minimalista de signals
