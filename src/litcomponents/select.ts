import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

interface Option {
  value: string | number;
  label: string;
  img?: string;
  image?: string;
  html?: string;
  state?: string;
}

export class  ESelectLit extends LitElement {
  static styles = css`
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

    .preview-container {
      border: 0px;
      margin-bottom: 12px;
      padding: 8px;
      border-bottom: 1px solid var(--enhanced-select-divider-color, #2e3e53);
      min-height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .preview-container:empty {
        display: none;
    }

    .preview-container img {
      max-width: 100%;
      max-height: 150px;
      object-fit: contain;
      border-radius: 4px;
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
  `;

  @property({ type: Array }) options: Option[] = [];
  @property({ type: Array }) selectedValues: string[] = [];
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property({ type: Boolean, reflect: true }) grid = false;

  updated(changedProperties: Map<string, any>): void {
    if (changedProperties.has('multiple')) {
      const oldValue = changedProperties.get('multiple');
      if (oldValue !== undefined && this.multiple !== oldValue) {
         this.selectedValues = [];
         this._dispatchChange([]);
      }
    }

    if (changedProperties.has('options') || changedProperties.has('selectedValues')) {
      this._validateSelection();
    }
  }

  private _validateSelection(): void {
      const validValues = new Set(this.options.map(opt => String(opt.value)));
      const currentSelected = this.selectedValues.map(String);

      const newSelectedValues = currentSelected.filter(val => validValues.has(val));

      if (newSelectedValues.length !== this.selectedValues.length) {
          this.selectedValues = newSelectedValues;
          this._dispatchChange(this.getSelectedOptions());
      }
  }

  private _handleOptionClick(event: Event): void {
    const optionElement = event.currentTarget as HTMLElement;
    const value = optionElement.dataset.value;

    if (!value) return;

    if (this.multiple) {
      this._toggleOption(value);
    } else {
      this._selectOption(value);
    }
  }

  private _toggleOption(value: string): void {
    const index = this.selectedValues.indexOf(value);
    let newSelectedValues: string[];

    if (index === -1) {
      newSelectedValues = [...this.selectedValues, value];
    } else {
      newSelectedValues = this.selectedValues.filter(v => v !== value);
    }
    this.selectedValues = newSelectedValues;
    this._dispatchChange(this.getSelectedOptions());
  }

  private _selectOption(value: string): void {
    if (this.selectedValues.length === 1 && this.selectedValues[0] === value) {
        return;
    }

    this.selectedValues = [value];
    this._dispatchChange(this.getSelectedOptions());
  }

  private _dispatchChange(detail: Option[] | Option | null): void {
     this.dispatchEvent(new CustomEvent('change', {
       detail: detail,
       bubbles: true,
       composed: true
     }));
  }

  getSelectedOptions(): Option[] | Option | null {
    if (!this.options || this.options.length === 0) return this.multiple ? [] : null;

    const selectedSet = new Set(this.selectedValues.map(String));
    const selected = this.options.filter(opt => selectedSet.has(String(opt.value)));

    return this.multiple ? selected : (selected[0] || null);
  }

  render() {
    const selectedOptions = this.getSelectedOptions();

    return html`
      <div class="select-container">
        ${this._renderPreview(selectedOptions)}
        <div class="options-list">
          ${map(this.options, (option) => this._renderOption(option))}
        </div>
      </div>
    `;
  }

  private _renderOption(option: Option) {
    const isSelected = this.selectedValues.includes(String(option.value));
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
        ${when(option.img, () => html`<img src="${option.img}" alt="">`)}
        <span class="option-label">${option.label}</span>
        ${when(option.state, () => html`<span class="option-state">${option.state}</span>`)}
      </div>
    `;
  }

  private _renderPreview(selectedOptions: Option[] | Option | null) {
    const optionsToShow = Array.isArray(selectedOptions) ? selectedOptions : (selectedOptions ? [selectedOptions] : []);

    if (optionsToShow.length === 0) {
      return html``;
    }

    return html`
      <div class="preview-container" aria-label="Preview of selected items">
        ${map(optionsToShow, (option) => {
          if (option.image || option.img) {
            return html`<img src="${option.image || option.img}" alt="${option.label}">`;
          } else if (option.html) {
            const div = document.createElement('div');
            div.innerHTML = option.html;
            return div;
          }
          return html``;
        })}
      </div>
    `;
  }

  setOptions(newOptions: Option[]): void {
    this.options = newOptions || [];
  }

  setSelectedValues(values: string[] | string | null): void {
    const newValues = Array.isArray(values) ? values : (values != null ? [String(values)] : []);
    const validOptionValues = new Set(this.options.map(opt => String(opt.value)));
    this.selectedValues = newValues.map(String).filter(v => validOptionValues.has(v));
  }

  getValue(): string[] | string | null {
    if (this.multiple) {
      return [...this.selectedValues];
    } else {
      return this.selectedValues.length > 0 ? this.selectedValues[0] : null;
    }
  }
}

customElements.define('lit-select', ESelectLit);