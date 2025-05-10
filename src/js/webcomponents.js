

class KubekAlerts1 extends HTMLElement {
  static instances = new Set();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />

      <style>
        :host {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: block;
          width: 350px;
        }
        .alerts-pool {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .alert {
          display: flex;
          align-items: center;
          padding: 15px;
          border-radius: 8px;
          background-color: var(--alert-bg, #ffffff);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, opacity 0.3s ease;
          color: var(--alert-text, #333);
        }
        .alert:hover {
          transform: translateY(-2px);
        }
        .icon-bg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 15px;
          background-color: var(--icon-bg, #e3f2fd);
        }
        .icon-bg.info {
          background-color: var(--icon-info, #e3f2fd);
        }
        .icon-bg.success {
          background-color: var(--icon-success, #e8f5e9);
        }
        .icon-bg.warning {
          background-color: var(--icon-warning, #fff3e0);
        }
        .icon-bg.error {
          background-color: var(--icon-error, #ffebee);
        }
        .material-symbols-rounded {
          font-size: 24px;
          color: var(--icon-color, #333);
        }
        .content-2 {
          flex-grow: 1;
        }
        .caption {
          font-weight: bold;
          font-size: 14px;
          color: var(--alert-text, #333);
        }
        .description {
          font-size: 12px;
          color: var(--alert-description, #666);
          margin-top: 5px;
        }

        /* Modo oscuro */
        :host([dark]) .alert {
          --alert-bg: #2d2d2d;
          --alert-text: #ffffff;
          --alert-description: #cccccc;
          --icon-bg: #3d3d3d;
          --icon-info: #1e3a5f;
          --icon-success: #2e7d32;
          --icon-warning: #ff8f00;
          --icon-error: #c62828;
          --icon-color: #ffffff;
        }
      </style>
      <div class="alerts-pool"></div>
    `;
    
    KubekAlerts1.instances.add(this);
  }

  disconnectedCallback() {
    KubekAlerts1.instances.delete(this);
  }

  static addAlert(
    text, 
    icon = "info",
    description = "",
    duration = 5000,
    iconClasses = "",
    callback = () => {}
  ) {
    for (const instance of KubekAlerts1.instances) {
      const newID = instance.generateAlertID();
      const alertHTML = `
        <div id="alert-${newID}" class="alert animate__animated animate__fadeIn animate__faster">
          ${this.buildIconSection(icon, iconClasses)}
          ${this.buildContentSection(text, description)}
        </div>
      `;

      const alertsPool = instance.shadowRoot.querySelector('.alerts-pool');
      alertsPool.insertAdjacentHTML('beforeend', alertHTML);
      
      const alertElement = instance.shadowRoot.getElementById(`alert-${newID}`);
      this.setupAlertBehavior(alertElement, duration, callback);
    }
  }

  static buildIconSection(icon, iconClasses) {
    const classes = iconClasses ? `icon-bg ${iconClasses}` : 'icon-bg';
    return `
      <div class="${classes}">
        <span class="material-symbols-rounded">${icon}</span>
      </div>
    `;
  }

  static buildContentSection(text, description) {
    return description 
      ? `<div class="content-2">
           <div class="caption">${text}</div>
           <div class="description">${description}</div>
         </div>`
      : `<div class="caption">${text}</div>`;
  }

  static setupAlertBehavior(alertElement, duration, callback) {
    alertElement.addEventListener('click', () => {
      animateCSS(alertElement, 'fadeOut').then(() => {
        alertElement.remove();
        callback();
      });
    });
  
    if (duration > 0) {
      setTimeout(() => {
        animateCSS(alertElement, 'fadeOut').then(() => {
          alertElement.remove();
        });
      }, duration);
    }
  }

  generateAlertID() {
    return this.shadowRoot.querySelectorAll('.alert').length;
  }

  static removeAllAlerts() {
    for (const instance of KubekAlerts1.instances) {
      instance.shadowRoot.querySelector('.alerts-pool').innerHTML = '';
    }
  }

  static setDarkMode(enabled) {
    for (const instance of KubekAlerts1.instances) {
      if (enabled) {
        instance.setAttribute('dark', '');
      } else {
        instance.removeAttribute('dark');
      }
    }
  }
}


// Registrar el componente
customElements.define('kubek-alerts', KubekAlerts1);
class TaskNotifications extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: block;
        }
        @font-face {
          font-family: 'Material Symbols Outlined';
          font-style: normal;
          font-weight: 100 700;
          src: url(https://fonts.gstatic.com/icon/font?kit=kJEhBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oFsKTAp49f3jnpQ&skey=b8dc2088854b122f&v=v226) format('woff2');
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
        /* Estilos para el contenedor de notificaciones y cada notificación */
        #notifications-container {
          display: flex;
          flex-direction: column;
        }
        .notification {
          border: 1px solid #193455;
          padding: 10px;
          margin: 5px;
          border-radius: 5px;
          background: #1a1a1a;
          display: flex;
          align-items: center;
        }
        .icon {
          margin-right: 10px;
        }
        .content {
          flex: 1;
        }
        .progress-bar {
          background: #e0e0e0;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 4px;
        }
        .progress {
          background: #3f83f8;
          height: 100%;
          width: 0%;
          transition: width 0.3s;
        }
      </style>
      <div id="notifications-container"></div>
    `;
  }

  /**
   * Actualiza o agrega notificaciones a partir de un objeto de tareas.
   * Cada key del objeto es el id de la tarea.
   * @param {Object} tasks - Objeto con las tareas.
   */
  updateTasks(tasks) {
    const container = this.shadowRoot.querySelector('#notifications-container');
    for (const id in tasks) {
      if (tasks.hasOwnProperty(id)) {
        const task = tasks[id];
        let notif = container.querySelector(`.notification[data-id="${id}"]`);
        if (notif) {
          // Si la notificación ya existe, se actualiza.
          this._updateNotification(notif, task);
        } else {
          // Si no existe, se crea y se agrega.
          notif = this._createNotification(id, task);
          container.appendChild(notif);
        }
      }
    }
  }

  _createNotification(id, task) {
    const notif = document.createElement('div');
    notif.classList.add('notification');
    notif.setAttribute('data-id', id);
    notif.innerHTML = this._getNotificationHTML(task);
    return notif;
  }

  _updateNotification(notif, task) {
    notif.innerHTML = this._getNotificationHTML(task);
    if (task.status === 'completed' || task.progress === 100) {
      setTimeout(() => {
        notif.remove();
      }, 3000);
    }
  }

  _getNotificationHTML(task, taskicon = "deployed_code_update") {
    // Seleccionamos el ícono según el tipo o estado de la tarea
    let icon = taskicon;
    if (task.type === 'downloading') {
   // icon = 'cloud_download';
    }
    if (task.status === 'completed') {
      icon = 'check_circle';
    }
    
    // Se arma el HTML de la notificación
    return `
      <span class="material-symbols-outlined icon">${icon}</span>
      <div class="content">
        <strong>${task.filename}</strong>
        ${typeof task.progress !== 'undefined' ? `
          <div class="progress-bar">
            <div class="progress" style="width: ${task.progress}%"></div>
          </div>
          <small>${task.progress}%</small>
        ` : ''}
      </div>
    `;
  }
}

// Definimos el custom element
customElements.define('task-notifications', TaskNotifications);