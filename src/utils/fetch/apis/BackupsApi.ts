import BaseApi from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type {
  BackupInfo,
  CreateBackupRequest,
  RestoreBackupRequest
} from '../types/server.types';
import apiConfig from '../config/apiConfig';

/**
 * API para gestión de backups
 */
class BackupsApi extends BaseApi {
  constructor(config: typeof apiConfig) {
    super(config);
  }

  /**
   * Obtener lista de backups
   * @returns Promise con la lista de backups
   */
  async getBackups(): Promise<ApiResponse<{ files: BackupInfo[] }>> {
    return this.get<ApiResponse<{ files: BackupInfo[] }>>('/backups/backupsInfo');
  }

  /**
   * Crear backup (síncrono)
   * @param data - Datos para crear el backup
   * @returns Promise con la respuesta de la API
   */
  async createBackup(data: CreateBackupRequest): Promise<ApiResponse> {
    if (!data || !data.folderName || !data.outputFilename) {
      throw new Error("folderName and outputFilename are required");
    }
    
    return this.post<ApiResponse>('/backups/create', data);
  }

  /**
   * Crear backup (asíncrono)
   * @param data - Datos para crear el backup
   * @returns Promise con la respuesta de la API
   */
  async createBackups(data: CreateBackupRequest): Promise<ApiResponse> {
    if (!data || !data.folderName || !data.outputFilename) {
      throw new Error("folderName and outputFilename are required");
    }
    
    return this.post<ApiResponse>('/backups/create-async', data);
  }

  /**
   * Eliminar backup
   * @param filename - Nombre del archivo de backup
   * @returns Promise con la respuesta de la API
   */
  async deleteBackup(filename: string): Promise<ApiResponse> {
    if (!filename || typeof filename !== 'string') {
      throw new Error("filename is required");
    }
    
    return this.post<ApiResponse>('/backups/delete', { filename });
  }

  /**
   * Descargar backup
   * @param filename - Nombre del archivo de backup
   * @returns Promise con el blob del archivo
   */
  async downloadBackup(filename: string): Promise<Blob> {
    if (!filename || typeof filename !== 'string') {
      throw new Error("filename is required");
    }
    
    const urlEncoded = encodeURIComponent(filename);
    
    // Especificamos que esperamos un blob
    return this.get<Blob>(`/backups/download/${urlEncoded}`, {
      responseType: 'blob'
    } as any);
  }

  /**
   * Restaurar backup (síncrono)
   * @param data - Datos para restaurar el backup
   * @returns Promise con la respuesta de la API
   */
  async restoreBackup(data: RestoreBackupRequest): Promise<ApiResponse> {
    const { filename, outputFolderName } = data;
    
    if (!filename || typeof filename !== 'string' || !outputFolderName || typeof outputFolderName !== 'string') {
      throw new Error("filename and outputFolderName are required");
    }
    
    return this.post<ApiResponse>('/backups/restore', data);
  }

  /**
   * Restaurar backup (asíncrono)
   * @param data - Datos para restaurar el backup
   * @returns Promise con la respuesta de la API
   */
  async restoreBackups(data: RestoreBackupRequest): Promise<ApiResponse> {
    const { filename, outputFolderName } = data;
    
    if (!filename || typeof filename !== 'string' || !outputFolderName || typeof outputFolderName !== 'string') {
      throw new Error("filename and outputFolderName are required");
    }
    
    return this.post<ApiResponse>('/backups/restore-async', data);
  }

  /**
   * Subir archivo de backup al servidor
   * @param file - El objeto File del input del formulario
   * @returns Promise con la respuesta del servidor
   */
  async uploadBackup(file: File): Promise<ApiResponse> {
    // Crear un objeto FormData
    const formData = new FormData();
    // 'file' es el nombre del campo que el backend espera
    formData.append('file', file);
    
    console.log("file", file, formData, typeof file);
    
    // Realizar la llamada a la API usando el método post existente
    return this.post<ApiResponse>('/backups/upload', formData);
  }
}

export default BackupsApi;