import BaseApi from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import type { NetworkPeer } from '../types/server.types';
import apiConfig from '../config/apiConfig';

/**
 * API para operaciones de red
 */
class NetworkApi extends BaseApi {
  constructor(config: typeof apiConfig) {
    super(config);
  }

  /**
   * Obtener lista de peers de la red
   * @returns Promise con la lista de peers
   */
  async getPeers(): Promise<ApiResponse<NetworkPeer[]>> {
    return this.get<ApiResponse<NetworkPeer[]>>('/network/peers');
  }
}

export default NetworkApi;