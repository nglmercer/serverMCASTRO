import BaseApi from '../commons/BaseApi';
import type { ServerInfo, ServerLog } from '../types/server.types';
import apiConfig from '../config/apiConfig';
import {
  READ_ONLY_ACTIONS,
  MODIFYING_ACTIONS,
  SERVER_CONTROL_ACTIONS,
  COMMAND_ACTIONS,
  type ReadOnlyAction,
  type ModifyingAction,
  type ServerControlAction,
  type CommandActionType,
  type ApiResponse,
  type ServerAction,
  type SingleCommandAction,
  type MultipleCommandsAction,
  isReadOnlyAction,
  isModifyingAction,
  isServerControlAction,
  isCommandAction
} from '../constants/serverActions';

/**
 * API para gestión de servidores
 */
class ServermanagerApi extends BaseApi {
  constructor(config: typeof apiConfig) {
    super(config);
  }

  /**
   * Obtener información de solo lectura de un servidor (GET)
   * @param server - Nombre del servidor
   * @param action - Acción de solo lectura a realizar
   * @returns Promise con la respuesta de la API
   */
  async getServerData(server: string, action: ReadOnlyAction): Promise<ApiResponse> {
    if (!isReadOnlyAction(action)) {
      throw new Error(`Invalid read-only action: ${action}. Valid actions are: ${READ_ONLY_ACTIONS.join(', ')}`);
    }
    
    return this.get<ApiResponse>(`/mc/servermanager/${server}/${action}`);
  }

  /**
   * Ejecutar acciones que modifican el estado del servidor (POST)
   * @param server - Nombre del servidor
   * @param action - Acción que modifica estado a realizar
   * @returns Promise con la respuesta de la API
   */
  async executeServerAction(server: string, action: ServerControlAction): Promise<ApiResponse> {
    if (!isServerControlAction(action)) {
      throw new Error(`Invalid server control action: ${action}. Valid actions are: ${SERVER_CONTROL_ACTIONS.join(', ')}`);
    }
    
    return this.post<ApiResponse>(`/mc/servermanager/${server}/${action}`, {});
  }

  /**
   * Ejecutar acciones de comando en el servidor (POST)
   * @param server - Nombre del servidor
   * @param action - Tipo de acción de comando
   * @param payload - Datos del comando
   * @returns Promise con la respuesta de la API
   */
  async executeCommandAction(server: string, action: CommandActionType, payload: SingleCommandAction | MultipleCommandsAction): Promise<ApiResponse> {
    if (!isCommandAction(action)) {
      throw new Error(`Invalid command action: ${action}. Valid actions are: ${COMMAND_ACTIONS.join(', ')}`);
    }
    
    return this.post<ApiResponse>(`/mc/servermanager/${server}/${action}`, payload);
  }

  /**
   * Método de compatibilidad para enviar comandos (mantiene la interfaz anterior)
   * @param server - Nombre del servidor
   * @param action - Acción a realizar
   * @returns Promise con la respuesta de la API
   * @deprecated Use getServerData() for read-only actions, executeServerAction() for state-modifying actions, or executeCommandAction() for command actions
   */
  async sendCommandToServer(server: string, action: string): Promise<ApiResponse> {
    if (isReadOnlyAction(action)) {
      return this.getServerData(server, action);
    } else if (isServerControlAction(action)) {
      return this.executeServerAction(server, action);
    } else {
      throw new Error(`Invalid action: ${action}. Valid actions are: ${[...READ_ONLY_ACTIONS, ...SERVER_CONTROL_ACTIONS].join(', ')}`);
    }
  }

  /**
   * Obtener información de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con la información del servidor
   */
  async getServerInfo(server: string): Promise<ApiResponse<ServerInfo>> {
    return this.getServerData(server, 'info') as Promise<ApiResponse<ServerInfo>>;
  }

  /**
   * Obtener estado de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con el estado del servidor
   */
  async getServerStatus(server: string): Promise<ApiResponse> {
    return this.getServerData(server, 'status');
  }

  /**
   * Obtener métricas de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con las métricas del servidor
   */
  async getServerMetrics(server: string): Promise<ApiResponse> {
    return this.getServerData(server, 'metrics');
  }

  /**
   * Obtener logs de un servidor específico
   * @param server - Nombre del servidor
   * @returns Promise con los logs del servidor
   * @deprecated This endpoint may not be available in the current backend implementation
   */
  async getServerLog(server: string): Promise<ApiResponse<ServerLog[]>> {
    return this.getServerData(server, 'logs') as Promise<ApiResponse<ServerLog[]>>;
  }

  /**
   * Iniciar un servidor
   * @param server - Nombre del servidor
   * @returns Promise con la respuesta de la API
   */
  async startServer(server: string): Promise<ApiResponse> {
    return this.executeServerAction(server, 'start');
  }

  /**
   * Detener un servidor
   * @param server - Nombre del servidor
   * @returns Promise con la respuesta de la API
   */
  async stopServer(server: string): Promise<ApiResponse> {
    return this.executeServerAction(server, 'stop');
  }

  /**
   * Reiniciar un servidor
   * @param server - Nombre del servidor
   * @returns Promise con la respuesta de la API
   */
  async restartServer(server: string): Promise<ApiResponse> {
    return this.executeServerAction(server, 'restart');
  }

  /**
   * Forzar la terminación de un servidor
   * @param server - Nombre del servidor
   * @returns Promise con la respuesta de la API
   */
  async killServer(server: string): Promise<ApiResponse> {
    return this.executeServerAction(server, 'kill');
  }

  /**
   * Enviar un comando individual al servidor
   * @param server - Nombre del servidor
   * @param command - Comando a enviar
   * @returns Promise con la respuesta de la API
   */
  async sendCommand(server: string, command: string): Promise<ApiResponse> {
    return this.executeCommandAction(server, 'send', { command });
  }

  /**
   * Enviar múltiples comandos al servidor
   * @param server - Nombre del servidor
   * @param commands - Array de comandos a enviar
   * @returns Promise con la respuesta de la API
   */
  async sendCommands(server: string, commands: string[]): Promise<ApiResponse> {
    return this.executeCommandAction(server, 'commands', { commands });
  }

  /**
   * Ejecutar un comando en el servidor
   * @param server - Nombre del servidor
   * @param command - Comando a ejecutar
   * @returns Promise con la respuesta de la API
   */
  async executeCommand(server: string, command: string): Promise<ApiResponse> {
    return this.executeCommandAction(server, 'command', { command });
  }
}

export default ServermanagerApi;