// (Asumimos que estos están en ./index.ts o definidos aquí para claridad)
export interface Mod {
  id: string; // ID del proyecto (puede ser el slug para API mods, o el ID custom)
  slug: string; // Slug de Modrinth (para mods de la API)
  title: string;
  description?: string;
  project_type: string;
  icon_url?: string; // URL del ícono (generalmente de la API)
  image?: string;    // URL de imagen (puede ser de custom o un fallback)
  isCustom?: boolean;
  source_api?: 'modrinth' | 'custom' | string; // Para saber de dónde vino principalmente
  game_versions: string[]; // Versiones de juego soportadas en general
  versions: ModVersion[];
  name?: string; // Nombre del mod (API o custom)
  author?: string; // Ejemplo: Podrías querer añadir el autor
  downloads?: number; // Ejemplo
  client_side?: string;
  server_side?: string;
}

export interface ModVersionFile {
  url: string;
  filename: string;
  primary?: boolean; // Indica si es el archivo principal de la versión
  hashes?: { [algorithm: string]: string };
  // size?: number; // Modrinth API podría proveer esto
}

export interface ModVersion {
  id: string; // ID de la versión (API o generado para custom)
  name?: string; // Nombre de la versión (ej: "Release 1.0.0")
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: ModVersionFile[];
  changelog?: string; // Modrinth API provee esto
  date_published?: string; // Modrinth API provee esto
  // Otros campos de la API de versión
}

// Tipos específicos para las respuestas de la API de Modrinth
interface ModrinthApiError {
  error: string;
  description: string;
}

interface ModrinthSearchHit {
  slug: string;
  project_id: string;
  title: string;
  description: string;
  project_type: 'mod' | 'plugin' | 'datapack' | 'shader' | 'resourcepack' | 'modpack';
  author: string;
  icon_url?: string;
  versions: string[]; // Array de IDs de versión
  game_versions: string[]; // Más comúnmente en la versión específica, pero la búsqueda lo incluye
  downloads: number;
  client_side: string; // "required", "optional", "unsupported"
  server_side: string; // "required", "optional", "unsupported"
  // ...otros campos relevantes de la API de búsqueda
}

interface ModrinthSearchResponse {
  hits: ModrinthSearchHit[];
  limit: number;
  offset: number;
  total_hits: number;
}

interface ModrinthProjectResponse {
  slug: string;
  id: string; // ID del proyecto
  title: string;
  description: string;
  project_type: 'mod' | 'plugin' | 'datapack' | 'shader' | 'resourcepack' | 'modpack';
  icon_url?: string;
  body: string; // Descripción completa en HTML o Markdown
  game_versions: string[];
  loaders: string[];
  versions: string[]; // Array de IDs de versión
  team: string; // Team ID
  // ... más campos
  client_side: string;
  server_side: string;
  downloads: number;
}

interface ModrinthApiVersionFile {
  hashes: { [algorithm: string]: string };
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  file_type: string | null; // 'required-resource-pack', 'optional-resource-pack'
}

interface ModrinthApiVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  changelog: string | null;
  dependencies: any[]; // Definir si es necesario
  game_versions: string[];
  loaders: string[];
  featured: boolean;
  status: string; // "listed", "archived", "draft", "unlisted", "scheduled", "unknown"
  requested_status: string | null;
  date_published: string; // ISO 8601
  downloads: number;
  version_type: 'release' | 'beta' | 'alpha';
  files: ModrinthApiVersionFile[];
}
export type {
  ModrinthApiVersion,
  ModrinthApiVersionFile,
  ModrinthSearchHit,
  ModrinthSearchResponse,
  ModrinthProjectResponse,
  ModrinthApiError,
}