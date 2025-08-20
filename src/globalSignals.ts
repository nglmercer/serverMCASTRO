class Signal<T> {
    private _value: T;
    private _subscribers: Set<(value: T, oldValue: T) => void> = new Set();
    private _computedDependencies?: Set<Signal<any>>;
    private _computeFn?: () => T;
  
    constructor(initialValue: T, computeFn?: () => T) {
      this._value = initialValue;
      this._computeFn = computeFn;
      
      if (computeFn) {
        this._computedDependencies = new Set();
        this._trackDependencies();
      }
    }
  
    get value(): T {
      SignalTracker.trackSignal(this);
      return this._value;
    }
  
    set value(newValue: T) {
      if (this._computeFn) {
        throw new Error("Cannot set value of a computed signal");
      }
      
      if (this._value !== newValue) {
        const oldValue = this._value;
        this._value = newValue;
        this._notify(newValue, oldValue);
      }
    }
  
    subscribe(callback: (value: T, oldValue: T) => void): () => void {
      this._subscribers.add(callback);
      
      // Llamar inmediatamente al callback con el valor actual
      callback(this._value, this._value);
      
      // Devolver función para desuscribirse
      return () => {
        this._subscribers.delete(callback);
      };
    }
  
    private _notify(value: T, oldValue: T): void {
      for (const subscriber of this._subscribers) {
        subscriber(value, oldValue);
      }
    }
  
    private _trackDependencies(): void {
      if (!this._computeFn || !this._computedDependencies) return;
      
      // Configurar el rastreador para recopilar dependencias
      SignalTracker.startTracking();
      
      try {
        // Calcular el valor, lo que registrará las dependencias
        this._value = this._computeFn();
      } finally {
        // Obtener las dependencias y detener el rastreo
        const dependencies = SignalTracker.stopTracking();
        
        // Suscribirse a todas las dependencias
        for (const dependency of dependencies) {
          dependency._subscribers.add(() => this._recompute());
          this._computedDependencies.add(dependency);
        }
      }
    }
  
    private _recompute(): void {
      if (!this._computeFn) return;
      
      const oldValue = this._value;
      this._value = this._computeFn();
      
      if (oldValue !== this._value) {
        this._notify(this._value, oldValue);
      }
    }
  }
  
  // Utilidad para rastrear dependencias de señales computadas
  class SignalTracker {
    private static _tracking = false;
    private static _dependencies = new Set<Signal<any>>();
  
    static trackSignal<T>(signal: Signal<T>): void {
      if (this._tracking) {
        this._dependencies.add(signal);
      }
    }
  
    static startTracking(): void {
      this._tracking = true;
      this._dependencies.clear();
    }
  
    static stopTracking(): Set<Signal<any>> {
      this._tracking = false;
      const deps = new Set(this._dependencies);
      this._dependencies.clear();
      return deps;
    }
  }
  
  // Funciones de API
  function createSignal<T>(initialValue: T): Signal<T> {
    return new Signal<T>(initialValue);
  }
  
  function computed<T>(computeFn: () => T): Signal<T> {
    return new Signal<T>(computeFn(), computeFn);
  }
  
  function batch(fn: () => void): void {
    // Una implementación simple de batch podría añadirse aquí
    fn();
  }
  // Inicializar la API global
var signals = window.$signals = {
    store: new Map(),
    
    create<T>(name: string, initialValue: T): Signal<T> {
      const signal = createSignal<T>(initialValue);
      this.store.set(name, signal);
      return signal;
    },
    
    get<T>(name: string): Signal<T> | undefined {
      return this.store.get(name) as Signal<T> | undefined;
    },
    
    computed<T>(name: string, computeFn: () => T): Signal<T> {
      const signal = computed<T>(computeFn);
      this.store.set(name, signal);
      return signal;
    },
    
    batch(fn: () => void): void {
      batch(fn);
    },
    
    subscribe<T>(name: string, callback: (value: T, oldValue: T) => void): () => void {
      const signal = this.store.get(name) as Signal<T>;
      if (!signal) {
        throw new Error(`Signal "${name}" not found`);
      }
      return signal.subscribe(callback);
    },
    
    set<T>(name: string, value: T): void {
      const signal = this.store.get(name) as Signal<T>;
      if (!signal) {
        throw new Error(`Signal "${name}" not found`);
      }
      signal.value = value;
    }
  };
  const ROOT_PATH = '/';
  const normalizedPathCache = new Map<string, string>();
  const normalizePath = (path: string | undefined | null): string => {
    if (!path) return ROOT_PATH;
    const selectedServer = window.selectedServer;
    
    // Comprobar si ya tenemos este path en caché
    if (normalizedPathCache.has(path)) {
      return normalizedPathCache.get(path)!;
    }
  
    // 1. Reemplazar todos los backslashes (\) con forward slashes (/)
    let normalized = path.replace(/\\/g, '/');
  
    // 2. Eliminar barras duplicadas (ej: // -> /)
    normalized = normalized.replace(/\/{2,}/g, '/');
    
    // 3. Eliminar duplicaciones del nombre del servidor si existe
    if (selectedServer && selectedServer.trim() !== '') {
      const serverName = selectedServer.trim();
      
      // Dividir la ruta en segmentos para analizar duplicaciones
      const segments = normalized.split('/').filter(segment => segment !== '');
      
      // Eliminar segmentos duplicados consecutivos del servidor
      const cleanedSegments: string[] = [];
      let lastSegment = '';
      
      for (const segment of segments) {
        // Si el segmento actual es diferente al anterior, o no es el nombre del servidor, lo añadimos
        if (segment !== lastSegment || segment !== serverName) {
          cleanedSegments.push(segment);
        }
        lastSegment = segment;
      }
      
      // Reconstruir la ruta
      normalized = cleanedSegments.length > 0 ? '/' + cleanedSegments.join('/') : ROOT_PATH;
    }
  
    // 4. Asegurar que comience con una barra, a menos que sea solo la raíz
    if (normalized !== ROOT_PATH && !normalized.startsWith(ROOT_PATH)) {
      normalized = ROOT_PATH + normalized;
    }
  
    // 5. Eliminar la barra final si no es la raíz
    if (normalized !== ROOT_PATH && normalized.endsWith('/') && normalized.length > 1) {
      normalized = normalized.slice(0, -1);
    }
    
    // 6. Si después de todo esto queda vacío (ej. input era solo "//"), devolver ROOT_PATH
    if (normalized === '' && path && path.length > 0) {
      normalized = ROOT_PATH;
    }
  
    // Guardar en caché el resultado para futuros usos
    normalizedPathCache.set(path, normalized || ROOT_PATH);
    return normalized || ROOT_PATH;
  };
const tabsSignal = window.$signals.create('tabs', {});
const pathSignal = window.$signals.create('path', '/');
export {
  tabsSignal,
  pathSignal,
  signals,
  Signal,
  normalizePath,
  ROOT_PATH,
  normalizedPathCache
}
