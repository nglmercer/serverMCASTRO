// src/components/NotificationContent.tsx
import { createSignal, Show, Switch, Match, onMount, onCleanup, type Component, For } from 'solid-js';
import type { 
  NotificationContentProps, 
  NotificationControls, 
  NotificationType, 
  NotificationTypeConfig,
  NotificationState,
  NotificationButton
} from 'src/types/Notification';
import './NotificationContent.css';

const notificationTypeConfigs: Record<NotificationType, NotificationTypeConfig> = {
  success: { icon: 'check_circle', color: 'green', defaultTitle: 'Éxito' },
  error: { icon: 'error', color: 'red', defaultTitle: 'Error' },
  warning: { icon: 'warning', color: 'orange', defaultTitle: 'Advertencia' },
  info: { icon: 'info', color: 'blue', defaultTitle: 'Información' },
  loading: { icon: 'progress_circular', color: 'gray', defaultTitle: 'Cargando...' },
};

// --- Augment window object ---
declare global {
  interface Window {
    astroAppNotifications?: {
      [id: string]: NotificationControls;
    };
  }
}

const NotificationContent: Component<NotificationContentProps> = (props) => {
  const [notification, setNotification] = createSignal<NotificationState>(
    props.initialState || {
      type: 'info',
      title: notificationTypeConfigs.info.defaultTitle,
      message: 'Notificación lista.',
      icon: notificationTypeConfigs.info.icon,
      buttons: [] // Por defecto no hay botones
    }
  );

  // --- Métodos para controlar el estado ---

  const getTitle = (): string => notification().title;
  const setTitle = (newTitle: string): void => {
    setNotification(prev => ({ ...prev, title: newTitle }));
  };

  const getMessage = (): string => notification().message;
  const setMessage = (newMessage: string): void => {
    setNotification(prev => ({ ...prev, message: newMessage }));
  };

  const getIcon = (): string => {
    // Prioriza el icono personalizado, luego el del tipo actual
    return notification().icon || notificationTypeConfigs[notification().type]?.icon || 'help_outline';
  };
  const setIcon = (newIconName: string): void => {
    // Esto solo cambia el string del icono, no afecta el color ni el título por defecto del tipo
    setNotification(prev => ({ ...prev, icon: newIconName }));
  };

  const getType = (): NotificationType => notification().type;
  const setType = (
    type: NotificationType,
    message?: string,
    title?: string,
    customIcon?: string
  ): void => {
    const typeConfig = notificationTypeConfigs[type] || notificationTypeConfigs.info;
    setNotification(prev => ({
      ...prev,
      type,
      title: title || typeConfig.defaultTitle,
      message: message || prev.message, // Conserva el mensaje actual si no se provee uno nuevo
      icon: customIcon || typeConfig.icon,
    }));
  };

  // --- Nuevos métodos para manejar botones ---
  const getButtons = (): NotificationButton[] => notification().buttons || [];
  
  const addButton = (button: NotificationButton): void => {
    setNotification(prev => ({
      ...prev,
      buttons: [...(prev.buttons || []), button]
    }));
  };
  
  const removeAllButtons = (): void => {
    setNotification(prev => ({
      ...prev,
      buttons: []
    }));
  };

  // --- Montaje y Limpieza para exponer la API ---
  onMount(() => {
    if (typeof window !== 'undefined') {
      if (!window.astroAppNotifications) {
        window.astroAppNotifications = {};
      }
      // Asegurarse de que el ID es único o manejar colisiones si es necesario
      if (window.astroAppNotifications[props.id]) {
        console.warn(`NotificationContent: API para el ID '${props.id}' ya existe. Sobrescribiendo.`);
      }
      window.astroAppNotifications[props.id] = {
        getTitle,
        setTitle,
        getMessage,
        setMessage,
        getIcon,
        setIcon,
        getType,
        setType,
        // Nuevos métodos para botones
        getButtons,
        addButton,
        removeAllButtons
      };
      console.log(`NotificationContent API expuesta en window.astroAppNotifications['${props.id}']`);
    }
  });

  onCleanup(() => {
    if (typeof window !== 'undefined' && window.astroAppNotifications && window.astroAppNotifications[props.id]) {
      delete window.astroAppNotifications[props.id];
      if (Object.keys(window.astroAppNotifications).length === 0) {
        delete window.astroAppNotifications; // Limpiar el objeto principal si está vacío
      }
      console.log(`NotificationContent API removida de window.astroAppNotifications['${props.id}']`);
    }
  });

  // --- Lógica de Renderizado ---
  const currentTypeConfig = (): NotificationTypeConfig =>
    notificationTypeConfigs[notification().type] || notificationTypeConfigs.info;

  // El icono a mostrar es el `notification().icon` si existe, sino el del tipo
  const displayIcon = (): string => getIcon();

  return (
    <div class={`notification-content type-${notification().type}`}>
      <div class="notification-icon-container" style={{ color: currentTypeConfig().color }}>
        <Switch>
          <Match when={notification().type === 'loading'}>
            <span class="material-symbols-outlined notification-icon loading-icon">
              {displayIcon()}
            </span>
          </Match>
          <Match when={true}>
            <span class="material-symbols-outlined notification-icon">
              {displayIcon()}
            </span>
          </Match>
        </Switch>
      </div>
      <div class="notification-text-container">
        <h2 class="notification-title">{notification().title}</h2>
        <p class="notification-message">{notification().message}</p>
        
        <Show when={(notification().buttons && Array.isArray(notification().buttons))}>
          <div class="notification-buttons">
            <For each={notification().buttons}>
              {(button) => (
                <button 
                  class={`notification-button ${button.class || ''}`} 
                  onClick={button.onClick}
                >
                  {button.text}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default NotificationContent;