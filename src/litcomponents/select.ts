import { LitElement, html, css, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

// Common interface for option items
export interface SelectOption {
  value: string | number;
  label: string;
  img?: string;
  image?: string;
  html?: string;
  state?: string;
}

export abstract class BaseSelectorElement extends LitElement {
  @property({ type: Array }) options: SelectOption[] = [];
  @property({ type: Array }) Values: string[] = [];
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property({ type: Boolean, reflect: true }) grid = false;

  // --- NUEVAS PROPIEDADES ---
  @property({ type: Boolean }) showEmptyStateMessages = false;
  @property({ type: Boolean }) isLoading = false;
  @property({ type: String }) loadingMessage = 'Cargando opciones...';
  @property({ type: String }) noOptionsMessage = 'No hay opciones disponibles.';
  // --- FIN NUEVAS PROPIEDADES ---


  updated(changedProperties: Map<string, any>): void {
    if (changedProperties.has('multiple')) {
      const oldValue = changedProperties.get('multiple');
      if (oldValue !== undefined && this.multiple !== oldValue) {
        this.Values = [];
        this._dispatchChange([]);
      }
    }

    if (changedProperties.has('options') || changedProperties.has('Values')) {
      this._validateSelection();
    }
  }

  private _validateSelection(): void {
    if (!this.options || this.options.length === 0) { // Avoid validation if no options exist
        if (this.Values.length > 0) { // Clear selection if options disappear
            this.Values = [];
            this._dispatchChange(this.getSelectedOptions());
        }
        return;
    }
    const validValues = new Set(this.options.map(opt => String(opt.value)));
    const currentv = Array.isArray(this.Values) ? this.Values : [this.Values]
    const currentSelected = currentv.map(String).filter(v => v != null); // Filter out null/undefined

    const newSelectedValues = currentSelected.filter(val => validValues.has(val));

    // Only update if there were actual changes and avoid auto-selecting first element
    if (newSelectedValues.length !== currentSelected.length ||
        (this.Values && newSelectedValues.length !== this.Values.length)) {
      this.Values = newSelectedValues;
      this._dispatchChange(this.getSelectedOptions());
    }
  }

  protected _handleOptionSelect(value: string): void {
    if (!value) return;

    if (this.multiple) {
      this._toggleOption(value);
    } else {
      this._selectOption(value);
    }
  }

  private _toggleOption(value: string): void {
    const index = this.Values.indexOf(value);
    let newSelectedValues: string[];

    if (index === -1) {
      newSelectedValues = [...this.Values, value];
    } else {
      newSelectedValues = this.Values.filter(v => v !== value);
    }
    this.Values = newSelectedValues;
    this._dispatchChange(this.getSelectedOptions());
  }

  private _selectOption(value: string): void {
    if (this.Values.length === 1 && this.Values[0] === value) {
      return;
    }
    this.Values = [value];
    this._dispatchChange(this.getSelectedOptions());
  }

  protected _dispatchChange(detail: SelectOption[] | SelectOption | null): void {
    this.dispatchEvent(new CustomEvent('change', {
      detail: detail,
      bubbles: true,
      composed: true
    }));
  }

  public getSelectedOptions(): SelectOption[] | SelectOption | null {
    if (!this.options || this.options.length === 0) return this.multiple ? [] : null;

    const selectedSet = new Set(this.Values?.map(String));
    const selected = this.options.filter(opt => selectedSet.has(String(opt.value)));

    return this.multiple ? selected : (selected[0] || null);
  }

  public setOptions(newOptions: SelectOption[]): void {
    this.options = newOptions || [];
    this.isLoading = false; // Assume loading is finished when options are set
    this.requestUpdate(); // Ensure re-render
  }

  public setSelectedValues(Values: string[] | string | null): void {
    const newValues = Array.isArray(Values) ? Values : (Values != null ? [String(Values)] : []);
    if (this.options && this.options.length > 0) { // Only validate if options are present
        const validOptionValues = new Set(this.options.map(opt => String(opt.value)));
        this.Values = newValues.map(String).filter(v => validOptionValues.has(v));
    } else {
        this.Values = []; // Clear values if no options to validate against
    }
  }

  public getValue(): string[] | string | null {
    if (this.multiple) {
      return [...this.Values];
    } else {
      return this.Values.length > 0 ? this.Values[0] : null;
    }
  }

  // --- NUEVOS MÉTODOS PARA RENDERIZAR ESTADOS ---
  protected _renderLoadingState(): TemplateResult {
    return html`
      <div class="status-message">
        <div class="loading-spinner"></div>
        ${this.loadingMessage}
      </div>
    `;
  }

  protected _renderNoOptionsState(): TemplateResult {
    return html`<div class="status-message">${this.noOptionsMessage}</div>`;
  }
  // --- FIN NUEVOS MÉTODOS ---

  protected abstract generateSelectorOptions(): TemplateResult | TemplateResult[];
}

export class ListSelectorElement extends BaseSelectorElement {
  static styles = [
    css`
      :host {
        display: inherit;
        grid-template-columns: inherit;
        grid-template-rows: inherit;
        font-family: Arial, sans-serif;
        border: 0px;
      }

      .select-container {
        border-radius: 4px;
        max-width: var(--enhanced-select-max-width, 300px);
        max-height: 480px;
        overflow-y: auto;
        padding: 8px;
        background-color: var(--enhanced-select-bg-color, #1a202c);
        color: var(--enhanced-select-text-color, #e2e8f0);
      }

      :host([grid]) .select-container {
        max-width: 100%;
      }
      .options-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      :host([grid]) .options-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
      }

      .option {
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
        border: 3px solid var(--enhanced-select-option-border-color, #2e3e53);
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: var(--enhanced-select-option-bg-color, #222c3a);
        color: var(--enhanced-select-option-text-color, #cbd5e1);
      }

      .option:hover {
        background-color: var(--enhanced-select-option-hover-bg-color, #2e3e53);
        border-color: var(--enhanced-select-option-hover-border-color, #4a5568);
      }

      .option.selected {
        background-color: var(--enhanced-select-option-selected-bg-color, #222c3a);
        color: var(--enhanced-select-option-selected-text-color, #32d583);
        border-color: var(--enhanced-select-option-selected-border-color, #32d583);
        font-weight: 500;
      }

      .option img {
        width: 24px;
        height: 24px;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .option-label {
        flex-grow: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .option-state {
        font-size: 0.8em;
        opacity: 0.7;
        margin-left: auto;
        flex-shrink: 0;
      }

      /* --- ESTILOS PARA MENSAJES DE ESTADO --- */
      .status-message {
        padding: 16px;
        text-align: center;
        color: var(--enhanced-select-text-color, #e2e8f0); /* Hereda color del texto */
        font-style: italic;
      }
      .loading-spinner {
        border: 4px solid rgba(255, 255, 255, 0.3); /* Color claro con opacidad */
        border-radius: 50%;
        border-top: 4px solid var(--enhanced-select-text-color, #e2e8f0); /* Color principal del texto */
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
        margin: 0 auto 8px auto; /* Centrar y espacio abajo */
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      /* --- FIN ESTILOS PARA MENSAJES DE ESTADO --- */
    `
  ];

  public _handleOptionClick(event: Event): void {
    const optionElement = event.currentTarget as HTMLElement;
    const value = optionElement.dataset.value;
    if (value) {
      this._handleOptionSelect(value);
    }
  }

  render() {
    // const selectedOptions = this.getSelectedOptions(); // No es necesario aquí si no se usa en preview

    return html`
      <div class="select-container">
        <!-- ${this._renderPreview(this.getSelectedOptions())} --> <!-- Comentado, no está implementado -->
        ${when(this.showEmptyStateMessages && this.isLoading,
          () => this._renderLoadingState(),
          () => when(this.showEmptyStateMessages && !this.isLoading && this.options.length === 0,
            () => this._renderNoOptionsState(),
            () => html`
              <div class="options-list">
                ${this.generateSelectorOptions()}
              </div>`
          )
        )}
      </div>
    `;
  }

  protected generateSelectorOptions(): TemplateResult[] {
    if (!this.options || this.options.length === 0) {
        return []; // No generar opciones si no hay datos (aunque el render ya lo controla)
    }
    return Array.from(
      map(this.options, (option) => {
        const isSelected = this.Values?.includes(String(option.value));
        const optionClasses = classMap({
          option: true,
          selected: isSelected,
        });
    
        return html`
          <div
            class=${optionClasses}
            data-value=${option.value}
            @click=${this._handleOptionClick}
            role="option"
            aria-selected=${isSelected}
            tabindex="0"
          >
            ${when(option.img || option.image, () => html`<img src="${option.img || option.image}" alt="">`)}
            <span class="option-label">${option.label}</span>
            ${when(option.state, () => html`<span class="option-state">${option.state}</span>`)}
          </div>
        `;
      })
    ) as TemplateResult[];    
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _renderPreview(selectedOptions: SelectOption[] | SelectOption | null) {
    // Implementación del preview si es necesario
  }
}

// Grid-style selector implementation
export class GridSelectorElement extends BaseSelectorElement {
  static styles = [
    css`
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

    /* --- ESTILOS PARA MENSAJES DE ESTADO --- */
    .status-message-container { /* Contenedor para centrar en el grid */
        grid-column: 1 / -1; /* Ocupa todas las columnas del grid */
        text-align: center;
        padding: 2rem 0;
    }
    .status-message {
        color: #555; /* Color de texto para el mensaje */
        font-style: italic;
    }
    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1); /* Color base del spinner */
        border-radius: 50%;
        border-top: 4px solid #4a90e2; /* Color principal del spinner */
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px auto; /* Centrar y espacio abajo */
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    /* --- FIN ESTILOS PARA MENSAJES DE ESTADO --- */
    `
  ];

  private selectCard(value: string) {
    this._handleOptionSelect(value);
  }

  render() {
    return html`
      <div class="cards-grid">
        ${when(this.showEmptyStateMessages && this.isLoading,
          () => html`<div class="status-message-container">${this._renderLoadingState()}</div>`,
          () => when(this.showEmptyStateMessages && !this.isLoading && this.options.length === 0,
            () => html`<div class="status-message-container">${this._renderNoOptionsState()}</div>`,
            () => this.generateSelectorOptions() // generateSelectorOptions ya devuelve un array de templates
          )
        )}
      </div>
    `;
  }

  protected generateSelectorOptions(): TemplateResult[] {
    if (!this.options || this.options.length === 0) {
        return []; // No generar opciones si no hay datos
    }
    return Array.from(
      map(this.options, (option) => {
        const isSelected = this.Values.includes(String(option.value));
        return html`
          <div
            class="card ${isSelected ? 'active' : ''}"
            data-value="${option.value}"
            @click="${() => this.selectCard(String(option.value))}"
            role="option"
            aria-selected=${isSelected}
            tabindex="0"
          >
            <img class="icon" src="${option.img || option.image || ''}" alt="${option.label}" />
            <span class="title">${option.label}</span>
          </div>
        `;
      })
    ) as TemplateResult[];
  }  
}

// Version selector for software installations
export class VersionSelectorElement extends ListSelectorElement {
  static styles = [
    ...ListSelectorElement.styles,
    css`
      .option {
        position: relative;
        overflow: visible;
      }

      .option:not(.installed) {
        opacity: 0.6;
      }

      .option:not(.installed):not(:hover) .option-state {
        display: none;
      }

      .option.installed .option-state {
        color: var(--enhanced-select-option-selected-text-color, #32d583);
        font-weight: 600;
      }

      .option:not(.installed):hover .option-state {
        display: block;
        color: var(--enhanced-select-text-color, #e2e8f0);
        opacity: 0.8;
      }

      .install-button {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: var(--enhanced-select-option-selected-bg-color, #32d583);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.75em;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 10;
      }

      .option:not(.installed):hover .install-button {
        opacity: 1;
      }

      .install-button:hover {
        background: var(--enhanced-select-option-hover-bg-color, #2e8b57);
      }

      .option.installed .install-button {
        display: none;
      }
    `
  ];

  private _handleInstallClick(event: Event, version: string): void {
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent('install-version', {
      detail: { version },
      bubbles: true,
      composed: true
    }));
  }

  protected generateSelectorOptions(): TemplateResult[] {
    if (!this.options || this.options.length === 0) {
      return [];
    }
    
    return Array.from(
      map(this.options, (option) => {
        const isSelected = this.Values?.includes(String(option.value));
        const isInstalled = option.state === 'instalado' || option.state === 'installed' || option.state === 'true';
        const optionClasses = classMap({
          option: true,
          selected: isSelected,
          installed: isInstalled,
        });

        return html`
          <div
            class=${optionClasses}
            data-value=${option.value}
            @click=${this._handleOptionClick}
            role="option"
            aria-selected=${isSelected}
            tabindex="0"
          >
            ${when(option.img || option.image, () => html`<img src="${option.img || option.image}" alt="">`)}
            <span class="option-label">${option.label}</span>
            ${when(option.state, () => html`<span class="option-state">${option.state}</span>`)}
            ${when(!isInstalled, () => html`
              <button 
                class="install-button"
                @click=${(e: Event) => this._handleInstallClick(e, String(option.value))}
                title="Instalar ${option.label}"
              >
                Instalar
              </button>
            `)}
          </div>
        `;
      })
    ) as TemplateResult[];
  }
}

// Register custom elements
customElements.define('list-selector', ListSelectorElement);
customElements.define('version-selector', VersionSelectorElement);
customElements.define('grid-selector', GridSelectorElement);