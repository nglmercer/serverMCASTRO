import { LitElement, html, css, type PropertyValueMap } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// 1. Define an Interface for file/directory items
export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number; // Optional for directories, required for files
  lastModified: string | Date; // Can be a string or a Date object
  // Original properties for normalization robustness
  isDirectory?: boolean;
  modified?: string | Date;
}

// Define custom event detail types
export interface ItemDblClickEventDetail {
  item: FileSystemItem;
}

export interface ItemContextMenuEventDetail {
  item: FileSystemItem;
  x: number;
  y: number;
  target: EventTarget | null;
}

export interface PathUpdatedEventDetail {
  path: string;
}

@customElement('file-explorer')
export class FileExplorer extends LitElement {
  // 2. LitElement Base and static styles
  static styles = css`
    :host {
      display: block;
      font-family: var(--file-explorer-font-family, Arial, sans-serif);
      color: var(--file-explorer-text-color, #ccc);
      background-color: var(--file-explorer-background-color, #1e1e1e);
      border: 1px solid var(--file-explorer-border-color, rgb(46, 62, 83, 0.5));
      overflow-y: auto; /* For scrollable content if it overflows */
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: var(--file-explorer-header-bg, #2a2d2e);
      color: var(--file-explorer-header-color, #e0e0e0);
      position: sticky; /* Keep headers visible on scroll */
      top: 0;
      z-index: 1;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--file-explorer-row-border-color, rgb(46, 62, 83, 0.5));
      white-space: nowrap; /* Prevent text wrapping in cells */
      overflow: hidden;
      text-overflow: ellipsis; /* Show ... for overflowed text */
    }
    tr:hover {
      background-color: var(--file-explorer-row-hover-bg, #2c313a);
      cursor: pointer;
    }
    .icon {
      width: 20px; /* Fixed width for alignment */
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
    /* For better visual feedback on focus, if delegatesFocus is not enough */
    /* tr:focus-visible {
      outline: 2px solid var(--file-explorer-focus-ring-color, #007acc);
      outline-offset: -1px;
    } */
  `;

  // 3. @property decorators
  @property({ type: String, attribute: 'current-path' })
  private _rawCurrentPath: string = './'; // Keep raw value to track changes

  public get currentPath(): string {
    return this.normalizePath(this._rawCurrentPath);
  }
  public set currentPath(value: string) {
    const oldValue = this._rawCurrentPath;
    this._rawCurrentPath = value;
    this.requestUpdate('currentPath', oldValue); // Ensure dependent getter updates
  }

  @property({ type: Array })
  public data: FileSystemItem[] = [];

  // Processed data for rendering, includes normalization
  private get processedData(): FileSystemItem[] {
    return (this.data || []).map(item => ({
      ...item,
      name: item.name || 'Unnamed', // Provide a default name
      path: this.normalizePath(item.path),
      type: item.type || (item.isDirectory ? "directory" : "file"),
      lastModified: item.lastModified || item.modified || new Date().toISOString(), // Ensure lastModified exists
      size: item.size === undefined && (item.type === 'file' || (!item.isDirectory && !item.type)) ? 0 : item.size, // Default size for files if undefined
    }));
  }

  // Lifecycle: updated
  // Use `updated` to react to property changes, like `currentPath`
  protected updated(changedProperties: PropertyValueMap<any | string | number | symbol>): void {
    if (changedProperties.has('_rawCurrentPath')) {
      const newPath = this.currentPath; // This will be the normalized path
      // Dispatch an event when the path is effectively changed and normalized.
      // The consumer can listen to this to update external displays.
      this.dispatchEvent(new CustomEvent<PathUpdatedEventDetail>('path-updated', {
        detail: { path: newPath },
        bubbles: true,
        composed: true,
      }));
    }
  }

  // 7. Utility Methods (private as they are internal helpers)
  private normalizePath(path?: string): string {
    if (!path) return "/";
    let normalized = path.replace(/\/+/g, '/'); // Remove duplicate slashes
    if (normalized !== '/' && normalized.endsWith('/')) { // Remove trailing slash unless it's root
        normalized = normalized.slice(0, -1);
    }
    if (!normalized.startsWith('/') && !normalized.startsWith('./') && !normalized.startsWith('../')) {
        normalized = './' + normalized; // Ensure relative paths start with ./
    }
    if (normalized === '') return './'; // Handle empty string case
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
        if (isNaN(date.getTime())) return "-"; // Invalid date

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        // const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`; // Omitting seconds for brevity
    } catch (e) {
        return "-"; // Handle potential errors with date parsing
    }
  }

  // 6. Event Handling (defined in render, handlers are methods)
  private _handleDblClick(item: FileSystemItem): void {
    this.dispatchEvent(new CustomEvent<ItemDblClickEventDetail>('item-dblclick', {
      detail: { item },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleContextMenu(event: MouseEvent, item: FileSystemItem): void {
    event.preventDefault();
    this.dispatchEvent(new CustomEvent<ItemContextMenuEventDetail>('item-contextmenu', {
      detail: {
        item,
        x: event.clientX,
        y: event.clientY,
        target: event.currentTarget, // currentTarget will be the TR element
      },
      bubbles: true,
      composed: true,
    }));
  }

  // 4. render() Method
  render() {
    return html`
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Path</th>
            <th>Size</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          ${this.processedData.map((item) => html`
            <tr
              class="${item.type}"
              tabindex="0" /* Make rows focusable for accessibility */
              aria-label="File ${item.name}, type ${item.type}"
              @dblclick="${() => this._handleDblClick(item)}"
              @contextmenu="${(e: MouseEvent) => this._handleContextMenu(e, item)}"
              @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') this._handleDblClick(item); }}"
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
          ${this.processedData.length === 0 ? html`
            <tr>
              <td colspan="4" style="text-align: center; padding: 20px;">No items to display.</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    `;
  }
}
