import BaseApi from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type { SystemInfo } from '../types/server.types';
import apiConfig from '../config/apiConfig';

/**
 * API para monitoreo del sistema
 */
class SystemMonitor extends BaseApi {
  constructor(config: typeof apiConfig) {
    super(config);
  }

  /**
   * Obtener información del sistema
   * @returns Promise con la información del sistema
   */
  async getSystemInfo(): Promise<ApiResponse<SystemInfo>> {
    return this.get<ApiResponse<SystemInfo>>('/hardware/summary');
  }

  /**
   * Obtener recursos del sistema
   * @returns Promise con los recursos del sistema
   */
  async getResources(): Promise<ApiResponse<SystemInfo>> {
    return this.get<ApiResponse<SystemInfo>>('/hardware/resources');
  }
}

export default SystemMonitor;