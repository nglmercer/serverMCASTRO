<template>
  <div :class="`notification-content type-${notification.type}`">
    <div class="notification-icon-container" :style="{ color: currentTypeConfig.color }">
      <span 
        :class="[
          'material-symbols-outlined', 
          'notification-icon',
          { 'loading-icon': notification.type === 'loading' }
        ]"
      >
        {{ displayIcon }}
      </span>
    </div>
    <div class="notification-text-container">
      <h2 class="notification-title">{{ notification.title }}</h2>
      <p class="notification-message">{{ notification.message }}</p>
      
      <div v-if="notification.buttons && notification.buttons.length > 0" class="notification-buttons">
        <button 
          v-for="(button, index) in notification.buttons"
          :key="index"
          :class="`notification-button ${button.class || ''}`" 
          @click="button.onClick"
        >
          {{ button.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineExpose } from 'vue'
import type { 
  NotificationContentProps, 
  NotificationControls, 
  NotificationType, 
  NotificationTypeConfig,
  NotificationState,
  NotificationButton
} from '../../../types/Notification'
import { emitter } from '../../../utils/Emitter'

// Props
interface Props {
  id: string
  initialState?: NotificationState
}

const props = withDefaults(defineProps<Props>(), {
  initialState: () => ({
    type: 'info',
    title: 'Información',
    message: 'Notificación lista.',
    icon: 'info',
    buttons: []
  })
})

// Configuraciones de tipos de notificación
const notificationTypeConfigs: Record<NotificationType, NotificationTypeConfig> = {
  success: { icon: 'check_circle', color: 'green', defaultTitle: 'Éxito' },
  error: { icon: 'error', color: 'red', defaultTitle: 'Error' },
  warning: { icon: 'warning', color: 'orange', defaultTitle: 'Advertencia' },
  info: { icon: 'info', color: 'blue', defaultTitle: 'Información' },
  loading: { icon: 'progress_activity', color: 'gray', defaultTitle: 'Cargando...' },
}

// Estado reactivo
const notification = ref<NotificationState>(
  props.initialState || {
    type: 'info',
    title: notificationTypeConfigs.info.defaultTitle,
    message: 'Notificación lista.',
    icon: notificationTypeConfigs.info.icon,
    buttons: []
  }
)

// Computed properties
const currentTypeConfig = computed((): NotificationTypeConfig =>
  notificationTypeConfigs[notification.value.type] || notificationTypeConfigs.info
)

const displayIcon = computed((): string => 
  notification.value.icon || currentTypeConfig.value.icon || 'help_outline'
)

// --- Métodos para controlar el estado ---
const getTitle = (): string => notification.value.title

const setTitle = (newTitle: string): void => {
  notification.value.title = newTitle
}

const getMessage = (): string => notification.value.message

const setMessage = (newMessage: string): void => {
  notification.value.message = newMessage
}

const getIcon = (): string => displayIcon.value

const setIcon = (newIconName: string): void => {
  notification.value.icon = newIconName
}

const getType = (): NotificationType => notification.value.type

const setType = (
  type: NotificationType,
  message?: string,
  title?: string,
  customIcon?: string
): void => {
  const typeConfig = notificationTypeConfigs[type] || notificationTypeConfigs.info
  notification.value = {
    ...notification.value,
    type,
    title: title || typeConfig.defaultTitle,
    message: message || notification.value.message,
    icon: customIcon || typeConfig.icon,
  }
}

// --- Métodos para manejar botones ---
const getButtons = (): NotificationButton[] => notification.value.buttons || []

const addButton = (button: NotificationButton): void => {
  if (!notification.value.buttons) {
    notification.value.buttons = []
  }
  notification.value.buttons.push(button)
}

const removeAllButtons = (): void => {
  notification.value.buttons = []
}

// API de controles que se expondrá via emitter
const notificationControls: NotificationControls = {
  getTitle,
  setTitle,
  getMessage,
  setMessage,
  getIcon,
  setIcon,
  getType,
  setType,
  getButtons,
  addButton,
  removeAllButtons
}

// Eventos del emitter
const NOTIFICATION_EVENTS = {
  GET_API: `notification:get-api:${props.id}`,
  API_READY: `notification:api-ready`,
  REQUEST_API: `notification:request-api`
}

// Función para manejar solicitudes de API
const handleApiRequest = (callback: (api: NotificationControls) => void) => {
  if (typeof callback === 'function') {
    callback(notificationControls)
  }
}

// Lifecycle hooks
onMounted(() => {
  // Registrar el listener para solicitudes de API específicas de este componente
  emitter.on(NOTIFICATION_EVENTS.GET_API, handleApiRequest)

  // Emitir que la API está lista con el formato esperado por el manager
  emitter.emit(NOTIFICATION_EVENTS.API_READY, {
    id: props.id,
    api: notificationControls
  })
  
  console.log(`NotificationContent Vue API registrada para ID: ${props.id}`)
})

onUnmounted(() => {
  // Limpiar el listener específico de este componente
  emitter.off(NOTIFICATION_EVENTS.GET_API, handleApiRequest)
  
  console.log(`NotificationContent Vue API removida para ID: ${props.id}`)
})

// Exponer métodos para uso directo del componente
defineExpose({
  ...notificationControls,
  notification: computed(() => notification.value)
})
</script>

<style scoped>
@import './NotificationContent.css';
</style>