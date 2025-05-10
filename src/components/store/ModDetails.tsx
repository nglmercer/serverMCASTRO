import { createSignal, createEffect, For, Show, createMemo } from 'solid-js';
import { getModDetails } from './api.ts'; // Asegúrate que esta API puede devolver `null`
import type { Mod, ModVersion } from './index.ts';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './ModDetails.css';

interface ModDetailsProps {
  mod: Mod | null; // Hacer la prop explícitamente nulable si el padre puede pasar null
  onBack: () => void;
  onDownload: (version: ModVersion) => void;
}

const ModDetails = (props: ModDetailsProps) => {
  // El signal interno puede ser Mod o null
  const [mod, setMod] = createSignal<Mod | null>(props.mod);
  const [versionFilter, setVersionFilter] = createSignal('');
  const [loaderFilter, setLoaderFilter] = createSignal('');
  
  // Estado de carga: true si estamos esperando datos de la API
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Efecto para cargar detalles del mod cuando props.mod cambia o es un mod de API
  createEffect(async () => {
    const currentPropMod = props.mod; // Capturar el valor actual de la prop

    if (!currentPropMod) {
      setMod(null);
      setLoading(false);
      setError("No mod data provided."); // Opcional: manejar como un estado de error
      return;
    }

    setError(null); // Resetear error previo

    if (currentPropMod.isCustom) {
      setMod(currentPropMod);
      setLoading(false);
    } else if (currentPropMod.slug) {
      setLoading(true);
      try {
        const details = await getModDetails(currentPropMod.slug); // getModDetails debe poder devolver null
        if (details) {
          setMod(details);
        } else {
          setMod(null);
          setError(`Failed to load details for mod: ${currentPropMod.title || currentPropMod.slug}`);
        }
      } catch (err) {
        console.error('Error fetching mod details:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setMod(null); // Asegurarse de que mod sea null en caso de error
      } finally {
        setLoading(false);
      }
    } else {
      // Si no es custom y no tiene slug, es un estado inesperado o ya viene con todos los datos
      setMod(currentPropMod);
      setLoading(false);
    }
  });

      
  const currentMod = createMemo(() => mod()); // Para no llamar a mod() múltiples veces y mejorar legibilidad

  const renderedDescription = createMemo(() => {
    const m = currentMod();
    if (m?.description) {
      // Asegúrate de que marked.parse devuelve string
      const rawHtml = marked.parse(m.description, { gfm: true, breaks: true }) as string;
      return DOMPurify.sanitize(rawHtml);
    }
    return '';
  });

  const uniqueGameVersions = createMemo(() => {
    const m = currentMod();
    const versions = m?.versions || [];
    const allVersions = versions.flatMap(v => v.game_versions || []);
    return [...new Set(allVersions)].sort(); // Opcional: ordenar
  });

  const uniqueLoaders = createMemo(() => {
    const m = currentMod();
    const versions = m?.versions || [];
    const allLoaders = versions.flatMap(v => v.loaders || []);
    return [...new Set(allLoaders)].sort(); // Opcional: ordenar
  });

  const filteredVersions = createMemo(() => {
    const m = currentMod();
    const versions = m?.versions || [];
    const currentVersionFilter = versionFilter();
    const currentLoaderFilter = loaderFilter();

    return versions.filter(v => {
      const gameVersionMatch = !currentVersionFilter || (v.game_versions || []).includes(currentVersionFilter);
      const loaderMatch = !currentLoaderFilter || (v.loaders || []).includes(currentLoaderFilter);
      return gameVersionMatch && loaderMatch;
    });
  });


  const handleVersionFilterChange = (e: Event & { currentTarget: HTMLSelectElement }) => {
    setVersionFilter(e.currentTarget.value);
  };

  const handleLoaderFilterChange = (e: Event & { currentTarget: HTMLSelectElement }) => {
    setLoaderFilter(e.currentTarget.value);
  };

  const handleDownload = (version: ModVersion) => {
    props.onDownload(version);
  };

  return (
    <div class="mod-details">
      <div class="mod-details-header">
        <button class="back-button" onClick={props.onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>
      </div>

      <Show when={loading()}>
        <div class="loading-indicator">
          <div class="spinner"></div>
          <span>Loading mod details...</span>
        </div>
      </Show>

      <Show when={!loading() && error()}>
        <div class="error-message">
          <p>Error: {error()}</p>
          <p>Please try again or go back.</p>
        </div>
      </Show>

      <Show when={!loading() && !error() && currentMod()}>
        {(loadedMod) => ( // loadedMod es currentMod() pero garantizado no nulo aquí
          <div class="mod-details-content">
            <div class="mod-info">
              <div class="mod-text">
              <div class="mod-image">
              <img 
                  src={currentMod()?.icon_url || currentMod()?.image || 'https://via.placeholder.com/128?text=No+Image'} 
                  alt={currentMod()?.title || 'Mod image'} // Asumiendo que name no es parte de Mod, o usa loadedMod.name
                />
              </div>
                <h1>{currentMod()?.title || loadedMod.name}</h1>
                {/* Renderizar descripción como HTML sanitizado */}
                <div class="mod-description" innerHTML={renderedDescription()}></div>
                <div class="mod-type">
                  <span class="mod-badge">{currentMod()?.project_type || 'Mod'}</span>
                </div>
              </div>
            </div>

            <div class="versions-section">
              <h2>Available Versions</h2>
              
              <Show when={(currentMod()?.versions || []).length > 0}>
                <div class="filter-controls">
                  <div class="filter-select">
                    <label for="version-filter">Game Version:</label>
                    <select id="version-filter" value={versionFilter()} onChange={handleVersionFilterChange}>
                      <option value="">All Game Versions</option>
                      <For each={uniqueGameVersions()}>
                        {version => <option value={version}>{version}</option>}
                      </For>
                    </select>
                  </div>
                  
                  <div class="filter-select">
                    <label for="loader-filter">Mod Loader:</label>
                    <select id="loader-filter" value={loaderFilter()} onChange={handleLoaderFilterChange}>
                      <option value="">All Loaders</option>
                      <For each={uniqueLoaders()}>
                        {loader => <option value={loader}>{loader}</option>}
                      </For>
                    </select>
                  </div>
                </div>
              </Show>
              
              <div class="versions-list">
                <Show 
                  when={filteredVersions().length > 0} 
                  fallback={
                    <div class="no-versions">
                      <p>
                        {(currentMod()?.versions || []).length === 0 
                          ? "This mod has no versions listed." 
                          : "No versions match the selected filters."}
                      </p>
                    </div>
                  }
                >
                  <For each={filteredVersions()}>
                    {version => (
                      <div class="version-card">
                        <div class="version-info">
                          <div>
                            <span class="version-number">{version.name || version.version_number}</span>
                            <Show when={(version.game_versions || []).length > 0}>
                                <span class="game-versions">{(version.game_versions || []).join(', ')}</span>
                            </Show>
                          </div>
                          <button 
                            class="download-button"
                            onClick={() => handleDownload(version)}>
                            Download
                          </button>
                        </div>
                        <Show when={(version.loaders || []).length > 0}>
                            <div class="loaders-info">
                            Loaders: {(version.loaders || []).join(', ')}
                            </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </div>
        )}
      </Show>
      
      <Show when={!loading() && !error() && !currentMod()}>
         <div class="no-mod-data">
            <p>Mod data could not be displayed.</p>
        </div>
      </Show>
    </div>
  );
};

export default ModDetails;