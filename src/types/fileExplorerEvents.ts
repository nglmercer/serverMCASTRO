/**
 * Array de todos los eventos que emite el componente FileExplorer.vue
 * Útil para autocompletado al usar emitter.on()
 */
export const FILE_EXPLORER_EVENTS = [
  // Eventos emitidos por el componente Vue (emit)
  'selected',
  'menu', 
  'updated',
  'sort',
  
  // Eventos emitidos globalmente a través del emitter
  'file-explorer:selected',
  'file-explorer:menu',
  'file-explorer:path-updated',
  'file-explorer:data-updated',
  'file-explorer:navigation-error',
  'file-explorer:sort',
  'file-explorer:external-update',
  
  // Eventos que escucha del PathNavigator
  'path-navigator:path-changed',
  'path-navigator:navigate',
  'file-explorer:refresh-data',
  
  // Evento que emite al PathNavigator
  'path-navigator:update-path'
] as const;

/**
 * Tipo TypeScript derivado del array de eventos
 * Útil para tipado estricto
 */
export type FileExplorerEventType = typeof FILE_EXPLORER_EVENTS[number];

/**
 * Interfaces de los datos que acompañan a cada evento
 */
export interface FileExplorerEventData {
  'selected': { data: FileSystemItem };
  'menu': { event: MouseEvent; data: FileSystemItem };
  'updated': { path: string };
  'sort': { column: string; direction: 'asc' | 'desc' };
  'file-explorer:selected': { data: FileSystemItem };
  'file-explorer:menu': { event: MouseEvent; data: FileSystemItem };
  'file-explorer:path-updated': { path: string };
  'file-explorer:data-updated': { data: FileSystemItem[] };
  'file-explorer:navigation-error': { path: string; error: any };
  'file-explorer:sort': { column: string; direction: 'asc' | 'desc' };
  'file-explorer:external-update': { currentPath: string; data: FileSystemItem[] };
  'path-navigator:path-changed': { path: string };
  'path-navigator:navigate': { from: string; to: string; trigger: string };
  'file-explorer:refresh-data': { path: string };
  'path-navigator:update-path': { path: string };
}

/**
 * Interface para FileSystemItem (importada del componente)
 */
export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string | Date;
  isDirectory?: boolean;
  modified?: string | Date;
}