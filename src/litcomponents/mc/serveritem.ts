import { LitElement, html, css,type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface ServerDetails {
  server: string | null;
  size: number;
  modified: string | null;
  version: string;
  status: string | null;
  title: string | null;
  icon: string | null;
}

@customElement('server-item')
export class ServerItem extends LitElement {
  // Propiedades reactivas
  @property({ type: String, attribute: 'data-server' }) server: string | null = null;
  @property({ type: Number, attribute: 'data-size' }) size: number = 0;
  @property({ type: String, attribute: 'data-version' }) version: string = 'Unknown';
  @property({ type: String, attribute: 'data-modified' }) modified: string | null = null;
  @property({ type: String, attribute: 'data-status' }) status: string | null = null;
  @property({ type: String }) icon: string | null = null;
  @property({ type: String }) title: string = '';
  @property({ type: Boolean, reflect: true }) active: boolean = false;

  // Estilos del componente
  static styles = css`
    :host {
      display: block;
      --primary-color: #5865F2;
      --active-bg: #5865F280;
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
  `;

  // Formatea el tamaño del archivo para mostrarlo
  private formatFileSize(bytes: number | null): string {
    if (!bytes) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }
  
  // Formatea la fecha para mostrarla
  private formatDate(dateString: string | null): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  }

  // Obtiene los detalles del servidor
  public getDetails(): ServerDetails {
    return {
      server: this.server,
      size: this.size,
      modified: this.modified,
      version: this.version,
      status: this.status,
      title: this.title,
      icon: this.icon
    };
  }
  
  // Establece el estado activo del elemento
  public setActive(isActive: boolean): void {
    this.active = isActive;
  }

  // Maneja el clic en el elemento
  private handleClick(e: MouseEvent): void {
    const path = e.composedPath();
    const actionsContainer = this.shadowRoot?.querySelector('.server-actions');
    const slot = this.shadowRoot?.querySelector('slot');
    
    const clickedOnSlotted = slot && Array.from(slot.assignedNodes()).some(node => 
      path.includes(node) || 
      (node instanceof Element && node.contains(e.target as Node))
    );
    
    const clickedOnActions = actionsContainer && path.includes(actionsContainer);
    
    if (clickedOnSlotted || clickedOnActions) {
      return;
    }
    
    this.setActive(true);
    this.emitEvent('selected', {data:this.getDetails(), event: e});
  }
  
  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
    console.log("menu", e);
    this.emitEvent('menu', {data:this.getDetails(), event: e});
  }
  private emitEvent(eventName: string, detail: any): void {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }
  // Se llama cuando se conecta el componente
  firstUpdated(): void {
    this.addEventListener('click', this.handleClick);
    this.addEventListener('contextmenu', this.handleContextMenu);
  }
  
  // Se llama cuando se desconecta el componente
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleClick);
    this.removeEventListener('contextmenu', this.handleContextMenu);
  }

  // Renderiza el componente
  render() {
    const formattedSize = this.formatFileSize(this.size);
    const formattedDate = this.formatDate(this.modified);
    const serverClass = this.active ? 'server-item active' : 'server-item';
    const serverId = this.title ? this.title.replace(/\s+/g, '-').toLowerCase() : '';
    
    return html`
      <div class="${serverClass}" id="server-${serverId}">
        <div class="icon-circle-bg">
          <img src="${this.icon || ''}" alt="${this.title || ''}">
        </div>
        <div class="server-details">
          <span class="server-title">${this.title || ''}</span>
          <span class="server-meta">Size: ${formattedSize} | Modified: ${formattedDate} | v${this.version}</span>
        </div>
        <div class="server-actions" id="server-actions-${serverId}">
          <div class="server-custom-slot">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}