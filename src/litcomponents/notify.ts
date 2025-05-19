import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { type TasksObject, type Task } from 'src/types/task';
@customElement('task-notifications')
export class TaskNotifications extends LitElement {
  // 1. Estilos: Se definen como una propiedad estática 'styles'
  static styles = css`
    :host {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: block;
    }

    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -moz-font-feature-settings: 'liga';
      -moz-osx-font-smoothing: grayscale;
    }
    #notifications-container {
      display: flex;
      flex-direction: column;
      gap: 10px; /* Usar gap para espaciado es más moderno */
    }
    .notification {
      border: 1px solid #193455;
      padding: 10px 15px;
      border-radius: 5px;
      background: #1a1a1a;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      min-width: 250px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
    .notification.fade-out {
        opacity: 0;
        transform: translateX(100%);
    }
    .icon {
      margin-right: 10px;
      flex-shrink: 0; /* Evita que el ícono se encoja */
    }
    .content {
      flex: 1;
      overflow: hidden; /* Para manejar filenames largos */
    }
    .content strong {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis; /* Puntos suspensivos para texto largo */
    }
    .progress-bar {
      background: #444; /* Color de fondo más oscuro para contraste */
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress {
      background: #3f83f8;
      height: 100%;
      width: 0%;
      transition: width 0.3s ease-in-out;
    }
    .status-completed .icon {
        color: #4caf50; /* Verde para completado */
    }
    .status-error .icon {
        color: #f44336; /* Rojo para error */
    }
  `;

  // 2. Propiedades Reactivas: Usamos @state para el estado interno que, al cambiar, dispara un re-render.
  //    Guardaremos las tareas como un array para facilitar la iteración en el template.
  @state()
  private _activeNotifications: Task[] = [];

  // Para manejar los timeouts de eliminación
  private _removalTimeouts: Map<string, number> = new Map();

  constructor() {
    super();
    // En Lit, no necesitas attachShadow manualmente en el constructor si usas `static styles` y `render`.
    // delegateFocus se puede manejar de otras formas si es estrictamente necesario, pero Lit maneja el foco dentro del shadow DOM.
  }

  /**
   * Actualiza o agrega notificaciones a partir de un objeto de tareas.
   * @param {TasksObject} tasks - Objeto con las tareas.
   */
  public updateTasks(tasks: TasksObject): void {
    let newNotificationsArray = [...this._activeNotifications];
    let changed = false;

    for (const id in tasks) {
      if (tasks.hasOwnProperty(id)) {
        const taskData = tasks[id];
        const existingNotifIndex = newNotificationsArray.findIndex(n => n.id === id);

        const taskWithId: Task = { ...taskData, id };

        if (existingNotifIndex !== -1) {
          // Actualizar notificación existente
          // Solo actualizamos si hay cambios reales para evitar re-renders innecesarios
          if (JSON.stringify(newNotificationsArray[existingNotifIndex]) !== JSON.stringify(taskWithId)) {
            newNotificationsArray[existingNotifIndex] = taskWithId;
            changed = true;
          }
        } else {
          // Agregar nueva notificación
          newNotificationsArray.push(taskWithId);
          changed = true;
        }

        // Manejar auto-eliminación para tareas completadas o con error
        if (taskWithId.status === 'completed' || (taskWithId.progress !== undefined && taskWithId.progress >= 100) || taskWithId.status === 'error') {
          // Si ya hay un timeout para esta tarea, limpiarlo (por si se actualiza antes de borrarse)
          if (this._removalTimeouts.has(id)) {
            clearTimeout(this._removalTimeouts.get(id));
          }
          const timeoutId = window.setTimeout(() => {
            this._removeNotification(id);
          }, taskWithId.status === 'error' ? 5000 : 3000); // Más tiempo para errores
          this._removalTimeouts.set(id, timeoutId);
        }
      }
    }

    if (changed) {
      this._activeNotifications = newNotificationsArray;
      // this.requestUpdate(); // Lit generalmente detecta el cambio en @state y actualiza.
                           // Si _activeNotifications fuera un objeto mutado, necesitarías esto.
                           // Pero al asignar un nuevo array, Lit lo detecta.
    }
  }

  private _removeNotification(id: string): void {
    const notificationElement = this.shadowRoot?.querySelector(`.notification[data-id="${id}"]`);
    if (notificationElement) {
        notificationElement.classList.add('fade-out');
        // Esperar a que termine la animación antes de eliminar del array de estado
        notificationElement.addEventListener('transitionend', () => {
            this._activeNotifications = this._activeNotifications.filter(n => n.id !== id);
            this._removalTimeouts.delete(id);
        }, { once: true });
    } else {
        // Si el elemento ya no está en el DOM (raro, pero posible), simplemente actualizar el estado
        this._activeNotifications = this._activeNotifications.filter(n => n.id !== id);
        this._removalTimeouts.delete(id);
    }
  }

  private _getIconForTask(task: Task): string {
    if (task.icon) return task.icon; // Icono personalizado para la tarea
    if (task.status === 'completed') return 'check_circle';
    if (task.status === 'error') return 'error';
    if (task.type === 'downloading') return 'download'; // 'cloud_download' es otra opción
    if (task.type === 'uploading') return 'upload'; // 'cloud_upload'
    if (task.status === 'processing' || (task.progress !== undefined && task.progress < 100)) return 'sync'; // O 'autorenew' o 'progress_activity'
    return 'deployed_code_update'; // Icono por defecto
  }

  // 3. Renderizado: Se define el método `render()` que devuelve un template literal `html`
  render() {
    return html`
      <div id="notifications-container">
        ${this._activeNotifications.map(task => html`
          <div
            class="notification ${task.status === 'completed' ? 'status-completed' : ''} ${task.status === 'error' ? 'status-error' : ''}"
            data-id=${task.id}
          >
            <span class="material-symbols-outlined icon">${this._getIconForTask(task)}</span>
            <div class="content">
              <strong>${task.filename}</strong>
              ${task.progress !== undefined && task.status !== 'completed' && task.status !== 'error' ? html`
                <div class="progress-bar">
                  <div class="progress" style="width: ${task.progress}%"></div>
                </div>
                <small>${task.progress}% ${task.status ? `(${task.status})` : ''}</small>
              ` : task.status ? html`<small>${task.status}</small>`: ''}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // Limpiar timeouts cuando el componente se desconecta del DOM
  disconnectedCallback() {
    super.disconnectedCallback();
    this._removalTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this._removalTimeouts.clear();
  }
}

// Para asegurar que el tipo Task esté disponible globalmente si es necesario
declare global {
  interface HTMLElementTagNameMap {
    'task-notifications': TaskNotifications;
  }
}