// src/components/PathNavigator.tsx
import { For, Show, createEffect, onCleanup, onMount, createSignal as createSolidSignal, createMemo } from 'solid-js';
import { pathSignal as globalCustomPathSignal, normalizePath, ROOT_PATH } from '../../globalSignals';

export interface PathNavigatorProps {
  basePath?: string; // Vendrá de window.selectedServer o será ""
}

// Define un nombre de servidor por defecto si window.selectedServer está vacío
// y no quieres que la base sea ROOT_PATH ('/').
// Cámbialo según tus necesidades. Si quieres permitir '/' como base si selectedServer está vacío,
// entonces la lógica original de effectiveBasePath era más adecuada.
const DEFAULT_SERVER_NAME_IF_EMPTY = (typeof window !== "undefined" ? window.selectedServer : "") || "/"; // Por ejemplo

const PathNavigator = (props: PathNavigatorProps) => {
  const effectiveBasePath = createMemo(() => {
    let pathFromServer = props.basePath;

    // Si props.basePath está vacío (ej: window.selectedServer no estaba definido o era ""),
    // y queremos asegurar que la base NUNCA sea ROOT_PATH ('/'),
    // entonces usamos un nombre de servidor por defecto.
    if (!pathFromServer || pathFromServer === ROOT_PATH) {
      // console.warn(`PathNavigator: basePath was empty or root. Using default: ${DEFAULT_SERVER_NAME_IF_EMPTY}`);
      pathFromServer = DEFAULT_SERVER_NAME_IF_EMPTY;
    }
    
    // normalizePath debe asegurar que "serverName" se convierta en "/serverName"
    // y "/serverName/" se convierta en "/serverName".
    // También, si pathFromServer ya es "/serverName", debe mantenerse así.
    const normalized = normalizePath(pathFromServer);

    // Doble chequeo: si normalizePath("") devuelve ROOT_PATH y pathFromServer era "",
    // y no queremos ROOT_PATH, forzamos el default de nuevo.
    // Esto es más robusto si normalizePath tiene un comportamiento peculiar con ""
    if (normalized === ROOT_PATH && pathFromServer !== ROOT_PATH) { // pathFromServer sería DEFAULT_SERVER_NAME_IF_EMPTY
        // Esto puede pasar si DEFAULT_SERVER_NAME_IF_EMPTY es "" y normalizePath("") es ROOT_PATH
        // En ese caso, normalizePath(DEFAULT_SERVER_NAME_IF_EMPTY) podría haber devuelto ROOT_PATH.
        // Si DEFAULT_SERVER_NAME_IF_EMPTY es algo como "miServidor", normalizePath("miServidor") debería ser "/miServidor"
        // y no ROOT_PATH. Esta condición es una salvaguarda.
        const reNormalizedDefault = normalizePath(DEFAULT_SERVER_NAME_IF_EMPTY);
        if (reNormalizedDefault === ROOT_PATH && reNormalizedDefault !== ROOT_PATH) {
            // Esto indicaría un problema con normalizePath o DEFAULT_SERVER_NAME_IF_EMPTY
            console.error("Critical: DEFAULT_SERVER_NAME_IF_EMPTY results in ROOT_PATH. Check configuration.");
            // Podrías lanzar un error o retornar un valor seguro hardcodeado que no sea ROOT_PATH.
            // Por ahora, asumimos que normalizePath(DEFAULT_SERVER_NAME_IF_EMPTY) produce algo como /default-server
            return reNormalizedDefault;
        }
        return reNormalizedDefault;
    }

    return normalized;
  });
  
  const getInitialNormalizedPath = () => {
    const globalPath = normalizePath(globalCustomPathSignal.value);
    const basePath = effectiveBasePath(); // Ya está normalizado y nunca es ROOT_PATH (según nueva lógica)

    const initialPathToUse = !globalPath.startsWith(basePath) || globalPath.length < basePath.length 
      ? basePath 
      : globalPath;

    if (globalCustomPathSignal.value !== initialPathToUse) {
      globalCustomPathSignal.value = initialPathToUse;
    }
    
    return initialPathToUse;
  };

  const [currentPath, setCurrentPath] = createSolidSignal<string>(getInitialNormalizedPath());

  const pathSegments = createMemo(() => {
    const path = currentPath(); 
    const basePath = effectiveBasePath();
    const segments: { name: string; path: string }[] = [];

    // El nombre del segmento base. Como basePath nunca es ROOT_PATH, siempre tendrá partes.
    const baseParts = basePath.split('/').filter(p => p.length > 0);
    // Si basePath es /server1, baseParts es ["server1"]. name = "server1".
    // Si basePath es /data/server1, baseParts es ["data", "server1"]. name = "server1".
    const baseSegmentName = baseParts.length > 0 ? baseParts[baseParts.length - 1] : 'Base'; // 'Base' como fallback improbable
    segments.push({ name: baseSegmentName, path: basePath });

    if (path === basePath) {
      return segments;
    }
    
    let relativePathString = '';
    // basePath nunca es ROOT_PATH, así que path.substring(basePath.length + 1) es seguro.
    if (path.startsWith(basePath) && path.length > basePath.length) {
      relativePathString = path.substring(basePath.length + 1);
    }
    
    const relativeParts = relativePathString.split('/').filter(p => p.length > 0);
    
    if (relativeParts.length > 0) {
      let currentSegmentPathAccumulator = basePath;
      for (const part of relativeParts) {
        currentSegmentPathAccumulator = `${currentSegmentPathAccumulator}/${part}`;
        // Normalizar solo si es estrictamente necesario (aunque las construcciones deberían ser limpias)
        if (currentSegmentPathAccumulator.includes('//') || currentSegmentPathAccumulator.includes('\\')) {
          currentSegmentPathAccumulator = normalizePath(currentSegmentPathAccumulator);
        }
        segments.push({ name: part, path: currentSegmentPathAccumulator });
      }
    }
    
    return segments;
  });

  onMount(() => {
    const unsubscribe = globalCustomPathSignal.subscribe((newGlobalValue: string) => {
      const normalizedNewGlobalValue = normalizePath(newGlobalValue);
      const basePath = effectiveBasePath();
      
      if (newGlobalValue !== normalizedNewGlobalValue && globalCustomPathSignal.value === newGlobalValue) {
        globalCustomPathSignal.value = normalizedNewGlobalValue;
        return; 
      }
      
      const pathForSolidSignal = normalizedNewGlobalValue.startsWith(basePath) && 
                                normalizedNewGlobalValue.length >= basePath.length
        ? normalizedNewGlobalValue
        : basePath; // Si está fuera de los límites del basePath, se ajusta al basePath
      
      if (pathForSolidSignal !== normalizedNewGlobalValue && globalCustomPathSignal.value !== pathForSolidSignal) {
        globalCustomPathSignal.value = pathForSolidSignal;
      }

      if (currentPath() !== pathForSolidSignal) {
        setCurrentPath(pathForSolidSignal);
      }
    });
    
    onCleanup(unsubscribe);
  });

  createEffect(() => {
    const basePath = effectiveBasePath();
    const current = currentPath();
    
    // Si currentPath es más corto que basePath o no comienza con él,
    // (ej. si basePath cambió dinámicamente), reajusta.
    if (!current.startsWith(basePath) || current.length < basePath.length) {
      if (globalCustomPathSignal.value !== basePath) {
        globalCustomPathSignal.value = basePath;
      }
      // currentPath() se actualizará a través del subscriber de onMount
    }
  });

  const goUp = () => {
    const path = currentPath();
    const basePath = effectiveBasePath();

    if (path === basePath) return; // Ya está en el nivel más alto permitido por este componente

    const parts = path.split('/').filter(p => p.length > 0);
    parts.pop();
    
    // Construir el nuevo path. Como basePath nunca es ROOT_PATH, parts no debería quedar vacío
    // a menos que estemos en el basePath. El caso path === basePath ya se maneja.
    // Si path es "/server/folder", parts es ["server", "folder"], pop, parts es ["server"]. newPath es "/server".
    let newPath = `${ROOT_PATH}${parts.join('/')}`; // Siempre empieza con ROOT_PATH
    
    // normalizePath es importante aquí si parts.join('/') pudiera ser vacío, pero
    // debido a la guarda path === basePath y que basePath no es ROOT_PATH,
    // parts después de pop() no debería llevar a newPath siendo solo ROOT_PATH
    // a menos que el resultado sea el propio basePath.
    newPath = normalizePath(newPath); // Asegurar la forma canónica

    // Verificación final: el newPath no puede ser más superficial que basePath.
    // Esta condición es redundante si la lógica anterior es correcta, pero es una buena salvaguarda.
    const finalPath = !newPath.startsWith(basePath) || newPath.length < basePath.length
      ? basePath
      : newPath;
      
    if (globalCustomPathSignal.value !== finalPath) {
      globalCustomPathSignal.value = finalPath;
    }
  };

  const navigateToPath = (newPathFromClick: string) => {
    // No es necesario normalizar newPathFromClick si viene de pathSegments(), ya que esos están normalizados.
    // Pero si es un path arbitrario, se debe normalizar.
    // Para simplificar y por seguridad, normalizamos siempre (createMemo cacheará si es el mismo input).
    const normalizedNewPath = normalizePath(newPathFromClick);
    const basePath = effectiveBasePath();

    const finalPath = normalizedNewPath.startsWith(basePath) && normalizedNewPath.length >= basePath.length
      ? normalizedNewPath
      : basePath; // Si el path clickeado está fuera, ir al basePath

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

