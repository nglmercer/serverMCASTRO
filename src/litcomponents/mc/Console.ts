import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

interface StyleMap {
    [key: string]: string;
}

interface ParsedAnsiSegment {
    text: string;
    bold?: boolean;
    foreground?: string;
}

@customElement('game-console')
export class GameConsole extends LitElement {
    private obfuscators: Record<number, number[]> = {};
    private alreadyParsed: HTMLPreElement[] = [];
    private currId: number = 0;
    private isItFirstLogRefresh: boolean = false;
    private previousConsoleUpdateLength: number = 0;

    private styleMap: StyleMap = {
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
        const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

        const replaceRand = (str: string, i: number): string => {
            const randChar = String.fromCharCode(randInt(64, 95));
            return str.substring(0, i) + randChar + str.substring(i + 1);
        };
    
        const initMagic = (el: HTMLElement, strToObfuscate: string) => {
            let i = 0;
            const originalHTML = strToObfuscate || el.innerHTML;
            const strLen = originalHTML.replace(/<[^>]*>?/gm, '').length;
    
            if (!strLen) return;
    
            if (!this.obfuscators[this.currId]) {
                this.obfuscators[this.currId] = [];
            }
    
            const intervalId = window.setInterval(() => {
                if (i >= strLen) i = 0;
                let currentText = el.textContent || "";
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
                    initMagic(span, span.textContent!);
                }
            }
        } else {
            elem.textContent = text;
            initMagic(elem, text);
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

    private mineParse(text: string): { parsed: HTMLPreElement; raw: string } {
        const finalPre = document.createElement('pre');
        const codes = text.match(/§./g) || [];
        const indexes: number[] = [];
        let activeCodes: string[] = [];
    
        if (!this.obfuscators[this.currId]) {
            this.obfuscators[this.currId] = [];
        }
    
        let processedText = text.replace(/\n|\\n/g, '<br>');
    
        let tempText = processedText;
        codes.forEach(code => {
            const index = tempText.indexOf(code);
            if (index !== -1) {
                indexes.push(index);
                tempText = tempText.substring(0, index) + '\x00\x00' + tempText.substring(index + 2);
            }
        });
    
        const textBeforeFirstCode = processedText.substring(0, indexes.length > 0 ? indexes[0] : processedText.length);
        if (textBeforeFirstCode) {
            finalPre.appendChild(this.applyCode(textBeforeFirstCode, []));
        }
    
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            
            if (code === '§r') {
                activeCodes = [];
            } else {
                if (!activeCodes.includes(code)) {
                    activeCodes.push(code);
                }
                if (Object.keys(this.styleMap).filter(k => k.length === 2 && k !== '§k' && k !== '§l' && k !== '§m' && k !== '§n' && k !== '§o').includes(code)) {
                    activeCodes = activeCodes.filter(c => {
                        return !(Object.keys(this.styleMap).filter(k => k.length === 2 && k !== '§k' && k !== '§l' && k !== '§m' && k !== '§n' && k !== '§o').includes(c) && c !== code);
                    });
                }
            }
    
            const startIndex = indexes[i] + 2;
            const endIndex = (i + 1 < indexes.length) ? indexes[i + 1] : processedText.length;
            const segment = processedText.substring(startIndex, endIndex);
    
            if (segment) {
                finalPre.appendChild(this.applyCode(segment, [...activeCodes]));
            }
        }
    
        this.alreadyParsed.push(finalPre);
        this.currId++;
    
        return {
            parsed: finalPre,
            raw: finalPre.innerHTML,
        };
    }

    public clearObfuscators(id?: number): void {
        if (id !== undefined && this.obfuscators[id]) {
            this.obfuscators[id].forEach(interval => clearInterval(interval));
            delete this.obfuscators[id];
        } else if (id === undefined) {
            Object.keys(this.obfuscators).forEach(key => {
                const numericKey = parseInt(key, 10);
                this.obfuscators[numericKey].forEach(interval => clearInterval(interval));
            });
            this.obfuscators = {};
            this.alreadyParsed = [];
        }
    }
    
    public refreshlogs(serverLog: string): void {
        if (!this.consoleTextElem) {
            this.updateComplete.then(() => this.refreshlogs(serverLog));
            return;
        }

        if (serverLog.length === this.previousConsoleUpdateLength && this.isItFirstLogRefresh) {
            return;
        }

        this.previousConsoleUpdateLength = serverLog.length;
        const parsedServerLogLines = serverLog.split(/\r?\n/);
        
        const fragment = document.createDocumentFragment();

        parsedServerLogLines.forEach(line => {
            if (line.trim() === '') {
                const br = document.createElement('br');
                fragment.appendChild(br);
                return;
            }
            const parsedLine = this.mineParse(line);
            
            while (parsedLine.parsed.firstChild) {
                fragment.appendChild(parsedLine.parsed.firstChild);
            }
            fragment.appendChild(document.createElement('br'));
        });
        
        this.consoleTextElem.appendChild(fragment);

        requestAnimationFrame(() => {
            if (!this.consoleTextElem) return;
            const scrollHeight = this.consoleTextElem.scrollHeight;
            const clientHeight = this.consoleTextElem.clientHeight;
            
            const pixelsToBottom = scrollHeight - clientHeight - this.consoleTextElem.scrollTop;

            if (!this.isItFirstLogRefresh) {
                this.isItFirstLogRefresh = true;
                this.consoleTextElem.scrollTop = scrollHeight - clientHeight;
            } else if (pixelsToBottom < 200) {
                this.consoleTextElem.scrollTop = scrollHeight - clientHeight;
            }
        });
    }

    private parseANSI(text: string): ParsedAnsiSegment[] {
        return [{ text, bold: false }];
    }

    private linkify(text: string): string {
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])|(\bwww\.[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
        return text.replace(urlRegex, (url) => {
            let Href = url;
            if (!url.startsWith('http') && !url.startsWith('ftp') && !url.startsWith('file')) {
                Href = 'http://' + url;
            }
            return `<a href="${Href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.clearObfuscators();
    }
}