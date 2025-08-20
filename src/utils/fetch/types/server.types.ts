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
  lastModified?: string | Date;
  isDirectory?: boolean;
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

// Interfaces extendidas para información del sistema
export interface CacheInfo {
  l1d?: number;
  l1i?: number;
  l2?: number;
  l3?: number;
}

export interface RawCpuInfo {
  manufacturer?: string;
  brand?: string;
  vendor?: string;
  cache?: CacheInfo;
  cores?: number; // Logical cores/threads
  efficiencyCores?: number;
  family?: string;
  flags?: string;
  governor?: string;
  model?: string; // CPU model number, not brand
  performanceCores?: number;
  physicalCores?: number;
  processors?: number; // Number of physical CPU packages
  revision?: string;
  socket?: string;
  speed?: number; // Base speed in GHz
  speedMax?: number; // Max speed in GHz
  speedMin?: number; // Min speed in GHz
  stepping?: string;
  virtualization?: boolean;
  voltage?: string;
}

export interface CpuInfo {
  model?: string; // This is the brand string e.g., "Intel® 0000"
  speed?: number; // Base speed in GHz
  cores?: number; // Usually physical cores
  cache?: CacheInfo;
  rawCpuInfo?: RawCpuInfo;
  usage?: number; // CPU usage percentage
}

export interface RawBatteryInfo {
  hasBattery: boolean;
  cycleCount: number;
  isCharging: boolean;
  acConnected: boolean;
  capacityUnit: string;
  currentCapacity: number;
  designedCapacity: number;
  manufacturer: string;
  maxCapacity: number;
  model: string;
  percent: number;
  serial: string;
  timeRemaining: number | null;
  type: string;
  voltage: number;
}

export interface BatteryInfo {
  hasBattery: boolean;
  cycleCount: number;
  isCharging: boolean;
  percent: number;
  rawBatteryInfo?: RawBatteryInfo;
}

export interface SimpleDiskInfo {
  filesystem?: string;
  total?: number; // bytes
  used?: number; // bytes
  [key: string]: any;
}

export interface RawDiskInfo {
  fs?: string;
  type?: string;
  size?: number;
  used?: number;
  available?: number;
  rw?: boolean;
  mount?: string;
  use?: number;
  mountPoint?: string;
}

// Unified disk interface for display purposes
export interface DisplayDiskInfo {
  mountPoint?: string;
  filesystem?: string;
  fs?: string;
  total?: number;
  size?: number;
  used?: number;
  available?: number;
  use?: number;
  type?: string;
  rw?: boolean;
  mount?: string;
}

export interface GraphicsController {
  model?: string;
  vendor?: string;
  vram?: number; // in MB
  rawGraphicsInfo?: Record<string, any>;
}

export interface GraphicsInfo {
  controllers?: GraphicsController[];
}

export interface NetworkInterfaceDetail {
  address?: string;
  netmask?: string;
  family?: string;
  mac?: string;
  internal?: boolean;
  cidr?: string | null;
}

export interface PlatformInfo {
  name?: string;
  release?: string;
  arch?: string;
  version?: string;
}

export interface SystemInfo {
  cpu: CpuInfo;
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
  platform?: PlatformInfo;
  battery?: BatteryInfo;
  disks?: SimpleDiskInfo[];
  rawdisks?: RawDiskInfo[];
  environment?: Record<string, string>;
  graphics?: GraphicsInfo;
  networkInterfaces?: Record<string, NetworkInterfaceDetail[]>;
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
    name: string;
    path: string;
    size: number;
    created: string;
    createdDate: string;
    isValid: boolean;
    serverName: string;
    sizeFormatted: string;
    isDirectory?: boolean;
    modified?: string;
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