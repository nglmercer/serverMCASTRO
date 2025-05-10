// src/components/PathNavigator.tsx
import { For, Show, createEffect, onCleanup, onMount, createSignal as createSolidSignal } from 'solid-js';
import { pathSignal as globalCustomPathSignal } from '../../globalSignals'; // Renombrado para claridad

// Componente de Navegación de Path
const PathNavigator = () => {
  // 1. Crear un signal de SolidJS para el path actual.
  // Se inicializa con el valor actual de tu signal customizado.
  const [currentPath, setCurrentPath] = createSolidSignal(globalCustomPathSignal.value);

  // 2. Suscribirse a los cambios de tu signal global customizado
  // y actualizar el signal de SolidJS cuando cambie.
  onMount(() => {
    const unsubscribeFromCustomSignal = globalCustomPathSignal.subscribe((newValue: string) => {
      console.log('[PathNavigator] Custom global signal changed. Updating Solid signal to:', newValue);
      setCurrentPath(newValue); // <-- Actualiza el signal de Solid
    });

    // Opcional: tu suscripción existente para depuración
    let unsubscribeWindowSignal: (() => void) | null = null;
    try {
      unsubscribeWindowSignal = window.$signals.subscribe<string>('path', (value: string, oldValue: string) => {
        console.log(`[PathNavigator - window.$signals] path cambió de "${oldValue}" a "${value}"`);
      });
    } catch (error) {
      console.error("[PathNavigator] Error al suscribirse a window.$signals.path:", error);
    }

    onCleanup(() => {
      unsubscribeFromCustomSignal();
      if (unsubscribeWindowSignal) unsubscribeWindowSignal();
    });
  });

  const goUp = () => {
    const path = currentPath(); // Leer del signal de Solid
    if (path === '/') return;

    const parts = path.split('/').filter((p: any) => p.length > 0);
    parts.pop();
    const newPath = `/${parts.join('/')}`;
    
    // Actualizar AMBOS: el signal custom global y el de Solid.
    // O, mejor aún, solo el custom, y dejar que la suscripción actualice el de Solid.
    globalCustomPathSignal.value = newPath;
    // setCurrentPath(newPath); // Esto es redundante si la suscripción de arriba funciona bien
  };

  // Derivar los segmentos del path para los breadcrumbs
  const pathSegments = () => {
    const path = currentPath(); // Leer del signal de Solid
    if (path === '/') return [{ name: 'Raíz', path: '/' }];

    const parts = path.split('/').filter((p: any) => p.length > 0);
    const segments = [{ name: 'Raíz', path: '/' }];
    let currentSegmentPath = '';
    for (const part of parts) {
      currentSegmentPath += `/${part}`;
      segments.push({ name: part, path: currentSegmentPath });
    }
    return segments;
  };

  const navigateToPath = (newPath: string) => {
    // Actualizar AMBOS: el signal custom global y el de Solid.
    // O, mejor aún, solo el custom, y dejar que la suscripción actualice el de Solid.
    globalCustomPathSignal.value = newPath;
    // setCurrentPath(newPath); // Redundante si la suscripción funciona
  };

  // Loggear cambios del signal de Solid para depuración
  createEffect(() => {
    console.log('PathNavigator: Ruta actual (desde Solid Effect y signal de Solid):', currentPath());
  });

  return (
    <div class="path-navigator">
      <div class="breadcrumb-bar">
        <For each={pathSegments()}>
          {(segment, index) => (
            <>
              <span
                class="breadcrumb-segment"
                classList={{ 'is-link': segment.path !== currentPath() }} // Usar signal de Solid
                onClick={() => segment.path !== currentPath() && navigateToPath(segment.path)}
              >
                {segment.name}
              </span>
              <Show when={index() < pathSegments().length - 1}>
                <span class="breadcrumb-separator"> / </span>
              </Show>
            </>
          )}
        </For>
      </div>
      
      <div class="controls">
        <Show when={currentPath() !== '/'}> {/* Usar signal de Solid */}
          <button onClick={goUp} class="up-button">
            Subir Nivel (..)
          </button>
        </Show>
      </div>
      <style>{`
        .path-navigator {
          font-family: sans-serif;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .breadcrumb-bar {
          display: flex;
          align-items: center;
          flex-wrap: wrap; /* Para paths largos */
        }
        .breadcrumb-segment {
          padding: 4px 6px;
          border-radius: 3px;
        }
        .breadcrumb-segment.is-link {
          color: #007bff;
          cursor: pointer;
          text-decoration: none;
        }
        .breadcrumb-segment.is-link:hover {
          background-color: #e9ecef;
          text-decoration: underline;
        }
        .breadcrumb-separator {
          margin: 0 4px;
          color: #6c757d;
        }
        .controls .up-button {
          padding: 6px 10px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.9em;
        }
        .controls .up-button:hover {
          background-color: #5a6268;
        }
      `}</style>
    </div>
  );
};

export default PathNavigator;