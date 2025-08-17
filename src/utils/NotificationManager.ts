import { fetchapi } from './fetch/fetchapi';
import type { NotificationData } from './fetch/apis/FetchApi';
import type { TasksObject } from '../types/task';
import { TaskNotifications } from '../litcomponents/notify';
import { scheduleUpdate } from '../fetch/request';
import { getBackups } from '../components/main/backups/backup.js';

/**
 * Tipos de estrategias de notificación disponibles
 */
export type NotificationStrategy = 'websocket' | 'longpolling' | 'polling';

/**
 * Configuración para el manager de notificaciones
 */
interface NotificationManagerConfig {
  strategy?: NotificationStrategy;
  pollingInterval?: number;
  fallbackStrategy?: NotificationStrategy;
  debug?: boolean;
}

/**
 * Manager de notificaciones que soporta múltiples estrategias
 */
export class NotificationManager {
  private currentStrategy: NotificationStrategy;
  private isActive: boolean = false;
  private pollingInterval?: number;
  private pollingTimer?: number;
  private notifications?: TaskNotifications;
  private config: Required<NotificationManagerConfig>;
  private wsClient?: any; // Para WebSocket cuando esté disponible

  constructor(config: NotificationManagerConfig = {}) {
    this.config = {
      strategy: 'longpolling',
      pollingInterval: 10000, // 10 segundos
      fallbackStrategy: 'polling',
      debug: false,
      ...config
    };
    
    this.currentStrategy = this.config.strategy;
    this.pollingInterval = this.config.pollingInterval;
    
    if (this.config.debug) {
      console.log('[NotificationManager] Inicializado con estrategia:', this.currentStrategy);
    }
  }

  /**
   * Inicializa el manager de notificaciones
   */
  async initialize(): Promise<void> {
    // Obtener referencia al componente de notificaciones
    this.notifications = document.querySelector('task-notifications') as TaskNotifications;
    
    if (!this.notifications) {
      console.warn('[NotificationManager] Componente task-notifications no encontrado');
      return;
    }

    // Intentar inicializar con la estrategia preferida
    const success = await this.tryStrategy(this.currentStrategy);
    
    if (!success && this.config.fallbackStrategy !== this.currentStrategy) {
      console.warn(`[NotificationManager] Estrategia ${this.currentStrategy} falló, intentando fallback: ${this.config.fallbackStrategy}`);
      this.currentStrategy = this.config.fallbackStrategy;
      await this.tryStrategy(this.currentStrategy);
    }
  }

  /**
   * Intenta inicializar una estrategia específica
   */
  private async tryStrategy(strategy: NotificationStrategy): Promise<boolean> {
    try {
      switch (strategy) {
        case 'websocket':
          return await this.initializeWebSocket();
        case 'longpolling':
          return await this.initializeLongPolling();
        case 'polling':
          return await this.initializePolling();
        default:
          console.error('[NotificationManager] Estrategia desconocida:', strategy);
          return false;
      }
    } catch (error) {
      console.error(`[NotificationManager] Error inicializando ${strategy}:`, error);
      return false;
    }
  }

  /**
   * Inicializa WebSocket (requiere importar el cliente)
   */
  private async initializeWebSocket(): Promise<boolean> {
    try {
      // Importar dinámicamente el cliente WebSocket
      const { default: wsClient } = await import('./socketManager');
      this.wsClient = wsClient;
      
      return new Promise((resolve) => {
        wsClient.connect({
          onOpen: () => {
            this.isActive = true;
            if (this.config.debug) {
              console.log('[NotificationManager] WebSocket conectado');
            }
            resolve(true);
          },
          onMessage: (message: any) => {
            this.handleWebSocketMessage(message);
          },
          onClose: () => {
            this.isActive = false;
            if (this.config.debug) {
              console.log('[NotificationManager] WebSocket desconectado');
            }
          },
          onError: (error: any) => {
            console.error('[NotificationManager] Error WebSocket:', error);
            resolve(false);
          }
        });
        
        // Timeout para la conexión
        setTimeout(() => {
          if (!this.isActive) {
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('[NotificationManager] Error cargando WebSocket:', error);
      return false;
    }
  }

  /**
   * Inicializa Long Polling
   */
  private async initializeLongPolling(): Promise<boolean> {
    try {
      fetchapi.startTaskNotifications((notification: NotificationData) => {
        this.handleNotification(notification);
      });
      
      this.isActive = true;
      if (this.config.debug) {
        console.log('[NotificationManager] Long Polling iniciado');
      }
      return true;
    } catch (error) {
      console.error('[NotificationManager] Error iniciando Long Polling:', error);
      return false;
    }
  }

  /**
   * Inicializa Polling tradicional
   */
  private async initializePolling(): Promise<boolean> {
    try {
      this.startPolling();
      this.isActive = true;
      if (this.config.debug) {
        console.log('[NotificationManager] Polling tradicional iniciado');
      }
      return true;
    } catch (error) {
      console.error('[NotificationManager] Error iniciando Polling:', error);
      return false;
    }
  }

  /**
   * Inicia el polling tradicional
   */
  private startPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }

    this.pollingTimer = window.setInterval(async () => {
      try {
        await this.updateNotifications();
      } catch (error) {
        console.error('[NotificationManager] Error en polling:', error);
      }
    }, this.pollingInterval);

    // Ejecutar inmediatamente
    this.updateNotifications();
  }

  /**
   * Maneja mensajes de WebSocket
   */
  private handleWebSocketMessage(message: any): void {
    if (!message || !message.event) return;
    
    if (message.event.startsWith('task')) {
      scheduleUpdate(async () => {
        try {
          await this.updateNotifications();
        } catch (error) {
          console.error('[NotificationManager] Error actualizando notificaciones:', error);
        }
      });
    }
  }

  /**
   * Maneja notificaciones de Long Polling
   */
  private handleNotification(notification: NotificationData): void {
    if (this.config.debug) {
      console.log('[NotificationManager] Notificación recibida:', notification);
    }

    // Si es una notificación de tarea, actualizar
    if (notification.type.startsWith('task')) {
      scheduleUpdate(async () => {
        try {
          await this.updateNotifications();
        } catch (error) {
          console.error('[NotificationManager] Error actualizando notificaciones:', error);
        }
      });
    }
  }

  /**
   * Actualiza las notificaciones desde la API
   */
  private async updateNotifications(): Promise<void> {
    if (!this.notifications) return;

    try {
      const result = await fetchapi.get<{ success: boolean; data: TasksObject }>('/api/tasks');
      
      if (result.success && this.isTasksObject(result.data)) {
        if (this.config.debug) {
          console.log('[NotificationManager] Tareas actualizadas:', result.data);
        }
        
        this.notifications.updateTasks(result.data);
        
        // Si no hay tareas, obtener backups
        const isEmpty = Object.keys(result.data).length === 0 && result.data.constructor === Object;
        if (isEmpty) {
          getBackups();
        }
      }
    } catch (error) {
      console.error('[NotificationManager] Error obteniendo tareas:', error);
    }
  }

  /**
   * Verifica si el objeto es del tipo TasksObject
   */
  private isTasksObject(obj: any): obj is TasksObject {
    return typeof obj === 'object' && obj !== null && 
           Object.values(obj).every(value => typeof value !== 'undefined');
  }

  /**
   * Cambia la estrategia de notificaciones
   */
  async changeStrategy(strategy: NotificationStrategy): Promise<boolean> {
    if (strategy === this.currentStrategy) {
      return true;
    }

    // Detener la estrategia actual
    this.stop();
    
    // Cambiar a la nueva estrategia
    this.currentStrategy = strategy;
    const success = await this.tryStrategy(strategy);
    
    if (this.config.debug) {
      console.log(`[NotificationManager] Cambio de estrategia a ${strategy}:`, success ? 'exitoso' : 'fallido');
    }
    
    return success;
  }

  /**
   * Detiene el manager de notificaciones
   */
  stop(): void {
    this.isActive = false;
    
    // Detener WebSocket
    if (this.wsClient && typeof this.wsClient.close === 'function') {
      this.wsClient.close();
    }
    
    // Detener Long Polling
    if (fetchapi.isLongPollingActive()) {
      fetchapi.stopLongPolling();
    }
    
    // Detener Polling tradicional
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }
    
    if (this.config.debug) {
      console.log('[NotificationManager] Detenido');
    }
  }

  /**
   * Obtiene el estado actual del manager
   */
  getStatus(): {
    strategy: NotificationStrategy;
    isActive: boolean;
    isConnected: boolean;
  } {
    let isConnected = false;
    
    switch (this.currentStrategy) {
      case 'websocket':
        isConnected = this.wsClient?.isOpen() || false;
        break;
      case 'longpolling':
        isConnected = fetchapi.isLongPollingActive();
        break;
      case 'polling':
        isConnected = !!this.pollingTimer;
        break;
    }
    
    return {
      strategy: this.currentStrategy,
      isActive: this.isActive,
      isConnected
    };
  }
}

// Instancia global del manager
export const notificationManager = new NotificationManager({
  strategy: 'longpolling',
  fallbackStrategy: 'polling',
  debug: import.meta.env.MODE === 'development'
});

// Inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    notificationManager.initialize();
  });
}