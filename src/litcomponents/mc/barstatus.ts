import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Define the structure for a button's configuration
export interface ActionButtonConfig {
  id: string;
  label?: string;
  icon: string; // Material Symbols icon name
  iconOnly?: boolean;
  action?: string; // An identifier for the action this button performs
  disabled?: boolean;
  hidden?: boolean;
  tooltip?: string; // Optional specific tooltip text
}

@customElement('action-buttons-lit')
export class ActionButtonsLit extends LitElement {
  @property({ type: Array })
  buttons: ActionButtonConfig[] = [];

  static styles = css`
    :host {
      display: block; /* Or inline-block, depending on desired layout flow */
    }
    .actions {
      display: flex;
      gap: 8px;
      padding: 8px;
    }
    .action-btn {
      background: #222c3a;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.2s, opacity 0.2s;
      font-family: inherit; /* Inherit font from host */
      font-size: inherit; /* Inherit font-size from host */
    }
    .action-btn:hover:not(:disabled) {
      background: #2e3e53;
    }
    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .icon-only {
      padding: 8px;
    }
    /* Ensure Material Symbols are loaded in your project */
    .material-symbols-rounded {
      font-family: 'Material Symbols Outlined', 'Material Symbols Rounded'; /* Add fallback */
      font-weight: normal;
      font-style: normal;
      font-size: 20px; /* Or as desired */
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      -moz-osx-font-smoothing: grayscale;
      font-feature-settings: 'liga';
    }
    .hidden {
      display: none !important;
    }
  `;

  private _handleButtonClick(buttonConfig: ActionButtonConfig): void {
    if (buttonConfig.disabled) {
      return;
    }
    this.dispatchEvent(new CustomEvent('button-clicked', {
      detail: {
        id: buttonConfig.id,
        action: buttonConfig.action,
      },
      bubbles: true, // Allows event to bubble up through the DOM
      composed: true // Allows event to cross shadow DOM boundaries
    }));
  }

  protected render(): TemplateResult {
    return html`
      <div class="actions">
        ${this.buttons.map(btn => html`
          <button
            id=${btn.id}
            class="action-btn ${btn.iconOnly ? 'icon-only' : ''} ${btn.hidden ? 'hidden' : ''}"
            title=${btn.tooltip || btn.label || btn.action || ''}
            data-action=${btn.action || ''}
            ?disabled=${btn.disabled}
            @click=${() => this._handleButtonClick(btn)}
          >
            <span class="material-symbols-rounded">${btn.icon}</span>
            ${!btn.iconOnly && btn.label ? html`<span>${btn.label}</span>` : ''}
          </button>
        `)}
      </div>
    `;
  }

  public addButton(config: Omit<ActionButtonConfig, 'hidden' | 'disabled'> & Partial<Pick<ActionButtonConfig, 'hidden' | 'disabled' | 'tooltip' | 'label' | 'action' | 'iconOnly'>>): void {
    const newButton: ActionButtonConfig = {
      label: '',
      iconOnly: false,
      action: config.id, // Default action to id if not provided
      disabled: false,
      hidden: false,
      tooltip: config.label || config.action || config.id, // Default tooltip logic
      ...config, // Spread incoming config to override defaults
    };
    this.buttons = [...this.buttons, newButton];
  }

  private _updateButtonState(buttonId: string, updates: Partial<ActionButtonConfig>): void {
    this.buttons = this.buttons.map(btn =>
      btn.id === buttonId ? { ...btn, ...updates } : btn
    );
  }

  public hideButton(buttonId: string): void {
    this._updateButtonState(buttonId, { hidden: true });
  }

  public showButton(buttonId: string): void {
    this._updateButtonState(buttonId, { hidden: false });
  }

  public disableButton(buttonId: string): void {
    this._updateButtonState(buttonId, { disabled: true });
  }

  public enableButton(buttonId: string): void {
    this._updateButtonState(buttonId, { disabled: false });
  }

  public hideAllButtons(): void {
    this.buttons = this.buttons.map(btn => ({ ...btn, hidden: true }));
  }

  public showAllButtons(): void {
    this.buttons = this.buttons.map(btn => ({ ...btn, hidden: false }));
  }

  public getButtonConfig(buttonId: string): ActionButtonConfig | undefined {
    return this.buttons.find(btn => btn.id === buttonId);
  }

  public updateButton(buttonId: string, updates: Partial<ActionButtonConfig>): void {
    this._updateButtonState(buttonId, updates);
  }
}