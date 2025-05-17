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
declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      'server-item': HTMLAttributes<HTMLElement> & { // O una interfaz más específica si es un custom element derivado de otra cosa
        // Define aquí las propiedades/atributos que tu custom element acepta
        // TypeScript las usará para el type checking de los atributos que pasas.
        // Los nombres de los atributos deben ser como los usarías en HTML (kebab-case).
        // El tipo puede ser string, number, boolean, o un tipo más específico.
        // Si la propiedad en Lit es 'myProp', el atributo es 'my-prop'.
        id?: string; // id es un atributo global, pero bueno tenerlo
        icon?: string;
        title?: string;
        size?: number | string; // Puede ser un número o una cadena que se convierte a número
        version?: string;
        modified?: string; // Atributo kebab-case
        server?: string;
        status?: string;
        // Si tienes eventos personalizados que dispara el web component:
        // onMiCustomEvento?: (event: CustomEvent<MiTipoDeDetalle>) => void;

        // Si el componente Lit tiene propiedades que no son solo strings/numbers/booleans:
        // miObjetoProp?: MiTipoDeObjeto; // Esto es más complejo con custom elements puros, usualmente se pasan como JSON stringificado
      };
    }
  }
}