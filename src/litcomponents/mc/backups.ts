import { LitElement, html, css,type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

// Interface para los elementos de backup
interface Backup {
    name: string;
    path: string;
    size: number;
    created: string;
    createdDate: string;
    isValid: boolean;
    serverName: string;
    sizeFormatted: string;
    // Campos opcionales para compatibilidad con versiones anteriores
    isDirectory?: boolean;
    modified?: string;
}

type ActionType = 'restore' | 'download' | 'delete';

interface BackupActionEvent {
    action: ActionType;
    item: Backup;
}

@customElement('backup-list')
export class BackupListComponent extends LitElement {
    
    @property({ type: Array })
    backups: Backup[] = [];

    @property({ type: Boolean })
    showActions: boolean = true;

    static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
      /* Light mode variables */
      --border-color: #e1e5e9;
      --background-header: #f8f9fa;
      --background-hover: #f8f9fa;
      --text-primary: #495057;
      --text-secondary: #6c757d;
      --text-muted: #adb5bd;
      --box-shadow: rgba(0, 0, 0, 0.1);
      --background-color: white;
    }
  
    @media (prefers-color-scheme: dark) {
      :host {
        --border-color: #3a3f44;
        --background-header: #2a2d30;
        --background-hover: #343a40;
        --text-primary: #f1f3f5;
        --text-secondary: #ced4da;
        --text-muted: #868e96;
        --box-shadow: rgba(0, 0, 0, 0.3);
        --background-color: #1e1e1e;
      }
    }
  
    .backup-container {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px var(--box-shadow);
      background-color: var(--background-color);
    }
  
    .backup-header {
      background-color: var(--background-header);
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      font-weight: 600;
      color: var(--text-primary);
    }
  
    .backup-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      transition: background-color 0.2s ease;
      background-color: var(--background-color);
    }
  
    .backup-item:last-child {
      border-bottom: none;
    }
  
    .backup-item:hover {
      background-color: var(--background-hover);
    }
  
    .backup-info {
      flex: 1;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 16px;
      align-items: center;
    }
  
    .backup-name {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }
  
    .backup-icon {
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }
  
    .backup-size,
    .backup-modified {
      font-size: 14px;
      color: var(--text-secondary);
    }
  
    .backup-path {
      font-size: 12px;
      color: var(--text-muted);
      font-family: monospace;
    }

    .backup-server {
      font-size: 11px;
      color: var(--text-muted);
      font-style: italic;
      margin-top: 2px;
    }

    .backup-status {
      display: flex;
      justify-content: center;
    }

    .status-badge {
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.valid {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status-badge.invalid {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    @media (prefers-color-scheme: dark) {
      .status-badge.valid {
        background-color: #1e4620;
        color: #75b798;
        border: 1px solid #2d5a31;
      }

      .status-badge.invalid {
        background-color: #4a1e1e;
        color: #f5a3a3;
        border: 1px solid #5a2d2d;
      }
    }
  
    .backup-actions {
      display: flex;
      gap: 8px;
      margin-left: 16px;
    }
  
    .action-btn {
      padding: 6px 12px;
      border: 1px solid;
      border-radius: 4px;
      background: var(--background-color);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  
    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px var(--box-shadow);
    }
  
    .action-btn:active {
      transform: translateY(0);
    }
  
    .restore-btn {
      border-color: #28a745;
      color: #28a745;
    }
  
    .restore-btn:hover {
      background-color: #28a745;
      color: white;
    }
  
    .download-btn {
      border-color: #007bff;
      color: #007bff;
    }
  
    .download-btn:hover {
      background-color: #007bff;
      color: white;
    }
  
    .delete-btn {
      border-color: #dc3545;
      color: #dc3545;
    }
  
    .delete-btn:hover {
      background-color: #dc3545;
      color: white;
    }
  
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
    }
  
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  
    @media (max-width: 768px) {
      .backup-info {
        grid-template-columns: 1fr;
        gap: 4px;
      }

      .backup-actions {
        margin-left: 0;
        margin-top: 8px;
      }

      .backup-item {
        flex-direction: column;
        align-items: stretch;
      }

      .backup-status {
        justify-content: flex-start;
        margin-top: 4px;
      }
    }
  `;
  

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    private getDisplayDate(backup: Backup): string {
        // Usar 'created' como campo principal, 'modified' como fallback
        const dateToUse = backup.created || backup.modified || backup.createdDate;
        return this.formatDate(dateToUse);
    }

    private getDisplaySize(backup: Backup): string {
        // Usar 'sizeFormatted' si está disponible, sino formatear 'size'
        if (backup.sizeFormatted) {
            return backup.sizeFormatted;
        }
        return backup.isDirectory ? 'Directory' : this.formatFileSize(backup.size);
    }

    private handleAction(action: ActionType, item: Backup): void {
        const event = new CustomEvent<BackupActionEvent>('backup-action', {
            detail: {
                action,
                item
            },
            bubbles: true,
            composed: true
        });
        
        this.dispatchEvent(event);
    }

    private renderBackupItem(backup: Backup) {
        return html`
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-name">
                        <span class="backup-icon">
                            ${backup.isDirectory ? '📁' : '📄'}
                        </span>
                        <div>
                            <div>${backup.name}</div>
                            <div class="backup-path">${backup.path}</div>
                            ${backup.serverName ? html`<div class="backup-server">Server: ${backup.serverName}</div>` : ''}
                        </div>
                    </div>
                    <div class="backup-size">
                        ${this.getDisplaySize(backup)}
                    </div>
                    <div class="backup-modified">
                        ${this.getDisplayDate(backup)}
                    </div>
                    <div class="backup-status">
                        ${backup.isValid !== undefined ? 
                            html`<span class="status-badge ${backup.isValid ? 'valid' : 'invalid'}">
                                ${backup.isValid ? '✓ Valid' : '✗ Invalid'}
                            </span>` : 
                            ''
                        }
                    </div>
                </div>
                
                ${this.showActions ? html`
                    <div class="backup-actions">
                        <button 
                            class="action-btn restore-btn"
                            @click=${() => this.handleAction('restore', backup)}
                            title="Restore backup"
                        >
                            Restore
                        </button>
                        <button 
                            class="action-btn download-btn"
                            @click=${() => this.handleAction('download', backup)}
                            title="Download backup"
                        >
                            Download
                        </button>
                        <button 
                            class="action-btn delete-btn"
                            @click=${() => this.handleAction('delete', backup)}
                            title="Delete backup"
                        >
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    render() {
        if (!this.backups || this.backups.length === 0) {
            return html`
                <div class="backup-container">
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <h3>No backups found</h3>
                        <p>There are no backup items to display.</p>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="backup-container">
                <div class="backup-header">
                    Backup Items (${this.backups.length})
                </div>
                ${repeat(
                    this.backups,
                    (backup) => `${backup.path}-${backup.name}`,
                    (backup) => this.renderBackupItem(backup)
                )}
            </div>
        `;
    }
}
export type { Backup, BackupActionEvent, ActionType };
// Agregar la declaración del evento para TypeScript
declare global {
    interface HTMLElementEventMap {
        'backup-action': CustomEvent<BackupActionEvent>;
    }
}