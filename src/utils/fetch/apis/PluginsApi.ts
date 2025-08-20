import BaseApi, { PrefixedApi } from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type {
  Plugin,
  Mod,
  PluginOperation,
  ModOperation,
  DownloadModPluginRequest
} from '../types/server.types';
import apiConfig from '../config/apiConfig';

/**
 * API para gestión de plugins y mods
 */
class PluginsApi extends PrefixedApi {
  constructor(config: typeof apiConfig) {
    super(config, '/extensions');
  }

  /**
   * Obtener lista de plugins de un servidor
   * @param serverName - Nombre del servidor
   * @returns Promise con la lista de plugins
   */
  async getPlugins(serverName: string): Promise<ApiResponse<Plugin[]>> {
    return this.get<ApiResponse<Plugin[]>>(`/plugins/${serverName}`);
  }

  /**
   * Obtener lista de mods de un servidor
   * @param serverName - Nombre del servidor
   * @returns Promise con la lista de mods
   */
  async getMods(serverName: string): Promise<ApiResponse<Mod[]>> {
    return this.get<ApiResponse<Mod[]>>(`/mods/${serverName}`);
  }

  /**
   * Realizar operación en un plugin
   * @param serverName - Nombre del servidor
   * @param itemName - Nombre del plugin
   * @param operation - Operación a realizar
   * @returns Promise con la respuesta de la API
   */
  async pluginToggle(serverName: string, itemName: string, operation: PluginOperation): Promise<ApiResponse> {
    const validOperations: PluginOperation[] = ['enable', 'disable', 'delete'];
    
    if (!validOperations.includes(operation)) {
      throw new Error(`Invalid operation: ${operation}. Valid operations are: ${validOperations.join(', ')}`);
    }
    
    return this.get<ApiResponse>(`/plugins/${serverName}/${itemName}/${operation}`);
  }

  /**
   * Realizar operación en un mod
   * @param serverName - Nombre del servidor
   * @param itemName - Nombre del mod
   * @param operation - Operación a realizar
   * @returns Promise con la respuesta de la API
   */
  async ModToggle(serverName: string, itemName: string, operation: ModOperation): Promise<ApiResponse> {
    const validOperations: ModOperation[] = ['enable', 'disable', 'delete'];
    
    if (!validOperations.includes(operation)) {
      throw new Error(`Invalid operation: ${operation}. Valid operations are: ${validOperations.join(', ')}`);
    }
    
    return this.get<ApiResponse>(`/mods/${serverName}/${itemName}/${operation}`);
  }

  /**
   * Subir archivos .jar al servidor
   * @param serverName - Nombre del servidor
   * @param files - Archivos a subir
   * @param type - Tipo de extensión ('plugins' o 'mods')
   * @returns Promise con la respuesta de la API
   */
  async uploadFiles(serverName: string, files: File[], type: 'plugins' | 'mods'): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return this.post<ApiResponse>(`/upload/${type}/${serverName}`, formData);
  }

  /**
   * Descargar mod o plugin desde URL
   * @param serverName - Nombre del servidor
   * @param url - URL del archivo a descargar
   * @param type - Tipo de descarga ('mods' o 'plugins')
   * @returns Promise con la respuesta de la API
   */
  async DownloadModorPlugin(serverName: string, url: string, type: 'mods' | 'plugins'): Promise<ApiResponse> {
    const downloadData: DownloadModPluginRequest = {
      server: serverName,
      url: url,
      path: type
    };
    
    return this.post<ApiResponse>('/download-file', downloadData);
  }
}

export default PluginsApi;