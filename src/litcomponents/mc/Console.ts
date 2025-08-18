import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import {AnsiUp} from 'ansi_up'; // Importar ansi_up

@customElement('game-console')
export class GameConsole extends LitElement {
    private obfuscators: Record<number, number[]> = {};
    private currId: number = 0;
    private lastProcessedText: string = '';
    private ansiUp = new AnsiUp(); // Instanciar ansi_up

    private styleMap: Record<string, string> = {
        '§0': 'color:#000000',
        '§1': 'color:#0000AA',
        '§2': 'color:#00AA00',
        '§3': 'color:#00AAAA',
        '§4': 'color:#AA0000',
        '§5': 'color:#AA00AA',
        '§6': 'color:#FFAA00', // Amarillo Minecraft
        '§7': 'color:#AAAAAA',
        '§8': 'color:#555555',
        '§9': 'color:#5555FF',
        '§a': 'color:#55FF55',
        '§b': 'color:#55FFFF',
        '§c': 'color:#FF5555',
        '§d': 'color:#FF55FF',
        '§e': 'color:#FFFF55', // Amarillo brillante Minecraft
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
            color: var(--text-primary, #eee); /* Color base del texto */
            padding: 8px;
            box-sizing: border-box;
            scroll-behavior: smooth;
            white-space: pre-wrap; /* Importante para que <pre> y saltos de línea funcionen bien */
            word-break: break-word; /* Para que líneas largas no rompan el layout */
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

        /* Estilos adicionales si ansi_up usa clases (opcional) */
        .ansi-black-fg { color: #000000; }
        .ansi-red-fg { color: #AA0000; }
        .ansi-green-fg { color: #00AA00; }
        .ansi-yellow-fg { color: #FFAA00; } /* O #AAAA00 si es amarillo oscuro */
        .ansi-blue-fg { color: #0000AA; }
        .ansi-magenta-fg { color: #AA00AA; }
        .ansi-cyan-fg { color: #00AAAA; }
        .ansi-white-fg { color: #AAAAAA; }
        /* ... y para colores brillantes y fondos si es necesario */
        .ansi-bright-yellow-fg { color: #FFFF55; } /* Ajusta este color según el amarillo de tu log */
    `;

    constructor() {
        super();
        // Configurar ansi_up para usar clases CSS en lugar de estilos inline (opcional pero recomendado)
        // this.ansiUp.use_classes = true; 
        // Si usas clases, asegúrate de definirlas en `static styles`
        // Por simplicidad, dejaremos que use estilos inline por defecto.
    }

    render() {
        return html`
            <div class="console-layout">
                <div class="console" id="console-text"></div>
            </div>
        `;
    }

    private obfuscate(elem: HTMLElement, text: string): void {
        const randChar = () => String.fromCharCode(Math.floor(Math.random() * (126 - 33 + 1)) + 33); // Caracteres ASCII imprimibles
        
        const replaceRand = (currentHtml: string): string => {
            // Reemplaza caracteres solo en nodos de texto, preservando HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = currentHtml;
            
            function obfuscateNode(node: Node) {
                if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
                    let textVal = node.nodeValue;
                    for (let k = 0; k < textVal.length; k++) {
                        if (textVal[k] !== ' ' && Math.random() < 0.7) { // No ofuscar espacios, y con cierta probabilidad
                           textVal = textVal.substring(0, k) + randChar() + textVal.substring(k + 1);
                        }
                    }
                    node.nodeValue = textVal;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    node.childNodes.forEach(obfuscateNode);
                }
            }
            obfuscateNode(tempDiv);
            return tempDiv.innerHTML;
        };
    
        const startObfuscation = (el: HTMLElement, originalHtml: string) => {
            // Contar solo caracteres de texto, no etiquetas HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = originalHtml;
            const textContentLength = tempDiv.textContent?.length || 0;
            if (!textContentLength) return;
            
            if (!this.obfuscators[this.currId]) {
                this.obfuscators[this.currId] = [];
            }
            
            const intervalId = window.setInterval(() => {
                el.innerHTML = replaceRand(el.innerHTML); // Re-obfuscar el HTML actual
            }, 70); // Aumentado ligeramente para mejor rendimiento
            
            this.obfuscators[this.currId].push(intervalId);
        };
    
        // Aplicar texto inicial (que puede ser HTML) y luego iniciar la ofuscación
        elem.innerHTML = text; // El texto ya puede ser HTML
        startObfuscation(elem, text);
    }
    
    private applyCode(textSegment: string, codes: string[]): HTMLSpanElement {
        const elem = document.createElement('span');
        let obfuscated = false;
        // textSegment ya podría ser HTML (de ansi_up)
        // No quitar \x00 aquí, se hace antes en parseLine
    
        codes.forEach(code => {
            if (this.styleMap[code]) {
                elem.style.cssText += this.styleMap[code] + ';';
            }
            if (code === '§k') { // Obfuscate code
                // El texto que se pasa a obfuscate puede contener HTML de ansi_up
                this.obfuscate(elem, textSegment);
                obfuscated = true;
            }
        });
    
        if (!obfuscated) {
            elem.innerHTML = textSegment; // Usar innerHTML porque textSegment puede ser HTML
        }
    
        return elem;
    }

    private parseLine(lineAsHtmlFromAnsi: string): DocumentFragment {
        const fragment = document.createDocumentFragment();
        // lineAsHtmlFromAnsi ya es HTML procesado por ansi_up
        // Los códigos § deben aplicarse SOBRE esta estructura HTML.

        // El reemplazo de \x00 debe hacerse sobre el texto original, no sobre el HTML.
        // Esta función ahora es más compleja porque debe operar sobre una estructura HTML.

        // Estrategia:
        // 1. Dividir el HTML por los códigos §.
        // 2. Para cada segmento, aplicarle los estilos § activos.
        //    Un segmento puede ser texto plano o contener <span>s de ansi_up.

        let activeSCodes: string[] = [];
        let remainingHtml = lineAsHtmlFromAnsi;
        
        // Regex para encontrar §. o el final del string
        const sectionRegex = /(§[0-9a-fk-or])|([^§]+)/g;
        let match;

        while ((match = sectionRegex.exec(remainingHtml)) !== null) {
            if (match[1]) { // Es un código §
                const code = match[1];
                if (code === '§r') { // Reset
                    activeSCodes = [];
                } else if (this.styleMap[code]) { // Código de estilo (color, formato)
                    // Manejar códigos de color (solo uno activo)
                    const isColorCode = !['§k', '§l', '§m', '§n', '§o', '§r'].includes(code);
                    if (isColorCode) {
                        activeSCodes = activeSCodes.filter(c => ['§k', '§l', '§m', '§n', '§o'].includes(c)); // Quitar otros colores
                    }
                     // Quitar códigos de formato conflictivos si se aplica uno nuevo del mismo tipo
                    if (code === '§l' || code === '§m' || code === '§n' || code === '§o') {
                        activeSCodes = activeSCodes.filter(c => c !== code);
                    }
                    if (!activeSCodes.includes(code)) {
                        activeSCodes.push(code);
                    }
                } else if (code === '§k') { // Obfuscation
                     if (!activeSCodes.includes(code)) {
                        activeSCodes.push(code);
                    }
                }
            } else if (match[2]) { // Es un segmento de texto/HTML
                let segmentHtml = match[2];
                // Quitar los caracteres nulos que usamos como placeholders si aún estuvieran (no deberían con este nuevo enfoque)
                segmentHtml = segmentHtml.replace(/\x00/g, ''); 

                if (segmentHtml) {
                    const styledSpan = this.applyCode(segmentHtml, [...activeSCodes]);
                    fragment.appendChild(styledSpan);
                }
            }
        }
        
        // Si no se encontraron códigos § en toda la línea (o después del último código §)
        if (fragment.childNodes.length === 0 && remainingHtml.replace(/\x00/g, '')) {
            const elem = document.createElement('span');
            elem.innerHTML = remainingHtml.replace(/\x00/g, '');
            fragment.appendChild(elem);
        }

        this.currId++; // Incrementar currId por cada línea procesada
        return fragment;
    }


    public clearObfuscators(id?: number): void {
        if (id !== undefined && this.obfuscators[id]) {
            this.obfuscators[id].forEach(interval => clearInterval(interval));
            delete this.obfuscators[id];
        } else {
            Object.keys(this.obfuscators).forEach(key => {
                const numericKey = parseInt(key, 10);
                if (this.obfuscators[numericKey]) {
                    this.obfuscators[numericKey].forEach(interval => clearInterval(interval));
                }
            });
            this.obfuscators = {};
        }
        // Reset currId cuando se limpia todo, para que los IDs de ofuscación no crezcan indefinidamente
        // si la consola se limpia y se rellena muchas veces sin recargar la página.
        if (id === undefined) {
            this.currId = 0; 
        }
    }
    
    public refreshlogs(serverLog: string = ''): void {
        if (!this.consoleTextElem) {
            this.updateComplete.then(() => this.refreshlogs(serverLog));
            return;
        }

        if (serverLog === this.lastProcessedText) {
            return;
        }
        
        this.lastProcessedText = serverLog;
        
        this.clearObfuscators(); // Limpia todos los ofuscadores antes de redibujar
        this.consoleTextElem.innerHTML = ''; // Limpiar contenido existente
        
        const lines = serverLog.split(/\r?\n/);
        const fragment = document.createDocumentFragment();
        
        lines.forEach(rawLine => {
            // Primero, convertir ANSI a HTML
            // Importante: escapar HTML en la línea cruda ANTES de pasarla a ansi_up
            // para evitar XSS si el log contiene HTML malicioso.
            // Sin embargo, los logs de Minecraft no suelen tener HTML, sino caracteres literales < >.
            // ansi_up por defecto escapa < > &, así que es seguro.
            const lineHtmlFromAnsi = this.ansiUp.ansi_to_html(rawLine);

            if (rawLine.trim() === '') { // Usar rawLine para la comprobación de vacío
                const br = document.createElement('br');
                fragment.appendChild(br);
            } else {
                const parsedLineFragment = this.parseLine(lineHtmlFromAnsi); // parseLine ahora recibe HTML
                const lineContainer = document.createElement('div'); // Usar un div por línea para mejor estructura
                lineContainer.appendChild(parsedLineFragment);
                fragment.appendChild(lineContainer);
            }
        });
        
        this.consoleTextElem.appendChild(fragment);
        
        requestAnimationFrame(() => {
            if (!this.consoleTextElem) return;
            const scrollHeight = this.consoleTextElem.scrollHeight;
            const clientHeight = this.consoleTextElem.clientHeight;
            const scrollTop = this.consoleTextElem.scrollTop;
            
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