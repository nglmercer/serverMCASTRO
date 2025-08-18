import { createSignal, onMount, For, Show } from 'solid-js'; // Añadido Show
import type { Component } from 'solid-js';
import { serverapi } from '@utils/fetch/fetchapi'

const StatusIndicatorSolid: Component<{ status: string }> = (props) => {
  const colorClass = () => {
    switch (props.status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  return <div class={`w-3 h-3 rounded-full mr-2 ${colorClass()}`} title={props.status}></div>;
};

interface Server {
  id: string;
  name: string;
  size: number;
  lastModified?: string;
  status: string;
  version?: string;
  icon?: string; // Para un icono específico del servidor si es necesario
}

interface FileData {
  name: string;
  path: string;
  size: number;
  lastModified?: string;
  modified?: string;
  status?: string;
  version?: string;
  icon?: string; // Si la API puede devolver un icono específico
}

const ServerList: Component = () => {
  const [servers, setServers] = createSignal<Server[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  // Nuevo estado para controlar cuándo renderizar, después de que server-item esté definido
  const [serverItemReady, setServerItemReady] = createSignal(false);

  onMount(async () => {
    // Espera a que el custom element 'server-item' esté definido
    // Esto es CRUCIAL para que Lit funcione correctamente.
    try {
      await customElements.whenDefined('server-item');
      console.log('server-item is defined. Ready to render.');
      setServerItemReady(true);
    } catch (e) {
      console.error('server-item definition timed out or failed:', e);
      setError('Core component server-item failed to load.');
      setLoading(false);
      return;
    }

    // Ahora procede a cargar los datos de los servidores
    try {
      setLoading(true);
      const serversfetch = await serverapi.getServers();
      if (!serversfetch || !serversfetch.data || !Array.isArray(serversfetch.data)) return;
      const mapped = (serversfetch.data as any[]).map((server) => ({
        id: server.id || server.name, // Asegúrate que server.name es único y válido como ID
        name: server.name,
        size: server.size || 0, // Asigna un tamaño por defecto si no está presente
        lastModified: server.lastModified || server.modified,
        status: server.status || 'stopped',
        version: server.version || 'N/A',
        icon: server.icon
      }));
      console.log("mapped servers:", mapped);
      setServers(mapped);
      setError(null);
    } catch (err) {
      console.error("Error fetching servers:", err);
      setError("Failed to load servers.");
      setServers([]);
    } finally {
      setLoading(false);
    }
  });

  const openServerOptions = (server: Server) => {
    // Ahora puedes pasar todo el objeto server si CPopup lo puede manejar, o solo el ID
    const event = new CustomEvent('open-server-options', { detail: { server } }); // Pasamos el objeto server completo
    document.getElementById('serverOptions')?.dispatchEvent(event);
    console.log("Open options for server:", server.name);
  };

  return (
    <div class="servers-container">
      <Show when={!serverItemReady() && loading()}>
        <p>Loading core components...</p>
      </Show>
      <Show when={serverItemReady()}>
        {loading() && <p>Loading servers...</p>}
        {error() && <p class="text-red-500">{error()}</p>}
        {!loading() && !error() && servers().length === 0 && <p>No servers found.</p>}
        <For each={servers()}>
          {(server) => (
            <div class="server-card">
              <div class="p-10 m-auto">
                {/* Descomenta esto solo para depuración temporal si es necesario */}
                {/* <pre>{JSON.stringify(server, null, 2)}</pre> */}

                {/*
                  Asegúrate de que los nombres de los atributos coinciden con las
                  propiedades @property declaradas en tu componente Lit 'server-item'.
                  Lit convierte atributos kebab-case a propiedades camelCase.
                  Ej: 'last-modified' atributo -> this.lastModified propiedad en Lit.
                */}
                <server-item
                  id={`server-item-${server.id}`} // El componente Lit puede usar `id` para su div raíz si está diseñado así, o simplemente como prop
                  icon={server.icon || "/favicon.svg"} // Pasa el icono
                  title={server.name} // Pasa el título
                  size={server.size} // Pasa el tamaño (Lit lo usará para "Size: ...")
                  version={server.version} // Pasa la versión (Lit lo usará para "v...")
                  modified={server.lastModified} // Pasa lastModified (Lit lo usará para "Modified: ...")
                  // Los data-* atributos son más para que JS externo los lea,
                  // o para CSS, pero el componente Lit usará sus props directas.
                  // Si server-item SÍ usa estos data-*, mantenlos.
                  server={server.id} // Usar un nombre de atributo más descriptivo
                  status={server.status} // El status lo usamos para el slot, pero puede ser útil aquí también
                >
                  {/* Este es el contenido que irá al <slot> por defecto dentro de server-item */}
                  <div class="flex center items-center justify-between" style="width: 100%;"> {/* Añadido width 100% para que el justify-between funcione bien */}
                    <div class="flex items-center">
                      <StatusIndicatorSolid status={server.status} />
                      {/* Opcionalmente, podrías añadir el nombre aquí también si no está ya visible por `title` en `server-item`
                      <span class="ml-2 text-sm text-gray-600">{server.name}</span>
                      */}
                    </div>
                    <button class="more-options" onClick={() => openServerOptions(server)}>
                      <span class="material-symbols-rounded">more_vert</span>
                    </button>
                  </div>
                </server-item>
              </div>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
};

export default ServerList;