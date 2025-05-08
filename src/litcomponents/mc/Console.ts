import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('game-console')
export class GameConsole extends LitElement {
    private obfuscators: Record<number, number[]> = {};
    private currId: number = 0;
    private lastProcessedText: string = '';

    private styleMap: Record<string, string> = {
        '§0': 'color:#000000',
        '§1': 'color:#0000AA',
        '§2': 'color:#00AA00',
        '§3': 'color:#00AAAA',
        '§4': 'color:#AA0000',
        '§5': 'color:#AA00AA',
        '§6': 'color:#FFAA00',
        '§7': 'color:#AAAAAA',
        '§8': 'color:#555555',
        '§9': 'color:#5555FF',
        '§a': 'color:#55FF55',
        '§b': 'color:#55FFFF',
        '§c': 'color:#FF5555',
        '§d': 'color:#FF55FF',
        '§e': 'color:#FFFF55',
        '§f': 'color:#FFFFFF',
        '§l': 'font-weight:bold',
        '§m': 'text-decoration:line-through',
        '§n': 'text-decoration:underline',
        '§o': 'font-style:italic',
    };

    @query('#console-text')
    private consoleTextElem!: HTMLDivElement;

    static styles = css`
        .console-layout {
            width: 100%;
            height: 100%;
            min-height: 300px;
            background: var(--bg-darker, #222);
            border-radius: 8px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }

        .console {
            flex-grow: 1;
            width: 100%;
            max-height: 500px;
            overflow-y: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-primary, #eee);
            padding: 8px;
            box-sizing: border-box;
            scroll-behavior: smooth;
        }

        .console::-webkit-scrollbar {
            width: 8px;
        }

        .console::-webkit-scrollbar-track {
            background: var(--bg-darker, #222);
            border-radius: 4px;
        }

        .console::-webkit-scrollbar-thumb {
            background: var(--bg-dark-accent, #444);
            border-radius: 4px;
        }

        .console::-webkit-scrollbar-thumb:hover {
            background: var(--bg-dark-accent-lighter, #666);
        }
    `;

    render() {
        return html`
            <div class="console-layout">
                <div class="console" id="console-text"></div>
            </div>
        `;
    }

    private obfuscate(elem: HTMLElement, text: string): void {
        const randChar = () => String.fromCharCode(Math.floor(Math.random() * 32) + 64);
        
        const replaceRand = (str: string, i: number): string => {
            return str.substring(0, i) + randChar() + str.substring(i + 1);
        };
    
        const startObfuscation = (el: HTMLElement, originalText: string) => {
            const strLen = originalText.replace(/<[^>]*>?/gm, '').length;
            if (!strLen) return;
            
            if (!this.obfuscators[this.currId]) {
                this.obfuscators[this.currId] = [];
            }
            
            let i = 0;
            const intervalId = window.setInterval(() => {
                if (i >= strLen) i = 0;
                const currentText = el.textContent || "";
                if (currentText.length > i) {
                    el.textContent = replaceRand(currentText, i);
                }
                i++;
            }, 50);
            
            this.obfuscators[this.currId].push(intervalId);
        };
    
        if (text.includes('<br>')) {
            elem.innerHTML = text;
            const walker = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null);
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue && node.nodeValue.trim() !== '') {
                    const span = document.createElement('span');
                    span.textContent = node.nodeValue;
                    (node.parentNode as HTMLElement).replaceChild(span, node);
                    startObfuscation(span, span.textContent!);
                }
            }
        } else {
            elem.textContent = text;
            startObfuscation(elem, text);
        }
    }
    
    private applyCode(text: string, codes: string[]): HTMLSpanElement {
        const elem = document.createElement('span');
        let obfuscated = false;
        const cleanText = text.replace(/\x00/g, '');
    
        codes.forEach(code => {
            if (this.styleMap[code]) {
                elem.style.cssText += this.styleMap[code] + ';';
            }
            if (code === '§k') {
                this.obfuscate(elem, cleanText);
                obfuscated = true;
            }
        });
    
        if (!obfuscated) {
            elem.innerHTML = cleanText;
        }
    
        return elem;
    }

    private parseLine(text: string): HTMLPreElement {
        const pre = document.createElement('pre');
        const codes = text.match(/§./g) || [];
        const indexes: number[] = [];
        let activeCodes: string[] = [];
    
        if (!this.obfuscators[this.currId]) {
            this.obfuscators[this.currId] = [];
        }
    
        let processedText = text.replace(/\n|\\n/g, '<br>');
    
        // Find all code positions
        let tempText = processedText;
        codes.forEach(code => {
            const index = tempText.indexOf(code);
            if (index !== -1) {
                indexes.push(index);
                tempText = tempText.substring(0, index) + '\x00\x00' + tempText.substring(index + 2);
            }
        });
    
        // Add text before first code
        const textBeforeFirstCode = processedText.substring(0, indexes.length > 0 ? indexes[0] : processedText.length);
        if (textBeforeFirstCode) {
            pre.appendChild(this.applyCode(textBeforeFirstCode, []));
        }
    
        // Process each code segment
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            
            if (code === '§r') {
                activeCodes = [];
            } else {
                if (!activeCodes.includes(code)) {
                    activeCodes.push(code);
                }
                
                // Handle color codes (only one color at a time)
                const isColorCode = Object.keys(this.styleMap).some(k => 
                    k === code && k.length === 2 && !['§k', '§l', '§m', '§n', '§o'].includes(k)
                );
                
                if (isColorCode) {
                    activeCodes = activeCodes.filter(c => {
                        const isOtherColorCode = Object.keys(this.styleMap).some(k => 
                            k === c && k.length === 2 && !['§k', '§l', '§m', '§n', '§o'].includes(k)
                        );
                        return !(isOtherColorCode && c !== code);
                    });
                }
            }
    
            const startIndex = indexes[i] + 2;
            const endIndex = (i + 1 < indexes.length) ? indexes[i + 1] : processedText.length;
            const segment = processedText.substring(startIndex, endIndex);
    
            if (segment) {
                pre.appendChild(this.applyCode(segment, [...activeCodes]));
            }
        }
    
        this.currId++;
        return pre;
    }

    public clearObfuscators(id?: number): void {
        if (id !== undefined && this.obfuscators[id]) {
            this.obfuscators[id].forEach(interval => clearInterval(interval));
            delete this.obfuscators[id];
        } else {
            Object.keys(this.obfuscators).forEach(key => {
                const numericKey = parseInt(key, 10);
                this.obfuscators[numericKey].forEach(interval => clearInterval(interval));
            });
            this.obfuscators = {};
        }
    }
    
    public refreshlogs(serverLog: string): void {
        if (!this.consoleTextElem) {
            this.updateComplete.then(() => this.refreshlogs(serverLog));
            return;
        }

        // Evitar procesamiento duplicado si el texto no ha cambiado
        if (serverLog === this.lastProcessedText) {
            return;
        }
        
        // Guardar el texto actual para comparar en futuras llamadas
        this.lastProcessedText = serverLog;
        
        // Limpiar el contenido existente
        this.clearObfuscators();
        this.consoleTextElem.innerHTML = '';
        
        // Procesar todas las líneas
        const lines = serverLog.split(/\r?\n/);
        const fragment = document.createDocumentFragment();
        
        lines.forEach(line => {
            if (line.trim() === '') {
                fragment.appendChild(document.createElement('br'));
            } else {
                const parsedLine = this.parseLine(line);
                while (parsedLine.firstChild) {
                    fragment.appendChild(parsedLine.firstChild);
                }
                fragment.appendChild(document.createElement('br'));
            }
        });
        
        this.consoleTextElem.appendChild(fragment);
        
        // Desplazar al final si estamos cerca del final
        requestAnimationFrame(() => {
            if (!this.consoleTextElem) return;
            const scrollHeight = this.consoleTextElem.scrollHeight;
            const clientHeight = this.consoleTextElem.clientHeight;
            const scrollTop = this.consoleTextElem.scrollTop;
            
            // Si estamos a menos de 200px del fondo, seguir el scroll
            if (scrollHeight - clientHeight - scrollTop < 200) {
                this.consoleTextElem.scrollTop = scrollHeight;
            }
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.clearObfuscators();
    }
}