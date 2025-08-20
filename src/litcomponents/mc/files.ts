import { LitElement, html, css, type PropertyValueMap } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string | Date;
  isDirectory?: boolean;
  modified?: string | Date;
}

export type ItemSelectedEventDetail = {
  data: FileSystemItem;
};

export type ItemMenuEventDetail = {
  event: MouseEvent;
  data: FileSystemItem;
};

export type PathUpdatedEventDetail = {
  path: string;
};

@customElement('file-explorer')
export class FileExplorer extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--file-explorer-font-family, Arial, sans-serif);
      color: var(--file-explorer-text-color, #ccc);
      background-color: var(--file-explorer-background-color, #1e1e1e);
      border: 1px solid var(--file-explorer-border-color, rgb(46, 62, 83, 0.5));
      overflow-y: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: var(--file-explorer-header-bg, #2a2d2e);
      color: var(--file-explorer-header-color, #e0e0e0);
      position: sticky;
      top: 0;
      z-index: 1;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--file-explorer-row-border-color, rgb(46, 62, 83, 0.5));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    tr:hover {
      background-color: var(--file-explorer-row-hover-bg, #2c313a);
      cursor: pointer;
    }
    .icon {
      width: 20px;
      height: 20px;
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }
    .directory .icon {
      color: var(--file-explorer-dir-icon-color, #569cd6);
    }
    .file .icon {
      color: var(--file-explorer-file-icon-color, #d4d4d4);
    }
  `;

  @property({ type: String, attribute: 'current-path' })
  private _rawCurrentPath: string = '/';

  public get currentPath(): string {
    return this.normalizePath(this._rawCurrentPath);
  }
  
  public set currentPath(value: string) {
    const oldValue = this._rawCurrentPath;
    this._rawCurrentPath = value;
    this.requestUpdate('currentPath', oldValue);
  }

  @property({ type: Array })
  public data: FileSystemItem[] = [];

  private get processedData(): FileSystemItem[] {
    return (this.data || []).map(item => ({
      ...item,
      name: item.name || 'Unnamed',
      path: this.normalizePath(item.path),
      type: item.type || (item.isDirectory ? "directory" : "file"),
      lastModified: item.lastModified || item.modified || new Date().toISOString(),
      size: item.size === undefined && (item.type === 'file' || (!item.isDirectory && !item.type)) ? 0 : item.size,
    }));
  }

  protected updated(changedProperties: PropertyValueMap<any>): void {
    if (changedProperties.has('_rawCurrentPath')) {
      const newPath = this.currentPath;
      this._emitEvent('updated', { data: newPath, path: newPath });
    }
  }

  private normalizePath(path?: string): string {
    if (!path) return "/";
    
    let normalized = path.replace(/\/+/g, '/');
    
    if (normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    if (!normalized.startsWith('/') && !normalized.startsWith('./')) {
      normalized = '/' + normalized;
    }
    
    if (normalized === '') return '/';
    
    return normalized;
  }

  private formatFileSize(bytes?: number): string {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '-';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatDate(dateInput?: string | Date): string {
    if (!dateInput) return "-";
    
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return "-";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      return "-";
    }
  }

  private _handleDblClick(item: FileSystemItem): void {
    this._emitEvent('selected', { data: item });
  }

  private _handleContextMenu(event: MouseEvent, item: FileSystemItem): void {
    event.preventDefault();
    this._emitEvent('menu', { event, data: item });
  }
  
  private _emitEvent<T>(eventName: string, detail: T): void {
    this.dispatchEvent(new CustomEvent<T>(eventName, {
      detail,
      bubbles: true,
      composed: true,
    }));
  }

  @property({ type: String })
  public sortColumn: string = 'name';
  
  @property({ type: String })
  public sortDirection: 'asc' | 'desc' = 'asc';
  
  @state()
  private _headerIcons = {
    name: '↕️',
    path: '↕️',
    size: '↕️',
    lastModified: '↕️'
  };
  
  private get sortedData(): FileSystemItem[] {
    const data = [...this.processedData];
    
    return data.sort((a, b) => {
      let valueA, valueB;
      
      switch (this.sortColumn) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'path':
          valueA = a.path.toLowerCase();
          valueB = b.path.toLowerCase();
          break;
        case 'size':
          // Always sort directories before files when sorting by size
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          
          valueA = a.size || 0;
          valueB = b.size || 0;
          break;
        case 'lastModified':
          valueA = new Date(a.lastModified || a.modified || '').getTime();
          valueB = new Date(b.lastModified || b.modified || '').getTime();
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }
      
      // Apply sort direction
      if (this.sortDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }
  
  private _handleSort(column: string): void {
    if (this.sortColumn === column) {
      // Toggle sort direction if clicking on the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort column with default ascending direction
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Update header icons
    this._updateHeaderIcons();
    
    // Trigger a re-render
    this.requestUpdate();
    
    // Emit sort event
    this._emitEvent('sort', { column: this.sortColumn, direction: this.sortDirection });
  }
  
  private _updateHeaderIcons(): void {
    // Reset all icons
    const icons = {
      name: '↕️',
      path: '↕️',
      size: '↕️',
      lastModified: '↕️'
    };
    
    // Set the icon for the sorted column
    icons[this.sortColumn as keyof typeof icons] = this.sortDirection === 'asc' ? '⬆️' : '⬇️';
    
    this._headerIcons = icons;
  }
  
  render() {
    return html`
      <table>
        <thead>
          <tr>
            <th @click="${() => this._handleSort('name')}">
              Name ${this._headerIcons.name}
            </th>
            <th @click="${() => this._handleSort('path')}">
              Path ${this._headerIcons.path}
            </th>
            <th @click="${() => this._handleSort('size')}">
              Size ${this._headerIcons.size}
            </th>
            <th @click="${() => this._handleSort('lastModified')}">
              Modified ${this._headerIcons.lastModified}
            </th>
          </tr>
        </thead>
        <tbody>
          ${this.sortedData.map((item) => html`
            <tr
              class="${item.type}"
              tabindex="0" 
              aria-label="File ${item.name}, type ${item.type}"
              @dblclick="${() => this._handleDblClick(item)}"
              @contextmenu="${(e: MouseEvent) => this._handleContextMenu(e, item)}"
              @keydown="${(e: KeyboardEvent) => { 
                if (e.key === 'Enter' || e.key === ' ') this._handleDblClick(item); 
              }}"
            >
              <td>
                <span class="icon">${item.type === 'directory' ? '📁' : '📄'}</span>
                ${item.name}
              </td>
              <td>${item.path}</td>
              <td>${item.type === 'directory' ? '-' : this.formatFileSize(item.size)}</td>
              <td>${this.formatDate(item.lastModified)}</td>
            </tr>
          `)}

        </tbody>
      </table>
    `;
  }
}