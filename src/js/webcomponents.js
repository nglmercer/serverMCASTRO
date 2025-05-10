    // Define el componente personalizado
    class SystemMonitor extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }
    
        connectedCallback() {
            this.render();
        }
    
        render() {
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                        font-family: Arial, sans-serif;
                        word-wrap: break-word;
                    }
    
                    @media (prefers-color-scheme: dark) {
                        :host {
                            color: #e0e0e0;
                            background-color: #1a1a1a;
                        }
                        table {
                            border-color: #404040;
                        }
                        th, td {
                            border-color: #404040;
                        }
                        th {
                            background-color: #2a2a2a;
                        }
                    }
    
                    @media (prefers-color-scheme: light) {
                        :host {
                            color: #1a1a1a !important;
                            background-color: #ffffff !important;
                        }
                        table {
                            border-color: #ddd;
                        }
                        th, td {
                            border-color: #ddd;
                        }
                        th {
                            background-color: #f5f5f5;
                        }
                    }
    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                        table-layout: fixed;
                    }
    
                    th, td {
                        padding: 8px;
                        border: 1px solid;
                        text-align: left;
                    }
    
                    td {
                        word-break: break-word;
                        overflow-wrap: break-word;
                        hyphens: auto;
                    }
    
                    #enviroment-table td {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        max-width: 0;
                    }
    
                    .system-info p {
                        margin: 8px 0;
                    }
    
                    sup {
                        font-size: 0.75em;
                    }
                </style>
                <div class="system-monitor">
                    <div class="system-info">
                        <h3>{{systemMonitor.os}}</h3>
                        <p>{{systemMonitor.os}}: <span id="os-name"></span></p>
                        <p>{{systemMonitor.osBuild}}: <span id="os-build"></span></p>
                        <p>{{systemMonitor.totalRam}}: <span id="total-ram"></span></p>
                        <p>{{systemMonitor.kubekUptime}}: <span id="kubek-uptime"></span></p>
                        <p>{{systemMonitor.cpuModel}}: <span id="cpu-model"></span></p>
                        <p>{{systemMonitor.cpuSpeed}}: <span id="cpu-speed"></span></p>
                    </div>
                    
                    <h3>{{systemMonitor.environment}}</h3>
                    <table id="enviroment-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                    </table>
                    
                    <h3>{{systemMonitor.networkInterfaces}}</h3>
                    <table id="networks-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                    </table>
                    
                    <h3>{{systemMonitor.disks}}</h3>
                    <table id="disks-table">
                        <colgroup>
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                        </colgroup>
                        <tr>
                            <th>Unidad</th>
                            <th>Usado</th>
                            <th>Libre</th>
                            <th>Total</th>
                            <th>Porcentaje</th>
                        </tr>
                    </table>
                </div>
            `;
        }
    
        renderdata(data) {
            const getElement = (id) => this.shadowRoot.querySelector(`#${id}`);
            // Procesar variables de entorno
            const envTable = getElement('enviroment-table');
            for (const [key, value] of Object.entries(data.enviroment)) {
                const row = document.createElement('tr');
                row.innerHTML = `<th>${key}</th><td>${value}</td>`;
                envTable.appendChild(row);
            }
    
            // Procesar interfaces de red
            const networkTable = getElement('networks-table');
            for (const [key, value] of Object.entries(data.networkInterfaces)) {
                const ips = value.map(inner => 
                    `<span>${inner.address} <sup>${inner.family}</sup></span>`
                ).join('<br>');
                
                const row = document.createElement('tr');
                row.innerHTML = `<th>${key}</th><td>${ips}</td>`;
                networkTable.appendChild(row);
            }
            // Actualizar información del sistema
            getElement('os-name').innerHTML = 
                `${data.platform.version} <sup>${data.platform.arch}</sup>`;
            getElement('os-build').textContent = data.platform.release;
            getElement('total-ram').textContent = `${data.totalmem} Mb`;

            getElement('cpu-model').textContent = 
                `${data.cpu.model} (${data.cpu.cores} cores)`;
            getElement('cpu-speed').textContent = `${data.cpu.speed} MHz`;
            const disksTable = getElement('disks-table');
            console.log("disks", data.disks, data);
            data.disks.forEach(disk => {
              let letter, total, used, free, percent;

              if (data.platform.name === "Linux") {
                  // Usar las propiedades correctas para Linux
                  letter = disk.mount; // Usar 'mount' en lugar de '_mounted'
                  total = disk.total;  // Los valores ya están en bytes
                  used = disk.used;    // No multiplicar por 1024
                  free = disk.available;
                  percent = disk.use;  // Usar 'use' en lugar de '_capacity'
              } else {
                  // Formato para Windows
                  letter = disk.mount;
                  total = disk.total;
                  used = disk.used;
                  free = disk.available;
                  percent = disk.use;
              }

              // Crear fila de la tabla (sin cambios)
              const row = document.createElement('tr');
              row.innerHTML = `
                  <th>${letter}</th>
                  <td>${humanizeFileSize(used)}</td>
                  <td>${humanizeFileSize(free)}</td>
                  <td>${humanizeFileSize(total)}</td>
                  <td>${percent}%</td>
              `;
              disksTable.appendChild(row);
            });
            getElement('kubek-uptime').textContent = 
            humanizeSeconds(data.uptime);
        }
    }

// Registrar el componente
customElements.define('system-monitor', SystemMonitor);
function humanizeFileSize(size) {
  if (size < 1024) {
      size = size + " B";
  } else if (size < 1024 * 1024) {
      size = Math.round((size / 1024) * 10) / 10 + " Kb";
  } else if (size < 1024 * 1024 * 1024) {
      size = Math.round((size / 1024 / 1024) * 10) / 10 + " Mb";
  } else if (size >= 1024 * 1024 * 1024) {
      size = Math.round((size / 1024 / 1024 / 1024) * 10) / 10 + " Gb";
  } else {
      size = size + " ?";
  }
  return size;
}

// Convertir segundos a un formato legible por humanos
function humanizeSeconds(seconds) {
  let hours = Math.floor(seconds / (60 * 60));
  let minutes = Math.floor((seconds % (60 * 60)) / 60);
  seconds = Math.floor(seconds % 60);

  return (
      padZero(hours) + "{{commons.h}} " +
      padZero(minutes) + "{{commons.m}} " +
      padZero(seconds) + "{{commons.s}}"
  );
}
function padZero(number) {
  return (number < 10 ? "0" : "") + number;
}
if (!customElements.get('kubek-plugins-ui')) {
    class KubekPluginsUIclass extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._elementList = [];
        this.render();
        this.setupEventListeners();
        this.type = "plugins";
      }
    
      addElement(element) {
        // Verificar si el elemento ya existe
        if (!this._elementList.includes(element)) {
          this._elementList.push(element);
          this.renderAllLists(this.type);
          return true; // Elemento añadido exitosamente
        }
        return false; // Elemento ya existe
      }
    
      // Nuevo método para eliminar un elemento específico
      removeElement(element) {
        const index = this._elementList.indexOf(element);
        if (index !== -1) {
          this._elementList.splice(index, 1);
          this.renderAllLists(this.type);
          return true; // Elemento eliminado exitosamente
        }
        return false; // Elemento no encontrado
      }
    
      get elements() {
        return this._elementList;
      }
    
      set elements(list) {
        this._elementList = list;
        this.renderList('elements-list', list, this.type);
      }
      connectedCallback() {
        this.renderAllLists();
      }
    
      render() {
        this.shadowRoot.innerHTML = `
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
          <style>
    
          :host {
          }
            button {
            appearance: none;
            outline: none;
            border: 0;
            padding: 12px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            display: flex
        ;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 14pt;
            cursor: pointer;
          }
                button:hover {
            background: var(--bg-dark-accent-light);
          }
            .item {
              background: #222c3a;
              display: flex;
              align-items: center;
              padding-block: 1rem;
              padding-inline: 6px;
              justify-content: space-between;
              width: 100%;
              border-radius: 10px;
            }
            .switch {
              position: relative;
              display: inline-block;
              width: 60px;
              height: 28px;
            }
            .switch input {
              opacity: 0;
              width: 0;
              height: 0;
            }
            .slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: #e0e0e0;
              transition: .3s;
              border-radius: 34px;
            }
            .slider:before {
              position: absolute;
              content: "";
              height: 20px;
              width: 20px;
              left: 4px;
              bottom: 4px;
              background-color: white;
              transition: .3s;
              border-radius: 50%;
            }
            input:checked + .slider {
              background-color: #2196F3;
            }
            input:checked + .slider:before {
              transform: translateX(32px);
            }
            .dark-btn {
              background-color:transparent;
              color: white;
              border: none;
              padding: 5px 10px;
              cursor: pointer;
            }
              #elements-list {
                display: flex;
                flex-direction: column;
                width: 100%;
                gap: 10px;
                }
          </style>
          <div id="elements-list"></div>
        `;
      }
    
      setupEventListeners() {
        this.shadowRoot.addEventListener('change', this.handleToggle.bind(this));
        this.shadowRoot.addEventListener('click', this.handleDelete.bind(this));
      }
    
      createItemHTML(ITEM, itemType) {
        let item = typeof ITEM === "string" ? ITEM : ITEM.name;
        const isEnabled = !item.endsWith('.dis');
        const displayName = item.replace('.jar', '').replace('.dis', '');
        console.log(displayName);
        return `
          <div class="item">
            <div class="item-container">
                    <label class="switch">
              <input 
                type="checkbox" 
                ${isEnabled ? 'checked' : ''} 
                data-item="${item}" 
                data-type="${itemType}"
              >
              <span class="slider round"></span>
            </label>
            <span class="filename">${displayName}</span>
            </div>
            <button 
              class="dark-btn icon-only" 
              data-item="${item}" 
              data-type="${itemType}"
            >
              <span class="material-symbols-outlined">
            delete
            </span>
            </button>
          </div>
        `;
      }
    
      renderList(containerId, items, type) {
        const container = this.shadowRoot.getElementById(containerId);
        const html = items.map(item => this.createItemHTML(item, type)).join('');
        container.innerHTML = html;
      }
    
      handleToggle(event) {
        if (!event.target.matches('input[type="checkbox"]')) return;
    
        const target = event.target;
        const item = target.dataset.item;
        const type = target.dataset.type;
        const isEnabled = target.checked;
        
        const newName = isEnabled ? 
          item.replace('.dis', '') : 
          `${item}${item.endsWith('.dis') ? '' : '.dis'}`;
    
        this.emitEvent('toggle', { item, type, newName });
      }
    
      handleDelete(event) {
        const button = event.target.closest('button.dark-btn');
        if (!button) return;
        
        this.emitEvent('delete', {
          item: button.dataset.item,
          type: button.dataset.type
        });
      }
    
      emitEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
          detail,
          bubbles: true,
          composed: true
        }));
      }
    
      renderAllLists(type = "plugins") {
        this.renderList('elements-list', this.elements, type);
        this.setType(type);
      }
    
      setElementList(list) {
        this.elements = list;
      }
      setType(type){
        this.type = type;
      }
      
    }
    customElements.define('kubek-plugins-ui', KubekPluginsUIclass);
    }





class KubekCircleProgress1 extends HTMLElement {
  // Constructor
  constructor() {
      super();
      this.value = 0;
      this.centerColor = '#000';
      this.bgColor = '#e0e0e0';
      this.activeColor = '#007bff';
      this.radius = 100;
      this.text = '';
  }

  // Método para observar los atributos que queremos que sean reactivos
  static get observedAttributes() {
      return ['value', 'center-color', 'bg-color', 'active-color', 'radius', 'text'];
  }

  // Método que se llama cuando el elemento es añadido al DOM
  connectedCallback() {
      this.create();
  }

  // Método que se llama cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
          switch (name) {
              case 'value':
                  this.value = parseFloat(newValue);
                  break;
              case 'center-color':
                  this.centerColor = newValue;
                  break;
              case 'bg-color':
                  this.bgColor = newValue;
                  break;
              case 'active-color':
                  this.activeColor = newValue;
                  break;
              case 'radius':
                  this.radius = parseFloat(newValue);
                  break;
              case 'text':
                  this.text = newValue;
                  break;
          }
          this.refreshColors();
          this.updateText(); // Actualizar el texto cuando cambia el atributo
      }
  }

  // Crear el elemento de progreso
  create() {
      this.setAttribute('role', 'progressbar');
      this.classList.add('circle-progress');
      this.style.width = `${this.radius}px`;
      this.style.height = `${this.radius}px`;
      this.innerHTML = `<span class='text'>${this.text || this.value + '%'}</span>`;
      this.refreshColors();
  }

  // Obtener el valor del progreso
  getValue() {
      return this.value;
  }

  // Establecer el valor del progreso
  setValue(value, updateText = true) {
      this.value = value;
      this.setAttribute('value', value);
      if (updateText) {
          this.text = value + '%';
          this.setAttribute('text', this.text); // Actualizar el atributo text
      }
      this.refreshColors();
      this.updateText(); // Actualizar el texto cuando cambia el valor
  }

  // Refrescar los colores del círculo
  refreshColors() {
      this.style.background = this.generateGradient(this.centerColor, this.bgColor, this.activeColor, this.value);
  }

  // Establecer el texto dentro del círculo
  setText(text) {
      this.text = text;
      this.setAttribute('text', text);
      this.updateText(); // Actualizar el texto cuando se establece directamente
  }

  // Obtener el texto establecido
  getText() {
      return this.text;
  }

  // Establecer el color activo
  setActiveColor(color) {
      this.activeColor = color;
      this.setAttribute('active-color', color);
      this.refreshColors();
  }

  // Establecer el color del centro
  setCenterColor(color) {
      this.centerColor = color;
      this.setAttribute('center-color', color);
      this.refreshColors();
  }

  // Establecer el color de fondo
  setBgColor(color) {
      this.bgColor = color;
      this.setAttribute('bg-color', color);
      this.refreshColors();
  }

  // Generar el gradiente para el círculo
  generateGradient(centerColor, bgColor, activeColor, value) {
      return `radial-gradient(closest-side, ${centerColor} 79%, transparent 80% 100%), conic-gradient(${activeColor} ${value}%, ${bgColor} 0)`;
  }

  // Método para actualizar el texto dentro del círculo
  updateText() {
      const textElement = this.querySelector('.text');
      if (textElement) {
          textElement.textContent = this.text || this.value + '%';
      }
  }
}

// Definir el nuevo elemento personalizado
customElements.define('kubek-circle-progress', KubekCircleProgress1);


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

// Función para animar elementos
function animateCSS(element, animation, prefix = 'animate__') {
  return new Promise((resolve) => {
    const animationName = `${prefix}${animation}`;
    element.classList.add(`${prefix}animated`, animationName);

    function handleAnimationEnd(event) {
      event.stopPropagation();
      element.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    element.addEventListener('animationend', handleAnimationEnd, { once: true });
  });
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