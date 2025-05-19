// --- Type Definitions ---
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationState {
  type: NotificationType;
  title: string;
  message: string;
  icon?: string; // Icono personalizado, si no se usa el del tipo
}

export interface NotificationTypeConfig {
  icon: string;
  color: string;
  defaultTitle: string;
}



export interface NotificationContentProps {
  id: string; // ID único para este componente, usado para la API en window
  initialState?: NotificationState;
}

// --- API que se expondrá en window ---
export interface NotificationControls {
  getTitle: () => string;
  setTitle: (newTitle: string) => void;
  getMessage: () => string;
  setMessage: (newMessage: string) => void;
  getIcon: () => string;
  setIcon: (newIconName: string) => void; // Solo cambia el nombre del icono, no el tipo/color
  getType: () => NotificationType;
  setType: (
    type: NotificationType,
    message?: string,
    title?: string,
    customIcon?: string
  ) => void;
  // Podríamos añadir getFullState y setFullState si es necesario
  // getFullState: () => NotificationState;
  // setFullState: (newState: Partial<NotificationState>) => void;
}