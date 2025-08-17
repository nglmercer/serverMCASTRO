import BaseApi from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import apiConfig from '../config/apiConfig';

// Interfaz para el modal de actualización
interface ModalUpdate {
  idCatalogo: string | number;
}

/**
 * API para operaciones de catálogo
 */
class FetchApi extends BaseApi {
  constructor(config: typeof apiConfig) {
    super(config);
  }



  /**
   * Eliminar un catálogo
   * @param modalUpdate - Objeto con el ID del catálogo a eliminar
   * @returns Promise con la respuesta de la API
   */
  async eliminar(modalUpdate: ModalUpdate): Promise<ApiResponse> {
    return this.delete<ApiResponse>(`/catalogo/${modalUpdate.idCatalogo}`);
  }
}

export default FetchApi;
export type { ModalUpdate };