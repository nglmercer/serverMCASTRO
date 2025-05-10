import { CircleProgress } from './mc/circle-progress.js';
import { ServerItem } from './mc/serveritem.js';
import { GameConsole } from './mc/Console.js';
import { ActionButtonsLit } from './mc/barstatus.js';
import { FileExplorer } from './mc/files.js';
import { ServerPropertiesLitElement } from './mc/serverproperties.js';
import { SystemMonitorLit } from './system.js';
declare global {
    interface HTMLElementTagNameMap {
        'circle-progress': CircleProgress;
        'server-item': ServerItem;
        'game-console': GameConsole;
        'action-buttons-lit': ActionButtonsLit;
        'file-explorer': FileExplorer;
        'server-properties': ServerPropertiesLitElement;
        'system-monitor-lit': SystemMonitorLit;
    }
}