// Tipos específicos para las APIs del servidor
export interface javaRelease {
    releaseName: string,
    arch?: string,
    downloadUrl?: string,
    featureVersion?: string,
    os?: string,
    size?: number,
}
export interface JavaVersions {
    available: number[];
    lts: number[];
    installed?: number[];
    release: javaRelease[];
}

type CoreType = 'vanilla' | 'bukkit' | 'spigot' | 'paper' | 'forge' | 'fabric' | 'quilt';
export interface CoreInfo {
  name: string;
  type?: CoreType;
  displayName: string;
  versionsMethod: string;
  urlGetMethod: string;
  [key: string]: any;
}
export type allCoreInfo = Record<string, CoreInfo>;
export interface file {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  read: boolean;
  write: boolean;
  execute: boolean;
}
export interface ServerInfo {
  id: string;
  folderName: string;
  files:file[];
  name: string;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  players: {
    online: number;
    max: number;
    list?: string[];
  };
  version: string;
  motd?: string;
  port: number;
  memory: {
    used: number;
    max: number;
    free: number;
  };
  uptime?: number;
}

export interface ServerLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source?: string;
}

export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  startTime?: string;
  endTime?: string;
  error?: string;
  result?: any;
}

export interface NewServerRequest {
  name: string;
  core: string;
  version: string;
  memory: number;
  port: number;
  javaVersion?: string;
  autoStart?: boolean;
  description?: string;
}

export interface FolderInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

export interface FileContent {
  content: string;
  encoding: string;
  size: number;
  lastModified: string;
}

export interface WriteFileRequest {
  directoryname: string;
  filename: string;
  content: string;
}

export interface RenameRequest {
  server: string;
  path: string;
  newName: string;
}

export interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    upload: number;
    download: number;
  };
  uptime: number;
}

export interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  author?: string;
  website?: string;
  dependencies?: string[];
}

export interface Mod extends Plugin {
  modLoader: 'forge' | 'fabric' | 'quilt';
  side: 'client' | 'server' | 'both';
}

export interface BackupInfo {
  filename: string;
  size: number;
  created: string;
  serverName?: string;
  type: 'full' | 'world' | 'plugins';
}

export interface CreateBackupRequest {
  folderName: string;
  outputFilename: string;
  serverName?: string;
}

export interface RestoreBackupRequest {
  filename: string;
  outputFolderName: string;
}

export interface NetworkPeer {
  id: string;
  address: string;
  port: number;
  status: 'connected' | 'disconnected' | 'connecting';
  lastSeen?: string;
  version?: string;
}

export type ServerAction = 'start' | 'stop' | 'restart' | 'send' | 'log' | 'info' | 'players' | 'metrics' | 'kill';
export type PluginOperation = 'enable' | 'disable' | 'delete';
export type ModOperation = 'enable' | 'disable' | 'delete';

// Tipos de respuesta de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// Tipos para elementos del DOM que pueden recibir datos
export interface FileExplorerElement {
  data?: FolderInfo[];
  currentPath?: string;
}

export interface DownloadModPluginRequest {
  server: string;
  url: string;
  path: 'mods' | 'plugins';
}