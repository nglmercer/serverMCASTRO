import BaseApi,{ PrefixedApi} from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type {
  FolderInfo,
  FileContent,
  WriteFileRequest,
  RenameRequest
} from '../types/server.types';
import type { FileSystemItem } from '@litcomponents/mc/files.ts';
import apiConfig from '../config/apiConfig';
import type { FetchOptions } from '../commons/httpservice';

/**
 * API para gestión de archivos
 */
class FileManagerApi extends PrefixedApi {
  constructor(config: typeof apiConfig) {
    super(config, '/files');
  }

  /**
   * Obtener información de una carpeta
   * @param folderName - Nombre de la carpeta
   * @returns Promise con la información de la carpeta
   */
  async getFolderInfo(folderName: string): Promise<ApiResponse<{ files: FileSystemItem[] }>> {
    console.log("FName", folderName);
    return this.get<ApiResponse<{ files: FileSystemItem[] }>>(`/folder-info/${folderName}`);
  }

  /**
   * Leer archivo por ruta
   * @param path - Ruta del archivo
   * @returns Promise con el contenido del archivo
   */
  async readFileByPath(path: string): Promise<ApiResponse<FileContent>> {
    return this.get<ApiResponse<FileContent>>(`/read-file-by-path/${path}`);
  }

  /**
   * Escribir archivo
   * @param formData - Datos del formulario con directoryname, filename y content
   * @returns Promise con la respuesta de la API
   */
  async writeFile(formData: WriteFileRequest | FormData): Promise<ApiResponse> {
    return this.post<ApiResponse>('/write-file', formData);
  }

  /**
   * Subir archivos
   * @param formData - Datos del formulario con archivos
   * @returns Promise con la respuesta de la API
   */
  async uploadFiles(formData: FormData): Promise<ApiResponse> {
    return this.post<ApiResponse>('/upload-files', formData);
  }

  /**
   * Eliminar archivo
   * @param serverName - Nombre del servidor
   * @param path - Ruta del archivo o carpeta a eliminar
   * @returns Promise con la respuesta de la API
   */
  async deleteFile(serverName: string, path: string): Promise<ApiResponse> {
    const verifyPath = path.startsWith("/") ? path.substring(1) : path;
    return this.delete<ApiResponse>(`/deleteFile/${serverName}/${verifyPath}`);
  }

  /**
   * Crear carpeta
   * @param path - Ruta donde crear la carpeta
   * @returns Promise con la respuesta de la API
   */
  async createFolder(path: string): Promise<ApiResponse> {
    return this.post<ApiResponse>('/create-folder', {
      directoryname: path
    });
  }

  /**
   * Renombrar archivo o carpeta
   * @param server - Nombre del servidor
   * @param path - Ruta del archivo o carpeta
   * @param newName - Nuevo nombre
   * @returns Promise con la respuesta de la API
   */
  async renameFile(server: string, path: string, newName: string): Promise<ApiResponse> {
    const renameData: RenameRequest = {
      server: server,
      path: path,
      newName: newName
    };
    
    return this.put<ApiResponse>('/rename', renameData);
  }

  /**
   * Descargar archivo
   * @param serverName - Nombre del servidor
   * @param filePath - Ruta del archivo a descargar
   * @returns Promise con la respuesta de descarga
   */
  async downloadFile(filePath: string): Promise<Response> {
    const cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
    const urlEncoded = encodeURIComponent(cleanPath);
    const url = `/download/${cleanPath}`;
    return this.get(url, {
      responseType: 'blob'
    });
  }
}

export default FileManagerApi;