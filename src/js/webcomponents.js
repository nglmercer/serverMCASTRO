
      class ServerPropertiesElement extends HTMLElement {
        static get observedAttributes() {
            return ['server-id'];
        }
    
        constructor() {
            super();
            this.SWITCH_ELEMENT = '<label class="switch"> <input type="checkbox"$0> <span class="slider round"></span></label>';
            this.NUMBER_INPUT = "<input type='number' value='$0'>";
            this.TEXT_INPUT = "<input type='text' value='$0'>";
            
            // Store original types mapping
            this.propertyTypes = new Map();
            
            // Create shadow DOM
            this.attachShadow({ mode: 'open' });
            
            // Add styles
            this.shadowRoot.innerHTML = `
                <style>
                ${this.getStyles()}
                </style>
                <table id="sp-table"></table>
                <button id="save-btn" class="primary-btn hidden">Save Properties</button>
            `;
        }
        getStyles() {
            return `
            :host {
                width: 100%;
                border-radius: 8px;
                box-sizing: border-box;
                color-scheme: light dark;
            }
                .hidden {
                    display: none;
                }
                    .primary-btn {
                    padding: 8px 16px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    }
    
                    .primary-btn:hover {
                    background: #0056b3;
                    }
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 60px;
                        height: 34px;
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
                        background-color: #ccc;
                        transition: .4s;
                    }
                    
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 26px;
                        width: 26px;
                        left: 4px;
                        bottom: 4px;
                        background-color: white;
                        transition: .4s;
                    }
                    
                    input:checked + .slider {
                        background-color: #2196F3;
                    }
                    
                    input:checked + .slider:before {
                        transform: translateX(26px);
                    }
                    
                    .slider.round {
                        border-radius: 34px;
                    }
                    
                    .slider.round:before {
                        border-radius: 50%;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        border: 1px solid rgb(46, 62, 83, 0.5);
                    }
                    
                    td {
                        padding: 8px;
                        border: 1px solid rgb(46, 62, 83, 0.5);
                    }
                    
                    input[type="text"], input[type="number"] {
                        width: auto;
                        padding: 6px;
                        box-sizing: border-box;
                    }
                        `;
        }
        connectedCallback() {
            this.loadProperties();
            this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.emitPropertiesChange());
        }
    
        getValueType(value) {
            if (value === null) {
                return "null";
            }
            const type = typeof value;
            if (type === "boolean" || type === "number") {
                return type;
            }
            return "string";
        }
    
        parseValueByType(value, type) {
            switch (type) {
                case "null":
                    return null;
                case "boolean":
                    return value === "true" || value === true;
                case "number":
                    const num = Number(value);
                    return isNaN(num) ? 0 : num;
                default:
                    return String(value);
            }
        }
    
        async loadProperties() {
            const serverId = this.getAttribute('server-id') || window.localStorage.selectedServer;
            try {
                const url = `/api/servers/${serverId}/server.properties`;
                const response = await fetch(url);
                const result = response.ok ? await response.json() : {};
                let properties = result.data
                if (typeof result.data === "string") {
                    // sacar los datos a un objeto ya que es un string con saltos de linea
                    // añadir un filtro si comienza con # o no tiene un split
                    
                    properties = result.data.split('\n').reduce((acc, line) => {
                      // Filtrar líneas que comienzan con '#' o no contienen '='
                      if (!line.startsWith('#') && line.includes('=')) {
                          const [key, value] = line.split('=');
                          // Eliminar espacios en blanco alrededor de la clave y el valor
                          acc[key.trim()] = value.trim();
                      }
                      return acc;
                  }, {});
                }
                const table = this.shadowRoot.querySelector('#sp-table');
                table.innerHTML = ''; // Clear existing content
                
                for (const [key, value] of Object.entries(properties)) {
                    // Store original type
                    const originalType = this.getValueType(value);
                    this.propertyTypes.set(key, originalType);
    
                    // Handle display value
                    let displayValue = value;
                    if (originalType === "null") {
                        displayValue = "";
                    }
    
                    // Override specific property types
                    if (key === "server-ip") {
                        this.propertyTypes.set(key, "string");
                    }
    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${key}</td>
                        <td>${this.createInput(this.propertyTypes.get(key), displayValue)}</td>
                    `;
                    // Store type information in the row
                    row.dataset.propertyType = this.propertyTypes.get(key);
                    table.appendChild(row);
                }
                
            } catch (error) {
                console.error('Error loading properties:', error);
            }
        }
    
        createInput(type, value) {
            switch (type) {
                case "boolean":
                    const isChecked = value === true ? " checked" : "";
                    return this.SWITCH_ELEMENT.replace("$0", isChecked);
                case "number":
                    return this.NUMBER_INPUT.replace("$0", value);
                case "null":
                    return this.TEXT_INPUT.replace("$0", "");
                default:
                    return this.TEXT_INPUT.replace("$0", value);
            }
        }
    
        async getPropertiesToSave() {
            const serverId = this.getAttribute('server-id');
            const saveResult = {};
            
            this.shadowRoot.querySelectorAll('#sp-table tr').forEach(row => {
                const key = row.cells[0].textContent;
                const inputCell = row.cells[1];
                const originalType = this.propertyTypes.get(key);
                
                let rawValue;
                const checkbox = inputCell.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    rawValue = checkbox.checked;
                } else {
                    rawValue = inputCell.querySelector('input').value;
                }
    
                // Parse value according to its original type
                saveResult[key] = this.parseValueByType(rawValue, originalType);
            });
            const data = {
                server: serverId,
                result: saveResult
            }
            return data;
    
        }
        async emitPropertiesChange() {
            const data = await this.getPropertiesToSave();
            console.log("result", data);
            try {
                if (Object.keys(data).length === 0) {
                    console.log("saveResult is empty");
                    return;
                }
    
                this.dispatchEvent(new CustomEvent('save-success', {
                    bubbles: true,
                    composed: true,
                    detail: data,
                }));
            } catch (error) {
                console.error('Error saving properties:', error);
            }
        }
    }
    // Register the custom element
    customElements.define('server-properties', ServerPropertiesElement);
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



customElements.define('enhanced-select', EnhancedSelect);

class SidebarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.isVisible = false;
    this.serverlist = [];
    this.sidebarItems = [
    ];
  }

  static get styles() {
    return `
      <style>
        :host {
          position: fixed;
          left: -100%;
          top: 0;
          bottom: 0;
          z-index: 1000;
          transition: left 0.3s ease-in-out;
          font-family: inherit;
        }

        .sidebar {
          position: absolute;
          top: 25%;
          bottom: 25%;
          width: 280px;
          /*add blur effect*/
          backdrop-filter: blur(4px);
          background:  #222c3a73;
          padding: 1rem;
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
          overflow-y: auto;
        }
        .material-symbols-rounded {
                font-family: 'Material Symbols Outlined';
                font-size: 1.5rem;
        }
        .sidebar-box {
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color, #3a3a3a);
        }

        .sidebar-header {
          display: flex;
          justify-content: flex-end;
          padding-bottom: 1rem;
        }

        #servers-list-sidebar {
          max-height: 40vh;
          overflow-y: auto;
        }

        .sidebar-item, .server-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          margin: 0.25rem 0;
          border-radius: 6px;
          cursor: pointer;
          color: inherit;
          transition: all 0.2s ease;
        }

        .sidebar-item:hover, .server-item:hover {
          background: var(--hover-bg, #3a3a3a);
          color: inherit;
        }

        .sidebar-item.active {
          background: var(--active-bg, #4a90e2);
          color: white;
          cursor: default;
        }

        .material-symbols-rounded {
          font-size: 1.5rem;
        }
        .selected,
        .active {
          background: var(--active-bg, #4a90e2);
          color: white;
          cursor: default;
        }
        .icon-circle-bg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-color, #4a90e2);
          margin-right: 1rem;
        }

        .icon-circle-bg img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        button.dark-btn {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 0.5rem;
        }

        @media (max-width: 400px) {
          .sidebar {
            padding: 0;
          }
        }
          #close-btn {
          background: #bf2121;
          border-radius: 4px;
          padding: 0.2em;
        }
          #close-btn:hover {
          background: red;
        }
      </style>
    `;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  toggleSidebar(isVisible = !this.isVisible) {
    this.isVisible = isVisible;
    this.style.left = this.isVisible ? '0' : '-100%';
    
    const event = new CustomEvent('toggle-sidebar', {
      detail: { isVisible: this.isVisible },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  setServersList(servers) {
    this.serverlist = servers;
    this.loadServersList();
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${SidebarComponent.styles}
      <div class="sidebar">
        <div class="sidebar-header">
          <button class="dark-btn" id="close-btn">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>

        <div class="sidebar-box" id="servers-list-sidebar">
          ${this.createServerList()}
        </div>

        <div class="sidebar-box" id="main-menu-sidebar">
          ${this.sidebarItems.map(item => this.createSidebarItem(item)).join('')}
        </div>
      </div>
    `;
  }

  createServerList() {
    return `
      <div class="sidebar-item" id="new-server-btn">
        <div class="icon-circle-bg">
          <span class="material-symbols-rounded">add</span>
        </div>
        <span>Create server</span>
      </div>
      ${this.serverlist.map(server => this.createServerItem(server)).join('')}
    `;
  }
  setActiveElement(activeElement) {
    // Desmarcar todos los elementos activos
    this.shadowRoot.querySelectorAll('.sidebar-item.active, .server-item.active').forEach(item => {
      item.classList.remove('active');
    });
    if (!activeElement) return;
    const newServerBtn = this.shadowRoot.querySelector('#new-server-btn');
    if (activeElement.includes("newServer")) {
      newServerBtn.classList.add('selected');
      return;
    }
    // Buscar y marcar el elemento activo en los sidebarItems
    const sidebarItem = this.shadowRoot.querySelector(`.sidebar-item[data-page="${activeElement}"]`);
    if (sidebarItem) {
      sidebarItem.classList.add('active');
      return;
    }

    // Buscar y marcar el elemento activo en la lista de servidores
    const serverItem = this.shadowRoot.querySelector(`.server-item[data-server="${activeElement}"]`);
    if (serverItem) {
      serverItem.classList.add('active');
    }
  }
  createSidebarItem(item) {
    return `
      <div class="sidebar-item" data-page="${item.page}">
        <span class="material-symbols-rounded">${item.icon}</span>
        <span>${item.title}</span>
      </div>
    `;
  }

  createServerItem(server) {
    return `
      <div class="server-item" data-server="${server.title}">
        <div class="icon-circle-bg">
          <img src="${server.icon}" alt="${server.title}">
        </div>
        <span>${server.title}</span>
      </div>
    `;
  }

  setupEventListeners() {
    this.shadowRoot.addEventListener('click', e => {
      const item = e.target.closest('.sidebar-item, .server-item');
      if (!item) return;

      if (item.id === 'new-server-btn') {
        this.dispatchNewServerEvent();
        return;
      }

      if (item.classList.contains('sidebar-item')) {
        this.handleSidebarItemClick(item);
      } else if (item.classList.contains('server-item')) {
        this.handleServerItemClick(item);
      }
    });
    this.shadowRoot.getElementById('close-btn').addEventListener('click', () => this.toggleSidebar(false));
  }

  handleSidebarItemClick(item) {
    this.shadowRoot.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    this.dispatchEvent(new CustomEvent('page-change', {
      detail: {
        page: item.dataset.page,
        item: this.sidebarItems.find(i => i.page === item.dataset.page)
      },
      bubbles: true,
      composed: true
    }));
  }

  handleServerItemClick(item) {
    const server = item.getAttribute("data-server");

    console.log("handleServerItemClick", server);
    if (server) {
      this.dispatchEvent(new CustomEvent('server-change', {
        detail: { server: server },
        bubbles: true,
        composed: true
      }));
    }
  }

  dispatchNewServerEvent() {
    this.dispatchEvent(new CustomEvent('new-server', {
      bubbles: true,
      composed: true
    }));
  }

  loadServersList() {
    const container = this.shadowRoot.getElementById('servers-list-sidebar');
    container.innerHTML = this.createServerList();
  }
}
customElements.define('sidebar-menu', SidebarComponent);
// El componente principal del menú
class ServerMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.serverlist = [];
  }

  getStyles() {
    return `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          --primary-color: #5865F2;
          --active-bg: #5865F2;
          --hover-bg: rgba(88, 101, 242, 0.1);
          --text-color: inherit;
        }

        #servers-list-sidebar {
          max-height: 40vh;
          overflow-y: auto;
          padding: 0.5rem;
          scrollbar-width: thin;
          scrollbar-color: var(--primary-color) transparent;
        }

        #servers-list-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        #servers-list-sidebar::-webkit-scrollbar-thumb {
          background-color: var(--primary-color);
          border-radius: 3px;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          color: var(--text-color);
          transition: all 0.2s ease;
          cursor: pointer;
          user-select: none;
        }

        .sidebar-item:hover:not(.selected) {
          background: var(--hover-bg);
        }

        .selected {
          background: var(--active-bg) !important;
          color: white !important;
        }

        #new-server-btn {
          margin-bottom: 1rem;
        }
      </style>
    `;
  }

  connectedCallback() {
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getStyles()}
      <div class="sidebar-box" id="servers-list-sidebar">
      </div>
      <slot name="custom-elements"></slot>
      `;
  }
  
  setActiveElement(activeElementId) {
    // Desmarcar todos los elementos activos
    this.shadowRoot.querySelectorAll('.selected').forEach(item => {
      item.classList.remove('selected');
    });
    
    if (!activeElementId) return;
    
    const newServerBtn = this.shadowRoot.querySelector('#new-server-btn');
    if (activeElementId.includes("newServer") && newServerBtn) {
      newServerBtn.classList.add('selected');
      return;
    }
    
    // Buscar y marcar el elemento activo en los server-items
    const serverItems = this.shadowRoot.querySelectorAll('server-item');
    serverItems.forEach(item => {
      if (item.getAttribute('data-server') === activeElementId) {
        item.setActive(true);
      } else {
        item.setActive(false);
      }
    });
  }
  
  setServersList(servers) {
    this.serverlist = servers;
    this.loadServersList();
  }
  
  loadServersList() {
    const container = this.shadowRoot.getElementById('servers-list-sidebar');
    // Limpiar el contenedor primero
    container.innerHTML = '';
    
    // Crear y agregar cada elemento server-item
    this.serverlist.forEach(server => {
      // Generar un ID único para este servidor basado en su título
      const serverId = server.title.replace(/\s+/g, '-').toLowerCase();
      
      // Crear el server-item como un contenedor básico
      const serverWrapper = document.createElement('div');
      serverWrapper.id = `server-wrapper-${serverId}`;
      serverWrapper.classList.add('server-wrapper');
      
      // Crear el elemento server-item
      const serverItem = document.createElement('server-item');
      serverItem.setAttribute('data-server', server.title);
      serverItem.setAttribute('data-size', server.size || 0);
      serverItem.setAttribute('data-version', server.version !== undefined ? server.version : 'Unknown');
      serverItem.setAttribute('data-modified', server.modified || '');
      serverItem.setAttribute('data-status', server.status || '');
      serverItem.setAttribute('icon', server.icon);
      serverItem.setAttribute('title', server.title);
      
      // Crear un slot para este servidor específico que podrá ser ocupado desde el exterior
      const slotName = `server-content-${serverId}`;
      serverItem.innerHTML = `<slot name="${slotName}"></slot>`;
      
      // Escuchar el evento de clic en el server-item
      serverItem.addEventListener('server-selected', (e) => {
        this.handleServerItemClick(e.detail);
      });
      serverItem.addEventListener('server-contextmenu', (e) => {
        this.handleServerItemContextMenu(e.detail);
      });
      serverWrapper.appendChild(serverItem);
      container.appendChild(serverWrapper);
      
      // Notificar que se ha creado un slot para este servidor
      this.dispatchEvent(new CustomEvent('server-slot-created', {
        detail: { 
          server: server.title,
          serverId: serverId,
          slotName: slotName
        },
        bubbles: true,
        composed: true
      }));
    });
    
    // Disparar evento de que los servidores están listos
    this.dispatchEvent(new CustomEvent('servers-loaded', {
      detail: { 
        serverCount: this.serverlist.length,
        servers: this.serverlist.map(server => {
          const serverId = server.title.replace(/\s+/g, '-').toLowerCase();
          return {
            title: server.title,
            serverId: serverId,
            slotName: `server-content-${serverId}`
          };
        })
      },
      bubbles: true,
      composed: true
    }));
  }
  
  handleServerItemClick(detail) {
    // Desmarcar todos los elementos previamente seleccionados
    this.shadowRoot.querySelectorAll('server-item').forEach(item => {
      if (item.getAttribute('data-server') !== detail.server) {
        item.setActive(false);
      }
    });
    
    // Propagar el evento hacia arriba
    this.dispatchEvent(new CustomEvent('server-change', {
      detail: detail,
      bubbles: true,
      composed: true
    }));
  }
  handleServerItemContextMenu(detail) {

  }
  // Método para obtener una referencia al servidor por su título
  getServerItemByTitle(title) {
    return this.shadowRoot.querySelector(`server-item[data-server="${title}"]`);
  }
  
  // Método auxiliar para crear y añadir contenido personalizado a un servidor
  addServerContent(serverTitle, content) {
    const serverId = serverTitle.replace(/\s+/g, '-').toLowerCase();
    const slotName = `server-content-${serverId}`;
    
    // Crear un contenedor para el contenido que irá en el slot
    const contentContainer = document.createElement('div');
    contentContainer.slot = slotName;
    
    // Si el contenido es un string, lo establecemos como innerHTML
    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } 
    // Si es un elemento DOM, lo agregamos como hijo
    else if (content instanceof Element) {
      contentContainer.appendChild(content);
    }
    
    // Añadir al documento principal
    this.appendChild(contentContainer);
    
    return contentContainer;
  }
}

class ServerItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._active = false;
  }
  
  getStyles() {
    return `
      <style>
        :host {
          display: block;
          --primary-color: #5865F2;
          --active-bg: #5865F2;
          --hover-bg: rgba(88, 101, 242, 0.1);
          --text-color: inherit;
        }
        
        .server-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          color: var(--text-color);
          transition: all 0.2s ease;
          cursor: pointer;
          user-select: none;
        }
        
        .server-item:hover:not(.active) {
          background: var(--hover-bg);
        }
        
        .active {
          background: var(--active-bg) !important;
          color: white !important;
        }
        
        .icon-circle-bg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-color);
          margin-right: 1rem;
          flex-shrink: 0;
          transition: background-color 0.2s ease;
        }
        
        .icon-circle-bg img {
          width: 20px;
          height: 20px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }
        
        .server-details {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          overflow: hidden;
        }
        
        .server-title {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .server-meta {
          font-size: 0.75rem;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .server-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
        }
        
        .server-custom-slot {
          width: 100%;
        }
      </style>
    `;
  }
  
  static get observedAttributes() {
    return ['data-server', 'data-size', 'data-version', 'data-modified', 'data-status', 'icon', 'title', 'active'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }
  
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const bytes_num = parseInt(bytes);
    if (isNaN(bytes_num)) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes_num) / Math.log(1024));
    return `${(bytes_num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }
  
  formatDate(dateString) {
    if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
      } catch {
        return '';
      }
  }
  
  render() {
    const title = this.getAttribute('title') || '';
    const icon = this.getAttribute('icon') || '';
    const size = this.getAttribute('data-size') || 0;
    const version = this.getAttribute('data-version') || 'Unknown';
    const modified = this.getAttribute('data-modified') || '';
    const status = this.getAttribute('data-status') || '';
    
    const formattedSize = this.formatFileSize(size);
    const formattedDate = this.formatDate(modified);
    const serverClass = this._active ? 'server-item active' : 'server-item';
    const serverId = title.replace(/\s+/g, '-').toLowerCase();
    
    this.shadowRoot.innerHTML = `
      ${this.getStyles()}
      <div class="${serverClass}" id="server-${serverId}">
        <div class="icon-circle-bg">
          <img src="${icon}" alt="${title}">
        </div>
        <div class="server-details">
          <span class="server-title">${title}</span>
          <span class="server-meta">Size: ${formattedSize} | Modified: ${formattedDate} | v${version}</span>
        </div>
        <div class="server-actions" id="server-actions-${serverId}">
          <div class="server-custom-slot">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    const serverItem = this.shadowRoot.querySelector('.server-item');
    
    serverItem.addEventListener('click', (e) => {
      // Si el clic fue en server-actions o sus elementos hijos, no seleccionar el servidor
      if (e.target.closest('.server-actions')) {
        return;
      }
      
      this.setActive(true);
      
      // Dispatch custom event with server data
      this.dispatchEvent(new CustomEvent('server-selected', {
        detail: this.getDetails(),
        bubbles: true,
        composed: true
      }));
    });
    serverItem.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('server-contextmenu', {
        detail: this.getDetails(),
        bubbles: true,
        composed: true
      }));
    });
  }
  getDetails(){
    return {
      server: this.getAttribute('data-server'),
      size: parseInt(this.getAttribute('data-size')) || 0,
      modified: this.getAttribute('data-modified') || '',
      version: this.getAttribute('data-version') || 'Unknown',
      status: this.getAttribute('data-status') || ''
    };
  }
  
  setActive(active) {
    this._active = active;
    const serverItem = this.shadowRoot.querySelector('.server-item');
    
    if (active) {
      serverItem.classList.add('active');
    } else {
      serverItem.classList.remove('active');
    }
  }
}

// Definir los componentes web personalizados
customElements.define('server-menu', ServerMenu);
customElements.define('server-item', ServerItem);

class GridSelector extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._selected = null;
  }

  static get observedAttributes() {
      return ['data'];
  }

  connectedCallback() {
      this.render();
      this.addEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'data' && oldValue !== newValue) {
          this.render();
      }
  }
  setActiveElement(activeElement) {
    // Desmarcar todos los elementos activos
    this.shadowRoot.querySelectorAll('.sidebar-item.active, .server-item.active').forEach(item => {
      item.classList.remove('active');
    });
    if (!activeElement) return;
  }
  setServersList(servers) {
    this.serverlist = servers;
    this.loadServersList();
  }
  get data() {
      try {
          return JSON.parse(this.getAttribute('data') || '[]');
      } catch {
          return [];
      }
  }

  set data(value) {
      this.setAttribute('data', JSON.stringify(value));
  }

  get selected() {
      return this._selected;
  }

  set selected(value) {
      const oldValue = this._selected;
      this._selected = value;
      if (oldValue !== value) {
          this.dispatchEvent(new CustomEvent('change', {
              detail: { selected: value },
              bubbles: true,
              composed: true
          }));
          this.render();
      }
  }

  render() {
      const style = `
          :host {
              display: block;
          }
          .cards-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 1rem;
              padding: 1rem;
          }
          .card {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 1rem;
              border: 2px solid #ddd;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
          }
          .card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .card.active {
              border-color: #4a90e2;
              background-color: rgba(74, 144, 226, 0.1);
          }
          .icon {
              width: 64px;
              height: 64px;
              object-fit: contain;
              margin-bottom: 0.5rem;
          }
          .title {
              text-align: center;
              font-weight: 500;
          }
      `;

      const items = this.data.map(item => `
          <div class="card ${this._selected === item.id ? 'active' : ''}" data-id="${item.id}">
              <img class="icon" src="${item.img}" alt="${item.title} logo">
              <span class="title">${item.title}</span>
          </div>
      `).join('');

      this.shadowRoot.innerHTML = `
          <style>${style}</style>
          <div class="cards-grid">
              ${items}
          </div>
      `;
  }

  addEventListeners() {
      this.shadowRoot.addEventListener('click', (e) => {
          const card = e.target.closest('.card');
          if (card) {
              const id = card.dataset.id;
              this.selected = id;
              this.render();
          }
      });
  }
}

// Register the web component
customElements.define('grid-selector', GridSelector);


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
class ActionButtons extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.buttons = [];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .actions {
          display: flex;
          gap: 8px;
          padding: 8px;
        }
        
        .dark-btn {
          background: #222c3a;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s;
        }
        
        .dark-btn:hover {
          background: #2e3e53;
        }
        
        .dark-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .icon-only {
          padding: 8px;
        }
        
        .material-symbols-rounded {
          font-family: 'Material Symbols Outlined';
          font-size: 20px;
        }
        
        .hidden {
          display: none !important;
        }
      </style>
      <div class="actions">
        ${this.buttons.map(btn => this.createButtonHTML(btn)).join('')}
      </div>
    `;
    /** agregar un tooltip a los botones */
    this.shadowRoot.querySelectorAll('button').forEach(button => {
      button.addEventListener('mouseover', (e) => {
        const tooltip = button.dataset.tooltip;
        if (tooltip) {
          button.setAttribute('title', tooltip);
          button.classList.add('tooltip');
        }
      });
      button.addEventListener('click', (e) => {
        this.dispatchEvent(new CustomEvent('button-clicked', {
          detail: {
            id: button.id,
            action: button.dataset.action
          }
        }));
      });
    });
  }

  createButtonHTML(button) {
    return `
      <button 
        data-tooltip="${button.action}"
        id="${button.id}"
        class="dark-btn ${button.iconOnly ? 'icon-only' : ''}"
        data-action="${button.action}"
        ${button.disabled ? 'disabled' : ''}
      >
        <span class="material-symbols-rounded">${button.icon}</span>
        ${button.iconOnly ? '' : `<span>${button.label}</span>`}
      </button>
    `;
  }

  addButton(config) {
    this.buttons.push({
      id: config.id,
      label: config.label || '',
      icon: config.icon,
      iconOnly: config.iconOnly || false,
      action: config.action || '',
      disabled: config.disabled || false
    });
    this.render();
  }

  hideButton(buttonId) {
    const btn = this.shadowRoot.getElementById(buttonId);
    if (btn) btn.classList.add('hidden');
  }

  showButton(buttonId) {
    const btn = this.shadowRoot.getElementById(buttonId);
    if (btn) btn.classList.remove('hidden');
  }

  disableButton(buttonId) {
    const btn = this.shadowRoot.getElementById(buttonId);
    if (btn) btn.disabled = true;
  }

  enableButton(buttonId) {
    const btn = this.shadowRoot.getElementById(buttonId);
    if (btn) btn.disabled = false;
  }
  hideAllButtons() {
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.add('hidden'));
  }

  showAllButtons() {
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('hidden'));
  }

}

customElements.define('action-buttons', ActionButtons);
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