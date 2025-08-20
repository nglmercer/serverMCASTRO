import { LitElement, html, css, type PropertyValues, type TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
// import { ifDefined } from 'lit/directives/if-defined.js'; // No se usará directamente en este ejemplo, pero es bueno tenerlo
import { map } from 'lit/directives/map.js';

// Definimos una interfaz para los elementos que son objetos
interface ElementObject {
  name: string;
  filename?: string;
  // Aquí podrías añadir más propiedades si tus elementos objeto las tuvieran
}

// El tipo para un elemento en la lista, puede ser string u ElementObject
type PluginListItem = string | ElementObject;

// Definimos los detalles esperados para los eventos
interface ToggleEventDetail {
  item: string; // Siempre será el nombre del archivo (string)
  type: string;
  newName: string;
  state: boolean;
}

interface DeleteEventDetail {
  item: string; // Siempre será el nombre del archivo (string)
  type: string;
}


@customElement('plugins-ui')
export class PluginsUI extends LitElement {
  @property({ type: Array })
  elements: PluginListItem[] = [];

  @property({ type: String })
  type: string = "plugins";

  static styles = css`
      :host {
        display: block;
        width: 100%;
      }
      button {
        appearance: none;
        outline: none;
        border: 0;
        padding: 12px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        font-size: 14pt;
        cursor: pointer;
      }
      button:hover {
        background: var(--bg-dark-accent-light, #333c4a);
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
        box-sizing: border-box;
      }
      .item-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .filename {
        color: white;
        word-break: break-all; /* Evitar desbordamiento con nombres largos */
      }
      .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 28px;
        flex-shrink: 0;
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
        background-color: transparent;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
      }
      .icon-only {
        padding: 8px;
        line-height: 0;
      }
      .icon-only .material-symbols-outlined {
        font-size: 20px;
      }
      #elements-list-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 10px;
      }
    `;

  // El constructor es raramente necesario en LitElement cuando se usan decoradores para propiedades.
  // constructor() {
  //   super();
  // }

  /**
   * Añade un elemento a la lista si no existe.
   * @param element El elemento (string o {name: string}) a añadir.
   * @returns true si el elemento fue añadido, false si ya existía.
   */
  addElement(element: PluginListItem): boolean {
    const elementName = typeof element === 'string' ? element : element.name;
    if (!this.elements.some(el => (typeof el === 'string' ? el : el.name) === elementName)) {
      this.elements = [...this.elements, element];
      return true;
    }
    return false;
  }

  /**
   * Elimina un elemento específico de la lista.
   * @param elementToRemove El elemento (string o {name: string}) a eliminar.
   * @returns true si el elemento fue eliminado, false si no se encontró.
   */
  removeElement(elementToRemove: PluginListItem): boolean {
    const elementNameToRemove = typeof elementToRemove === 'string' ? elementToRemove : elementToRemove.name;
    const initialLength = this.elements.length;
    this.elements = this.elements.filter(el => (typeof el === 'string' ? el : el.name) !== elementNameToRemove);
    return this.elements.length < initialLength;
  }

  // El setter para 'elements' ya es manejado por @property.
  // Para actualizar, simplemente asigna: this.elements = newList;

  // El setter para 'type' también es manejado por @property.
  // Para actualizar: this.type = newType;

  private _getItemName(item: PluginListItem): string {
    return typeof item === 'string' ? item : item.name;
  }

  private _createItemHTML(item: PluginListItem, itemType: string): TemplateResult | typeof nothing {
    const itemName = this._getItemName(item);
    if (!itemName) {
      console.warn("Item sin nombre:", item);
      return nothing; // No renderizar si no hay nombre
    }

    const isEnabled = !itemName.toLowerCase().match(/\.jar\..+$/);
    const displayName = itemName.replace(/\.jar(\..+)?$/i, ''); // Remueve .jar y cualquier sufijo adicional

    return html`
        <div class="item" data-item-name="${itemName}">
          <div class="item-container">
            <label class="switch">
              <input
                type="checkbox"
                .checked=${isEnabled}
                data-item-name="${itemName}"
                data-item-type="${itemType}"
                aria-label="Toggle ${displayName}"
              />
              <span class="slider round"></span>
            </label>
            <span class="filename">${displayName}</span>
          </div>
          <button
            class="dark-btn icon-only"
            data-item-name="${itemName}"
            data-item-type="${itemType}"
            aria-label="Delete ${displayName}"
          >
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      `;
  }

  private _handleToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target || target.type !== 'checkbox' || !target.dataset.itemName) {
      return;
    }

    const itemName = target.dataset.itemName!; // Sabemos que existe por la guarda anterior
    const itemType = target.dataset.itemType || this.type;
    const isEnabled = target.checked;

    // Lógica para determinar el nuevo nombre
    let newName: string;
    const hasDisabledSuffix = itemName.toLowerCase().match(/\.jar\..+$/);
    
    if (isEnabled) {
      // Si se habilita y tenía sufijo de deshabilitado (.jar.algo), quitarlo
      if (hasDisabledSuffix) {
        newName = itemName.replace(/\.jar\..+$/i, '.jar');
      } else {
        newName = itemName; // Ya estaba habilitado
      }
    } else {
      // Si se deshabilita, añadir .disabled si no lo tiene
      if (hasDisabledSuffix) {
        newName = itemName; // Ya estaba deshabilitado
      } else {
        newName = itemName + '.disabled';
      }
    }


    this._emitEvent('toggle', { item: itemName, type: itemType, newName, state: isEnabled });

  }

  private _handleDelete(event: Event): void {
    const button = (event.target as HTMLElement).closest('button.dark-btn') as HTMLButtonElement;
    if (!button || !button.dataset.itemName) {
      return;
    }

    const itemName = button.dataset.itemName!;
    const itemType = button.dataset.itemType || this.type;

    this._emitEvent('delete', { item: itemName, type: itemType });
  }

  private _emitEvent(eventName: 'toggle', detail: ToggleEventDetail): void;
  private _emitEvent(eventName: 'delete', detail: DeleteEventDetail): void;
  private _emitEvent(eventName: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  render(): TemplateResult {
    return html`
        <link href="/materialSymbols.css" rel="stylesheet" />
        <div
          id="elements-list-container"
          @change=${this._handleToggle}
          @click=${this._handleDelete}
        >
          ${map(this.elements, (item) => this._createItemHTML(item, this.type))}
        </div>
      `;
  }

  // `updated` podría ser útil si necesitas reaccionar a cambios de propiedades
  // de una manera que no sea solo re-renderizar.
  // protected updated(changedProperties: PropertyValues<this>): void {
  //   if (changedProperties.has('elements')) {
  //     // Hacer algo cuando 'elements' cambie, si es necesario además del re-render
  //   }
  // }
}
export type {
  ToggleEventDetail,
  DeleteEventDetail
}

// Para declarar el tipo globalmente si usas el componente en HTML directamente con TypeScript
// (esto es más para proyectos grandes donde se quiere type-checking en plantillas HTML)
// declare global {
//   interface HTMLElementTagNameMap {
//     'plugins-ui': PluginsUI;
//   }
// }