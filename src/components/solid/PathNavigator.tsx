// src/components/PathNavigator.tsx
import { For, Show, createEffect, onCleanup, onMount, createSignal as createSolidSignal, createMemo } from 'solid-js';
import { pathSignal as globalCustomPathSignal, normalizePath, ROOT_PATH } from '../../globalSignals';

export interface PathNavigatorProps {
  basePath?: string;
}

const PathNavigator = (props: PathNavigatorProps) => {
  // Memoizar el basePath normalizado para evitar cálculos redundantes
  const effectiveBasePath = createMemo(() => normalizePath(props.basePath ?? ROOT_PATH));
  
  // Función que se ejecuta una vez al inicio para determinar el path inicial
  const getInitialNormalizedPath = () => {
    const globalPath = normalizePath(globalCustomPathSignal.value);
    const basePath = effectiveBasePath();

    // Determinar el path inicial basado en el path global y el base path
    const initialPathToUse = !globalPath.startsWith(basePath) || globalPath.length < basePath.length 
      ? basePath 
      : globalPath;

    // Actualizar el path global solo si es necesario, evitando actualizaciones redundantes
    if (globalCustomPathSignal.value !== initialPathToUse) {
      globalCustomPathSignal.value = initialPathToUse;
    }
    
    return initialPathToUse;
  };

  const [currentPath, setCurrentPath] = createSolidSignal<string>(getInitialNormalizedPath());

  // Los segmentos de path se calculan solo cuando cambia currentPath o effectiveBasePath
  const pathSegments = createMemo(() => {
    const path = currentPath(); // Ya está normalizado
    const basePath = effectiveBasePath(); // Ya está normalizado
    const segments: { name: string; path: string }[] = [];

    // Calcular el nombre del segmento base - solo una vez
    let baseSegmentName = 'Raíz';
    if (basePath !== ROOT_PATH) {
      const baseParts = basePath.split('/').filter(p => p.length > 0);
      baseSegmentName = baseParts.length > 0 ? baseParts[baseParts.length - 1] : 'Base';
    }
    segments.push({ name: baseSegmentName, path: basePath });

    // Si estamos en la raíz, evitar cálculos adicionales
    if (path === basePath) {
      return segments;
    }
    
    // Calcular el path relativo una sola vez
    let relativePathString = '';
    if (path.startsWith(basePath) && path.length > basePath.length) {
      relativePathString = path.substring(basePath === ROOT_PATH ? basePath.length : basePath.length + 1);
    }
    
    const relativeParts = relativePathString.split('/').filter(p => p.length > 0);
    
    // Optimización: Pre-calcular todos los segmentos de una vez para reducir llamadas a normalizePath
    if (relativeParts.length > 0) {
      let currentSegmentPathAccumulator = basePath;
      
      for (const part of relativeParts) {
        // Construir el path acumulado directamente sin llamar a normalizePath en cada iteración
        currentSegmentPathAccumulator = currentSegmentPathAccumulator === ROOT_PATH
          ? `${ROOT_PATH}${part}`
          : `${currentSegmentPathAccumulator}/${part}`;
        
        // Solo normalizar una vez al final si es necesario
        if (currentSegmentPathAccumulator !== ROOT_PATH && 
            (currentSegmentPathAccumulator.includes('//') || 
             currentSegmentPathAccumulator.includes('\\'))) {
          currentSegmentPathAccumulator = normalizePath(currentSegmentPathAccumulator);
        }
        
        segments.push({ name: part, path: currentSegmentPathAccumulator });
      }
    }
    
    return segments;
  });

  // Optimización: Combinar las lógicas de efectos y manejo de caminos para reducir cálculos redundantes
  onMount(() => {
    const unsubscribe = globalCustomPathSignal.subscribe((newGlobalValue: string) => {
      const normalizedNewGlobalValue = normalizePath(newGlobalValue);
      const basePath = effectiveBasePath();
      
      // Corregir path global solo si es necesario
      if (newGlobalValue !== normalizedNewGlobalValue && globalCustomPathSignal.value === newGlobalValue) {
        globalCustomPathSignal.value = normalizedNewGlobalValue;
        return; // La nueva ejecución del subscriber se encargará del resto
      }
      
      // Determinar el nuevo path a utilizar
      const pathForSolidSignal = normalizedNewGlobalValue.startsWith(basePath) && 
                                normalizedNewGlobalValue.length >= basePath.length
        ? normalizedNewGlobalValue
        : basePath;
      
      // Corregir el path global si es necesario
      if (pathForSolidSignal !== normalizedNewGlobalValue && globalCustomPathSignal.value !== pathForSolidSignal) {
        globalCustomPathSignal.value = pathForSolidSignal;
      }

      // Actualizar el path local solo si ha cambiado
      if (currentPath() !== pathForSolidSignal) {
        setCurrentPath(pathForSolidSignal);
      }
    });
    
    // Limpiar suscripción al desmontar
    onCleanup(unsubscribe);
  });

  // Efecto para mantener sincronizados basePath y currentPath
  createEffect(() => {
    const basePath = effectiveBasePath();
    const current = currentPath();
    
    if (!current.startsWith(basePath) || current.length < basePath.length) {
      // Actualizar globalCustomPathSignal solo si es necesario para evitar ciclos
      if (globalCustomPathSignal.value !== basePath) {
        globalCustomPathSignal.value = basePath;
      }
    }
  });

  // Navegación optimizada: subir un nivel
  const goUp = () => {
    const path = currentPath();
    const basePath = effectiveBasePath();

    if (path === basePath) return;

    // Calcular nuevo path de manera eficiente
    const parts = path.split('/').filter(p => p.length > 0);
    parts.pop();
    
    // Construir el nuevo path directamente sin llamadas innecesarias
    let newPath = parts.length === 0 ? ROOT_PATH : `${ROOT_PATH}${parts.join('/')}`;
    
    // Solo normalizar si es realmente necesario
    if (newPath !== ROOT_PATH && (newPath.includes('//') || newPath.endsWith('/'))) {
      newPath = normalizePath(newPath);
    }

    // Verificar límites de basePath
    const finalPath = !newPath.startsWith(basePath) || newPath.length < basePath.length
      ? basePath
      : newPath;
      
    // Actualizar solo si hay un cambio real
    if (globalCustomPathSignal.value !== finalPath) {
      globalCustomPathSignal.value = finalPath;
    }
  };

  // Navegación optimizada: ir a un path específico
  const navigateToPath = (newPathFromClick: string) => {
    // Solo normalizar si es necesario (si no viene de pathSegments que ya está normalizado)
    const normalizedNewPath = pathSegments().some(s => s.path === newPathFromClick)
      ? newPathFromClick
      : normalizePath(newPathFromClick);
      
    const basePath = effectiveBasePath();

    // Determinar path final
    const finalPath = normalizedNewPath.startsWith(basePath) && normalizedNewPath.length >= basePath.length
      ? normalizedNewPath
      : basePath;

    // Actualizar solo si hay un cambio real
    if (globalCustomPathSignal.value !== finalPath) {
      globalCustomPathSignal.value = finalPath;
    }
  };

  return (
    <div class="path-navigator">
      <div class="breadcrumb-bar">
        <For each={pathSegments()}>
          {(segment, index) => (
            <>
              <span
                class="breadcrumb-segment"
                classList={{ 
                  'is-link': segment.path !== currentPath(),
                }}
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
        <Show when={currentPath() !== effectiveBasePath()}>
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
          flex-wrap: wrap;
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
        }W
      `}</style>
    </div>
  );
};
export default PathNavigator;