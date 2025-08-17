import BaseApi from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type {
  ServerInfo,
  ServerLog,
  ServerAction
} from '../types/server.types';
import apiConfig from '../config/apiConfig';

/**
 * API para gestión de servidores
 */
class ServermanagerApi extends BaseApi {
  constructor(config: typeof apiConfig) {
    super(config);
  }

  /**
   * Enviar comando a un servidor
   * @param server - Nombre del servidor
   * @param action - Acción a realizar
   * @returns Promise con la respuesta de la API
   */
  async sendCommandToServer(server: string, action: ServerAction | string): Promise<ApiResponse> {
    const validActions: ServerAction[] = ['start', 'stop', 'restart', 'send', 'log', 'info', 'players', 'metrics', 'kill'];
    
    if (!validActions.includes(action as ServerAction)) {
      throw new Error(`Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`);
    }
    
    return this.get<ApiResponse>(`/servermanager/${server}/${action}`);
  }

  /**
   * Obtener información de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con la información del servidor
   */
  async getServerInfo(server: string): Promise<ApiResponse<ServerInfo>> {
    return this.get<ApiResponse<ServerInfo>>(`/servermanager/${server}/info`);
  }

  /**
   * Obtener logs de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con los logs del servidor
   */
  async getServerLog(server: string): Promise<ApiResponse<ServerLog[]>> {
    return this.get<ApiResponse<ServerLog[]>>(`/servermanager/${server}/log`);
  }
}

export default ServermanagerApi;