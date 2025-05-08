import { CircleProgress } from './mc/circle-progress.js';
import { ServerItem } from './mc/serveritem.js';
import { GameConsole } from './mc/Console.js';
import { ActionButtonsLit } from './mc/barstatus.js';
declare global {
    interface HTMLElementTagNameMap {
        'circle-progress': CircleProgress;
        'server-item': ServerItem;
        'game-console': GameConsole;
        'action-buttons-lit': ActionButtonsLit;

    }
}