export interface Server {
    id: string;
    name: string;
    status: string;
    type: string;
    size: string;
    lastModified: string;
    players: string;
    uptime: string;
    ping: string;
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