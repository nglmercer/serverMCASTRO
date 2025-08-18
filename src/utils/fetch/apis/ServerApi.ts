import BaseApi from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type {
  JavaVersions,
  CoreInfo,
  ServerInfo,
  ServerLog,
  Task,
  allCoreInfo,
  NewServerRequest
} from '../types/server.types';
import apiConfig from '../config/apiConfig';

/**
 * API para operaciones del servidor
 */
class ServerApi extends BaseApi {
  constructor(config: typeof apiConfig) {
    super(config);
  }

  /**
   * Obtener todas las versiones de Java disponibles
   * @returns Promise con las versiones de Java
   */
  async getVSJava(): Promise<ApiResponse<JavaVersions>> {
    return this.get<ApiResponse<JavaVersions>>('/java/all');
  }
  async findJavaVersion(version: string): Promise<ApiResponse<JavaVersions>> {
    return this.get<ApiResponse<JavaVersions>>(`/java/find/${version}`);
  }
  async installJava(version: string): Promise<ApiResponse> {
    return this.get<ApiResponse>(`/java/download/${version}`);
  }
  /**
   * Obtener todos los cores disponibles
   * @returns Promise con todos los cores
   */
  async getALLCores(): Promise<ApiResponse<CoreInfo[]>> {
    return this.get<ApiResponse<CoreInfo[]>>('/mc/cores/all');
  }

  /**
   * Obtener cores
   * @returns Promise con los cores
   */
  async getCores(): Promise<ApiResponse<allCoreInfo>> {
    return this.get<ApiResponse<allCoreInfo>>('/mc/cores');
  }

  /**
   * Obtener información de un core específico
   * @param name - Nombre del core
   * @returns Promise con la información del core
   */
  async getcoreInfo(name: string): Promise<ApiResponse<CoreInfo>> {
    return this.get<ApiResponse<CoreInfo>>(`/mc/cores/${name}`);
  }
  /**
   * Obtener Array de cores disponibles
   * @returns Promise con la información del core
   */
  async getCoreData(name: string): Promise<ApiResponse<CoreInfo>> {
    return this.get<ApiResponse<CoreInfo>>(`/mc/cores/${name}/versions`);
  }
  /**
   * Crear un nuevo servidor
   * @param formData - Datos del formulario para crear el servidor
   * @returns Promise con la respuesta de la API
   */
  async postNewserver(formData: FormData): Promise<ApiResponse> {
    // Para FormData, no establecemos Content-Type manualmente
    return this.post<ApiResponse>('/newserver', formData);
  }

  /**
   * Obtener lista de servidores
   * @returns Promise con la lista de servidores
   */
  async getServers(): Promise<ApiResponse<ServerInfo[]>> {
    return this.get<ApiResponse<ServerInfo[]>>('/mc/servers');
  }

  /**
   * Obtener información de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con la información del servidor
   */
  async getServerInfo(server: string): Promise<ApiResponse<ServerInfo>> {
    return this.get<ApiResponse<ServerInfo>>(`/mc/servermanager/${server}/info`);
  }

  /**
   * Obtener logs de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con los logs del servidor
   */
  async getServerLog(server: string): Promise<ApiResponse<ServerLog[]>> {
    return this.get<ApiResponse<ServerLog[]>>(`/mc/servermanager/${server}/log`);
  }

  /**
   * Obtener todas las tareas
   * @returns Promise con las tareas
   */
  async getTasks(): Promise<ApiResponse<Task[]>> {
    return this.get<ApiResponse<Task[]>>('/tasks');
  }
}

export default ServerApi;