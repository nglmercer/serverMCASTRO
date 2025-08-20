import BaseApi,{ PrefixedApi} from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type {
  BackupInfo,
  CreateBackupRequest,
  RestoreBackupRequest
} from '../types/server.types';
import apiConfig from '../config/apiConfig';

// Nuevos tipos basados en el backend
export interface ServerBackupOptions {
  serverName: string;
  outputFilename?: string;
  useZip?: boolean;
  compressionLevel?: number;
  exclude?: string[];
}

export interface BackupRestoreOptions {
  backupName: string;
  destinationServerName?: string;
  destinationFolderName?: string;
}

export interface BackupListOptions {
  sortBy?: 'name' | 'size' | 'created';
  sortOrder?: 'asc' | 'desc';
  filterByServer?: string;
}

/**
 * API para gestión de backups
 */
class BackupsApi extends PrefixedApi {
  constructor(config: typeof apiConfig) {
    super(config,'/files/backups');
  }

  /**
   * Obtener lista de backups
   * @param options - Opciones de filtrado y ordenamiento
   * @returns Promise con la lista de backups
   */
  async getBackups(options?: BackupListOptions): Promise<ApiResponse<BackupInfo[]>> {
    const queryParams = new URLSearchParams();
    
    if (options?.sortBy) queryParams.append('sortBy', options.sortBy);
    if (options?.sortOrder) queryParams.append('sortOrder', options.sortOrder);
    if (options?.filterByServer) queryParams.append('filterByServer', options.filterByServer);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/?${queryString}` : '';
    
    return this.get<ApiResponse<BackupInfo[]>>(url);
  }

  /**
   * Crear backup
   * @param data - Datos para crear el backup
   * @returns Promise con la respuesta de la API
   */
  async createBackup(data: ServerBackupOptions): Promise<ApiResponse> {
    if (!data || !data.serverName) {
      throw new Error("serverName is required");
    }
    
    return this.post<ApiResponse>('', data);
  }

  /**
   * Obtener información de un backup específico
   * @param backupName - Nombre del backup
   * @returns Promise con la información del backup
   */
  async getBackupInfo(backupName: string): Promise<ApiResponse<BackupInfo>> {
    if (!backupName || typeof backupName !== 'string') {
      throw new Error("backupName is required");
    }
    
    const urlEncoded = encodeURIComponent(backupName);
    return this.get<ApiResponse<BackupInfo>>(`/${urlEncoded}`);
  }

  /**
   * Eliminar backup
   * @param backupName - Nombre del backup
   * @returns Promise con la respuesta de la API
   */
  async deleteBackup(backupName: string): Promise<ApiResponse> {
    if (!backupName || typeof backupName !== 'string') {
      throw new Error("backupName is required");
    }
    
    const urlEncoded = encodeURIComponent(backupName);
    return this.delete<ApiResponse>(`/${urlEncoded}`);
  }

  /**
   * Descargar backup
   * @param backupName - Nombre del backup
   * @returns Promise con el blob del archivo
   */
  async downloadBackup(backupName: string): Promise<Blob> {
    if (!backupName || typeof backupName !== 'string') {
      throw new Error("backupName is required");
    }
    
    const urlEncoded = encodeURIComponent(backupName);
    
    // Especificamos que esperamos un blob
    return this.get<Blob>(`/${urlEncoded}/download`, {
      responseType: 'blob'
    } as any);
  }

  /**
   * Restaurar backup
   * @param data - Datos para restaurar el backup
   * @returns Promise con la respuesta de la API
   */
  async restoreBackup(data: BackupRestoreOptions): Promise<ApiResponse> {
    const { backupName } = data;
    
    if (!backupName || typeof backupName !== 'string') {
      throw new Error("backupName is required");
    }
    
    const urlEncoded = encodeURIComponent(backupName);
    const { backupName: _, ...restoreOptions } = data;
    
    return this.post<ApiResponse>(`/${urlEncoded}/restore`, restoreOptions);
  }


}

export default BackupsApi;