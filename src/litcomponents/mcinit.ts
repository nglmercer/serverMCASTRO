import { CircleProgress } from './mc/circle-progress.js';
import { ServerItem } from './mc/serveritem.js';
declare global {
    interface HTMLElementTagNameMap {
        'circle-progress': CircleProgress;
        'server-item': ServerItem;
    }
}