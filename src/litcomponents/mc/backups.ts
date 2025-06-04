import { LitElement, html, css,type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

// Interface para los elementos de backup
interface Backup {
    isDirectory: boolean;
    modified: string;
    name: string;
    path: string;
    size: number;
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
      grid-template-columns: 2fr 1fr 1fr 1fr;
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
                        </div>
                    </div>
                    <div class="backup-size">
                        ${backup.isDirectory ? 'Directory' : this.formatFileSize(backup.size)}
                    </div>
                    <div class="backup-modified">
                        ${this.formatDate(backup.modified)}
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