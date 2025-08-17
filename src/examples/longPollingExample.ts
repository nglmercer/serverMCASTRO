/**
 * Ejemplo de uso del sistema de Long Polling para notificaciones
 * 
 * Este archivo muestra diferentes formas de usar el sistema de notificaciones
 * implementado con Long Polling como alternativa a WebSockets.
 */

import { fetchapi } from '../utils/fetch/fetchapi';
import { notificationManager } from '../utils/NotificationManager';
import type { NotificationData, LongPollingConfig } from '../utils/fetch/apis/FetchApi';
import type { NotificationStrategy } from '../utils/NotificationManager';

// ============================================================================
// EJEMPLO 1: Uso básico del Long Polling directo
// ============================================================================

/**
 * Ejemplo básico de long polling para notificaciones de tareas
 */
export function basicLongPollingExample() {
  console.log('=== Ejemplo 1: Long Polling Básico ===');
  
  // Iniciar long polling para notificaciones de tareas
  fetchapi.startTaskNotifications((notification: NotificationData) => {
    console.log('📋 Nueva notificación de tarea:', notification);
    
    // Manejar diferentes tipos de notificaciones
    switch (notification.type) {
      case 'task_completed':
        console.log('✅ Tarea completada:', notification.message);
        break;
      case 'task_failed':
        console.log('❌ Tarea falló:', notification.message);
        break;
      case 'task_started':
        console.log('🚀 Tarea iniciada:', notification.message);
        break;
      default:
        console.log('📢 Notificación:', notification.message);
    }
  });
  
  // Para detener el long polling
  // fetchapi.stopLongPolling();
}

// ============================================================================
// EJEMPLO 2: Long Polling personalizado
// ============================================================================

/**
 * Ejemplo de long polling con configuración personalizada
 */
export function customLongPollingExample() {
  console.log('=== Ejemplo 2: Long Polling Personalizado ===');
  
  const config: LongPollingConfig = {
    endpoint: '/api/custom/notifications',
    timeout: 45000, // 45 segundos
    retryDelay: 3000, // 3 segundos entre reintentos
    maxRetries: 10, // máximo 10 reintentos
    onNotification: (notification: NotificationData) => {
      console.log('🔔 Notificación personalizada:', notification);
      
      // Mostrar notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.message, {
          icon: '/favicon.svg',
          body: `Tipo: ${notification.type}`,
          tag: notification.id
        });
      }
    },
    onError: (error: Error) => {
      console.error('❌ Error en long polling personalizado:', error);
    },
    onReconnect: () => {
      console.log('🔄 Reconectando long polling personalizado...');
    }
  };
  
  fetchapi.startLongPolling(config);
}

// ============================================================================
// EJEMPLO 3: Uso del NotificationManager (Recomendado)
// ============================================================================

/**
 * Ejemplo usando el NotificationManager para manejo automático de estrategias
 */
export async function notificationManagerExample() {
  console.log('=== Ejemplo 3: NotificationManager ===');
  
  // El NotificationManager ya está inicializado globalmente,
  // pero puedes crear una instancia personalizada
  
  // Verificar estado actual
  const status = notificationManager.getStatus();
  console.log('📊 Estado actual:', status);
  
  // Cambiar estrategia manualmente
  if (status.strategy !== 'longpolling') {
    console.log('🔄 Cambiando a Long Polling...');
    const success = await notificationManager.changeStrategy('longpolling');
    console.log('Cambio exitoso:', success);
  }
  
  // Verificar nuevo estado
  const newStatus = notificationManager.getStatus();
  console.log('📊 Nuevo estado:', newStatus);
}

// ============================================================================
// EJEMPLO 4: Comparación de estrategias
// ============================================================================

/**
 * Ejemplo que demuestra el cambio entre diferentes estrategias
 */
export async function strategyComparisonExample() {
  console.log('=== Ejemplo 4: Comparación de Estrategias ===');
  
  const strategies: NotificationStrategy[] = ['longpolling', 'websocket', 'polling'];
  
  for (const strategy of strategies) {
    console.log(`\n🔄 Probando estrategia: ${strategy}`);
    
    const success = await notificationManager.changeStrategy(strategy);
    const status = notificationManager.getStatus();
    
    console.log(`✅ Éxito: ${success}`);
    console.log(`📊 Estado:`, status);
    
    // Esperar un poco antes de cambiar a la siguiente estrategia
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// ============================================================================
// EJEMPLO 5: Manejo de errores y reconexión
// ============================================================================

/**
 * Ejemplo de manejo robusto de errores
 */
export function errorHandlingExample() {
  console.log('=== Ejemplo 5: Manejo de Errores ===');
  
  const config: LongPollingConfig = {
    endpoint: '/api/notifications/wait',
    timeout: 30000,
    retryDelay: 5000,
    maxRetries: 0, // Reintentos infinitos
    onNotification: (notification: NotificationData) => {
      console.log('📨 Notificación recibida:', notification);
    },
    onError: (error: Error) => {
      console.error('🚨 Error detectado:', error.message);
      
      // Manejar diferentes tipos de errores
      if (error.message.includes('fetch')) {
        console.log('🌐 Error de red, el long polling reintentará automáticamente');
      } else if (error.message.includes('timeout')) {
        console.log('⏰ Timeout alcanzado, esto es normal en long polling');
      } else {
        console.log('❓ Error desconocido:', error);
      }
    },
    onReconnect: () => {
      console.log('🔄 Reintentando conexión...');
      
      // Opcional: mostrar indicador de reconexión en la UI
      const indicator = document.getElementById('connection-status');
      if (indicator) {
        indicator.textContent = 'Reconectando...';
        indicator.className = 'status-reconnecting';
      }
    }
  };
  
  fetchapi.startLongPolling(config);
}

// ============================================================================
// EJEMPLO 6: Integración con UI
// ============================================================================

/**
 * Ejemplo de integración con elementos de la UI
 */
export function uiIntegrationExample() {
  console.log('=== Ejemplo 6: Integración con UI ===');
  
  // Crear indicador de estado en la UI
  const createStatusIndicator = () => {
    const indicator = document.createElement('div');
    indicator.id = 'notification-status';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      z-index: 1000;
    `;
    document.body.appendChild(indicator);
    return indicator;
  };
  
  const indicator = createStatusIndicator();
  
  const updateStatus = (status: string, color: string) => {
    indicator.textContent = status;
    indicator.style.backgroundColor = color;
  };
  
  // Configurar long polling con indicadores visuales
  fetchapi.startLongPolling({
    endpoint: '/api/notifications/wait',
    timeout: 30000,
    onNotification: (notification: NotificationData) => {
      updateStatus('✅ Conectado', '#4CAF50');
      
      // Mostrar notificación temporal
      const toast = document.createElement('div');
      toast.textContent = notification.message;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px;
        border-radius: 4px;
        z-index: 1001;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    },
    onError: (error: Error) => {
      updateStatus('❌ Error', '#F44336');
    },
    onReconnect: () => {
      updateStatus('🔄 Reconectando...', '#FF9800');
    }
  });
  
  // Estado inicial
  updateStatus('🔄 Conectando...', '#2196F3');
}

// ============================================================================
// FUNCIONES DE UTILIDAD PARA TESTING
// ============================================================================

/**
 * Función para probar todas las estrategias disponibles
 */
export async function testAllStrategies() {
  console.log('🧪 Probando todas las estrategias disponibles...');
  
  const strategies: NotificationStrategy[] = ['longpolling', 'websocket', 'polling'];
  const results: Record<NotificationStrategy, boolean> = {} as any;
  
  for (const strategy of strategies) {
    try {
      console.log(`\n🔍 Probando ${strategy}...`);
      const success = await notificationManager.changeStrategy(strategy);
      results[strategy] = success;
      
      if (success) {
        console.log(`✅ ${strategy} funciona correctamente`);
        // Esperar un poco para verificar la conexión
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = notificationManager.getStatus();
        console.log(`📊 Estado: conectado=${status.isConnected}`);
      } else {
        console.log(`❌ ${strategy} falló`);
      }
    } catch (error) {
      console.error(`💥 Error probando ${strategy}:`, error);
      results[strategy] = false;
    }
  }
  
  console.log('\n📋 Resumen de pruebas:');
  Object.entries(results).forEach(([strategy, success]) => {
    console.log(`  ${strategy}: ${success ? '✅' : '❌'}`);
  });
  
  return results;
}

/**
 * Función para limpiar todas las conexiones
 */
export function cleanup() {
  console.log('🧹 Limpiando conexiones...');
  notificationManager.stop();
  fetchapi.stopLongPolling();
  
  // Limpiar indicadores de UI si existen
  const indicator = document.getElementById('notification-status');
  if (indicator) {
    indicator.remove();
  }
}

// ============================================================================
// EXPORTAR FUNCIONES PARA USO EN CONSOLA DEL NAVEGADOR
// ============================================================================

// Hacer las funciones disponibles globalmente para testing
if (typeof window !== 'undefined') {
  (window as any).longPollingExamples = {
    basic: basicLongPollingExample,
    custom: customLongPollingExample,
    manager: notificationManagerExample,
    comparison: strategyComparisonExample,
    errorHandling: errorHandlingExample,
    uiIntegration: uiIntegrationExample,
    testAll: testAllStrategies,
    cleanup: cleanup
  };
  
  console.log('🎯 Ejemplos de Long Polling disponibles en: window.longPollingExamples');
  console.log('💡 Prueba: longPollingExamples.basic() para empezar');
}