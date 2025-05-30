import { LitElement, html, css } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { filemanagerapi } from 'src/fetch/fetchapi';
import { urlbase } from 'src/config/url';
@customElement('server-properties')
export class ServerPropertiesLitElement extends LitElement {
    @property({ type: String, attribute: 'server-id' })
    serverId = window.selectedServer || '';

    @state()
    private _properties: Array<{ key: string; value: unknown; originalType: string; displayValue: unknown }> = [];

    @state()
    private _isLoading = false;

    @state()
    private _error: string | null = null;

    // No es necesario tenerlos como strings, Lit puede crear los elementos directamente
    // SWITCH_ELEMENT = '<label class="switch"> <input type="checkbox"$0> <span class="slider round"></span></label>';
    // NUMBER_INPUT = "<input type='number' value='$0'>";
    // TEXT_INPUT = "<input type='text' value='$0'>";

    static styles = css`
        :host {
            width: 100%;
            border-radius: 8px;
            box-sizing: border-box;
            color-scheme: light dark; /* Adapts to system theme */
            display: block; /* Good default for custom elements */
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
            margin-top: 10px;
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
            border: 1px solid var(--table-border-color, rgba(46, 62, 83, 0.5)); /* CSS Var for theming */
        }
        td {
            padding: 8px;
            border: 1px solid var(--table-border-color, rgba(46, 62, 83, 0.5));
        }
        input[type="text"], input[type="number"] {
            width: calc(100% - 12px); /* Take padding into account */
            padding: 6px;
            box-sizing: border-box;
            border: 1px solid var(--input-border-color, #ccc);
            border-radius: 4px;
        }
        .error-message {
            color: red;
            margin-bottom: 10px;
        }
        .loading-message {
            padding: 10px;
            text-align: center;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this._loadProperties();
    }

    updated(changedProperties: Map<string | number | symbol, unknown>) {
        if (changedProperties.has('serverId') && this.serverId) {
            this._loadProperties();
        }
    }

    private _getValueType(value: any): string {
        if (value === null) return "null";
        const type = typeof value;
        if (type === "boolean" || type === "number") return type;
        return "string";
    }

    private _parseValueByType(value: string | boolean, type: string): any {
        switch (type) {
            case "null":
                return value === "" ? null : String(value); // If a null field gets text, treat it as string
            case "boolean":
                return value === "true" || value === true;
            case "number":
                const num = Number(value);
                return isNaN(num) ? 0 : num;
            default:
                return String(value);
        }
    }

    private async _loadProperties() {
        const currentServerId = this.serverId || window.localStorage.getItem('selectedServer');
        if (!currentServerId) {
            this._error = "Server ID not provided.";
            this._properties = [];
            return;
        }

        this._isLoading = true;
        this._error = null;
        try {
            const url = urlbase+`/api/servers/${currentServerId}/server.properties`;
            console.log("url", url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            let propertiesData = result.data;

            if (typeof result.data === "string") {
                propertiesData = result.data.split('\n').reduce((acc: Record<string, string>, line: string) => {
                    if (!line.startsWith('#') && line.includes('=')) {
                        const [key, value] = line.split('=');
                        acc[key.trim()] = value.trim();
                    }
                    return acc;
                }, {});
            }
            
            const loadedProps = [];
            for (const [key, value] of Object.entries(propertiesData)) {
                let originalType = this._getValueType(value);
                let displayValue = value;

                if (originalType === "null") {
                    displayValue = "";
                }
                if (key === "server-ip" && originalType !== "string") { // Override for server-ip
                    originalType = "string";
                }

                loadedProps.push({ key, value, originalType, displayValue });
            }
            this._properties = loadedProps;

        } catch (error) {
            console.error('Error loading properties:', error);
            this._error = `Error loading properties: ${error instanceof Error ? error.message : String(error)}`;
            this._properties = [];
        } finally {
            this._isLoading = false;
        }
    }

    private _renderInput(prop: { key: string; originalType: string; displayValue: any }) {
        // Note: Lit handles boolean attributes correctly. .checked=${booleanValue}
        switch (prop.originalType) {
            case "boolean":
                return html`
                    <label class="switch">
                        <input 
                            type="checkbox" 
                            .checked=${prop.displayValue === true || String(prop.displayValue).toLowerCase() === 'true'}
                            data-key=${prop.key}
                            data-type=${prop.originalType}
                        >
                        <span class="slider round"></span>
                    </label>`;
            case "number":
                return html`
                    <input 
                        type="number" 
                        .value=${String(prop.displayValue)} 
                        data-key=${prop.key}
                        data-type=${prop.originalType}
                    >`;
            case "null": // Treat null initially as text input, can be empty
                return html`
                    <input 
                        type="text" 
                        .value=${prop.displayValue} 
                        placeholder="(null)"
                        data-key=${prop.key}
                        data-type=${prop.originalType}
                    >`;
            default: // string
                return html`
                    <input 
                        type="text" 
                        .value=${String(prop.displayValue)} 
                        data-key=${prop.key}
                        data-type=${prop.originalType}
                    >`;
        }
    }

    private _getPropertiesToSave() {
        const saveResult: Record<string, any> = {};
        const inputs = this.shadowRoot?.querySelectorAll('input[data-key]');
        
        inputs?.forEach(inputElement => {
            const input = inputElement as HTMLInputElement;
            const key = input.dataset.key!;
            const originalType = input.dataset.type!;
            let rawValue: string | boolean;

            if (input.type === "checkbox") {
                rawValue = input.checked;
            } else {
                rawValue = input.value;
            }
            saveResult[key] = this._parseValueByType(rawValue, originalType);
        });
        return saveResult;
    }

    private async _emitPropertiesChange() {
        const propertiesToSave = this._getPropertiesToSave();
        const currentServerId = this.serverId || window.localStorage.getItem('selectedServer');

        if (Object.keys(propertiesToSave).length === 0 && !this._properties.length) {
            console.log("No properties to save or loaded.");
            return;
        }

        this.dispatchEvent(new CustomEvent('save-success', {
            bubbles: true,
            composed: true,
            detail: {
                server: currentServerId,
                result: propertiesToSave
            },
        }));
        console.log("save-success emitted with:", { server: currentServerId, result: propertiesToSave });
        try {
            // server:string = name
            // result:{...[key:string]:[value:string]}
            const content = Object.entries(propertiesToSave).map(([key, value]) => `${key}=${value}`).join('\n');
            const result = await filemanagerapi.writeFile({
                directoryname: currentServerId,
                filename: "server.properties",
                content
            });
            console.log("result", result);
        } catch (error) {
            console.error("Error saving properties:", error);
        }
    }

    render() {
        if (this._isLoading) {
            return html`<div class="loading-message">Loading properties...</div>`;
        }

        if (this._error) {
            return html`<div class="error-message">${this._error}</div>`;
        }

        if (!this._properties.length && !this.serverId && !window.localStorage.getItem('selectedServer')) {
             return html`<p>Please provide a 'server-id' attribute or set 'selectedServer' in localStorage.</p>`;
        }
        
        if (!this._properties.length) {
             return html`<p>No properties found or loaded for server: ${this.serverId || window.localStorage.getItem('selectedServer')}.</p>`;
        }

        return html`
            <table>
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._properties.map(prop => html`
                        <tr>
                            <td>${prop.key}</td>
                            <td>${this._renderInput(prop)}</td>
                        </tr>
                    `)}
                </tbody>
            </table>
            <button 
                id="save-btn" 
                class="primary-btn" 
                @click=${this._emitPropertiesChange}
                ?hidden=${this._properties.length === 0}
            >
                Save Properties
            </button>
        `;
    }
}