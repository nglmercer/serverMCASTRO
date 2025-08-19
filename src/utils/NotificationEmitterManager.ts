import { emitter } from './Emitter'
import type { NotificationControls } from '../types/Notification'

/**
 * Manager de notificaciones que usa emitters para comunicarse con los componentes
 * Reemplaza el uso de window.astroAppNotifications con un sistema basado en eventos
 */
export class NotificationEmitterManager {
  private registeredNotifications: Map<string, NotificationControls> = new Map()
  private pendingRequests: Map<string, ((api: NotificationControls) => void)[]> = new Map()

  constructor() {
    this.setupGlobalListeners()
  }

  /**
   * Configura los listeners globales para manejar las APIs de notificaciones
   */
  private setupGlobalListeners(): void {
    // Escuchar cuando una notificación está lista
    emitter.on('notification:api-ready', (data: { id: string; api: NotificationControls }) => {
      if (typeof data === 'object' && data.id && data.api) {
        this.registerNotification(data.id, data.api)
      }
    })

    // Escuchar cuando se solicita una API específica
    emitter.on('notification:request-api', (data: { id: string; callback: (api: NotificationControls) => void }) => {
      if (typeof data === 'object' && data.id && typeof data.callback === 'function') {
        this.getNotificationApi(data.id, data.callback)
      }
    })
  }

  /**
   * Registra una API de notificación
   */
  private registerNotification(id: string, api: NotificationControls): void {
    this.registeredNotifications.set(id, api)
    
    // Resolver cualquier solicitud pendiente para esta notificación
    const pendingCallbacks = this.pendingRequests.get(id)
    if (pendingCallbacks) {
      pendingCallbacks.forEach(callback => callback(api))
      this.pendingRequests.delete(id)
    }

    console.log(`NotificationEmitterManager: API registrada para '${id}'`)
  }

  /**
   * Obtiene la API de una notificación específica
   */
  private getNotificationApi(id: string, callback: (api: NotificationControls) => void): void {
    const api = this.registeredNotifications.get(id)
    
    if (api) {
      // La API ya está disponible
      callback(api)
    } else {
      // Agregar a solicitudes pendientes
      if (!this.pendingRequests.has(id)) {
        this.pendingRequests.set(id, [])
      }
      this.pendingRequests.get(id)!.push(callback)
      
      // Solicitar la API al componente
      emitter.emit(`notification:get-api:${id}`, callback)
    }
  }

  /**
   * Método público para obtener la API de una notificación
   * Reemplaza el acceso directo a window.astroAppNotifications
   */
  public async getNotifierApi(id: string): Promise<NotificationControls> {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 50 // ~5 segundos
      
      const tryGetApi = () => {
        const api = this.registeredNotifications.get(id)
        
        if (api) {
          resolve(api)
        } else if (attempts++ > maxAttempts) {
          reject(new Error(`API para el notificador con ID '${id}' no encontrada tras ${maxAttempts} intentos.`))
        } else {
          // Solicitar la API
          this.getNotificationApi(id, (foundApi) => {
            resolve(foundApi)
          })
          
          // Reintentar en 100ms si no se encuentra
          setTimeout(tryGetApi, 100)
        }
      }
      
      tryGetApi()
    })
  }

  /**
   * Método de conveniencia para mostrar un diálogo con mensaje
   * Reemplaza la función showDialogWithMessage del código original
   */
  public async showDialogWithMessage(
    notificationId: string, 
    action: (notifier: NotificationControls) => void,
    dialogSelector?: string
  ): Promise<void> {
    try {
      const notifier = await this.getNotifierApi(notificationId)
      
      if (!notifier) {
        console.error(`La API de notificación '${notificationId}' no está disponible`)
        return
      }

      // Ejecutar la acción con el notificador
      await action(notifier)

      // Mostrar el diálogo si se proporciona un selector
      if (dialogSelector) {
        const dialog = document.querySelector(dialogSelector) as any
        if (dialog && typeof dialog.show === 'function') {
          dialog.show()
        }
      }
    } catch (error) {
      console.error('Error al mostrar diálogo con mensaje:', error)
    }
  }

  /**
   * Limpia una notificación registrada
   */
  public unregisterNotification(id: string): void {
    this.registeredNotifications.delete(id)
    this.pendingRequests.delete(id)
    console.log(`NotificationEmitterManager: API removida para '${id}'`)
  }

  /**
   * Obtiene todas las notificaciones registradas
   */
  public getRegisteredNotifications(): string[] {
    return Array.from(this.registeredNotifications.keys())
  }

  /**
   * Limpia todas las notificaciones registradas
   */
  public clear(): void {
    this.registeredNotifications.clear()
    this.pendingRequests.clear()
  }
}

// Instancia global del manager
export const notificationManager = new NotificationEmitterManager()

// Función de conveniencia para mantener compatibilidad con el código existente
export async function getNotifierApi(id: string): Promise<NotificationControls> {
  return notificationManager.getNotifierApi(id)
}

// Función de conveniencia para mostrar diálogos
export async function showDialogWithMessage(
  notificationId: string,
  action: (notifier: NotificationControls) => void,
  dialogSelector?: string
): Promise<void> {
  return notificationManager.showDialogWithMessage(notificationId, action, dialogSelector)
}

export default notificationManager