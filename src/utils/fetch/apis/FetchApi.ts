import BaseApi from '../commons/BaseApi';
import type { ApiResponse } from '../types/api.types.ts';
import apiConfig from '../config/apiConfig';

// Interfaz para notificaciones
interface NotificationData {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  data?: any;
}

// Interfaz para configuración de long polling
interface LongPollingConfig {
  endpoint: string;
  timeout?: number;
  retryDelay?: number;
  maxRetries?: number;
  onNotification?: (notification: NotificationData) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
}

/**
 * API para operaciones de catálogo y long polling
 */
class FetchApi extends BaseApi {
  private longPollingActive: boolean = false;
  private longPollingAbortController: AbortController | null = null;
  private retryCount: number = 0;
  private longPollingConfig: LongPollingConfig | null = null;

  constructor(config: typeof apiConfig) {
    super(config);
  }

  /**
   * Inicia el long polling para notificaciones
   * @param config Configuración del long polling
   */
  startLongPolling(config: LongPollingConfig): void {
    if (this.longPollingActive) {
      console.warn('[LongPolling] Ya hay una sesión de long polling activa');
      return;
    }

    this.longPollingConfig = {
      timeout: 30000, // 30 segundos por defecto
      retryDelay: 5000, // 5 segundos de retraso entre reintentos
      maxRetries: 5, // máximo 5 reintentos
      ...config
    };

    this.longPollingActive = true;
    this.retryCount = 0;
    this._performLongPoll();
  }

  /**
   * Detiene el long polling
   */
  stopLongPolling(): void {
    this.longPollingActive = false;
    if (this.longPollingAbortController) {
      this.longPollingAbortController.abort();
      this.longPollingAbortController = null;
    }
    this.retryCount = 0;
    console.log('[LongPolling] Long polling detenido');
  }

  /**
   * Verifica si el long polling está activo
   */
  isLongPollingActive(): boolean {
    return this.longPollingActive;
  }

  /**
   * Realiza la petición de long polling
   */
  private async _performLongPoll(): Promise<void> {
    if (!this.longPollingActive || !this.longPollingConfig) {
      return;
    }

    try {
      // Crear un nuevo AbortController para esta petición
      this.longPollingAbortController = new AbortController();
      
      const timeoutId = setTimeout(() => {
        if (this.longPollingAbortController) {
          this.longPollingAbortController.abort();
        }
      }, this.longPollingConfig.timeout);

      // Realizar la petición con timeout
      const response = await this.get<ApiResponse<NotificationData[]>>(
        this.longPollingConfig.endpoint,
        {
          signal: this.longPollingAbortController.signal
        }
      );

      clearTimeout(timeoutId);

      // Resetear contador de reintentos en caso de éxito
      this.retryCount = 0;

      // Procesar notificaciones recibidas
      if (response.success && response.data && Array.isArray(response.data)) {
        response.data.forEach(notification => {
          if (this.longPollingConfig?.onNotification) {
            this.longPollingConfig.onNotification(notification);
          }
        });
      }

      // Continuar con el siguiente long poll si sigue activo
      if (this.longPollingActive) {
        // Pequeña pausa antes del siguiente poll
        setTimeout(() => this._performLongPoll(), 100);
      }

    } catch (error: any) {
      // Si fue abortado intencionalmente, no hacer nada
      if (error.name === 'AbortError') {
        return;
      }

      console.error('[LongPolling] Error en long polling:', error);
      
      if (this.longPollingConfig?.onError) {
        this.longPollingConfig.onError(error);
      }

      // Manejar reintentos
      if (this.longPollingActive && this._shouldRetry()) {
        this.retryCount++;
        console.log(`[LongPolling] Reintentando en ${this.longPollingConfig.retryDelay}ms (intento ${this.retryCount})`);
        
        if (this.longPollingConfig?.onReconnect) {
          this.longPollingConfig.onReconnect();
        }

        setTimeout(() => this._performLongPoll(), this.longPollingConfig.retryDelay);
      } else {
        console.error('[LongPolling] Máximo de reintentos alcanzado o long polling desactivado');
        this.stopLongPolling();
      }
    }
  }

  /**
   * Determina si se debe reintentar la conexión
   */
  private _shouldRetry(): boolean {
    if (!this.longPollingConfig) return false;
    return this.longPollingConfig.maxRetries === 0 || 
           this.retryCount < (this.longPollingConfig.maxRetries || 5);
  }

  /**
   * Método de conveniencia para long polling de tareas
   */
  startTaskNotifications(onNotification: (notification: NotificationData) => void): void {
    this.startLongPolling({
      endpoint: '/api/tasks/notifications',
      timeout: 30000,
      retryDelay: 5000,
      maxRetries: 5,
      onNotification,
      onError: (error) => {
        console.error('[TaskNotifications] Error:', error);
      },
      onReconnect: () => {
        console.log('[TaskNotifications] Reconectando...');
      }
    });
  }

  /**
   * Método de conveniencia para long polling de notificaciones generales
   */
  startGeneralNotifications(onNotification: (notification: NotificationData) => void): void {
    this.startLongPolling({
      endpoint: '/api/notifications/wait',
      timeout: 25000,
      retryDelay: 3000,
      maxRetries: 10,
      onNotification,
      onError: (error) => {
        console.error('[GeneralNotifications] Error:', error);
      },
      onReconnect: () => {
        console.log('[GeneralNotifications] Reconectando...');
      }
    });
  }
}

export default FetchApi;
export type { NotificationData, LongPollingConfig };
