export interface Server {
    id: string;
    name: string;
    size: number;
    lastModified: string;
    status: string;
    type?: string;
    players?: string;
    uptime?: string;
    ping?: string;
    version?: string;
  }
  
  export interface SystemMetrics {
    cpu: number;
    memory: number;
    network: number;
    totalServers: number;
    activeServers: number;
    lastBackup: string;
  }
  
  export interface QuickAction {
    name: string;
    icon: string;
    link: string;
  }