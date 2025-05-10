import type { Mod, ModVersion, ModVersionFile, ModrinthSearchHit, ModrinthSearchResponse, ModrinthProjectResponse, ModrinthApiVersion, ModrinthApiError } from './index.ts'; // Ajusta la ruta si es necesario

const API_BASE = "https://api.modrinth.com/v2";
const SEARCH_API = `${API_BASE}/search`;
const PROJECT_API = `${API_BASE}/project`;

// --- UTILITY FUNCTIONS ---

/**
 * Helper para realizar peticiones fetch y manejar errores comunes y parsing de JSON.
 */
async function handleFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status} ${response.statusText}`;
    try {
      const errorBody: ModrinthApiError | any = await response.json();
      if (errorBody && errorBody.description) {
        errorMessage += ` - ${errorBody.description}`;
      } else if (errorBody && errorBody.error) {
        errorMessage += ` - ${errorBody.error}`;
      }
    } catch (e) {
      // No se pudo parsear el cuerpo del error o no era JSON
      const textError = await response.text();
      errorMessage += ` - Body: ${textError.substring(0, 100)}...`; // Evita logs muy largos
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

// --- MAPPING FUNCTIONS ---

function mapModrinthSearchHitToMod(hit: ModrinthSearchHit): Mod {
  return {
    id: hit.project_id, // Usar project_id como el ID principal
    slug: hit.slug,
    title: hit.title,
    description: hit.description,
    project_type: hit.project_type,
    icon_url: hit.icon_url,
    image: hit.icon_url, // Usar icon_url también para 'image' por defecto para API mods
    isCustom: false,
    source_api: 'modrinth',
    game_versions: hit.game_versions || [],
    author: hit.author,
    downloads: hit.downloads,
    client_side: hit.client_side,
    server_side: hit.server_side,
    versions: [], // Las versiones detalladas se obtendrán por separado
  };
}

function mapModrinthApiVersionToModVersion(apiVersion: ModrinthApiVersion): ModVersion {
  return {
    id: apiVersion.id,
    name: apiVersion.name,
    version_number: apiVersion.version_number,
    game_versions: apiVersion.game_versions,
    loaders: apiVersion.loaders,
    changelog: apiVersion.changelog || undefined,
    date_published: apiVersion.date_published,
    files: apiVersion.files.map((file: any) => ({
      url: file.url,
      filename: file.filename,
      primary: file.primary,
      hashes: file.hashes,
      // size: file.size, // Puedes añadirlo si lo necesitas en ModVersionFile
    })),
  };
}

// --- CUSTOM PLUGINS DATA ---
// Modifica tus CUSTOM_PLUGINS para que se alineen mejor con la estructura de Mod y ModVersion
// Esto hará la fusión más fácil.
export const CUSTOM_PLUGINS: Mod[] = [
  {
    id: 'minekube-connect', // Este es el ID único
    slug: 'minekube-connect', // Puedes usar el mismo slug o uno específico si lo deseas
    title: 'Minekube Connect',
    description: 'Minecraft Plugin for Connect, allows tunneled player connections from Connect Network to join Spigot/Paper server and Velocity/BungeeCord proxy, even in online mode!',
    image: 'https://avatars.githubusercontent.com/u/51905918?s=48&v=4',
    icon_url: 'https://avatars.githubusercontent.com/u/51905918?s=48&v=4',
    isCustom: true,
    source_api: 'custom',
    project_type: 'plugin', // Usa minúsculas como Modrinth ('plugin' en lugar de 'Plugin')
    game_versions: ['1.8-1.20.6'], // Versiones de juego generales
    versions: [
      {
        id: 'minekube-connect-bungee-1.0.0', // Un ID único para la versión
        version_number: "1.0.0",
        name: "Minekube Connect Bungee 1.0.0",
        files: [{
          url: "https://github.com/minekube/connect-java/releases/download/latest/connect-bungee.jar",
          filename: "connect-bungee.jar",
          primary: true,
        }],
        loaders: ["BungeeCord"],
        game_versions: ["1.8-1.20.6"],
      },
      {
        id: 'minekube-connect-spigot-1.0.0',
        version_number: "1.0.0",
        name: "Minekube Connect Spigot 1.0.0",
        files: [{
          url: "https://github.com/minekube/connect-java/releases/download/latest/connect-spigot.jar",
          filename: "connect-spigot.jar",
          primary: true,
        }],
        loaders: ["Spigot"],
        game_versions: ["1.8-1.20.6"],
      },
      {
        id: 'minekube-connect-velocity-1.0.0',
        version_number: "1.0.0",
        name: "Minekube Connect Velocity 1.0.0",
        files: [{
          url: "https://github.com/minekube/connect-java/releases/download/latest/connect-velocity.jar",
          filename: "connect-velocity.jar",
          primary: true,
        }],
        loaders: ["Velocity"],
        game_versions: ["1.8-1.20.6"],
      }
    ]
  }
];


// --- API FUNCTIONS ---

async function handleModrinthSearch(query: string): Promise<ModrinthSearchResponse> {
  if (!query || query.length < 2) {
    console.warn('Search query too short, returning empty results.');
    return { hits: [], limit: 0, offset: 0, total_hits: 0 };
  }
  const url = `${SEARCH_API}?query=${encodeURIComponent(query)}`;
  return handleFetch<ModrinthSearchResponse>(url);
}

export async function searchMods(query = 'minecraft'): Promise<Mod[]> {
  try {
    console.log(`Searching Modrinth for: ${query}`);
    const results = await handleModrinthSearch(query);
    const mappedMods = results.hits.map(mapModrinthSearchHitToMod);
    
    // Aquí podrías querer fusionar con CUSTOM_PLUGINS si la búsqueda también debería incluirlos
    // Por ejemplo, si el query coincide con el título de un custom plugin.
    // Por ahora, solo devuelve resultados de la API.
    // Si deseas incluir custom plugins que coincidan con la query:
    const lowerQuery = query.toLowerCase();
    const matchingCustomPlugins = CUSTOM_PLUGINS.filter(
      p => p.title.toLowerCase().includes(lowerQuery) || 
           p.description?.toLowerCase().includes(lowerQuery)
    );

    // Evitar duplicados si un custom plugin también fue retornado por la API (basado en ID)
    const finalResults = [...mappedMods];
    matchingCustomPlugins.forEach(customMod => {
      if (!finalResults.find(mod => mod.id === customMod.id)) {
        finalResults.push(customMod);
      }
    });

    console.log(`Found ${finalResults.length} mods for query "${query}".`);
    return finalResults;

  } catch (error) {
    console.error(`Error searching mods for query "${query}":`, error);
    return []; // Devuelve un array vacío en caso de error
  }
}

export async function getModDetails(slugOrId: string): Promise<Mod | null> {
  // Primero, verificar si es un custom plugin por ID
  // (asumiendo que CUSTOM_PLUGINS usan 'id' como identificador principal, y 'slug' puede ser el mismo o diferente)
  const customMod = CUSTOM_PLUGINS.find(m => m.id === slugOrId || m.slug === slugOrId);

  if (customMod && customMod.isCustom) {
    console.log(`Returning details for custom mod: ${customMod.title}`);
    // Para custom mods, si necesitas cargar versiones "frescas" o algo más, hazlo aquí.
    // Por ahora, simplemente devolvemos el objeto como está.
    // Si sus versiones son estáticas, ya están completas.
    return { ...customMod };
  }

  // Si no es un custom plugin o no se encontró por ID, intentar obtenerlo de la API de Modrinth usando el slug
  try {
    console.log(`Fetching Modrinth details for slug: ${slugOrId}`);
    const projectUrl = `${PROJECT_API}/${slugOrId}`;
    const versionsUrl = `${PROJECT_API}/${slugOrId}/version`;

    const [projectData, apiVersionsData] = await Promise.all([
      handleFetch<ModrinthProjectResponse>(projectUrl),
      handleFetch<ModrinthApiVersion[]>(versionsUrl)
    ]);

    const modDetails: Mod = {
      id: projectData.id,
      slug: projectData.slug,
      title: projectData.title,
      description: projectData.body, // Usar 'body' para la descripción completa
      project_type: projectData.project_type,
      icon_url: projectData.icon_url,
      image: projectData.icon_url,
      isCustom: false,
      source_api: 'modrinth',
      game_versions: projectData.game_versions || [],
      // author: podrías necesitar buscarlo en projectData.team y luego obtener el nombre del equipo/usuario
      downloads: projectData.downloads,
      client_side: projectData.client_side,
      server_side: projectData.server_side,
      versions: apiVersionsData.map(mapModrinthApiVersionToModVersion),
    };
    
    // Si hubo un customMod con el mismo slug pero no se marcó como isCustom,
    // aquí podrías fusionar algunos datos si fuera necesario, pero es un caso raro.
    // Por lo general, si el slug coincide con un customMod.id/slug, ya se habría devuelto.

    console.log(`Successfully fetched details for: ${modDetails.title}`);
    return modDetails;

  } catch (error) {
    console.error(`Error getting mod details for slug/ID "${slugOrId}":`, error);
    // Si falla la API y existía un customMod (aunque no se haya marcado como isCustom arriba, pero coincide el slug),
    // podrías optar por devolver el customMod como fallback.
    if (customMod) {
        console.warn(`API fetch failed, returning custom mod data as fallback for ${slugOrId}`);
        return { ...customMod };
    }
    return null; // Devuelve null si no se encuentra o hay un error irrecuperable
  }
}

// Ejemplo de uso (opcional, para probar)
async function testFunctions() {
  console.log("--- Testing searchMods ---");
  const fabricMods = await searchMods("fabric api");
  // console.log("Fabric API Search Results:", fabricMods.map(m => ({ title: m.title, id: m.id, source: m.source_api })));

  console.log("\n--- Testing getModDetails (API Mod) ---");
  // Reemplaza 'sodium' con un slug válido si es necesario
  const sodiumDetails = await getModDetails("sodium");
  if (sodiumDetails) {
    // console.log("Sodium Details:", {title: sodiumDetails.title, versionsCount: sodiumDetails.versions.length});
    // console.log("First version files:", sodiumDetails.versions[0]?.files.map(f => f.filename));
  } else {
    console.log("Could not fetch Sodium details.");
  }

  console.log("\n--- Testing getModDetails (Custom Mod) ---");
  const connectDetails = await getModDetails("minekube-connect"); // Usar el ID del custom plugin
  if (connectDetails) {
    // console.log("Minekube Connect Details:", {title: connectDetails.title, versionsCount: connectDetails.versions.length});
    // console.log("First version files:", connectDetails.versions[0]?.files.map(f => f.filename));
  } else {
    console.log("Could not fetch Minekube Connect details.");
  }

   console.log("\n--- Testing searchMods (query que podría incluir custom) ---");
   const connectSearch = await searchMods("minekube");
   // console.log("Minekube Search Results:", connectSearch.map(m => ({ title: m.title, id: m.id, source: m.source_api })));

}

// Descomenta para ejecutar pruebas:
// testFunctions().catch(err => console.error("Test run failed:", err));