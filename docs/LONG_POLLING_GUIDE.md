# Guía de Long Polling para Notificaciones

Esta guía explica cómo usar el sistema de Long Polling implementado como alternativa a WebSockets para recibir notificaciones en tiempo real.

## 📋 Tabla de Contenidos

- [¿Qué es Long Polling?](#qué-es-long-polling)
- [Ventajas vs WebSockets](#ventajas-vs-websockets)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Uso Básico](#uso-básico)
- [Configuración Avanzada](#configuración-avanzada)
- [NotificationManager](#notificationmanager)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Troubleshooting](#troubleshooting)

## ¿Qué es Long Polling?

Long Polling es una técnica que simula comunicación en tiempo real usando HTTP tradicional. El cliente hace una petición al servidor y el servidor mantiene la conexión abierta hasta que tiene datos para enviar o se alcanza un timeout.

### Flujo de Long Polling:

```
Cliente                    Servidor
   |                          |
   |-------- Request -------->|
   |                          | (espera hasta tener datos
   |                          |  o timeout)
   |<------- Response --------|
   |                          |
   |-------- Request -------->| (inmediatamente)
   |                          |
```

## Ventajas vs WebSockets

### ✅ Ventajas del Long Polling:
- **Compatibilidad**: Funciona con cualquier servidor HTTP
- **Firewalls**: Menos problemas con proxies y firewalls corporativos
- **Simplicidad**: Usa HTTP estándar, más fácil de debuggear
- **Fallback**: Excelente como respaldo cuando WebSockets fallan

### ❌ Desventajas:
- **Overhead**: Más overhead de HTTP headers
- **Unidireccional**: Solo servidor → cliente (como SSE)
- **Recursos**: Mantiene conexiones HTTP abiertas

## Arquitectura del Sistema

El sistema implementado tiene tres capas:

```
┌─────────────────────────────────────┐
│           Layout.astro              │
│     (Inicialización automática)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        NotificationManager          │
│    (Manejo de múltiples estrategias) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│           FetchApi                  │
│      (Implementación Long Polling)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│           BaseApi                   │
│        (HTTP Client base)           │
└─────────────────────────────────────┘
```

## Uso Básico

### 1. Importar las clases necesarias

```typescript
import { fetchapi } from '../utils/fetch/fetchapi';
import type { NotificationData } from '../utils/fetch/apis/FetchApi';
```

### 2. Iniciar Long Polling simple

```typescript
// Para notificaciones de tareas
fetchapi.startTaskNotifications((notification: NotificationData) => {
  console.log('Nueva notificación:', notification);
  
  // Manejar la notificación
  switch (notification.type) {
    case 'task_completed':
      console.log('✅ Tarea completada:', notification.message);
      break;
    case 'task_failed':
      console.log('❌ Tarea falló:', notification.message);
      break;
  }
});
```

### 3. Detener Long Polling

```typescript
fetchapi.stopLongPolling();
```

## Configuración Avanzada

### Configuración personalizada

```typescript
import type { LongPollingConfig } from '../utils/fetch/apis/FetchApi';

const config: LongPollingConfig = {
  endpoint: '/api/custom/notifications',
  timeout: 45000,        // 45 segundos
  retryDelay: 3000,      // 3 segundos entre reintentos
  maxRetries: 10,        // máximo 10 reintentos (0 = infinito)
  onNotification: (notification) => {
    console.log('📨 Notificación:', notification);
  },
  onError: (error) => {
    console.error('❌ Error:', error);
  },
  onReconnect: () => {
    console.log('🔄 Reconectando...');
  }
};

fetchapi.startLongPolling(config);
```

### Parámetros de configuración

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `endpoint` | string | - | Endpoint de la API para long polling |
| `timeout` | number | 30000 | Timeout en ms para cada petición |
| `retryDelay` | number | 5000 | Delay entre reintentos en ms |
| `maxRetries` | number | 5 | Máximo reintentos (0 = infinito) |
| `onNotification` | function | - | Callback para notificaciones |
| `onError` | function | - | Callback para errores |
| `onReconnect` | function | - | Callback para reconexiones |

## NotificationManager

El `NotificationManager` proporciona una capa de abstracción que maneja múltiples estrategias de notificación automáticamente.

### Uso del NotificationManager

```typescript
import { notificationManager } from '../utils/NotificationManager';

// El manager se inicializa automáticamente en Layout.astro
// pero puedes controlarlo manualmente:

// Verificar estado
const status = notificationManager.getStatus();
console.log('Estado:', status);
// Output: { strategy: 'longpolling', isActive: true, isConnected: true }

// Cambiar estrategia
const success = await notificationManager.changeStrategy('websocket');
console.log('Cambio exitoso:', success);

// Detener
notificationManager.stop();
```

### Estrategias disponibles

1. **`longpolling`** - Long Polling (recomendado)
2. **`websocket`** - WebSockets tradicionales
3. **`polling`** - Polling tradicional (fallback)

### Funciones globales disponibles

En el navegador, tienes acceso a estas funciones globales:

```javascript
// Cambiar estrategia
window.changeNotificationStrategy('longpolling');

// Obtener estado
window.getNotificationStatus();
```

## Ejemplos Prácticos

### Ejemplo 1: Notificaciones con UI

```typescript
fetchapi.startLongPolling({
  endpoint: '/api/notifications/wait',
  onNotification: (notification) => {
    // Mostrar notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.message, {
        icon: '/favicon.svg',
        body: `Tipo: ${notification.type}`
      });
    }
    
    // Actualizar UI
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = '🔔';
      badge.style.display = 'block';
    }
  },
  onError: (error) => {
    // Mostrar indicador de error
    const indicator = document.getElementById('connection-status');
    if (indicator) {
      indicator.textContent = '❌ Desconectado';
      indicator.className = 'status-error';
    }
  }
});
```

### Ejemplo 2: Manejo robusto de errores

```typescript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

fetchapi.startLongPolling({
  endpoint: '/api/notifications/wait',
  maxRetries: 0, // Reintentos infinitos en el long polling
  onNotification: (notification) => {
    reconnectAttempts = 0; // Reset en éxito
    console.log('✅ Notificación recibida:', notification);
  },
  onError: (error) => {
    console.error('❌ Error en long polling:', error);
    
    // Manejar diferentes tipos de errores
    if (error.message.includes('NetworkError')) {
      console.log('🌐 Error de red detectado');
    }
  },
  onReconnect: () => {
    reconnectAttempts++;
    console.log(`🔄 Reintento ${reconnectAttempts}/${maxReconnectAttempts}`);
    
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('❌ Máximo de reintentos alcanzado, cambiando a polling');
      notificationManager.changeStrategy('polling');
    }
  }
});
```

### Ejemplo 3: Testing de estrategias

```typescript
// Probar todas las estrategias disponibles
async function testStrategies() {
  const strategies = ['longpolling', 'websocket', 'polling'];
  
  for (const strategy of strategies) {
    console.log(`🧪 Probando ${strategy}...`);
    
    const success = await notificationManager.changeStrategy(strategy);
    const status = notificationManager.getStatus();
    
    console.log(`${strategy}: ${success ? '✅' : '❌'} (conectado: ${status.isConnected})`);
    
    // Esperar antes de probar la siguiente
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testStrategies();
```

## Troubleshooting

### Problemas comunes

#### 1. Long Polling no se conecta

```typescript
// Verificar estado
const status = notificationManager.getStatus();
console.log('Estado actual:', status);

// Si no está conectado, intentar manualmente
if (!status.isConnected) {
  await notificationManager.changeStrategy('longpolling');
}
```

#### 2. Demasiados reintentos

```typescript
// Configurar reintentos más conservadores
fetchapi.startLongPolling({
  endpoint: '/api/notifications/wait',
  timeout: 60000,     // Timeout más largo
  retryDelay: 10000,  // Más tiempo entre reintentos
  maxRetries: 3       // Menos reintentos
});
```

#### 3. Problemas de memoria

```typescript
// Asegurarse de limpiar al salir
window.addEventListener('beforeunload', () => {
  notificationManager.stop();
});

// O limpiar manualmente
fetchapi.stopLongPolling();
```

### Debug y logging

```typescript
// Habilitar debug en NotificationManager
import { NotificationManager } from '../utils/NotificationManager';

const debugManager = new NotificationManager({
  strategy: 'longpolling',
  debug: true // Habilita logging detallado
});

await debugManager.initialize();
```

### Verificar conectividad

```typescript
// Función para verificar si el endpoint está disponible
async function checkEndpoint(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(endpoint, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Endpoint no disponible:', error);
    return false;
  }
}

// Usar antes de iniciar long polling
const isAvailable = await checkEndpoint('/api/notifications/wait');
if (isAvailable) {
  fetchapi.startLongPolling({ endpoint: '/api/notifications/wait' });
} else {
  console.log('Endpoint no disponible, usando polling tradicional');
  notificationManager.changeStrategy('polling');
}
```

## 🎯 Ejemplos Interactivos

Puedes probar el sistema directamente en la consola del navegador:

```javascript
// Cargar ejemplos
import('../examples/longPollingExample');

// Usar ejemplos
longPollingExamples.basic();        // Ejemplo básico
longPollingExamples.custom();       // Configuración personalizada
longPollingExamples.testAll();      // Probar todas las estrategias
longPollingExamples.cleanup();      // Limpiar conexiones
```

## 📚 Referencias

- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN - AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Long Polling vs WebSockets](https://ably.com/blog/websockets-vs-long-polling)

---

**💡 Tip**: Para la mayoría de casos de uso, el `NotificationManager` con estrategia `longpolling` es la mejor opción, ya que proporciona un buen balance entre rendimiento y compatibilidad.